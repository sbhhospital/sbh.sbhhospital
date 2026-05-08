import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    User, Briefcase, Phone, Mail, Calendar, 
    ShieldCheck, CheckCircle, Loader2, UserPlus, 
    Sparkles, XCircle, Send, Fingerprint, Activity, Info,
    CalendarCheck, Award, X, Heart, Building2, Shield,
    UserCheck, Stethoscope, AlertCircle
} from 'lucide-react';

const SMILE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyHNF4Yzqvh6Copcl2aL1XyWZEyBSeoaxXz277xFbkPOqPOB-Fy7tNzDpMmFimHf2kGyg/exec';

const SuccessPopup = ({ onClose }) => (
    <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        className="fixed inset-0 z-[500] bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-4"
    >
        <motion.div 
            initial={{ scale: 0.9, opacity: 0 }} 
            animate={{ scale: 1, opacity: 1 }} 
            className="bg-white rounded-[3rem] p-8 md:p-12 text-center max-w-md w-full shadow-[0_32px_64px_-16px_rgba(0,0,0,0.2)] border border-emerald-50 relative overflow-hidden"
        >
            <div className="absolute top-0 left-0 w-full h-1.5 bg-emerald-500" />
            <div className="w-24 h-24 bg-gradient-to-br from-emerald-500 to-teal-400 rounded-3xl flex items-center justify-center text-white mx-auto mb-8 shadow-xl shadow-emerald-100 rotate-6">
                <UserCheck size={48} strokeWidth={2.5} />
            </div>
            <h2 className="text-3xl font-black text-slate-800 uppercase tracking-tighter mb-4">Registration <span className="text-emerald-600">Active</span></h2>
            <p className="text-slate-400 font-bold mb-10 uppercase text-[10px] tracking-[0.2em] leading-relaxed">
                Your professional credentials have been successfully integrated into the SBH Central Roster.
            </p>
            <button 
                onClick={onClose} 
                className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-emerald-600 transition-all shadow-xl active:scale-95"
            >
                Complete Protocol
            </button>
        </motion.div>
    </motion.div>
);

