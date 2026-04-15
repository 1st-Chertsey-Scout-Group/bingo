# Implementation Guide — Table of Contents

Step-by-step implementation docs for building Scout Nature Bingo from scratch. Each step is an atomic work order for an AI agent. Steps are executed in order — each assumes all prior steps are complete.

**Template:** Each step follows the same format — Description, Requirements, Files to Create/Modify, Checklist, Verification, Commit message.

**Manual steps** are flagged and require human action (e.g. running commands, setting up external services).

## Overview

| Phase                         | Steps   | Coverage                                                                          |
| ----------------------------- | ------- | --------------------------------------------------------------------------------- |
| Project Scaffolding & Config  | 001–015 | Next.js, TS, Prettier, ESLint, env, devcontainer, shadcn/ui, layout, PWA manifest |
| Database Layer                | 016–027 | Prisma schema (6 models), client singleton, seed with all 85 items + templates    |
| Custom Server & Socket.IO     | 028–033 | server.ts, handler entry, 3 handler stubs, client utility                         |
| Stub Pages & Dev Server       | 034–038 | Landing, scout, leader, admin pages + dev server verification                     |
| Shared Utilities & Types      | 039–047 | Types, teams (30), templates, board generation, S3, image compression + tests     |
| State Management              | 048–050 | Reducer, GameProvider context, useSocket hook                                     |
| API Routes                    | 051–058 | Validate, game CRUD, upload, items CRUD                                           |
| Admin — Game Creation         | 059–063 | PIN gate, form, API wiring, localStorage + redirect                               |
| Admin — Item Management       | 064–067 | List, add, edit, delete                                                           |
| Landing Page                  | 068–072 | PIN form, validation, role redirect, leader name, homescreen hint                 |
| Scout Join & Lobby            | 073–078 | ScoutGame shell, lobby:join handler, Lobby component, teams event                 |
| Leader Join & Lobby           | 079–085 | LeaderGame shell, leader join, name validation, PINs, landscape, start button     |
| Game Start & Board Generation | 086–090 | game:start handler, board generation, RoundItems, client wiring                   |
| Board UI                      | 091–096 | Board + Square components, all square states, scout active render                 |
| Scout Active Round            | 097–104 | Camera trigger, compression, S3 upload, submission, pending indicator, toasts     |
| Submission Processing         | 105–107 | Server handler, square:pending, submission:received                               |
| Leader Active Round           | 108–112 | Leader board, RoundHeader, needs-review + locked styling                          |
| Leader Review Flow            | 113–123 | review:open/approve/reject/close handlers, ReviewModal, lock display              |
| Round End                     | 124–128 | game:end handler, auto-end, scout overlay, leader summary                         |
| New Round                     | 129–132 | game:newround handler, lobby reset, localStorage clear                            |
| Resilience                    | 133–145 | Reconnection, banner, caching, rejoin, upload retry, lock timeout                 |
| PWA Service Worker            | 146–148 | Service worker, registration, icons                                               |
| Docker & Deployment           | 149–153 | Dockerfile, compose, entrypoint, S3 lifecycle, production env                     |

---

## Phase 1: Project Scaffolding & Config (001–015)

- ~~[001 — Create Devcontainer Configuration](implementation/001-create-devcontainer.md)~~ ✓
- ~~[002 — Initialize Next.js Project](implementation/002-initialize-nextjs-project.md)~~ ✓
- ~~[003 — Configure TypeScript Strict Mode](implementation/003-configure-typescript.md)~~ ✓
- ~~[004 — Create Server TypeScript Config](implementation/004-create-server-tsconfig.md)~~ ✓
- ~~[005 — Configure Prettier](implementation/005-configure-prettier.md)~~ ✓
- ~~[006 — Configure ESLint](implementation/006-configure-eslint.md)~~ ✓
- ~~[007 — Create Environment Variables File](implementation/007-create-env-file.md)~~ ✓
- ~~[008 — Install Production Dependencies](implementation/008-install-production-deps.md)~~ ✓
- ~~[009 — Install Dev Dependencies](implementation/009-install-dev-deps.md)~~ ✓
- ~~[010 — Configure npm Scripts](implementation/010-configure-npm-scripts.md)~~ ✓
- ~~[011 — Initialize shadcn/ui](implementation/011-initialize-shadcn-ui.md)~~ ✓
- ~~[012 — Add All shadcn/ui Components](implementation/012-add-shadcn-components.md)~~ ✓
- ~~[013 — Create Root Layout with Tailwind](implementation/013-create-root-layout.md)~~ ✓
- ~~[014 — Add PWA Manifest](implementation/014-add-pwa-manifest.md)~~ ✓
- ~~[015 — Add PWA Meta Tags to Layout](implementation/015-add-pwa-meta-tags.md)~~ ✓

