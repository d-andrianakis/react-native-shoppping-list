# 🛒 Shopping List App - Complete Setup Guide

Complete step-by-step guide to get your collaborative shopping list app running!

## 📋 Prerequisites

Before starting, ensure you have installed:

- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **PostgreSQL** - Choose one:
  - **Local**: PostgreSQL (v12 or higher) - [Download](https://www.postgresql.org/download/)
  - **Cloud** (Recommended): Create account on [Supabase](https://supabase.com) or [Neon](https://neon.tech) (no local installation needed!)
- **Git** (optional, for version control)
- **Expo Go app** on your phone (for testing) - [iOS](https://apps.apple.com/app/expo-go/id982107779) | [Android](https://play.google.com/store/apps/details?id=host.exp.exponent)

Or:
- **Android Studio** (for Android emulator)
- **Xcode** (for iOS simulator, Mac only)

**💡 Tip:** Using a cloud database (Supabase/Neon) is easier for beginners - no local PostgreSQL installation required!

## 🚀 Setup Instructions

### Step 1: Database Setup

You can use either a **local PostgreSQL installation** or a **cloud-hosted database**. Choose one:

#### Option A: Local PostgreSQL (Traditional Setup)

1. **Start PostgreSQL** (if not already running):
   ```bash
   # Windows (if installed as service, it should auto-start)
   # Or start from pgAdmin

   # Mac
   brew services start postgresql

   # Linux
   sudo service postgresql start
   ```

2. **Create the database**:
   ```bash
   # Connect to PostgreSQL
   psql -U postgres

   # Create database
   CREATE DATABASE shopping_list;

   # Exit
   \q
   ```

3. **Run migrations**:
   ```bash
   cd backend

   # Option 1: Using the npm script (if DATABASE_URL is set in .env)
   npm run migrate

   # Option 2: Run manually
   psql -U postgres -d shopping_list -f migrations/001_initial_schema.sql
   ```

#### Option B: Cloud-Hosted PostgreSQL (Recommended for Production)

**Popular cloud database providers:**
- **Supabase** (Free tier, easy setup) - [supabase.com](https://supabase.com)
- **Neon** (Serverless, free tier) - [neon.tech](https://neon.tech)
- **AWS RDS** (Enterprise-grade)
- **Heroku Postgres** (Simple, integrates with Heroku)
- **DigitalOcean Managed Databases**

**Setup steps (general for most providers):**

1. **Create a database** in your provider's dashboard
   - Sign up for your chosen provider
   - Create a new PostgreSQL database/project
   - Note: Database is automatically created, no local installation needed!

2. **Get connection credentials** from the provider's dashboard:
   - Host/Endpoint
   - Port (usually 5432)
   - Database name
   - Username
   - Password
   - Connection string (DATABASE_URL)

3. **Whitelist your IP** (if required):
   - Most providers require you to add your IP address to allowed connections
   - Add `0.0.0.0/0` for development (⚠️ not recommended for production)
   - Or add your specific IP address

4. **Run migrations**:
   ```bash
   cd backend

   # After setting up your .env with cloud credentials (Step 2 below)
   npm run migrate
   ```

**Provider-specific quick start:**

<details>
<summary><b>Supabase Setup</b></summary>

1. Go to [supabase.com](https://supabase.com) and create account
2. Create a new project
3. Go to **Settings** → **Database**
4. Copy the **Connection String** (URI format)
5. Use in your `.env`:
   ```env
   DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.xxx.supabase.co:5432/postgres
   DB_SSL_ENABLED=true
   DB_SSL_REJECT_UNAUTHORIZED=false
   ```
</details>

<details>
<summary><b>Neon Setup</b></summary>

1. Go to [neon.tech](https://neon.tech) and create account
2. Create a new project
3. Copy the connection string from dashboard
4. Use in your `.env`:
   ```env
   DATABASE_URL=postgresql://user:password@ep-xxx.region.neon.tech:5432/shopping_list
   DB_SSL_ENABLED=true
   DB_SSL_REJECT_UNAUTHORIZED=false
   ```
</details>

<details>
<summary><b>AWS RDS Setup</b></summary>

1. Go to AWS Console → RDS
2. Create a PostgreSQL database
3. Configure security group to allow your IP
4. Note endpoint, port, username, password
5. Use in your `.env`:
   ```env
   DATABASE_URL=postgresql://postgres:password@mydb.abc123.us-east-1.rds.amazonaws.com:5432/shopping_list
   DB_SSL_ENABLED=true
   DB_SSL_REJECT_UNAUTHORIZED=false
   ```
</details>

<details>
<summary><b>Heroku Postgres Setup</b></summary>

1. Create Heroku app
2. Add Heroku Postgres addon
3. Connection string automatically available in config vars
4. Use in your `.env`:
   ```env
   DATABASE_URL=postgres://user:pass@ec2-xx-xxx.compute-1.amazonaws.com:5432/dbname
   DB_SSL_ENABLED=true
   DB_SSL_REJECT_UNAUTHORIZED=false
   ```
</details>

### Step 2: Backend Setup

1. **Navigate to backend folder**:
   ```bash
   cd backend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment variables**:
   ```bash
   # Copy the example file
   copy .env.example .env    # Windows
   # or
   cp .env.example .env      # Mac/Linux
   ```

4. **Edit `.env` file** with your settings:

   **For LOCAL PostgreSQL:**
   ```env
   PORT=3000
   NODE_ENV=development

   # Local PostgreSQL credentials
   DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/shopping_list
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=shopping_list
   DB_USER=postgres
   DB_PASSWORD=YOUR_PASSWORD
   DB_SSL_ENABLED=false
   DB_SSL_REJECT_UNAUTHORIZED=false

   # Generate secure random strings (at least 32 characters)
   JWT_SECRET=your_very_long_and_secure_jwt_secret_at_least_32_characters_long
   JWT_REFRESH_SECRET=your_very_long_refresh_secret_also_32_characters_minimum
   JWT_EXPIRATION=15m
   JWT_REFRESH_EXPIRATION=7d

   ALLOWED_ORIGINS=http://localhost:19000,exp://localhost:19000
   ```

   **For CLOUD-HOSTED PostgreSQL:**
   ```env
   PORT=3000
   NODE_ENV=development

   # Cloud database credentials (replace with your provider's details)
   DATABASE_URL=postgresql://user:password@your-db-host.provider.com:5432/shopping_list
   DB_HOST=your-db-host.provider.com
   DB_PORT=5432
   DB_NAME=shopping_list
   DB_USER=your_username
   DB_PASSWORD=your_cloud_password
   DB_SSL_ENABLED=true
   DB_SSL_REJECT_UNAUTHORIZED=false

   # Generate secure random strings (at least 32 characters)
   JWT_SECRET=your_very_long_and_secure_jwt_secret_at_least_32_characters_long
   JWT_REFRESH_SECRET=your_very_long_refresh_secret_also_32_characters_minimum
   JWT_EXPIRATION=15m
   JWT_REFRESH_EXPIRATION=7d

   ALLOWED_ORIGINS=http://localhost:19000,exp://localhost:19000
   ```

   **Important SSL Notes:**
   - `DB_SSL_ENABLED=true` - Required for most cloud providers
   - `DB_SSL_REJECT_UNAUTHORIZED=false` - Set to false for cloud providers that use self-signed certificates
   - See `.env.example` for provider-specific examples (Supabase, Neon, AWS RDS, etc.)

5. **Start the backend server**:
   ```bash
   npm run dev
   ```

   You should see:
   ```
   ✅ Database connected successfully
   🛒  Shopping List API Server
   Environment: development
   Port:        3000
   ✅ Server ready to accept connections
   ```

6. **Test the backend** (in a new terminal):
   ```bash
   curl http://localhost:3000/health
   ```

   Should return: `{"success":true,"message":"Server is running",...}`

### Step 3: Mobile App Setup

1. **Open a new terminal** and navigate to project root:
   ```bash
   cd c:\Users\USER\VSCODE\react-native-shoppping-list
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Update API base URL** (if needed):

   Edit `src/config/env.ts`:
   ```typescript
   const ENV = {
     dev: {
       // For Android emulator:
       API_BASE_URL: 'http://10.0.2.2:3000/api',

       // For iOS simulator or physical device:
       // API_BASE_URL: 'http://YOUR_COMPUTER_IP:3000/api',
       // Example: API_BASE_URL: 'http://192.168.1.100:3000/api',
     },
     // ...
   };
   ```

   **Finding your computer's IP:**
   - Windows: `ipconfig` (look for IPv4 Address)
   - Mac/Linux: `ifconfig` or `ip addr` (look for inet)

4. **Start the Expo development server**:
   ```bash
   npm start
   ```

   This will open Metro Bundler in your terminal and browser.

### Step 4: Run the App

Choose one of these options:

#### Option A: Physical Device (Recommended for beginners)

1. Install **Expo Go** app on your phone
2. Scan the QR code from the terminal using:
   - **iOS**: Camera app
   - **Android**: Expo Go app
3. App will load on your device

#### Option B: Android Emulator

1. Open Android Studio
2. Start an Android Virtual Device (AVD)
3. Press `a` in the Expo terminal to open in Android emulator

#### Option C: iOS Simulator (Mac only)

1. Have Xcode installed
2. Press `i` in the Expo terminal to open in iOS simulator

## ✅ Verification

### Test Backend

1. **Health check**:
   ```bash
   curl http://localhost:3000/health
   ```

2. **Register a user**:
   ```bash
   curl -X POST http://localhost:3000/api/auth/register \
     -H "Content-Type: application/json" \
     -d "{\"email\":\"test@example.com\",\"password\":\"password123\",\"displayName\":\"Test User\"}"
   ```

3. **Login**:
   ```bash
   curl -X POST http://localhost:3000/api/auth/login \
     -H "Content-Type: application/json" \
     -d "{\"email\":\"test@example.com\",\"password\":\"password123\"}"
   ```

### Test Mobile App

1. **Register**: Create a new account
2. **Login**: Sign in with your account
3. **Create List**: Tap the + button to create a shopping list
4. **Add Items**: Type item names and press enter
5. **Check Items**: Tap the checkbox to mark items as completed (they disappear with animation!)
6. **Share List**: Tap the 👥 icon to share with another user
7. **Change Language**: Go to Settings ⚙️ and switch between English/Greek/German

## 🎯 Features to Test

- ✅ User registration and login
- ✅ Create multiple shopping lists
- ✅ Add items to lists
- ✅ Autocomplete suggestions (type 2+ characters)
- ✅ Check items (smooth fade-out animation)
- ✅ Share lists with other users
- ✅ Real-time updates (lists update every 5 seconds when viewing)
- ✅ Multi-language support (Settings → Language)
- ✅ Profile management (Settings)
- ✅ Logout

## 🐛 Troubleshooting

### Backend Issues

**"Database connection failed"**

For **local PostgreSQL**:
- Ensure PostgreSQL is running
- Check credentials in `.env`
- Verify database exists: `psql -U postgres -l`

For **cloud-hosted PostgreSQL**:
- Verify your IP address is whitelisted in provider's dashboard
- Check that `DB_SSL_ENABLED=true` is set
- Ensure credentials (host, port, user, password) are correct
- Test connection: `psql "postgresql://user:pass@host:port/dbname"`
- Check if the database instance is running in your cloud provider's dashboard

**"SSL connection required" or "no pg_hba.conf entry"**
- Set `DB_SSL_ENABLED=true` in `.env`
- Set `DB_SSL_REJECT_UNAUTHORIZED=false` for most cloud providers
- Verify your cloud provider requires SSL (most do)

**"Connection timeout" or "Could not connect to server"**
- Check IP whitelisting in your cloud provider's firewall/security settings
- Verify hostname and port are correct
- Ensure database instance is running (check provider dashboard)
- Try connecting with `psql` directly to test credentials

**"Port 3000 already in use"**
- Change `PORT` in `.env` to 3001 or another available port
- Update mobile app's `API_BASE_URL` accordingly

**"JWT_SECRET too short"**
- Ensure JWT_SECRET and JWT_REFRESH_SECRET are at least 32 characters

### Mobile App Issues

**"Network request failed" or can't connect to API**
- Check backend is running (`npm run dev` in backend folder)
- Verify `API_BASE_URL` in `src/config/env.ts`
- For Android emulator, use `http://10.0.2.2:3000/api`
- For physical device, use your computer's IP (not localhost)
- Ensure phone and computer are on the same WiFi network

**App shows blank screen**
- Check Metro bundler is running
- Reload app: Shake device and tap "Reload"
- Clear cache: `npx expo start -c`

**"Unable to resolve module"**
- Delete node_modules and reinstall:
  ```bash
  rm -rf node_modules
  npm install
  ```

**TypeScript errors**
- Ensure all dependencies are installed
- Restart Metro bundler

### Testing Connection

**Test from your device:**
```bash
# Replace YOUR_COMPUTER_IP with actual IP
curl http://YOUR_COMPUTER_IP:3000/health
```

## 📱 Development Tips

### Hot Reload

- Code changes auto-reload in the app
- Shake device → "Reload" for manual reload
- Shake device → "Debug JS Remotely" for debugging

### Viewing Logs

- Backend logs: Visible in terminal running `npm run dev`
- Mobile logs: Visible in Metro Bundler terminal
- Redux state: Can add Redux DevTools

### Multiple Users Testing

To test collaborative features:
1. Register two different accounts
2. Login with User A, create a list
3. Share list with User B's email
4. Login with User B (on another device or after logout)
5. Both users can now add/check items!

## 🚀 Next Steps

1. **Customize styling**: Edit styles in screen files
2. **Add more features**:
   - Item categories
   - Quantity management
   - Notes per item
   - Dark mode
3. **Deploy backend**: Deploy to Heroku, Railway, or AWS
4. **Build app**: Use EAS Build for production APK/IPA

## 📚 Project Structure

```
├── backend/              Backend API server
│   ├── src/
│   │   ├── config/      Database, environment config
│   │   ├── middleware/  Auth, validation, security
│   │   ├── routes/      API endpoints
│   │   ├── controllers/ Request handlers
│   │   └── services/    Business logic
│   └── migrations/      Database schema
│
├── src/                 Mobile app source
│   ├── components/      Reusable UI components
│   ├── screens/         Screen components
│   ├── navigation/      React Navigation setup
│   ├── store/           Redux store & slices
│   ├── services/api/    API client & services
│   └── i18n/            Translation files (EN/EL/DE)
│
└── App.tsx              App entry point
```

## 🎉 Success!

Your collaborative shopping list app is now running!

- **Backend**: http://localhost:3000
- **Mobile App**: Running on your device via Expo Go

Create lists, add items, share with friends, and enjoy shopping together! 🛒✨

---

**Need help?** Check the README.md or backend/README.md for API documentation and additional information.
