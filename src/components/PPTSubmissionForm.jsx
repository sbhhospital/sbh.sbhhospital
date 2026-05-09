import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
    Presentation, Send, CheckCircle, Loader2, 
    Calendar, User, Building2, Link as LinkIcon,
    AlertCircle, Fingerprint, ShieldCheck
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
    const [leaderData, setLeaderData] = useState(null);
    const [fetchingLeader, setFetchingLeader] = useState(false);
    const [loading, setLoading] = useState(false);
    const [isVerified, setIsVerified] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    useEffect(() => {
        if (formData.staff_id) {
            const fetchLeader = async () => {
                setFetchingLeader(true);
                try {
                    const r = await fetch(`${scriptUrl}?action=get_ppt_data`);
                    const res = await r.json();
                    const leader = res.master.find(m => m.staff_id == formData.staff_id);
                    if (leader) setLeaderData(leader);
                } catch (e) {
                    console.error("Leader fetch error:", e);
                } finally {
                    setFetchingLeader(false);
                }
            };
            fetchLeader();
        }
    }, [formData.staff_id, scriptUrl]);

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

    return (
        <div className="max-w-xl mx-auto py-10 px-4">
            <div className="bg-white rounded-[3rem] border border-slate-100 shadow-2xl overflow-hidden relative">
                {/* Brand Header */}
                <div className="bg-slate-900 p-10 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full -mr-16 -mt-16 blur-2xl" />
                    <div className="flex flex-col items-center text-center relative z-10">
                        <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mb-6 border border-white/20">
                            <Presentation size={32} className="text-orange-500" />
                        </div>
                        <h1 className="text-2xl font-black tracking-tight uppercase">PPT <span className="text-orange-500">Submission</span></h1>
                        <p className="text-[9px] font-bold text-white/40 mt-1 uppercase tracking-[0.3em]">Official Compliance Portal v2.0</p>
                    </div>
                </div>

                <div className="p-10 md:p-12">
                    {/* Identification Card */}
                    {leaderData ? (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-10 p-6 bg-slate-50 rounded-3xl border border-slate-100 flex items-center gap-5">
                            <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-slate-400 border border-slate-100 shadow-sm font-black text-xl">
                                {leaderData.name?.[0]}
                            </div>
                            <div>
                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Authorized Leader</p>
                                <h2 className="text-lg font-black text-slate-900 leading-none uppercase">{leaderData.name}</h2>
                                <p className="text-[9px] font-bold text-orange-600 uppercase tracking-widest mt-1.5">{leaderData.department} • {leaderData.staff_id}</p>
                            </div>
                        </motion.div>
                    ) : fetchingLeader ? (
                        <div className="mb-10 p-6 bg-slate-50 rounded-3xl animate-pulse flex items-center gap-5">
                            <div className="w-14 h-14 bg-slate-200 rounded-2xl"></div>
                            <div className="flex-1 space-y-2">
                                <div className="h-4 bg-slate-200 rounded w-1/2"></div>
                                <div className="h-3 bg-slate-200 rounded w-1/4"></div>
                            </div>
                        </div>
                    ) : null}

                    <form onSubmit={handleSubmit} className="space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Staff ID Node</label>
                                <div className="relative">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                                    <input 
                                        required 
                                        readOnly={!!prefillData.id}
                                        value={formData.staff_id} 
                                        onChange={e => setFormData({...formData, staff_id: e.target.value})} 
                                        className={`w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-900 outline-none transition-all text-xs ${prefillData.id ? 'opacity-60 cursor-not-allowed' : 'focus:bg-white focus:border-orange-500'}`} 
                                        placeholder="Enter ID" 
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Reporting Cycle</label>
                                <div className="relative">
                                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                                    <select 
                                        required
                                        value={formData.month} 
                                        onChange={e => setFormData({...formData, month: e.target.value})} 
                                        className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-900 outline-none focus:bg-white focus:border-orange-500 transition-all text-xs appearance-none"
                                    >
                                        <option value="">Select Month</option>
                                        {[...Array(6)].map((_, i) => {
                                            const d = new Date();
                                            d.setMonth(d.getMonth() - i);
                                            const m = d.toLocaleString('en-US', { month: 'long', year: 'numeric' });
                                            return <option key={m} value={m}>{m}</option>;
                                        })}
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">PPT Access Link (Optional)</label>
                            <div className="relative">
                                <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                                <input 
                                    type="url"
                                    value={formData.ppt_link} 
                                    onChange={e => setFormData({...formData, ppt_link: e.target.value})} 
                                    className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-900 outline-none focus:bg-white focus:border-orange-500 transition-all text-xs" 
                                    placeholder="Google Drive / OneDrive Link" 
                                />
                            </div>
                            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest ml-1">Leave empty if submitted manually to office.</p>
                        </div>

                        <div className="p-6 bg-orange-50 border border-orange-100 rounded-3xl space-y-4">
                            <div className="flex items-center gap-4">
                                <input 
                                    type="checkbox"
                                    id="confirm"
                                    checked={formData.confirmed}
                                    onChange={e => setFormData({...formData, confirmed: e.target.checked})}
                                    className="w-5 h-5 rounded-lg border-2 border-orange-200 text-orange-600 focus:ring-orange-500"
                                />
                                <label htmlFor="confirm" className="text-[10px] font-black text-slate-800 uppercase tracking-tight cursor-pointer">
                                    I confirm that I have submitted my monthly PPT for the selected cycle.
                                </label>
                            </div>
                        </div>

                        <MathCaptcha onVerify={setIsVerified} />

                        <button 
                            disabled={loading || !isVerified || !formData.confirmed} 
                            type="submit"
                            className="w-full py-5 bg-slate-900 text-white text-[10px] font-black rounded-2xl shadow-xl flex items-center justify-center gap-3 uppercase tracking-widest hover:bg-orange-600 transition-all disabled:opacity-50"
                        >
                            {loading ? <Loader2 size={16} className="animate-spin" /> : <><ShieldCheck size={14}/> Finalize Submission</>}
                        </button>
                    </form>
                </div>
            </div>

            <SuccessModal 
                isOpen={showSuccess} 
                onClose={() => window.location.reload()}
                title="Protocol Synchronized"
                message={`Your PPT submission for ${formData.month} has been successfully logged. Reminders for this cycle have been deactivated.`}
            />
            
            <div className="mt-12 text-center">
                <p className="text-[8px] font-black text-slate-300 uppercase tracking-[0.4em]">SBH Hospital Management System • Infrastructure Group</p>
            </div>
        </div>
    );
};

export default PPTSubmissionForm;