const PremiumLoader = ({ step }) => {
    const loadingMessages = [
        "Initializing Roster Node...",
        "Encrypting Credentials...",
        "Authenticating with SBH Core...",
        "Finalizing Data Handshake..."
    ];
    return (
        <div className="fixed inset-0 z-[600] bg-white flex flex-col items-center justify-center p-10">
            <div className="relative mb-10">
                <motion.div 
                    animate={{ rotate: 360 }} 
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="w-32 h-32 border-[6px] border-slate-50 border-t-emerald-500 rounded-full" 
                />
                <div className="absolute inset-0 flex items-center justify-center">
                    <Activity className="text-slate-900 animate-pulse" size={32} />
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center animate-bounce">
                    <ShieldCheck size={16} className="text-emerald-600" />
                </div>
            </div>
            <div className="text-center space-y-3">
                <div className="flex items-center justify-center gap-2 mb-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] font-black text-slate-900 uppercase tracking-[0.3em]">System Sync</span>
                </div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] h-4">{loadingMessages[step]}</p>
                <div className="w-48 h-1 bg-slate-100 rounded-full mx-auto overflow-hidden mt-6">
                    <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${(step + 1) * 25}%` }}
                        className="h-full bg-emerald-500" 
                    />
                </div>
            </div>
        </div>
    );
};

const StaffRegistrationForm = () => {
    const [formData, setFormData] = useState({ name: '', mobile: '', email: '', birthday: '', department: '', role: '', doj: '', dol: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [loading, setLoading] = useState(true);
    const [loadingStep, setLoadingStep] = useState(0);
    const [error, setError] = useState(null);

    useEffect(() => {
        const interval = setInterval(() => setLoadingStep(prev => (prev + 1) % 4), 800);
        const timer = setTimeout(() => setLoading(false), 2000);
        return () => { clearInterval(interval); clearTimeout(timer); };
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);
        try {
            await fetch(SMILE_SCRIPT_URL, {
                method: 'POST',
                mode: 'no-cors',
                headers: { 'Content-Type': 'text/plain' },
                body: JSON.stringify({ action: 'add_staff', ...formData, anniversary: formData.doj })
            });
            setTimeout(() => setShowSuccess(true), 800);
        } catch (err) { setError("Network error. Please retry."); }
        finally { setIsSubmitting(false); }
    };

    if (loading) return <PremiumLoader step={loadingStep} />;

    return (
        <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center py-10 px-4 md:py-20 font-sans">
            <AnimatePresence>
                {showSuccess && <SuccessPopup onClose={() => window.location.reload()} />}
            </AnimatePresence>
            
            {/* Header Branding */}
            <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-xl flex flex-col items-center mb-16 text-center"
            >
                <img src="/logo.png" alt="SBH Logo" className="h-16 md:h-24 object-contain mb-6" />
                <div className="inline-flex items-center gap-3 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-full text-[9px] font-black uppercase tracking-[0.3em] mb-6 shadow-lg shadow-emerald-100">
                    <ShieldCheck size={16} /> Secure Onboarding Portal
                </div>
                <h1 className="text-4xl md:text-5xl font-black text-slate-800 tracking-tighter uppercase mb-4 leading-none">
                    Professional <span className="bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent underline decoration-orange-400 underline-offset-8">Roster</span>
                </h1>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Enter specialist credentials for system integration</p>
            </motion.div>

            <div className="max-w-3xl w-full mx-auto px-4 mb-20">
                <motion.div 
                    initial={{ opacity: 0, y: 30 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    className="bg-white rounded-[3.5rem] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.08)] p-8 md:p-14 border border-slate-50 relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-50/50 rounded-bl-full -mr-20 -mt-20 z-0 animate-pulse" />
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-orange-50/50 rounded-tr-full -ml-16 -mb-16 z-0" />
                    
                    <form onSubmit={handleSubmit} className="relative z-10 space-y-10">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <InputField 
                                label="Specialist Name" 
                                icon={<User size={18} className="text-emerald-500" />} 
                                placeholder="Full Legal Name" 
                                value={formData.name} 
                                onChange={v => setFormData({...formData, name: v})} 
                                required 
                            />
                            <InputField 
                                label="WhatsApp Contact" 
                                icon={<Phone size={18} className="text-orange-500" />} 
                                placeholder="+91 00000 00000" 
                                value={formData.mobile} 
                                onChange={v => setFormData({...formData, mobile: v})} 
                                required 
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <InputField 
                                label="Official Department" 
                                icon={<Building2 size={18} className="text-slate-400" />} 
                                placeholder="e.g. Ophthalmology" 
                                value={formData.department} 
                                onChange={v => setFormData({...formData, department: v})} 
                                required 
                            />
                            <InputField 
                                label="Professional Role" 
                                icon={<Briefcase size={18} className="text-slate-400" />} 
                                placeholder="e.g. Senior Nurse" 
                                value={formData.role} 
                                onChange={v => setFormData({...formData, role: v})} 
                                required 
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <InputField 
                                label="Date of Birth" 
                                icon={<Calendar size={18} className="text-slate-400" />} 
                                type="date" 
                                value={formData.birthday} 
                                onChange={v => setFormData({...formData, birthday: v})} 
                                required 
                            />
                            <InputField 
                                label="Joining Date" 
                                icon={<CalendarCheck size={18} className="text-slate-400" />} 
                                type="date" 
                                value={formData.doj} 
                                onChange={v => setFormData({...formData, doj: v})} 
                                required 
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-slate-50">
                            <InputField 
                                label="Email ID (Internal)" 
                                icon={<Mail size={18} className="text-slate-400" />} 
                                placeholder="name@sbh.com" 
                                type="email" 
                                value={formData.email} 
                                onChange={v => setFormData({...formData, email: v})} 
                            />
                            <InputField 
                                label="System Exit Date" 
                                icon={<XCircle size={18} className="text-slate-400" />} 
                                type="date" 
                                value={formData.dol} 
                                onChange={v => setFormData({...formData, dol: v})} 
                            />
                        </div>

                        {error && (
                            <motion.div 
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 text-rose-600"
                            >
                                <AlertCircle size={18} />
                                <p className="text-[10px] font-black uppercase tracking-widest">{error}</p>
                            </motion.div>
                        )}

                        <div className="pt-6">
                            <motion.button 
                                whileHover={{ scale: 1.02, y: -2 }}
                                whileTap={{ scale: 0.98 }}
                                type="submit" 
                                disabled={isSubmitting} 
                                className="w-full bg-slate-950 text-white py-6 rounded-[2rem] font-black uppercase tracking-[0.4em] text-xs shadow-2xl shadow-slate-300 flex items-center justify-center gap-4 hover:bg-emerald-600 transition-all disabled:opacity-50"
                            >
                                {isSubmitting ? <><Loader2 className="animate-spin" size={20} /> Processing Node...</> : <><Send size={20} /> Initialize Onboarding</>}
                            </motion.button>
                        </div>
                    </form>
                </motion.div>
                
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="mt-12 flex items-center justify-center gap-4 text-slate-300"
                >
                    <Fingerprint size={20} />
                    <p className="text-[9px] font-black uppercase tracking-[0.2em]">End-to-End Encrypted Roster Protocol</p>
                </motion.div>
            </div>
        </div>
    );
};

const InputField = ({ label, icon, placeholder, value, onChange, type = "text", required }) => (
    <div className="space-y-3">
        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-2 flex items-center gap-2">
            {icon} {label} {required && <span className="text-orange-500">*</span>}
        </label>
        <div className="relative group">
            <input 
                type={type} 
                className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl py-5 px-6 text-slate-800 font-black text-sm outline-none focus:bg-white focus:border-emerald-500/20 focus:ring-8 focus:ring-emerald-500/5 transition-all" 
                placeholder={placeholder} 
                value={value} 
                onChange={e => onChange(e.target.value)} 
                required={required} 
            />
        </div>
    </div>
);

export default StaffRegistrationForm;
