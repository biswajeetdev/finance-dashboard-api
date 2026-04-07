# Finance Dashboard API

A RESTful backend for a multi-role finance dashboard system. Built as part of the Zorvyn FinTech Backend Developer Intern assessment.

---

## Overview

This API powers a finance dashboard where users with different roles interact with financial records. It covers:

- JWT-based authentication with bcrypt password hashing
- Role-based access control (Viewer / Analyst / Admin)
- Full CRUD for financial records with filtering, search, and pagination
- Dashboard summary endpoints with aggregated analytics and monthly trends
- User management with soft deactivation
- Category management
- Input validation, structured error responses, and rate limiting

---

## Stack

| Layer        | Technology                              |
|-------------|------------------------------------------|
| Runtime      | Node.js                                 |
| Framework    | Express 5                               |
| Database     | PostgreSQL 14+                          |
| ORM          | Knex.js                                 |
| Auth         | JSON Web Tokens + bcryptjs              |
| Validation   | Joi                                     |
| Security     | Helmet, CORS, express-rate-limit        |

---

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 14+

### 1. Clone and install

```bash
git clone https://github.com/thisisbiswajeetkumar/finance-dashboard-api.git
cd finance-dashboard-api
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env`:

```env
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=finance_dashboard
DB_USER=your_pg_user
DB_PASSWORD=your_pg_password
JWT_SECRET=a_long_random_secret_min_32_chars
JWT_EXPIRES_IN=24h
NODE_ENV=development
```

### 3. Create the database

```bash
psql -U postgres -c "CREATE DATABASE finance_dashboard;"
```

### 4. Run migrations and seed

```bash
npm run migrate    # creates users, categories, financial_records tables
npm run seed       # inserts 3 test users and 20 sample records
```

### 5. Start the server

```bash
npm run dev    # development with auto-reload
npm start      # production
```

Server: `http://localhost:3000`  
Health check: `GET /health`

---

## Test Credentials

Seeded automatically by `npm run seed`:

| Role    | Email                 | Password     |
|---------|-----------------------|--------------|
| Admin   | admin@finance.com     | Admin@123    |
| Analyst | analyst@finance.com   | Analyst@123  |
| Viewer  | viewer@finance.com    | Viewer@123   |

---

## Roles and Permissions

| Permission       | Viewer | Analyst | Admin |
|-----------------|--------|---------|-------|
| read:records    | ✓      | ✓       | ✓     |
| read:dashboard  | ✓      | ✓       | ✓     |
| write:records   |        | ✓       | ✓     |
| read:users      |        | ✓       | ✓     |
| write:users     |        |         | ✓     |
| delete:records  |        |         | ✓     |
| delete:users    |        |         | ✓     |

Permissions are enforced in `src/middleware/rbac.js`. Each route declares the required permission(s); the middleware checks the role embedded in the JWT and rejects with `403` if unmatched.

---

## API Reference

All protected endpoints require:
```
Authorization: Bearer <token>
```

Rate limit: **100 requests per 15 minutes** per IP (returns `429` when exceeded).

---

### Auth

#### `POST /api/auth/register`

Create a new account. Default role is `viewer`.

```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "Secret@123",
  "role": "viewer"
}
```

Password rules: 8+ characters, at least one uppercase, one lowercase, one digit.

**Responses:** `201 Created` | `400 Validation error` | `409 Email already exists`

---

#### `POST /api/auth/login`

```json
{ "email": "admin@finance.com", "password": "Admin@123" }
```

**Response `200`:**
```json
{
  "message": "Login successful.",
  "token": "<jwt>",
  "user": { "id": "...", "name": "Admin User", "email": "...", "role": "admin" }
}
```

**Responses:** `200` | `401 Invalid credentials` | `403 Account deactivated`

---

#### `GET /api/auth/me` 🔒

Returns the authenticated user's profile.

---

### Users

Requires `read:users` (analyst + admin). Write/delete requires admin.

#### `GET /api/users` 🔒

| Param    | Type   | Description                              |
|----------|--------|------------------------------------------|
| `search` | string | Name or email (case-insensitive)         |
| `role`   | string | `viewer` \| `analyst` \| `admin`         |
| `status` | string | `active` \| `inactive`                   |
| `page`   | number | Default: 1                               |
| `limit`  | number | Default: 20, max: 100                    |

