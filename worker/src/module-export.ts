// `/j/<id>.js`: a frame's code served as an importable ES module, reduced to
// its functions (issue #134).
//
// A frame's source is written to RUN: its top level renders into `root`, adds
// listeners, fetches, sets outputs. None of that may happen when another frame
// merely wants one of its functions, so the module served here keeps only what
// is inert to evaluate:
//
//  - function declarations (exported or not — unexported ones are the helpers
//    the exported ones call), and `const f = () => …` / `function () {…}`;
//  - constants initialised with a plain literal (`const N = 3`, `[1, 2]`,
//    `{ a: "b" }`), which functions commonly read and which cannot run code;
//  - imports that bind names (the functions may use them), and re-exports;
//  - `export { … }` / `export default` of any of the above.
//
// Everything else — expression statements, classes, `let x = compute()`,
// bare `import "x"` side-effect imports, top-level `await` — is dropped. A
// function that reads a dropped binding (or the runtime's `root`) fails when
// called, not when imported: that is the trade the issue asks for.
//
// Pure (no I/O) so it can be unit-tested; the route lives in server.ts.

import { parse } from "acorn";
import type {
  Expression,
  ModuleDeclaration,
  Node,
  Pattern,
  Program,
  Statement,
  VariableDeclaration,
  VariableDeclarator,
} from "acorn";

export class ModuleExportError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ModuleExportError";
  }
}

export interface ModuleExport {
  /** The ES module source. */
  code: string;
  /** Exported names that were dropped because they are not functions. */
  skipped: string[];
}

const isFunctionLike = (node: Node | null | undefined): boolean =>
  node?.type === "ArrowFunctionExpression" ||
  node?.type === "FunctionExpression";

/** A literal value that cannot run code when evaluated. */
const isPureLiteral = (node: Node | null | undefined): boolean => {
  if (!node) return false;
  switch (node.type) {
    case "Literal":
      return true;
    case "TemplateLiteral":
      return (node as Extract<Expression, { type: "TemplateLiteral" }>)
        .expressions.length === 0;
    case "UnaryExpression": {
      const u = node as Extract<Expression, { type: "UnaryExpression" }>;
      return ["-", "+", "!"].includes(u.operator) && isPureLiteral(u.argument);
    }
    case "ArrayExpression":
      return (node as Extract<Expression, { type: "ArrayExpression" }>)
        .elements.every((e) => e === null || isPureLiteral(e));
    case "ObjectExpression":
      return (node as Extract<Expression, { type: "ObjectExpression" }>)
        .properties.every((p) =>
          p.type === "Property" && !p.computed && p.kind === "init" &&
          (isPureLiteral(p.value) || isFunctionLike(p.value))
        );
    default:
      return false;
  }
};

const isInertDeclarator = (d: VariableDeclarator): boolean =>
  d.id.type === "Identifier" &&
  (isFunctionLike(d.init) || isPureLiteral(d.init));

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

/**
 * Reduces a frame's source to an ES module of its functions (see the file
 * comment for exactly what survives). Throws ModuleExportError when the source
 * does not parse as a module.
 */
export function extractModule(source: string): ModuleExport {
  let program: Program;
  try {
    program = parse(source, {
      ecmaVersion: "latest",
      sourceType: "module",
      allowHashBang: true,
      allowAwaitOutsideFunction: true,
    });
  } catch (error) {
    throw new ModuleExportError(
      `The frame's code does not parse as a JavaScript module: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }

  const text = (node: Node) => source.slice(node.start, node.end);
  // Names bound by what is kept: what an `export { … }` may still name.
  const kept = new Set<string>();
  const skipped: string[] = [];
  const out: string[] = [];

  const keepVariables = (decl: VariableDeclaration, prefix: string) => {
    const inert = decl.declarations.filter(isInertDeclarator);
    const dropped = decl.declarations.filter((d) => !isInertDeclarator(d));
    if (prefix) skipped.push(...dropped.flatMap((d) => patternNames(d.id)));
    if (inert.length === 0) return;
    out.push(`${prefix}${decl.kind} ${inert.map(text).join(", ")};`);
  };

  // Every name that will be kept, collected up front: `export { f }` may come
  // before `function f` or `const f = …` in the source.
  for (const node of program.body) {
    const decl = node.type === "ExportNamedDeclaration" ||
        node.type === "ExportDefaultDeclaration"
      ? node.declaration
      : node;
    if (decl?.type === "FunctionDeclaration" && decl.id) kept.add(decl.id.name);
    if (decl?.type === "VariableDeclaration") {
      for (const d of decl.declarations.filter(isInertDeclarator)) {
        kept.add(nameOf(d.id as { type: string }));
      }
    }
    if (node.type === "ImportDeclaration") {
      for (const s of node.specifiers) kept.add(s.local.name);
    }
  }

  for (const node of program.body as (Statement | ModuleDeclaration)[]) {
    switch (node.type) {
      case "FunctionDeclaration":
        out.push(text(node));
        break;
      case "VariableDeclaration":
        keepVariables(node, "");
        break;
      case "ImportDeclaration":
        // A bare `import "x"` exists only for its side effects.
        if (node.specifiers.length > 0) out.push(text(node));
        break;
      case "ExportAllDeclaration":
        out.push(text(node));
        break;
      case "ExportNamedDeclaration": {
        if (node.source) {
          out.push(text(node)); // re-export: nothing of ours runs
        } else if (node.declaration?.type === "FunctionDeclaration") {
          out.push(text(node));
        } else if (node.declaration?.type === "VariableDeclaration") {
          keepVariables(node.declaration, "export ");
        } else if (node.declaration?.type === "ClassDeclaration") {
          skipped.push(node.declaration.id.name);
        } else {
          const specs = node.specifiers.filter((s) => {
            const ok = kept.has(nameOf(s.local));
            if (!ok) skipped.push(nameOf(s.exported));
            return ok;
          });
          if (specs.length > 0) {
            out.push(`export { ${specs.map(text).join(", ")} };`);
          }
        }
        break;
      }
      case "ExportDefaultDeclaration": {
        const d = node.declaration;
        if (
          d.type === "FunctionDeclaration" || isFunctionLike(d) ||
          (d.type === "Identifier" && kept.has(d.name))
        ) {
          out.push(text(node));
        } else {
          skipped.push("default");
        }
        break;
      }
      default:
        // Expression statements, classes, control flow, blocks: dropped.
        break;
    }
  }

  return { code: out.join("\n\n") + "\n", skipped };
}
