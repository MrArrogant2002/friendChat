# FriendlyChart - Build Instructions 🚀

Complete guide to building and deploying the FriendlyChart messaging application.

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Initial Setup](#initial-setup)
3. [Development Build](#development-build)
4. [Production Build](#production-build)
5. [Platform-Specific Instructions](#platform-specific-instructions)
6. [Environment Configuration](#environment-configuration)
7. [Troubleshooting](#troubleshooting)
8. [Deployment](#deployment)

---

## Prerequisites

### Required Software

#### Node.js & Package Manager
```bash
# Node.js version 18.x or higher
node --version  # Should be >= 18.0.0

# pnpm (recommended) or npm
pnpm --version  # Recommended: >= 8.0.0
# OR
npm --version   # Alternative: >= 9.0.0
```

#### Mobile Development Tools

**For Android:**
- Android Studio (latest stable version)
- Android SDK (API 33 or higher)
- Java JDK 17 or higher
- Android device or emulator

**For iOS (macOS only):**
- Xcode 15.0 or higher
- CocoaPods
- iOS Simulator or physical device
- Apple Developer Account (for device testing/production)

#### Expo CLI
```bash
# Install Expo CLI globally
npm install -g expo-cli

# OR use with npx (recommended)
npx expo --version
```

#### EAS CLI (for production builds)
```bash
# Install EAS CLI globally
npm install -g eas-cli

# Login to your Expo account
eas login
```

---

## Initial Setup

### 1. Clone the Repository

```bash
git clone https://github.com/MrArrogant2002/friendChat.git
cd friendChat
```

### 2. Install Dependencies

```bash
# Using pnpm (recommended)
pnpm install

# OR using npm
npm install
```

### 3. Configure Environment Variables

Create environment configuration (already done in `app.json`):

```json
{
  "expo": {
    "extra": {
      "eas": {
        "projectId": "dc1a36bc-f1af-4341-8970-e7969fa3913e"
      },
      "EXPO_PUBLIC_API_URL": "https://friend-chat-seven.vercel.app/api",
      "EXPO_PUBLIC_SOCKET_URL": "wss://friendchat-8nfh.onrender.com",
      "EXPO_PUBLIC_API_TIMEOUT": "15000"
    }
  }
}
```

**For custom backends, update:**
- `EXPO_PUBLIC_API_URL`: Your REST API endpoint
- `EXPO_PUBLIC_SOCKET_URL`: Your WebSocket server URL

### 4. Server Setup (Backend)

```bash
cd server

# Install server dependencies
pnpm install

# Configure MongoDB connection
# Create .env file with:
# MONGODB_URI=your_mongodb_connection_string
# JWT_SECRET=your_jwt_secret

# Start development server
pnpm dev

# Production
pnpm start
```

---

## Development Build

### Option 1: Expo Go (Quick Testing)

**Fastest way to test, but has limitations:**

```bash
# Start development server
npx expo start

# OR with cleared cache
npx expo start -c

# Scan QR code with:
# - Expo Go app on Android
# - Camera app on iOS
```

**Limitations:**
- ❌ No push notifications on Android (SDK 53+)
- ❌ No custom native modules
- ✅ Perfect for UI/UX testing
- ✅ Fast iteration

### Option 2: Development Build (Recommended)

**Full feature testing with native modules:**

#### Android Development Build

```bash
# Method 1: Local build (requires Android Studio)
npx expo prebuild --clean
npx expo run:android

# Method 2: EAS development build (cloud build)
eas build --profile development --platform android

# Install the .apk on your device
# Download from EAS or find in android/app/build/outputs/apk/
```

#### iOS Development Build (macOS only)

```bash
# Method 1: Local build (requires Xcode)
npx expo prebuild --clean
npx expo run:ios

# Method 2: EAS development build
eas build --profile development --platform ios

# Install on simulator or device via Xcode
```

---

## Production Build

### Configure EAS Build

Create `eas.json` if not exists:

```json
{
  "cli": {
    "version": ">= 5.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      },
      "ios": {
        "simulator": true
      }
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "autoIncrement": true,
      "android": {
        "buildType": "app-bundle"
      },
      "ios": {
        "bundleIdentifier": "com.friendlychart.app"
      }
    }
  },
  "submit": {
    "production": {
      "android": {
        "serviceAccountKeyPath": "./path-to-service-account.json",
        "track": "internal"
      },
      "ios": {
        "appleId": "your-apple-id@example.com",
        "ascAppId": "1234567890",
        "appleTeamId": "ABCD123456"
      }
    }
  }
}
```

### Android Production Build

#### 1. Generate Upload Keystore

```bash
cd android/app

# Generate keystore
keytool -genkeypair -v -storetype PKCS12 \
  -keystore friendlychart-upload.keystore \
  -alias friendlychart-key \
  -keyalg RSA -keysize 2048 -validity 10000

# Keep this file secure and backed up!
```

#### 2. Configure Gradle

Edit `android/gradle.properties`:

```properties
MYAPP_UPLOAD_STORE_FILE=friendlychart-upload.keystore
MYAPP_UPLOAD_KEY_ALIAS=friendlychart-key
MYAPP_UPLOAD_STORE_PASSWORD=your-keystore-password
MYAPP_UPLOAD_KEY_PASSWORD=your-key-password
```

#### 3. Build Production APK/AAB

```bash
# Using EAS (recommended)
eas build --platform android --profile production

# OR local build
cd android
./gradlew bundleRelease  # For AAB (Google Play)
./gradlew assembleRelease  # For APK (direct distribution)

# Output locations:
# AAB: android/app/build/outputs/bundle/release/app-release.aab
# APK: android/app/build/outputs/apk/release/app-release.apk
```

### iOS Production Build (macOS only)

#### 1. Configure Apple Developer Account

- Enroll in Apple Developer Program ($99/year)
- Create App ID in Apple Developer Portal
- Create provisioning profiles

#### 2. Build with EAS

```bash
# Production build
eas build --platform ios --profile production

# This will:
# - Archive the app
# - Sign with distribution certificate
# - Generate .ipa file for App Store
```

#### 3. Local Build with Xcode

```bash
# Generate iOS project
npx expo prebuild --clean

# Open in Xcode
open ios/friendlychart.xcworkspace

# In Xcode:
# 1. Select "Any iOS Device" or your device
# 2. Product > Archive
# 3. Distribute App > App Store Connect
```

---

## Platform-Specific Instructions

### Android

#### Prerequisites Setup

```bash
# Install Android Studio
# Download from: https://developer.android.com/studio

# Set environment variables in ~/.bashrc or ~/.zshrc:
export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/platform-tools
export PATH=$PATH:$ANDROID_HOME/tools
export PATH=$PATH:$ANDROID_HOME/tools/bin

# Verify setup
adb version
```

#### Configure Android SDK

```bash
# Open Android Studio > SDK Manager
# Install:
# - Android SDK Platform 33 (or latest)
# - Android SDK Build-Tools
# - Android Emulator
# - Android SDK Platform-Tools
```

#### Run on Emulator

```bash
# List available emulators
emulator -list-avds

# Start emulator
emulator -avd Pixel_5_API_33

# Run app
npx expo run:android
```

#### Run on Physical Device

```bash
# Enable USB debugging on device:
# Settings > About phone > Tap "Build number" 7 times
# Settings > Developer options > Enable "USB debugging"

# Connect device and verify
adb devices

# Run app
npx expo run:android
```

### iOS (macOS only)

#### Prerequisites Setup

```bash
# Install Xcode from App Store
# Install Xcode Command Line Tools
xcode-select --install

# Install CocoaPods
sudo gem install cocoapods

# OR using Homebrew
brew install cocoapods
```

#### Configure Xcode

1. Open Xcode > Preferences > Accounts
2. Add your Apple ID
3. Download certificates and provisioning profiles

#### Run on Simulator

```bash
# List available simulators
xcrun simctl list devices

# Run app (automatically opens simulator)
npx expo run:ios

# Specify simulator
npx expo run:ios --simulator="iPhone 15 Pro"
```

#### Run on Physical Device

```bash
# Connect iPhone/iPad via USB
# Trust computer on device

# Generate iOS project
npx expo prebuild

# Open in Xcode
open ios/friendlychart.xcworkspace

# Select your device in Xcode
# Click "Run" (▶️) button
```

---

## Environment Configuration

### Development Environment

```bash
# .env.development
EXPO_PUBLIC_API_URL=http://localhost:3000/api
EXPO_PUBLIC_SOCKET_URL=ws://localhost:3001
EXPO_PUBLIC_API_TIMEOUT=15000
```

### Staging Environment

```bash
# .env.staging
EXPO_PUBLIC_API_URL=https://staging-api.friendlychart.com/api
EXPO_PUBLIC_SOCKET_URL=wss://staging-socket.friendlychart.com
EXPO_PUBLIC_API_TIMEOUT=15000
```

### Production Environment

```bash
# .env.production
EXPO_PUBLIC_API_URL=https://friend-chat-seven.vercel.app/api
EXPO_PUBLIC_SOCKET_URL=wss://friendchat-8nfh.onrender.com
EXPO_PUBLIC_API_TIMEOUT=15000
```

### Update app.json with environment

Currently configured in `app.json` under `extra` field. For multiple environments, use `app.config.js`:

```javascript
module.exports = {
  expo: {
    name: process.env.APP_ENV === 'production' ? 'FriendlyChart' : 'FriendlyChart Dev',
    slug: 'friendly-chart',
    extra: {
      EXPO_PUBLIC_API_URL: process.env.EXPO_PUBLIC_API_URL,
      EXPO_PUBLIC_SOCKET_URL: process.env.EXPO_PUBLIC_SOCKET_URL,
      // ... other config
    }
  }
};
```

---

## Troubleshooting

### Common Issues

#### 1. Metro Bundler Issues

```bash
# Clear cache and restart
npx expo start -c

# Clear all caches
rm -rf node_modules
rm -rf .expo
pnpm install
```

#### 2. Android Build Fails

```bash
# Clean Android build
cd android
./gradlew clean
cd ..

# Rebuild
npx expo prebuild --clean
npx expo run:android
```

#### 3. iOS Build Fails

```bash
# Clean iOS build
cd ios
pod deintegrate
pod cache clean --all
pod install
cd ..

# Rebuild
npx expo prebuild --clean
npx expo run:ios
```

#### 4. Push Notifications Not Working

**In Expo Go:**
- Android: Not supported in SDK 53+ (need development build)
- iOS: Limited support

**Solution:**
```bash
# Build development build
eas build --profile development --platform android
```

#### 5. Socket Connection Fails

Check network configuration:
```bash
# For local development with physical device:
# Use your computer's IP instead of localhost
# Example: http://192.168.1.100:3000
```

#### 6. TypeScript Errors

```bash
# Run type check
pnpm run type-check

# Fix common issues
pnpm run lint:fix
```

#### 7. Dependencies Issues

```bash
# Clear lockfile and reinstall
rm pnpm-lock.yaml
rm -rf node_modules
pnpm install

# For iOS, also update pods
cd ios && pod install && cd ..
```

---

## Deployment

### Google Play Store (Android)

#### 1. Prepare Assets

- App icon: 512x512 PNG
- Feature graphic: 1024x500 PNG
- Screenshots: Various device sizes
- Privacy policy URL
- App description and metadata

#### 2. Build Production AAB

```bash
eas build --platform android --profile production
```

#### 3. Submit to Google Play Console

```bash
# Using EAS Submit
eas submit --platform android

# OR manual upload:
# 1. Go to play.google.com/console
# 2. Create app listing
# 3. Upload AAB file
# 4. Complete store listing
# 5. Submit for review
```

### Apple App Store (iOS)

#### 1. Prepare Assets

- App icon: 1024x1024 PNG
- Screenshots: iPhone and iPad sizes
- App preview video (optional)
- Privacy policy URL
- App description and metadata

#### 2. Build Production IPA

```bash
eas build --platform ios --profile production
```

#### 3. Submit to App Store Connect

```bash
# Using EAS Submit
eas submit --platform ios

# OR manual upload via Xcode:
# 1. Archive app in Xcode
# 2. Upload to App Store Connect
# 3. Complete app metadata
# 4. Submit for review
```

### Over-the-Air (OTA) Updates

For non-native code updates:

```bash
# Publish update to production
eas update --branch production --message "Bug fixes and improvements"

# Publish to specific channel
eas update --channel preview --message "Testing new features"
```

Configure in `app.json`:
```json
{
  "expo": {
    "updates": {
      "url": "https://u.expo.dev/dc1a36bc-f1af-4341-8970-e7969fa3913e"
    }
  }
}
```

---

## Build Optimization

### Reduce Bundle Size

```bash
# Enable Hermes (already enabled in app.json)
# Check android/app/build.gradle:
enableHermes: true

# Use ProGuard for Android
# Enable in android/app/build.gradle:
minifyEnabled true
shrinkResources true
```

### Optimize Assets

```bash
# Compress images
# Use tools like ImageOptim, TinyPNG

# Use appropriate image formats:
# - PNG for icons, logos with transparency
# - JPEG for photos
# - WebP for better compression
```

### Performance Profiling

```bash
# Android
npx expo run:android --variant release

# iOS
npx expo run:ios --configuration Release
```

---

## CI/CD Setup (Optional)

### GitHub Actions Example

Create `.github/workflows/build.yml`:

```yaml
name: Build App

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build-android:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - name: Setup Expo
        uses: expo/expo-github-action@v8
        with:
          expo-version: latest
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}
      - run: pnpm install
      - run: eas build --platform android --non-interactive --no-wait

  build-ios:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - name: Setup Expo
        uses: expo/expo-github-action@v8
        with:
          expo-version: latest
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}
      - run: pnpm install
      - run: eas build --platform ios --non-interactive --no-wait
```

---

## Quick Reference Commands

### Development

```bash
# Start development server
npx expo start

# Run on Android
npx expo run:android

# Run on iOS
npx expo run:ios

# Type check
pnpm run type-check

# Lint
pnpm run lint

# Format code
pnpm run format
```

### Building

```bash
# Development builds
eas build --profile development --platform android
eas build --profile development --platform ios

# Production builds
eas build --profile production --platform android
eas build --profile production --platform ios

# Both platforms
eas build --profile production --platform all
```

### Submission

```bash
# Submit to stores
eas submit --platform android
eas submit --platform ios
eas submit --platform all
```

### Updates

```bash
# Publish OTA update
eas update --branch production

# View update history
eas update:list
```

---

## Support & Resources

### Documentation
- [Expo Documentation](https://docs.expo.dev/)
- [React Native Documentation](https://reactnative.dev/)
- [EAS Documentation](https://docs.expo.dev/eas/)

### Community
- [Expo Forums](https://forums.expo.dev/)
- [React Native Community](https://www.reactnative.dev/community/overview)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/expo)

### Project Links
- Repository: https://github.com/MrArrogant2002/friendChat
- Issues: https://github.com/MrArrogant2002/friendChat/issues

---

## Changelog

Keep track of builds and versions:

### Version 1.0.0
- Initial release
- WhatsApp-style UI
- Real-time messaging
- Push notifications
- Friend management

---

**Last Updated:** November 1, 2025  
**Maintained by:** MrArrogant2002  
**License:** MIT
