# Environment Variables Reference

Complete reference for all environment variables used in the FriendChat application.

## Table of Contents
- [Frontend Variables (.env)](#frontend-variables-env)
- [Backend Variables (server/.env)](#backend-variables-serverenv)
- [Environment-Specific Configurations](#environment-specific-configurations)
- [Security Best Practices](#security-best-practices)
- [Troubleshooting](#troubleshooting)

---

## Frontend Variables (.env)

Location: Project root directory

### EXPO_PUBLIC_API_URL

**Description:** Base URL for the backend API

**Format:** `http://[host]:[port]/api` or `https://[domain]/api`

**Examples:**
```bash
# Local development (same WiFi)
EXPO_PUBLIC_API_URL=http://192.168.1.100:3000/api

# Your current setup
EXPO_PUBLIC_API_URL=http://175.101.84.117:3000/api

# ngrok
EXPO_PUBLIC_API_URL=https://abc123.ngrok-free.app/api

# Production (Vercel)
EXPO_PUBLIC_API_URL=https://my-api.vercel.app/api
```

**Notes:**
- Use `http://` for local development
- Use `https://` for production and ngrok
- Must end with `/api`
- Cannot use `localhost` for physical devices

---

### EXPO_PUBLIC_SOCKET_URL

**Description:** WebSocket URL for real-time Socket.IO connection

**Format:** `ws://[host]:[port]` or `wss://[domain]`

**Examples:**
```bash
# Local development (same WiFi)
EXPO_PUBLIC_SOCKET_URL=ws://192.168.1.100:3000

# Your current setup
EXPO_PUBLIC_SOCKET_URL=ws://175.101.84.117:3000

# ngrok
EXPO_PUBLIC_SOCKET_URL=wss://abc123.ngrok-free.app

# Production (if Socket.IO server separate)
EXPO_PUBLIC_SOCKET_URL=wss://socket.my-api.com
```

**Notes:**
- Use `ws://` for local development (unencrypted)
- Use `wss://` for production and ngrok (encrypted)
- Must match protocol with API URL security level
- No `/api` suffix needed

---

### EXPO_PUBLIC_API_TIMEOUT

**Description:** Request timeout in milliseconds

**Format:** Number (milliseconds)

**Default:** `15000` (15 seconds)

**Examples:**
```bash
# Standard timeout
EXPO_PUBLIC_API_TIMEOUT=15000

# Faster timeout (testing)
EXPO_PUBLIC_API_TIMEOUT=5000

# Longer timeout (slow connections)
EXPO_PUBLIC_API_TIMEOUT=30000
```

**Notes:**
- Recommended: 10000-20000 (10-20 seconds)
- Too low: requests may fail on slow networks
- Too high: users wait longer for errors

---

## Backend Variables (server/.env)

Location: `server/` directory

### PORT

**Description:** Port number for the backend server

**Format:** Number

**Default:** `3000`

**Examples:**
```bash
# Standard port
PORT=3000

# Alternative port
PORT=4000

# Custom port
PORT=8080
```

**Notes:**
- Must not conflict with other services
- Expo dev server uses 8081
- If changed, update frontend EXPO_PUBLIC_API_URL

---

### MONGO_URI

**Description:** MongoDB connection string

**Format:** `mongodb://[host]:[port]/[database]` or `mongodb+srv://[credentials]@[cluster]/[database]`

**Examples:**
```bash
# Local MongoDB
MONGO_URI=mongodb://localhost:27017/friendly-chart

# MongoDB Atlas (your current setup)
MONGO_URI=mongodb+srv://balu123456sbb:0nvHL6CVsusc0lkQ@cluster0.yx7atyc.mongodb.net/friendlyChart?retryWrites=true&w=majority

# MongoDB with authentication
MONGO_URI=mongodb://username:password@localhost:27017/database?authSource=admin

# MongoDB replica set
MONGO_URI=mongodb://host1:27017,host2:27017,host3:27017/database?replicaSet=rs0
```

**Notes:**
- **SECURITY:** Never commit this to version control
- MongoDB Atlas recommended for production
- URL-encode special characters in password
- Add `?retryWrites=true&w=majority` for Atlas
- Whitelist IP addresses in Atlas Network Access

**Get MongoDB Atlas:**
1. Sign up: https://www.mongodb.com/cloud/atlas/register
2. Create free cluster (M0)
3. Create database user
4. Whitelist IP (`0.0.0.0/0` for testing, specific IPs for production)
5. Get connection string from "Connect" button

---

### JWT_SECRET

**Description:** Secret key for signing JWT authentication tokens

**Format:** Long random string (minimum 32 characters recommended)

**Examples:**
```bash
# Generated with OpenSSL (recommended)
JWT_SECRET=5e85b2f5f2b04a8da1d80ed6ad6b0d2999d1e3f08b4374c1a6d1b5cdeecf3f4b

# Generated with Node.js
JWT_SECRET=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6

# DON'T USE weak secrets like:
JWT_SECRET=secret123  # ❌ Too weak
JWT_SECRET=myapp      # ❌ Too short
```

**Generating secure secrets:**

```bash
# OpenSSL (Linux/macOS/Git Bash)
openssl rand -hex 32

# Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# PowerShell (Windows)
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

**Notes:**
- **CRITICAL:** Must be kept secret and never exposed
- Different secret for each environment
- Change immediately if compromised
- Longer = more secure (32+ characters minimum)
- Used to verify user authentication tokens

---

### CLOUDINARY_URL

**Description:** Cloudinary API credentials for media uploads

**Format:** `cloudinary://[api_key]:[api_secret]@[cloud_name]`

**Examples:**
```bash
# Your current setup
CLOUDINARY_URL=cloudinary://772483154515382:yDj1yvrIpu0ENk8QIUA-sDqhiCU@dkfw5wie3

# Template format
CLOUDINARY_URL=cloudinary://123456789012345:abcdefghijklmnopqrstuvwxyz@your-cloud-name
```

**Notes:**
- Get from Cloudinary dashboard: https://cloudinary.com/console
- Free tier: 25 GB storage, 25 GB bandwidth/month
- Used for image/video uploads in chat
- Alternative: AWS S3, DigitalOcean Spaces

**Get Cloudinary credentials:**
1. Sign up: https://cloudinary.com/users/register/free
2. Go to dashboard: https://cloudinary.com/console
3. Copy "API Environment variable" (starts with `cloudinary://`)
4. Paste into `CLOUDINARY_URL`

---

## Environment-Specific Configurations

### Development (Local)

**Frontend (.env):**
```bash
EXPO_PUBLIC_API_URL=http://175.101.84.117:3000/api
EXPO_PUBLIC_SOCKET_URL=ws://175.101.84.117:3000
EXPO_PUBLIC_API_TIMEOUT=15000
```

**Backend (server/.env):**
```bash
PORT=3000
MONGO_URI=mongodb://localhost:27017/friendly-chart
JWT_SECRET=[generated-secret]
CLOUDINARY_URL=cloudinary://[your-credentials]
```

---

### Development (ngrok)

**Frontend (.env):**
```bash
EXPO_PUBLIC_API_URL=https://abc123.ngrok-free.app/api
EXPO_PUBLIC_SOCKET_URL=wss://abc123.ngrok-free.app
EXPO_PUBLIC_API_TIMEOUT=15000
```

**Backend (server/.env):**
```bash
PORT=3000
MONGO_URI=mongodb+srv://[atlas-connection-string]
JWT_SECRET=[generated-secret]
CLOUDINARY_URL=cloudinary://[your-credentials]
```

---

### Production (Vercel)

**Frontend (.env):**
```bash
EXPO_PUBLIC_API_URL=https://your-app.vercel.app/api
EXPO_PUBLIC_SOCKET_URL=wss://your-app.vercel.app
EXPO_PUBLIC_API_TIMEOUT=15000
```

**Backend (Vercel Environment Variables):**
- Set in Vercel dashboard under Settings → Environment Variables
- Same variables as server/.env but managed by Vercel
- Mark as "Production", "Preview", and "Development" as needed

**Note:** Vercel has limitations with persistent WebSocket connections. Consider:
- Using a separate Socket.IO server (Railway, Render, Fly.io)
- Implementing long-polling fallback
- Using managed real-time service (Pusher, Ably)

---

## Security Best Practices

### ✅ DO:
- Generate strong random secrets for JWT_SECRET
- Use different secrets for dev/staging/production
- Store sensitive values in `.env` files
- Add `.env` to `.gitignore`
- Use environment variables in CI/CD
- Rotate secrets periodically
- Use MongoDB Atlas with IP whitelisting
- Use HTTPS/WSS in production
- Validate environment variables on startup
- Use secret management (Vercel, AWS Secrets Manager)

### ❌ DON'T:
- Commit `.env` files to version control
- Share secrets in Slack/email/screenshots
- Use weak or predictable secrets
- Use same secrets across environments
- Hardcode secrets in source code
- Use `0.0.0.0/0` MongoDB whitelist in production
- Use HTTP/WS in production
- Log sensitive environment variables
- Share `.env` files publicly

---

## Troubleshooting

### Frontend can't connect to backend

**Check:**
1. Is `.env` file in project root? (not in `src/`)
2. Does EXPO_PUBLIC_API_URL match backend URL?
3. Are you using IP address (not localhost) for physical devices?
4. Is backend server running?
5. Same WiFi network? (if using local IP)
6. Firewall allowing port 3000?
7. Did you restart Expo after changing `.env`?

**Fix:**
```bash
# Restart Expo with cleared cache
npm start -- --clear
```

---

### Socket.IO connection fails

**Check:**
1. Does EXPO_PUBLIC_SOCKET_URL protocol match? (ws/wss)
2. Is custom server running? (`node server.js`)
3. Is JWT token valid?
4. CORS configured in server.js?
5. Using polling fallback transport?

**Fix:** Check `src/lib/socket/client.ts` has:
```typescript
transports: ['websocket', 'polling']
```

---

### MongoDB connection error

**Check:**
1. Is MONGO_URI correct?
2. MongoDB Atlas: IP whitelisted?
3. MongoDB Atlas: Database user created?
4. MongoDB Atlas: Correct password? (URL-encoded?)
5. Local MongoDB: Is mongod running?

**Test connection:**
```bash
# Using mongosh
mongosh "YOUR_MONGO_URI"
```

---

### JWT errors / Authentication fails

**Check:**
1. Is JWT_SECRET set in backend?
2. Same JWT_SECRET across all backend instances?
3. Is token being sent in Authorization header?
4. Token not expired? (default: 24 hours)

**Debug:**
```bash
# Check token in browser/Postman
Authorization: Bearer [your-token]
```

---

### Cloudinary upload fails

**Check:**
1. Is CLOUDINARY_URL correct format?
2. Credentials from correct dashboard?
3. Free tier limits not exceeded?
4. File size within limits? (10MB for free tier)

**Test:**
```bash
# curl test
curl -X POST "https://api.cloudinary.com/v1_1/[cloud-name]/image/upload" \
  -F "file=@test.jpg" \
  -F "api_key=[your-api-key]" \
  -F "timestamp=$(date +%s)" \
  -F "signature=[generated-signature]"
```

---

### Environment variables not loading

**Check:**
1. File named exactly `.env` (not `.env.txt`)
2. No spaces around `=` in assignments
3. Values not wrapped in quotes (unless needed)
4. File in correct directory (root for frontend, server/ for backend)
5. Restart required after changes
6. Build cache cleared

**Fix:**
```bash
# Clear all caches
npm start -- --clear
cd server && rm -rf .next
```

---

## Validation Script

Check your environment setup:

```bash
# Run setup script
npm run setup

# Or manually:
bash scripts/setup-env.sh  # Unix/macOS/Git Bash
scripts\setup-env.bat      # Windows CMD
```

This will:
- Check for missing `.env` files
- Generate templates with local IP
- Validate configuration
- Show next steps

---

## Quick Reference

| Variable | Location | Required | Default | Notes |
|----------|----------|----------|---------|-------|
| EXPO_PUBLIC_API_URL | `.env` | ✅ | - | Backend API URL |
| EXPO_PUBLIC_SOCKET_URL | `.env` | ✅ | - | WebSocket server URL |
| EXPO_PUBLIC_API_TIMEOUT | `.env` | ❌ | 15000 | Request timeout (ms) |
| PORT | `server/.env` | ❌ | 3000 | Server port |
| MONGO_URI | `server/.env` | ✅ | - | MongoDB connection |
| JWT_SECRET | `server/.env` | ✅ | - | JWT signing key |
| CLOUDINARY_URL | `server/.env` | ✅ | - | Media upload credentials |

---

## Additional Resources

- [Expo Environment Variables](https://docs.expo.dev/guides/environment-variables/)
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)
- [MongoDB Atlas Setup](https://www.mongodb.com/docs/atlas/getting-started/)
- [Cloudinary Setup](https://cloudinary.com/documentation/how_to_integrate_cloudinary)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
