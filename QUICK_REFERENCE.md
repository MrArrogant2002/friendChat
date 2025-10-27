# Quick Reference Card

## 🚀 Getting Started (First Time)

```bash
# 1. Run automated setup
npm run setup

# 2. Install dependencies
npm install
cd server && npm install && cd ..

# 3. Start backend
cd server && npm run dev

# 4. Start frontend (new terminal)
npm start
```

---

## 📱 Daily Development

### Start Servers
```bash
# Terminal 1: Backend
cd server && npm run dev

# Terminal 2: Frontend
npm start
```

### Clear Cache (if needed)
```bash
npm run start:clear
```

---

## 🌐 Testing on Devices

### Same WiFi Network
✅ **Already configured!** Your IP: `175.101.84.117`

1. Start both servers (above)
2. Scan QR code with Expo Go app
3. Both devices must be on same WiFi

### Remote Testing (ngrok)
```bash
# Terminal 1: Backend
cd server && npm run dev

# Terminal 2: ngrok
ngrok http 3000

# Terminal 3: Update .env then start
# Edit .env with ngrok URL:
# EXPO_PUBLIC_API_URL=https://[ngrok-url].ngrok-free.app/api
# EXPO_PUBLIC_SOCKET_URL=wss://[ngrok-url].ngrok-free.app
npm start -- --clear
```

---

## 🔧 Environment Files

### Frontend `.env` (project root)
```bash
EXPO_PUBLIC_API_URL=http://175.101.84.117:3000/api
EXPO_PUBLIC_SOCKET_URL=ws://175.101.84.117:3000
EXPO_PUBLIC_API_TIMEOUT=15000
```

### Backend `server/.env`
```bash
PORT=3000
MONGO_URI=mongodb+srv://[your-credentials]
JWT_SECRET=[generated-secret]
CLOUDINARY_URL=cloudinary://[your-credentials]
```

---

## 🐛 Troubleshooting

### Can't connect to backend?
```bash
# 1. Check backend is running
curl http://175.101.84.117:3000/api/auth/profile

# 2. Check firewall allows port 3000

# 3. Restart with cleared cache
npm start -- --clear
```

### Socket.IO not connecting?
```bash
# Check server is using custom server (not next dev)
cd server && npm run dev  # Should see "Socket.IO server running"
```

### MongoDB connection error?
```bash
# Check MongoDB Atlas Network Access
# Whitelist: 0.0.0.0/0 (for testing)
```

### Environment variables not working?
```bash
# Validate setup
npm run setup

# Ensure .env files exist
ls -la .env
ls -la server/.env
```

---

## 🚢 Deployment

### Deploy Backend (Vercel)
```bash
cd server
vercel login
vercel
# Set environment variables in Vercel dashboard
vercel --prod
```

### Build Mobile App (EAS)
```bash
eas login
eas build:configure
eas build --platform android
eas build --platform ios
```

---

## 📚 Documentation

- **[SETUP_COMPLETE.md](docs/SETUP_COMPLETE.md)** - Complete setup overview
- **[DEPLOYMENT.md](docs/DEPLOYMENT.md)** - Deployment guide
- **[NGROK_WORKFLOW.md](docs/NGROK_WORKFLOW.md)** - ngrok guide
- **[ENVIRONMENT_VARIABLES.md](docs/ENVIRONMENT_VARIABLES.md)** - Variable reference

---

## 🔑 Important URLs

- **Local API:** http://175.101.84.117:3000/api
- **Local WebSocket:** ws://175.101.84.117:3000
- **MongoDB Atlas:** https://cloud.mongodb.com
- **Cloudinary:** https://cloudinary.com/console
- **Vercel:** https://vercel.com/dashboard
- **ngrok:** https://dashboard.ngrok.com

---

## 💡 Common Commands

```bash
# Setup
npm run setup              # Validate environment
npm install               # Install frontend deps
cd server && npm install  # Install backend deps

# Development
npm start                 # Start Expo dev server
npm run start:clear       # Start with cleared cache
cd server && npm run dev  # Start backend with Socket.IO

# Testing
npm run android          # Open Android
npm run ios             # Open iOS
npm run web             # Open web

# Deployment
cd server && vercel      # Deploy backend
eas build               # Build mobile app
```

---

## 🆘 Quick Help

**Issue:** App can't find backend
**Fix:** Check `.env` has correct IP/URL and restart Expo

**Issue:** Real-time chat not working  
**Fix:** Ensure `server.js` is running (not `next dev`)

**Issue:** Authentication fails
**Fix:** Check `JWT_SECRET` is set in `server/.env`

**Issue:** Image upload fails
**Fix:** Verify `CLOUDINARY_URL` in `server/.env`

**Issue:** Can't connect from phone
**Fix:** Same WiFi network or use ngrok

---

## 📞 Support Resources

- Expo: https://docs.expo.dev
- Next.js: https://nextjs.org/docs  
- Socket.IO: https://socket.io/docs
- MongoDB: https://www.mongodb.com/docs
- Vercel: https://vercel.com/docs

---

**Version:** 1.0.0 | **Last Updated:** 2025
