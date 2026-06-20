import express from "express";
import cors from "cors";
import crypto from "crypto";
import path from "path";
import { createServer as createViteServer } from "vite";

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3333;

app.use(cors());
app.use(express.json());

// --- PATIENT PRIVACY & TOKENIZATION SANDBOX ---

interface PatientRecord {
  token: string;         // e.g. P-8F4K-92XM-7QW1
  iinHash: string;       // SHA-256 hash of IIN
  encryptedData: string; // AES-256 encrypted JSON string of { iin, name, phone, address }
  createdAt: string;
}

const patientsDb = new Map<string, PatientRecord>();

// Cryptographic Settings
// We derive a stable 32-byte key for AES-256
const CRYPTO_SECRET = "clinic_super_secret_encryption_key_2026_salt";
const ENCRYPTION_KEY = crypto.createHash("sha256").update(CRYPTO_SECRET).digest(); // Exactly 32 bytes
const IV_LENGTH = 16; // AES block size

// Encrypt string using AES-256-CBC
function encryptData(text: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv("aes-256-cbc", ENCRYPTION_KEY, iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  return `${iv.toString("hex")}:${encrypted}`;
}

// Decrypt ciphertext using AES-256-CBC
function decryptData(encryptedText: string): string {
  const [ivHex, encryptedHex] = encryptedText.split(":");
  if (!ivHex || !encryptedHex) {
    throw new Error("Invalid encrypted data format");
  }
  const iv = Buffer.from(ivHex, "hex");
  const decipher = crypto.createDecipheriv("aes-256-cbc", ENCRYPTION_KEY, iv);
  let decrypted = decipher.update(encryptedHex, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}

// Generate one-way SHA-256 hash of IIN (for duplicate checking and search)
function hashIIN(iin: string): string {
  return crypto.createHash("sha256").update(iin.trim()).digest("hex");
}

// Generate random unique token matching format P-XXXX-XXXX-XXXX
function generatePatientToken(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const segment = () => Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  let token = `P-${segment()}-${segment()}-${segment()}`;
  // Ensure uniqueness in DB
  while (patientsDb.has(token)) {
    token = `P-${segment()}-${segment()}`;
  }
  return token;
}

// Pre-populate database with some mock data for instant visualization
const initMockPatients = () => {
  const mockPatients = [
    {
      iin: "920415309485",
      name: "Жандос Султанов",
      phone: "+7 (777) 123-45-67",
      address: "г. Астана, ул. Достык 12, кв. 45",
      token: "P-8F4K-92XM-7QW1"
    },
    {
      iin: "880922405812",
      name: "Айгуль Серикова",
      phone: "+7 (701) 987-65-43",
      address: "г. Алматы, пр. Абая 45, кв. 12",
      token: "P-3N2Y-7R9K-5W2X"
    }
  ];

  for (const p of mockPatients) {
    const iinHash = hashIIN(p.iin);
    const jsonStr = JSON.stringify({
      iin: p.iin,
      name: p.name,
      phone: p.phone,
      address: p.address
    });
    const encryptedData = encryptData(jsonStr);
    patientsDb.set(p.token, {
      token: p.token,
      iinHash,
      encryptedData,
      createdAt: new Date().toISOString()
    });
  }
};
initMockPatients();

// --- PATIENT PRIVACY ENDPOINTS ---

// 1. Check if an IIN is already registered (uses SHA-256 hash search)
app.post("/api/patients/check-duplicate", (req, res) => {
  const { iin } = req.body;
  if (!iin) {
    return res.status(400).json({ error: "Missing IIN" });
  }
  const iinHash = hashIIN(iin);
  
  // Search for matching hash
  let existingToken = "";
  for (const [token, record] of patientsDb.entries()) {
    if (record.iinHash === iinHash) {
      existingToken = token;
      break;
    }
  }

  if (existingToken) {
    return res.json({ registered: true, token: existingToken });
  } else {
    return res.json({ registered: false });
  }
});

// 2. Register new patient (First Visit)
app.post("/api/patients/register", (req, res) => {
  const { iin, name, phone, address } = req.body;
  if (!iin || !name || !phone || !address) {
    return res.status(400).json({ error: "Missing required patient fields" });
  }

  const iinHash = hashIIN(iin);
  
  // Check duplicate
  let existingToken = "";
  for (const [token, record] of patientsDb.entries()) {
    if (record.iinHash === iinHash) {
      existingToken = token;
      break;
    }
  }

  if (existingToken) {
    return res.status(400).json({ 
      error: "Patient already registered", 
      token: existingToken 
    });
  }

  const token = generatePatientToken();
  const jsonPayload = JSON.stringify({ iin, name, phone, address });
  const encryptedData = encryptData(jsonPayload);

  const newPatient: PatientRecord = {
    token,
    iinHash,
    encryptedData,
    createdAt: new Date().toISOString()
  };

  patientsDb.set(token, newPatient);

  res.json({
    success: true,
    token,
    iinHash,
    encryptedData,
    message: "Patient registered successfully. Private details encrypted."
  });
});

// 3. List all registered patients (Simulating encrypted ledger view)
app.get("/api/patients", (req, res) => {
  const list = Array.from(patientsDb.values()).map(p => ({
    token: p.token,
    iinHash: p.iinHash,
    encryptedData: p.encryptedData,
    createdAt: p.createdAt
  }));
  res.json(list);
});

// 4. Retrieve specific patient details (Doctor/Registrar access control)
app.post("/api/patients/:token/details", (req, res) => {
  const { token } = req.params;
  const { role, passcode } = req.body; // role can be "doctor" or "registrar"

  const patient = patientsDb.get(token);
  if (!patient) {
    return res.status(404).json({ error: "Patient not found" });
  }

  if (role === "doctor" && passcode === "DOCTOR123") {
    try {
      const decryptedString = decryptData(patient.encryptedData);
      const privateData = JSON.parse(decryptedString);
      return res.json({
        success: true,
        token: patient.token,
        iinHash: patient.iinHash,
        encryptedData: patient.encryptedData,
        createdAt: patient.createdAt,
        decrypted: true,
        details: privateData // Contains { iin, name, phone, address }
      });
    } catch (err) {
      return res.status(500).json({ error: "Failed to decrypt patient data" });
    }
  }

  // Registrar or unauthorized roles only see the masked encrypted token data
  return res.json({
    success: true,
    token: patient.token,
    iinHash: patient.iinHash,
    encryptedData: patient.encryptedData,
    createdAt: patient.createdAt,
    decrypted: false,
    message: "Access denied: Private details are encrypted. Only authorized doctors can decrypt."
  });
});

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
