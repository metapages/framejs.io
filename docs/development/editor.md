# Editor

The editor is a React frontend built with Vite, Chakra UI v2, and TypeScript.

## Location

```
editor/
├── src/
├── public/
├── vite.config.ts
├── tsconfig.json
└── package.json
```

## Key details

- Uses `/@/` path alias mapping to `./src/`
- Hash params used extensively for state (`useHashParamBase64`, `useHashParamJson`)
- Type checking: `just editor/check` (runs `tsc --build`)
- Formatting: `just editor/fmt` (Prettier)

## Development

The editor runs as part of the full dev stack:

```bash
just dev
```

To type-check:

```bash
just editor/check
```

## Build

The editor is built as part of the publish process:

```bash
just editor/build
```

Output goes to `editor/dist/`, which is then copied into the deploy directory.

---

**Developer docs:** [Index](./README.md) · [Local Setup](./local-setup.md) · [Architecture](./architecture.md) · **Editor** · [Worker](./worker.md) · [Deployment](./deployment.md)
