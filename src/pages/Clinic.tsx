import { useState, useEffect, FormEvent } from "react";
import { QRCodeSVG } from "qrcode.react";
import { motion, AnimatePresence } from "motion/react";
import toast from "react-hot-toast";
import {
  Activity,
  QrCode,
  Server,
  ShieldPlus,
  LockKeyhole,
} from "lucide-react";
import { cn } from "../lib/utils";
import { Link } from "react-router-dom";
import { Tooltip } from "../components/Tooltip";

import { ScrambleText } from "../components/ScrambleText";

export function Clinic() {
  const [loading, setLoading] = useState(false);
  const [session, setSession] = useState<{
    sessionId: string;
    eventHash: string;
  } | null>(null);

  const [formData, setFormData] = useState({
    clinicId: "GLBL-MED-77X",
    doctorId: "DR-SMITH-009",
    patientId: "IIN-00123456789",
  });

  const handleCreateZkEvent = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (res.ok) {
        setSession({ sessionId: data.sessionId, eventHash: data.eventHash });
        toast.success("Event Captured & Hashed successfully!");
      } else {
        toast.error("API Error: " + data.error);
      }
    } catch (err) {
      console.error(err);
      toast.error("Network Error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">
            Doctor's Dashboard
          </h1>
          <div className="text-slate-400 text-sm font-mono leading-relaxed">
            Интеграция на уровне МИС. Данные приема (EHR) автоматически трансформируются в{" "}
            <Tooltip content="Zero-Knowledge Proof: Доказательство знания без раскрытия самих данных">
               ZKP-хэш
            </Tooltip> для защиты приватности пациента.
          </div>
        </div>

        <form
          onSubmit={handleCreateZkEvent}
          className="bg-slate-900/60 backdrop-blur-md border border-slate-800 p-6 sm:p-8 rounded-2xl shadow-xl space-y-6 relative overflow-hidden"
        >
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-primary-600 via-primary-500 to-primary-600"></div>

          <div className="flex items-center justify-between mb-2 pb-4 border-b border-slate-800/80">
            <div className="flex items-center gap-2 text-slate-300 font-medium">
              <Server className="w-4 h-4 text-primary-500" />
              MedStamp Gateway Active
            </div>
            <div className="flex items-center gap-1.5 text-xs font-mono bg-green-500/10 text-green-400 px-2 py-1 rounded-md border border-green-500/20">
               <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span>
               Online
            </div>
          </div>

          {/* Simulated EHR Card */}
          <div className="bg-slate-950/50 rounded-xl border border-slate-800/80 p-5 space-y-4">
             <h3 className="text-xs uppercase tracking-widest text-slate-500 font-semibold mb-3">Current Appointment Details</h3>
             
             <div className="grid grid-cols-2 gap-4">
               <div>
                  <label className="block text-[10px] uppercase text-slate-500 mb-1">Patient Name</label>
                  <div className="text-sm font-medium text-slate-200">Doe, John (Hidden in log)</div>
               </div>
               <div>
                  <label className="block text-[10px] uppercase text-slate-500 mb-1">Diagnosis Code</label>
                  <div className="text-sm font-medium text-slate-300 font-mono">J06.9 (URI)</div>
               </div>
             </div>

             <div className="space-y-3 pt-3 border-t border-slate-800/50">
                <div>
                  <label className="block text-[10px] font-mono text-slate-500 mb-1.5 uppercase tracking-wide flex items-center justify-between">
                    <span>Patient Identifier (IIN/SSN)</span>
                    <LockKeyhole className="w-3 h-3 text-slate-600" />
                  </label>
                  <input
                    type="text"
                    value={formData.patientId}
                    onChange={(e) =>
                      setFormData({ ...formData, patientId: e.target.value })
                    }
                    className="w-full bg-slate-900 border border-slate-700/50 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 font-mono transition-shadow shadow-inner"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-mono text-slate-500 mb-1.5 uppercase tracking-wide">
                      Clinic ID
                    </label>
                    <input
                      type="text"
                      value={formData.clinicId}
                      readOnly
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-400 font-mono cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono text-slate-500 mb-1.5 uppercase tracking-wide">
                      Doctor ID
                    </label>
                    <input
                      type="text"
                      value={formData.doctorId}
                      readOnly
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-400 font-mono cursor-not-allowed"
                    />
                  </div>
                </div>
             </div>
             
             <div className="p-3 bg-primary-500/5 border border-primary-500/10 rounded-lg text-[10px] text-slate-400 font-mono flex items-start gap-2 mt-2">
                <ShieldPlus className="w-3.5 h-3.5 text-primary-500/70 shrink-0 mt-0.5" />
                <span className="leading-relaxed">
                  Notice: Only cryptographic hashes of these IDs will be transmitted to the ledger. Patient's medical history never leaves this MIS.
                </span>
             </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading || !!session}
              className="w-full bg-primary-600 hover:bg-primary-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-xl shadow-lg shadow-primary-500/20 transition-all flex justify-center items-center gap-2 active:scale-[0.98]"
            >
              {loading ? (
                <Activity className="w-4 h-4 animate-spin" />
              ) : (
                <ShieldPlus className="w-4 h-4" />
              )}
              {session ? "Event Captured" : "Generate Digital Fingerprint"}
            </button>
          </div>
        </form>
      </div>

      <div className="lg:sticky lg:top-24">
        <AnimatePresence mode="popLayout">
          {session ? (
            <motion.div 
              key="active-session"
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              className="bg-slate-900/60 backdrop-blur-md border border-primary-500/30 p-8 rounded-2xl shadow-[0_0_40px_-10px_rgba(6,182,212,0.15)] flex flex-col items-center justify-center text-center space-y-6 relative overflow-hidden ring-1 ring-primary-500/10"
            >
              <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-primary-500 to-primary-600"></div>
              <div className="absolute -inset-24 bg-primary-500/10 blur-3xl rounded-full z-0 pointer-events-none"></div>

              <div className="relative z-10">
                <h3 className="text-xl font-bold mb-2">
                  Awaiting Dual-Verification
                </h3>
                <div className="text-slate-400 text-sm max-w-sm">
                  Patient must scan this QR code to sign the transaction via <Tooltip content="Hash-based Message Authentication Code: Криптографическая подпись">HMAC</Tooltip>.
                </div>
              </div>

              <motion.div 
                initial={{ rotateY: 90 }}
                animate={{ rotateY: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="bg-white p-5 rounded-2xl shadow-xl ring-4 ring-white/10 relative z-10"
              >
                <QRCodeSVG
                  value={`${window.location.origin}/patient/${session.sessionId}`}
                  size={200}
                  level="H"
                  includeMargin={false}
                />
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-slate-950/80 rounded-xl p-4 w-full border border-slate-800 relative z-10 shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]"
              >
                <p className="text-[10px] text-slate-500 font-mono mb-1.5 text-left uppercase tracking-widest font-semibold flex items-center justify-between">
                  Digital Fingerprint (SHA-256) <LockKeyhole className="w-3 h-3 text-primary-500" />
                </p>
                <div className="text-xs font-mono text-primary-400 break-all text-left font-medium drop-shadow-[0_0_5px_rgba(34,211,238,0.5)]">
                  <ScrambleText text={session.eventHash} duration={1200} />
                </div>
              </motion.div>

              <Link
                to={`/patient/${session.sessionId}`}
                target="_blank"
                className="mt-2 flex items-center justify-center gap-2 w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-sm font-medium rounded-xl transition-colors relative z-10 border border-slate-700"
              >
                <QrCode className="w-4 h-4" /> Open Patient TMA Simulator
              </Link>

              <button
                onClick={() => setSession(null)}
                className="mt-4 text-xs text-slate-500 hover:text-slate-300 underline underline-offset-4 font-mono transition-colors relative z-10"
              >
                Reset Event
              </button>
            </motion.div>
          ) : (
            <motion.div 
              key="empty-state"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full min-h-[400px] border-2 border-dashed border-slate-800 rounded-2xl flex flex-col items-center justify-center text-slate-600 space-y-4 p-8 text-center bg-slate-900/30 backdrop-blur-sm"
            >
              <QrCode className="w-12 h-12 opacity-20" />
              <div className="max-w-xs">
                <p className="text-sm">
                  Complete the visit form to generate an immutable hash and QR code.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
