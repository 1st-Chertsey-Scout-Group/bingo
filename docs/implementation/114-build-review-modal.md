# Step 114: Build ReviewModal Component

## Description
Create the ReviewModal component that overlays the leader's board, showing the submitted photo and approve/reject controls. This is the primary interface leaders use to judge scout submissions.

## Requirements
- Create `src/components/ReviewModal.tsx`
- Overlay on top of the board (board remains visible beneath for spatial context)
- Use shadcn Dialog or a custom overlay with backdrop
- **Content**:
  - Large photo display (`img` tag with `photoUrl` as src, object-fit contain, max height ~60vh)
  - Item display name (text above or below photo)
  - Team name with team colour badge (small coloured circle or pill)
  - "Approve" button: green, large, prominent (e.g. `bg-green-600 text-white`)
  - "Reject" button: red, large (e.g. `bg-red-600 text-white`)
  - Close/dismiss button (X icon in top-right corner)
- **Props**: `submission: SubmissionForReview`, `onApprove: (submissionId: string) => void`, `onReject: (submissionId: string) => void`, `onDismiss: () => void`, `open: boolean`
- Board interaction is blocked while modal is open (handled by the overlay backdrop)
- Buttons should be large enough for easy tapping on mobile/tablet

## Files to Create/Modify
- `src/components/ReviewModal.tsx` — New component with photo display, team info, and approve/reject/dismiss controls

## Checklist
- [ ] Implemented
- [ ] Verified

## Verification
- **Check**: Modal displays the photo at a usable size
- **Check**: Team name and colour badge are clearly visible
- **Check**: Approve and Reject buttons are large and easy to tap
- **Check**: Dismiss (X) button closes the modal
- **Check**: Board behind the modal is visible but not interactive

## Commit
`feat(client): build ReviewModal with photo display and approve/reject controls`
