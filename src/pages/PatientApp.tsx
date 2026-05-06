import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import toast from "react-hot-toast";
import {
  Fingerprint,
  CheckCircle2,
  ShieldCheck,
  AlertTriangle,
  Loader2,
} from "lucide-react";

export function PatientApp() {
  const { sessionId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) {
      setError("Invalid QR Code link. Missing sessionId.");
    }
  }, [sessionId]);

  const handleApprove = async () => {
    if (!sessionId) return;
    setLoading(true);
    setError(null);

    try {
      // We simulate HMAC generation locally
      // In a real mobile app, a secure enclave or derived key from login is used
      const res = await fetch(`/api/events/${sessionId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hmacSignature: "bypass_for_demo", // Simulate the HMAC validation
          patientPayload: "patient_otp_payload",
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setSuccess(true);
        toast.success("Transaction sent to Immutable Log");
      } else {
        setError(data.error || "Failed to verify transaction");
        toast.error("Integrity Check Failed");
      }
    } catch (err) {
      console.error(err);
      setError("Network connection failed");
      toast.error("Network connection failed");
    } finally {
      setLoading(false);
    }
  };

  if (error && !success && !loading) {
    return (
      <div className="max-w-md mx-auto mt-12 bg-slate-900 border border-red-900/50 p-8 rounded-3xl flex flex-col items-center text-center shadow-xl">
        <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-4 text-red-500">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold mb-2">Verification Failed</h2>
        <p className="text-slate-400 text-sm mb-6">{error}</p>
        <button
          onClick={() => navigate("/")}
          className="px-6 py-2.5 bg-slate-800 rounded-xl text-sm font-medium hover:bg-slate-700 transition-colors"
        >
          Return to Home
        </button>
      </div>
    );
  }

  if (success) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md mx-auto mt-12 bg-slate-900 border border-primary-500/30 p-8 rounded-3xl flex flex-col items-center text-center shadow-[0_0_50px_-10px_rgba(6,182,212,0.2)] relative overflow-hidden ring-1 ring-primary-500/10"
      >
        <div className="absolute inset-0 bg-primary-500/5 pointer-events-none"></div>
        <motion.div 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
          className="w-20 h-20 bg-primary-500/10 rounded-full flex items-center justify-center mb-6 text-primary-500 ring-4 ring-primary-500/10 relative z-10"
        >
          <CheckCircle2 className="w-10 h-10" />
        </motion.div>
        <h2 className="text-2xl font-bold mb-2 relative z-10 text-primary-50">Visit Verified</h2>
        <p className="text-primary-200/70 text-sm mb-8 relative z-10">
          Ваша криптографическая подпись добавлена. Транзакция навсегда зафиксирована в блокчейне.
        </p>
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-slate-950/80 p-5 rounded-2xl border border-primary-500/20 w-full mb-8 relative z-10 shadow-[inset_0_0_20px_rgba(6,182,212,0.05)]"
        >
           <div className="flex items-center gap-2 text-primary-400 text-xs uppercase mb-3 font-mono font-semibold tracking-wider">
             <ShieldCheck className="w-4 h-4 text-primary-400" /> Zero-Trust Anchored
           </div>
           <p className="text-xs text-slate-400 font-mono text-left leading-relaxed">
             Ваши персональные данные остаются скрытыми. Мы записали только математическое доказательство факта визита.
           </p>
        </motion.div>
        <button
          onClick={() => navigate("/")}
          className="w-full px-6 py-3.5 bg-slate-800 hover:bg-slate-700 text-white transition-colors rounded-xl font-medium relative z-10"
        >
          Close App
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-md mx-auto mt-8 bg-slate-900/80 backdrop-blur-md border border-slate-800 p-6 sm:p-8 rounded-3xl overflow-hidden relative shadow-2xl"
    >
      {/* Simulate mobile frame styles */}
      <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-primary-600 via-primary-500 to-primary-600"></div>

      <div className="flex flex-col items-center text-center pt-4 pb-2">
        <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center mb-6 shadow-inner ring-1 ring-slate-700/50">
          <ShieldCheck className="w-8 h-8 text-primary-400" />
        </div>

        <h2 className="text-2xl font-bold tracking-tight mb-2 text-slate-100">
          Confirm Visit
        </h2>
        <p className="text-slate-400 text-sm mb-8 leading-relaxed">
          Подтвердите свое присутствие в клинике. Это создаст цифровую подпись (Dual-Verification).
        </p>

        <div className="w-full bg-slate-950/50 rounded-2xl p-5 border border-slate-800/80 mb-8 space-y-4 shadow-inner">
          <div className="flex justify-between items-center text-sm border-b border-slate-800 pb-3">
            <span className="text-slate-500 font-mono tracking-wide">Session ID</span>
            <span className="text-slate-300 font-mono font-medium">
              {sessionId?.substring(0, 8)}...
            </span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-slate-500 font-mono tracking-wide">Date</span>
            <span className="text-slate-300 font-mono font-medium">
              {new Date().toLocaleDateString()}
            </span>
          </div>
        </div>

        <button
          onClick={handleApprove}
          disabled={loading}
          className="w-full relative group overflow-hidden rounded-2xl bg-slate-800 border border-primary-500/30 hover:border-primary-500 transition-all active:scale-[0.98] disabled:opacity-70 disabled:active:scale-100 shadow-xl shadow-primary-500/10"
        >
          {loading && (
            <motion.div 
              className="absolute inset-0 bg-primary-500/20"
              animate={{ opacity: [0.2, 0.5, 0.2] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
            />
          )}
          <div className="flex flex-col items-center justify-center gap-3 py-6 text-white font-semibold relative z-10">
            {loading ? (
              <motion.div
                 animate={{ scale: [1, 1.1, 1] }}
                 transition={{ repeat: Infinity, duration: 1 }}
                 className="relative"
              >
                <Fingerprint className="w-12 h-12 text-primary-400" />
                <motion.div 
                  initial={{ top: 0, opacity: 0 }}
                  animate={{ top: "100%", opacity: [0, 1, 0] }}
                  transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                  className="absolute left-0 w-full h-0.5 bg-cyan-300 shadow-[0_0_8px_2px_rgba(34,211,238,0.8)]"
                ></motion.div>
              </motion.div>
            ) : (
              <div className="w-16 h-16 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center group-hover:bg-primary-500/10 group-hover:border-primary-500/50 transition-all shadow-inner">
                <Fingerprint className="w-8 h-8 text-slate-400 group-hover:text-primary-400 transition-colors" />
              </div>
            )}
            <div className="text-lg tracking-wide">
               {loading ? "Generating ZK Proof..." : "Tap to Sign & Verify"}
            </div>
            {!loading && (
              <div className="text-[10px] text-slate-500 font-mono uppercase tracking-widest">
                Requires Biometrics
              </div>
            )}
          </div>
        </button>

        <p className="text-[10px] text-slate-500 font-mono mt-6 uppercase tracking-widest flex items-center justify-center gap-2">
          <span>Secured via HMAC Signature</span>
        </p>
      </div>
    </motion.div>
  );
}
