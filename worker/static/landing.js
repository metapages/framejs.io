// The framejs.io landing page — what you see at `/` when the url carries no
// code to run.
//
// It lives here, and NOT in worker/index.html, because index.html is the
// runtime: it is downloaded and parsed for every frame anyone ever opens, and
// none of those loads show the landing. This module is fetched only when there
// is nothing to run, so a frame pays nothing for it.
//
// Entry point: renderLanding(root). Loaded with a dynamic import from
// index.html — once by the early bootstrap (so the front page paints without
// waiting on the runtime module's CDN imports), and again by runJsFromUrl if
// the user clears their code; the module cache makes the second one free.

// The account app. index.html is served with window.__FRAMEJS_APP_ORIGIN
// injected (server.ts), which is what points the links at the local app in dev
// — this module is served as a plain static file and is never rewritten.
const APP_ORIGIN = globalThis.__FRAMEJS_APP_ORIGIN || "https://framejs.app";

const STYLE_ID = "landing-style";

const STYLE = `
#landing-content {
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  height: 100%;
  width: 100%;
  margin: 4px auto;
  padding: 0 4px;
  background-color: #f4f3ef;
  color: #111110;
  font-family: "Inter", system-ui, -apple-system, sans-serif;
  line-height: 1.6;
}

/* Header bar. The guide below it is a cross-origin page, so this is the one
   piece of the landing that framejs.io itself owns. Palette mirrors
   framejs.app (Offprint). */
.landing-app-bar {
  flex: none;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px 16px;
  padding: 12px 16px;
  border-bottom: 1px solid #e6e3db;
  background: #f4f3ef;
  color: #111110;
}
.landing-app-bar .lab-text {
  flex: 1 1 260px;
  font-size: 0.95rem;
  line-height: 1.4;
}
.landing-app-bar .lab-text strong {
  font-weight: 600;
}
.landing-app-bar .lab-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.landing-app-bar a,
.landing-app-bar button {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 14px;
  border-radius: 2px;
  border: 1px solid #465775;
  font-family: inherit;
  font-size: 0.9rem;
  font-weight: 600;
  line-height: 1.2;
  text-decoration: none;
  white-space: nowrap;
  cursor: pointer;
}
.landing-app-bar .lab-primary {
  background: #465775;
  color: #fff;
}
.landing-app-bar .lab-primary:hover {
  background: #354462;
  border-color: #354462;
}
.landing-app-bar .lab-secondary {
  background: #fff;
  color: #465775;
}
.landing-app-bar .lab-secondary:hover {
  background: #e9ecf2;
}
.landing-app-bar a:focus-visible,
.landing-app-bar button:focus-visible {
  outline: 2px solid #465775;
  outline-offset: 2px;
}
/* The chevron on the Edit button: it points at the frame below, which is what
   the button swaps for the code editor. */
.landing-app-bar .lab-chevron {
  flex: none;
  fill: currentColor;
}

#landing-content .landing-guide {
  border: none;
  width: 100%;
  flex: 1 1 auto;
  min-height: 0;
}
`;

