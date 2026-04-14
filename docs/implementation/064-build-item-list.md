# Step 064: Build Item List in Admin Page

## Description

Build the item pool list section within the admin page. This displays all items from the database and forms the foundation for the item management CRUD operations.

## Requirements

- Create an `ItemList` component (can be in admin page file or separate component file)
- Receives `adminPin: string` as prop
- On mount, fetch items from GET `/api/items` with `X-Admin-Pin` header
- Store items in component state as an array of `{ id: string; name: string; isTemplate: boolean }`
- Display each item in a scrollable list:
  - Item name as text
  - If `isTemplate` is true, show a visual badge/indicator (e.g., "Template" badge with distinct styling)
- If items array is empty, show "No items yet" placeholder text
- If the fetch fails, show an error message
- Expose a `refreshItems` function that re-fetches the list (will be called by add/edit/delete operations)
- List container should have a max height and scroll overflow for long lists
- Use shadcn UI components (Badge, ScrollArea) where available

## Files to Create/Modify

- `src/app/admin/page.tsx` — add the item list section to the admin interface

## Checklist

- [ ] Implemented
- [ ] Verified

## Verification

- **Check**: Items are fetched on mount and displayed in a list
- **Check**: Template items show a "Template" badge
- **Check**: Empty state shows "No items yet" message
- **Check**: List is scrollable when there are many items
- **Command**: `curl -H "X-Admin-Pin: $ADMIN_PIN" http://localhost:3000/api/items`

## Commit

`feat(admin): build item pool list with template indicators`
