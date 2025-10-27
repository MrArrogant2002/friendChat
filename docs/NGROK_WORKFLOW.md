# ngrok Workflow Guide

Complete guide for using ngrok to expose your local backend for testing with physical devices and remote team members.

## Why Use ngrok?

ngrok creates a secure tunnel from a public URL to your local development server, enabling:
- ✅ Testing on physical devices without same WiFi requirement
- ✅ Sharing work-in-progress with team members
- ✅ Testing webhooks and external integrations
- ✅ Debugging issues on different networks
- ✅ Quick demo without full deployment

## Quick Start (5 Minutes)

### 1. Install ngrok

**Windows:**
```bash
# Using Chocolatey
choco install ngrok

# Or download from https://ngrok.com/download
```

**macOS:**
```bash
brew install ngrok
```

**Linux:**
```bash
# Snap
sudo snap install ngrok

# Or download binary
wget https://bin.equinox.io/c/bNyj1mQVY4c/ngrok-v3-stable-linux-amd64.tgz
tar xvzf ngrok-v3-stable-linux-amd64.tgz
sudo mv ngrok /usr/local/bin/
```

### 2. Sign Up and Authenticate

1. Create free account: https://dashboard.ngrok.com/signup
2. Get your auth token from: https://dashboard.ngrok.com/get-started/your-authtoken
3. Configure ngrok:

```bash
ngrok config add-authtoken YOUR_AUTH_TOKEN_HERE
```

### 3. Start Backend Server

```bash
cd server
npm run dev
```

Backend should be running on `http://localhost:3000`

### 4. Start ngrok Tunnel

Open a **new terminal** (keep backend running):

```bash
ngrok http 3000
```

You'll see:
```
ngrok                                                                    

Session Status                online
Account                       your-email@example.com (Plan: Free)
Version                       3.x.x
Region                        United States (us)
Latency                       25ms
Web Interface                 http://127.0.0.1:4040
Forwarding                    https://abc123def456.ngrok-free.app -> http://localhost:3000

Connections                   ttl     opn     rt1     rt5     p50     p90
                              0       0       0.00    0.00    0.00    0.00
```

### 5. Update Expo Configuration

Copy the **https** URL from "Forwarding" line:

```bash
# .env file in project root
EXPO_PUBLIC_API_URL=https://abc123def456.ngrok-free.app/api
EXPO_PUBLIC_SOCKET_URL=wss://abc123def456.ngrok-free.app
EXPO_PUBLIC_API_TIMEOUT=15000
```

### 6. Restart Expo

```bash
# Kill current Expo process (Ctrl+C)
# Restart with cleared cache
npm start -- --clear
```

### 7. Test on Any Device

Now you can:
- Scan QR code from anywhere (not just local WiFi)
- Share link with remote team members
- Test on cellular data
- Debug network-specific issues

## Advanced Usage

### Custom Subdomain (Paid Plans)

```bash
ngrok http 3000 --subdomain=myapp-backend
```

URL will be: `https://myapp-backend.ngrok.io`

### Configuration File

Create `~/.ngrok2/ngrok.yml`:

```yaml
version: "2"
authtoken: YOUR_AUTH_TOKEN
tunnels:
  backend:
    proto: http
    addr: 3000
    subdomain: myapp-backend  # Requires paid plan
  expo:
    proto: http
    addr: 8081
```

Start multiple tunnels:
```bash
ngrok start backend expo
```

### Inspect Traffic

ngrok provides a web interface at `http://127.0.0.1:4040`:
- View all HTTP requests/responses
- Replay requests for debugging
- See response times and status codes
- Inspect headers and bodies

Open in browser:
```bash
open http://127.0.0.1:4040  # macOS
start http://127.0.0.1:4040  # Windows
```

### Basic Authentication

Protect your tunnel with password:

```bash
ngrok http 3000 --basic-auth="username:password"
```

### Specific Region

Choose closest region for better latency:

```bash
ngrok http 3000 --region=us  # United States
ngrok http 3000 --region=eu  # Europe
ngrok http 3000 --region=ap  # Asia/Pacific
ngrok http 3000 --region=au  # Australia
ngrok http 3000 --region=sa  # South America
ngrok http 3000 --region=jp  # Japan
ngrok http 3000 --region=in  # India
```

### Reserve Domain (Paid)

Get a permanent domain that doesn't change:

1. Reserve domain in ngrok dashboard
2. Use it:
```bash
ngrok http 3000 --domain=myapp.ngrok.dev
```

## Common Workflows

### Daily Development

1. **Morning Setup:**
   ```bash
   # Terminal 1
   cd server
   npm run dev
   
   # Terminal 2
   ngrok http 3000
   
   # Terminal 3
   cd ..
   npm start
   ```

2. **Update .env with ngrok URL** (if it changed)

3. **Restart Expo** if .env changed

### Demo to Client/Team

1. Start ngrok with reserved domain (if you have one)
2. Share ngrok URL + Expo link
3. They can test immediately without installing anything locally

### Testing Webhooks

1. Start ngrok
2. Use ngrok HTTPS URL in webhook configuration
3. Monitor requests in web interface (`http://127.0.0.1:4040`)

### Testing on Multiple Devices

