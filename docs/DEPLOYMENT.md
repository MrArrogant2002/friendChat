# Deployment Guide

This guide covers deploying the FriendChat application to production and testing with local/remote backends.

## Table of Contents
- [Backend Deployment (Vercel)](#backend-deployment-vercel)
- [Local Development with ngrok](#local-development-with-ngrok)
- [Environment Variables](#environment-variables)
- [Mobile App Distribution](#mobile-app-distribution)

---

## Backend Deployment (Vercel)

### Prerequisites
- Vercel account ([vercel.com](https://vercel.com))
- MongoDB Atlas cluster ([mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas))
- Cloudinary account ([cloudinary.com](https://cloudinary.com))

### Step 1: Install Vercel CLI
```bash
npm install -g vercel
```

### Step 2: Login to Vercel
```bash
vercel login
```

### Step 3: Deploy from Server Directory
```bash
cd server
vercel
```

Follow the prompts:
- Link to existing project or create new? **Create new**
- Project name: **friendly-chart-api**
- Directory to deploy: **./server** (current directory)

### Step 4: Set Environment Variables

After initial deployment, add environment secrets:

```bash
# Add MongoDB connection string
vercel env add MONGO_URI

# Add JWT secret (generate a secure random string)
vercel env add JWT_SECRET

# Add Cloudinary URL
vercel env add CLOUDINARY_URL
```

**Important:** Mark these as **Production**, **Preview**, and **Development** environments.

### Step 5: Redeploy
```bash
vercel --prod
```

Your API will be available at: `https://your-project-name.vercel.app`

### Step 6: Update Mobile App Configuration

Update the root `.env` file with your production URL:

```bash
EXPO_PUBLIC_API_URL=https://your-project-name.vercel.app/api
EXPO_PUBLIC_SOCKET_URL=wss://your-project-name.vercel.app
EXPO_PUBLIC_API_TIMEOUT=15000
```

**Note:** Vercel has limitations with WebSocket (Socket.IO) connections. For production real-time features, consider:
- Using Vercel Serverless Functions with polling
- Deploying Socket.IO server separately (Railway, Render, DigitalOcean)
- Using a managed real-time service (Pusher, Ably)

---

## Local Development with ngrok

ngrok allows you to expose your local development server to the internet, enabling testing on physical devices or sharing with team members.

### Step 1: Install ngrok
Download from [ngrok.com/download](https://ngrok.com/download) or install via package manager:

```bash
# Windows (Chocolatey)
choco install ngrok

# macOS (Homebrew)
brew install ngrok

# Or download binary directly
```

### Step 2: Sign up and Get Auth Token
1. Create account at [ngrok.com](https://ngrok.com)
2. Copy your auth token from the dashboard
3. Configure ngrok:
```bash
ngrok config add-authtoken YOUR_AUTH_TOKEN
```

### Step 3: Start Your Local Backend
```bash
cd server
npm run dev
```

Your server should be running on `http://localhost:3000`

### Step 4: Expose Backend with ngrok
In a new terminal:
```bash
ngrok http 3000
```

You'll see output like:
```
Session Status                online
Account                       your-email@example.com
Version                       3.x.x
Region                        United States (us)
Forwarding                    https://abc123.ngrok.io -> http://localhost:3000
```

### Step 5: Update Expo Configuration
Copy the `https://` URL from ngrok output and update your `.env`:

```bash
EXPO_PUBLIC_API_URL=https://abc123.ngrok.io/api
EXPO_PUBLIC_SOCKET_URL=wss://abc123.ngrok.io
EXPO_PUBLIC_API_TIMEOUT=15000
```

### Step 6: Restart Expo
```bash
npm start
```

Now you can:
- Test on physical devices over the internet
- Share the Expo link with team members
- Test from different networks

### ngrok Tips
- **Free tier limitations:** Random URLs, 2-hour session limit, 1 concurrent tunnel
- **Paid plans:** Custom domains, longer sessions, more tunnels
- **Keep terminal open:** Closing ngrok terminal stops the tunnel
- **Restart on URL change:** ngrok free tier gives new URL each restart

### Alternative: ngrok for Expo Dev Server
You can also expose the Expo dev server (useful for sharing the app):
```bash
ngrok http 8081
```

---

## Environment Variables

### Backend Variables (`server/.env`)

| Variable | Description | Example |
|----------|-------------|---------|
| `PORT` | Server port | `3000` |
| `MONGO_URI` | MongoDB connection string | `mongodb+srv://user:pass@cluster.mongodb.net/db` |
| `JWT_SECRET` | Secret key for JWT tokens | Generate with `openssl rand -hex 32` |
| `CLOUDINARY_URL` | Cloudinary API credentials | `cloudinary://key:secret@cloud-name` |

### Frontend Variables (`.env`)

| Variable | Description | Example |
|----------|-------------|---------|
| `EXPO_PUBLIC_API_URL` | Backend API base URL | `http://175.101.84.117:3000/api` or `https://api.example.com/api` |
| `EXPO_PUBLIC_SOCKET_URL` | WebSocket server URL | `ws://175.101.84.117:3000` or `wss://api.example.com` |
| `EXPO_PUBLIC_API_TIMEOUT` | API request timeout (ms) | `15000` |

### Generating Secure Secrets

**JWT Secret:**
```bash
# OpenSSL (Linux/macOS/Git Bash)
openssl rand -hex 32

# Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# PowerShell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

### Syncing Variables

When deploying to Vercel, ensure variable names match:
- Backend uses: `MONGO_URI`, `JWT_SECRET`, `CLOUDINARY_URL`
- Vercel secrets: Same names without `@` prefix
- Frontend prefixes public vars with: `EXPO_PUBLIC_`

---

## Mobile App Distribution

### Development Builds

**Expo Go (Development):**
```bash
npm start
```
Scan QR code with Expo Go app (iOS/Android)

**Local Network Testing:**
- Ensure `.env` uses your local IP (e.g., `192.168.1.x` or `175.101.84.117`)
- Both device and computer on same WiFi
- Firewall allows port 8081 (Expo) and 3000 (Backend)

### Production Builds

**Android APK:**
```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Configure build
eas build:configure

# Build APK
eas build --platform android --profile preview
```

**iOS (Requires Apple Developer Account):**
```bash
eas build --platform ios --profile preview
```

**Over-the-Air Updates:**
```bash
# Publish update
eas update --branch production --message "Bug fixes"
```

### TestFlight / Google Play Internal Testing

Follow platform-specific guides:
- [iOS TestFlight](https://docs.expo.dev/build/internal-distribution/)
- [Android Internal Testing](https://docs.expo.dev/build/internal-distribution/)

---

## Troubleshooting

### Backend Not Accessible
- ✅ Check firewall allows port 3000
- ✅ Verify `.env` file exists and has correct values
- ✅ Test locally: `curl http://localhost:3000/api/auth/profile`
- ✅ Check server logs for errors

### Socket.IO Connection Failed
- ✅ Ensure custom server running: `node server.js`
- ✅ Check WebSocket URL uses correct protocol (`ws://` or `wss://`)
- ✅ Verify JWT token is valid
- ✅ Check CORS settings in `server.js`

### Mobile App Can't Connect
- ✅ Same WiFi network for local development
- ✅ Use IP address (not `localhost`) in `.env`
- ✅ Clear Expo cache: `npm start -- --clear`
- ✅ Restart Expo dev server after `.env` changes

### MongoDB Connection Issues
- ✅ Whitelist IP address in MongoDB Atlas (or allow all: `0.0.0.0/0`)
- ✅ Check connection string format
- ✅ Verify database user has read/write permissions
- ✅ Test connection: `mongosh "YOUR_MONGO_URI"`

### Vercel Deployment Fails
- ✅ Check build logs in Vercel dashboard
- ✅ Ensure `package.json` has all dependencies
- ✅ Verify Next.js config is correct
- ✅ Test build locally: `npm run build`

---

## Production Checklist

Before deploying to production:

- [ ] Change `JWT_SECRET` to a strong random value
- [ ] Whitelist only necessary IPs in MongoDB Atlas
- [ ] Enable MongoDB connection encryption
- [ ] Set up Cloudinary transformations for image optimization
- [ ] Configure rate limiting in backend
- [ ] Enable HTTPS/WSS for all connections
- [ ] Set up error monitoring (Sentry, LogRocket)
- [ ] Test authentication flows end-to-end
- [ ] Verify Socket.IO reconnection handling
- [ ] Set up automated backups for MongoDB
- [ ] Review and restrict CORS origins in production
- [ ] Enable API request logging
- [ ] Set up health check endpoints
- [ ] Test on multiple devices and networks
- [ ] Configure CDN for media assets

---

## Support

For issues or questions:
- Check [Expo Documentation](https://docs.expo.dev/)
- Check [Next.js Documentation](https://nextjs.org/docs)
- Check [Vercel Documentation](https://vercel.com/docs)
- Review GitHub Issues (if open source)
