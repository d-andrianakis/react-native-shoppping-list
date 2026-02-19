# Deploying the Shopping List Backend - Idiot's Guide

## What You're Deploying

An Express.js (Node.js) API server with:
- A **PostgreSQL** database
- **Socket.io** for real-time updates
- **JWT** authentication

You need two things on your server: **Node.js** and **PostgreSQL**.

---

## Option A: Cheap VPS (DigitalOcean, Hetzner, Linode, etc.)

This is the most straightforward approach. You rent a small Linux server (~$5/month) and set everything up yourself.

### Step 1: Get a Server

Rent any small Linux VPS (Ubuntu 22.04 or 24.04 recommended). 1 GB RAM is enough to start.

Once you have it, SSH in:
```bash
ssh root@your-server-ip
```

### Step 2: Install Node.js

```bash
# Install Node.js 20 (LTS)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify
node --version   # Should show v20.x.x
npm --version
```

### Step 3: Install PostgreSQL

```bash
sudo apt-get install -y postgresql postgresql-contrib

# Start it
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### Step 4: Create the Database

```bash
# Switch to the postgres user
sudo -u postgres psql

# Inside the psql prompt, run these commands:
CREATE USER shopuser WITH PASSWORD 'pick-a-strong-password-here';
CREATE DATABASE shopping_list OWNER shopuser;
GRANT ALL PRIVILEGES ON DATABASE shopping_list TO shopuser;
\q
```

### Step 5: Upload Your Code

From your local machine, copy the backend folder to the server:
```bash
# From your local machine:
scp -r ./backend root@your-server-ip:/opt/shopping-list-backend
```

Or clone from git if you have a repo:
```bash
# On the server:
cd /opt
git clone https://github.com/your-username/your-repo.git shopping-list-backend
cd shopping-list-backend/backend
```

### Step 6: Install Dependencies & Build

```bash
cd /opt/shopping-list-backend   # (or wherever your backend folder is)
npm install
npm run build
```

### Step 7: Run the Database Migration

This creates all the tables your app needs:
```bash
sudo -u postgres psql -d shopping_list -f migrations/001_initial_schema.sql
```

### Step 8: Create the .env File

```bash
nano .env
```

Paste this in, replacing the placeholder values:

```env
PORT=3000
NODE_ENV=production

# Database - match what you created in Step 4
DATABASE_URL=postgresql://shopuser:pick-a-strong-password-here@localhost:5432/shopping_list
DB_HOST=localhost
DB_PORT=5432
DB_NAME=shopping_list
DB_USER=shopuser
DB_PASSWORD=pick-a-strong-password-here
DB_SSL_ENABLED=false
DB_SSL_REJECT_UNAUTHORIZED=false

# JWT secrets - CHANGE THESE to random strings (32+ characters)
# Generate with: openssl rand -hex 32
JWT_SECRET=PASTE_A_RANDOM_64_CHAR_HEX_STRING_HERE
JWT_REFRESH_SECRET=PASTE_A_DIFFERENT_RANDOM_64_CHAR_HEX_STRING_HERE
JWT_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d

# CORS - put your app's URL here (or * to allow all, less secure)
ALLOWED_ORIGINS=*
```

To generate the JWT secrets, run this twice and paste each result:
```bash
openssl rand -hex 32
```

### Step 9: Test It

```bash
npm start
```

You should see a startup banner. Test it from another terminal:
```bash
curl http://your-server-ip:3000/health
```

If you get a response, it's working. Press Ctrl+C to stop it for now.

### Step 10: Keep It Running with PM2

You don't want the server to die when you close your SSH session:

```bash
# Install PM2 (process manager)
npm install -g pm2

# Start your app
pm2 start dist/index.js --name shopping-list

# Make it survive reboots
pm2 startup
pm2 save

# Useful PM2 commands:
pm2 status          # See if it's running
pm2 logs            # See logs
pm2 restart all     # Restart after updates
```

### Step 11 (Optional but Recommended): Set Up a Reverse Proxy with Nginx

This lets you use port 80/443 (standard HTTP/HTTPS) instead of 3000, and lets you add SSL later:

```bash
sudo apt-get install -y nginx

sudo nano /etc/nginx/sites-available/shopping-list
```

Paste:
```nginx
server {
    listen 80;
    server_name your-domain.com;  # or your server IP

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable it:
```bash
sudo ln -s /etc/nginx/sites-available/shopping-list /etc/nginx/sites-enabled/
sudo nginx -t          # Test config
sudo systemctl restart nginx
```

Now your API is accessible on port 80 (no :3000 needed).

### Step 12 (Optional): Add HTTPS with Let's Encrypt

If you have a domain name pointed at your server:
```bash
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

Follow the prompts. It'll auto-configure SSL for you.

---

## Option B: Railway / Render (Easiest, No Server Management)

If you don't want to manage a server at all, use a platform-as-a-service.

### Railway (https://railway.app)

1. Push your code to GitHub
2. Go to railway.app, sign in with GitHub
3. Click "New Project" > "Deploy from GitHub Repo"
4. Select your repo, point it to the `backend` folder
5. Railway will detect Node.js automatically
6. Add a PostgreSQL database: Click "New" > "Database" > "PostgreSQL"
7. Go to your service's "Variables" tab and add:
   - `NODE_ENV` = `production`
   - `JWT_SECRET` = (random 64-char string)
   - `JWT_REFRESH_SECRET` = (different random 64-char string)
   - `ALLOWED_ORIGINS` = `*`
   - Railway auto-injects `DATABASE_URL` from the PostgreSQL service
8. Set the build command to `npm run build` and start command to `npm start`
9. Run the migration via Railway's CLI or connect to the DB and run the SQL manually
10. Deploy

### Render (https://render.com)

Similar process - create a "Web Service" from your GitHub repo, add a PostgreSQL database, set env vars, done.

---

## Updating the App Later

### On a VPS:
```bash
cd /opt/shopping-list-backend
git pull                    # Get latest code
npm install                 # Install any new dependencies
npm run build               # Recompile TypeScript
pm2 restart shopping-list   # Restart the app
```

### On Railway/Render:
Just push to GitHub. It redeploys automatically.

---

## Quick Troubleshooting

| Problem | Fix |
|---|---|
| "ECONNREFUSED" on database | PostgreSQL isn't running: `sudo systemctl start postgresql` |
| "password authentication failed" | Wrong DB password in .env - check it matches Step 4 |
| "relation does not exist" | You forgot to run the migration (Step 7) |
| App crashes on startup | Check logs: `pm2 logs` or `npm start` to see the error |
| Can't connect from phone | Check firewall: `sudo ufw allow 3000` (or 80 if using nginx) |
| Socket.io not connecting | Make sure nginx config has the `Upgrade` and `Connection` headers |

---

## Minimum Cost Breakdown

- **VPS route**: ~$4-6/month (Hetzner/DigitalOcean cheapest tier)
- **Railway**: Free tier available, then ~$5/month
- **Render**: Free tier available (spins down after inactivity), then ~$7/month
