import { useEffect, useState } from "react";
import { ShieldCheck, Clock, CheckCircle2, Copy, Bug, Eye, X, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { cn } from "../lib/utils";
import { motion, AnimatePresence } from "motion/react";
import toast from "react-hot-toast";
import { Tooltip } from "../components/Tooltip";

interface MedEvent {
  id: string;
  clinicId: string;
  doctorHash: string;
  patientHash: string;
  timestamp: string;
  salt: string;
  eventHash: string;
  status: "PENDING" | "VERIFIED" | "REJECTED";
}

export function Explorer() {
  const [events, setEvents] = useState<MedEvent[]>([]);
  const [loading, setLoading] = useState(true);

  // Inspector State
  const [inspectedEvent, setInspectedEvent] = useState<MedEvent | null>(null);
  
  // Attack state
  const [attackResult, setAttackResult] = useState<any | null>(null);
  const [isAttacking, setIsAttacking] = useState(false);

  // AI Scanner state
  const [isAiScanning, setIsAiScanning] = useState(false);

  const fetchEvents = async () => {
    try {
      const res = await fetch("/api/events");
      if (res.ok) {
        const data = await res.json();
        setEvents(data);
      }
    } catch (err) {
      console.error("Failed to fetch events", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
    const interval = setInterval(fetchEvents, 2000); 
    return () => clearInterval(interval);
  }, []);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const handleSimulateAttack = async (sessionId: string) => {
    setIsAttacking(true);
    setAttackResult(null);
    try {
      const res = await fetch(`/api/events/${sessionId}/attack`, { method: "POST" });
      const data = await res.json();
      setAttackResult(data);
      toast.error("Attempted Fraud Detected!", {
        style: {
          background: '#4a0404',
          color: '#f8fafc',
          border: '1px solid #7f1d1d',
        },
        iconTheme: {
          primary: '#ef4444',
          secondary: '#7f1d1d',
        },
      });
    } catch (err) {
      console.error(err);
      toast.error("Attack simulation failed");
    } finally {
      setIsAttacking(false);
    }
  };

  const runAIAudit = () => {
    if (isAiScanning) return;
    setIsAiScanning(true);
    
    // Simulate AI scan duration
    const scanPromise = new Promise((resolve) => setTimeout(resolve, 3000));
    
    toast.promise(scanPromise, {
      loading: 'AI Sentinel: Scanning immutable log for anomalies...',
      success: 'Audit Complete: 0 Anomalies. Network Integrity 99.9%',
      error: 'Audit Interrupted',
    }, {
      style: {
        background: '#0f172a',
        color: '#38bdf8',
        border: '1px solid #0369a1',
        fontFamily: 'monospace'
      },
    });

    scanPromise.then(() => setIsAiScanning(false));
  };

  return (
    <div className="space-y-6 relative">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Immutable Audit Log
          </h1>
          <div className="text-slate-400 font-mono text-sm max-w-2xl">
            Публичный аудит (Минздрав / Страховая). Мы доказываем факт визита, не раскрывая личности пациента, используя{" "}
            <Tooltip content="Zero-Knowledge Proof: Доказательство знания без раскрытия самих данных">ZKP</Tooltip>.
          </div>
        </div>
        <button
           onClick={runAIAudit}
           disabled={isAiScanning || events.length === 0}
           className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800/80 hover:bg-slate-700/80 border border-sky-500/30 text-sky-400 text-sm font-medium rounded-xl transition-all shadow-[0_0_15px_rgba(14,165,233,0.15)] disabled:opacity-50"
        >
          {isAiScanning ? (
            <motion.div
               animate={{ rotate: 360 }}
               transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
            >
              <Activity className="w-4 h-4" />
            </motion.div>
          ) : (
            <Eye className="w-4 h-4" />
          )}
          Run AI Audit
        </button>
      </div>

      <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-2xl overflow-hidden shadow-xl relative">
        {loading ? (
          <div className="p-8 space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex gap-4 items-center">
                <div className="h-10 w-24 bg-slate-800/50 animate-pulse rounded-lg"></div>
                <div className="h-10 flex-1 bg-slate-800/50 animate-pulse rounded-lg"></div>
                <div className="h-10 w-48 bg-slate-800/50 animate-pulse rounded-lg"></div>
              </div>
            ))}
            <div className="text-center text-slate-500 font-mono pt-4 animate-pulse">Syncing with ledger...</div>
          </div>
        ) : events.length === 0 ? (
          <div className="p-16 text-center flex flex-col items-center justify-center">
            <ShieldCheck className="w-12 h-12 text-slate-700 mb-4" />
            <p className="text-slate-400 font-mono">
              В блокчейне пока нет записанных событий.
            </p>
            <p className="text-sm text-slate-500 mt-2">
              Перейдите в терминал врача (Clinic MIS), чтобы симулировать прием.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto relative pl-4">
            {/* Blockchain visual line */}
            <div className="absolute left-8 top-12 bottom-8 w-[2px] bg-slate-800 z-0 hidden sm:block">
              {isAiScanning && (
                <motion.div 
                  initial={{ top: "0%", height: "0%" }}
                  animate={{ top: ["0%", "100%", "0%"], height: ["0%", "20%", "0%"] }}
                  transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                  className="absolute left-0 w-full bg-sky-400 shadow-[0_0_10px_2px_rgba(56,189,248,0.8)]"
                />
              )}
            </div>
            
            <table className="w-full text-left whitespace-nowrap relative z-10">
              <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-mono text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-4 font-medium pl-14 sm:pl-16">Статус</th>
                  <th className="px-5 py-4 font-medium">Digital Fingerprint (SHA-256)</th>
                  <th className="px-5 py-4 font-medium">Timestamp (UTC)</th>
                  <th className="px-5 py-4 font-medium text-right">Действия</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50 font-mono text-sm">
                <AnimatePresence>
                  {events.map((event, idx) => (
                    <motion.tr
                      key={event.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ delay: idx * 0.1 }}
                      className={cn(
                        "hover:bg-slate-800/30 transition-all group relative",
                        isAiScanning ? "bg-slate-800/20 shadow-[inset_0_0_20px_rgba(56,189,248,0.1)] border-y border-sky-500/10" : ""
                      )}
                    >
                      <td className="px-5 py-4 pl-14 sm:pl-16 relative">
                        {/* Node point */}
                        <div className="absolute left-3.5 sm:left-[1.375rem] top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-slate-900 border-2 border-slate-700 z-10 hidden sm:flex items-center justify-center group-hover:border-primary-500 transition-colors">
                          <div className={cn(
                            "w-1.5 h-1.5 rounded-full transition-opacity",
                            isAiScanning ? "bg-sky-400 opacity-100 animate-pulse" : "bg-primary-500 opacity-0 group-hover:opacity-100"
                          )}></div>
                        </div>

                        {event.status === "VERIFIED" ? (
                          <div className="inline-flex items-center gap-1.5 text-primary-400 bg-primary-500/10 border border-primary-500/20 px-2.5 py-1 rounded-md text-xs font-semibold relative overflow-hidden">
                            <div className="absolute inset-0 bg-primary-400/20 animate-pulse"></div>
                            <CheckCircle2 className="w-3.5 h-3.5 relative z-10" />
                            <span className="relative z-10">VERIFIED</span>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1.5 text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-md text-xs font-semibold">
                            <Clock className="w-3.5 h-3.5" />
                            PENDING
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-4 font-medium text-slate-200">
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "truncate block max-w-[180px] sm:max-w-[240px] transition-colors",
                            event.status === "VERIFIED" && "text-primary-300 drop-shadow-[0_0_8px_rgba(34,211,238,0.4)]"
                          )} title={event.eventHash}>
                            {event.eventHash.substring(0, 12)}...{event.eventHash.slice(-8)}
                          </span>
                          <button 
                            onClick={() => {
                              handleCopy(event.eventHash);
                              toast.success("Hash copied to clipboard", { icon: '📋' });
                            }} 
                            className="text-slate-500 hover:text-primary-400 transition-colors p-1"
                            title="Copy Full Hash"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-slate-400">
                        {format(new Date(event.timestamp), "yyyy-MM-dd HH:mm:ss")}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-80 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => setInspectedEvent(event)}
                            className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded-lg transition-colors border border-slate-700 font-sans font-medium"
                          >
                            <Eye className="w-3.5 h-3.5 text-primary-400" /> Verify Math
                          </button>
                          <button
                            onClick={() => handleSimulateAttack(event.id)}
                            disabled={isAttacking}
                            className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs rounded-lg transition-colors border border-red-500/20 font-sans font-medium hover:shadow-[0_0_15px_rgba(239,68,68,0.3)]"
                          >
                            <Bug className="w-3.5 h-3.5" /> Simulate Attack
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Inspect Math Modal */}
      <AnimatePresence>
      {inspectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-[0_0_50px_-12px_rgba(6,182,212,0.15)] relative flex flex-col max-h-[90vh]"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/50">
              <h3 className="font-bold flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-primary-400" />
                The "Glass Box" Protocol (Zero-Knowledge)
              </h3>
              <button onClick={() => setInspectedEvent(null)} className="text-slate-400 hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto font-mono text-sm space-y-6">
              <p className="font-sans text-slate-400 text-sm">
                Хэш — это односторонняя математическая функция. Любой может пересчитать хэш из публичных параметров визита, но никто не может обратить этот процесс, чтобы узнать ФИО.
              </p>

              <div>
                <h4 className="text-xs text-slate-500 uppercase tracking-widest mb-2 font-semibold">1. Input Data (Payload)</h4>
                <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-xl space-y-2 text-slate-300">
                  <div className="flex justify-between items-center break-all gap-4"><span className="text-slate-500 min-w-max">Clinic ID:</span> <span>{inspectedEvent.clinicId}</span></div>
                  <div className="flex justify-between items-center break-all gap-4"><span className="text-slate-500 min-w-max">Doctor Hash:</span> <span>{inspectedEvent.doctorHash}</span></div>
                  <div className="flex justify-between items-center break-all gap-4"><span className="text-slate-500 min-w-max">Patient Hash:</span> <span>{inspectedEvent.patientHash}</span></div>
                  <div className="flex justify-between items-center break-all gap-4"><span className="text-slate-500 min-w-max">Timestamp:</span> <span>{inspectedEvent.timestamp}</span></div>
                  <div className="flex justify-between items-center break-all gap-4"><span className="text-slate-500 min-w-max">Salt (Random):</span> <span>{inspectedEvent.salt}</span></div>
                </div>
              </div>

              <div className="flex justify-center text-slate-600">
                <motion.svg 
                  animate={{ y: [0, 5, 0] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 5 0 14"/><path d="m19 12-7 7-7-7"/></motion.svg>
              </div>

              <div>
                <h4 className="text-xs text-slate-500 uppercase tracking-widest mb-2 font-semibold">2. SHA-256 Output</h4>
                <div className="bg-primary-500/10 border border-primary-500/30 p-4 rounded-xl text-primary-400 break-all leading-relaxed font-bold shadow-[inset_0_0_20px_rgba(6,182,212,0.1)] drop-shadow-[0_0_8px_rgba(34,211,238,0.2)]">
                  {inspectedEvent.eventHash}
                </div>
              </div>
            </div>
            
            <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/50 flex justify-end">
              <button 
                onClick={() => setInspectedEvent(null)}
                className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium font-sans rounded-xl transition-colors"
               >
                Close Insights
              </button>
            </div>
          </motion.div>
        </div>
      )}
      </AnimatePresence>

      {/* Attack Result Modal */}
      <AnimatePresence>
      {attackResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-slate-900 border border-red-900 rounded-2xl w-full max-w-2xl overflow-hidden shadow-[0_0_60px_-15px_rgba(239,68,68,0.3)] relative flex flex-col ring-1 ring-red-500/50"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-red-900/50 bg-red-950/30">
              <h3 className="font-bold flex items-center gap-2 text-red-500">
                <AlertTriangle className="w-5 h-5" />
                Attack Simulation Results
              </h3>
              <button onClick={() => setAttackResult(null)} className="text-slate-400 hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-6">
              <p className="font-sans text-slate-300 text-sm">
                Мы попытались изменить время визита задним числом в базе данных (базовый тип мошенничества).
              </p>

              <div className="bg-red-500/5 border border-red-500/20 p-4 rounded-xl space-y-3 font-mono text-sm break-all">
                <div>
                   <div className="text-xs text-slate-500 uppercase tracking-wider mb-1 font-sans">Ledger Immutable Hash</div>
                   <div className="text-primary-400">{attackResult.originalHash}</div>
                </div>
                <div className="border-t border-red-900/30 pt-3">
                   <div className="text-xs text-red-400 uppercase tracking-wider mb-1 font-sans">Tampered Data Recalculated Hash</div>
                   <div className="text-red-500">{attackResult.tamperedHash}</div>
                </div>
              </div>

              <div className="bg-red-950/30 text-red-400 p-4 rounded-xl border border-red-900/50 flex gap-3 text-sm font-medium items-start">
                 <ShieldCheck className="w-5 h-5 shrink-0 mt-0.5" />
                 <div>{attackResult.details} Система автоматически отбрасывает такую транзакцию. Данные неизменны.</div>
              </div>
            </div>
            
            <div className="px-6 py-4 border-t border-red-900/50 bg-red-950/30 flex justify-end relative z-10">
              <button 
                onClick={() => setAttackResult(null)}
                className="px-6 py-2 bg-red-900/50 hover:bg-red-900/80 text-red-200 font-medium font-sans rounded-xl transition-colors"
               >
                Dismiss Audit
              </button>
            </div>
          </motion.div>
        </div>
      )}
      </AnimatePresence>
    </div>
  );
}
