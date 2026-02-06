# Shopping List Backend API

Node.js/Express backend API with PostgreSQL for the collaborative shopping list mobile app.

## Features

- 🔐 JWT-based authentication (email/password)
- 📝 CRUD operations for shopping lists and items
- 👥 List sharing with role-based access control (owner/editor/viewer)
- 🔍 Autocomplete suggestions based on usage history
- ✅ Check/uncheck items
- 🌐 Multi-user collaboration on shared lists
- 🔒 Security: rate limiting, helmet, input validation

## Prerequisites

- Node.js 18+ and npm
- PostgreSQL 12+

## Setup Instructions

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Setup PostgreSQL Database

Create a new PostgreSQL database:

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE shopping_list;

# Exit psql
\q
```

### 3. Run Database Migrations

```bash
# Set DATABASE_URL environment variable (or use values from .env)
export DATABASE_URL="postgresql://postgres:password@localhost:5432/shopping_list"

# Run migrations
npm run migrate
```

Or manually run the migration file:

```bash
psql -U postgres -d shopping_list -f migrations/001_initial_schema.sql
```

### 4. Configure Environment Variables

Copy `.env.example` to `.env` and update with your values:

```bash
cp .env.example .env
```

Edit `.env`:

```env
PORT=3000
NODE_ENV=development

DATABASE_URL=postgresql://postgres:your_password@localhost:5432/shopping_list
DB_HOST=localhost
DB_PORT=5432
DB_NAME=shopping_list
DB_USER=postgres
DB_PASSWORD=your_password

# Generate secure random strings for production (at least 32 characters)
JWT_SECRET=your_super_secret_jwt_key_change_in_production_min_32_chars
JWT_REFRESH_SECRET=your_refresh_secret_key_also_change_this_min_32_chars
JWT_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d

# Comma-separated list of allowed origins
ALLOWED_ORIGINS=http://localhost:19000,exp://localhost:19000
```

### 5. Start the Server

**Development mode (with hot reload):**

```bash
npm run dev
```

**Production mode:**

```bash
npm run build
npm start
```

Server will start on `http://localhost:3000`

## API Endpoints

### Authentication

```
POST   /api/auth/register      - Register new user
POST   /api/auth/login         - Login (returns JWT tokens)
POST   /api/auth/refresh       - Refresh access token
GET    /api/auth/me            - Get current user profile
PUT    /api/auth/me            - Update user profile
PUT    /api/auth/me/password   - Change password
```

### Shopping Lists

```
GET    /api/lists              - Get all lists (owned + shared)
POST   /api/lists              - Create new list
GET    /api/lists/:id          - Get list details
PUT    /api/lists/:id          - Update list name
DELETE /api/lists/:id          - Delete list (owner only)
PATCH  /api/lists/:id/archive  - Archive/unarchive list
```

### List Items

```
GET    /api/lists/:listId/items                  - Get all items
POST   /api/lists/:listId/items                  - Add item
PUT    /api/lists/:listId/items/:itemId          - Update item
DELETE /api/lists/:listId/items/:itemId          - Delete item
PATCH  /api/lists/:listId/items/:itemId/check    - Toggle checked status
POST   /api/lists/:listId/items/clear-checked    - Remove all checked items
POST   /api/lists/:listId/items/reorder          - Reorder items
```

### List Members (Sharing)

```
GET    /api/lists/:listId/members           - Get all members
POST   /api/lists/:listId/members           - Add member by email
DELETE /api/lists/:listId/members/:userId   - Remove member (owner only)
PUT    /api/lists/:listId/members/:userId   - Update member role
POST   /api/lists/:listId/leave             - Leave shared list
```

### Suggestions (Autocomplete)

```
GET    /api/suggestions?q=milk   - Get autocomplete suggestions
GET    /api/suggestions/common   - Get most commonly used items
```

### Health Check

```
GET    /health                   - Server health check
```

## Authentication

All protected endpoints require a JWT access token in the Authorization header:

```
Authorization: Bearer <access_token>
```

## Database Schema

- **users**: User accounts with email/password
- **shopping_lists**: Shopping lists owned by users
- **list_members**: Shared access to lists
- **list_items**: Items within shopping lists
- **common_items**: Frequently used items for autocomplete

## Security

- Passwords hashed with bcrypt (12 salt rounds)
- JWT tokens: Access token (15min), Refresh token (7 days)
- Rate limiting on authentication endpoints (5 req/15min)
- Helmet for security headers
- Input validation with express-validator
- Role-based authorization for list operations

## Development

```bash
# Run in dev mode with auto-reload
npm run dev

# Build TypeScript
npm run build

# Run tests
npm test
```

## Testing

Test the API using curl or Postman:

```bash
# Register a user
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Create a list (use accessToken from login response)
curl -X POST http://localhost:3000/api/lists \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your_access_token>" \
  -d '{"name":"Groceries"}'
```

## Troubleshooting

**Database connection error:**
- Ensure PostgreSQL is running
- Verify DATABASE_URL in `.env` is correct
- Check database exists: `psql -U postgres -l`

**Port already in use:**
- Change PORT in `.env` to a different port
- Or kill the process using port 3000

**JWT errors:**
- Ensure JWT_SECRET and JWT_REFRESH_SECRET are set and at least 32 characters in production
