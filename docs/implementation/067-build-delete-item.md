# Step 067: Build Delete Item with Confirmation

## Description

Add a delete button to each item in the list with a confirmation dialog. Items in use in active game rounds are protected from deletion with a clear error message.

## Requirements

- Add a delete button (trash icon or "Delete" text) to each item row in the list
- Clicking the delete button opens a shadcn Dialog (AlertDialog) confirmation:
  - Title: "Delete item"
  - Description: "Are you sure you want to delete \"[item name]\"? This action cannot be undone."
  - "Cancel" button to dismiss
  - "Delete" button (destructive variant) to confirm
- On confirm:
  - Send DELETE request to `/api/items/[itemId]` with `X-Admin-Pin` header
  - While request is in flight, disable the Delete button in the dialog
  - On success (204): close dialog, call `refreshItems` to update the list
  - On 409 error: close dialog, show an error toast or inline message "Cannot delete item that is in use in an active round"
  - On other errors: close dialog, show generic error message
- Use shadcn AlertDialog component for the confirmation dialog
- Use shadcn toast (if available) or inline error message for the 409 feedback

## Files to Create/Modify

- `src/app/admin/page.tsx` — add delete button and confirmation dialog to item list

## Checklist

- [ ] Implemented
- [ ] Verified

## Verification

- **Check**: Delete button appears on each item row
- **Check**: Clicking delete opens confirmation dialog
- **Check**: Cancel dismisses dialog without API call
- **Check**: Confirm sends DELETE request and refreshes list on success
- **Check**: 409 response shows "in use" error message
- **Check**: Item is removed from list after successful deletion

## Commit

`feat(admin): add delete item button with confirmation dialog`
