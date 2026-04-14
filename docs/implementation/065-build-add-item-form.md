# Step 065: Build Add Item Form

## Description
Add the "Add Item" form to the item management section. This allows admins to create new nature items for the bingo board pool.

## Requirements
- Add an "Add Item" form below the item list
- Form contains:
  - Text input for item name, placeholder "New item name"
  - "Add" button next to the input
- On submit:
  - Validate name is not empty (disable button or show inline error if empty)
  - Send POST request to `/api/items` with `X-Admin-Pin` header and body `{ "name": "<value>" }`
  - While request is in flight, disable the input and button
- On success (201 response):
  - Clear the input field
  - Call `refreshItems` to re-fetch and update the item list
- On error:
  - Display the error message from the response below the form
  - Keep the input value so the user can correct it
- Form should submit on Enter key press in the input field

## Files to Create/Modify
- `src/app/admin/page.tsx` — add the add item form to the item management section

## Checklist
- [ ] Implemented
- [ ] Verified

## Verification
- **Check**: Form renders with input and Add button
- **Check**: Submitting creates a new item and refreshes the list
- **Check**: Input is cleared after successful creation
- **Check**: Empty name submission is prevented
- **Check**: Error messages are displayed on failure

## Commit
`feat(admin): build add item form for item pool management`
