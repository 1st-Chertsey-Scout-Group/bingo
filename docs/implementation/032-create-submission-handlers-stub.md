# Step 032: Create Submission Handlers Stub

## Description

Create the submission sub-handler that will manage photo submission and leader review events. This step creates the skeleton with event listeners registered but empty handler bodies, to be implemented later.

## Requirements

- Create `src/server/socket/submission.ts`
- Export `registerSubmissionHandlers(io: Server, socket: Socket): void`
- Register listener for `submission:submit` event — empty handler body with `// TODO: validate submission, store in DB, notify leaders` comment
- Register listener for `review:open` event — empty handler body with `// TODO: lock submission, send photo to leader` comment
- Register listener for `review:close` event — empty handler body with `// TODO: unlock submission` comment
- Register listener for `review:approve` event — empty handler body with `// TODO: mark approved, update board, notify team` comment
- Register listener for `review:reject` event — empty handler body with `// TODO: mark rejected, notify team` comment
- Use `Server` and `Socket` types from `socket.io`
- Follow project code standards: named exports, no `any`, TypeScript strict

## Files to Create/Modify

- `src/server/socket/submission.ts` — create submission event handler stub

## Checklist

- [ ] Implemented
- [ ] Verified

## Verification

- **Check**: File exports `registerSubmissionHandlers` with correct signature
- **Command**: `cat src/server/socket/submission.ts`
- **Check**: All five event listeners are registered
- **Command**: `grep -cE 'submission:submit|review:open|review:close|review:approve|review:reject' src/server/socket/submission.ts` (should output 5)

## Commit

`feat(socket): add submission handler stub with submit and review listeners`
