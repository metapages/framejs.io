// `/j/<id>.esm.js`: a frame's code served as an importable ES module, reduced to
// its functions (issue #134).
//
// A frame's source is written to RUN: its top level renders into `root`, adds
// listeners, fetches, sets outputs. None of that may happen when another frame
// merely wants one of its functions, so the module served here keeps only what
// is inert to evaluate AND has the same value it has in the running frame:
//
//  - function declarations (exported or not — unexported ones are the helpers
//    the exported ones call), and `const f = () => …` / `function () {…}`;
//  - `const` primitives (`const N = 3`, `const UNIT = "px"`), which functions
//    commonly read and which no top-level code can change;
//  - imports of names that kept code uses, and re-exports;
//  - `export { … }` / `export default` of any of the above.
//
// Everything else is dropped: expression statements, classes, `let`/`var`,
// `const` arrays/objects, `const x = compute()`, top-level `await`, imports
// nothing kept uses (and so bare `import "x"`). `let`/`var` and `const`
// objects are dropped, not kept with their initial value, because top-level
// code (which is dropped) may change them: kept, a function would silently
// read a value the frame never had. So is a function that top-level code
// reassigns. A function that reads anything dropped (or the runtime's `root`)
// throws a ReferenceError when CALLED, not when imported — the trade the issue
// asks for.
//
// Pure (no I/O) so it can be unit-tested; the route lives in frame-asset.ts.

import { parse } from "acorn";
import type {
  AssignmentExpression,
  Comment,
  ImportDeclaration,
  ModuleDeclaration,
  Node,
  Pattern,
  Program,
  Statement,
  TemplateLiteral,
  UnaryExpression,
  UpdateExpression,
  VariableDeclaration,
  VariableDeclarator,
} from "acorn";
import { full as walkFull } from "acorn-walk";

export class ModuleExportError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ModuleExportError";
  }
}

export interface ModuleExport {
  /** The ES module source. */
  code: string;
  /** Exported names that were dropped (not functions or const primitives). */
  skipped: string[];
}

const isFunctionLike = (node: Node | null | undefined): boolean =>
  node?.type === "ArrowFunctionExpression" ||
  node?.type === "FunctionExpression";

/** A primitive literal: immutable, and evaluating it cannot run code. */
const isPrimitiveLiteral = (node: Node | null | undefined): boolean => {
  if (!node) return false;
  switch (node.type) {
    case "Literal":
      return !("regex" in node && node.regex); // a RegExp is a mutable object
    case "TemplateLiteral":
      return (node as TemplateLiteral)
        .expressions.length === 0;
    case "UnaryExpression": {
      const u = node as UnaryExpression;
      return ["-", "+", "!"].includes(u.operator) &&
        isPrimitiveLiteral(u.argument);
    }
    default:
      return false;
  }
};

const isInertDeclarator = (kind: string, d: VariableDeclarator): boolean =>
  kind === "const" && d.id.type === "Identifier" &&
  (isFunctionLike(d.init) || isPrimitiveLiteral(d.init));

const patternNames = (p: Pattern): string[] => {
  switch (p.type) {
    case "Identifier":
      return [p.name];
    case "ObjectPattern":
      return p.properties.flatMap((prop) =>
        prop.type === "RestElement"
          ? patternNames(prop.argument)
          : patternNames(prop.value)
      );
    case "ArrayPattern":
      return p.elements.flatMap((e) => (e ? patternNames(e) : []));
    case "RestElement":
      return patternNames(p.argument);
    case "AssignmentPattern":
      return patternNames(p.left);
    default:
      return [];
  }
};

const nameOf = (n: { type: string; name?: string; value?: unknown }) =>
  n.type === "Identifier" ? n.name! : String(n.value);

/** Every identifier read or written anywhere under `node` (over-approximate). */
const identifiersIn = (node: Node, into: Set<string>) => {
  walkFull(node, (n) => {
    if (n.type === "Identifier") into.add((n as { name: string }).name);
  });
};