1. Start ngrok once
2. Use same URL on all devices
3. All devices connect to your local backend

## Troubleshooting

### ngrok URL Changes Every Time

**Problem:** Free plan generates random URL on each start

**Solutions:**
- Note new URL and update `.env` each time
- Upgrade to paid plan for reserved domains
- Use ngrok API to get current URL programmatically

### "ERR_NGROK_3004" or Similar

**Problem:** Auth token not configured

**Solution:**
```bash
ngrok config add-authtoken YOUR_TOKEN
```

### Connection Timeout

**Problem:** Backend not running or wrong port

**Solutions:**
- Verify backend is running: `curl http://localhost:3000`
- Check port number matches
- Ensure no other process using port 3000

### CORS Errors

**Problem:** Backend rejecting ngrok requests

**Solution:** Update CORS in `server/server.js`:
```javascript
const io = new Server(server, {
  cors: {
    origin: '*', // Or specify ngrok domain
    methods: ['GET', 'POST'],
    credentials: true,
  },
});
```

### Expo Not Updating with New URL

**Problem:** Expo cached old configuration

**Solution:**
```bash
npm start -- --clear
```

### Socket.IO Not Connecting

**Problems & Solutions:**

1. **Wrong protocol:**
   - Use `wss://` (not `ws://`) with ngrok HTTPS
   
2. **Update socket client transports:**
   Already configured in `src/lib/socket/client.ts`:
   ```typescript
   transports: ['websocket', 'polling']
   ```

3. **Check ngrok web interface** for WebSocket upgrade requests

### MongoDB Connection from ngrok

**Problem:** MongoDB Atlas blocking connections

**Solution:**
- MongoDB Atlas → Network Access → Add IP Address
- Add `0.0.0.0/0` (allow all) for testing
- Or use MongoDB connection string with `retryWrites=true`

## Free vs Paid Plans

### Free Plan Limitations
- ❌ Random URLs each restart
- ❌ 2-hour session timeout
- ❌ 1 simultaneous tunnel
- ❌ Rate limiting on connections
- ✅ HTTPS included
- ✅ Web interface
- ✅ Unlimited bandwidth

### Paid Plans ($8-$20/month)
- ✅ Reserved domains
- ✅ Longer/unlimited sessions
- ✅ Multiple tunnels
- ✅ Custom domains
- ✅ IP whitelisting
- ✅ Higher rate limits

For serious development work, paid plan is recommended.

## Best Practices

### Security
1. **Never commit ngrok URLs** to version control
2. **Use authentication** for sensitive demos
3. **Rotate auth tokens** periodically
4. **Monitor traffic** in web interface
5. **Close tunnels** when not in use

### Performance
1. **Choose nearest region** for better latency
2. **Keep tunnels open** during active development
3. **Monitor request logs** for slow endpoints
4. **Use compression** in backend responses

### Team Collaboration
1. **Use reserved domains** for consistent URLs
2. **Document current ngrok URL** in team chat
3. **Notify team** when restarting tunnel
4. **Use basic auth** for shared tunnels

## Alternatives to ngrok

If ngrok doesn't meet your needs:

- **localtunnel:** Free, open source, similar features
- **Cloudflare Tunnel:** Free, requires Cloudflare account
- **serveo:** SSH-based tunneling, no signup
- **Tailscale:** Private network, great for teams
- **frp:** Self-hosted, more control

## Integration with Expo

### Automatic URL Update (Advanced)

Create a script to automatically update `.env` with ngrok URL:

```javascript
// scripts/update-ngrok-url.js
const axios = require('axios');
const fs = require('fs');

async function updateNgrokUrl() {
  try {
    const response = await axios.get('http://127.0.0.1:4040/api/tunnels');
    const httpsUrl = response.data.tunnels.find(t => t.proto === 'https')?.public_url;
    
    if (httpsUrl) {
      const envContent = `EXPO_PUBLIC_API_URL=${httpsUrl}/api
EXPO_PUBLIC_SOCKET_URL=${httpsUrl.replace('https', 'wss')}
EXPO_PUBLIC_API_TIMEOUT=15000
`;
      fs.writeFileSync('.env', envContent);
      console.log('✅ Updated .env with ngrok URL:', httpsUrl);
    }
  } catch (error) {
    console.error('❌ Error updating ngrok URL:', error.message);
  }
}

updateNgrokUrl();
```

Run after starting ngrok:
```bash
node scripts/update-ngrok-url.js
npm start -- --clear
```

## Summary

ngrok is essential for:
- 🚀 **Rapid testing** on physical devices
- 🤝 **Team collaboration** without full deployment
- 🐛 **Debugging** network-specific issues
- 🎯 **Demos** to clients/stakeholders
- 🔗 **Webhook testing** with external services

**Standard Workflow:**
```bash
# 1. Start backend
cd server && npm run dev

# 2. Start ngrok (new terminal)
ngrok http 3000

# 3. Update .env with ngrok URL
# EXPO_PUBLIC_API_URL=https://[ngrok-url].ngrok-free.app/api
# EXPO_PUBLIC_SOCKET_URL=wss://[ngrok-url].ngrok-free.app

# 4. Start Expo (new terminal)
npm start -- --clear
```

That's it! Your local backend is now accessible worldwide. 🌍
