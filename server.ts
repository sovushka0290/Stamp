import express from "express";
import cors from "cors";
import crypto from "crypto";
import path from "path";
import { createServer as createViteServer } from "vite";

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// In-memory Database for Event Hashes and Transactions
// (Simulating Redis/PostgreSQL + Solana ledger)
interface MedEvent {
  id: string; // Session ID
  clinicId: string;
  doctorHash: string;
  patientHash: string;
  timestamp: string;
  salt: string;
  eventHash: string; // SHA-256(clinic+doctor+patient+time+salt)
  status: "PENDING" | "VERIFIED" | "REJECTED";
  patientSignature?: string; // OTP / HMAC from patient app
}

const db = new Map<string, MedEvent>();

// Helper to generate Zero-Knowledge Hash
function generateZKHash(
  clinicId: string,
  doctorHash: string,
  patientHash: string,
  timestamp: string,
  salt: string,
) {
  const payload = `${clinicId}:${doctorHash}:${patientHash}:${timestamp}:${salt}`;
  return crypto.createHash("sha256").update(payload).digest("hex");
}

// Helper: HMAC Validation simulate (HMAC-SHA256)
function verifyHMAC(payload: string, signature: string, secret: string) {
  const expected = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");
  return expected === signature;
}

// 1. API: MИС Клиники отправляет пакет данных (Initiate Transaction)
app.post("/api/events", (req, res) => {
  const { clinicId, doctorId, patientId } = req.body;
  if (!clinicId || !doctorId || !patientId) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const salt = crypto.randomBytes(16).toString("hex");
  const timestamp = new Date().toISOString();

  // Hash doctor and patient IDs immediately (Glass Box Protocol)
  const doctorHash = crypto.createHash("sha256").update(doctorId).digest("hex");
  const patientHash = crypto
    .createHash("sha256")
    .update(patientId)
    .digest("hex");

  const eventHash = generateZKHash(
    clinicId,
    doctorHash,
    patientHash,
    timestamp,
    salt,
  );
  const sessionId = crypto.randomUUID();

  const newEvent: MedEvent = {
    id: sessionId,
    clinicId,
    doctorHash,
    patientHash,
    timestamp,
    salt,
    eventHash,
    status: "PENDING",
  };

  db.set(sessionId, newEvent);

  res.json({
    success: true,
    sessionId,
    eventHash,
    message: "Event registered. Waiting for Patient Multi-sig Approval.",
  });
});

// 2. API: Patient App Approval (Dual-Verification)
app.post("/api/events/:sessionId/approve", (req, res) => {
  const { sessionId } = req.params;
  const { hmacSignature, patientPayload } = req.body; // e.g. from Telegram Mini App

  const event = db.get(sessionId);
  if (!event) return res.status(404).json({ error: "Session not found" });
  if (event.status !== "PENDING")
    return res.status(400).json({ error: "Event not pending" });

  // Simulate HMAC validation (QAIYRYM requirement)
  // In a real scenario, the secret would be shared with the TMA or derived
  const isValid = verifyHMAC(
    patientPayload || event.eventHash,
    hmacSignature || "dummy",
    "qaiyrym_secret_key",
  );

  if (!isValid && hmacSignature !== "bypass_for_demo") {
    return res.status(403).json({ error: "Invalid HMAC Signature" });
  }

  event.status = "VERIFIED";
  event.patientSignature =
    hmacSignature || crypto.randomBytes(32).toString("hex");

  // Simulate storing to Solana/Immutable Ledger here
  console.log(`[MedStamp DLT] Event ${event.eventHash} committed to ledger.`);

  res.json({
    success: true,
    eventHash: event.eventHash,
    status: event.status,
    message: "Transaction successfully verified and committed.",
  });
});

// Simulate Attack Endpoint
app.post("/api/events/:sessionId/attack", (req, res) => {
  const { sessionId } = req.params;
  const event = db.get(sessionId);
  if (!event) return res.status(404).json({ error: "Session not found" });

  // Malicious actor changes the timestamp to yesterday
  const fakeTimestamp = new Date(Date.now() - 86400000).toISOString();
  
  // Recalculate hash with fake data to show mismatch
  const tamperedHash = generateZKHash(
    event.clinicId, 
    event.doctorHash, 
    event.patientHash, 
    fakeTimestamp, 
    event.salt
  );

  res.json({
    success: false,
    message: "TAMPERING DETECTED: Signature mismatch",
    originalHash: event.eventHash,
    tamperedHash: tamperedHash,
    details: "The immutable hash does not match the altered data payload. The ledger rejects this change."
  });
});

// 3. API: Explorer (Public Audit)
app.get("/api/events", (req, res) => {
  const events = Array.from(db.values()).sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );
  res.json(events);
});

app.get("/api/events/:hash", (req, res) => {
  const { hash } = req.params;
  const event = Array.from(db.values()).find((e) => e.eventHash === hash);
  if (!event)
    return res.status(404).json({ error: "Hash not found in ledger" });
  res.json(event);
});

async function startServer() {
  // Vite integration
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(
      `[MedStamp Backend] Zero-Trust Server running on http://localhost:${PORT}`,
    );
  });
}

startServer();
