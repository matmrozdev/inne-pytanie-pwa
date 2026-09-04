# Inne pytanie

A lightweight Polish multi-phone party game using a host-and-peers WebRTC DataChannel topology. There is no backend, account system, database, or WebSocket signaling server.

## Pairing

The host generates a complete WebRTC offer after ICE gathering. A guest copies the offer, generates an answer, and returns it to the host. QR codes make transferring signaling payloads easier; text copy/paste is the universal fallback. Each guest connects only to the host.

## Development

```bash
npm install
npm test
npm run dev
```

The production build uses relative paths for GitHub Pages and generates a versioned service-worker precache.
