# Boards API Documentation

## Overview

The Boards API provides endpoints for managing enhanced Kanban boards with custom columns, WIP limits, analytics, and export functionality.

## Base URL

```
https://your-project.supabase.co/rest/v1
```

## Authentication

All requests require authentication using Supabase Auth. Include the `Authorization` header with the user's JWT token.

## Endpoints

### Boards

#### GET /boards

Retrieves all boards for the authenticated user.

**Headers:**

```
Authorization: Bearer <jwt_token>
apikey: <your_supabase_anon_key>
```

**Response:**

```json
{
  "data": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "name": "string",
      "description": "string | null",
      "is_default": "boolean",
      "is_archived": "boolean",
      "created_at": "timestamp",
      "updated_at": "timestamp"
    }
  ]
}
```

#### GET /boards?id=eq.{id}

Retrieves a specific board by ID.

**Parameters:**

- `id` (query): Board UUID

**Headers:**

```
Authorization: Bearer <jwt_token>
apikey: <your_supabase_anon_key>
```

**Response:**

```json
{
  "data": {
    "id": "uuid",
    "user_id": "uuid",
    "name": "string",
    "description": "string | null",
    "is_default": "boolean",
    "is_archived": "boolean",
    "created_at": "timestamp",
    "updated_at": "timestamp"
  }
}
```

#### POST /boards

Creates a new board.

**Headers:**

```
Authorization: Bearer <jwt_token>
apikey: <your_supabase_anon_key>
Content-Type: application/json
```

**Request Body:**

```json
{
  "name": "string",
  "description": "string | null",
  "is_default": "boolean",
  "is_archived": "boolean"
}
```

**Response:**

```json
{
  "data": {
    "id": "uuid",
    "user_id": "uuid",
    "name": "string",
    "description": "string | null",
    "is_default": "boolean",
    "is_archived": "boolean",
    "created_at": "timestamp",
    "updated_at": "timestamp"
  }
}
```

#### PATCH /boards?id=eq.{id}

Updates an existing board.

**Parameters:**

- `id` (query): Board UUID

**Headers:**

```
Authorization: Bearer <jwt_token>
apikey: <your_supabase_anon_key>
Content-Type: application/json
```

**Request Body:**

```json
{
  "name": "string",
  "description": "string | null",
  "is_default": "boolean",
  "is_archived": "boolean"
}
```

**Response:**

```json
{
  "data": {
    "id": "uuid",
    "user_id": "uuid",
    "name": "string",
    "description": "string | null",
    "is_default": "boolean",
    "is_archived": "boolean",
    "created_at": "timestamp",
    "updated_at": "timestamp"
  }
}
```

#### DELETE /boards?id=eq.{id}

Deletes a board and all associated data (columns, settings, analytics).

**Parameters:**

- `id` (query): Board UUID

**Headers:**

```
Authorization: Bearer <jwt_token>
apikey: <your_supabase_anon_key>
```

**Response:**

```json
{
  "data": null
}
```

### Board Columns

#### GET /board_columns

Retrieves all columns for a specific board.

**Parameters:**

- `board_id` (query): Board UUID

**Headers:**

```
Authorization: Bearer <jwt_token>
apikey: <your_supabase_anon_key>
```

**Response:**

```json
{
  "data": [
    {
      "id": "uuid",
      "board_id": "uuid",
      "user_id": "uuid",
      "name": "string",
      "color": "string",
      "position": "number",
      "wip_limit": "number",
      "is_default": "boolean",
      "is_archived": "boolean",
      "created_at": "timestamp",
      "updated_at": "timestamp"
    }
  ]
}
```

#### GET /board_columns?id=eq.{id}

Retrieves a specific column by ID.

**Parameters:**

- `id` (query): Column UUID

**Headers:**

```
Authorization: Bearer <jwt_token>
apikey: <your_supabase_anon_key>
```

**Response:**

```json
{
  "data": {
    "id": "uuid",
    "board_id": "uuid",
    "user_id": "uuid",
    "name": "string",
    "color": "string",
    "position": "number",
    "wip_limit": "number",
    "is_default": "boolean",
    "is_archived": "boolean",
    "created_at": "timestamp",
    "updated_at": "timestamp"
  }
}
```

#### POST /board_columns

Creates a new column for a board.

**Headers:**

```
Authorization: Bearer <jwt_token>
apikey: <your_supabase_anon_key>
Content-Type: application/json
```

**Request Body:**

```json
{
  "board_id": "uuid",
  "user_id": "uuid",
  "name": "string",
  "color": "string",
  "position": "number",
  "wip_limit": "number",
  "is_default": "boolean",
  "is_archived": "boolean"
}
```

**Response:**

```json
{
  "data": {
    "id": "uuid",
    "board_id": "uuid",
    "user_id": "uuid",
    "name": "string",
    "color": "string",
    "position": "number",
    "wip_limit": "number",
    "is_default": "boolean",
    "is_archived": "boolean",
    "created_at": "timestamp",
    "updated_at": "timestamp"
  }
}
```

#### PATCH /board_columns?id=eq.{id}

Updates an existing column.

**Parameters:**

