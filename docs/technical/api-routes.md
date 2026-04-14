# API Routes

REST endpoints served by Next.js App Router API routes (`src/app/api/`). Used for non-realtime operations.

All routes return JSON. Errors return `{ error: string }` with appropriate HTTP status.

## PIN Validation

### `POST /api/validate`
Validate a PIN and determine role. Used by the landing page (`/`).

**Request:**
```json
{
  "pin": "3847"
}
```

**Response (scout PIN):**
```json
{
  "valid": true,
  "role": "scout",
  "gameId": "clx..."
}
```

**Response (leader PIN):**
```json
{
  "valid": true,
  "role": "leader",
  "gameId": "clx..."
}
```

**Response (invalid):**
```json
{
  "valid": false
}
```

**Notes:**
- Checks both `Game.pin` and `Game.leaderPin` fields
- Only matches active games (not ended/stale)
- No collision between game PINs and leader PINs (enforced at creation time)

## Game Management

### `POST /api/game`
Create a new game session. Protected by `ADMIN_PIN` header.

**Headers:**
```
X-Admin-Pin: <ADMIN_PIN env var>
```

**Request:**
```json
{
  "leaderPin": "8472",
  "boardSize": 25,
  "templateCount": 5
}
```

**Response:**
```json
{
  "gameId": "clx...",
  "pin": "3847",
  "leaderPin": "8472",
  "status": "lobby",
  "boardSize": 25,
  "templateCount": 5
}
```

**Notes:**
- Game PIN is randomly generated 4-digit string
- Leader PIN is provided in the request
- Both PINs checked for collision against active games
- `boardSize` range: 9-25 (default 25)
- `templateCount` range: 0-10 (default 5), must be <= boardSize

---

### `GET /api/game/[gameId]`
Get current game state. Used on reconnect to hydrate full state.

**Response:**
```json
{
  "gameId": "clx...",
  "pin": "3847",
  "status": "active",
  "round": 2,
  "boardSize": 25,
  "templateCount": 5,
  "teams": [
    { "id": "clx...", "name": "Red Rabbits", "colour": "#E03131" }
  ],
  "board": [
    {
      "roundItemId": "clx...",
      "displayName": "Oak leaf",
      "claimedByTeamId": null
    },
    {
      "roundItemId": "clx...",
      "displayName": "Something Red",
      "claimedByTeamId": "clx..."
    }
  ]
}
```

**Notes:**
- Board only returned when status is `active`
- Board uses `displayName` (resolved template names)
- `boardSize` and `templateCount` included for client-side layout/display

## Photo Upload

### `POST /api/upload`
Get a presigned S3 URL for direct photo upload.

**Request:**
```json
{
  "gameId": "clx...",
  "teamId": "clx...",
  "roundItemId": "clx...",
  "contentType": "image/webp"
}
```

**Response:**
```json
{
  "uploadUrl": "https://s3.amazonaws.com/bucket/games/clx.../submissions/clx....webp?...",
  "photoUrl": "https://s3.amazonaws.com/bucket/games/clx.../submissions/clx....webp"
}
```

**Notes:**
- `uploadUrl` is a presigned PUT URL (expires in 5 minutes)
- `photoUrl` is the public read URL (no signing needed)
- S3 key format: `games/{gameId}/submissions/{cuid}.webp`
- Validates that gameId and teamId are valid before generating URL

## Item Management

All item routes protected by `ADMIN_PIN` header.

### `GET /api/items`
Get all items in the pool.

**Response:**
```json
{
  "items": [
    { "id": "clx...", "name": "Oak leaf", "isTemplate": false },
    { "id": "clx...", "name": "Something [colour]", "isTemplate": true }
  ]
}
```

---

### `POST /api/items`
Add a new item to the pool.

**Request:**
```json
{
  "name": "Oak leaf"
}
```

---

### `PUT /api/items/[itemId]`
Update an item.

**Request:**
```json
{
  "name": "Oak tree leaf"
}
```

---

### `DELETE /api/items/[itemId]`
Remove an item from the pool.

**Notes:**
- Cannot delete items that are currently in use in an active round
- Default items can be deleted (they'll be re-created on next seed)