**Response:**
```json
{
  "data": [ { "id": "...", "name": "...", "role": "admin", "status": "active" } ],
  "pagination": { "total": 5, "page": 1, "limit": 20, "total_pages": 1 }
}
```

#### `GET /api/users/:id` 🔒
#### `PUT /api/users/:id` 🔒 (admin)

Body (at least one field):
```json
{ "name": "New Name", "role": "analyst", "status": "inactive" }
```

#### `DELETE /api/users/:id` 🔒 (admin)

Soft-deactivates (`status = inactive`). Cannot deactivate your own account.

---

### Financial Records

#### `GET /api/records` 🔒

| Param         | Type   | Description                                |
|---------------|--------|--------------------------------------------|
| `type`        | string | `income` \| `expense`                      |
| `category_id` | number | Filter by category                         |
| `start_date`  | date   | ISO 8601 (e.g. `2025-01-01`)              |
| `end_date`    | date   | ISO 8601                                   |
| `search`      | string | Full-text search on notes                  |
| `sort`        | string | `date` \| `amount` \| `created_at`         |
| `order`       | string | `asc` \| `desc` (default: `desc`)          |
| `page`        | number | Default: 1                                 |
| `limit`       | number | Default: 20, max: 100                      |

**Response:**
```json
{
  "data": [
    {
      "id": "...",
      "amount": "75000.00",
      "type": "income",
      "date": "2025-01-01",
      "notes": "Monthly salary",
      "category": "Salary",
      "created_by": "Admin User"
    }
  ],
  "pagination": { "total": 20, "page": 1, "limit": 20, "total_pages": 1 }
}
```

#### `GET /api/records/:id` 🔒
#### `POST /api/records` 🔒 (analyst / admin)

```json
{
  "amount": 5000.00,
  "type": "expense",
  "category_id": 3,
  "date": "2025-04-01",
  "notes": "Monthly groceries"
}
```

**Responses:** `201 Created` | `400 Category not found` | `400 Validation error`

#### `PUT /api/records/:id` 🔒 (analyst / admin)

Partial update — all fields optional, at least one required.

#### `DELETE /api/records/:id` 🔒 (admin)

Soft-deletes the record (`is_deleted = true`). The record is excluded from all queries but preserved in the database.

---

### Dashboard

#### `GET /api/dashboard/summary` 🔒

Available to all authenticated roles.

**Response:**
```json
{
  "summary": {
    "total_income": 340000,
    "total_expenses": 88000,
    "net_balance": 252000,
    "total_records": 20
  },
  "category_breakdown": [
    { "category": "Salary", "type": "income", "total": "300000.00", "count": "4" }
  ],
  "monthly_trends": [
    { "month": "2025-01", "type": "income", "total": "85000.00" },
    { "month": "2025-01", "type": "expense", "total": "22000.00" }
  ],
  "recent_activity": [
    { "id": "...", "amount": "15000.00", "type": "expense", "category": "Rent", "created_by": "Admin User" }
  ]
}
```

---

### Categories

#### `GET /api/categories` 🔒

Any authenticated user. Returns `[{ "id": 1, "name": "Salary" }, ...]`

#### `POST /api/categories` 🔒 (admin)

```json
{ "name": "Healthcare" }
```

**Responses:** `201 Created` | `400 Name required` | `409 Already exists`

#### `DELETE /api/categories/:id` 🔒 (admin)

Hard-deletes the category. Records that referenced it retain their data with `category_id` set to `NULL` (via `ON DELETE SET NULL`).

---

## Error Response Format

All errors follow a consistent shape:

```json
{ "error": "Human-readable message." }
```

Validation errors include field-level detail:

```json
{
  "error": "Validation failed",
  "details": [
    { "field": "amount", "message": "\"amount\" is required" },
    { "field": "date",   "message": "\"date\" is required" }
  ]
}
```

RBAC rejections include the required permission and the caller's role:

```json
{
  "error": "Forbidden. You do not have permission to perform this action.",
  "required": ["write:records"],
  "yourRole": "viewer"
}
```

---

## Data Model

