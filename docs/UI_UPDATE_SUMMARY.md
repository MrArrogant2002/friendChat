Friends UI — Update Summary

What I changed:

- Removed the story/status row at the top of the Friends screen.
- Added header Add Friend icon (top-right) — opens Search tab.
- Added floating Add Friend FAB (bottom-right) — opens Search tab.
- Replaced single-list view with 3 tabs: Friends, Requests, Search.
- Search: debounced (250ms) and uses existing `/friends/search` API.
- Requests: added backend support and a Requests tab that lists pending requests.
  - Accept and Reject actions are now available in the Requests tab.
  - Accept/Reject use optimistic updates (item is removed from UI immediately; on failure it is restored).
- Friends: list now shows a green online badge when the server includes `isOnline: true` on friend profiles.

Server changes added:

- New model: `FriendRequest` (server/models/FriendRequest.ts). Stores from, to, status (pending|accepted|rejected).
- New controller: `friendRequestController.ts` with helpers to send, list, accept and reject requests.
- New API routes (Next.js App Router):
  - GET `/friends/requests` — list pending requests for the authenticated user
  - POST `/friends/requests/[id]/accept` — accept the request
  - POST `/friends/requests/[id]/reject` — reject the request

Client changes added:

- `src/lib/api/friends.ts` now includes:
  - `getFriendRequests()` -> GET `/friends/requests`
  - `acceptFriendRequest(requestId)` -> POST `/friends/requests/:id/accept`
  - `rejectFriendRequest(requestId)` -> POST `/friends/requests/:id/reject`
- `src/hooks/useFriends.ts`:
  - `useFriendRequests()` hook for fetching and accepting/rejecting requests (returns `accept` and `reject` helpers and handles refetching).
- `app/screens/FriendsScreen.tsx`:
  - Uses `useFriendRequests()` and shows the Requests tab with Accept/Reject buttons.
  - Implements optimistic UI removal for requests.

Notes & next steps

- The Requests endpoints and friend request model are new. If you have existing requests data, you may need a migration.
- Accepting a request creates friendship records in the existing `Friendship` model (both directions). It does not yet auto-create a chatroom; if you want that I can add it and return a chatId to the client so the app can navigate directly into the new chat after accept.
- If you want push notifications when requests arrive/accepted, we can integrate that with your notification pipeline.

How to test quickly

1. Start the server (where your Next.js API runs) and the mobile app.
2. Use two users in the app (A and B). From A, search for B and "Add Friend".
3. In B's app, open Friends -> Requests. You should see the request. Try Accept/Reject. Accept should add the friend to the Friends tab (may require a refresh if not automatic).

If you'd like I can now:
- Add auto-create chatroom on accept (server + return chatId so the mobile app can open the chat immediately).
- Add small animations/optimistic toasts to the frontend for better UX.

Tell me which of those you'd like next (I can implement auto-chat creation now if you want).