# Socket.IO Separate Deployment Guide

This guide covers deploying the Socket.IO server separately from the Next.js API.

## Architecture Overview

```
┌─────────────────┐
│   Mobile App    │
│   (Expo)        │
└────────┬────────┘
         │
    ┌────┴─────┐
    │          │
    ▼          ▼
┌──────┐   ┌──────────┐
│ API  │   │ Socket.IO│
│Vercel│   │ Railway  │
└──────┘   └──────────┘
    │          │
    └────┬─────┘
         ▼
    ┌─────────┐
    │ MongoDB │
    │ Atlas   │
    └─────────┘
```

## Why Separate?

- **Vercel** uses serverless functions → No persistent WebSocket connections
- **Socket.IO** needs a persistent server → Deploy to Railway/Render/DigitalOcean
- **Best of both worlds:** Serverless API + Real-time messaging

---

## Deployment Steps

### Step 1: Deploy API to Vercel

Your Next.js API routes work perfectly on Vercel.

**Build Settings:**
- **Framework:** Next.js
- **Root Directory:** `server`
- **Build Command:** `npm run build`
- **Output Directory:** `.next`
- **Install Command:** `npm install`

**Environment Variables in Vercel:**
```
MONGO_URI=mongodb+srv://...
JWT_SECRET=your-secret-here
CLOUDINARY_URL=cloudinary://...
```

**Deploy:**
```bash
cd server
vercel --prod
```

Your API will be at: `https://your-project.vercel.app`

---

### Step 2: Deploy Socket.IO to Railway

Railway is perfect for Socket.IO servers (free tier available).

#### 2.1 Create Railway Account
1. Go to https://railway.app
2. Sign up with GitHub
3. Click "New Project"

#### 2.2 Deploy from GitHub
1. Click "Deploy from GitHub repo"
2. Select your repository
3. Select the `main` branch

#### 2.3 Configure Service
1. Click on your service
2. Go to "Settings"
3. Set **Root Directory:** `server`
4. Set **Start Command:** `node socket-server.js`

#### 2.4 Add Environment Variables
Go to "Variables" tab and add:

```
NODE_ENV=production
PORT=3001
JWT_SECRET=your-jwt-secret-here
ALLOWED_ORIGINS=*
SOCKET_PORT=3001
```

For production, replace `*` with your actual origins:
```
ALLOWED_ORIGINS=https://your-app.vercel.app,exp://your-expo-app
```

#### 2.5 Generate Domain
1. Go to "Settings"
2. Click "Generate Domain"
3. You'll get something like: `your-app.up.railway.app`

Your Socket.IO server is now at: `wss://your-app.up.railway.app`

---

### Step 3: Update Frontend Configuration

Update your `.env` file:

```bash
# API (Vercel)
EXPO_PUBLIC_API_URL=https://your-project.vercel.app/api

# Socket.IO (Railway)
EXPO_PUBLIC_SOCKET_URL=wss://your-app.up.railway.app

EXPO_PUBLIC_API_TIMEOUT=15000
```

---

## Alternative: Deploy to Render

Render is another great option with a free tier.

### Render Deployment:

1. **Create Render Account:** https://render.com
2. **New Web Service** → Connect your GitHub repo
3. **Settings:**
   - **Name:** friendchat-socket
   - **Root Directory:** `server`
   - **Build Command:** `npm install`
   - **Start Command:** `node socket-server.js`
   - **Plan:** Free

4. **Environment Variables:**
   ```
   NODE_ENV=production
   JWT_SECRET=your-secret
   ALLOWED_ORIGINS=*
   ```

5. **Deploy** → Get URL like: `https://friendchat-socket.onrender.com`

---

## Alternative: Deploy to DigitalOcean App Platform

For more control and better performance.

### DigitalOcean Setup:

