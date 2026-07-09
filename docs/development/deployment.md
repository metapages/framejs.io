# Deployment

## Website (Deno Deploy)

The website at [framejs.io](https://framejs.io) is deployed to [Deno Deploy](https://deno.com/deploy).

```bash
just publish
```

This command:
1. Builds the editor frontend (`just editor/build`)
2. Copies `editor/dist/` and worker files into a `deploy/` directory
3. Runs `deployctl deploy --project=metaframe-js --prod server.ts`

Requires `DENO_DEPLOY_TOKEN` env var (or interactive login).

Optional: set `UMAMI_HOST` and `UMAMI_WEBSITE_ID` in the Deno Deploy project
env to enable cookieless server-side usage analytics
(see [worker docs](./worker.md#analytics-optional)).

## Python package (PyPI)

The `metaframe-widget` package is published to PyPI:

```bash
just build-python    # builds python/dist/
just publish-python  # publishes to PyPI
```

Requires `HATCH_INDEX_USER` and `HATCH_INDEX_AUTH` env vars, or interactive login.

### CI publishing

Push a git tag to trigger CI:

```bash
git tag python-v0.1.0 && git push origin python-v0.1.0
```

---

**Developer docs:** [Index](./README.md) · [Local Setup](./local-setup.md) · [Architecture](./architecture.md) · [Editor](./editor.md) · [Worker](./worker.md) · **Deployment**
