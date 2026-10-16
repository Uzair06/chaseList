# chaseList

Two independent npm packages. There is no root `package.json`, workspace, CI, or shared scripts. Run commands inside `client/` or `server/`, not the repo root.

`client/README.md` is the stock Vite template, not project docs.

## client

Vite + React 19 + TypeScript app. Still the scaffold (`client/index.html` → `client/src/main.tsx`). No API client and no proxy in `vite.config.ts`.

```bash
cd client
npm run dev       # Vite
npm run lint      # eslint .  (ts/tsx only; dist ignored)
npm run build     # tsc -b && vite build  — this is the typecheck
npm run preview
```

No test runner and no formatter. Do not invent `npm test`.

`tsconfig.json` is project references only (`tsc -b`, not bare `tsc`). `tsconfig.app.json` sets `verbatimModuleSyntax`, `erasableSyntaxOnly`, `noUnusedLocals`, and `allowImportingTsExtensions`. Type-only imports need `import type`. Enums and other non-erasable syntax fail the build. Source imports keep the `.tsx` / `.ts` extension (see `src/main.tsx`).

## server

Dependencies only: Express 5, Mongoose, cors, dotenv, plus `tsx` and TypeScript. No source files, no `tsconfig`, no start/dev script. `main` is `index.js`, which does not exist.

`npm test` is a stub that always exits 1. Do not treat that as a failing suite, and do not assume a Mongo URI, `.env`, or listen port. They are not defined.

`type` is `commonjs`. TypeScript here is `^7`; the client pins `~6`. Do not unify them.
