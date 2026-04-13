# Finance Dashboard API

A role-based REST API backend for a finance dashboard system. Built with Node.js, Express, PostgreSQL, and JWT authentication.

## Features

- JWT authentication with register and login
- Role-based access control — Viewer, Analyst, Admin
- Full CRUD for financial records with soft delete
- Filtering by type, category, date range with pagination
- Dashboard summary — income, expenses, net balance, category breakdown, monthly trends
- Input validation with Joi
- Seed data for instant testing

## Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** PostgreSQL
- **Query Builder:** Knex.js
- **Auth:** JWT + bcrypt
- **Validation:** Joi

## Setup

### 1. Clone and install
```bash
git clone https://github.com/YOUR_USERNAME/finance-dashboard-api
cd finance-dashboard-api
npm install
```

### 2. Configure environment
```bash
cp .env.example .env
# Edit .env with your PostgreSQL credentials
```

### 3. Create database
```bash
psql postgres -c "CREATE DATABASE finance_dashboard;"
```

### 4. Run migrations and seed
```bash
npm run migrate
npm run seed
```

### 5. Start server
```bash
npm run dev
```

Server runs at `http://localhost:3000`

## Test Users

| Email | Password | Role |
|-------|----------|------|
| admin@finance.com | Admin@123 | admin |
| analyst@finance.com | Analyst@123 | analyst |
| viewer@finance.com | Viewer@123 | viewer |

## API Endpoints

### Auth
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /api/auth/register | No | Register user |
| POST | /api/auth/login | No | Login, returns JWT |
| GET | /api/auth/me | Yes | Get current user |

### Records
| Method | Endpoint | Min Role | Description |
|--------|----------|---------|-------------|
| GET | /api/records | Viewer | List with filters + pagination |
| GET | /api/records/:id | Viewer | Get one record |
| POST | /api/records | Analyst | Create record |
| PUT | /api/records/:id | Analyst | Update record |
| DELETE | /api/records/:id | Admin | Soft delete |

### Dashboard
| Method | Endpoint | Min Role | Description |
|--------|----------|---------|-------------|
| GET | /api/dashboard/summary | Viewer | Income, expenses, trends, breakdown |

### Users
| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| GET | /api/users | Admin | List all users |
| PUT | /api/users/:id | Admin | Update user role/status |
| DELETE | /api/users/:id | Admin | Deactivate user |

## Query Parameters — GET /api/records

| Param | Example | Description |
|-------|---------|-------------|
| type | income | Filter by income or expense |
| category_id | 1 | Filter by category |
| start_date | 2025-01-01 | From date |
| end_date | 2025-12-31 | To date |
| page | 1 | Page number |
| limit | 20 | Results per page |
| sort | amount | Sort field |
| order | desc | asc or desc |

## Design Decisions

**Permission-based RBAC:** Permissions defined in one place. Adding a new role means editing one object, not hunting through every route file.

**Soft deletes:** Records are never permanently deleted. Financial audit trails must be preserved.

**Knex over ORM:** Keeps SQL visible. Dashboard aggregations with CASE WHEN and GROUP BY are cleaner without ORM abstraction.

**Vague auth errors:** Login always returns "Invalid email or password" whether the email exists or not. Prevents account enumeration.