/** Names that are assignment / update targets anywhere under `node`. */
const reassignedIn = (node: Node, into: Set<string>) => {
  walkFull(node, (n) => {
    const target = n.type === "AssignmentExpression"
      ? (n as AssignmentExpression).left
      : n.type === "UpdateExpression"
      ? (n as UpdateExpression).argument
      : null;
    if (target) {
      for (const name of patternNames(target as Pattern)) into.add(name);
    }
  });
};

/**
 * Reduces a frame's source to an ES module of its functions (see the file
 * comment for exactly what survives). Throws ModuleExportError when the source
 * does not parse as a module.
 */
export function extractModule(source: string): ModuleExport {
  let program: Program;
  const comments: Comment[] = [];
  try {
    program = parse(source, {
      ecmaVersion: "latest",
      sourceType: "module",
      allowHashBang: true,
      allowAwaitOutsideFunction: true,
      onComment: comments,
    });
  } catch (error) {
    throw new ModuleExportError(
      `The frame's code does not parse as a JavaScript module: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }
  const body = program.body as (Statement | ModuleDeclaration)[];
  const text = (node: Node) => source.slice(node.start, node.end);
  const declOf = (node: Statement | ModuleDeclaration) =>
    node.type === "ExportNamedDeclaration" ||
      node.type === "ExportDefaultDeclaration"
      ? node.declaration
      : node;

  // Top-level statements that are dropped wholesale: whatever they reassign
  // must not be kept with its declared value.
  const isKeptStatement = (node: Statement | ModuleDeclaration) => {
    const decl = declOf(node);
    return node.type === "ImportDeclaration" ||
      node.type === "ExportAllDeclaration" ||
      node.type === "ExportNamedDeclaration" ||
      node.type === "ExportDefaultDeclaration" ||
      decl?.type === "FunctionDeclaration" ||
      decl?.type === "VariableDeclaration";
  };
  const reassigned = new Set<string>();
  for (const node of body) {
    if (!isKeptStatement(node)) reassignedIn(node, reassigned);
    // A dropped declarator's initialiser runs at top level too.
    const decl = declOf(node);
    if (decl?.type === "VariableDeclaration") {
      for (const d of decl.declarations) {
        if (!isInertDeclarator(decl.kind, d) && d.init) {
          reassignedIn(d.init, reassigned);
        }
      }
    }
  }

  // Every name that will be kept, collected up front: `export { f }` may come
  // before `function f` or `const f = …` in the source.
  const kept = new Set<string>();
  for (const node of body) {
    const decl = declOf(node);
    if (decl?.type === "FunctionDeclaration" && decl.id) kept.add(decl.id.name);
    if (decl?.type === "VariableDeclaration") {
      for (const d of decl.declarations) {
        if (isInertDeclarator(decl.kind, d)) kept.add(nameOf(d.id));
      }
    }
    if (node.type === "ImportDeclaration") {
      for (const s of node.specifiers) kept.add(s.local.name);
    }
  }
  for (const name of reassigned) kept.delete(name);
  const keeps = (name: string) => kept.has(name);

  // Comments directly above a statement (JSDoc), back to the previous one.
  const leadingComments = (index: number) => {
    const from = index === 0 ? 0 : body[index - 1].end;
    const to = body[index].start;
    // Not a trailing comment on the previous statement's own line.
    const first = comments.find((c) =>
      c.start >= from && c.end <= to &&
      (index === 0 || source.slice(from, c.start).includes("\n"))
    );
    return first ? source.slice(first.start, to) : "";
  };

  // Output pieces in source order. Imports are rendered last, once it is known
  // which of their names the rest uses.
  type Piece =
    | { code: string; refs: Node[] }
    | { imp: ImportDeclaration; lead: string };
  const pieces: Piece[] = [];
  const skipped: string[] = [];
  const emit = (index: number, code: string, refs: Node[]) =>
    pieces.push({ code: leadingComments(index) + code, refs });

  const keepVariables = (
    index: number,
    decl: VariableDeclaration,
    exported: boolean,
  ) => {
    const inert = decl.declarations.filter((d) =>
      isInertDeclarator(decl.kind, d) && keeps(nameOf(d.id))
    );
    if (exported) {
      skipped.push(
        ...decl.declarations.filter((d) => !inert.includes(d))
          .flatMap((d) => patternNames(d.id)),
      );
    }
    if (inert.length === 0) return;
    emit(
      index,
      `${exported ? "export " : ""}${decl.kind} ${inert.map(text).join(", ")};`,
      inert,
    );
  };

  body.forEach((node, index) => {
    switch (node.type) {
      case "FunctionDeclaration":
        if (keeps(node.id.name)) emit(index, text(node), [node]);
        break;
      case "VariableDeclaration":
        keepVariables(index, node, false);
        break;
      case "ImportDeclaration":
        pieces.push({ imp: node, lead: leadingComments(index) });
        break;
      case "ExportAllDeclaration":
        emit(index, text(node), []);
        break;
      case "ExportNamedDeclaration": {
        const d = node.declaration;
        if (node.source) {
          emit(index, text(node), []); // re-export: nothing of ours runs
        } else if (d?.type === "FunctionDeclaration") {
          if (keeps(d.id.name)) emit(index, text(node), [node]);
          else skipped.push(d.id.name);
        } else if (d?.type === "VariableDeclaration") {
          keepVariables(index, d, true);
        } else if (d?.type === "ClassDeclaration") {
          skipped.push(d.id.name);
        } else {
          const specs = node.specifiers.filter((s) => {
            const ok = keeps(nameOf(s.local));
            if (!ok) skipped.push(nameOf(s.exported));
            return ok;
          });
          if (specs.length > 0) {
            emit(
              index,
              `export { ${specs.map(text).join(", ")} };`,
              specs.map((s) => s.local),
            );
          }
        }
        break;
      }
      case "ExportDefaultDeclaration": {
        const d = node.declaration;
        const ok = d.type === "Identifier"
          ? keeps(d.name)
          : d.type === "FunctionDeclaration"
          ? !d.id || keeps(d.id.name)
          : isFunctionLike(d);
        if (ok) {
          emit(index, text(node), [node]);
        } else {
          skipped.push("default");
        }
        break;
      }
      default:
        // Expression statements, classes, control flow, blocks: dropped.
        break;
    }
  });

  // Names the kept code refers to. An import none of them use is dropped: it
  // may be a bare specifier the importer cannot resolve (the frame's import
  // map does not travel), and it would run that module for nothing.
  const used = new Set<string>();
  for (const p of pieces) {
    if ("refs" in p) { for (const r of p.refs) identifiersIn(r, used); }
  }

  const code = pieces.flatMap((p) => {
    if ("code" in p) return [p.code];
    const specs = p.imp.specifiers.filter((s) => used.has(s.local.name));
    if (specs.length === 0) return [];
    if (specs.length === p.imp.specifiers.length) {
      return [p.lead + text(p.imp)];
    }
    const head = specs.filter((s) => s.type !== "ImportSpecifier").map(text);
    const named = specs.filter((s) => s.type === "ImportSpecifier").map(text);
    const clause = [
      ...head,
      ...(named.length ? [`{ ${named.join(", ")} }`] : []),
    ]
      .join(", ");
    const attrs = p.imp.attributes?.length
      ? ` with { ${p.imp.attributes.map(text).join(", ")} }`
      : "";
    return [`${p.lead}import ${clause} from ${text(p.imp.source)}${attrs};`];
  });

  return { code: code.join("\n\n") + (code.length ? "\n" : ""), skipped };
}
