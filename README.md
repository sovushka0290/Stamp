# MedStamp MVP 🚀

**Digital Notary for Medicine** – Zero-Trust verification of medical events using Cryptographic Hashes, ZKPs, and HMAC.

This project is built using:
- **Frontend**: React 18, Vite, Tailwind CSS, Framer Motion
- **Backend**: Express + SQLite
- **Security**: Node.js `crypto` for SHA-256 and HMAC

## Features

- **Clinic MIS Terminal**: Simulates a hospital system creating immutable digital fingerprints for patient visits.
- **Patient TMA**: Simulates a Telegram Mini App for patients to cryptographically sign their visit via HMAC validation.
- **Zero-Knowledge Explorer**: Public audit ledger (for insurance/regulators) demonstrating cryptographic event verification and fraud detection.

## Deploying to Vercel

If deploying to Vercel, this app functions as a Full-Stack Vite + Express app. 
Make sure you update the `vercel.json` if needed to point API routes to your `server.ts`.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-username/medstamp-mvp)

### Railway Deployment
1. Connect your GitHub repository to Railway.
2. Railway will automatically detect the Node.js environment and `package.json`.
3. Set the start command to `npm run start` (which runs `node server.ts` or `tsx server.ts`).

## Technical Audit Notes

The cryptographic simulation occurs both on client and backend:
- `api/events` generates the hash based on payload.
- `api/events/:id/approve` validates an HMAC signature (simulated for MVP demo purposes).
- `api/events/:id/attack` simulates a data-tampering attack by altering the SQLite record and then recalculating the hash to demonstrate mismatch.

## Local Development

```bash
npm install
npm run dev
```
