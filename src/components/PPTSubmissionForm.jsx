import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Presentation, Send, CheckCircle, Loader2, 
    Calendar, User, Building2, Link as LinkIcon,
    AlertCircle, Fingerprint, ShieldCheck, CheckCircle2,
    Clock, Tag, Hash, Sparkles
} from 'lucide-react';

const SuccessModal = ({ isOpen, onClose, title, message }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-white rounded-[2.5rem] p-10 max-w-sm w-full text-center shadow-2xl border border-slate-100 relative overflow-hidden"
            >
                <div className="absolute top-0 inset-x-0 h-2 bg-emerald-500"></div>
                <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-white shadow-lg">
                    <CheckCircle strokeWidth={3} size={40} />
                </div>
                <h3 className="text-xl font-black text-slate-900 mb-1 tracking-tight uppercase">{title}</h3>
                <p className="text-[11px] font-medium text-slate-500 mb-8 leading-relaxed px-2">
                    {message}
                </p>
                <button
                    onClick={onClose}
                    className="w-full bg-slate-900 hover:bg-emerald-600 text-white text-[10px] font-black py-4 rounded-2xl transition-all active:scale-[0.98] tracking-widest uppercase shadow-xl"
                >
                    Dismiss Protocol
                </button>
            </motion.div>
        </div>
    );
};

const MathCaptcha = ({ onVerify }) => {
    const [nums, setNums] = useState(() => ({ a: Math.floor(Math.random() * 10), b: Math.floor(Math.random() * 10) }));
    const [input, setInput] = useState('');
    const [verified, setVerified] = useState(false);

    const check = (val) => {
        setInput(val);
        if (parseInt(val) === (nums.a + nums.b)) {
            setVerified(true);
            onVerify(true);
        } else {
            setVerified(false);
            onVerify(false);
        }
    };

    return (
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center border border-slate-200 shadow-sm">
                    <Fingerprint size={14} className="text-slate-400" />
                </div>
                <p className="text-[10px] font-black text-slate-800 uppercase tracking-widest">
                    Security Check: {nums.a} + {nums.b} = ?
                </p>
            </div>
            <input 
                type="number"
                value={input}
                onChange={(e) => check(e.target.value)}
                placeholder="?"
                className={`w-16 px-3 py-2 rounded-xl font-black text-xs outline-none transition-all border-2 ${verified ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-transparent bg-white text-slate-900 focus:border-orange-500/20'}`}
            />
        </div>
    );
};

