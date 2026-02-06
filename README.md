# Shopping List - React Native Mobile App

A collaborative shopping list application built with React Native (Expo) and Node.js/Express backend with PostgreSQL.

## Features

✅ **Multi-language Support**: English, Greek (Ελληνικά), German (Deutsch)
✅ **Multiple Lists**: Create and manage multiple shopping lists
✅ **Collaborative**: Share lists with other users (owner/editor/viewer roles)
✅ **PostgreSQL Database**: All data persisted in PostgreSQL
✅ **Quick Add**: Autocomplete suggestions based on frequently used items
✅ **Check Items**: Items disappear with smooth animation when checked
✅ **Real-time Updates**: Shared lists update via polling
✅ **Secure Authentication**: JWT-based email/password authentication

## Project Structure

```
react-native-shopping-list/
├── backend/                  # Node.js/Express API
│   ├── src/
│   │   ├── config/          # Database, environment config
│   │   ├── middleware/      # Auth, validation, error handling
│   │   ├── routes/          # API endpoints
│   │   ├── controllers/     # Request handlers
│   │   ├── services/        # Business logic
│   │   └── index.ts        # Server entry point
│   ├── migrations/          # Database schema
│   └── package.json
│
├── src/                     # React Native app
│   ├── components/         # UI components (to be implemented)
│   ├── screens/            # Screen components (to be implemented)
│   ├── navigation/         # Navigation setup (to be implemented)
│   ├── store/              # Redux store (to be implemented)
│   ├── services/           # API client (to be implemented)
│   └── i18n/               # ✅ Translation files (COMPLETE)
│
├── app.json                # ✅ Expo configuration
├── package.json            # ✅ Dependencies
└── README.md
```

## Current Implementation Status

### ✅ Completed (Backend - Phase 1 & 2)

1. **Backend API** - Fully functional Node.js/Express server
   - Authentication API (register, login, refresh token, profile)
   - Shopping Lists API (CRUD operations, archiving)
   - List Items API (add, edit, delete, check/uncheck, clear completed)
   - List Members API (share, add/remove members, roles)
   - Suggestions API (autocomplete for frequently used items)
   - Security: Rate limiting, input validation, JWT auth
   - Database: Complete PostgreSQL schema with migrations

2. **i18n Setup** - Complete multi-language support
   - English translations (en.json)
   - Greek translations (el.json)
   - German translations (de.json)
   - Language switching logic

3. **Project Configuration**
   - Expo configuration (app.json)
   - TypeScript setup (tsconfig.json)
   - Babel configuration
   - Package.json with all dependencies

### 🚧 Remaining Work (Mobile App - Phase 3, 4, 5)

The following components need to be implemented:

**Phase 3: Mobile App Foundation**
- Redux Toolkit store configuration
- React Navigation setup (Auth & Main stacks)
- API client with axios (JWT interceptors)
- Login and Register screens

**Phase 4: Core Features**
- ListsScreen (display all lists, create new)
- ListDetailScreen (show items, add items)
- ItemRow component (with checkbox, fade animation)
- AddItemInput (with autocomplete suggestions)

**Phase 5: Advanced Features**
- List sharing UI (add/remove members)
- Settings screen (language picker, profile)
- Checked items filtering
- Polish & animations

## Setup Instructions

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL 12+
- For mobile development:
  - Android Studio (for Android emulator)
  - Expo Go app (for physical device testing)

### Step 1: Setup Backend

```bash
# Navigate to backend folder
cd backend

# Install dependencies
npm install

# Setup PostgreSQL database
createdb shopping_list

# Configure environment variables
cp .env.example .env
# Edit .env with your database credentials and JWT secrets

# Run database migrations
npm run migrate
# OR manually:
psql -U postgres -d shopping_list -f migrations/001_initial_schema.sql

# Start backend server
npm run dev
```

Backend will run on `http://localhost:3000`

See [backend/README.md](backend/README.md) for detailed backend setup and API documentation.

### Step 2: Setup Mobile App

```bash
# Navigate to project root
cd ..

# Install dependencies
npm install

# Start Expo development server
npm start

# In another terminal, you can run:
npm run android    # Start Android emulator
# OR scan QR code with Expo Go app on your phone
```

### Step 3: Configure API Base URL

Before running the mobile app, update the API base URL:

