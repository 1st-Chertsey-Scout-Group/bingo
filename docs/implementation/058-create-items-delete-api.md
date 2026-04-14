# Step 058: Add Items DELETE API Handler

## Description
Add a DELETE handler to the items/[itemId] route to allow admins to remove items from the pool. Items currently in use in an active game round cannot be deleted.

## Requirements
- Add a named `DELETE` export to `src/app/api/items/[itemId]/route.ts`
- Check `x-admin-pin` header against `process.env.ADMIN_PIN`; return 401 `{ error: "Unauthorized" }` if invalid or missing
- Extract `itemId` from route params
- Query the item by `id`; return 404 `{ error: "Item not found" }` if it does not exist
- Check if the item is referenced by any RoundItem where the associated Game has `status === 'active'`
  - Query RoundItem where `itemId` matches AND the related game's status is `'active'`
  - If any such RoundItem exists, return 409 `{ error: "Cannot delete item that is in use in an active round" }`
- Delete the Item record
- Return 204 with no body

## Files to Create/Modify
- `src/app/api/items/[itemId]/route.ts` — add DELETE handler to existing item route file

## Checklist
- [ ] Implemented
- [ ] Verified

## Verification
- **Check**: Returns 401 without valid X-Admin-Pin header
- **Check**: Returns 404 for non-existent itemId
- **Check**: Returns 409 when item is in use in an active round
- **Check**: Returns 204 on successful deletion
- **Check**: Item is removed from the database after deletion

## Commit
`feat(api): add DELETE /api/items/[itemId] admin item deletion endpoint`