```
users
  id            UUID         PK, gen_random_uuid()
  name          VARCHAR(100)
  email         VARCHAR(255) UNIQUE
  password_hash VARCHAR
  role          ENUM         viewer | analyst | admin  (default: viewer)
  status        ENUM         active | inactive         (default: active)
  created_at    TIMESTAMP
  updated_at    TIMESTAMP

categories
  id         SERIAL       PK
  name       VARCHAR(100) UNIQUE
  created_at TIMESTAMP
  updated_at TIMESTAMP

financial_records
  id          UUID         PK, gen_random_uuid()
  amount      DECIMAL(12,2)
  type        ENUM         income | expense
  category_id INT          FK → categories.id  ON DELETE SET NULL
  created_by  UUID         FK → users.id        ON DELETE SET NULL
  date        DATE
  notes       TEXT         nullable
  is_deleted  BOOLEAN      default false
  created_at  TIMESTAMP
  updated_at  TIMESTAMP
```

---

## Project Structure

```
finance-dashboard-api/
├── src/
│   ├── app.js                    Express app, middleware, route mounting
│   ├── config/
│   │   └── database.js           Knex connection (env-aware)
│   ├── middleware/
│   │   ├── auth.js               JWT verification → sets req.user
│   │   ├── rbac.js               Permission matrix + enforcement
│   │   └── validate.js           Joi schema validation middleware
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── users.routes.js
│   │   ├── records.routes.js
│   │   ├── dashboard.routes.js
│   │   └── categories.routes.js
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── users.controller.js
│   │   ├── records.controller.js
│   │   ├── dashboard.controller.js
│   │   └── categories.controller.js
│   ├── validators/
│   │   ├── auth.validators.js
│   │   ├── user.validators.js
│   │   └── record.validators.js
│   └── db/
│       ├── migrations/
│       │   ├── ..._001_create_users.js
│       │   ├── ..._002_create_categories.js
│       │   └── ..._003_create_financial_records.js
│       └── seeds/
│           └── 001_initial_data.js
├── knexfile.js                   DB config (development / test / production)
├── .env.example
├── test.http                     REST client test file (VS Code REST Client)
└── package.json
```

---

## npm Scripts

| Script              | Description                          |
|---------------------|--------------------------------------|
| `npm run dev`       | Start with nodemon (auto-reload)     |
| `npm start`         | Start for production                 |
| `npm run migrate`   | Run pending migrations               |
| `npm run migrate:rollback` | Roll back last migration batch |
| `npm run seed`      | Seed test data                       |

---

## Assumptions

- **Roles are fixed** at three levels. The permission matrix in `src/middleware/rbac.js` is the single source of truth — adjusting a role's access requires only editing that file.
- **Analysts can create and update records** but not delete them. The rationale: analysts are responsible for data entry and correction; deletion is an admin-level audit action.
- **Soft delete everywhere**: financial records use `is_deleted`, users use `status = inactive`. This preserves historical integrity — a deleted record's `created_by` reference remains meaningful for audit purposes.
- **Password changes are not supported** via the users endpoint. A user must re-register or a dedicated `/auth/change-password` route would be added in a production system.
- **JWT tokens are stateless**. A deactivated user's existing token remains technically valid until expiry (24h). In production, a Redis-backed token blocklist would be added.
- **`category_id` is verified** server-side on record creation (not just at the DB level) to return a `400` with a clear message rather than a constraint error.
- **`page` and `limit`** are clamped (`page ≥ 1`, `1 ≤ limit ≤ 100`) to prevent accidental or malicious large result sets.

---

## Trade-offs

| Decision | Rationale |
|----------|-----------|
| PostgreSQL only | `TO_CHAR`, `gen_random_uuid()`, and `RETURNING` keep queries clean. Portability would require abstracting these. |
| No token blacklist | Keeps the auth layer stateless. Redis blocklist is the natural next step. |
| No audit log table | Out of scope for this assessment. In production, a `record_audit` table journalling every mutation would be added. |
| Hard delete for categories | Categories are reference data managed by admins. Records gracefully handle `NULL` category via `ON DELETE SET NULL`. |
| In-process rate limiting | `express-rate-limit` works per-process. A Redis store would be needed in a multi-instance deployment. |
