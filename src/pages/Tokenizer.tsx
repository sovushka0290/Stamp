import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  UserPlus, 
  ScanLine, 
  Stethoscope, 
  Fingerprint, 
  Search, 
  Lock, 
  Unlock, 
  Database, 
  UserCheck, 
  RefreshCw, 
  Check, 
  Info,
  Sparkles,
  ArrowRight,
  Eye,
  EyeOff,
  User,
  ShieldCheck,
  ShieldAlert,
  Terminal,
  Smartphone
} from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";
import { toast } from "react-hot-toast";

// Helper for live SHA-256 display in browser
async function computeBrowserSha256(message: string): Promise<string> {
  if (!message) return "";
  const msgBuffer = new TextEncoder().encode(message.trim());
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

export function Tokenizer() {
  const [activeTab, setActiveTab] = useState<"register" | "reception" | "doctor" | "hash">("register");
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [highlightedRow, setHighlightedRow] = useState<string | null>(null);

  // Form States (Register)
  const [regName, setRegName] = useState("");
  const [regIin, setRegIin] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regAddress, setRegAddress] = useState("");
  const [regResult, setRegResult] = useState<any | null>(null);
  const [qrSaved, setQrSaved] = useState(false);

  // Reception States
  const [selectedTokenRecep, setSelectedTokenRecep] = useState("");
  const [recepResult, setRecepResult] = useState<any | null>(null);
  const [scanning, setScanning] = useState(false);
  const [checkInSuccess, setCheckInSuccess] = useState(false);

  // Doctor States
  const [selectedTokenDoc, setSelectedTokenDoc] = useState("");
  const [passcode, setPasscode] = useState("");
  const [doctorResult, setDoctorResult] = useState<any | null>(null);
  const [decrypting, setDecrypting] = useState(false);
  const [role, setRole] = useState<"registrar" | "doctor">("registrar");

  // Duplicate Check States
  const [dupIin, setDupIin] = useState("");
  const [dupHash, setDupHash] = useState("");
  const [dupResult, setDupResult] = useState<any | null>(null);

  // Fetch all patients from API
  const fetchPatients = async () => {
    try {
      const res = await fetch("/api/patients");
      if (res.ok) {
        const data = await res.json();
        setPatients(data);
      }
    } catch (err) {
      console.error("Failed to fetch patients", err);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  // Compute live IIN hash in duplicate check tab
  useEffect(() => {
    if (!dupIin) {
      setDupHash("");
      setDupResult(null);
      return;
    }
    computeBrowserSha256(dupIin).then(setDupHash);
  }, [dupIin]);

  // Handle register submission
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regIin || !regName || !regPhone || !regAddress) {
      toast.error("Пожалуйста, заполните все поля!");
      return;
    }
    if (regIin.length !== 12 || isNaN(Number(regIin))) {
      toast.error("ИИН должен состоять из 12 цифр!");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/patients/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          iin: regIin,
          name: regName,
          phone: regPhone,
          address: regAddress
        })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Пациент зарегистрирован! Выдан токен.");
        setRegResult(data);
        setQrSaved(false);
        await fetchPatients();
        setHighlightedRow(data.token);
        setTimeout(() => setHighlightedRow(null), 4000);
      } else {
        toast.error(data.error || "Ошибка регистрации");
        if (data.token) {
          toast.error(`Этот пациент уже зарегистрирован с токеном ${data.token}`);
        }
      }
    } catch (err) {
      toast.error("Ошибка сети при регистрации");
    } finally {
      setLoading(false);
    }
  };

  // Handle reception scanning
  const handleRecepScan = async () => {
    if (!selectedTokenRecep) {
      toast.error("Выберите токен для сканирования!");
      return;
    }
    setScanning(true);
    setRecepResult(null);
    setCheckInSuccess(false);

    // Simulate scanning animation delay
    setTimeout(async () => {
      try {
        const res = await fetch(`/api/patients/${selectedTokenRecep}/details`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ role: "registrar", passcode: "" })
        });
        const data = await res.json();
        if (res.ok) {
          setRecepResult(data);
          toast.success("QR-код успешно считан!");
        }
      } catch (err) {
        toast.error("Ошибка сканирования");
      } finally {
        setScanning(false);
      }
    }, 1500);
  };

  // Handle reception check-in confirmation
  const handleCheckInConfirm = () => {
    setCheckInSuccess(true);
    toast.success(`Пациент ${selectedTokenRecep} направлен в очередь к врачу!`);
  };

  // Handle doctor decryption
  const handleDoctorDecrypt = async () => {
    if (!selectedTokenDoc) {
      toast.error("Выберите пациента из очереди!");
      return;
    }
    if (role !== "doctor") {
      toast.error("Ошибка: Только авторизованный врач может дешифровать данные!");
      return;
    }
    if (passcode !== "DOCTOR123") {
      toast.error("Неверный PIN-код врача!");
      return;
    }

    setDecrypting(true);
    setDoctorResult(null);

    // Simulate cryptographic calculation / decryption visual delay
    setTimeout(async () => {
      try {
        const res = await fetch(`/api/patients/${selectedTokenDoc}/details`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ role, passcode })
        });
        const data = await res.json();
        if (res.ok && data.decrypted) {
          setDoctorResult(data);
          toast.success("Персональные данные дешифрованы!");
        } else {
          toast.error(data.error || "Не удалось дешифровать данные");
        }
      } catch (err) {
        toast.error("Ошибка соединения с сервером");
      } finally {
        setDecrypting(false);
      }
    }, 1800);
  };

  // Handle duplicate check
  const handleCheckDuplicate = async () => {
    if (!dupIin) {
      toast.error("Введите ИИН для проверки!");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/patients/check-duplicate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ iin: dupIin })
      });
      const data = await res.json();
      if (res.ok) {
        setDupResult(data);
        if (data.registered) {
          toast.success("Дубликат обнаружен в базе!");
        } else {
          toast.success("ИИН свободен, совпадений нет.");
        }
      }
    } catch (err) {
      toast.error("Ошибка при проверке");
    } finally {
      setLoading(false);
    }
  };

  // Populate registration inputs with dummy data for easy testing
  const autofillRegForm = () => {
    const randomSuffix = Math.floor(Math.random() * 900000 + 100000);
    setRegName("Амир Кусаинов");
    setRegIin(`960514${randomSuffix}`);
    setRegPhone("+7 (775) 443-22-11");
    setRegAddress("г. Алматы, мкр. Самал-2, д. 15, кв. 23");
    toast.success("Данные автозаполнения сгенерированы!");
  };

  const tabs = [
    { id: "register", label: "1. Первый визит", desc: "Регистрация и Шифрование", icon: UserPlus },
    { id: "reception", label: "2. Сканирование QR", desc: "Визит регистратора", icon: ScanLine },
    { id: "doctor", label: "3. Кабинет Врача", desc: "Дешифрование PII", icon: Stethoscope },
    { id: "hash", label: "4. Проверка по ИИН", desc: "SHA-256 дубликаты", icon: Search },
  ];

  return (
    <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full pt-4 pb-16">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 text-primary-400 font-mono text-sm mb-2">
            <Fingerprint className="w-4 h-4" />
            <span>Cryptographic Patient Anonymizer & Tokenization</span>
          </div>
          <h1 className="text-3xl font-bold text-slate-50 tracking-tight">
            Песочница токенизации пациентов
          </h1>
          <p className="text-slate-400 text-sm mt-1 max-w-3xl">
            Интерактивный демонстратор системы безопасности. Позволяет увидеть, как личные данные
            пациента заменяются случайным токеном, шифруются на сервере и сопоставляются по хешу.
          </p>
        </div>
      </div>

      {/* Main Grid: Sandbox Controls (2/3) + Ledger Visualizer (1/3) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Interactive Tab Interface */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tab Selection */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-1.5 bg-slate-900/80 backdrop-blur border border-slate-800 rounded-2xl">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id as any);
                    // Clear temporary states
                    setRegResult(null);
                    setRecepResult(null);
                    setCheckInSuccess(false);
                    setDoctorResult(null);
                    setDupResult(null);
                  }}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl transition-all cursor-pointer text-center group ${
                    isActive 
                      ? "bg-primary-600 text-slate-50 shadow-lg shadow-primary-600/20" 
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
                  }`}
                >
                  <Icon className={`w-5 h-5 mb-1 ${isActive ? "text-slate-50 animate-pulse" : "text-primary-400 group-hover:scale-110 transition-transform"}`} />
                  <span className="text-xs font-semibold block">{tab.label}</span>
                  <span className={`text-[9px] font-mono block leading-none mt-0.5 ${isActive ? "text-cyan-100" : "text-slate-500"}`}>{tab.desc}</span>
                </button>
              );
            })}
          </div>

          {/* Tab Content Display */}
          <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800 rounded-3xl p-6 sm:p-8 relative min-h-[480px] flex flex-col justify-between overflow-hidden shadow-2xl">
            <div className="absolute -left-24 -top-24 w-48 h-48 bg-primary-500/5 blur-3xl rounded-full"></div>
            
            <AnimatePresence mode="wait">
              {/* TAB 1: FIRST VISIT (REGISTER) */}
              {activeTab === "register" && (
                <motion.div
                  key="register-tab"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-6"
                >
                  <div>
                    <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                      <UserPlus className="text-primary-400 w-5 h-5" />
                      Первичная регистрация (Первый визит)
                    </h2>
                    <p className="text-xs text-slate-400 mt-1 mb-4">
                      Пациент предъявляет удостоверение личности. Система проверяет его один раз и создает
                      случайный токен, шифруя личные данные и вычисляя хеш ИИН.
                    </p>

                    {/* Презентация ценности */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80 text-xs leading-normal mb-6">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 font-bold text-red-400">
                          <ShieldAlert className="w-3.5 h-3.5 flex-shrink-0" />
                          <span>ПРОБЛЕМА</span>
                        </div>
                        <p className="text-slate-400 text-[11px]">
                          МИС хранят ИИН и ФИО в открытом виде. При взломе базы происходит утечка персональных данных пациентов.
                        </p>
                      </div>
                      <div className="space-y-1 md:border-l md:border-slate-800 md:pl-4">
                        <div className="flex items-center gap-1.5 font-bold text-cyan-400">
                          <ShieldCheck className="w-3.5 h-3.5 flex-shrink-0" />
                          <span>РЕШЕНИЕ</span>
                        </div>
                        <p className="text-slate-400 text-[11px]">
                          Шифрование данных (AES-256) на сервере. В открытом виде хранится только случайный токен и хеш ИИН.
                        </p>
                      </div>
                      <div className="space-y-1 md:border-l md:border-slate-800 md:pl-4">
                        <div className="flex items-center gap-1.5 font-bold text-violet-400">
                          <Sparkles className="w-3.5 h-3.5 flex-shrink-0" />
                          <span>КАК ТЕСТИРОВАТЬ</span>
                        </div>
                        <p className="text-slate-400 text-[11px]">
                          Нажмите <strong>«Демо-данные»</strong>, затем <strong>«Зарегистрировать»</strong>. Посмотрите на шифротекст в правой панели БД.
                        </p>
                      </div>
                    </div>
                  </div>

                  {!regResult ? (
                    <form onSubmit={handleRegister} className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-xs font-medium text-slate-400 block">ФИО Пациента</label>
                          <input
                            type="text"
                            placeholder="Иванов Александр Сергеевич"
                            value={regName}
                            onChange={(e) => setRegName(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 focus:border-primary-500 rounded-xl px-4 py-2.5 text-sm text-slate-200 outline-none transition-colors"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-medium text-slate-400 block">ИИН (12 цифр)</label>
                          <input
                            type="text"
                            maxLength={12}
                            placeholder="950412301984"
                            value={regIin}
                            onChange={(e) => setRegIin(e.target.value.replace(/\D/g, ""))}
                            className="w-full bg-slate-950 border border-slate-800 focus:border-primary-500 rounded-xl px-4 py-2.5 text-sm text-slate-200 font-mono outline-none transition-colors"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-xs font-medium text-slate-400 block">Номер телефона</label>
                          <input
                            type="text"
                            placeholder="+7 (707) 123-45-67"
                            value={regPhone}
                            onChange={(e) => setRegPhone(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 focus:border-primary-500 rounded-xl px-4 py-2.5 text-sm text-slate-200 outline-none transition-colors"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-medium text-slate-400 block">Адрес проживания</label>
                          <input
                            type="text"
                            placeholder="г. Алматы, ул. Наурызбай батыра 8"
                            value={regAddress}
                            onChange={(e) => setRegAddress(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 focus:border-primary-500 rounded-xl px-4 py-2.5 text-sm text-slate-200 outline-none transition-colors"
                          />
                        </div>
                      </div>

                      <div className="flex gap-3 pt-2">
                        <button
                          type="submit"
                          disabled={loading}
                          className="flex-1 bg-primary-600 hover:bg-primary-500 text-slate-50 text-sm font-semibold py-3 px-4 rounded-xl transition-all shadow-md shadow-primary-600/10 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                          {loading ? (
                            <>
                              <RefreshCw className="w-4 h-4 animate-spin" />
                              Шифрование & Регистрация...
                            </>
                          ) : (
                            <>
                              <Lock className="w-4 h-4" />
                              Зарегистрировать & Выдать Токен
                            </>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={autofillRegForm}
                          className="px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-xl border border-slate-700 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
                          Демо-данные
                        </button>
                      </div>
                    </form>
                  ) : (
                    <motion.div 
                      initial={{ scale: 0.95, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="grid grid-cols-1 md:grid-cols-2 gap-6 p-5 bg-slate-950/80 rounded-2xl border border-slate-800"
                    >
                      {/* Simulating Patient's mobile wallet */}
                      <div className="space-y-4">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-green-500/10 text-green-400 font-mono text-[10px] border border-green-500/20">
                          <Smartphone className="w-3 h-3" />
                          <span>На экране смартфона пациента</span>
                        </div>
                        <div className="bg-gradient-to-br from-slate-900 to-slate-950 p-6 rounded-2xl border border-slate-800 shadow-xl relative overflow-hidden flex flex-col items-center text-center">
                          <div className="absolute top-0 right-0 w-24 h-24 bg-primary-500/5 blur-2xl rounded-full"></div>
                          <div className="bg-white p-3 rounded-2xl inline-block mb-4">
                            <QRCodeCanvas
                              value={regResult.token}
                              size={120}
                              level="H"
                            />
                          </div>
                          <div className="text-xs text-slate-500 font-mono">Токен пациента</div>
                          <div className="text-base font-bold text-slate-100 font-mono mt-1 tracking-wider">
                            {regResult.token}
                          </div>
                          
                          <button
                            onClick={() => {
                              setQrSaved(true);
                              toast.success("QR-код успешно сохранен в медиатеку телефона!");
                            }}
                            className={`w-full mt-4 py-2 px-3 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                              qrSaved
                                ? "bg-green-600 text-slate-50"
                                : "bg-primary-600 hover:bg-primary-500 text-slate-50 cursor-pointer"
                            }`}
                          >
                            {qrSaved ? (
                              <>
                                <Check className="w-3.5 h-3.5" /> Сохранено в Телефон
                              </>
                            ) : (
                              <>
                                <Smartphone className="w-3.5 h-3.5" /> Сохранить QR в телефон
                              </>
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Cryptographic breakdown */}
                      <div className="space-y-4 flex flex-col justify-between">
                        <div>
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary-500/10 text-primary-400 font-mono text-[10px] border border-primary-500/20 mb-3">
                            <ShieldCheck className="w-3 h-3" />
                            <span>Криптографический отчет</span>
                          </div>
                          <h4 className="text-sm font-semibold text-slate-200">Как распределились данные:</h4>
                          <ul className="text-xs text-slate-400 space-y-3 mt-3">
                            <li className="flex items-start gap-2">
                              <span className="text-green-400 font-bold">✔</span>
                              <span>
                                <strong className="text-slate-300">Токен ({regResult.token})</strong> сохранен в открытом виде для быстрой идентификации.
                              </span>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="text-green-400 font-bold">✔</span>
                              <span>
                                <strong className="text-slate-300">ИИН Пациента</strong> необратимо преобразован в SHA-256 хеш:
                                <div className="font-mono text-[10px] bg-slate-900 p-1.5 rounded mt-1 overflow-x-auto text-primary-400 border border-slate-800">
                                  {regResult.iinHash}
                                </div>
                              </span>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="text-green-400 font-bold">✔</span>
                              <span>
                                <strong className="text-slate-300">ФИО, ИИН, Телефон и Адрес</strong> зашифрованы алгоритмом AES-256-CBC с секретным ключом. В базе хранится шифротекст:
                                <div className="font-mono text-[9px] bg-slate-900 p-1.5 rounded mt-1 overflow-x-auto text-slate-500 border border-slate-800 break-all select-none">
                                  {regResult.encryptedData.substring(0, 100)}...
                                </div>
                              </span>
                            </li>
                          </ul>
                        </div>

                        <button
                          onClick={() => setRegResult(null)}
                          className="w-full mt-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl border border-slate-700 transition-colors cursor-pointer"
                        >
                          Регистрация следующего пациента
                        </button>
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              )}

              {/* TAB 2: SECOND VISIT (RECEPTIONIST) */}
              {activeTab === "reception" && (
                <motion.div
                  key="reception-tab"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-6"
                >
                  <div>
                    <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                      <ScanLine className="text-primary-400 w-5 h-5" />
                      Повторный визит (Регистратор)
                    </h2>
                    <p className="text-xs text-slate-400 mt-1 mb-4">
                      Пациент предъявляет только QR-код из телефона. Регистратор сканирует его и видит исключительно токен,
                      не имея технического доступа к персональным данным (ФИО, ИИН, контакты).
                    </p>

                    {/* Презентация ценности */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80 text-xs leading-normal mb-6">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 font-bold text-red-400">
                          <ShieldAlert className="w-3.5 h-3.5 flex-shrink-0" />
                          <span>ПРОБЛЕМА</span>
                        </div>
                        <p className="text-slate-400 text-[11px]">
                          Сотрудники регистратуры видят личные данные на мониторах, что создает риски «человеческого фактора» (фото экрана, сливы).
                        </p>
                      </div>
                      <div className="space-y-1 md:border-l md:border-slate-800 md:pl-4">
                        <div className="flex items-center gap-1.5 font-bold text-cyan-400">
                          <ShieldCheck className="w-3.5 h-3.5 flex-shrink-0" />
                          <span>РЕШЕНИЕ</span>
                        </div>
                        <p className="text-slate-400 text-[11px]">
                          Сотрудник работает «вслепую» с токеном. Сканирование QR подтверждает визит без раскрытия ФИО и ИИН.
                        </p>
                      </div>
                      <div className="space-y-1 md:border-l md:border-slate-800 md:pl-4">
                        <div className="flex items-center gap-1.5 font-bold text-violet-400">
                          <Sparkles className="w-3.5 h-3.5 flex-shrink-0" />
                          <span>КАК ТЕСТИРОВАТЬ</span>
                        </div>
                        <p className="text-slate-400 text-[11px]">
                          Выберите токен из списка, нажмите <strong>«Считать QR-код»</strong>. Убедитесь, что все поля замаскированы.
                        </p>
                      </div>
                    </div>
                  </div>

                  {patients.length === 0 ? (
                    <div className="text-center py-12 bg-slate-950/40 rounded-2xl border border-slate-800/80">
                      <Info className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                      <p className="text-sm text-slate-400">В базе данных нет зарегистрированных пациентов.</p>
                      <button
                        onClick={() => setActiveTab("register")}
                        className="mt-3 text-xs text-primary-400 underline hover:text-primary-300 cursor-pointer"
                      >
                        Зарегистрировать первого пациента
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div className="flex flex-col sm:flex-row gap-4 items-end bg-slate-950/40 p-4 rounded-xl border border-slate-850">
                        <div className="flex-1 space-y-1.5">
                          <label className="text-xs font-medium text-slate-400 block">
                            Имитация сканера: Выберите токен пациента
                          </label>
                          <select
                            value={selectedTokenRecep}
                            onChange={(e) => {
                              setSelectedTokenRecep(e.target.value);
                              setRecepResult(null);
                              setCheckInSuccess(false);
                            }}
                            className="w-full bg-slate-950 border border-slate-800 focus:border-primary-500 rounded-xl px-4 py-2.5 text-sm text-slate-300 outline-none cursor-pointer"
                          >
                            <option value="">-- Выберите токен --</option>
                            {patients.map((p) => (
                              <option key={p.token} value={p.token}>
                                {p.token}
                              </option>
                            ))}
                          </select>
                        </div>
                        <button
                          onClick={handleRecepScan}
                          disabled={scanning || !selectedTokenRecep}
                          className="w-full sm:w-auto px-6 py-2.5 bg-primary-600 hover:bg-primary-500 text-slate-50 text-sm font-semibold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40"
                        >
                          <ScanLine className="w-4 h-4" />
                          Считать QR-код
                        </button>
                      </div>

                      {/* Scanning Animation */}
                      {scanning && (
                        <div className="flex flex-col items-center justify-center py-10 bg-slate-950/60 rounded-2xl border border-slate-800 relative overflow-hidden h-44">
                          {/* Animated scan bar */}
                          <div className="absolute inset-x-0 h-1 bg-primary-500/80 shadow-[0_0_15px_rgba(6,182,212,0.8)] animate-[bounce_1.5s_infinite]"></div>
                          <RefreshCw className="w-8 h-8 text-primary-400 animate-spin mb-3" />
                          <div className="text-xs font-mono text-slate-400">Считывание QR-кода...</div>
                        </div>
                      )}

                      {recepResult && !scanning && (
                        <motion.div 
                          initial={{ opacity: 0, y: 5 }} 
                          animate={{ opacity: 1, y: 0 }}
                          className="space-y-4"
                        >
                          <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-slate-500 font-mono">Результат сканирования</span>
                              <div className="px-2.5 py-0.5 rounded-full bg-green-500/10 text-green-400 font-medium text-[10px] border border-green-500/20">
                                Авторизован
                              </div>
                            </div>

                            <div className="flex items-center gap-4 py-2 border-y border-slate-850">
                              <div className="w-12 h-12 bg-primary-500/10 rounded-xl flex items-center justify-center text-primary-400">
                                <User className="w-6 h-6" />
                              </div>
                              <div>
                                <div className="text-xs text-slate-500">Системный идентификатор</div>
                                <div className="text-xl font-bold font-mono text-slate-100">{recepResult.token}</div>
                              </div>
                            </div>

                            {/* Masked Data Visual Comparison */}
                            <div className="space-y-2.5">
                              <div className="text-xs font-semibold text-slate-400">Данные на мониторе регистратора:</div>
                              <div className="grid grid-cols-2 gap-3 text-xs">
                                <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-800">
                                  <span className="text-slate-500 block">ФИО</span>
                                  <span className="font-mono text-red-400 font-semibold tracking-wider flex items-center gap-1.5 mt-0.5">
                                    <EyeOff className="w-3.5 h-3.5" /> Скрыто (Шифр)
                                  </span>
                                </div>
                                <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-800">
                                  <span className="text-slate-500 block">ИИН</span>
                                  <span className="font-mono text-red-400 font-semibold tracking-wider flex items-center gap-1.5 mt-0.5">
                                    <EyeOff className="w-3.5 h-3.5" /> Скрыто (Шифр)
                                  </span>
                                </div>
                                <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-800">
                                  <span className="text-slate-500 block">Телефон</span>
                                  <span className="font-mono text-red-400 font-semibold tracking-wider flex items-center gap-1.5 mt-0.5">
                                    <EyeOff className="w-3.5 h-3.5" /> Скрыто (Шифр)
                                  </span>
                                </div>
                                <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-800">
                                  <span className="text-slate-500 block">Адрес</span>
                                  <span className="font-mono text-red-400 font-semibold tracking-wider flex items-center gap-1.5 mt-0.5">
                                    <EyeOff className="w-3.5 h-3.5" /> Скрыто (Шифр)
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {!checkInSuccess ? (
                            <button
                              onClick={handleCheckInConfirm}
                              className="w-full bg-green-600 hover:bg-green-500 text-slate-50 text-sm font-semibold py-3 px-4 rounded-xl transition-all shadow-md shadow-green-600/10 cursor-pointer flex items-center justify-center gap-2"
                            >
                              <UserCheck className="w-4 h-4" />
                              Записать на прием (Создать визит)
                            </button>
                          ) : (
                            <div className="p-4 bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-semibold rounded-xl text-center flex items-center justify-center gap-2">
                              <Check className="w-4 h-4" />
                              Визит подтвержден. Запись с идентификатором {recepResult.token} отправлена к врачу.
                            </div>
                          )}
                        </motion.div>
                      )}
                    </div>
                  )}
                </motion.div>
              )}

              {/* TAB 3: DOCTOR TERMINAL (DECRYPT) */}
              {activeTab === "doctor" && (
                <motion.div
                  key="doctor-tab"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-6"
                >
                  <div>
                    <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                      <Stethoscope className="text-primary-400 w-5 h-5" />
                      Кабинет врача / Администратор
                    </h2>
                    <p className="text-xs text-slate-400 mt-1 mb-4">
                      Для проведения диагностики врачу требуется видеть медицинскую карту. Только авторизованный
                      сотрудник с ключом (PIN) может отправить запрос на дешифрование данных.
                    </p>

                    {/* Презентация ценности */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80 text-xs leading-normal mb-6">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 font-bold text-red-400">
                          <ShieldAlert className="w-3.5 h-3.5 flex-shrink-0" />
                          <span>ПРОБЛЕМА</span>
                        </div>
                        <p className="text-slate-400 text-[11px]">
                          Врачу необходимы данные пациента для лечения, но они полностью зашифрованы в базе данных.
                        </p>
                      </div>
                      <div className="space-y-1 md:border-l md:border-slate-800 md:pl-4">
                        <div className="flex items-center gap-1.5 font-bold text-cyan-400">
                          <ShieldCheck className="w-3.5 h-3.5 flex-shrink-0" />
                          <span>РЕШЕНИЕ</span>
                        </div>
                        <p className="text-slate-400 text-[11px]">
                          Дешифрование происходит только для подтвержденной роли «Врач» с вводом PIN-кода. Данные расшифровываются временно в браузере.
                        </p>
                      </div>
                      <div className="space-y-1 md:border-l md:border-slate-800 md:pl-4">
                        <div className="flex items-center gap-1.5 font-bold text-violet-400">
                          <Sparkles className="w-3.5 h-3.5 flex-shrink-0" />
                          <span>КАК ТЕСТИРОВАТЬ</span>
                        </div>
                        <p className="text-slate-400 text-[11px]">
                          Выберите пациента, переключите на <strong>«Врач»</strong>, введите PIN <strong>DOCTOR123</strong> и нажмите <strong>«Дешифровать»</strong>.
                        </p>
                      </div>
                    </div>
                  </div>

                  {patients.length === 0 ? (
                    <div className="text-center py-12 bg-slate-950/40 rounded-2xl border border-slate-800/80">
                      <Info className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                      <p className="text-sm text-slate-400">В базе данных нет зарегистрированных пациентов.</p>
                    </div>
                  ) : (
                    <div className="space-y-5">
                      {/* Access Controls */}
                      <div className="bg-slate-950/40 p-4 rounded-2xl border border-slate-850 space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-xs font-medium text-slate-400 block">Пациент в кабинете</label>
                            <select
                              value={selectedTokenDoc}
                              onChange={(e) => {
                                setSelectedTokenDoc(e.target.value);
                                setDoctorResult(null);
                              }}
                              className="w-full bg-slate-950 border border-slate-800 focus:border-primary-500 rounded-xl px-4 py-2.5 text-sm text-slate-300 outline-none cursor-pointer"
                            >
                              <option value="">-- Выберите токен пациента --</option>
                              {patients.map((p) => (
                                <option key={p.token} value={p.token}>
                                  {p.token}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-xs font-medium text-slate-400 block">Роль сотрудника</label>
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => setRole("registrar")}
                                className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                                  role === "registrar"
                                    ? "bg-slate-800 border-slate-600 text-slate-200"
                                    : "bg-slate-950 border-slate-850 text-slate-500 hover:text-slate-300"
                                }`}
                              >
                                Регистратор 👤
                              </button>
                              <button
                                type="button"
                                onClick={() => setRole("doctor")}
                                className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                                  role === "doctor"
                                    ? "bg-primary-950/40 border-primary-500/40 text-primary-400"
                                    : "bg-slate-950 border-slate-850 text-slate-500 hover:text-slate-300"
                                }`}
                              >
                                Врач 🥼
                              </button>
                            </div>
                          </div>
                        </div>

                        {role === "doctor" && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-900 items-end">
                            <div className="space-y-1.5">
                              <div className="flex justify-between items-center">
                                <label className="text-xs font-medium text-slate-400 block">PIN-код доступа врача</label>
                                <span className="text-[10px] text-primary-400 font-mono">Тест PIN: DOCTOR123</span>
                              </div>
                              <input
                                type="password"
                                placeholder="Введите пин-код"
                                value={passcode}
                                onChange={(e) => setPasscode(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-850 focus:border-primary-500 rounded-xl px-4 py-2 text-sm text-slate-200 font-mono outline-none transition-colors"
                              />
                            </div>
                            <button
                              onClick={handleDoctorDecrypt}
                              disabled={decrypting || !selectedTokenDoc}
                              className="px-6 py-2.5 bg-primary-600 hover:bg-primary-500 text-slate-50 text-sm font-semibold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40"
                            >
                              {decrypting ? (
                                <>
                                  <RefreshCw className="w-4 h-4 animate-spin" />
                                  Дешифрование...
                                </>
                              ) : (
                                <>
                                  <Unlock className="w-4 h-4" />
                                  Запрос дешифрования
                                </>
                              )}
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Decryption Screen status */}
                      {decrypting && (
                        <div className="flex flex-col items-center justify-center py-10 bg-slate-950/60 rounded-2xl border border-slate-800 relative overflow-hidden h-44">
                          <RefreshCw className="w-8 h-8 text-primary-400 animate-spin mb-3" />
                          <div className="text-xs font-mono text-slate-400 animate-pulse">
                            Вызов крипто-модуля. Запрос сессионного ключа...
                          </div>
                        </div>
                      )}

                      {/* Decrypted Patient Record Card */}
                      {doctorResult && !decrypting && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.98 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4"
                        >
                          <div className="flex items-center justify-between pb-3 border-b border-slate-850">
                            <div className="flex items-center gap-2">
                              <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-ping"></div>
                              <h3 className="text-sm font-bold text-slate-200">Данные успешно расшифрованы на сервере</h3>
                            </div>
                            <span className="text-[10px] font-mono text-slate-500">AES-256-CBC</span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-850">
                              <span className="text-[10px] font-mono text-slate-500 uppercase">Полное имя (ФИО)</span>
                              <span className="text-sm font-bold text-slate-200 block mt-1">
                                {doctorResult.details.name}
                              </span>
                            </div>
                            <div className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-850">
                              <span className="text-[10px] font-mono text-slate-500 uppercase">ИИН Пациента</span>
                              <span className="text-sm font-bold text-slate-200 block font-mono mt-1">
                                {doctorResult.details.iin}
                              </span>
                            </div>
                            <div className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-850">
                              <span className="text-[10px] font-mono text-slate-500 uppercase">Номер телефона</span>
                              <span className="text-sm font-bold text-slate-200 block font-mono mt-1">
                                {doctorResult.details.phone}
                              </span>
                            </div>
                            <div className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-850">
                              <span className="text-[10px] font-mono text-slate-500 uppercase">Адрес регистрации</span>
                              <span className="text-sm font-bold text-slate-200 block mt-1">
                                {doctorResult.details.address}
                              </span>
                            </div>
                          </div>

                          <div className="p-3 bg-primary-950/20 border border-primary-900/40 rounded-xl flex items-start gap-2.5">
                            <Info className="w-4 h-4 text-primary-400 flex-shrink-0 mt-0.5" />
                            <p className="text-[11px] text-slate-400 leading-normal">
                              Дешифрованные персональные данные не кэшируются на компьютере врача. При закрытии вкладки или
                              сеанса оперативная память очищается. База данных по-прежнему хранит только зашифрованный массив.
                            </p>
                          </div>
                        </motion.div>
                      )}
                    </div>
                  )}
                </motion.div>
              )}

              {/* TAB 4: DUPLICATE SEARCH (SHA-256 HASH) */}
              {activeTab === "hash" && (
                <motion.div
                  key="hash-tab"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-6"
                >
                  <div>
                    <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                      <Search className="text-primary-400 w-5 h-5" />
                      Проверка дубликатов без дешифрования (SHA-256)
                    </h2>
                    <p className="text-xs text-slate-400 mt-1 mb-4">
                      Продвинутый режим. Чтобы не создавать новые токены для одного человека, система должна искать совпадения. 
                      Но так как данные зашифрованы, мы вычисляем SHA-256 хеш от ИИН и сверяем его. Это исключает хранение открытого ИИН.
                    </p>

                    {/* Презентация ценности */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80 text-xs leading-normal mb-6">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 font-bold text-red-400">
                          <ShieldAlert className="w-3.5 h-3.5 flex-shrink-0" />
                          <span>ПРОБЛЕМА</span>
                        </div>
                        <p className="text-slate-400 text-[11px]">
                          Как избежать дублирования записей пациентов в базе, если ФИО и ИИН полностью зашифрованы в БД?
                        </p>
                      </div>
                      <div className="space-y-1 md:border-l md:border-slate-800 md:pl-4">
                        <div className="flex items-center gap-1.5 font-bold text-cyan-400">
                          <ShieldCheck className="w-3.5 h-3.5 flex-shrink-0" />
                          <span>РЕШЕНИЕ</span>
                        </div>
                        <p className="text-slate-400 text-[11px]">
                          ИИН хешируется по алгоритму SHA-256. База ищет совпадения по этому хешу, не дешифруя остальные данные.
                        </p>
                      </div>
                      <div className="space-y-1 md:border-l md:border-slate-800 md:pl-4">
                        <div className="flex items-center gap-1.5 font-bold text-violet-400">
                          <Sparkles className="w-3.5 h-3.5 flex-shrink-0" />
                          <span>КАК ТЕСТИРОВАТЬ</span>
                        </div>
                        <p className="text-slate-400 text-[11px]">
                          Введите зарегистрированный ранее ИИН, посмотрите расчет хеша «на лету» и нажмите <strong>«Проверить»</strong>.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-5">
                    {/* Interactive Input Form */}
                    <div className="bg-slate-950/40 p-5 rounded-2xl border border-slate-850 space-y-4">
                      <div className="flex flex-col sm:flex-row gap-4 items-end">
                        <div className="flex-1 space-y-1.5">
                          <div className="flex justify-between items-center">
                            <label className="text-xs font-medium text-slate-400 block">Введите ИИН для проверки</label>
                            <span className="text-[10px] text-slate-500">12 цифр</span>
                          </div>
                          <input
                            type="text"
                            maxLength={12}
                            placeholder="Введите ИИН пациента"
                            value={dupIin}
                            onChange={(e) => setDupIin(e.target.value.replace(/\D/g, ""))}
                            className="w-full bg-slate-950 border border-slate-800 focus:border-primary-500 rounded-xl px-4 py-2.5 text-sm text-slate-200 font-mono outline-none transition-colors"
                          />
                        </div>
                        <button
                          onClick={handleCheckDuplicate}
                          disabled={loading || dupIin.length !== 12}
                          className="w-full sm:w-auto px-6 py-2.5 bg-primary-600 hover:bg-primary-500 text-slate-50 text-sm font-semibold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40"
                        >
                          <Search className="w-4 h-4" />
                          Проверить по хешу
                        </button>
                      </div>

                      {/* Live Cryptographic Flow Chart */}
                      {dupIin && (
                        <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-850 space-y-3">
                          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                            Вычисление хеша на клиенте в реальном времени:
                          </div>
                          
                          <div className="flex flex-col md:flex-row items-center gap-3 py-1 font-mono text-xs">
                            {/* Input block */}
                            <div className="w-full md:w-auto bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 text-slate-300 text-center">
                              <span className="text-[9px] text-slate-500 block uppercase font-sans">Ввод ИИН</span>
                              {dupIin}
                            </div>
                            
                            {/* Hash Arrow */}
                            <div className="text-primary-400 text-lg flex items-center gap-1">
                              <ArrowRight className="w-4 h-4 rotate-90 md:rotate-0" />
                              <span className="text-[9px] font-sans uppercase">SHA-256</span>
                              <ArrowRight className="w-4 h-4 rotate-90 md:rotate-0" />
                            </div>

                            {/* Hash Result */}
                            <div className="w-full md:flex-1 bg-primary-950/20 border border-primary-900/30 px-3 py-1.5 rounded-lg text-primary-400 text-center break-all text-[11px]">
                              <span className="text-[9px] text-primary-500 block uppercase font-sans">Результирующий Хеш</span>
                              {dupHash || "..."}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Result Alerts */}
                    {dupResult && (
                      <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                      >
                        {dupResult.registered ? (
                          <div className="p-5 bg-red-950/20 border border-red-900/40 rounded-2xl flex items-start gap-4">
                            <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center text-red-400 flex-shrink-0">
                              <ShieldAlert className="w-5 h-5" />
                            </div>
                            <div className="space-y-1">
                              <h4 className="text-sm font-bold text-red-400">Пациент найден в базе данных!</h4>
                              <p className="text-xs text-slate-400 leading-normal">
                                Система сопоставила хеш <code className="font-mono text-red-300 bg-red-950/40 px-1 py-0.5 rounded">{dupHash.substring(0, 16)}...</code> с базой данных. 
                                Пациент уже зарегистрирован с токеном <strong className="font-mono text-slate-200">{dupResult.token}</strong>.
                              </p>
                              <div className="pt-3">
                                <button
                                  onClick={() => {
                                    setSelectedTokenRecep(dupResult.token);
                                    setActiveTab("reception");
                                  }}
                                  className="text-xs text-primary-400 hover:text-primary-300 underline font-semibold flex items-center gap-1 cursor-pointer"
                                >
                                  Перейти к оформлению визита <ArrowRight className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="p-5 bg-green-950/20 border border-green-900/40 rounded-2xl flex items-start gap-4">
                            <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center text-green-400 flex-shrink-0">
                              <UserCheck className="w-5 h-5" />
                            </div>
                            <div className="space-y-1">
                              <h4 className="text-sm font-bold text-green-400">Совпадений не обнаружено</h4>
                              <p className="text-xs text-slate-400 leading-normal">
                                Хеш <code className="font-mono text-green-300 bg-green-950/40 px-1 py-0.5 rounded">{dupHash.substring(0, 16)}...</code> отсутствует в реестре.
                                Это новый пациент, его необходимо зарегистрировать на первом шаге.
                              </p>
                              <div className="pt-3">
                                <button
                                  onClick={() => {
                                    setRegIin(dupIin);
                                    setActiveTab("register");
                                  }}
                                  className="text-xs text-primary-400 hover:text-primary-300 underline font-semibold flex items-center gap-1 cursor-pointer"
                                >
                                  Перейти к регистрации <ArrowRight className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Right Column: Encrypted Database Table Preview */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-slate-900/80 backdrop-blur-md border border-slate-850 rounded-3xl p-6 relative overflow-hidden flex flex-col h-full shadow-xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-850 mb-4">
              <h3 className="font-bold text-slate-100 flex items-center gap-2 text-sm uppercase tracking-wider">
                <Database className="w-4 h-4 text-primary-400" />
                Состояние БД (Ledger View)
              </h3>
              <button
                onClick={fetchPatients}
                className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-lg transition-colors cursor-pointer"
                title="Обновить таблицу"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
            
            <p className="text-[11px] text-slate-400 leading-relaxed mb-4">
              Это интерактивная репрезентация зашифрованной таблицы в базе данных клиники. Взломав эту базу, 
              злоумышленник получит только случайные токены, хеши ИИН и бесполезные шифротексты.
            </p>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1 max-h-[440px]">
              {patients.length === 0 ? (
                <div className="text-center py-10 bg-slate-950/30 rounded-xl border border-slate-900">
                  <Terminal className="w-5 h-5 text-slate-600 mx-auto mb-1" />
                  <span className="text-[11px] text-slate-500 font-mono">База пуста</span>
                </div>
              ) : (
                patients.map((p) => {
                  const isNew = highlightedRow === p.token;
                  return (
                    <motion.div
                      key={p.token}
                      animate={isNew ? { scale: [1, 1.02, 1], borderColor: ["#1e293b", "#06b6d4", "#1e293b"] } : {}}
                      transition={{ duration: 1.5, repeat: isNew ? 2 : 0 }}
                      className={`p-3 bg-slate-950/80 border rounded-xl space-y-2 relative overflow-hidden transition-all ${
                        isNew ? "border-primary-500 ring-1 ring-primary-500/20" : "border-slate-850 hover:border-slate-700"
                      }`}
                    >
                      {isNew && (
                        <div className="absolute top-0 right-0 bg-primary-500 text-[8px] text-slate-950 font-bold uppercase tracking-wider px-2 py-0.5 rounded-bl">
                          New Row
                        </div>
                      )}
                      {/* Patient Token Header */}
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-300 font-mono">{p.token}</span>
                        <span className="text-[9px] text-slate-600 font-mono">
                          {new Date(p.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </span>
                      </div>

                      {/* Cryptographic components */}
                      <div className="space-y-1 text-[10px]">
                        <div>
                          <span className="text-slate-600 block uppercase font-sans text-[8px] font-bold">SHA-256(ИИН)</span>
                          <span className="font-mono text-primary-400/90 break-all bg-slate-900/50 px-1 py-0.5 rounded block">
                            {p.iinHash.substring(0, 24)}...
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-600 block uppercase font-sans text-[8px] font-bold">AES-256(ФИО, ИИН, Тел, Адрес)</span>
                          <span className="font-mono text-slate-500 break-all bg-slate-900/50 px-1 py-0.5 rounded block leading-normal max-h-12 overflow-y-hidden select-none">
                            {p.encryptedData.substring(0, 64)}...
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-850 flex items-center justify-between text-[10px] text-slate-500 font-mono">
              <span>Rows: {patients.length}</span>
              <span className="flex items-center gap-1 text-green-400 bg-green-500/5 px-2 py-0.5 rounded border border-green-500/10">
                <Lock className="w-3 h-3" /> Secure Ledger
              </span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