## Phase 2: Database Layer (016–027)

- ~~[016 — Create Prisma Schema with Datasource](implementation/016-create-prisma-schema.md)~~ ✓
- ~~[017 — Add Game Model](implementation/017-add-game-model.md)~~ ✓
- ~~[018 — Add Team Model](implementation/018-add-team-model.md)~~ ✓
- ~~[019 — Add Item Model](implementation/019-add-item-model.md)~~ ✓
- ~~[020 — Add TemplateValue Model](implementation/020-add-template-value-model.md)~~ ✓
- ~~[021 — Add RoundItem Model](implementation/021-add-round-item-model.md)~~ ✓
- ~~[022 — Add Submission Model](implementation/022-add-submission-model.md)~~ ✓
- ~~[023 — Create Prisma Client Singleton](implementation/023-create-prisma-client.md)~~ ✓
- ~~[024 — Push Database Schema](implementation/024-push-database-schema.md)~~ ✓
- ~~[025 — Create Seed File with Concrete Items](implementation/025-create-seed-concrete-items.md)~~ ✓
- ~~[026 — Add Templates and Template Values to Seed](implementation/026-add-seed-templates.md)~~ ✓
- ~~[027 — Run Database Seed](implementation/027-run-database-seed.md)~~ ✓

## Phase 3: Custom Server & Socket.IO Wiring (028–033)

- ~~[028 — Create Custom Server Entry](implementation/028-create-custom-server.md)~~ ✓
- ~~[029 — Create Socket Handler Entry Point](implementation/029-create-socket-handler-entry.md)~~ ✓
- ~~[030 — Create Lobby Socket Handlers Stub](implementation/030-create-lobby-handlers-stub.md)~~ ✓
- ~~[031 — Create Game Socket Handlers Stub](implementation/031-create-game-handlers-stub.md)~~ ✓
- ~~[032 — Create Submission Socket Handlers Stub](implementation/032-create-submission-handlers-stub.md)~~ ✓
- ~~[033 — Create Socket.IO Client Utility](implementation/033-create-socket-client.md)~~ ✓

## Phase 4: Stub Pages & Dev Server (034–038)

- ~~[034 — Create Landing Page Stub](implementation/034-create-landing-page-stub.md)~~ ✓
- ~~[035 — Create Scout Page Stub](implementation/035-create-scout-page-stub.md)~~ ✓
- ~~[036 — Create Leader Page Stub](implementation/036-create-leader-page-stub.md)~~ ✓
- ~~[037 — Create Admin Page Stub](implementation/037-create-admin-page-stub.md)~~ ✓
- ~~[038 — Verify Dev Server Starts](implementation/038-verify-dev-server.md)~~ ✓

## Phase 5: Shared Utilities & Types (039–047)

- ~~[039 — Create Shared Type Definitions](implementation/039-create-shared-types.md)~~ ✓
- ~~[040 — Create Team Names and Colours Data](implementation/040-create-team-data.md)~~ ✓
- ~~[041 — Test Team Assignment Logic](implementation/041-test-team-assignment.md)~~ ✓
- ~~[042 — Create Template Resolution Utility](implementation/042-create-template-resolution.md)~~ ✓
- ~~[043 — Test Template Resolution](implementation/043-test-template-resolution.md)~~ ✓
- ~~[044 — Create Board Generation Utility](implementation/044-create-board-generation.md)~~ ✓
- ~~[045 — Test Board Generation](implementation/045-test-board-generation.md)~~ ✓
- ~~[046 — Create S3 Presigned URL Utility](implementation/046-create-s3-utility.md)~~ ✓
- ~~[047 — Create Image Compression Wrapper](implementation/047-create-image-compression.md)~~ ✓

