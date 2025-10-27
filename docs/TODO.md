# Project TODO

## Backend (Next.js API + MongoDB)
- [x] Restore Next.js tooling (package scripts, config files, `next-env.d.ts`)
- [x] Implement Mongo connection helper with Next.js global caching
- [x] Port auth/message/friend controllers to shared service layer
- [x] Add Next App Router route handlers for auth/message/friend endpoints
- [x] Integrate Multer/Cloudinary in API routes with streaming support
- [x] Add API smoke tests or Postman collection
- [ ] Add integration tests for chat and friends flows
- [x] Harden Socket.IO auth + room lifecycle handling

## Frontend (Expo + React Native)
- [x] Scaffold navigation (stack + bottom tabs) with React Navigation
- [x] Integrate React Native Paper theme + layout primitives
- [x] Implement screens: Login, Register, Chat List, Chat Room, Friends, Profile
- [x] Set up Axios API client + hooks for backend communication
- [x] Add Socket.IO client hook for real-time messaging
- [x] Wire Expo ImagePicker, AV audio recording
- [x] Remove Firebase modules/config and migrate to new data flows
- [x] Add optimistic updates for friend additions
- [x] Add UI states for empty/new chat creation

## Environment & Deployment
- [x] Provide unified `.env.example` files for frontend and backend
- [x] Add `vercel.json` backend deployment config
- [x] Document ngrok workflow for local backend ➝ Expo client
- [x] Sync Vercel environment variable names with Expo configuration docs
- [x] Create environment setup scripts for Windows and Unix systems
- [x] Add comprehensive deployment documentation (DEPLOYMENT.md)
- [x] Create detailed ngrok workflow guide (NGROK_WORKFLOW.md)

## Documentation & Cleanup
- [x] Update root `README.md` with new architecture + setup steps
- [x] Remove unused legacy files (Firebase, Express) and directories
- [x] Run ESLint/Prettier + TypeScript checks in CI/local scripts
- [x] Replace lingering "Friendly Chart" references with updated product naming
