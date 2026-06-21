import { Activity, ShieldCheck, Database, Smartphone, ArrowRight, Lock, EyeOff, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Tooltip } from '../components/Tooltip';
import { useState, useEffect } from 'react';

export function Landing() {
  const [savedBudget, setSavedBudget] = useState(12504500);

  useEffect(() => {
    const interval = setInterval(() => {
      setSavedBudget(prev => prev + Math.floor(Math.random() * 7000) + 3000);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col min-h-full">
      {/* Hero Section */}
      <section className="pt-20 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full flex flex-col items-center text-center relative">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-500/10 text-primary-400 font-mono text-sm mb-8 ring-1 ring-primary-500/20 shadow-[0_0_15px_rgba(6,182,212,0.15)]"
        >
          <ShieldCheck className="w-4 h-4" />
          <span>The "Glass Box" Protocol</span>
        </motion.div>
        
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-4xl sm:text-6xl font-bold tracking-tight text-slate-50 mb-6 leading-tight"
        >
          MedStamp <br className="hidden sm:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 via-cyan-300 to-blue-500 drop-shadow-[0_0_20px_rgba(34,211,238,0.2)]">
            Цифровой нотариус для медицины
          </span>
        </motion.h1>
        
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-slate-400 text-lg sm:text-xl max-w-2xl mb-8 leading-relaxed font-light"
        >
          Zero-Trust верификация медицинских событий. Мы исключаем фейковые визиты и подделку отчетности, не сохраняя ни одного байта персональных данных.
        </motion.p>

        <motion.div
           initial={{ opacity: 0, scale: 0.9 }}
           animate={{ opacity: 1, scale: 1 }}
           transition={{ delay: 0.25 }}
           className="bg-slate-900/60 backdrop-blur border border-primary-500/30 px-6 py-4 rounded-2xl mb-10 shadow-[0_0_20px_-5px_rgba(6,182,212,0.3)] flex items-center gap-4"
        >
          <div className="w-12 h-12 bg-primary-500/10 rounded-full flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-primary-400" />
          </div>
          <div className="text-left font-mono">
             <div className="text-xs text-slate-400 uppercase tracking-wider mb-1">Economical Impact (Live)</div>
             <div className="text-2xl font-bold text-slate-50 flex items-center gap-2">
               {savedBudget.toLocaleString("ru-KZ")} ₸ <span className="text-xs text-primary-400 font-sans tracking-normal bg-primary-500/10 px-2 py-0.5 rounded-md border border-primary-500/20">Saved</span>
             </div>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center gap-4"
        >
          <Link to="/clinic" className="px-8 py-3.5 bg-primary-600 hover:bg-primary-500 text-slate-50 font-medium rounded-xl transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_30px_rgba(6,182,212,0.5)] flex items-center gap-2 active:scale-95 group">
            Start Live Demo <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
          <a href="#how-it-works" className="px-8 py-3.5 bg-slate-800/80 backdrop-blur hover:bg-slate-700/80 text-slate-300 font-medium rounded-xl transition-colors border border-slate-700 hover:border-slate-600">
            Как это работает?
          </a>
        </motion.div>
      </section>

      {/* The Problem & Solution */}
      <section className="py-16 bg-slate-900/50 border-y border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-4">Проблема доверия</h2>
              <p className="text-slate-400 mb-6 leading-relaxed">
                До 15% бюджета клиник может теряться из-за "приписок" или неточного учета визитов. Существующие МИС позволяют изменять данные задним числом. Ревизорам приходится верить на слово или вручную обзванивать пациентов.
              </p>
              <div className="flex items-start gap-4 mb-4">
                <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center flex-shrink-0 mt-1">
                  <EyeOff className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <h4 className="font-semibold text-slate-200">Отсутствие иммутабельности</h4>
                  <p className="text-slate-500 text-sm">Базы данных можно отредактировать без следа.</p>
                </div>
              </div>
            </div>
            
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="p-8 bg-slate-900/60 backdrop-blur-md rounded-2xl border border-slate-800 shadow-[0_0_40px_-10px_rgba(6,182,212,0.1)] relative overflow-hidden"
            >
               <div className="absolute -right-20 -top-20 w-64 h-64 bg-primary-500/10 blur-3xl rounded-full"></div>
               <h3 className="text-xl font-bold mb-6 flex items-center gap-2"><Lock className="w-5 h-5 text-primary-400" /> Наше решение</h3>
               
               <div className="space-y-6 relative z-10">
                 <div className="border-l-2 border-primary-500 pl-4 group hover:border-primary-400 transition-colors">
                   <h4 className="font-semibold text-slate-200 group-hover:text-primary-300 transition-colors">1. Cryptographic Middleware</h4>
                   <p className="text-slate-500 text-sm">MedStamp работает поверх вашей МИС.</p>
                 </div>
                 <div className="border-l-2 border-primary-500 pl-4 group hover:border-primary-400 transition-colors">
                   <h4 className="font-semibold text-slate-200 group-hover:text-primary-300 transition-colors">2. Zero-Knowledge Proof</h4>
                   <p className="text-slate-500 text-sm">Мы хешируем ID врача и пациента. Имена остаются в клинике.</p>
                 </div>
                 <div className="border-l-2 border-primary-500 pl-4 group hover:border-primary-400 transition-colors">
                   <h4 className="font-semibold text-slate-200 group-hover:text-primary-300 transition-colors">3. Dual-Verification (Multi-sig)</h4>
                   <p className="text-slate-500 text-sm">Пациент подписывает крипто-транзакцию своим смартфоном (HMAC).</p>
                 </div>
               </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Demo Selector */}
      <section id="how-it-works" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <motion.h2 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-3xl font-bold text-center mb-12"
        >
          Попробуйте архитектуру в действии
        </motion.h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          <Link to="/clinic" className="group block p-6 bg-slate-900/40 backdrop-blur-md border border-slate-800 rounded-2xl hover:border-primary-500/50 hover:bg-slate-900/80 transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-primary-500/10">
            <div className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center mb-4 group-hover:bg-primary-500/20 group-hover:scale-110 transition-all">
              <Activity className="w-6 h-6 text-primary-400" />
            </div>
            <h3 className="text-xl font-bold text-slate-200 mb-2">1. Terminal (MIS)</h3>
            <div className="text-slate-400 text-sm">Симуляция экрана врача. Генерирует {" "}<Tooltip content="Криптографически уникальная строка (SHA-256)">ZK Hash</Tooltip>{" "} из данных визита.</div>
          </Link>

          <div className="group block p-6 bg-slate-900/40 backdrop-blur-md border border-slate-800 rounded-2xl cursor-default opacity-80">
            <div className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center mb-4">
              <Smartphone className="w-6 h-6 text-blue-400" />
            </div>
            <h3 className="text-xl font-bold text-slate-200 mb-2">2. Patient App</h3>
            <p className="text-slate-400 text-sm">Открывается по QR-коду со стола врача для подписи транзакции через HMAC.</p>
          </div>

          <Link to="/explorer" className="group block p-6 bg-slate-900/40 backdrop-blur-md border border-slate-800 rounded-2xl hover:border-primary-500/50 hover:bg-slate-900/80 transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-primary-500/10">
            <div className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center mb-4 group-hover:bg-primary-500/20 group-hover:scale-110 transition-all">
              <Database className="w-6 h-6 text-primary-400" />
            </div>
            <h3 className="text-xl font-bold text-slate-200 mb-2">3. Public Explorer</h3>
            <p className="text-slate-400 text-sm">Аудит-журнал для проверок на базе иммутабельного криптографического реестра.</p>
          </Link>

        </div>
      </section>
    </div>
  );
}