## Phase 6: State Management (048–050)

- ~~[048 — Create Game State Reducer](implementation/048-create-game-reducer.md)~~ ✓
- ~~[049 — Create GameProvider Context](implementation/049-create-game-provider.md)~~ ✓
- ~~[050 — Create useSocket Hook](implementation/050-create-use-socket-hook.md)~~ ✓

## Phase 7: API Routes (051–058)

- ~~[051 — Create PIN Validation Route](implementation/051-create-validate-api.md)~~ ✓
- ~~[052 — Create Game Creation Route](implementation/052-create-game-post-api.md)~~ ✓
- ~~[053 — Create Game State Route](implementation/053-create-game-get-api.md)~~ ✓
- ~~[054 — Create Presigned Upload URL Route](implementation/054-create-upload-api.md)~~ ✓
- ~~[055 — Create Get Items Route](implementation/055-create-items-get-api.md)~~ ✓
- ~~[056 — Create Add Item Route](implementation/056-create-items-post-api.md)~~ ✓
- ~~[057 — Create Update Item Route](implementation/057-create-items-put-api.md)~~ ✓
- ~~[058 — Create Delete Item Route](implementation/058-create-items-delete-api.md)~~ ✓

## Phase 8: Admin — Game Creation (059–063)

- ~~[059 — Create Admin PIN Check Utility](implementation/059-create-admin-pin-check.md)~~ ✓
- ~~[060 — Build Admin Page Layout with PIN Gate](implementation/060-build-admin-layout.md)~~ ✓
- ~~[061 — Build Game Creation Form](implementation/061-build-game-creation-form.md)~~ ✓
- ~~[062 — Wire Game Creation to API](implementation/062-wire-game-creation-api.md)~~ ✓
- ~~[063 — Add localStorage Seed and Redirect](implementation/063-add-admin-redirect.md)~~ ✓

## Phase 9: Admin — Item Pool Management (064–067)

- ~~[064 — Build Item List Display](implementation/064-build-item-list.md)~~ ✓
- ~~[065 — Build Add Item Form](implementation/065-build-add-item-form.md)~~ ✓
- ~~[066 — Build Edit Item Controls](implementation/066-build-edit-item-controls.md)~~ ✓
- ~~[067 — Build Delete Item with Confirmation](implementation/067-build-delete-item.md)~~ ✓

## Phase 10: Landing Page (068–072)

- ~~[068 — Build Landing Page PIN Entry Form](implementation/068-build-landing-pin-form.md)~~ ✓
- ~~[069 — Wire PIN Validation to API](implementation/069-wire-pin-validation.md)~~ ✓
- ~~[070 — Add Role-Based Redirect Logic](implementation/070-add-role-redirect.md)~~ ✓
- ~~[071 — Add Leader Display Name Input](implementation/071-add-leader-name-input.md)~~ ✓
- ~~[072 — Add "Add to Home Screen" Hint Banner](implementation/072-add-homescreen-hint.md)~~ ✓

## Phase 11: Scout Join & Lobby (073–078)

- ~~[073 — Create ScoutGame Client Component Shell](implementation/073-create-scout-game-shell.md)~~ ✓
- ~~[074 — Wire ScoutGame to Scout Page](implementation/074-wire-scout-game-page.md)~~ ✓
- ~~[075 — Implement Scout lobby:join Handler](implementation/075-implement-scout-lobby-join.md)~~ ✓
- ~~[076 — Add Team Auto-Assignment Logic](implementation/076-add-team-auto-assignment.md)~~ ✓
- ~~[077 — Build Scout Lobby Component](implementation/077-build-scout-lobby.md)~~ ✓
- ~~[078 — Wire lobby:teams Event to Update Team List](implementation/078-wire-lobby-teams-event.md)~~ ✓

## Phase 12: Leader Join & Lobby (079–085)

