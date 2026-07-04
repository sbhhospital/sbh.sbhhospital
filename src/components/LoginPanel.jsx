import React, { useState, useEffect } from 'react';
import { Shield, Lock, CheckCircle2, AlertCircle, ChevronDown, UserCircle, Hospital } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Footer from './Footer';

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

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsVerifying(true);
    if (!isCaptchaCorrect) {
        setError('Security Captcha Incorrect');
        setIsVerifying(false);
        return;
    }
    setError('');

    // Simulate ultra-fast secure check
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
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6 overflow-hidden font-sans relative">
      {/* Subtle Background Decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[10%] right-[10%] w-[40rem] h-[40rem] bg-emerald-500/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-[10%] left-[10%] w-[40rem] h-[40rem] bg-orange-500/5 blur-[120px] rounded-full" />
      </div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="w-full max-w-md bg-white rounded-[2.5rem] p-8 md:p-10 shadow-[0_32px_80px_rgba(15,23,42,0.08)] border border-slate-100 relative z-10"
      >
        <div className="flex flex-col items-center mb-8">
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="w-14 h-14 bg-emerald-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-emerald-100 mb-6"
          >
            <Hospital className="w-7 h-7" />
          </motion.div>
          <div className="text-center space-y-1.5">
            <h1 className="text-xl font-black tracking-tighter text-slate-800 uppercase">
              Secure <span className="text-emerald-600">Access</span>
            </h1>
            <p className="text-slate-400 text-[9px] font-black tracking-[0.2em] uppercase">
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

        <div className="mt-8 text-center pb-4">
          <p className="text-[8px] text-slate-300 font-black uppercase tracking-[0.4em]">
            SBH Hospital • Managed Terminal
          </p>
        </div>
      </motion.div>
      <Footer />
    </div>
  );
};

export default LoginPanel;