1. **Create Account:** https://digitalocean.com
2. **App Platform** → Create App
3. **Connect GitHub** → Select your repo
4. **Configure:**
   - **Type:** Web Service
   - **Source Directory:** `/server`
   - **Build Command:** `npm install`
   - **Run Command:** `node socket-server.js`
   - **HTTP Port:** 3001

5. **Environment Variables:** Same as above

6. **Deploy** → Get URL like: `https://friendchat-socket-xxxxx.ondigitalocean.app`

---

## Local Development

For local development, you can still use the combined server:

```bash
# Terminal 1: Combined server (API + Socket.IO)
cd server
npm run dev

# Terminal 2: Frontend
npm start
```

Or run them separately:

```bash
# Terminal 1: Next.js API only
cd server
npm run dev:api

# Terminal 2: Socket.IO server only
cd server
npm run dev:socket

# Terminal 3: Frontend
npm start
```

---

## Testing Your Deployment

### Test API (Vercel):
```bash
curl https://your-project.vercel.app/api/auth/profile
```

### Test Socket.IO (Railway):
```bash
curl https://your-app.up.railway.app/health
```

Should return:
```json
{
  "status": "ok",
  "service": "FriendChat Socket.IO Server",
  "uptime": 123.45,
  "timestamp": "2025-10-27T..."
}
```

### Test from Mobile App:
1. Update `.env` with production URLs
2. Restart Expo: `npm start -- --clear`
3. Test login and sending messages
4. Real-time messages should work!

---

## Monitoring

### Railway:
- View logs in Railway dashboard
- Monitor CPU/Memory usage
- Set up alerts

### Vercel:
- View function logs
- Monitor API performance
- Check error rates

---

## Costs

### Free Tier Limits:

**Vercel:**
- ✅ 100GB bandwidth/month
- ✅ Unlimited projects
- ✅ Free hobby plan

**Railway:**
- ✅ $5 free credit/month
- ✅ ~500 hours uptime
- ✅ Sleeps after inactivity

**Render:**
- ✅ Free tier available
- ⚠️ Sleeps after 15 min inactivity
- ⚠️ Cold start ~30 seconds

**DigitalOcean:**
- 💰 $5/month minimum
- ✅ No sleep
- ✅ Better performance

### Recommendation:
- **Development/Small projects:** Railway (free tier)
- **Medium traffic:** Render or Railway paid
- **Production/High traffic:** DigitalOcean or AWS

---

## Troubleshooting

### Socket.IO Connection Failed

**Check:**
1. Is Socket.IO server running?
2. Is `EXPO_PUBLIC_SOCKET_URL` correct?
3. Is `JWT_SECRET` same on both servers?
4. Are origins allowed in `ALLOWED_ORIGINS`?

**Test connection:**
```bash
wscat -c wss://your-app.up.railway.app
```

### Messages Not Real-Time

**Check:**
1. Socket.IO server logs for connections
2. JWT token is valid and not expired
3. Client is joining chat rooms
4. CORS settings allow your domain

### Railway/Render App Sleeping

**Solutions:**
1. Upgrade to paid plan
2. Use a ping service (UptimeRobot)
3. Accept cold starts for free tier

---

## Security Checklist

- [ ] Use strong JWT_SECRET (different from API)
- [ ] Set specific ALLOWED_ORIGINS (no *)
- [ ] Enable HTTPS/WSS only
- [ ] Validate all socket events
- [ ] Rate limit connections
- [ ] Monitor for abuse
- [ ] Keep dependencies updated

---

## Summary

**Two-Server Setup:**

1. **Vercel (API):**
   - Build: `npm run build`
   - Start: `next start`
   - URL: `https://your-project.vercel.app`

2. **Railway (Socket.IO):**
   - Start: `node socket-server.js`
   - URL: `wss://your-app.up.railway.app`

3. **Frontend:**
   ```bash
   EXPO_PUBLIC_API_URL=https://your-project.vercel.app/api
   EXPO_PUBLIC_SOCKET_URL=wss://your-app.up.railway.app
   ```

**You're all set! Both services work together seamlessly.** 🚀
