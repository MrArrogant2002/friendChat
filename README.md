# Project Template

A minimal Expo + Expo Router + React Native (TypeScript) starter with NativeWind (Tailwind) support.

This repository uses Expo, `expo-router`, and NativeWind for Tailwind-style styling.

## Quick overview

- Framework: Expo (React Native)
- Router: `expo-router`
- Styling: Tailwind via `nativewind` and `tailwindcss`
- Language: TypeScript

## Common scripts

The following scripts are available from `package.json`:

- `pnpm start` — run the Expo Metro dev server (same as `expo start`)
- `pnpm android` — start and open Android
- `pnpm ios` — start and open iOS
- `pnpm web` — open the web build
- `pnpm lint` — run ESLint
- `pnpm run reset-project` — custom reset script (see `scripts/reset-project.js`)

You can run them with `pnpm` (or `npm run ...` / `yarn ...`).

## Run (dev)

Start the dev server:

```bash
pnpm start
```

From the Expo dev tools you can:

- Press `a` to open Android emulator/device
- Press `i` to open iOS simulator
- Press `w` to open in web browser

Or directly run:

```bash
pnpm android
pnpm ios
pnpm web
```

## Project file layout

```
app/
   _layout.tsx      # Root layout for expo-router (renders <Stack />)
   index.tsx        # Home screen (edit this)
   global.css       # Global CSS (Tailwind / NativeWind)
assets/
   images/          # Images and media
app.json
package.json
pnpm-lock.yaml
tailwind.config.js
babel.config.js
tsconfig.json
```

## Key files & small templates

Below are the existing minimal templates in this repo. You can copy/replace them when you need to scaffold new screens.

- `app/index.tsx` (home screen)

```tsx
import { Text, View } from 'react-native';

export default function Index() {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <Text>Edit app/index.tsx to edit this screen.</Text>
    </View>
  );
}
```

- `app/_layout.tsx` (expo-router root layout)

```tsx
import { Stack } from 'expo-router';
import './global.css';

export default function RootLayout() {
  return <Stack />;
}
```

- `app/global.css` (Tailwind entry, nativewind should be configured in `tailwind.config.js`)

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Add global styles here */
```

## NativeWind / Tailwind notes

This repo includes `nativewind` and `tailwindcss` in dependencies. If you need to reconfigure:

1. Check `tailwind.config.js` for content paths (should include `app/**/*.{js,ts,tsx}`)
2. Restart Metro bundler after changing Tailwind config

If Tailwind classes aren’t applied, ensure the NativeWind babel plugin is present in `babel.config.js` and restart the bundler.

## TypeScript

This project uses TypeScript (see `tsconfig.json`). Keep `nativewind-env.d.ts` for global Tailwind types.

## Assets

Put images in `assets/images` and reference them with `require("../assets/images/your.png")` or `import` when using `expo-asset`/`expo-image`.

## Troubleshooting

- Metro cache issues: `pnpm start -- --clear` or `expo start -c`
- iOS simulator not opening: ensure Xcode Command Line Tools installed and simulator available
- Android emulator: ensure Android Studio and an AVD are configured
- If Tailwind classes don’t apply, restart Metro and ensure `nativewind` Babel plugin is enabled in `babel.config.js`.

---

## FriendChat Messaging App (Next.js Backend)

The template now targets a Next.js API backend (see the `server/` folder) instead of Firebase. The Expo client ships with React Navigation, React Native Paper theming, and placeholder screens for login, registration, chat, charts, and profile flows.

### Frontend overview

- Expo Router entry delegates to `app/navigation/AppNavigator.tsx` (stack + tabs).
- UI primitives come from React Native Paper with custom MD3 light/dark themes in `app/theme`.
- Screens live in `app/screens/*` and are mocked against static data until the API hooks are wired up.

### Backend overview

- The Next.js project under `server/` exposes route handlers for auth, chat, chart history, and file uploads.
- MongoDB access is handled through a connection helper with global caching to support serverless environments.
- JWT authentication, Cloudinary uploads, and REST smoke tests live in `server/app`, `server/lib`, and `server/tests` respectively.

### Local development

1. Install dependencies in both workspaces (root Expo app and `server/`):

```bash
pnpm install
cd server && pnpm install
```

2. Set up environment variables:

**Frontend (`.env` in project root):**

```bash
cp .env.example .env
# Edit .env with your local IP or ngrok URL
```

**Backend (`server/.env`):**

```bash
cd server
cp .env.example .env
# Edit server/.env with MongoDB, JWT, and Cloudinary credentials
```

3. Start the Next.js backend with Socket.IO:

```bash
cd server
npm run dev
```

The backend will start on `http://0.0.0.0:3000` (accessible from other devices on your network)

4. In a separate terminal, run the Expo frontend:

```bash
npm start
```

### Testing on Physical Devices

**Option 1: Same WiFi Network**

- Update `.env` with your local IP address (e.g., `http://175.101.84.117:3000`)
- Both devices must be on the same network
- Ensure firewall allows ports 3000 (backend) and 8081 (Expo)

**Option 2: ngrok (Remote Testing)**

- Install ngrok: https://ngrok.com/download
- Start ngrok: `ngrok http 3000`
- Update `.env` with ngrok URL (e.g., `https://abc123.ngrok-free.app`)
- See [docs/NGROK_WORKFLOW.md](docs/NGROK_WORKFLOW.md) for detailed guide

### Deployment

**Backend API (Vercel):**

```bash
cd server
vercel --prod
```

**Socket.IO Server (Railway):**

- Deploy from GitHub at https://railway.app
- Root directory: `server`
- Start command: `node socket-server.js`
- See [docs/SOCKET_DEPLOYMENT.md](docs/SOCKET_DEPLOYMENT.md)

**Environment Variables:**

- Vercel: `MONGO_URI`, `JWT_SECRET`, `CLOUDINARY_URL`
- Railway: `JWT_SECRET`, `ALLOWED_ORIGINS`, `PORT`

**Mobile App (EAS Build):**

```bash
eas build --platform android --profile preview
eas build --platform ios --profile preview
```

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for complete deployment guide.

### Documentation

- [SETUP_COMPLETE.md](docs/SETUP_COMPLETE.md) - **START HERE** - Overview of completed setup
- [DEPLOYMENT.md](docs/DEPLOYMENT.md) - Complete deployment guide for Vercel and mobile builds
- [SOCKET_DEPLOYMENT.md](docs/SOCKET_DEPLOYMENT.md) - Socket.IO separate deployment guide
- [NGROK_WORKFLOW.md](docs/NGROK_WORKFLOW.md) - Using ngrok for remote testing
- [ENVIRONMENT_VARIABLES.md](docs/ENVIRONMENT_VARIABLES.md) - Complete variable reference and troubleshooting
- [TODO.md](docs/TODO.md) - Project roadmap and pending tasks

### Next steps

- Hook React Query or custom hooks to call the Next.js endpoints.
- Add Socket.IO client bindings for live chat updates.
- Replace placeholder data in the Paper-based screens with real API responses.