Create `src/config/env.ts`:
```typescript
export const ENV = {
  API_BASE_URL: 'http://localhost:3000/api',  // Change to your backend URL
};
```

## Next Steps to Complete the App

The backend is **fully functional** and ready to use. To complete the mobile app, you need to implement:

1. **Create Redux Store** (`src/store/index.ts`)
   - Configure Redux Toolkit
   - Create slices for auth, lists, items, UI

2. **Create API Client** (`src/services/api/client.ts`)
   - Setup axios instance
   - Add JWT token interceptors
   - Create API service functions

3. **Setup Navigation** (`src/navigation/AppNavigator.tsx`)
   - Create AuthNavigator (Login, Register)
   - Create MainNavigator (Lists, ListDetail, Settings)
   - Handle authenticated vs non-authenticated routes

4. **Implement Screens**
   - `screens/auth/LoginScreen.tsx`
   - `screens/auth/RegisterScreen.tsx`
   - `screens/lists/ListsScreen.tsx`
   - `screens/lists/ListDetailScreen.tsx`
   - `screens/settings/SettingsScreen.tsx`

5. **Create Components**
   - `components/items/ItemRow.tsx` (with checkbox and animation)
   - `components/items/AddItemInput.tsx` (with autocomplete)
   - `components/lists/ListCard.tsx`
   - `components/common/Button.tsx`, `Input.tsx`, etc.

6. **Create Main App Entry Point** (`App.tsx`)
   - Initialize i18n
   - Setup Redux Provider
   - Setup Navigation Container

## Testing the Backend

You can test the backend API immediately using curl or Postman:

```bash
# Register a new user
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","displayName":"Test User"}'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Get lists (use accessToken from login response)
curl -X GET http://localhost:3000/api/lists \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Technology Stack

### Backend
- **Runtime**: Node.js + TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL (with pg-promise)
- **Authentication**: JWT (jsonwebtoken + bcrypt)
- **Security**: Helmet, CORS, Rate Limiting
- **Validation**: express-validator

### Mobile App
- **Framework**: Expo + React Native
- **Language**: TypeScript
- **State Management**: Redux Toolkit (to be implemented)
- **Navigation**: React Navigation (to be implemented)
- **API Client**: Axios (to be implemented)
- **i18n**: react-i18next (✅ configured)
- **Storage**: AsyncStorage + SecureStore

## Database Schema

The database includes 5 main tables:
- `users`: User accounts with authentication
- `shopping_lists`: User's shopping lists
- `list_members`: Share lists between users
- `list_items`: Items within lists
- `common_items`: Track frequently used items for autocomplete

See [backend/migrations/001_initial_schema.sql](backend/migrations/001_initial_schema.sql) for the complete schema.

## API Endpoints

The backend provides RESTful APIs for:
- Authentication (`/api/auth/*`)
- Lists (`/api/lists/*`)
- Items (`/api/lists/:listId/items/*`)
- Members (`/api/lists/:listId/members/*`)
- Suggestions (`/api/suggestions`)

See [backend/README.md](backend/README.md) for complete API documentation.

## Language Support

The app supports three languages with complete translations:
- **English** (en)
- **Greek** (Ελληνικά) (el)
- **German** (Deutsch) (de)

Language preference is saved to AsyncStorage and persists across app restarts.

## Development Workflow

1. **Start Backend**:
   ```bash
   cd backend && npm run dev
   ```

2. **Start Mobile App**:
   ```bash
   npm start
   ```

3. **Make Changes**:
   - Backend changes auto-reload with ts-node-dev
   - Mobile app hot-reloads with Expo

## Troubleshooting

**Backend won't start:**
- Check PostgreSQL is running
- Verify .env database credentials
- Ensure database migrations ran successfully

**Can't connect to API from mobile app:**
- Update `API_BASE_URL` in mobile app config
- For Android emulator, use `http://10.0.2.2:3000/api`
- For iOS simulator, use `http://localhost:3000/api`
- For physical device, use your computer's IP address

**TypeScript errors:**
- Run `npm install` to ensure all dependencies are installed
- Check tsconfig.json is properly configured

## Contributing

To continue building this app:
1. Implement the Redux store and slices
2. Create the API client service layer
3. Build the authentication screens
4. Implement the main screens (lists, items)
5. Add animations and polish

## License

MIT

---

Built with ❤️ using React Native, Expo, Node.js, and PostgreSQL
