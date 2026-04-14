# Step 066: Build Inline Edit Item Controls

## Description
Add inline editing capability to each item in the item list. Clicking an item name enters edit mode with a text input, allowing the admin to rename items in place.

## Requirements
- Track an `editingItemId: string | null` state in the item list component
- For each item in the list:
  - When NOT editing (editingItemId !== item.id): display the item name as clickable text; clicking sets `editingItemId` to this item's id
  - When editing (editingItemId === item.id): replace the name text with a text input pre-filled with the current name
    - Show "Save" button next to the input
    - Show "Cancel" button that reverts to display mode (sets editingItemId to null)
- On Save click:
  - Validate name is not empty after trimming
  - Send PUT request to `/api/items/[itemId]` with `X-Admin-Pin` header and body `{ "name": "<value>" }`
  - While request is in flight, disable the input and buttons
  - On success: call `refreshItems` to update the list, exit edit mode
  - On error: display error message, keep edit mode open
- Pressing Enter in the edit input triggers Save
- Pressing Escape in the edit input triggers Cancel

## Files to Create/Modify
- `src/app/admin/page.tsx` — add inline edit controls to item list items

## Checklist
- [ ] Implemented
- [ ] Verified

## Verification
- **Check**: Clicking an item name enters edit mode with pre-filled input
- **Check**: Save sends PUT request and refreshes list on success
- **Check**: Cancel reverts to display mode without API call
- **Check**: Enter key triggers save, Escape key triggers cancel
- **Check**: Error messages are shown when update fails

## Commit
`feat(admin): add inline edit controls to item list`
