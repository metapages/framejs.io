# [Metaframe](https://metapages.org/) template

Fast creation and deployment of advanced [metaframe](https://metapages.org/) websites.

Target audience: developers building [metaframes](https://metapages.org/) or any static website where having the core tools of development, building and publishing are packaged and require a small number of commands.

It has everything you need to get a connectable [metaframe](https://metapages.org/) website up and running and deployed.

## Fork and modify

1. Fork OR Create new repository
   - Fork
   - Create new repository
     1. Clone the new repository and go there in the terminal
     2. `git remote add upstream git@github.com:metapages/metaframe-template-preact.git`
     3. `git fetch upstream`
     4. `git checkout -b upstream upstream/main`
     5. `git branch -d main`
     6. `git checkout -b main`
     7. `git push -u origin main`
2. Change in `package.json`:
   - `name` to your npm module name
     - This repo keeps the npm module name in `package.json` close to the github repo name:
       - npm: `@metapages/metaframe-...?`
       - git: `metapages/metaframe-...?`
   - `repository.url`
   - `homepage`
   - `version`: set this to e.g. `0.1.0` or whatever you need
3. Change in `index.html`: `<title> ... </title>`
4. Meet [host requirements](#host-requirements)
5. Maybe change `APP_FQDN` and `APP_PORT` in `.env` (create if needed) to avoid origin collisions
6. Type `just` and go from there

**Getting upstream improvements:**

1. `git checkout upstream`
2. `git pull`
3. `git checkout main`
4. `git merge upstream`

You'll have to manually fix the differences where they conflict (they will).

## Host requirements

- [just](https://github.com/casey/just#installation)
- [docker](https://www.docker.com/products/docker-desktop)

That's it. Commands are self-documenting: just type `just`

## Features

- `vite` for fast building
- `preact` for efficient, fast loading sites
- `typescript` for type checking
- `chakra-ui.com` for the UI framework
- `just` for a single method to build/test/deploy/publish
- `docker` because I don't want to touch/rely your host system except where needed

## Assumptions:

- `just` will be the command runner, not `npm` (directly) or `make` or any other underlying tech specific command runner. `just` is the main entry point to control all aspects of the software lifecycle.
  - Prefer contextual error messages with calls to action over documentation that is not as close as possible to the code or commands. Distance creates indirection and staleness and barriers to keep updated.
- You are building to publish at github pages with the url: `https://<user_org>.github.io/<repo-name>/`
  - github pages 👆 comes with limited options for some config:
    - we build browser assets in `./docs` instead of `./dist` (typical default) so that publishing to github pages is less configuration
- Operating this repository should be "easy" and enjoyable. It's a product of love and passion, I am hoping that you enjoy using at least just a little bit.

## File Upload (Cloudflare R2 / S3-compatible storage)

Users can drag-drop files onto the code editor to upload them to cloud storage and reference them in their code. Files are ephemeral with a 7-day TTL. Local development uses MinIO (started automatically via docker-compose). Production uses Cloudflare R2.

### Local development

MinIO starts automatically with `just dev`. The MinIO console is available at `http://localhost:9001` (login: minioadmin/minioadmin). Uploaded files are accessible via `https://<APP_FQDN>/s3/uploads/...` (proxied through traefik).

### Production setup (Cloudflare R2)

1. **Create R2 bucket** in the Cloudflare dashboard (Storage & Databases > R2)
2. **Enable public access**: either use the r2.dev subdomain or attach a custom domain
3. **Create API token**: R2 > Manage R2 API tokens > Create API token with "Object Read & Write" permissions
4. **Set lifecycle rule**: Bucket settings > Object lifecycle > Add rule > Delete objects after 7 days
5. **Configure CORS**: Bucket settings > CORS policy:
   ```json
   [
     {
       "AllowedOrigins": ["*"],
       "AllowedMethods": ["GET", "PUT", "HEAD"],
       "AllowedHeaders": ["*"],
       "MaxAgeSeconds": 3600
     }
   ]
   ```
   ⚠️ **This is not sufficient on its own.** R2 only sends
   `Access-Control-Allow-Origin` when the request has an `Origin` header, so a
   non-CORS load (`<img>`, crawler, prefetch) caches a header-less copy that
   later breaks `fetch()`. You also need a Cloudflare Transform Rule setting the
   header unconditionally — see
   [Deployment → File storage (Cloudflare R2)](../docs/development/deployment.md#file-storage-cloudflare-r2).
6. **Set environment variables** on Deno Deploy:
   - `S3_ENDPOINT` — `https://<account-id>.r2.cloudflarestorage.com`
   - `S3_ACCESS_KEY_ID` — from the API token
   - `S3_SECRET_ACCESS_KEY` — from the API token
   - `S3_BUCKET_NAME` — your bucket name
   - `S3_PUBLIC_URL` — the public URL (e.g. `https://pub-xxx.r2.dev` or your custom domain)
   - `S3_UPLOAD_MAX_SIZE_MB` — optional, defaults to 50
