import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    User, Briefcase, Phone, Mail, Calendar, 
    ShieldCheck, CheckCircle, Loader2, UserPlus, 
    Sparkles, XCircle, Send, Fingerprint, Activity, Info,
    CalendarCheck, Award
} from 'lucide-react';

const SMILE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyHNF4Yzqvh6Copcl2aL1XyWZEyBSeoaxXz277xFbkPOqPOB-Fy7tNzDpMmFimHf2kGyg/exec';

const SuccessPopup = () => (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[300] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-6">
        <motion.div initial={{ scale: 0.8, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.8, y: 20 }} className="bg-white rounded-[3.5rem] p-10 md:p-14 text-center max-w-lg w-full shadow-2xl border border-blue-50 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-blue-500" />
            <div className="w-24 h-24 bg-blue-500 text-white rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-xl shadow-blue-100 rotate-6"><CheckCircle size={48} strokeWidth={2.5} /></div>
            <h2 className="text-4xl font-black text-slate-800 uppercase tracking-tighter mb-2">Registration <span className="text-blue-600">Complete!</span></h2>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-full text-[10px] font-black uppercase tracking-widest mb-6 border border-blue-100">
                <Fingerprint size={12}/> Profile Synchronized Successfully
            </div>
            <p className="text-slate-400 font-bold mb-10 uppercase text-[10px] tracking-[0.2em] leading-relaxed">Your professional profile has been securely added to the hospital's central roster.</p>
            <button onClick={() => window.location.reload()} className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-blue-600 transition-all shadow-xl shadow-slate-200">Done & Finish</button>
        </motion.div>
    </motion.div>
);

