import React, { useState, useEffect } from 'react';
import { Shield, Lock, CheckCircle2, AlertCircle, ChevronDown, UserCircle, Hospital } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const LoginPanel = ({ onLogin }) => {
  const [username, setUsername] = useState('SBH');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  const users = [
    { name: 'SBH', password: 'Naman@22@12' },
    { name: 'SBH HRD', password: 'Hr@Sbh' },
    { name: 'ACCOUNT', password: 'Acc@Sbh' }
  ];

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsVerifying(true);
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
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6 overflow-hidden font-sans">
      {/* Subtle Background Decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[10%] right-[10%] w-[40rem] h-[40rem] bg-indigo-500/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-[10%] left-[10%] w-[40rem] h-[40rem] bg-cyan-500/5 blur-[120px] rounded-full" />
      </div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="w-full max-w-lg bg-white rounded-[3rem] p-12 shadow-[0_32px_80px_rgba(15,23,42,0.08)] border border-slate-100 relative z-10"
      >
        <div className="flex flex-col items-center mb-12">
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="w-20 h-20 bg-indigo-600 rounded-[2rem] flex items-center justify-center text-white shadow-xl shadow-indigo-100 mb-8"
          >
            <Hospital className="w-10 h-10" />
          </motion.div>
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-black tracking-tighter text-slate-800 uppercase">
              Secure <span className="text-indigo-600">Access</span>
            </h1>
            <p className="text-slate-400 text-sm font-bold tracking-[0.2em] uppercase">
              SBH Hospital Management System 2.0
            </p>
          </div>
        </div>

        <form onSubmit={handleLogin} className="space-y-8">
          <div className="space-y-3">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
              Select Department
            </label>
            <div className="relative group">
              <select
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-5 px-6 appearance-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/50 transition-all outline-none font-bold text-slate-700 cursor-pointer"
              >
                <option value="SBH">Administrator (SBH)</option>
                <option value="SBH HRD">SBH HRD</option>
                <option value="ACCOUNT">Accounts Department</option>
              </select>
              <ChevronDown className="absolute right-6 top-5.5 w-5 h-5 text-slate-300 pointer-events-none group-hover:text-indigo-500 transition-colors" />
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
              Authentication Key
            </label>
            <div className="relative group">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-5 px-6 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/50 transition-all outline-none placeholder:text-slate-200 font-mono text-slate-700"
                required
              />
              <Lock className="absolute right-6 top-5.5 w-5 h-5 text-slate-300 group-focus-within:text-indigo-500 transition-colors" />
            </div>
          </div>

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="flex items-center gap-3 p-5 bg-rose-50 border border-rose-100 rounded-2xl text-rose-600 text-xs font-black uppercase tracking-widest"
              >
                <AlertCircle className="w-5 h-5" />
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <button
            type="submit"
            disabled={isVerifying}
            className="w-full py-6 bg-slate-900 text-white rounded-[2rem] font-black uppercase tracking-[0.2em] text-xs shadow-2xl shadow-slate-200 hover:bg-indigo-600 hover:shadow-indigo-100 transition-all active:scale-95 flex items-center justify-center gap-3 disabled:bg-slate-200 disabled:shadow-none"
          >
            {isVerifying ? (
              <div className="w-6 h-6 border-[3px] border-white/20 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5" />
                Establish Secure Session
              </>
            )}
          </button>
        </form>

        <div className="mt-12 text-center">
          <p className="text-[9px] text-slate-300 font-black uppercase tracking-[0.4em]">
            SBH Hospital • Managed Endpoint
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginPanel;