- `id` (query): Column UUID

**Headers:**

```
Authorization: Bearer <jwt_token>
apikey: <your_supabase_anon_key>
Content-Type: application/json
```

**Request Body:**

```json
{
  "name": "string",
  "color": "string",
  "wip_limit": "number",
  "is_archived": "boolean"
}
```

**Response:**

```json
{
  "data": {
    "id": "uuid",
    "board_id": "uuid",
    "user_id": "uuid",
    "name": "string",
    "color": "string",
    "position": "number",
    "wip_limit": "number",
    "is_default": "boolean",
    "is_archived": "boolean",
    "created_at": "timestamp",
    "updated_at": "timestamp"
  }
}
```

#### POST /board_columns/bulk_reorder

Reorders columns in a board.

**Headers:**

```
Authorization: Bearer <jwt_token>
apikey: <your_supabase_anon_key>
Content-Type: application/json
```

**Request Body:**

```json
{
  "board_id": "uuid",
  "column_orders": [
    {
      "id": "uuid",
      "position": 1
    },
    {
      "id": "uuid",
      "position": 2
    }
  ]
}
```

**Response:**

```json
{
  "data": [
    {
      "id": "uuid",
      "board_id": "uuid",
      "user_id": "uuid",
      "name": "string",
      "color": "string",
      "position": "number",
      "wip_limit": "number",
      "is_default": "boolean",
      "is_archived": "boolean",
      "created_at": "timestamp",
      "updated_at": "timestamp"
    }
  ]
}
```

#### DELETE /board_columns?id=eq.{id}

Deletes a column (soft delete by setting `is_archived` to true).

**Parameters:**

- `id` (query): Column UUID

**Headers:**

```
Authorization: Bearer <jwt_token>
apikey: <your_supabase_anon_key>
```

**Response:**

```json
{
  "data": {
    "id": "uuid",
    "board_id": "uuid",
    "user_id": "uuid",
    "name": "string",
    "color": "string",
    "position": "number",
    "wip_limit": "number",
    "is_default": "boolean",
    "is_archived": true,
    "created_at": "timestamp",
    "updated_at": "timestamp"
  }
}
```

### Board Settings

#### GET /board_settings

Retrieves settings for a specific board.

**Parameters:**

- `board_id` (query): Board UUID

**Headers:**

```
Authorization: Bearer <jwt_token>
apikey: <your_supabase_anon_key>
```

**Response:**

```json
{
  "data": {
    "id": "uuid",
    "board_id": "uuid",
    "user_id": "uuid",
    "theme": "string",
    "compact_mode": "boolean",
    "show_empty_columns": "boolean",
    "show_column_counts": "boolean",
    "enable_animations": "boolean",
    "auto_archive_days": "number",
    "created_at": "timestamp",
    "updated_at": "timestamp"
  }
}
```

#### POST /board_settings

Creates settings for a board (automatically created when board is created).

**Headers:**

```
Authorization: Bearer <jwt_token>
apikey: <your_supabase_anon_key>
Content-Type: application/json
```

**Request Body:**

```json
{
  "board_id": "uuid",
  "user_id": "uuid",
  "theme": "string",
  "compact_mode": "boolean",
  "show_empty_columns": "boolean",
  "show_column_counts": "boolean",
  "enable_animations": "boolean",
  "auto_archive_days": "number"
}
```

**Response:**

```json
{
  "data": {
    "id": "uuid",
    "board_id": "uuid",
    "user_id": "uuid",
    "theme": "string",
    "compact_mode": "boolean",
    "show_empty_columns": "boolean",
    "show_column_counts": "boolean",
    "enable_animations": "boolean",
    "auto_archive_days": "number",
    "created_at": "timestamp",
    "updated_at": "timestamp"
  }
}
```

#### PATCH /board_settings?id=eq.{id}

Updates board settings.

**Parameters:**

- `id` (query): Settings UUID

**Headers:**

```
Authorization: Bearer <jwt_token>
apikey: <your_supabase_anon_key>
Content-Type: application/json
```

**Request Body:**

```json
{
  "theme": "string",
  "compact_mode": "boolean",
  "show_empty_columns": "boolean",
  "show_column_counts": "boolean",
  "enable_animations": "boolean",
  "auto_archive_days": "number"
}
```

**Response:**

```json
{
  "data": {
    "id": "uuid",
    "board_id": "uuid",
    "user_id": "uuid",
    "theme": "string",
    "compact_mode": "boolean",
    "show_empty_columns": "boolean",
    "show_column_counts": "boolean",
    "enable_animations": "boolean",
    "auto_archive_days": "number",
    "created_at": "timestamp",
    "updated_at": "timestamp"
  }
}
```

### Board Analytics

#### GET /board_analytics

Retrieves analytics for a board.

**Parameters:**

- `board_id` (query): Board UUID
- `start_date` (query, optional): Start date (YYYY-MM-DD)
- `end_date` (query, optional): End date (YYYY-MM-DD)

**Headers:**

```
Authorization: Bearer <jwt_token>
apikey: <your_supabase_anon_key>
```

**Response:**