- ~~[079 — Create LeaderGame Client Component Shell](implementation/079-create-leader-game-shell.md)~~ ✓
- ~~[080 — Wire LeaderGame to Leader Page](implementation/080-wire-leader-game-page.md)~~ ✓
- ~~[081 — Implement Leader lobby:join Handler](implementation/081-implement-leader-lobby-join.md)~~ ✓
- ~~[082 — Add Leader Display Name Uniqueness Validation](implementation/082-add-leader-name-validation.md)~~ ✓
- ~~[083 — Build Leader Lobby Component with PIN Display](implementation/083-build-leader-lobby.md)~~ ✓
- ~~[084 — Build Landscape PIN Display Mode](implementation/084-build-landscape-pin-display.md)~~ ✓
- ~~[085 — Add Start Round Button with Team Count Gate](implementation/085-add-start-round-button.md)~~ ✓

## Phase 13: Game Start & Board Generation (086–090)

- [086 — Implement game:start Socket Handler](implementation/086-implement-game-start-handler.md)
- [087 — Integrate Board Generation into game:start](implementation/087-integrate-board-generation.md)
- [088 — Create RoundItem Records on Game Start](implementation/088-create-round-items.md)
- [089 — Emit game:started Event with Board Data](implementation/089-emit-game-started.md)
- [090 — Wire game:started to Client State](implementation/090-wire-game-started-client.md)

## Phase 14: Board UI (091–096)

- ~~[091 — Build Board Component](implementation/091-build-board-component.md)~~ ✓
- ~~[092 — Build Square Component](implementation/092-build-square-component.md)~~ ✓
- ~~[093 — Style Unclaimed Square State](implementation/093-style-unclaimed-square.md)~~ ✓
- ~~[094 — Style Own-Team Claimed Square](implementation/094-style-own-team-claimed.md)~~ ✓
- ~~[095 — Style Other-Team Claimed Square](implementation/095-style-other-team-claimed.md)~~ ✓
- ~~[096 — Render Scout Board on Active Game](implementation/096-render-scout-active-board.md)~~ ✓

## Phase 15: Scout Active Round (097–104)

- ~~[097 — Add Camera Trigger on Square Tap](implementation/097-add-camera-trigger.md)~~ ✓
- ~~[098 — Implement Photo Compression on Capture](implementation/098-implement-photo-compression.md)~~ ✓
- ~~[099 — Implement Presigned URL Request and S3 Upload](implementation/099-implement-s3-upload.md)~~ ✓
- ~~[100 — Emit submission:submit After Upload](implementation/100-emit-submission-submit.md)~~ ✓
- ~~[101 — Add Pending Submission Indicator](implementation/101-add-pending-indicator.md)~~ ✓
- ~~[102 — Wire square:claimed to Scout Board](implementation/102-wire-square-claimed-scout.md)~~ ✓
- ~~[103 — Wire square:pending to Scout Board](implementation/103-wire-square-pending-scout.md)~~ ✓
- ~~[104 — Add Scout Toast Notifications](implementation/104-add-scout-toasts.md)~~ ✓

## Phase 16: Submission Processing — Server (105–107)

- ~~[105 — Implement submission:submit Handler](implementation/105-implement-submission-handler.md)~~ ✓
- ~~[106 — Emit square:pending to Game Room](implementation/106-emit-square-pending.md)~~ ✓
- ~~[107 — Emit submission:received to Team Room](implementation/107-emit-submission-received.md)~~ ✓

## Phase 17: Leader Active Round (108–112)

- ~~[108 — Render Leader Board on Active Game](implementation/108-render-leader-active-board.md)~~ ✓
- ~~[109 — Build RoundHeader Component](implementation/109-build-round-header.md)~~ ✓
- ~~[110 — Style Needs-Review Square](implementation/110-style-needs-review-square.md)~~ ✓
- ~~[111 — Style Locked Square](implementation/111-style-locked-square.md)~~ ✓
- ~~[112 — Wire square:pending to Leader Board](implementation/112-wire-pending-leader-board.md)~~ ✓

## Phase 18: Leader Review Flow (113–123)

