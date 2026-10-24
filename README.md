# Quick Call — Phase 1

A static, serverless, two-person WebRTC video call built with React, TypeScript, and Vite.

## Run locally

```bash
npm install
npm run dev
```

`localhost` may use camera and microphone without HTTPS. Physical phones require the app to be served over HTTPS.

## Manual call flow

1. Browser A starts a call and creates an invitation.
2. Browser B opens the invitation, joins, and sends the generated response URL back.
3. Browser A opens the response URL on the same device. `BroadcastChannel` delivers it to the original call tab.
4. If automatic delivery fails, paste the response URL into **Connection problem? Import response** in Browser A's call tab.
5. Keep both original call tabs open. Media and the control channel connect directly between them.

There is intentionally no backend, room server, database, WebSocket signaling, TURN server, or media server. Calls are direct P2P and therefore may not connect through restrictive carrier or corporate networks.

## Checks

```bash
npm test
npm run typecheck
npm run build
```

## Cloudflare Workers deployment

The app is deployed as static assets only; there is no backend Worker entry point.

```bash
npm run preview
npm run deploy
```

Wrangler publishes `./dist` and serves `index.html` as the fallback for SPA routes.

Development builds include a per-peer diagnostics panel with connection state, ICE state, data-channel state, bitrates, RTT, loss, frame counts, and outgoing resolution.
