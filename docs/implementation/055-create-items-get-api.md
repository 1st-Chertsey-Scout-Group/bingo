# Step 055: Create Items GET API Route

## Description
Create the GET /api/items endpoint for admin item pool management. Returns all items in the database ordered by name, used to populate the item list in the admin interface.

## Requirements
- Create `src/app/api/items/route.ts`
- Export a named `GET` handler
- Check `x-admin-pin` header against `process.env.ADMIN_PIN`; return 401 `{ error: "Unauthorized" }` if invalid or missing
- Query all Item records from the database, ordered by `name` ascending
- Return 200 with `{ items: [{ id: "clx...", name: "Oak leaf", isTemplate: false }] }`
- Each item includes `id`, `name`, and `isTemplate` fields

## Files to Create/Modify
- `src/app/api/items/route.ts` — create the items list endpoint

## Checklist
- [ ] Implemented
- [ ] Verified

## Verification
- **Check**: Returns 401 without valid X-Admin-Pin header
- **Check**: Returns 200 with items array on success
- **Check**: Items are sorted alphabetically by name
- **Command**: `curl -H "X-Admin-Pin: $ADMIN_PIN" http://localhost:3000/api/items`

## Commit
`feat(api): create GET /api/items admin item list endpoint`
