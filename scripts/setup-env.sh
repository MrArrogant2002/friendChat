#!/bin/bash

# Environment Setup Script
# This script helps validate and set up environment variables for development

set -e

BOLD='\033[1m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BOLD}🔧 FriendChat Environment Setup${NC}\n"

# Function to check if a file exists
check_file() {
  if [ -f "$1" ]; then
    echo -e "${GREEN}✓${NC} Found: $1"
    return 0
  else
    echo -e "${RED}✗${NC} Missing: $1"
    return 1
  fi
}

# Function to generate random secret
generate_secret() {
  if command -v openssl &> /dev/null; then
    openssl rand -hex 32
  elif command -v node &> /dev/null; then
    node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  else
    echo "CHANGE_ME_$(date +%s)_$(shuf -i 1000-9999 -n 1)"
  fi
}

# Function to get local IP
get_local_ip() {
  if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || echo "localhost"
  elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux
    hostname -I | awk '{print $1}' || echo "localhost"
  else
    # Windows (Git Bash)
    ipconfig | grep -oP '(?<=IPv4 Address.*: )\d+\.\d+\.\d+\.\d+' | head -n 1 || echo "localhost"
  fi
}

echo -e "${BOLD}Step 1: Checking environment files...${NC}"

# Check frontend .env
if check_file ".env"; then
  echo "  Frontend environment already configured"
else
  echo "  Creating frontend .env from template..."
  
  if [ -f ".env.example" ]; then
    LOCAL_IP=$(get_local_ip)
    
    cat > .env << EOF
# Expo environment variables
# Generated on $(date)

# For local development (same WiFi)
EXPO_PUBLIC_API_URL=http://${LOCAL_IP}:3000/api
EXPO_PUBLIC_SOCKET_URL=ws://${LOCAL_IP}:3000
EXPO_PUBLIC_API_TIMEOUT=15000

# For ngrok (uncomment and update with your ngrok URL)
# EXPO_PUBLIC_API_URL=https://your-ngrok-url.ngrok-free.app/api
# EXPO_PUBLIC_SOCKET_URL=wss://your-ngrok-url.ngrok-free.app
EOF
    
    echo -e "${GREEN}✓${NC} Created .env with local IP: ${LOCAL_IP}"
    echo -e "${YELLOW}ℹ${NC} Update with ngrok URL if testing remotely"
  else
    echo -e "${RED}✗${NC} .env.example not found"
  fi
fi

echo ""

# Check backend .env
if check_file "server/.env"; then
  echo "  Backend environment already configured"
else
  echo "  Creating backend .env from template..."
  
  if [ -f "server/.env.example" ]; then
    JWT_SECRET=$(generate_secret)
    
    cat > server/.env << EOF
# Backend environment configuration
# Generated on $(date)
# IMPORTANT: Update these values before using in production!

PORT=3000
MONGO_URI=mongodb://localhost:27017/friendly-chart
JWT_SECRET=${JWT_SECRET}
CLOUDINARY_URL=cloudinary://API_KEY:API_SECRET@CLOUD_NAME

# MongoDB Atlas example:
# MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority

# Get Cloudinary credentials from: https://cloudinary.com/console
EOF
    
    echo -e "${GREEN}✓${NC} Created server/.env with generated JWT secret"
    echo -e "${YELLOW}ℹ${NC} Update MONGO_URI and CLOUDINARY_URL with your credentials"
  else
    echo -e "${RED}✗${NC} server/.env.example not found"
  fi
fi

echo ""
echo -e "${BOLD}Step 2: Checking dependencies...${NC}"

# Check if node_modules exists
if [ -d "node_modules" ]; then
  echo -e "${GREEN}✓${NC} Frontend dependencies installed"
else
  echo -e "${YELLOW}⚠${NC} Frontend dependencies not installed"
  echo "  Run: npm install (or pnpm install)"
fi

if [ -d "server/node_modules" ]; then
  echo -e "${GREEN}✓${NC} Backend dependencies installed"
else
  echo -e "${YELLOW}⚠${NC} Backend dependencies not installed"
  echo "  Run: cd server && npm install"
fi

echo ""
echo -e "${BOLD}Step 3: Environment validation...${NC}"

# Validate frontend .env
if [ -f ".env" ]; then
  if grep -q "localhost" .env; then
    echo -e "${YELLOW}⚠${NC} Frontend .env uses localhost (won't work on physical devices)"
    echo "  Update with your local IP or ngrok URL"
  elif grep -q "ngrok" .env; then
    echo -e "${GREEN}✓${NC} Frontend .env configured for ngrok"
  else
    echo -e "${GREEN}✓${NC} Frontend .env configured for network access"
  fi
fi

# Validate backend .env
if [ -f "server/.env" ]; then
  if grep -q "mongodb://localhost" server/.env; then
    echo -e "${YELLOW}⚠${NC} Backend uses local MongoDB (ensure MongoDB is running)"
  elif grep -q "mongodb+srv" server/.env; then
    echo -e "${GREEN}✓${NC} Backend configured for MongoDB Atlas"
  fi
  
  if grep -q "CHANGE_ME\|cloudinary://API_KEY" server/.env; then
    echo -e "${YELLOW}⚠${NC} Backend has placeholder values"
    echo "  Update JWT_SECRET and CLOUDINARY_URL"
  fi
fi

echo ""
echo -e "${BOLD}📝 Next Steps:${NC}"
echo ""
echo "1. ${BOLD}Update environment variables:${NC}"
echo "   - Edit .env with your network setup"
echo "   - Edit server/.env with MongoDB and Cloudinary credentials"
echo ""
echo "2. ${BOLD}Start the backend:${NC}"
echo "   cd server && npm run dev"
echo ""
echo "3. ${BOLD}Start the frontend (new terminal):${NC}"
echo "   npm start"
echo ""
echo "4. ${BOLD}For remote testing with ngrok:${NC}"
echo "   ngrok http 3000"
echo "   Then update .env with the ngrok URL"
echo ""
echo -e "${BOLD}📚 Documentation:${NC}"
echo "   - docs/DEPLOYMENT.md - Full deployment guide"
echo "   - docs/NGROK_WORKFLOW.md - ngrok setup and usage"
echo ""
echo -e "${GREEN}✓ Setup complete!${NC}"