- ~~[113 — Implement review:open Handler](implementation/113-implement-review-open.md)~~ ✓
- ~~[114 — Build ReviewModal Component](implementation/114-build-review-modal.md)~~ ✓
- ~~[115 — Wire review:open to Display ReviewModal](implementation/115-wire-review-open-client.md)~~ ✓
- ~~[116 — Implement review:approve Handler](implementation/116-implement-review-approve.md)~~ ✓
- ~~[117 — Handle Approval Broadcast](implementation/117-handle-approval-broadcast.md)~~ ✓
- ~~[118 — Implement review:reject Handler](implementation/118-implement-review-reject.md)~~ ✓
- ~~[119 — Wire Reject with Auto-Promote](implementation/119-wire-reject-auto-promote.md)~~ ✓
- ~~[120 — Wire Reject with Empty Queue](implementation/120-wire-reject-empty-queue.md)~~ ✓
- ~~[121 — Implement review:close Handler](implementation/121-implement-review-close.md)~~ ✓
- ~~[122 — Wire Modal Dismiss to review:close](implementation/122-wire-modal-dismiss.md)~~ ✓
- ~~[123 — Display Lock Status on Leader Board](implementation/123-display-lock-status.md)~~ ✓

## Phase 19: Round End (124–128)

- ~~[124 — Implement game:end Handler](implementation/124-implement-game-end.md)~~ ✓
- ~~[125 — Emit game:ended with Summaries](implementation/125-emit-game-ended.md)~~ ✓
- ~~[126 — Add Auto-End When All Squares Claimed](implementation/126-add-auto-end-all-claimed.md)~~ ✓
- ~~[127 — Build Scout Round Over Overlay](implementation/127-build-scout-round-over.md)~~ ✓
- ~~[128 — Build Leader Round Summary Screen](implementation/128-build-leader-summary.md)~~ ✓

## Phase 20: New Round (129–132)

- ~~[129 — Implement game:newround Handler](implementation/129-implement-game-newround.md)~~ ✓
- ~~[130 — Emit game:lobby to All Clients](implementation/130-emit-game-lobby.md)~~ ✓
- ~~[131 — Clear localStorage teamId on game:lobby](implementation/131-clear-localstorage-teamid.md)~~ ✓
- ~~[132 — Return All Clients to Lobby View](implementation/132-return-clients-to-lobby.md)~~ ✓

## Phase 21: Resilience & Error Handling (133–145)

- ~~[133 — Configure Socket.IO Reconnection](implementation/133-configure-socket-reconnection.md)~~ ✓
- ~~[134 — Build Connection Status Banner](implementation/134-build-connection-banner.md)~~ ✓
- ~~[135 — Add localStorage Session Caching](implementation/135-add-localstorage-caching.md)~~ ✓
- ~~[136 — Implement Scout Rejoin Handler](implementation/136-implement-scout-rejoin.md)~~ ✓
- ~~[137 — Implement Leader Rejoin Handler](implementation/137-implement-leader-rejoin.md)~~ ✓
- ~~[138 — Wire Rejoin on Page Load](implementation/138-wire-rejoin-on-load.md)~~ ✓
- ~~[139 — Handle rejoin:state Hydration](implementation/139-handle-rejoin-state.md)~~ ✓
- ~~[140 — Handle rejoin:error Redirect](implementation/140-handle-rejoin-error.md)~~ ✓
- ~~[141 — Add Upload Retry Logic](implementation/141-add-upload-retry.md)~~ ✓
- ~~[142 — Add Upload Failure UI](implementation/142-add-upload-failure-ui.md)~~ ✓
- [143 — Add Lock Timeout on Leader Disconnect](implementation/143-add-lock-timeout.md)
- [144 — Add One-Lock-Per-Leader Enforcement](implementation/144-add-one-lock-per-leader.md)
- [145 — Handle Between-Rounds Rejoin Edge Case](implementation/145-handle-between-rounds-rejoin.md)

## Phase 22: PWA Service Worker (146–148)

- [146 — Create Service Worker](implementation/146-create-service-worker.md)
- [147 — Register Service Worker](implementation/147-register-service-worker.md)
- [148 — Create PWA Icons](implementation/148-create-pwa-icons.md)

## Phase 23: Docker & Deployment (149–153)

- [149 — Create Dockerfile](implementation/149-create-dockerfile.md)
- [150 — Create docker-compose.yml](implementation/150-create-docker-compose.md)
- [151 — Create docker-entrypoint.sh](implementation/151-create-docker-entrypoint.md)
- [152 — Configure S3 Bucket Lifecycle Rule](implementation/152-configure-s3-lifecycle.md)
- [153 — Set Up Production Environment](implementation/153-setup-production-env.md)