const StaffRegistrationForm = () => {
    const [formData, setFormData] = useState({ 
        name: '', 
        mobile: '', 
        email: '', 
        birthday: '', 
        department: '', 
        role: '',
        doj: '', 
        dol: '' 
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [loading, setLoading] = useState(true);
    const [loadingStep, setLoadingStep] = useState(0);
    const [error, setError] = useState(null);

    const loadingMessages = ["Initializing roster sync...", "Encrypting staff data portal...", "Verifying SBH protocols...", "Loading registration interface..."];

    useEffect(() => {
        const interval = setInterval(() => setLoadingStep(prev => (prev + 1) % loadingMessages.length), 1200);
        const timer = setTimeout(() => setLoading(false), 2500);
        return () => { clearInterval(interval); clearTimeout(timer); };
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);
        try {
            // Mapping fields to match the Staff Roster columns
            const payload = {
                action: 'add_staff',
                staffId: '', 
                name: formData.name,
                mobile: formData.mobile,
                email: formData.email,
                birthday: formData.birthday,
                anniversary: formData.doj, 
                department: formData.department,
                role: formData.role,
                dol: formData.dol, 
                doj: formData.doj 
            };

            await fetch(SMILE_SCRIPT_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain' },
                body: JSON.stringify(payload)
            });
            
            setTimeout(() => setShowSuccess(true), 1500);
        } catch (err) { 
            console.error(err);
            setError("Submission sent. Please refresh to check."); 
        }
        finally { setIsSubmitting(false); }
    };

    if (loading) return (
        <div className="fixed inset-0 z-[200] bg-white flex flex-col items-center justify-center p-10">
            <div className="relative mb-12"><motion.div animate={{ rotate: 360 }} transition={{ duration: 4, repeat: Infinity, ease: "linear" }} className="w-40 h-40 border-4 border-slate-50 border-t-blue-500 rounded-full" /><div className="absolute inset-0 flex items-center justify-center"><Activity className="text-slate-900 animate-pulse" size={40} /></div></div>
            <div className="text-center space-y-4 max-w-sm"><h3 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">System <span className="text-blue-600">Onboarding</span></h3><AnimatePresence mode="wait"><motion.p key={loadingStep} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] leading-relaxed">{loadingMessages[loadingStep]}</motion.p></AnimatePresence></div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#F8FAFC] py-10 md:py-20 px-4 flex items-center justify-center">
            <AnimatePresence>{showSuccess && <SuccessPopup />}</AnimatePresence>
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-[3.5rem] shadow-2xl p-8 md:p-14 border border-slate-50 max-w-3xl w-full relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50/50 rounded-bl-full -mr-20 -mt-20 -z-10 animate-pulse" />
                
                <div className="relative z-10 text-center mb-14">
                    <div className="inline-flex items-center gap-3 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-full text-[9px] font-black uppercase tracking-[0.3em] mb-6 shadow-lg shadow-blue-100">
                        <UserPlus size={16} /> Official Staff Registration
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black text-slate-800 tracking-tighter uppercase mb-4 leading-none">
                        Join the <span className="bg-gradient-to-r from-blue-600 to-indigo-500 bg-clip-text text-transparent underline decoration-indigo-200 underline-offset-8">SBH Family</span>
                    </h1>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Enter your professional details for the hospital roster</p>
                </div>

                <form onSubmit={handleSubmit} className="relative z-10 space-y-10">
                    <div className="flex justify-between items-center px-6 py-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <div className="flex items-center gap-3"><Fingerprint className="text-blue-500" size={18}/><span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Profile Identity ID:</span></div>
                        <span className="text-[10px] font-black text-blue-600 tracking-widest uppercase bg-blue-50 px-4 py-2 rounded-full border border-blue-100">Auto-Generated by System</span>
                    </div>

                    {error && <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 text-rose-600"><XCircle size={18} /><p className="text-[10px] font-black uppercase tracking-widest">{error}</p></div>}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <SmileInputField label="Full Name" icon={<User size={18} className="text-blue-500"/>} placeholder="Enter your full name" value={formData.name} onChange={v => setFormData({...formData, name: v})} required />
                        <SmileInputField label="Mobile Number" icon={<Phone size={18} className="text-indigo-500"/>} placeholder="+91 00000 00000" value={formData.mobile} onChange={v => setFormData({...formData, mobile: v})} required />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <SmileInputField label="Department" icon={<Briefcase size={18} className="text-slate-400"/>} placeholder="e.g. Nursing, Front Desk" value={formData.department} onChange={v => setFormData({...formData, department: v})} required />
                        <SmileInputField label="Post / Role" icon={<ShieldCheck size={18} className="text-slate-400"/>} placeholder="e.g. Senior Nurse" value={formData.role} onChange={v => setFormData({...formData, role: v})} required />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <SmileInputField label="Date of Birth" icon={<Calendar size={18} className="text-slate-400"/>} type="date" value={formData.birthday} onChange={v => setFormData({...formData, birthday: v})} required />
                        <SmileInputField label="Date of Joining" icon={<CalendarCheck size={18} className="text-slate-400"/>} type="date" value={formData.doj} onChange={v => setFormData({...formData, doj: v})} required />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-slate-50 pt-10">
                        <SmileInputField label="Email Address (Optional)" icon={<Mail size={18} className="text-slate-400"/>} placeholder="name@sbhhospital.com" type="email" value={formData.email} onChange={v => setFormData({...formData, email: v})} />
                        <SmileInputField label="Date of Leaving (Optional)" icon={<Calendar size={18} className="text-rose-400"/>} type="date" value={formData.dol} onChange={v => setFormData({...formData, dol: v})} />
                    </div>

                    <div className="pt-6">
                        <motion.button type="submit" whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }} disabled={isSubmitting} className="w-full py-6 bg-slate-900 text-white rounded-[2.5rem] font-black uppercase text-xs tracking-[0.4em] hover:bg-blue-600 transition-all shadow-2xl flex items-center justify-center gap-4 shadow-slate-200">
                            {isSubmitting ? <><Loader2 className="animate-spin" size={20} /> Registering...</> : <><Send size={20} /> Register My Profile</>}
                        </motion.button>
                    </div>
                </form>

            </motion.div>
        </div>
    );
};

const SmileInputField = ({ label, icon, placeholder, value, onChange, type = "text", required }) => (
    <div className="space-y-3">
        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-2 flex items-center gap-2">
            {icon} {label} {required && <span className="text-blue-500">*</span>}
        </label>
        <input 
            type={type} 
            className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-5 px-6 text-slate-800 font-black text-sm outline-none transition-all focus:bg-white focus:border-blue-500/30" 
            placeholder={placeholder} 
            value={value} 
            onChange={e => onChange(e.target.value)} 
            required={required} 
        />
    </div>
);

export default StaffRegistrationForm;
