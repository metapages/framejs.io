import { App, staticFiles } from "fresh";
import { define, type State } from "./utils.ts";
import { getUserFromRequest, isProtectedRoute } from "./lib/auth.ts";

export const app = new App<State>();

app.use(staticFiles());

// Auth middleware: extract user from request
app.use(define.middleware(async (ctx) => {
  const result = await getUserFromRequest(ctx.req);
  ctx.state.user = result?.user ?? null;
  ctx.state.accessToken = result?.accessToken ?? null;

  // Redirect to login for protected routes
  const url = new URL(ctx.req.url);
  if (isProtectedRoute(url.pathname) && !ctx.state.user) {
    return new Response(null, {
      status: 302,
      headers: {
        Location: `/login?redirect=${encodeURIComponent(url.pathname)}`,
      },
    });
  }

  return ctx.next();
}));

app.fsRoutes();
