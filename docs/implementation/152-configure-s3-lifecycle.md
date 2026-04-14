# Step 152: Configure S3 Lifecycle Rule

> **MANUAL STEP** — requires human action.

## Description
Configure an S3 lifecycle rule to automatically delete uploaded photos after 7 days. This handles cleanup without any app-side deletion code — photos under the `games/` prefix are expired by AWS automatically.

## Requirements
- In the AWS Console (or via AWS CLI), create a lifecycle rule on the S3 bucket used for photo uploads
- Rule configuration:
  - **Rule name**: `delete-game-photos-after-7-days` (or similar descriptive name)
  - **Prefix filter**: `games/`
  - **Action**: Expiration — delete objects after 7 days
  - **Status**: Enabled
- All photos are uploaded under the `games/` prefix, so this rule covers all game-related uploads
- No app-side deletion code is needed — AWS handles cleanup on the configured schedule
- AWS CLI alternative:
  ```bash
  aws s3api put-bucket-lifecycle-configuration \
    --bucket YOUR_BUCKET_NAME \
    --lifecycle-configuration '{
      "Rules": [
        {
          "ID": "delete-game-photos-after-7-days",
          "Prefix": "games/",
          "Status": "Enabled",
          "Expiration": {
            "Days": 7
          }
        }
      ]
    }'
  ```
- Verify the rule is applied after creation

## Files to Create/Modify
- No application files to modify — this is an AWS infrastructure configuration

## Checklist
- [ ] Implemented
- [ ] Verified

## Verification
- **Check**: Lifecycle rule exists on the bucket with prefix `games/` and 7-day expiration
- **Command**: `aws s3api get-bucket-lifecycle-configuration --bucket YOUR_BUCKET_NAME` — should show the rule
- **Check**: Upload a test file under `games/test.txt`, verify it still exists after 1 day but is deleted after 7 days (or trust AWS documentation that the rule works)
- **Check**: Objects outside the `games/` prefix are NOT affected by this rule

## Commit
`chore(infra): configure S3 lifecycle rule for 7-day photo expiration`
