import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Calendar, CalendarRange, Send, User, Briefcase, Mail, FileText,
    CheckCircle2, Loader2, ChevronRight, Search, Sparkles, 
    AlertCircle, ShieldCheck, Fingerprint, Clock, FileQuestion
} from 'lucide-react';

// This URL should be replaced with the deployed web app URL from leavecode.js
const DEFAULT_LEAVE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwHGM9gabkNPnO7_3ovPGRrxKmxSG8xK_ABLchLhuyU1-1Yd38G-QbIWzUaC47vxUVwhA/exec';

const LeaveRequestForm = ({ isPublic, staffList: propStaffList }) => {
    // Try to get staff list from props, or fetch if not available
    const [staffList, setStaffList] = useState(propStaffList || []);
    const [loadingStaff, setLoadingStaff] = useState(!propStaffList || propStaffList.length === 0);
    const [scriptUrl, setScriptUrl] = useState(() => {
        return localStorage.getItem('leave_script_url') || DEFAULT_LEAVE_SCRIPT_URL;
    });

    const [formData, setFormData] = useState({
        personName: '',
        designation: '',
        leaveType: 'Casual Leave',
        startDate: '',
        endDate: '',
        reason: '',
        submittedBy: '',
        submittedEmail: ''
    });

    const [searchSenior, setSearchSenior] = useState('');
    const [searchNominator, setSearchNominator] = useState('');
    const [showSeniorResults, setShowSeniorResults] = useState(false);
    const [showNominatorResults, setShowNominatorResults] = useState(false);
    
    const [isVerified, setIsVerified] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [totalDays, setTotalDays] = useState(0);

    // Fetch staff list if not passed as props
    useEffect(() => {
        if (!propStaffList || propStaffList.length === 0) {
            const fetchStaff = async () => {
                try {
                    // Try to fetch from the smile award script or a centralized roster if accessible
                    const smileScriptUrl = 'https://script.google.com/macros/s/AKfycbyHNF4Yzqvh6Copcl2aL1XyWZEyBSeoaxXz277xFbkPOqPOB-Fy7tNzDpMmFimHf2kGyg/exec';
                    const response = await fetch(`${smileScriptUrl}?action=get_staff`);
                    const data = await response.json();
                    setStaffList(Array.isArray(data) ? data : []);
                } catch (err) { 
                    console.error('Roster fetch error for leave form:', err); 
                } finally { 
                    setLoadingStaff(false); 
                }
            };
            fetchStaff();
        } else {
            setStaffList(propStaffList);
            setLoadingStaff(false);
        }
    }, [propStaffList]);

    // Calculate total days when dates change
    useEffect(() => {
        if (formData.startDate && formData.endDate) {
            const start = new Date(`${formData.startDate}T00:00:00`);
            const end = new Date(`${formData.endDate}T00:00:00`);
            if (end >= start) {
                const diffTime = Math.abs(end - start);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
                setTotalDays(diffDays);
            } else {
                setTotalDays(0);
            }
        } else {
            setTotalDays(0);
        }
    }, [formData.startDate, formData.endDate]);

    // Helper to extract properties from objects case-insensitively
    const getVal = (obj, key) => {
        if (!obj) return '';
        const foundKey = Object.keys(obj).find(k => k.toLowerCase().replace(/_/g, '') === key.toLowerCase().replace(/_/g, ''));
        return foundKey ? obj[foundKey] : (obj[key] || '');
    };

    const filteredSeniors = useMemo(() => {
        if (!searchSenior || searchSenior.length < 2) return [];
        return staffList.filter(s => 
            getVal(s, 'Name').toLowerCase().includes(searchSenior.toLowerCase()) ||
            getVal(s, 'Staff_ID').toLowerCase().includes(searchSenior.toLowerCase())
        ).slice(0, 5);
    }, [staffList, searchSenior]);

    const filteredNominators = useMemo(() => {
        if (!searchNominator || searchNominator.length < 2) return [];
        return staffList.filter(s => 
            getVal(s, 'Name').toLowerCase().includes(searchNominator.toLowerCase()) ||
            getVal(s, 'Staff_ID').toLowerCase().includes(searchNominator.toLowerCase())
        ).slice(0, 5);
    }, [staffList, searchNominator]);

    const handleSelectSenior = (s) => {
        setFormData(prev => ({
            ...prev,
            personName: getVal(s, 'Name'),
            designation: getVal(s, 'Role') || getVal(s, 'Department') || 'Senior Officer'
        }));
        setSearchSenior(getVal(s, 'Name'));
        setShowSeniorResults(false);
    };

    const handleSelectNominator = (s) => {
        setFormData(prev => ({
            ...prev,
            submittedBy: getVal(s, 'Name'),
            submittedEmail: getVal(s, 'Email')
        }));
        setSearchNominator(getVal(s, 'Name'));
        setShowNominatorResults(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.personName || !formData.designation || !formData.startDate || !formData.endDate) {
            alert('Please fill out all required fields.');
            return;
        }

        if (totalDays < 1) {
            alert('End Date must be the same as or after Start Date.');
            return;
        }

        if (!isVerified) {
            alert('Please complete the security verification math problem.');
            return;
        }

        setIsSubmitting(true);
        try {
            // Save the script URL to localStorage for easy persistence
            localStorage.setItem('leave_script_url', scriptUrl);

            await fetch(scriptUrl, {
                method: 'POST',
                mode: 'no-cors',
                headers: { 'Content-Type': 'text/plain' },
                body: JSON.stringify(formData)
            });
            
            setSubmitted(true);
        } catch (error) {
            console.error('Submission error:', error);
            alert('Could not submit leave request. Please verify the Apps Script URL.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (submitted) {
        return (
            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }} 
                animate={{ opacity: 1, scale: 1 }} 
                className="flex flex-col items-center justify-center p-12 bg-white rounded-[3rem] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] text-center max-w-lg mx-auto border border-orange-50 my-10"
            >
                <div className="w-24 h-24 bg-gradient-to-br from-orange-500 to-amber-400 rounded-3xl flex items-center justify-center text-white mb-8 shadow-xl shadow-orange-100 rotate-6">
                    <CalendarRange size={48} />
                </div>
                <h2 className="text-4xl font-black text-slate-800 uppercase tracking-tighter mb-4">
                    Leave <span className="text-orange-600">Submitted!</span>
                </h2>
                <p className="text-slate-400 font-bold mb-10 uppercase text-[10px] tracking-[0.2em] leading-relaxed">
                    Leave request logged. Notifications are being dispatched to relevant staff members.
                </p>
                <button 
                    onClick={() => { 
                        setSubmitted(false); 
                        setFormData({
                            personName: '',
                            designation: '',
                            leaveType: 'Casual Leave',
                            startDate: '',
                            endDate: '',
                            reason: '',
                            submittedBy: '',
                            submittedEmail: ''
                        });
                        setSearchSenior('');
                        setSearchNominator('');
                        setIsVerified(false);
                    }} 
                    className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-orange-600 transition-all shadow-xl shadow-slate-200"
                >
                    Submit Another Leave
                </button>
            </motion.div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto px-4 py-6 mb-20 font-sans">
            {/* Apps Script URL Config Panel for authorized users / setup */}
            {isPublic && (
                <div className="mb-6 p-4 bg-amber-50 rounded-2xl border border-amber-100 flex flex-col md:flex-row items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <AlertCircle size={16} className="text-amber-600 shrink-0" />
                        <p className="text-[10px] text-amber-800 font-bold uppercase tracking-wider">
                            Configure App Script URL for the Leave Automation:
                        </p>
                    </div>
                    <input 
                        type="text" 
                        value={scriptUrl} 
                        onChange={(e) => setScriptUrl(e.target.value)}
                        placeholder="Paste script URL here..." 
                        className="bg-white border border-amber-200 px-4 py-2 rounded-xl text-[10px] font-mono text-slate-700 w-full md:w-80 outline-none focus:border-orange-500"
                    />
                </div>
            )}

            <motion.div 
                initial={{ opacity: 0, y: 30 }} 
                animate={{ opacity: 1, y: 0 }} 
                className="bg-white rounded-[3.5rem] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.08)] p-8 md:p-14 border border-slate-50 relative overflow-hidden"
            >
                {/* Decorative backgrounds */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-orange-50/50 rounded-bl-full -mr-20 -mt-20 z-0 animate-pulse" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-50/50 rounded-tr-full -ml-16 -mb-16 z-0" />
                
                <div className="relative z-10 mb-14 text-center">
                    <div className="inline-flex items-center gap-3 px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-full text-[9px] font-black uppercase tracking-[0.3em] mb-6 shadow-lg shadow-orange-100">
                        <Calendar size={16} /> Leave Management System
                    </div>
                    <h2 className="text-4xl md:text-5xl font-black text-slate-800 tracking-tighter uppercase mb-4 leading-none">
                        Senior Leave <span className="bg-gradient-to-r from-orange-600 to-amber-500 bg-clip-text text-transparent underline decoration-emerald-400 underline-offset-8">Notification</span>
                    </h2>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                        SBH Group Of Hospitals Operational Roster update
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="relative z-10 space-y-8">
                    {/* LEAVE SUBJECT NAME */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-3 relative">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-2 flex items-center gap-2">
                                <User size={18} className="text-orange-500" /> Senior Officer Name <span className="text-orange-500">*</span>
                            </label>
                            <input 
                                type="text"
                                required
                                className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl py-5 px-6 text-slate-800 font-black text-sm outline-none focus:bg-white focus:border-orange-500/20 focus:ring-8 focus:ring-orange-500/5 transition-all"
                                placeholder="Enter Senior Officer's Name"
                                value={formData.personName}
                                onChange={e => setFormData({...formData, personName: e.target.value})}
                            />
                        </div>

                        <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-2 flex items-center gap-2">
                                <Briefcase size={18} className="text-slate-400" /> Designation / Post <span className="text-orange-500">*</span>
                            </label>
                            <input 
                                type="text"
                                required
                                value={formData.designation}
                                onChange={e => setFormData({...formData, designation: e.target.value})}
                                placeholder="Enter designation (e.g. Director, Consultant)"
                                className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl py-5 px-6 text-slate-800 font-black text-sm outline-none focus:bg-white focus:border-orange-500/20 focus:ring-8 focus:ring-orange-500/5 transition-all"
                            />
                        </div>
                    </div>

                    {/* LEAVE TYPE & DATES */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-2 flex items-center gap-2">
                                <FileQuestion size={18} className="text-slate-400" /> Leave Type
                            </label>
                            <select 
                                value={formData.leaveType}
                                onChange={e => setFormData({...formData, leaveType: e.target.value})}
                                className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl py-5 px-6 text-slate-800 font-black text-sm outline-none focus:bg-white focus:border-orange-500/20 transition-all cursor-pointer appearance-none"
                            >
                                <option value="Casual Leave">Casual Leave</option>
                                <option value="Sick Leave">Sick Leave</option>
                                <option value="Privilege Leave">Privilege Leave</option>
                                <option value="LWP (Leave Without Pay)">LWP (Without Pay)</option>
                                <option value="Maternity Leave">Maternity Leave</option>
                                <option value="Paternity Leave">Paternity Leave</option>
                                <option value="Duty Leave / Official">Duty Leave / Official</option>
                            </select>
                        </div>

                        <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-2 flex items-center gap-2">
                                <Calendar size={18} className="text-slate-400" /> Start Date <span className="text-orange-500">*</span>
                            </label>
                            <input 
                                type="date"
                                required
                                value={formData.startDate}
                                onChange={e => setFormData({...formData, startDate: e.target.value})}
                                className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl py-4.5 px-6 text-slate-800 font-black text-sm outline-none focus:bg-white focus:border-orange-500/20 transition-all"
                            />
                        </div>

                        <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-2 flex items-center gap-2">
                                <Calendar size={18} className="text-slate-400" /> End Date <span className="text-orange-500">*</span>
                            </label>
                            <input 
                                type="date"
                                required
                                value={formData.endDate}
                                onChange={e => setFormData({...formData, endDate: e.target.value})}
                                className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl py-4.5 px-6 text-slate-800 font-black text-sm outline-none focus:bg-white focus:border-orange-500/20 transition-all"
                            />
                        </div>
                    </div>

                    {/* DURATION DISPLAY & REASON */}
                    <div className="space-y-6">
                        {totalDays > 0 && (
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.95 }} 
                                animate={{ opacity: 1, scale: 1 }} 
                                className="p-5 bg-emerald-50/50 rounded-2xl border border-emerald-100 flex items-center justify-between"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-emerald-600 shadow-sm">
                                        <Clock size={18}/>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase leading-none mb-1">Calculated Duration</p>
                                        <p className="text-lg font-black text-emerald-700 uppercase tracking-wide">{totalDays} Day(s)</p>
                                    </div>
                                </div>
                                <ShieldCheck className="text-emerald-500" size={24} />
                            </motion.div>
                        )}

                        <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-2 flex items-center gap-2">
                                <FileText size={18} className="text-slate-400" /> Reason / Note
                            </label>
                            <textarea 
                                value={formData.reason}
                                onChange={e => setFormData({...formData, reason: e.target.value})}
                                placeholder="Explain the context of this leave (e.g. personal work, medical leave, conference)..."
                                className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl py-5 px-6 text-slate-800 font-bold text-sm outline-none transition-all h-28 resize-none focus:bg-white focus:border-orange-500/20 focus:ring-8 focus:ring-orange-500/5"
                            />
                        </div>
                    </div>

                    {/* SUBMITTED BY (SENDER) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-3 relative">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-2 flex items-center gap-2">
                                <User size={18} className="text-slate-400" /> Your Identity (Submitted By)
                            </label>
                            <input 
                                type="text"
                                className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl py-5 px-6 text-slate-800 font-black text-sm outline-none focus:bg-white focus:border-orange-500/20 focus:ring-8 focus:ring-orange-500/5 transition-all"
                                placeholder="Enter Your Name"
                                value={formData.submittedBy}
                                onChange={e => setFormData({...formData, submittedBy: e.target.value})}
                            />
                        </div>

                        <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-2 flex items-center gap-2">
                                <Mail size={18} className="text-slate-400" /> Your Email
                            </label>
                            <input 
                                type="email"
                                value={formData.submittedEmail}
                                onChange={e => setFormData({...formData, submittedEmail: e.target.value})}
                                placeholder="Enter your email address..."
                                className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl py-5 px-6 text-slate-800 font-black text-sm outline-none focus:bg-white focus:border-orange-500/20 focus:ring-8 focus:ring-orange-500/5 transition-all"
                            />
                        </div>
                    </div>

                    <MathCaptcha onVerify={setIsVerified} />

                    <div className="pt-6">
                        <motion.button 
                            whileHover={{ scale: 1.02, y: -2 }}
                            whileTap={{ scale: 0.98 }}
                            disabled={isSubmitting || !isVerified || !formData.personName || !formData.designation}
                            className="w-full bg-slate-950 text-white py-6 rounded-[2rem] font-black uppercase tracking-[0.4em] text-xs shadow-2xl shadow-slate-300 flex items-center justify-center gap-4 hover:bg-orange-600 transition-all disabled:opacity-50"
                        >
                            {isSubmitting ? (
                                <><Loader2 className="animate-spin" size={20} /> Sending Notification...</>
                            ) : (
                                <><Send size={20} /> Register & Alert Team</>
                            )}
                        </motion.button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
};

// Captcha Component matching SheetDashboard MathCaptcha
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
        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center border border-slate-200 shadow-sm">
                    <Fingerprint size={14} className="text-slate-400" />
                </div>
                <p className="text-[10px] font-black text-slate-800 uppercase tracking-widest">
                    Security Test: {nums.a} + {nums.b} = ?
                </p>
            </div>
            <input 
                type="number"
                value={input}
                onChange={(e) => check(e.target.value)}
                placeholder="?"
                className={`w-16 px-3 py-2 rounded-xl font-black text-xs outline-none transition-all border-2 ${
                    verified 
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700' 
                    : 'border-transparent bg-white text-slate-900 focus:border-orange-500/20'
                }`}
            />
        </div>
    );
};

export default LeaveRequestForm;
