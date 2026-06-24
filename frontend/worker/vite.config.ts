import { defineConfig } from "vite";
import { fresh } from "@fresh/plugin-vite";
import tailwindcss from "@tailwindcss/vite";

// Local dev HTTPS host. We serve on the dedicated host `framejs.localhost`
// (resolves to loopback in Chrome/Edge/Firefox; add `127.0.0.1 framejs.localhost`
// to /etc/hosts for Safari/others). The dedicated host gives this app its OWN
// cookie jar, so the `nhostSession` auth cookie can't collide with sibling apps
// that also run on bare `localhost` — a stale collision there caused silent
// login failures.
const DEV_HOST = "framejs.localhost";
const CERT_DIR = new URL("./.certs/", import.meta.url);
const CERT_PATH = new URL("localhost-cert.pem", CERT_DIR);
const KEY_PATH = new URL("localhost-key.pem", CERT_DIR);

// Mint a fresh mkcert cert covering DEV_HOST on every startup, so the cert can
// never drift out of sync with the host above and no manual step is required.
// mkcert signs with the locally-trusted mkcert CA, so the browser trusts the
// new cert without re-importing anything. If mkcert isn't installed we fall
// back to an existing cert (if any) rather than failing the dev server.
function ensureDevCert(): { cert: string; key: string } {
  Deno.mkdirSync(CERT_DIR.pathname, { recursive: true });
  const mkcert = new Deno.Command("mkcert", {
    args: [
      "-cert-file",
      CERT_PATH.pathname,
      "-key-file",
      KEY_PATH.pathname,
      DEV_HOST,
      "localhost",
      "127.0.0.1",
      "::1",
    ],
    stdout: "null",
    stderr: "piped",
  });
  try {
    const { success, stderr } = mkcert.outputSync();
    if (!success) {
      console.warn(
        `[vite] mkcert failed, reusing existing cert if present:\n${new TextDecoder().decode(
          stderr,
        )}`,
      );
    }
  } catch (e) {
    console.warn(
      `[vite] could not run mkcert (${
        e instanceof Error ? e.message : e
      }); reusing existing cert if present. Install mkcert: https://github.com/FiloSottile/mkcert`,
    );
  }
  return {
    cert: Deno.readTextFileSync(CERT_PATH),
    key: Deno.readTextFileSync(KEY_PATH),
  };
}

export default defineConfig({
  plugins: [fresh(), tailwindcss()],
  server: {
    host: DEV_HOST,
    https: ensureDevCert(),
  },
});
