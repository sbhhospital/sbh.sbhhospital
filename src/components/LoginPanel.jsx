import React, { useState, useEffect } from 'react';
import { Shield, Lock, CheckCircle2, AlertCircle, ChevronDown, UserCircle, Hospital, QrCode, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const LoginPanel = ({ onLogin }) => {
  const [username, setUsername] = useState('SBH');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [captchaVerified, setCaptchaVerified] = useState(false);

  const [nums] = useState(() => ({ a: Math.floor(Math.random() * 10), b: Math.floor(Math.random() * 10) }));
  const [captchaInput, setCaptchaInput] = useState('');

  const isCaptchaCorrect = parseInt(captchaInput) === (nums.a + nums.b);

  const users = [
    { name: 'SBH', password: 'Naman@22@12' },
    { name: 'SBH HRD', password: 'Hr@Sbh' },
    { name: 'ACCOUNT', password: 'Acc@Sbh' },
    { name: 'Lab', password: 'L@B#123' }
  ];

  const publicForms = [
    { id: 'smile', label: 'Smile Award', sub: 'Staff Recognition', type: 'smile_award', color: 'border-emerald-100 hover:border-emerald-200 text-emerald-600', btnColor: 'bg-emerald-600 shadow-emerald-600/10 hover:bg-emerald-500' },
    { id: 'lasik', label: 'Lasik Feedback', sub: 'Patient Experience', type: 'lasik', color: 'border-orange-100 hover:border-orange-200 text-orange-600', btnColor: 'bg-orange-600 shadow-orange-600/10 hover:bg-orange-500' },
    { id: 'staff', label: 'Staff Roster', sub: 'Roster Onboarding', type: 'register', color: 'border-slate-150 hover:border-slate-350 text-slate-900', btnColor: 'bg-slate-900 shadow-slate-900/10 hover:bg-slate-800' },
    { id: 'leave', label: 'Senior Leave', sub: 'Leave Notification', type: 'leave', color: 'border-amber-100 hover:border-amber-200 text-amber-600', btnColor: 'bg-amber-600 shadow-amber-600/10 hover:bg-amber-500' }
  ];

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsVerifying(true);
    if (!isCaptchaCorrect) {
        setError('Security Captcha Incorrect');
        setIsVerifying(false);
        return;
    }
    setError('');

    // Simulate ultra-fast check
    await new Promise(resolve => setTimeout(resolve, 600));

    const user = users.find(u => u.name === username);
    if (user && password.trim() === user.password) {
      localStorage.setItem('auth_user', username);
      onLogin(username);
    } else {
      setError('Invalid Authentication Key');
    }
    setIsVerifying(false);
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row items-center justify-center bg-[#050505] p-6 lg:p-12 overflow-x-hidden font-sans relative gap-8 lg:gap-12">
      {/* Subtle Background Decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[10%] right-[10%] w-[40rem] h-[40rem] bg-emerald-500/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-[10%] left-[10%] w-[40rem] h-[40rem] bg-orange-500/5 blur-[120px] rounded-full" />
      </div>

      {/* Login Card Panel */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="w-full max-w-md bg-white rounded-[2.5rem] p-8 md:p-10 shadow-[0_32px_80px_rgba(15,23,42,0.08)] border border-slate-100 relative z-10 shrink-0"
      >
        <div className="flex flex-col items-center mb-8">
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="w-full max-w-[280px] h-20 flex items-center justify-center mb-6"
          >
            <img src="/sbh_logo.png" alt="SBH Group of Hospitals" className="w-full h-full object-contain" />
          </motion.div>
          <div className="text-center space-y-1.5">
            <h1 className="text-[11px] font-black tracking-widest text-slate-800 uppercase">
              Secure <span className="text-emerald-600">Access Portal</span>
            </h1>
            <p className="text-slate-400 text-[8px] font-black tracking-[0.2em] uppercase">
              SBH Hospital Management System 2.0
            </p>
          </div>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2.5">
            <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">
              Select Department
            </label>
            <div className="relative group">
              <select
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3.5 px-5 appearance-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500/50 transition-all outline-none font-bold text-[11px] text-slate-700 cursor-pointer"
              >
                <option value="SBH">Administrator (SBH)</option>
                <option value="SBH HRD">SBH HRD</option>
                <option value="ACCOUNT">Accounts Department</option>
                <option value="Lab">Laboratory Department</option>
              </select>
              <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 pointer-events-none group-hover:text-emerald-500 transition-colors" />
            </div>
          </div>

          <div className="space-y-2.5">
            <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">
              Authentication Key
            </label>
            <div className="relative group">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3.5 px-5 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500/50 transition-all outline-none placeholder:text-slate-200 font-mono text-[11px] text-slate-700"
                required
              />
               <Lock className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-emerald-500 transition-colors" />
            </div>
          </div>

          <div className="space-y-2.5">
            <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">
              Security Verification: {nums.a} + {nums.b} = ?
            </label>
            <div className="relative group">
              <input
                type="number"
                value={captchaInput}
                onChange={(e) => setCaptchaInput(e.target.value)}
                placeholder="Answer"
                className={`w-full bg-slate-50 border rounded-xl py-3.5 px-5 transition-all outline-none font-bold text-[11px] text-slate-700 ${isCaptchaCorrect ? 'border-emerald-500 bg-emerald-50' : 'border-slate-100'}`}
                required
              />
            </div>
          </div>

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="flex items-center gap-2.5 p-4 bg-rose-50 border border-rose-100 rounded-xl text-rose-600 text-[9px] font-black uppercase tracking-widest"
              >
                <AlertCircle className="w-4 h-4" />
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <button
            type="submit"
            disabled={isVerifying}
            className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] shadow-2xl shadow-slate-200 hover:bg-emerald-600 hover:shadow-emerald-100 transition-all active:scale-95 flex items-center justify-center gap-2.5 disabled:bg-slate-200 disabled:shadow-none"
          >
            {isVerifying ? (
              <div className="w-5 h-5 border-[3px] border-white/20 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                Establish Secure Session
              </>
            )}
          </button>
        </form>

        <div className="mt-8 text-center pb-2">
          <p className="text-[8px] text-slate-300 font-black uppercase tracking-[0.4em]">
            SBH Hospital • Managed Terminal
          </p>
        </div>
      </motion.div>

      {/* Public Forms Panel */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.15 }}
        className="w-full max-w-3xl bg-white rounded-[2.5rem] p-8 md:p-10 shadow-[0_32px_80px_rgba(15,23,42,0.08)] border border-slate-100 relative z-10 flex flex-col"
      >
        <div className="mb-8 flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-orange-600/10 flex items-center justify-center text-orange-600">
            <QrCode className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xs font-black tracking-widest text-slate-800 uppercase">
              Public Access Portals
            </h2>
            <p className="text-slate-400 text-[8px] font-black tracking-[0.15em] uppercase mt-0.5">
              Bina Login Kiye Bharein • Scan QR or Click to Fill
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {publicForms.map((form) => {
            const finalUrl = `${window.location.origin}/?type=${form.type}`;
            const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(finalUrl)}`;
            
            return (
              <div 
                key={form.id}
                className="p-6 rounded-[2rem] border border-slate-100 bg-slate-50/35 flex items-center gap-5 transition-all hover:bg-white hover:shadow-xl group"
              >
                {/* QR Code Container */}
                <div className="w-24 h-24 bg-white p-2 rounded-2xl shadow-inner border border-slate-100 shrink-0 flex items-center justify-center">
                  <img 
                    src={qrImageUrl} 
                    alt={form.label} 
                    className="w-full h-full object-contain"
                  />
                </div>

                {/* Form Details */}
                <div className="flex-1 min-w-0 flex flex-col justify-between h-24 py-1">
                  <div>
                    <h3 className="text-xs font-black uppercase text-slate-800 leading-tight">
                      {form.label}
                    </h3>
                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                      {form.sub}
                    </p>
                  </div>
                  
                  <a
                    href={finalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`w-full py-2.5 px-4 rounded-xl text-[9px] font-black uppercase tracking-wider text-white text-center flex items-center justify-center gap-1.5 transition-all active:scale-[0.98] shadow-md ${form.btnColor}`}
                  >
                    <ExternalLink size={10} /> Fill Form
                  </a>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-8 text-center pt-2 border-t border-slate-50">
          <p className="text-[8px] text-slate-300 font-black uppercase tracking-[0.4em]">
            Developed By SBH Group Of Hospitals
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginPanel;