// The frame the Edit button starts you with: a little rendering that works
// as-is, and every other part of the API alongside it as commented-out blocks
// to uncomment.
//
// Deliberately free of backticks and "${", so it can live in this template
// literal unescaped and stay readable both here and in the editor.
export const STARTER_FRAME =
  `// Welcome to framejs. This whole app is its URL: edit the code here and the
// page beside it re-runs. Nothing to install, nothing to deploy.
// Docs: https://framejs.io/docs

root.innerHTML = "";

const box = document.createElement("div");
box.style.cssText =
  "position:relative;width:100%;height:100%;display:flex;align-items:center;" +
  "justify-content:center;font-family:system-ui,sans-serif;color:#111110;" +
  "background:#f4f3ef";
box.innerHTML =
  '<div style="text-align:center;max-width:34ch;padding:24px">' +
  '<h1 style="margin:0 0 10px;font-size:1.7rem">Hello, framejs</h1>' +
  '<p style="margin:0;color:#6e6c63;line-height:1.5">' +
  "Change this code and it re-runs. The URL holds the whole app, so copying it " +
  "is how you share or embed this." +
  "</p></div>";

// The way back out. This whole app lives in the url's hash params, so dropping
// them leaves the plain base route — the framejs.io front page. Delete this
// button once you are building something real. (Top-LEFT on purpose: the
// runtime overlays its own Edit button in the top-right corner.)
const back = document.createElement("button");
back.textContent = "← Back";
back.style.cssText =
  "position:absolute;top:12px;left:12px;padding:6px 12px;border-radius:2px;" +
  "border:1px solid #465775;background:#fff;color:#465775;cursor:pointer;" +
  "font:600 0.9rem system-ui,sans-serif";
back.onclick = () => {
  window.location.href = "/";
};
box.append(back);

root.append(box);

// ---------------------------------------------------------------------------
// The rest of the API. Uncomment a block to try it.
// ---------------------------------------------------------------------------

// Keep state in the URL, so a link you share carries it along:
// const clicks = getJson("clicks") ?? 0;
// setJson("clicks", clicks + 1);

// Receive data, from an embedding page or from another frame wired to this one:
// export const onInputs = (inputs) => {
//   console.log("inputs", inputs);
// };

// Send data out:
// setOutput("result", 42);
// setOutputs({ count: 1, label: "hi" });

// React to the frame being resized:
// export const onResize = (width, height) => {};

// Tear down timers and listeners before the code re-runs:
// export const cleanup = () => {};

// Write into the visible log pane (console.log goes to the devtools console):
// log("hello");

// Import any ES module straight from a CDN (imports must be top-level):
// import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
`;

const CHEVRON_DOWN =
  "M213.66,101.66l-80,80a8,8,0,0,1-11.32,0l-80-80A8,8,0,0,1,53.66,90.34L128," +
  "164.69l74.34-74.35a8,8,0,0,1,11.32,11.32Z";

// Open the editor on the starter frame.
//
// `framejsStartEditing` is the runtime's seam for exactly this (index.html, next
// to mountEditor): it owns the hash write and the editor pane, neither of which
// belongs out here. It may not exist yet — the runtime module imports from a CDN
// and this landing is painted before it finishes — so an early click is left in
// `framejsPendingEdit` for the runtime to drain the moment it is ready, rather
// than being dropped.
const startEditing = () => {
  if (typeof globalThis.framejsStartEditing === "function") {
    globalThis.framejsStartEditing(STARTER_FRAME);
  } else {
    globalThis.framejsPendingEdit = STARTER_FRAME;
  }
};

/**
 * Build the landing into `root`, replacing whatever is there.
 *
 * Idempotent: called once on a landing load and again whenever runJsFromUrl
 * finds no code (the user cleared it), and a landing that is already up is left
 * alone — rebuilding it would reload the guide iframe for nothing.
 */
export const renderLanding = (root) => {
  if (!root) return;
  if (root.querySelector("#landing-content")) return;

  if (!document.getElementById(STYLE_ID)) {
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = STYLE;
    document.head.append(style);
  }

  const landing = document.createElement("div");
  landing.id = "landing-content";
  // target="_top": framejs.io may itself be embedded.
  landing.innerHTML = `
    <div class="landing-app-bar">
      <div class="lab-text">
        <strong>Create, save and share frames on framejs.app</strong>
      </div>
      <div class="lab-actions">
        <!-- This page IS a frame, and nothing here said so: the Edit button
             seeds the starter frame above into the url and opens the editor
             pane on it. -->
        <button id="landing-edit-button" class="lab-secondary" type="button"
          title="Edit this page's code">
          <span>Edit</span>
          <svg class="lab-chevron" xmlns="http://www.w3.org/2000/svg"
            width="12" height="12" viewBox="0 0 256 256" aria-hidden="true">
            <path d="${CHEVRON_DOWN}"></path>
          </svg>
        </button>
        <a class="lab-primary" href="${APP_ORIGIN}/" target="_top"
        >Open framejs.app &rarr;</a>
      </div>
    </div>
    <iframe class="landing-guide" src="${APP_ORIGIN}/howto" frameborder="0"
      allow="clipboard-read; clipboard-write"></iframe>
  `;

  landing.querySelector("#landing-edit-button")
    .addEventListener("click", startEditing);

  root.replaceChildren(landing);
};
