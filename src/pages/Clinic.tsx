import React, { useState, useEffect } from 'react';
import { CheckCircle, QrCode, User } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';

export const Clinic = () => {
  const [status, setStatus] = useState<'idle' | 'generating' | 'waiting' | 'verified'>('idle');
  const [qrUrl, setQrUrl] = useState('');
  const [sessionId, setSessionId] = useState('');

  const handleCompleteVisit = async () => {
    setStatus('generating');

    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clinicId: "GLBL-MED-77X",
          doctorId: "DR-SMITH-009",
          patientId: "IIN-00123456789",
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setSessionId(data.sessionId);
        setQrUrl(`${window.location.origin}/patient/${data.sessionId}`);
        setStatus('waiting');
      } else {
        setStatus('idle');
        alert("Ошибка при создании сессии");
      }
    } catch (err) {
      console.error(err);
      setStatus('idle');
    }
  };

  // Poll for verification if waiting
  useEffect(() => {
    if (status !== 'waiting' || !sessionId) return;
    
    const interval = setInterval(async () => {
      try {
         const res = await fetch(`/api/events`);
         const events = await res.json();
         const event = events.find((e: any) => e.id === sessionId);
         if (event && event.status === "VERIFIED") {
           setStatus('verified');
           clearInterval(interval);
         }
      } catch (err) {
        // ignore
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [status, sessionId]);

  return (
    <div className="min-h-screen bg-slate-50 p-6 flex flex-col items-center">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-sm border border-slate-100 p-8 mt-12">
        <h2 className="text-2xl font-bold text-slate-800 mb-6">Прием пациента</h2>
        
        {/* Карточка пациента (имитация МИС) */}
        <div className="flex items-center p-4 bg-blue-50 rounded-2xl mb-8">
          <div className="bg-blue-500 p-3 rounded-xl text-white mr-4">
            <User size={24} />
          </div>
          <div>
            <p className="text-sm text-blue-600 font-medium">Текущий сеанс</p>
            <p className="text-lg font-bold text-slate-900">Александр Иванов</p>
          </div>
        </div>

        {status === 'idle' && (
          <button 
            onClick={handleCompleteVisit}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-blue-200 cursor-pointer"
          >
            Завершить прием и выдать QR
          </button>
        )}

        {status === 'generating' && (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-slate-500 font-medium">Создание цифровой печати...</p>
          </div>
        )}

        {status === 'waiting' && (
          <div className="text-center animate-in fade-in zoom-in">
            <div className="bg-slate-100 p-6 rounded-3xl flex justify-center mb-4">
              <QRCodeCanvas 
                value={qrUrl}
                size={180}
                level="M"
                includeMargin={false}
              />
            </div>
            <p className="text-slate-600 font-medium">Попросите пациента <br/>отсканировать код</p>
            {/* Кнопка для быстрого перескока в демо-режиме */}
            <a 
              href={qrUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="mt-6 inline-block w-full bg-slate-800 hover:bg-slate-900 text-white font-medium py-3 rounded-xl transition-all text-sm"
            >
              Перейти к Пациенту (Демо)
            </a>
          </div>
        )}

        {status === 'verified' && (
          <div className="text-center py-8 animate-bounce">
            <CheckCircle size={64} className="text-green-500 mx-auto mb-4" />
            <p className="text-xl font-bold text-slate-900">Визит подтвержден</p>
            <p className="text-slate-500">Запись защищена криптографией</p>
            <button
               onClick={() => setStatus('idle')}
               className="mt-6 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-sm font-medium text-slate-700 cursor-pointer"
            >
              Следующий пациент
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
