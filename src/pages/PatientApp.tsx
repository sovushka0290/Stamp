import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

export const PatientApp = () => {
  const [status, setStatus] = useState<'idle' | 'verifying' | 'success'>('idle');
  const { sessionId } = useParams();
  const navigate = useNavigate();

  const handleFingerprintClick = async () => {
    setStatus('verifying');
    
    try {
      const res = await fetch(`/api/events/${sessionId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hmacSignature: "bypass_for_demo", // Simulate the HMAC validation
          patientPayload: "patient_otp_payload",
        }),
      });

      if (res.ok) {
        setTimeout(() => {
          setStatus('success');
        }, 1500);
      } else {
        alert("Ошибка подтверждения визита.");
        setStatus('idle');
      }
    } catch (err) {
      console.error(err);
      alert("Ошибка сети.");
      setStatus('idle');
    }
  };

  if (!sessionId) {
    return (
      <div className="min-h-screen bg-white p-8 flex flex-col justify-center items-center text-center">
        <h2 className="text-2xl font-bold text-slate-900 mb-4">Ошибка сессии</h2>
        <p className="text-slate-500 mb-8">Пожалуйста, отсканируйте QR-код врача.</p>
        <button onClick={() => navigate('/')} className="text-blue-600 underline">На главную</button>
      </div>
    )
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen bg-green-50 flex flex-col justify-center items-center p-8 animate-in fade-in zoom-in duration-300">
        <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mb-6 text-white text-5xl shadow-lg shadow-green-200">
          ✔️
        </div>
        <h2 className="text-3xl font-extrabold text-slate-900 mb-4">Подписано!</h2>
        <p className="text-slate-600 text-center mb-8">Ваш визит зафиксирован и защищен криптографией.</p>
        <button 
          onClick={() => navigate('/explorer')}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-xl transition-all shadow-md shadow-blue-200"
        >
          Посмотреть в Public Audit Explorer
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-8 flex flex-col justify-center items-center">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-extrabold text-slate-900">Подтверждение</h1>
        <p className="text-slate-500 mt-2 text-lg">Вы находитесь в клинике: <br/><strong>Горбольница №2</strong></p>
      </div>

      <button 
        onClick={handleFingerprintClick}
        disabled={status === 'verifying'}
        className={`relative w-48 h-48 rounded-full flex items-center justify-center transition-all cursor-pointer ${
          status === 'verifying' ? 'bg-green-100 scale-95 cursor-wait' : 'bg-blue-50 shadow-2xl shadow-blue-100 hover:scale-105 active:scale-90'
        }`}
      >
        <div className={`absolute inset-0 rounded-full border-4 ${status === 'verifying' ? 'border-green-500 animate-ping' : 'border-blue-200'}`}></div>
        <div className="text-blue-600 text-6xl select-none">
          {status === 'verifying' ? '⏳' : '☝️'}
        </div>
      </button>

      <p className="mt-8 text-slate-400 font-medium animate-pulse text-center leading-relaxed">
        {status === 'verifying' ? 'Отправка...' : 'Приложите палец для \nподписи визита'}
      </p>
    </div>
  );
};