const PPTSubmissionForm = ({ scriptUrl, prefillData = {} }) => {
    const [formData, setFormData] = useState({
        staff_id: prefillData.id || '',
        month: prefillData.month || '',
        ppt_link: '',
        confirmed: false
    });
    const [submissionStatus, setSubmissionStatus] = useState(null); // { isSubmitted: bool, submission: obj, leader: obj }
    const [checkingStatus, setCheckingStatus] = useState(true);
    const [loading, setLoading] = useState(false);
    const [isVerified, setIsVerified] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    useEffect(() => {
        const checkStatus = async () => {
            if (!formData.staff_id || !formData.month) {
                setCheckingStatus(false);
                return;
            }
            try {
                const r = await fetch(`${scriptUrl}?action=check_status&id=${formData.staff_id}&month=${encodeURIComponent(formData.month)}`);
                const res = await r.json();
                setSubmissionStatus(res);
                if (res.isSubmitted) {
                    setFormData(prev => ({ ...prev, ppt_link: res.submission.ppt_link }));
                }
            } catch (e) {
                console.error("Status check error:", e);
            } finally {
                setCheckingStatus(false);
            }
        };
        checkStatus();
    }, [formData.staff_id, formData.month, scriptUrl]);

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        if (!isVerified) return alert("Security Verification Failed!");
        if (!formData.confirmed) return alert("Please confirm your submission via the checkbox.");

        setLoading(true);
        try {
            await fetch(scriptUrl, {
                method: 'POST',
                mode: 'no-cors',
                headers: { 'Content-Type': 'text/plain' },
                body: JSON.stringify({
                    action: 'save_submission',
                    ...formData
                })
            });
            setShowSuccess(true);
        } catch (err) {
            alert("Connection to Central Roster failed.");
        } finally {
            setLoading(false);
        }
    };

    if (checkingStatus) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
                <div className="relative">
                    <div className="w-20 h-20 border-4 border-slate-100 rounded-full animate-spin border-t-orange-600"></div>
                    <Presentation className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-orange-600" size={32} />
                </div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] animate-pulse">Checking Protocol Status...</p>
            </div>
        );
    }

    const leader = submissionStatus?.leader;
    const isSubmitted = submissionStatus?.isSubmitted;
    const submission = submissionStatus?.submission;

    return (
        <div className="max-w-xl mx-auto py-12 px-4">
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-[3.5rem] border border-slate-100 shadow-2xl overflow-hidden relative"
            >
                {/* Brand Header */}
                <div className="bg-slate-900 p-12 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-orange-600/10 rounded-full -mr-32 -mt-32 blur-3xl" />
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-500/5 rounded-full -ml-24 -mb-24 blur-3xl" />
                    
                    <div className="flex flex-col items-center text-center relative z-10">
                        <motion.div 
                            initial={{ scale: 0.8 }}
                            animate={{ scale: 1 }}
                            className="w-24 h-24 bg-white p-1 rounded-3xl mb-8 shadow-2xl border-4 border-white/10"
                        >
                            <img src="publiclogo.jpg" alt="SBH Logo" className="w-full h-full object-cover rounded-[1.2rem]" />
                        </motion.div>
                        <h1 className="text-3xl font-black tracking-tighter uppercase leading-none">
                            PPT <span className="text-orange-500">Protocol</span>
                        </h1>
                        <div className="flex items-center gap-2 mt-3 px-4 py-1.5 bg-white/5 rounded-full border border-white/10">
                            <ShieldCheck size={12} className="text-emerald-500" />
                            <p className="text-[8px] font-black text-white/60 uppercase tracking-[0.2em]">Official Compliance Gateway v3.2</p>
                        </div>
                    </div>
                </div>

                <div className="p-10 md:p-14 space-y-10">
                    {/* Identification Header */}
                    {leader && (
                        <div className="flex items-center gap-6 p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 relative group">
                            <div className="w-16 h-16 bg-white text-slate-800 rounded-2xl flex items-center justify-center font-black text-2xl shadow-xl border border-slate-100">
                                {leader.name?.[0]}
                            </div>
                            <div className="flex-1">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-2">
                                    <Sparkles size={12} className="text-orange-500" /> Authorized Leader Profile
                                </p>
                                <h2 className="text-xl font-black text-slate-900 leading-none uppercase mb-2">{leader.name}</h2>
                                <div className="flex flex-wrap items-center gap-3">
                                    <span className="text-[9px] font-bold text-orange-600 uppercase tracking-widest bg-orange-50 px-3 py-1 rounded-full border border-orange-100">{leader.ppt_type || 'General PPT'}</span>
                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{leader.department}</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* SUBMISSION CONTENT */}
                    <AnimatePresence mode="wait">
                        {isSubmitted ? (
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="space-y-8"
                            >
                                <div className="p-10 bg-emerald-50/50 rounded-[3rem] border-2 border-emerald-100 text-center relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-6 opacity-10 text-emerald-600"><CheckCircle2 size={80} /></div>
                                    <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                                        <CheckCircle2 size={40} />
                                    </div>
                                    <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-2">Submission Synchronized</h3>
                                    <p className="text-[11px] font-medium text-slate-500 leading-relaxed max-w-xs mx-auto mb-8">
                                        Your {leader?.ppt_type || 'PPT'} for {formData.month} was successfully logged.
                                    </p>
                                    
                                    <div className="grid grid-cols-2 gap-4 text-left">
                                        <div className="p-5 bg-white rounded-2xl border border-emerald-100">
                                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Status</p>
                                            <p className="text-[10px] font-black text-emerald-600 uppercase">Confirmed ✅</p>
                                        </div>
                                        <div className="p-5 bg-white rounded-2xl border border-emerald-100">
                                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Entry Date</p>
                                            <p className="text-[10px] font-black text-slate-800 uppercase">
                                                {new Date(submission.submitted_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                
                                {submission.ppt_link && submission.ppt_link !== 'Portal Confirmation' && (
                                    <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <LinkIcon size={16} className="text-slate-400" />
                                            <span className="text-[10px] font-black text-slate-800 uppercase tracking-tight">Access Link Provided</span>
                                        </div>
                                        <a href={submission.ppt_link} target="_blank" rel="noreferrer" className="text-[9px] font-black text-orange-600 uppercase tracking-widest hover:underline">View File ↗</a>
                                    </div>
                                )}
                            </motion.div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-10">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2 flex items-center gap-2">
                                            <Hash size={12} className="text-orange-500" /> Node ID
                                        </label>
                                        <input 
                                            readOnly
                                            value={formData.staff_id}
                                            className="w-full px-6 py-5 bg-slate-50 border border-slate-100 rounded-3xl font-black text-slate-400 text-sm outline-none cursor-not-allowed uppercase tracking-widest"
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2 flex items-center gap-2">
                                            <Calendar size={12} className="text-orange-500" /> Target Cycle
                                        </label>
                                        <input 
                                            readOnly
                                            value={formData.month}
                                            className="w-full px-6 py-5 bg-slate-50 border border-slate-100 rounded-3xl font-black text-slate-400 text-sm outline-none cursor-not-allowed uppercase tracking-widest"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2 flex items-center gap-2">
                                        <LinkIcon size={12} className="text-orange-500" /> Submission Link (Optional)
                                    </label>
                                    <input 
                                        type="url"
                                        placeholder="Drive / OneDrive / Portal Link"
                                        value={formData.ppt_link}
                                        onChange={e => setFormData({...formData, ppt_link: e.target.value})}
                                        className="w-full px-6 py-5 bg-slate-50 border border-slate-100 rounded-3xl font-black text-slate-900 text-sm outline-none focus:bg-white focus:border-orange-500 focus:shadow-xl focus:shadow-orange-500/5 transition-all uppercase tracking-tight placeholder:text-slate-300"
                                    />
                                </div>

                                <div className="p-8 bg-orange-50/50 rounded-[2.5rem] border-2 border-orange-100/50 space-y-6">
                                    <div className="flex items-start gap-4">
                                        <div className="relative pt-1">
                                            <input 
                                                type="checkbox"
                                                id="confirm"
                                                checked={formData.confirmed}
                                                onChange={e => setFormData({...formData, confirmed: e.target.checked})}
                                                className="w-6 h-6 rounded-xl border-2 border-orange-200 text-orange-600 focus:ring-orange-500 transition-all cursor-pointer"
                                            />
                                        </div>
                                        <label htmlFor="confirm" className="text-[11px] font-black text-slate-800 uppercase leading-relaxed tracking-tight cursor-pointer">
                                            I solemnly confirm that my *{leader?.ppt_type || 'PPT'}* for {formData.month} has been finalized and submitted for management review.
                                        </label>
                                    </div>
                                </div>

                                <MathCaptcha onVerify={setIsVerified} />

                                <motion.button 
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    disabled={loading || !isVerified || !formData.confirmed} 
                                    type="submit"
                                    className="w-full py-6 bg-slate-900 text-white text-xs font-black rounded-[2rem] shadow-2xl flex items-center justify-center gap-4 uppercase tracking-[0.3em] hover:bg-orange-600 transition-all disabled:opacity-30 disabled:cursor-not-allowed group"
                                >
                                    {loading ? (
                                        <Loader2 size={20} className="animate-spin" />
                                    ) : (
                                        <>
                                            <ShieldCheck size={20} className="text-orange-500 group-hover:text-white transition-colors" /> 
                                            Finalize Protocol
                                        </>
                                    )}
                                </motion.button>
                            </form>
                        )}
                    </AnimatePresence>
                </div>
                
                {/* Footer Status */}
                <div className="bg-slate-50 p-8 flex items-center justify-center border-t border-slate-100">
                    <p className="text-[8px] font-black text-slate-300 uppercase tracking-[0.5em] flex items-center gap-3">
                        SBH Infrastructure <span className="w-1.5 h-1.5 rounded-full bg-slate-200" /> Management Core
                    </p>
                </div>
            </motion.div>

            <SuccessModal 
                isOpen={showSuccess} 
                onClose={() => window.location.reload()}
                title="System Synchronized"
                message={`Your ${leader?.ppt_type || 'PPT'} submission for ${formData.month} has been successfully recorded in the central roster.`}
            />
        </div>
    );
};

export default PPTSubmissionForm;
