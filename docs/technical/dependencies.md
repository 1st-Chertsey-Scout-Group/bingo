# Dependencies

## Production

| Package                          | Purpose                                               |
| -------------------------------- | ----------------------------------------------------- |
| `next`                           | Framework — App Router, SSR, API routes               |
| `react`                          | UI library                                            |
| `react-dom`                      | React DOM rendering                                   |
| `socket.io`                      | Server-side WebSocket (rooms, broadcasting)           |
| `socket.io-client`               | Client-side WebSocket (auto-reconnect)                |
| `@prisma/client`                 | Database ORM (SQLite)                                 |
| `@prisma/adapter-better-sqlite3` | Prisma adapter for better-sqlite3 driver              |
| `better-sqlite3`                 | Synchronous SQLite driver (WAL mode, better perf)     |
| `@aws-sdk/client-s3`             | S3 operations (PutObject)                             |
| `@aws-sdk/s3-request-presigner`  | Presigned URL generation                              |
| `browser-image-compression`      | Client-side photo compression to WebP                 |
| `sonner`                         | Toast notifications (via shadcn)                      |
| `tailwindcss`                    | Utility-first CSS                                     |
| `@tailwindcss/postcss`           | PostCSS plugin for Tailwind                           |
| `class-variance-authority`       | Component variant styling (shadcn dep)                |
| `clsx`                           | Conditional class names (shadcn dep)                  |
| `tailwind-merge`                 | Merge Tailwind classes without conflicts (shadcn dep) |
| `lucide-react`                   | Icons (shadcn dep)                                    |
| `@base-ui/react`                 | Headless UI primitives (shadcn dep)                   |
| `@paralleldrive/cuid2`           | Collision-resistant unique IDs (S3 key generation)    |
| `next-themes`                    | Dark/light theme support (shadcn dep)                 |
| `tw-animate-css`                 | CSS animations for Tailwind (shadcn dep)              |

## Dev

| Package                       | Purpose                                  |
| ----------------------------- | ---------------------------------------- |
| `typescript`                  | Type checking                            |
| `tsx`                         | TypeScript execution for dev server      |
| `prisma`                      | CLI — migrations, seeding, studio        |
| `vitest`                      | Test runner                              |
| `@vitest/coverage-v8`         | Coverage reporting (80% target)          |
| `eslint`                      | Linting                                  |
| `eslint-config-next`          | Next.js ESLint rules                     |
| `prettier`                    | Code formatting                          |
| `prettier-plugin-tailwindcss` | Auto-sort Tailwind classes               |
| `@types/node`                 | Node.js type definitions                 |
| `@types/react`                | React type definitions                   |
| `@types/react-dom`            | React DOM type definitions               |
| `@types/better-sqlite3`       | better-sqlite3 type definitions          |
| `shadcn`                      | CLI for scaffolding shadcn/ui components |

## Not Used (and why)

| Skipped                             | Reason                                                                                                           |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| PWA library (next-pwa, serwist)     | Hand-written service worker is simpler for app-shell-only caching — no runtime caching of API/socket data needed |
| State library (zustand, redux)      | `useReducer` + Context is sufficient for this scale                                                              |
| Logging library (pino, winston)     | Single process, `console.error` to stdout captured by Coolify                                                    |
| Auth library (next-auth, clerk)     | No user accounts — PIN-based access only                                                                         |
| Form library (react-hook-form)      | Only 2 forms (PIN entry, item edit) — native forms are fine                                                      |
| CSS-in-JS (styled-components)       | Tailwind covers all styling needs                                                                                |
| Testing library (@testing-library)  | Testing pure logic functions only, no component tests                                                            |
| E2E framework (playwright, cypress) | Manual testing by user                                                                                           |
| Husky / lint-staged                 | Single developer, format on save is sufficient                                                                   |