```json
{
  "data": [
    {
      "id": "uuid",
      "board_id": "uuid",
      "user_id": "uuid",
      "column_id": "uuid",
      "metric_date": "string",
      "application_count": "number",
      "created_at": "timestamp"
    }
  ]
}
```

#### POST /board_analytics

Updates analytics for a board and column.

**Headers:**

```
Authorization: Bearer <jwt_token>
apikey: <your_supabase_anon_key>
Content-Type: application/json
```

**Request Body:**

```json
{
  "board_id": "uuid",
  "column_id": "uuid",
  "metric_date": "string",
  "application_count": "number"
}
```

**Response:**

```json
{
  "data": {
    "id": "uuid",
    "board_id": "uuid",
    "user_id": "uuid",
    "column_id": "uuid",
    "metric_date": "string",
    "application_count": "number",
    "created_at": "timestamp"
  }
}
```

### RPC Functions

#### POST /rpc/get_or_create_default_board

Gets or creates the default board for a user.

**Headers:**

```
Authorization: Bearer <jwt_token>
apikey: <your_supabase_anon_key>
Content-Type: application/json
```

**Request Body:**

```json
{
  "target_user_id": "uuid"
}
```

**Response:**

```json
{
  "data": "uuid" // Board ID
}
```

#### POST /rpc/migrate_existing_user_to_kanban_v2

Migrates an existing user to the new kanban board system.

**Headers:**

```
Authorization: Bearer <jwt_token>
apikey: <your_supabase_anon_key>
Content-Type: application/json
```

**Request Body:**

```json
{
  "target_user_id": "uuid"
}
```

**Response:**

```json
{
  "data": "uuid" // Board ID
}
```

## Data Types

### Board

```typescript
interface Board {
  id: string
  user_id: string
  name: string
  description: string | null
  is_default: boolean
  is_archived: boolean
  created_at: string
  updated_at: string
}
```

### BoardColumn

```typescript
interface BoardColumn {
  id: string
  board_id: string
  user_id: string
  name: string
  color: string
  position: number
  wip_limit: number
  is_default: boolean
  is_archived: boolean
  created_at: string
  updated_at: string
}
```

### BoardSettings

```typescript
interface BoardSettings {
  id: string
  board_id: string
  user_id: string
  theme: string
  compact_mode: boolean
  show_empty_columns: boolean
  show_column_counts: boolean
  enable_animations: boolean
  auto_archive_days: number
  created_at: string
  updated_at: string
}
```

### BoardAnalytics

```typescript
interface BoardAnalytics {
  id: string
  board_id: string
  user_id: string
  column_id: string
  metric_date: string
  application_count: number
  created_at: string
}
```

## Error Handling

The API returns standard HTTP status codes:

- `200 OK`: Request successful
- `201 Created`: Resource created successfully
- `400 Bad Request`: Invalid request data
- `401 Unauthorized`: Authentication required or invalid
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `422 Unprocessable Entity`: Validation error
- `500 Internal Server Error`: Server error

Error responses include details:

```json
{
  "error": {
    "message": "Error description",
    "code": "ERROR_CODE",
    "details": {}
  }
}
```

## Rate Limiting

API requests are subject to rate limiting:

- 100 requests per minute per user
- 1000 requests per hour per user

## Examples

### Creating a New Board

```javascript
const response = await fetch('/rest/v1/boards', {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${jwtToken}`,
    apikey: supabaseAnonKey,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    name: 'Job Applications',
    description: 'Track job search progress',
    is_default: false,
    is_archived: false,
  }),
})

const board = await response.json()
```

### Adding a Column

```javascript
const response = await fetch('/rest/v1/board_columns', {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${jwtToken}`,
    apikey: supabaseAnonKey,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    board_id: boardId,
    user_id: userId,
    name: 'Technical Assessment',
    color: '#ef4444',
    position: 3,
    wip_limit: 5,
    is_default: false,
    is_archived: false,
  }),
})

const column = await response.json()
```

### Getting Board Analytics

```javascript
const response = await fetch('/rest/v1/board_analytics?board_id=eq.' + boardId, {
  headers: {
    Authorization: `Bearer ${jwtToken}`,
    apikey: supabaseAnonKey,
  },
})

const analytics = await response.json()
```

## SDK Usage

When using the provided SDK functions:

```javascript
import {
  getBoards,
  createBoard,
  getBoardColumns,
  createBoardColumn,
  getBoardAnalytics,
} from '@/lib/api/boards'

// Get all boards
const boards = await getBoards(supabase)

// Create a new board
const newBoard = await createBoard(supabase, {
  name: 'Marketing Jobs',
  description: 'Marketing positions',
})

// Get columns for a board
const columns = await getBoardColumns(supabase, boardId)

// Create a new column
const newColumn = await createBoardColumn(supabase, {
  board_id: boardId,
  user_id: userId,
  name: 'Phone Screen',
  color: '#8b5cf6',
  position: 2,
  wip_limit: 3,
  is_default: false,
  is_archived: false,
})

// Get analytics
const analytics = await getBoardAnalytics(supabase, boardId, '2024-01-01', '2024-01-31')
```
