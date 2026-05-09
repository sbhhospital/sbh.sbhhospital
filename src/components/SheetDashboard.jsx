import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Award, Plus, ClipboardList, TrendingUp, Trophy, 
    CheckCircle2, Users, Scan, Cake, Edit3, BarChart3, 
    IndianRupee, LogOut, Activity, ChevronRight, Search, 
    Trash, Save, Phone, Mail, User, X, Loader2, RefreshCw, 
    Calendar, Star, Download, QrCode, ArrowLeft, Filter,
    ChevronLeft, ChevronsLeft, ChevronsRight, ShieldCheck, Fingerprint,
    Linkedin, ExternalLink, ChevronDown, MessageCircle,
    Send, MessageSquare, Building2, CheckCircle, Check
} from 'lucide-react';
import VisitingManager from './Visiting/VisitingManager';
import AccountUpdate from './Visiting/AccountUpdate';
import SBHFamilyManager from './SBHFamily/SBHFamilyManager';
import LasikSurvey from './LasikSurvey';
import Footer from './Footer';

// --- UTILITIES ---
const getVal = (obj, key) => {
    if (!obj) return '';
    const foundKey = Object.keys(obj).find(k => k.toLowerCase().replace(/_/g, '') === key.toLowerCase().replace(/_/g, ''));
    return foundKey ? obj[foundKey] : (obj[key] || '');
};

const parseDateLocal = (dateStr) => {
    if (!dateStr) return null;
    try {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return null;
        
        // If it's a string, try to parse parts directly to avoid UTC shift
        if (typeof dateStr === 'string') {
            const clean = dateStr.split('T')[0];
            const parts = clean.split(/[-/]/);
            if (parts.length === 3) {
                // Handle YYYY-MM-DD
                if (parts[0].length === 4) return new Date(parts[0], parts[1] - 1, parts[2]);
                // Handle DD-MM-YYYY
                if (parts[2].length === 4) return new Date(parts[2], parts[1] - 1, parts[0]);
            }
        }
        // If it was already a date object or other format, use it but zero out time
        return new Date(d.getFullYear(), d.getMonth(), d.getDate());
    } catch (e) { return null; }
};

const formatDateStrict = (dateStr) => {
    if (!dateStr) return 'N/A';
    const d = parseDateLocal(dateStr);
    if (!d) return dateStr;
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }).toUpperCase();
};

const formatDateReadable = (dateStr) => {
    if (!dateStr) return 'N/A';
    const d = parseDateLocal(dateStr);
    if (!d) return dateStr;
    return d.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
};

const toFormDate = (dateStr) => {
    if (!dateStr) return '';
    const d = parseDateLocal(dateStr);
    if (!d) return '';
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
};

// --- MINI COMPONENTS ---

const RefreshButton = ({ onRefresh, loading }) => (
    <button 
        onClick={onRefresh} 
        disabled={loading}
        className="p-2.5 bg-white border border-slate-100 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-xl transition-all shadow-sm group"
    >
        <RefreshCw size={14} className={`${loading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
    </button>
);

const Pagination = ({ totalItems, itemsPerPage, currentPage, onPageChange }) => {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    if (totalPages <= 1) return null;

    return (
        <div className="flex items-center justify-between px-6 py-4 bg-white border-t border-slate-50">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                Showing <span className="text-slate-800">{Math.min(totalItems, (currentPage-1)*itemsPerPage + 1)}</span> to <span className="text-slate-800">{Math.min(totalItems, currentPage*itemsPerPage)}</span> of <span className="text-slate-800">{totalItems}</span> Records
            </p>
            <div className="flex items-center gap-1">
                <button 
                    disabled={currentPage === 1}
                    onClick={() => onPageChange(currentPage - 1)}
                    className="p-2 text-slate-400 hover:text-orange-600 disabled:opacity-30 transition-all"
                >
                    <ChevronLeft size={16} />
                </button>
                <div className="flex items-center gap-1 px-2">
                    {[...Array(totalPages)].map((_, i) => {
                        const page = i + 1;
                        if (totalPages > 5 && Math.abs(page - currentPage) > 1 && page !== 1 && page !== totalPages) {
                            if (page === 2 || page === totalPages - 1) return <span key={page} className="text-slate-300 text-[10px]">...</span>;
                            return null;
                        }
                        return (
                            <button
                                key={page}
                                onClick={() => onPageChange(page)}
                                className={`w-7 h-7 rounded-lg text-[9px] font-black transition-all ${currentPage === page ? 'bg-slate-900 text-white' : 'text-slate-400 hover:bg-slate-50'}`}
                            >
                                {page}
                            </button>
                        );
                    })}
                </div>
                <button 
                    disabled={currentPage === totalPages}
                    onClick={() => onPageChange(currentPage + 1)}
                    className="p-2 text-slate-400 hover:text-orange-600 disabled:opacity-30 transition-all"
                >
                    <ChevronRight size={16} />
                </button>
            </div>
        </div>
    );
};

const NavItem = ({ icon, label, active, onClick }) => (
    <button 
        onClick={onClick}
        className={`w-full flex items-center gap-3 px-5 py-2.5 rounded-xl transition-all group relative mb-1 ${
            active 
            ? 'bg-orange-500 text-white shadow-lg shadow-orange-200/50 transform scale-[1.02]' 
            : 'text-emerald-950/80 hover:bg-orange-50 hover:text-orange-950 opacity-90'
        }`}
    >
        <span className={`flex items-center justify-center shrink-0 ${active ? 'text-white' : 'text-orange-500'}`}>
            {React.cloneElement(icon, { size: 14, strokeWidth: active ? 2.5 : 2 })}
        </span>
        <span className="text-[10px] font-bold tracking-wide transition-opacity duration-200">
            {label}
        </span>
        {active && (
            <div className="absolute right-3 w-1.5 h-1.5 rounded-full bg-white shadow-sm" />
        )}
    </button>
);

const CollapsibleCategory = ({ icon, label, children, isOpen, onToggle }) => (
    <div className="mb-2">
        <button 
            onClick={onToggle} 
            className={`w-full flex items-center justify-between px-5 py-3 rounded-xl transition-all duration-200 font-bold tracking-wide text-[11px] ${
                isOpen 
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200/50' 
                : 'text-emerald-950/80 hover:bg-emerald-50 hover:text-emerald-950'
            }`}
        >
            <div className="flex items-center gap-3">
                <span className={`flex items-center justify-center shrink-0 ${isOpen ? 'text-white' : 'text-orange-500'}`}>
                    {React.cloneElement(icon, { size: 16, strokeWidth: 2.5 })}
                </span>
                <span>{label}</span>
            </div>
            <motion.div animate={{ rotate: isOpen ? 180 : 0 }}>
                <ChevronDown size={14} className={isOpen ? 'text-white' : 'text-emerald-950/40'} />
            </motion.div>
        </button>
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden bg-emerald-50/30 rounded-xl mt-1 py-1"
                >
                    {children}
                </motion.div>
            )}
        </AnimatePresence>
    </div>
);




const SuccessModal = ({ isOpen, onClose, title = "Thank You!", subtitle = "Entry Registered", message = "Your submission has been logged into our system." }) => {
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
                <p className="text-[9px] font-bold text-slate-400 mb-6 uppercase tracking-[0.2em]">{subtitle}</p>

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
                    Verification: {nums.a} + {nums.b} = ?
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

// --- SMILE COMPONENTS ---

const SmileAwardFormSection = ({ staffList, smileScriptUrl, onSubmissionSuccess }) => {
    const [formData, setFormData] = useState({ 
        employeeName: '', 
        employeeId: '',
        department: '', 
        role: '',
        remarks: '',
        voterName: '',
        voterId: '',
        voterDept: ''
    });
    const [searchNominee, setSearchNominee] = useState('');
    const [searchNominator, setSearchNominator] = useState('');
    const [showNomineeResults, setShowNomineeResults] = useState(false);
    const [showNominatorResults, setShowNominatorResults] = useState(false);
    const [isVerified, setIsVerified] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    const filteredNominees = useMemo(() => {
        if (!searchNominee || searchNominee.length < 2) return [];
        return staffList.filter(s => 
            getVal(s, 'Name').toLowerCase().includes(searchNominee.toLowerCase()) ||
            getVal(s, 'Staff_ID').toLowerCase().includes(searchNominee.toLowerCase())
        ).slice(0, 5);
    }, [staffList, searchNominee]);

    const filteredNominators = useMemo(() => {
        if (!searchNominator || searchNominator.length < 2) return [];
        return staffList.filter(s => 
            getVal(s, 'Name').toLowerCase().includes(searchNominator.toLowerCase()) ||
            getVal(s, 'Staff_ID').toLowerCase().includes(searchNominator.toLowerCase())
        ).slice(0, 5);
    }, [staffList, searchNominator]);

    const handleSelectNominee = (s) => {
        setFormData({
            ...formData,
            employeeName: getVal(s, 'Name'),
            employeeId: getVal(s, 'Staff_ID'),
            department: getVal(s, 'Department'),
            role: getVal(s, 'Role') || 'Staff'
        });
        setSearchNominee(getVal(s, 'Name'));
        setShowNomineeResults(false);
    };

    const handleSelectNominator = (s) => {
        setFormData({
            ...formData,
            voterName: getVal(s, 'Name'),
            voterId: getVal(s, 'Staff_ID'),
            voterDept: getVal(s, 'Department')
        });
        setSearchNominator(getVal(s, 'Name'));
        setShowNominatorResults(false);
    };

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        if (!isVerified) return alert("Security Verification Failed!");
        if (!formData.employeeName || !formData.voterName) return alert("Please select both Nominee and Nominator.");
        
        setIsSubmitting(true);
        try {
            await fetch(smileScriptUrl, {
                method: 'POST',
                mode: 'no-cors',
                headers: { 'Content-Type': 'text/plain' },
                body: JSON.stringify({ 
                    action: 'save_vote', 
                    ...formData 
                })
            });
            setShowSuccess(true);
        } catch (err) {
            alert("Roster connection failed.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="max-w-xl mx-auto py-10">
            <div className="bg-white rounded-[3rem] border border-slate-100 shadow-2xl overflow-hidden relative">
                <div className="p-10 md:p-14">
                    <div className="flex flex-col items-center text-center mb-10">
                        <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-[2.5rem] flex items-center justify-center mb-6 shadow-xl shadow-emerald-50">
                            <Award size={36} />
                        </div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Smile <span className="text-emerald-600">Nomination</span></h1>
                        <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-[0.3em] bg-emerald-50 px-4 py-1.5 rounded-full inline-block">Active Cycle: {new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' })}</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-8">
                        {/* NOMINEE SELECTION */}
                        <div className="space-y-4">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Search Nominee</label>
                            <div className="relative">
                                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                                <input 
                                    value={searchNominee}
                                    onChange={(e) => { setSearchNominee(e.target.value); setShowNomineeResults(true); }}
                                    onFocus={() => setShowNomineeResults(true)}
                                    placeholder="Type Employee Name or ID..."
                                    className="w-full pl-16 pr-6 py-5 bg-slate-50 border-2 border-transparent focus:border-emerald-500/20 focus:bg-white rounded-[2rem] font-bold text-slate-800 outline-none transition-all text-sm shadow-sm"
                                />
                                <AnimatePresence>
                                    {showNomineeResults && filteredNominees.length > 0 && (
                                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="absolute z-50 left-0 right-0 mt-3 bg-white border border-slate-100 rounded-[2rem] shadow-2xl overflow-hidden">
                                            {filteredNominees.map((s, i) => (
                                                <button key={i} type="button" onClick={() => handleSelectNominee(s)} className="w-full p-5 text-left hover:bg-emerald-50 flex items-center justify-between border-b border-slate-50 last:border-0 group">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center font-black text-xs group-hover:bg-emerald-600 transition-colors">{getVal(s, 'Name')?.[0]}</div>
                                                        <div>
                                                            <p className="font-black text-slate-800 uppercase text-xs mb-0.5">{getVal(s, 'Name')}</p>
                                                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{getVal(s, 'Department')}</p>
                                                        </div>
                                                    </div>
                                                    <ChevronRight size={14} className="text-slate-200 group-hover:text-emerald-500" />
                                                </button>
                                            ))}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                            {formData.employeeName && (
                                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="p-5 bg-emerald-50/50 rounded-2xl border border-emerald-100/50 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-emerald-600 shadow-sm"><CheckCircle size={18}/></div>
                                        <div>
                                            <p className="text-[10px] font-black text-slate-800 uppercase leading-none mb-1">{formData.employeeName}</p>
                                            <p className="text-[8px] font-bold text-emerald-600 uppercase tracking-widest">{formData.department}</p>
                                        </div>
                                    </div>
                                    <CheckCircle2 className="text-emerald-500" size={20} />
                                </motion.div>
                            )}
                        </div>

                        {/* REMARKS */}
                        <div className="space-y-4">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Achievement Context</label>
                            <textarea 
                                required
                                value={formData.remarks}
                                onChange={(e) => setFormData({...formData, remarks: e.target.value})}
                                placeholder="Why does this candidate deserve the Smile Award?"
                                className="w-full p-8 bg-slate-50 border-2 border-transparent focus:border-emerald-500/20 focus:bg-white rounded-[2rem] font-bold text-slate-800 outline-none transition-all text-sm min-h-[120px] shadow-sm"
                            />
                        </div>

                        {/* NOMINATOR IDENTITY */}
                        <div className="space-y-4">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Your Identity (Nominator)</label>
                            <div className="relative">
                                <Scan className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                                <input 
                                    value={searchNominator}
                                    onChange={(e) => { setSearchNominator(e.target.value); setShowNominatorResults(true); }}
                                    onFocus={() => setShowNominatorResults(true)}
                                    placeholder="Select your name..."
                                    className="w-full pl-16 pr-6 py-5 bg-slate-50 border-2 border-transparent focus:border-emerald-500/20 focus:bg-white rounded-[2rem] font-bold text-slate-800 outline-none transition-all text-sm shadow-sm"
                                />
                                <AnimatePresence>
                                    {showNominatorResults && filteredNominators.length > 0 && (
                                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="absolute z-50 left-0 right-0 mt-3 bg-white border border-slate-100 rounded-[2rem] shadow-2xl overflow-hidden">
                                            {filteredNominators.map((s, i) => (
                                                <button key={i} type="button" onClick={() => handleSelectNominator(s)} className="w-full p-5 text-left hover:bg-emerald-50 flex items-center justify-between border-b border-slate-50 last:border-0 group">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 bg-slate-100 text-slate-400 rounded-xl flex items-center justify-center font-black text-xs group-hover:bg-emerald-600 group-hover:text-white transition-colors">{getVal(s, 'Name')?.[0]}</div>
                                                        <div>
                                                            <p className="font-black text-slate-800 uppercase text-xs mb-0.5">{getVal(s, 'Name')}</p>
                                                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{getVal(s, 'Department')}</p>
                                                        </div>
                                                    </div>
                                                    <Check size={14} className="text-slate-200 group-hover:text-emerald-500" />
                                                </button>
                                            ))}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>

                        <MathCaptcha onVerify={setIsVerified} />

                        <button 
                            disabled={isSubmitting || !isVerified || !formData.employeeName || !formData.voterName}
                            type="submit"
                            className="w-full py-6 bg-slate-900 text-white rounded-[2rem] font-black uppercase text-xs tracking-[0.2em] shadow-2xl hover:bg-emerald-600 transition-all flex items-center justify-center gap-4 disabled:opacity-50"
                        >
                            {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <><Send size={18} /> Cast Nomination</>}
                        </button>
                    </form>
                </div>
            </div>

            <SuccessModal 
                isOpen={showSuccess} 
                onClose={() => { setShowSuccess(false); if(onSubmissionSuccess) onSubmissionSuccess(); }}
                title="Nomination Recorded"
                subtitle="Cycle Synchronized"
                message={`Your nomination for ${formData.employeeName} has been recorded. Winners are announced at the end of each cycle.`}
            />
        </div>
    );
};



const MonthSelector = ({ selectedMonth, onMonthChange, availableMonths }) => (
    <div className="flex items-center gap-2 bg-white/50 p-1 rounded-2xl border border-slate-100 shadow-sm backdrop-blur-sm">
        <div className="flex items-center gap-2 px-3 border-r border-slate-100">
            <Calendar size={12} className="text-emerald-600" />
            <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Select Cycle</span>
        </div>
        <select 
            value={selectedMonth} 
            onChange={(e) => onMonthChange(e.target.value)}
            className="bg-transparent text-[10px] font-black uppercase tracking-widest text-slate-800 outline-none px-4 py-1.5 cursor-pointer appearance-none"
        >
            {availableMonths?.length > 0 ? (
                availableMonths.map(m => <option key={m} value={m}>{m}</option>)
            ) : (
                <option value={selectedMonth}>{selectedMonth}</option>
            )}
        </select>
        <div className="pr-3 pointer-events-none">
            <ChevronDown size={10} className="text-slate-400" />
        </div>
    </div>
);

const SmileEntriesSection = ({ entries, loading, onRefresh, selectedMonth, onMonthChange, availableMonths }) => {
    const filtered = useMemo(() => {
        const seen = new Set();
        return entries.filter(en => {
            const m = en.month?.toString().trim();
            if (m !== selectedMonth) return false;
            // Key based on voter, nominee, and reason to catch exact duplicates
            const key = `${en.voter_name}-${en.employee_name}-${en.remarks}-${m}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });
    }, [entries, selectedMonth]);
    
    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-1">
                <div>
                    <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">Nomination <span className="text-emerald-500">Ledger</span></h2>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Live Feed of Recognition</p>
                </div>
                <div className="flex items-center gap-3">
                    <MonthSelector selectedMonth={selectedMonth} onMonthChange={onMonthChange} availableMonths={availableMonths} />
                    <RefreshButton onRefresh={onRefresh} loading={loading} />
                </div>
            </div>

            {filtered.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filtered.map((en, i) => (
                        <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                            key={i} 
                            className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-full -mr-12 -mt-12 opacity-50" />
                            <div className="flex items-center justify-between mb-6 relative z-10">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-emerald-600 text-white rounded-2xl flex items-center justify-center text-lg font-black shadow-lg shadow-emerald-200">{en.employee_name?.[0]}</div>
                                    <div>
                                        <p className="text-[11px] font-black text-slate-800 uppercase leading-none">{en.employee_name}</p>
                                        <p className="text-[8px] font-bold text-emerald-600 uppercase tracking-widest mt-1.5 px-2 py-0.5 bg-emerald-50 rounded-full inline-block">{en.department}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className="text-[8px] font-black text-slate-300 uppercase block">{formatDateStrict(en.timestamp)}</span>
                                </div>
                            </div>
                            <div className="bg-slate-50 p-5 rounded-2xl mb-6 border border-slate-100 relative">
                                <MessageCircle size={12} className="absolute -top-1.5 -left-1.5 text-emerald-500" />
                                <p className="text-[11px] font-bold text-slate-600 leading-relaxed italic">"{en.remarks}"</p>
                            </div>
                            <div className="flex items-center justify-between relative z-10 px-1">
                                <div className="flex items-center gap-2">
                                    <div className="w-5 h-5 bg-slate-900 rounded-full flex items-center justify-center text-[8px] text-white font-black">{en.voter_name?.[0]}</div>
                                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Nominated by <span className="text-slate-900">{en.voter_name}</span></p>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            ) : (
                <div className="bg-white rounded-3xl p-20 text-center border border-slate-100 border-dashed">
                    <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-300">
                        <ClipboardList size={32} />
                    </div>
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">No Nominations Found for {selectedMonth}</p>
                </div>
            )}
        </div>
    );
};

const SmileLeaderboardSection = ({ stats, winners, selectedMonth, onMonthChange, loading, onRefresh, availableMonths }) => {
    const filteredStats = stats.all?.filter(s => s.month === selectedMonth) || [];
    const filteredWinners = winners?.filter(w => w.month === selectedMonth) || [];

    const deptStats = useMemo(() => {
        const counts = {};
        filteredStats.forEach(s => {
            const d = s.dept || 'General';
            counts[d] = (counts[d] || 0) + (parseInt(s.votes) || 0);
        });
        return Object.entries(counts).sort((a, b) => b[1] - a[1]);
    }, [filteredStats]);

    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-1">
                <div>
                    <h2 className="text-xl font-black text-slate-800 uppercase tracking-tighter">Leader <span className="text-emerald-600">Board</span></h2>
                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">Real-time Performance Metrics</p>
                </div>
                <div className="flex items-center gap-3">
                    <MonthSelector selectedMonth={selectedMonth} onMonthChange={onMonthChange} availableMonths={availableMonths} />
                    <RefreshButton onRefresh={onRefresh} loading={loading} />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="lg:col-span-3 space-y-2">
                    {filteredStats.length > 0 ? (
                        filteredStats.slice(0, 10).map((st, i) => (
                            <motion.div 
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.05 }}
                                key={i} 
                                className="bg-white px-6 py-3.5 rounded-2xl flex items-center justify-between border border-slate-100 shadow-sm hover:shadow-lg transition-all group cursor-default"
                            >
                                <div className="flex items-center gap-5">
                                    <div className="w-8 flex justify-center">
                                        {i < 3 ? (
                                            <Trophy size={16} className={i === 0 ? 'text-amber-400' : i === 1 ? 'text-slate-400' : 'text-amber-700'} />
                                        ) : (
                                            <span className="text-xs font-black text-slate-200">#{i+1}</span>
                                        )}
                                    </div>
                                    <div className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center font-black text-xs shadow-md group-hover:bg-emerald-600 transition-colors">{st.name?.[0]}</div>
                                    <div>
                                        <p className="text-[11px] font-black text-slate-800 uppercase leading-none mb-1.5">{st.name}</p>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[7px] font-black text-emerald-600 uppercase tracking-widest px-2 py-0.5 bg-emerald-50 rounded-md">{st.dept}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-6">
                                    <div className="text-right">
                                        <p className="text-lg font-black text-slate-900 leading-none">{st.votes}</p>
                                        <p className="text-[7px] font-black text-slate-300 uppercase tracking-widest mt-1">Total Votes</p>
                                    </div>
                                    <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-inner"><Star size={14} fill="currentColor" className="animate-pulse" /></div>
                                </div>
                            </motion.div>
                        ))
                    ) : (
                        <div className="bg-white rounded-3xl p-16 text-center border border-slate-100">
                            <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">No Activity Recorded in {selectedMonth}</p>
                        </div>
                    )}
                </div>

                <div className="space-y-6">
                    {/* DEPARTMENTAL RANKING */}
                    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-8 h-8 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shadow-sm"><Building2 size={16} /></div>
                            <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Departmental Power</h3>
                        </div>
                        <div className="space-y-4">
                            {deptStats.map(([dept, count], idx) => (
                                <div key={dept} className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <span className="text-[9px] font-black text-slate-300 w-4">#{idx+1}</span>
                                        <p className="text-[10px] font-black text-slate-700 uppercase tracking-tight">{dept}</p>
                                    </div>
                                    <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">{count} v</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-slate-900 p-8 rounded-[3rem] text-white shadow-2xl relative overflow-hidden flex flex-col"
                    >
                        <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-500/10 blur-[100px] rounded-full -mr-20 -mt-20" />
                        <div className="flex items-center justify-between mb-8 relative">
                            <h3 className="text-xs font-black uppercase tracking-widest">Monthly <span className="text-emerald-500">Titans</span></h3>
                            <Award size={18} className="text-emerald-500" />
                        </div>
                        
                        <div className="space-y-4 relative flex-1">
                            {filteredWinners.length > 0 ? (
                                filteredWinners.slice(0, 3).map((w, i) => (
                                    <div key={i} className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 transition-all group">
                                        <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center font-black text-xs text-white group-hover:bg-emerald-600 transition-colors">{w.employee_name?.[0]}</div>
                                        <div>
                                            <p className="text-[10px] font-black uppercase leading-none mb-1.5">{w.employee_name}</p>
                                            <div className="flex items-center gap-1.5">
                                                <Trophy size={8} className="text-emerald-500" />
                                                <p className="text-[7px] font-bold text-slate-400 uppercase tracking-widest">{w.month}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-10 opacity-30">
                                    <p className="text-[9px] font-black uppercase tracking-widest">No Winners Yet</p>
                                </div>
                            )}
                        </div>

                        <div className="mt-8 pt-6 border-t border-white/10 relative text-center">
                            <p className="text-[7px] font-black text-slate-500 uppercase tracking-[0.3em] mb-1">Status Report</p>
                            <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">System Active</p>
                        </div>
                    </motion.div>
                </div>
            </div>
        </motion.div>
    );
};

const SmileWinnersSection = ({ winners, loading, onRefresh, selectedMonth, onMonthChange, availableMonths }) => {
    // Deduplicate winners by name for the same month just in case of data sync issues
    const filtered = useMemo(() => {
        const seen = new Set();
        return (winners || []).filter(w => {
            const m = w.month?.toString().trim();
            if (m !== selectedMonth) return false;
            // Deduplicate same person in same month
            const key = `${w.employee_name}-${m}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });
    }, [winners, selectedMonth]);

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-1">
                <div>
                    <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">Honor <span className="text-emerald-600">Roll</span></h2>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Official Hall of Fame: Monthly Excellence</p>
                </div>
                <div className="flex items-center gap-3">
                    <MonthSelector selectedMonth={selectedMonth} onMonthChange={onMonthChange} availableMonths={availableMonths} />
                    <RefreshButton onRefresh={onRefresh} loading={loading} />
                </div>
            </div>

            {filtered.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {filtered.map((w, i) => (
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.1 }}
                            key={i} 
                            className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm text-center relative group hover:shadow-2xl transition-all overflow-hidden border-b-4 border-b-emerald-500"
                        >
                            {/* Decorative background elements */}
                            <div className="absolute -top-10 -right-10 w-32 h-32 bg-emerald-50 rounded-full blur-2xl group-hover:bg-emerald-100 transition-all duration-700" />
                            <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-emerald-50 rounded-full blur-2xl group-hover:bg-emerald-100 transition-all duration-700" />

                            <div className="absolute -top-4 -right-4 text-emerald-50/30 group-hover:text-emerald-100 transition-colors -rotate-12 transform group-hover:scale-125 duration-700">
                                <Trophy size={120} strokeWidth={1} />
                            </div>
                            
                            <div className="relative z-10">
                                <div className="relative w-24 h-24 mx-auto mb-6">
                                    <div className="absolute inset-0 bg-emerald-500 rounded-[2.5rem] rotate-6 group-hover:rotate-12 transition-transform duration-500 shadow-lg shadow-emerald-100" />
                                    <div className="absolute inset-0 bg-slate-900 text-white rounded-[2.5rem] flex items-center justify-center text-3xl font-black shadow-2xl group-hover:bg-emerald-600 transition-all duration-500 transform group-hover:-rotate-3">
                                        {w.employee_name?.[0]}
                                    </div>
                                    <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center shadow-lg border-2 border-white">
                                        <Star size={14} fill="currentColor" />
                                    </div>
                                </div>

                                <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight mb-2 px-2">{w.employee_name}</h3>
                                <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-50 text-emerald-600 rounded-full mb-4 border border-emerald-100/50">
                                    <Award size={10} fill="currentColor" />
                                    <span className="text-[9px] font-black uppercase tracking-widest">Smile Laureate</span>
                                </div>
                                <div className="pt-4 border-t border-slate-50">
                                    <div className="flex flex-col items-center">
                                        <span className="text-[9px] font-black text-slate-700 uppercase tracking-widest mb-1">{w.department || w.dept}</span>
                                        <div className="flex items-center gap-2">
                                            <div className="h-0.5 w-4 bg-emerald-200" />
                                            <p className="text-[8px] font-black text-emerald-500 uppercase tracking-[0.2em]">{w.month}</p>
                                            <div className="h-0.5 w-4 bg-emerald-200" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            ) : (
                <div className="bg-white rounded-[3rem] p-32 text-center border border-slate-100 shadow-inner relative overflow-hidden">
                     <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.03)_0%,transparent_70%)]" />
                    <div className="relative z-10">
                        <div className="w-20 h-20 bg-emerald-50 text-emerald-200 rounded-3xl flex items-center justify-center mx-auto mb-6">
                            <Trophy size={40} />
                        </div>
                        <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-2">Cycle Ongoing</h4>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">The Hall of Fame for {selectedMonth} is awaiting its champion.</p>
                    </div>
                </div>
            )}
        </motion.div>
    );
};

const HRApprovalPanel = ({ stats, onApprove, winners, loading, onRefresh, selectedMonth, onMonthChange, availableMonths }) => {
    const groupedByDept = useMemo(() => {
        const currentStats = stats.all?.filter(s => s.month === selectedMonth) || [];
        const currentWinners = winners?.filter(w => w.month === selectedMonth) || [];
        
        const approvedDepts = new Set(currentWinners.map(w => (w.department || w.dept || '').toLowerCase().trim()));
        
        const groups = {};
        currentStats.forEach(s => {
            const d = s.dept || 'General';
            if (!groups[d]) groups[d] = [];
            groups[d].push({ ...s, isAlreadyApproved: approvedDepts.has(d.toLowerCase().trim()) });
        });
        
        // Sort candidates within each dept by votes
        Object.keys(groups).forEach(d => {
            groups[d].sort((a, b) => (parseInt(b.votes) || 0) - (parseInt(a.votes) || 0));
        });
        
        return Object.entries(groups).sort((a, b) => a[0].localeCompare(b[0]));
    }, [stats.all, winners, selectedMonth]);

    return (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-1">
                <div>
                    <h2 className="text-xl font-black text-slate-800 uppercase tracking-tighter">Approval <span className="text-emerald-600">Desk</span></h2>
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">Audit Protocol: Votes Ranked by Impact</p>
                </div>
                <div className="flex items-center gap-3">
                    <MonthSelector selectedMonth={selectedMonth} onMonthChange={onMonthChange} availableMonths={availableMonths} />
                    <RefreshButton onRefresh={onRefresh} loading={loading} />
                </div>
            </div>

            <div className="space-y-8">
                {groupedByDept.length > 0 ? (
                    groupedByDept.map(([dept, candidates]) => {
                        const isFinalized = candidates[0].isAlreadyApproved;
                        return (
                            <div key={dept} className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden">
                                <div className={`px-8 py-5 border-b border-slate-50 flex items-center justify-between ${isFinalized ? 'bg-emerald-50/30' : 'bg-slate-50/50'}`}>
                                    <div className="flex items-center gap-3">
                                        <Building2 size={16} className={isFinalized ? 'text-emerald-600' : 'text-slate-400'} />
                                        <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-widest">{dept}</h3>
                                    </div>
                                    {isFinalized && (
                                        <span className="text-[8px] font-black bg-emerald-600 text-white px-4 py-1.5 rounded-full uppercase tracking-widest shadow-lg shadow-emerald-100">Finalized for {selectedMonth}</span>
                                    )}
                                </div>
                                <table className="w-full text-left">
                                    <tbody className="divide-y divide-slate-50">
                                        {candidates.map((w, i) => (
                                            <tr key={i} className={`hover:bg-emerald-50/30 transition-all group ${i === 0 && !isFinalized ? 'bg-emerald-50/10' : ''} ${isFinalized ? 'opacity-60' : ''}`}>
                                                <td className="px-8 py-4">
                                                    <div className="flex items-center gap-4">
                                                        <div className={`w-10 h-10 ${i === 0 ? 'bg-emerald-600' : 'bg-slate-900'} text-white rounded-xl flex items-center justify-center font-black text-[11px] shadow-md group-hover:scale-110 transition-transform`}>
                                                            {i === 0 ? <Star size={14} fill="currentColor" /> : w.name?.[0]}
                                                        </div>
                                                        <div>
                                                            <p className="text-[11px] font-black text-slate-800 uppercase leading-none mb-1">{w.name}</p>
                                                            <p className="text-[7px] font-bold text-slate-400 uppercase tracking-widest">Candidate #{i+1} {i === 0 && '• LEADER'}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-4 text-center">
                                                    <span className={`text-xs font-black ${i === 0 ? 'text-emerald-600 bg-emerald-50' : 'text-slate-600 bg-slate-50'} px-4 py-1.5 rounded-full shadow-inner border border-black/5`}>{w.votes} votes</span>
                                                </td>
                                                <td className="px-8 py-4 text-right">
                                                    {!isFinalized && (
                                                        <motion.button 
                                                            whileHover={{ scale: 1.05 }}
                                                            whileTap={{ scale: 0.95 }}
                                                            onClick={() => {
                                                                if(window.confirm(`Approve ${w.name} as Smile Award Winner for ${w.month} in ${dept}?`)) {
                                                                    onApprove(w);
                                                                }
                                                            }}
                                                            className={`px-6 py-2.5 ${i === 0 ? 'bg-emerald-600' : 'bg-slate-900'} text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all shadow-lg hover:brightness-110`}
                                                        >
                                                            Authorize Award
                                                        </motion.button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        );
                    })
                ) : (
                    <div className="bg-white rounded-[3rem] p-24 text-center border border-slate-100 shadow-inner">
                        <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest leading-relaxed">No candidates have been nominated<br/>for the {selectedMonth} cycle yet.</p>
                    </div>
                )}
            </div>
        </motion.div>
    );
};

// --- EMPLOYEE ROSTER (STRUCTURALLY FIXED) ---

const EmployeeRoster = ({ staffList, smileScriptUrl, fetchStaff, loading, userRole }) => {
    const [submitting, setSubmitting] = useState(false);
    const [showDeleteSuccess, setShowDeleteSuccess] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 15;
    const [formData, setFormData] = useState({ staffId: '', name: '', mobile: '', email: '', birthday: '', anniversary: '', department: '', role: '', dol: '' });

    const isAdmin = userRole === 'SBH';

    const filteredStaff = useMemo(() => {
        return (staffList || []).filter(s => {
            const search = searchTerm.toLowerCase();
            return (
                (getVal(s, 'Name')).toLowerCase().includes(search) ||
                (getVal(s, 'Staff_ID')).toLowerCase().includes(search) ||
                (getVal(s, 'Mobile')).toLowerCase().includes(search) ||
                (getVal(s, 'Email')).toLowerCase().includes(search)
            );
        });
    }, [staffList, searchTerm]);

    const paginatedStaff = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filteredStaff.slice(start, start + itemsPerPage);
    }, [filteredStaff, currentPage]);

    useEffect(() => { setCurrentPage(1); }, [searchTerm]);

    const handleEdit = (s) => {
        setFormData({
            staffId: getVal(s, 'Staff_ID') || getVal(s, 'staffId'),
            name: getVal(s, 'Name') || getVal(s, 'name'),
            mobile: getVal(s, 'Mobile') || getVal(s, 'mobile'),
            email: getVal(s, 'Email') || getVal(s, 'email'),
            birthday: toFormDate(getVal(s, 'Birthday') || getVal(s, 'birthday')),
            anniversary: toFormDate(getVal(s, 'Anniversary') || getVal(s, 'anniversary')),
            department: getVal(s, 'Department') || getVal(s, 'department'),
            role: getVal(s, 'Role') || getVal(s, 'role'),
            dol: toFormDate(getVal(s, 'DOL') || getVal(s, 'dol'))
        });
        setShowModal(true);
    };

    const handleDelete = async (staffId) => {
        if (!staffId) return;
        if (!window.confirm("ARE YOU SURE YOU WANT TO DELETE THIS STAFF MEMBER?")) return;
        setSubmitting(true);
        try {
            await fetch(smileScriptUrl, {
                method: 'POST',
                mode: 'no-cors',
                headers: { 'Content-Type': 'text/plain' },
                body: JSON.stringify({ action: 'delete_staff', staffId })
            });
            setTimeout(() => {
                fetchStaff();
                setSubmitting(false);
                setShowDeleteSuccess(true);
            }, 800);
        } catch (e) {
            alert("Delete failed.");
            setSubmitting(false);
        }
    };

    const handleNew = () => {
        setFormData({ staffId: '', name: '', mobile: '', email: '', birthday: '', anniversary: '', department: '', role: '', dol: '' });
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await fetch(smileScriptUrl, {
                method: 'POST',
                mode: 'no-cors',
                headers: { 'Content-Type': 'text/plain' },
                body: JSON.stringify({ action: formData.staffId ? 'edit_staff' : 'add_staff', ...formData })
            });
            setShowModal(false);
            setTimeout(() => {
                fetchStaff();
                alert("Roster Updated!");
                setSubmitting(false);
            }, 800);
        } catch (e) {
            alert("Sync Failed.");
            setSubmitting(false);
        }
    };

    return (
        <div className="space-y-4 pb-10">
            <div className="px-1 flex flex-col xl:flex-row justify-between xl:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">Workforce <span className="text-orange-600">Ledger</span></h2>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">Manage employee records and automated alerts</p>
                </div>
                
                <div className="flex flex-col sm:flex-row items-center gap-3">
                    <div className="relative w-full sm:w-64 group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-orange-600 transition-colors" size={14} />
                        <input 
                            type="text"
                            placeholder="Search staff..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-white border border-slate-100 pl-10 pr-4 py-2.5 rounded-xl font-bold text-[11px] outline-none focus:border-orange-500/20 shadow-sm"
                        />
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <RefreshButton onRefresh={fetchStaff} loading={loading} />
                        <button onClick={handleNew} className="px-6 py-2.5 bg-orange-600 text-white rounded-xl font-black uppercase text-[9px] tracking-widest shadow-lg shadow-orange-100 flex items-center justify-center gap-2 hover:bg-slate-900 transition-all">
                            <Plus size={14}/> Add New
                        </button>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl overflow-hidden">
                <div className="max-h-[600px] overflow-y-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse table-fixed min-w-[900px]">
                        <thead className="bg-slate-50/80 sticky top-0 z-10 border-b border-slate-100">
                            <tr className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                                <th className="px-6 py-4 w-[25%]">Employee Identity</th>
                                <th className="px-6 py-4 w-[15%]">Dept & Role</th>
                                <th className="px-6 py-4 w-[20%]">DOB & Joining</th>
                                <th className="px-6 py-4 w-[20%]">Communication</th>
                                <th className="px-6 py-4 w-[10%] text-center">Status</th>
                                <th className="px-6 py-4 w-[10%] text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                             {paginatedStaff.map((s, i) => (
                                <tr key={i} className={`hover:bg-slate-50/50 transition-all group ${getVal(s, 'DOL') ? 'opacity-40 bg-slate-50/20' : ''}`}>
                                    <td className="px-6 py-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-orange-500 group-hover:text-white transition-all"><User size={14} /></div>
                                            <div>
                                                <p className="text-[11px] font-black text-slate-800 uppercase leading-none mb-1">{getVal(s, 'Name')}</p>
                                                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{getVal(s, 'Staff_ID')}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-3">
                                        <p className="text-[9px] font-black text-slate-600 uppercase mb-0.5">{getVal(s, 'Department')}</p>
                                        <p className="text-[8px] text-orange-600 font-bold uppercase tracking-widest">{getVal(s, 'Role') || 'Staff'}</p>
                                    </td>
                                    <td className="px-6 py-3">
                                        <div className="space-y-0.5">
                                            <p className="text-[9px] font-black text-slate-800 uppercase flex items-center gap-1.5"><Cake size={10} className="text-orange-500" /> {formatDateStrict(getVal(s, 'Birthday'))}</p>
                                            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5"><Calendar size={10} className="text-slate-300" /> Joined {formatDateStrict(getVal(s, 'Anniversary'))}</p>
                                        </div>
                                    </td>
                                    <td className="px-6 py-3">
                                        <div className="space-y-0.5">
                                            <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-600"><Phone size={10} className="text-slate-300" /> {getVal(s, 'Mobile')}</div>
                                            <div className="flex items-center gap-1.5 text-[8px] font-medium text-slate-400"><Mail size={10} className="text-slate-300" /> {getVal(s, 'Email')}</div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-3 text-center">
                                        {getVal(s, 'DOL') ? (
                                            <span className="px-2 py-0.5 bg-rose-50 text-rose-600 rounded text-[7px] font-black uppercase tracking-widest">Relieved</span>
                                        ) : (
                                            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded text-[7px] font-black uppercase tracking-widest">Active</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-3 text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            <button 
                                                onClick={() => handleEdit(s)}
                                                className="p-2 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-all"
                                            >
                                                <Edit3 size={14} />
                                            </button>
                                            {isAdmin && (
                                                <button 
                                                    onClick={() => handleDelete(getVal(s, 'Staff_ID'))}
                                                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                                                >
                                                    <Trash size={14} />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <Pagination 
                totalItems={filteredStaff.length} 
                itemsPerPage={itemsPerPage} 
                currentPage={currentPage} 
                onPageChange={setCurrentPage} 
            />

            {showModal && (
                <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
                    <div 
                        onClick={() => setShowModal(false)}
                        className="absolute inset-0 bg-slate-900/60"
                    />
                    <div className="bg-white w-full max-w-lg rounded-[2rem] shadow-2xl relative overflow-hidden flex flex-col max-h-[85vh]">
                            <div className="px-6 py-4 border-b border-slate-50 flex items-center justify-between shrink-0 bg-white">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-orange-600 text-white rounded-lg flex items-center justify-center shadow-lg">
                                        {formData.staffId ? <Edit3 size={14} /> : <Plus size={14} />}
                                    </div>
                                    <div>
                                        <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-tighter leading-none">{formData.staffId ? 'Edit Profile' : 'Add Staff'}</h3>
                                        <p className="text-[7px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{formData.staffId ? `ID: ${formData.staffId}` : 'New Roster Entry'}</p>
                                    </div>
                                </div>
                                <button onClick={() => setShowModal(false)} className="p-2 bg-slate-50 text-slate-400 rounded-lg hover:bg-slate-100"><X size={16}/></button>
                            </div>

                            <div className="p-6 overflow-y-auto custom-scrollbar bg-white">
                                <form id="staff-form" onSubmit={handleSubmit} className="space-y-5">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-[8px] font-black uppercase text-slate-400 ml-1">Full Name</label>
                                            <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-slate-50 p-3.5 rounded-xl font-bold text-[10px] outline-none border-2 border-transparent focus:border-orange-500/10 focus:bg-white" placeholder="Name"/>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[8px] font-black uppercase text-slate-400 ml-1">WhatsApp No.</label>
                                            <input required value={formData.mobile} onChange={e => setFormData({...formData, mobile: e.target.value})} className="w-full bg-slate-50 p-3.5 rounded-xl font-bold text-[10px] outline-none border-2 border-transparent focus:border-orange-500/10 focus:bg-white" placeholder="Phone"/>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-[8px] font-black uppercase text-slate-400 ml-1">Department</label>
                                            <input required value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})} className="w-full bg-slate-50 p-3.5 rounded-xl font-bold text-[10px] outline-none border-2 border-transparent focus:border-orange-500/10 focus:bg-white" placeholder="Dept"/>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[8px] font-black uppercase text-slate-400 ml-1">Role</label>
                                            <input required value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} className="w-full bg-slate-50 p-3.5 rounded-xl font-bold text-[10px] outline-none border-2 border-transparent focus:border-orange-500/10 focus:bg-white" placeholder="Role"/>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-[8px] font-black uppercase text-slate-400 ml-1">Birthday</label>
                                            <input type="date" value={formData.birthday} onChange={e => setFormData({...formData, birthday: e.target.value})} className="w-full bg-slate-50 p-3.5 rounded-xl font-bold text-[10px] outline-none border-2 border-transparent focus:border-orange-500/10 focus:bg-white"/>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[8px] font-black uppercase text-slate-400 ml-1">Joining Date</label>
                                            <input type="date" value={formData.anniversary} onChange={e => setFormData({...formData, anniversary: e.target.value})} className="w-full bg-slate-50 p-3.5 rounded-xl font-bold text-[10px] outline-none border-2 border-transparent focus:border-orange-500/10 focus:bg-white"/>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-[8px] font-black uppercase text-slate-400 ml-1">Email</label>
                                            <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full bg-slate-50 p-3.5 rounded-xl font-bold text-[10px] outline-none border-2 border-transparent focus:border-orange-500/10 focus:bg-white" placeholder="Email"/>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[8px] font-black uppercase text-rose-400 ml-1">Exit Date</label>
                                            <input type="date" value={formData.dol} onChange={e => setFormData({...formData, dol: e.target.value})} className="w-full bg-rose-50/50 p-3.5 rounded-xl font-bold text-[10px] outline-none border-2 border-transparent focus:border-rose-500/10 focus:bg-white"/>
                                        </div>
                                    </div>
                                </form>
                            </div>

                            <div className="p-6 border-t border-slate-50 flex items-center justify-end gap-3 shrink-0 bg-slate-50/50">
                                <button onClick={() => setShowModal(false)} className="px-4 py-2 text-[8px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600">Discard</button>
                                <button form="staff-form" type="submit" disabled={submitting} className="px-6 py-3 bg-slate-900 text-white rounded-xl font-black text-[8px] uppercase tracking-widest shadow-lg hover:bg-orange-600 flex items-center gap-2 disabled:opacity-50">
                                    {submitting ? <Loader2 className="animate-spin" size={12} /> : <Save size={12} />}
                                    {submitting ? 'Syncing...' : 'Save Profile'}
                                </button>
                            </div>
                    </div>
                </div>
            )}

            <SuccessModal 
                isOpen={showDeleteSuccess} 
                onClose={() => setShowDeleteSuccess(false)}
                title="Staff Deleted"
                subtitle="Roster Pruned"
                message="The employee record has been permanently removed from the SBH Central Roster."
            />
        </div>
    );
};

const PrintQRSection = () => {
    const PUBLIC_URL = "https://lasik-feedback.vercel.app/public"; // Adjust this to your actual production domain
    
    const qrData = [
        { id: 'smile', label: 'Smile Award', sub: 'Nomination Portal', type: 'smile_award', color: 'bg-emerald-600' },
        { id: 'lasik', label: 'Lasik Feedback', sub: 'Patient Experience', type: 'lasik', color: 'bg-orange-600' },
        { id: 'staff', label: 'Staff Roster', sub: 'Onboarding Portal', type: 'register', color: 'bg-slate-900' }
    ];

    const downloadQR = (url, label) => {
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=1000x1000&data=${encodeURIComponent(url)}`;
        fetch(qrUrl)
            .then(response => response.blob())
            .then(blob => {
                const link = document.createElement('a');
                link.href = URL.createObjectURL(blob);
                link.download = `SBH_QR_${label.replace(/\s+/g, '_')}.png`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            });
    };

    return (
        <div className="space-y-10 pb-20">
            <div className="px-1">
                <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">QR <span className="text-orange-600">Manager</span></h2>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">Central Distribution Hub for Public Access</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {qrData.map(qr => {
                    const finalUrl = `${PUBLIC_URL}?type=${qr.type}`;
                    return (
                        <motion.div 
                            key={qr.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-xl text-center group hover:shadow-2xl transition-all"
                        >
                            <div className="relative mb-8">
                                <div className="absolute inset-0 bg-slate-50 rounded-[2.5rem] transform rotate-3 group-hover:rotate-6 transition-transform" />
                                <div className="relative bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col items-center gap-4">
                                    <img 
                                        src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(finalUrl)}`}
                                        alt={qr.label}
                                        className="w-40 h-40 object-contain"
                                    />
                                </div>
                            </div>
                            
                            <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight mb-1">{qr.label}</h3>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-6">{qr.sub}</p>
                            
                            <div className="space-y-3">
                                <button 
                                    onClick={() => downloadQR(finalUrl, qr.label)}
                                    className={`w-full py-4 ${qr.color} text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg hover:brightness-110 flex items-center justify-center gap-3 transition-all active:scale-95`}
                                >
                                    <Download size={14} /> Download HQ
                                </button>
                                <a 
                                    href={finalUrl} 
                                    target="_blank" 
                                    rel="noreferrer"
                                    className="block text-[8px] font-black text-slate-400 uppercase tracking-widest hover:text-orange-600 transition-colors"
                                >
                                    Preview Link
                                </a>
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
};

const CelebrationsSection = ({ staffList, smileScriptUrl, loading, onRefresh }) => {
    const events = useMemo(() => {
        if (!staffList) return [];
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        
        const rawEvents = staffList.flatMap(s => {
            const bRaw = getVal(s, 'Birthday');
            const aRaw = getVal(s, 'Anniversary');
            const items = [];
            
            if (bRaw) {
                const b = parseDateLocal(bRaw);
                if (b) {
                    b.setFullYear(today.getFullYear());
                    let diff = Math.ceil((b - today) / (1000 * 60 * 60 * 24));
                    if (diff < 0 && diff > -330) b.setFullYear(today.getFullYear() + 1);
                    diff = Math.ceil((b - today) / (1000 * 60 * 60 * 24));
                    if (diff >= 0 && diff <= 30) {
                        items.push({ 
                            type: 'BIRTHDAY', 
                            name: getVal(s, 'Name'), 
                            mobile: getVal(s, 'Mobile'),
                            email: getVal(s, 'Email'),
                            days: diff, 
                            date: bRaw 
                        });
                    }
                }
            }

            if (aRaw) {
                const a = parseDateLocal(aRaw);
                if (a) {
                    a.setFullYear(today.getFullYear());
                    let diff = Math.ceil((a - today) / (1000 * 60 * 60 * 24));
                    if (diff < 0 && diff > -330) a.setFullYear(today.getFullYear() + 1);
                    diff = Math.ceil((a - today) / (1000 * 60 * 60 * 24));
                    if (diff >= 0 && diff <= 30) {
                        items.push({ 
                            type: 'ANNIVERSARY', 
                            name: getVal(s, 'Name'), 
                            mobile: getVal(s, 'Mobile'),
                            email: getVal(s, 'Email'),
                            days: diff, 
                            date: aRaw 
                        });
                    }
                }
            }
            return items;
        });

        return rawEvents.sort((a, b) => a.days - b.days);
    }, [staffList]);

    const [sendingWish, setSendingWish] = useState({});

    const handleWish = async (ev, channel) => {
        const wishKey = `${ev.name}_${channel}`;
        setSendingWish(prev => ({ ...prev, [wishKey]: true }));
        
        try {
            await fetch(smileScriptUrl, {
                method: 'POST',
                mode: 'no-cors',
                headers: { 'Content-Type': 'text/plain' },
                body: JSON.stringify({
                    action: 'send_manual_reminder',
                    channel: channel.toUpperCase(),
                    type: ev.type,
                    name: ev.name,
                    mobile: ev.mobile,
                    email: ev.email,
                    years: ev.years || 1
                })
            });
            alert(`Official ${channel.toUpperCase()} Protocol finalized for ${ev.name}.`);
        } catch (err) {
            alert("Communication node failed.");
        } finally {
            setSendingWish(prev => ({ ...prev, [wishKey]: false }));
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between px-1">
                <div>
                    <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">Event <span className="text-orange-600">Horizon</span></h2>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Upcoming Milestone Protocol</p>
                </div>
                <RefreshButton onRefresh={onRefresh} loading={loading} />
            </div>
            {events.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {events.map((ev, i) => (
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                            key={i} 
                            className={`p-8 rounded-[2.5rem] border relative overflow-hidden transition-all group ${ev.days === 0 ? 'bg-orange-500 border-orange-400 shadow-2xl shadow-orange-200' : 'bg-white border-slate-100 shadow-sm hover:shadow-xl'}`}
                        >
                            {ev.days === 0 && <div className="absolute top-0 right-0 p-4"><Star className="text-white animate-spin-slow" size={20} fill="currentColor" /></div>}
                            
                            <div className="relative z-10">
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 shadow-lg ${ev.days === 0 ? 'bg-white text-orange-600' : 'bg-orange-50 text-orange-600'}`}>
                                    {ev.type === 'BIRTHDAY' ? <Cake size={24} /> : <Trophy size={24} />}
                                </div>

                                <div className="space-y-1 mb-6">
                                    <h3 className={`text-sm font-black uppercase tracking-tight ${ev.days === 0 ? 'text-white' : 'text-slate-900'}`}>{ev.name}</h3>
                                    <p className={`text-[10px] font-bold uppercase tracking-widest ${ev.days === 0 ? 'text-white/80' : 'text-orange-600'}`}>
                                        {ev.type === 'BIRTHDAY' ? 'Birthday' : 'Work Anniversary'}
                                    </p>
                                </div>

                                <div className={`p-4 rounded-2xl mb-6 flex items-center justify-between ${ev.days === 0 ? 'bg-white/10 border border-white/20' : 'bg-slate-50 border border-slate-100'}`}>
                                    <div>
                                        <p className={`text-[8px] font-black uppercase tracking-widest mb-1 ${ev.days === 0 ? 'text-white/60' : 'text-slate-400'}`}>Event Date</p>
                                        <p className={`text-[10px] font-black uppercase ${ev.days === 0 ? 'text-white' : 'text-slate-800'}`}>{formatDateStrict(ev.date)}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className={`text-[8px] font-black uppercase tracking-widest mb-1 ${ev.days === 0 ? 'text-white/60' : 'text-slate-400'}`}>Timeline</p>
                                        <p className={`text-[10px] font-black uppercase ${ev.days === 0 ? 'text-white' : 'text-orange-600'}`}>
                                            {ev.days === 0 ? 'Happening Now' : `${ev.days} Days Away`}
                                        </p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <button 
                                        disabled={sendingWish[`${ev.name}_whatsapp`]}
                                        onClick={() => handleWish(ev, 'whatsapp')}
                                        className={`flex items-center justify-center gap-2 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${ev.days === 0 ? 'bg-white text-orange-600 hover:bg-slate-900 hover:text-white' : 'bg-emerald-600 text-white hover:bg-slate-900'} disabled:opacity-50`}
                                    >
                                        {sendingWish[`${ev.name}_whatsapp`] ? <Loader2 size={14} className="animate-spin" /> : <><MessageCircle size={14} /> WhatsApp</>}
                                    </button>
                                    <button 
                                        disabled={sendingWish[`${ev.name}_email`]}
                                        onClick={() => handleWish(ev, 'email')}
                                        className={`flex items-center justify-center gap-2 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${ev.days === 0 ? 'bg-white/20 text-white border border-white/30 hover:bg-white/40' : 'bg-slate-900 text-white hover:bg-orange-600'} disabled:opacity-50`}
                                    >
                                        {sendingWish[`${ev.name}_email`] ? <Loader2 size={14} className="animate-spin" /> : <><Mail size={14} /> Email</>}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            ) : (
                <div className="bg-white rounded-[3rem] p-24 text-center border border-slate-100 shadow-inner relative overflow-hidden">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(245,158,11,0.03)_0%,transparent_70%)]" />
                    <div className="relative z-10">
                        <div className="w-20 h-20 bg-orange-50 text-orange-200 rounded-3xl flex items-center justify-center mx-auto mb-6">
                            <Calendar size={40} />
                        </div>
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-2">No Imminent Milestones</h4>
                        <p className="text-[11px] font-bold text-slate-300 uppercase tracking-widest">Horizon clear for the next 30 days.</p>
                    </div>
                </div>
            )}
        </div>
    );
};

const StaffRegistrationForm = ({ onComplete }) => {
    const [formData, setFormData] = useState({ name: '', mobile: '', email: '', dob: '', doj: '' });
    const [isVerified, setIsVerified] = useState(false);
    const [loading, setLoading] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        if (!isVerified) return alert("Security Verification Failed!");
        setLoading(true);
        try {
            await fetch('https://script.google.com/macros/s/AKfycbyHNF4Yzqvh6Copcl2aL1XyWZEyBSeoaxXz277xFbkPOqPOB-Fy7tNzDpMmFimHf2kGyg/exec', {
                method: 'POST',
                mode: 'no-cors',
                headers: { 'Content-Type': 'text/plain' },
                body: JSON.stringify({
                    action: 'add_staff',
                    ...formData,
                    birthday: formData.dob,
                    anniversary: formData.doj
                })
            });
            setShowSuccess(true);
        } catch (err) {
            alert("Roster connection failed.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-xl mx-auto py-10">
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl overflow-hidden relative">
                <div className="p-10 md:p-12">
                    <div className="flex flex-col items-center text-center mb-10">
                        <div className="w-16 h-16 bg-white p-3 rounded-2xl shadow-xl border border-slate-50 mb-6">
                            <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
                        </div>
                        <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Staff <span className="text-orange-600">Onboarding</span></h1>
                        <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-[0.2em]">Official Specialist Roster Protocol</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                                <input required value={formData.name} onChange={e=>setFormData({...formData, name:e.target.value})} className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-900 outline-none focus:bg-white focus:border-orange-500 transition-all text-xs" placeholder="Naman Mishra" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">WhatsApp No.</label>
                                <input required value={formData.mobile} onChange={e=>setFormData({...formData, mobile:e.target.value})} className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-900 outline-none focus:bg-white focus:border-orange-500 transition-all text-xs" placeholder="10 Digits" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Internal Email</label>
                            <input type="email" value={formData.email} onChange={e=>setFormData({...formData, email:e.target.value})} className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-900 outline-none focus:bg-white focus:border-orange-500 transition-all text-xs" placeholder="name@sbh.com" />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Date of Birth</label>
                                <input required type="date" value={formData.dob} onChange={e=>setFormData({...formData, dob:e.target.value})} className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-900 outline-none focus:bg-white focus:border-orange-500 transition-all text-xs" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Joining Date</label>
                                <input required type="date" value={formData.doj} onChange={e=>setFormData({...formData, doj:e.target.value})} className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-900 outline-none focus:bg-white focus:border-orange-500 transition-all text-xs" />
                            </div>
                        </div>

                        <MathCaptcha onVerify={setIsVerified} />

                        <button 
                            disabled={loading || !isVerified} 
                            type="submit"
                            className="w-full py-5 bg-slate-900 text-white text-[10px] font-black rounded-2xl shadow-xl flex items-center justify-center gap-3 uppercase tracking-widest hover:bg-orange-600 transition-all disabled:opacity-50"
                        >
                            {loading ? <Loader2 size={16} className="animate-spin" /> : <><Send size={14}/> Finalize Registration</>}
                        </button>
                    </form>
                </div>
            </div>

            <SuccessModal 
                isOpen={showSuccess} 
                onClose={() => { setShowSuccess(false); if(onComplete) onComplete(); }}
                title="Protocol Active"
                subtitle="Central Roster Updated"
                message="Welcome to the SBH Specialist Roster. Your credentials have been synchronized across all hospital systems."
            />
        </div>
    );
};

// --- MAIN DASHBOARD COMPONENT ---

const SheetDashboard = ({ user, onLogout, isPublic, publicType }) => {
    const [activeTab, setActiveTab] = useState(() => {
        if (isPublic) {
            if (publicType === 'smile_award') return 'SMILE_FORM';
            if (publicType === 'register') return 'STAFF_REGISTER';
            if (publicType === 'lasik') return 'LASIK_FORM';
            if (publicType === 'visiting_update') return 'VISITING_UPDATE';
            return 'SMILE_FORM';
        }
        if (user === 'ACCOUNT') return 'SBH_FAMILY_DASHBOARD';
        return 'SMILE_LEADERBOARD';
    });

    const [loading, setLoading] = useState(true);
    const [smileStats, setSmileStats] = useState({ all: [] });
    const [smileWinnersList, setSmileWinnersList] = useState([]);
    const [smileEntriesList, setSmileEntriesList] = useState([]);
    const [staffList, setStaffList] = useState([]);
    const [lasikData, setLasikData] = useState([]);
    const [selectedMonth, setSelectedMonth] = useState(new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' }));
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [openCategories, setOpenCategories] = useState({ smile: true, employees: false, lasik: false, accounting: user === 'ACCOUNT' });

    const toggleCategory = (cat) => {
        setOpenCategories(prev => {
            const newState = { smile: false, employees: false, lasik: false, accounting: false };
            newState[cat] = !prev[cat];
            return newState;
        });
    };

    const smileScriptUrl = 'https://script.google.com/macros/s/AKfycbyHNF4Yzqvh6Copcl2aL1XyWZEyBSeoaxXz277xFbkPOqPOB-Fy7tNzDpMmFimHf2kGyg/exec';
    const visitingScriptUrl = 'https://script.google.com/macros/s/AKfycbxAk2UQhkJbtQh0V9gjfs7kzFjUa59XnCKlQMQsgkRNrYDvqD5wtHi_0HUuit_tENalGw/exec';
    const sbhFamilyScriptUrl = 'https://script.google.com/macros/s/AKfycbxlKMT0rLe4QpbLl8x_Pm8blS8yCvWsvKMTz1_tozd94bju0Z8eEJ4lDz_1pnAmav_O/exec';
    const lasikScriptUrl = 'https://script.google.com/macros/s/AKfycbxuFDz3LDBM88Wy-7naDgffvXQ0hH37-EMQhJuMcUId40PNG5yX_PFZLyXXiGYMB0zQ/exec';

    const fetchData = async () => {
        setLoading(true);
        try {
            const fetchJson = async (url) => { try { const r = await fetch(url); return await r.json(); } catch (e) { return []; } };
            const [leaderboard, winners, staff, lasik, entries] = await Promise.all([
                fetchJson(`${smileScriptUrl}?action=get_leaderboard`),
                fetchJson(`${smileScriptUrl}?action=get_winners`),
                fetchJson(`${smileScriptUrl}?action=get_staff`),
                fetchJson(lasikScriptUrl),
                fetchJson(`${smileScriptUrl}?action=get_entries`)
            ]);
            setSmileStats({ all: Array.isArray(leaderboard) ? leaderboard : [] });
            setSmileWinnersList(Array.isArray(winners) ? winners : []);
            setStaffList(Array.isArray(staff) ? staff : []);
            setLasikData(Array.isArray(lasik) ? lasik : []);
            setSmileEntriesList(Array.isArray(entries) ? entries : []);
        } catch (err) {
            console.error('Data fetch error:', err);
        }
        setLoading(false);
    };

    useEffect(() => { fetchData(); }, []);

    const handleNavClick = (tab) => { setActiveTab(tab); if (window.innerWidth < 1024) setIsSidebarOpen(false); };

    const [lasikPage, setLasikPage] = useState(1);
    const lasikItemsPerPage = 10;
    const paginatedLasik = useMemo(() => {
        const start = (lasikPage - 1) * lasikItemsPerPage;
        return lasikData.slice(start, start + lasikItemsPerPage);
    }, [lasikData, lasikPage]);

    const availableMonths = useMemo(() => {
        const months = new Set();
        smileWinnersList.forEach(w => w.month && months.add(w.month.toString().trim()));
        smileStats.all.forEach(s => s.month && months.add(s.month.toString().trim()));
        smileEntriesList.forEach(e => e.month && months.add(e.month.toString().trim()));
        const sorted = Array.from(months).sort((a, b) => {
            const d1 = new Date(a);
            const d2 = new Date(b);
            return d2 - d1;
        });
        return sorted;
    }, [smileWinnersList, smileStats.all, smileEntriesList]);

    return (
        <div className="min-h-screen bg-[#F8FAFC] flex font-sans overflow-x-hidden">
            {!isPublic && (
                <aside className={`fixed top-0 left-0 h-full w-60 bg-slate-50 border-r border-slate-200 z-[110] flex flex-col lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full shadow-2xl'} transition-transform duration-300 ease-in-out`}>
                    <div className="h-20 flex items-center justify-between px-6 border-b border-violet-50 mb-4 bg-white/30 shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center p-1.5 border border-[#dcdcdc] shadow-sm">
                                <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
                            </div>
                            <span className="font-bold text-lg text-emerald-950 tracking-tight uppercase">
                                SBH <span className="text-orange-600">CORE</span>
                            </span>
                        </div>
                        <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden ml-auto p-1.5 text-emerald-500 hover:text-white transition-none"><X size={14}/></button>
                    </div>
                    <div className="p-3 flex-1 space-y-1 overflow-y-auto custom-scrollbar">
                        <CollapsibleCategory icon={<Award />} label="Smile Award" isOpen={openCategories.smile} onToggle={() => toggleCategory('smile')}>
                            <NavItem icon={<Plus />} label="Cast Nomination" active={activeTab === 'SMILE_FORM'} onClick={() => handleNavClick('SMILE_FORM')} />
                            <NavItem icon={<ClipboardList />} label="Nomination Ledger" active={activeTab === 'SMILE_ENTRIES'} onClick={() => handleNavClick('SMILE_ENTRIES')} />
                            <NavItem icon={<TrendingUp />} label="Leader Board" active={activeTab === 'SMILE_LEADERBOARD'} onClick={() => handleNavClick('SMILE_LEADERBOARD')} />
                            <NavItem icon={<Trophy />} label="Honor Roll" active={activeTab === 'SMILE_WINNERS'} onClick={() => handleNavClick('SMILE_WINNERS')} />
                            {(user === 'SBH' || user === 'SBH HRD') && (
                                <NavItem icon={<CheckCircle2 />} label="Approval Desk" active={activeTab === 'HR_PANEL'} onClick={() => handleNavClick('HR_PANEL')} />
                            )}
                        </CollapsibleCategory>
                        <CollapsibleCategory icon={<Users />} label="Workforce" isOpen={openCategories.employees} onToggle={() => toggleCategory('employees')}>
                            <NavItem icon={<Users />} label="Staff Roster" active={activeTab === 'EMPLOYEE_ROSTER'} onClick={() => handleNavClick('EMPLOYEE_ROSTER')} />
                            <NavItem icon={<Scan />} label="QR Manager" active={activeTab === 'PRINT_QR'} onClick={() => handleNavClick('PRINT_QR')} />
                            <NavItem icon={<Cake />} label="Celebrations" active={activeTab === 'CELEBRATIONS'} onClick={() => handleNavClick('CELEBRATIONS')} />
                        </CollapsibleCategory>
                        <CollapsibleCategory icon={<ClipboardList />} label="Lasik Section" isOpen={openCategories.lasik} onToggle={() => toggleCategory('lasik')}>
                            <NavItem icon={<Edit3 />} label="Lasik Form" active={activeTab === 'LASIK_FORM'} onClick={() => handleNavClick('LASIK_FORM')} />
                            <NavItem icon={<BarChart3 />} label="Feedback Data" active={activeTab === 'LASIK_DATA'} onClick={() => handleNavClick('LASIK_DATA')} />
                        </CollapsibleCategory>
                        <CollapsibleCategory icon={<IndianRupee />} label="Accounting" isOpen={openCategories.accounting} onToggle={() => toggleCategory('accounting')}>
                            <NavItem icon={<Users />} label="SBH Family" active={activeTab === 'SBH_FAMILY_DASHBOARD'} onClick={() => handleNavClick('SBH_FAMILY_DASHBOARD')} />
                            <NavItem icon={<IndianRupee />} label="Visiting" active={activeTab === 'VISITING_DASHBOARD'} onClick={() => handleNavClick('VISITING_DASHBOARD')} />
                        </CollapsibleCategory>
                        
                        <div className="pt-4 border-t border-white/5">
                            <p className="text-[7px] font-black text-slate-600 uppercase tracking-widest px-5 mb-2">Management</p>
                            <button onClick={onLogout} className="w-full flex items-center gap-3 px-5 py-2.5 text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all group">
                                <LogOut size={13} className="opacity-70 group-hover:opacity-100" />
                                <span className="text-[8px] font-black uppercase tracking-widest leading-none">Sign Out System</span>
                            </button>
                        </div>
                    </div>
                </aside>
            )}

            <div className={`flex-1 flex flex-col min-w-0 transition-none ${!isPublic ? 'lg:ml-60' : ''}`}>
                <header className="h-14 bg-white/80 backdrop-blur-md border-b border-slate-100 px-8 flex items-center justify-between sticky top-0 z-[100]">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-2 text-slate-500 hover:bg-slate-50 rounded-xl transition-all"><Activity size={20}/></button>
                        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-lg border border-slate-100">
                            <div className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
                            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Core Engine Active</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="text-right hidden sm:block">
                            <p className="text-[10px] font-black text-slate-900 uppercase leading-none">{user}</p>
                            <p className="text-[7px] font-bold text-slate-400 uppercase tracking-widest mt-1">Authorized Terminal</p>
                        </div>
                        <div className="w-8 h-8 bg-slate-900 text-white rounded-lg flex items-center justify-center text-xs font-black shadow-lg shadow-slate-200">{user?.[0]}</div>
                    </div>
                </header>

                <main className="flex-1 p-4 lg:p-8">
                    <div className="w-full">
                        {activeTab === 'SMILE_ENTRIES' && <SmileEntriesSection entries={smileEntriesList} onOpenForm={() => handleNavClick('SMILE_FORM')} loading={loading} onRefresh={fetchData} selectedMonth={selectedMonth} onMonthChange={setSelectedMonth} availableMonths={availableMonths} />}
                        {activeTab === 'SMILE_FORM' && <SmileAwardFormSection key="form" staffList={staffList} smileScriptUrl={smileScriptUrl} onSubmissionSuccess={() => { fetchData(); if(!isPublic) handleNavClick('SMILE_ENTRIES'); }} />}
                        {activeTab === 'SMILE_LEADERBOARD' && <SmileLeaderboardSection key="stats" stats={smileStats} winners={smileWinnersList} selectedMonth={selectedMonth} onMonthChange={setSelectedMonth} loading={loading} onRefresh={fetchData} availableMonths={availableMonths} />}
                        {activeTab === 'SMILE_WINNERS' && <SmileWinnersSection key="winners" winners={smileWinnersList} selectedMonth={selectedMonth} onMonthChange={setSelectedMonth} loading={loading} onRefresh={fetchData} availableMonths={availableMonths} />}
                        {activeTab === 'HR_PANEL' && (
                            <HRApprovalPanel 
                                key="hr" 
                                stats={smileStats} 
                                winners={smileWinnersList}
                                onApprove={async(d)=> { 
                                    await fetch(smileScriptUrl, {
                                        method:'POST',
                                        mode:'no-cors',
                                        headers:{'Content-Type':'text/plain'},
                                        body:JSON.stringify({action:'approve_winner',...d})
                                    }); 
                                    fetchData(); 
                                }} 
                                loading={loading} 
                                onRefresh={fetchData} 
                                selectedMonth={selectedMonth}
                                onMonthChange={setSelectedMonth}
                                availableMonths={availableMonths}
                            />
                        )}
                        {activeTab === 'EMPLOYEE_ROSTER' && <EmployeeRoster staffList={staffList} fetchStaff={fetchData} smileScriptUrl={smileScriptUrl} loading={loading} userRole={user} />}
                        {activeTab === 'PRINT_QR' && <PrintQRSection onRefresh={fetchData} loading={loading} />}
                        {activeTab === 'CELEBRATIONS' && <CelebrationsSection staffList={staffList} loading={loading} onRefresh={fetchData} smileScriptUrl={smileScriptUrl} />}
                        {activeTab === 'STAFF_REGISTER' && <StaffRegistrationForm onComplete={() => { fetchData(); if(!isPublic) handleNavClick('EMPLOYEE_ROSTER'); }} />}
                        {activeTab === 'LASIK_FORM' && <LasikSurvey isPublic={isPublic} />}
                        {activeTab === 'LASIK_DATA' && (
                            <div className="space-y-10 pb-20">
                                <div className="flex items-center justify-between px-1">
                                    <div><h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter mb-1">Lasik <span className="text-orange-600">Analytics</span></h2><p className="text-[9px] font-black tracking-[0.2em] text-slate-400 uppercase">Patient feedback and life impact data</p></div>
                                    <RefreshButton onRefresh={fetchData} loading={loading} />
                                </div>
                                <div className="bg-white rounded-[2rem] border border-slate-100 overflow-hidden shadow-xl">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left min-w-[1000px] border-collapse">
                                            <thead className="bg-slate-50/80 sticky top-0 z-10 border-b border-slate-100">
                                                <tr className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                                                    <th className="px-6 py-4">Patient Identity</th>
                                                    <th className="px-6 py-4">Age</th>
                                                    <th className="px-6 py-4">Visual Aids?</th>
                                                    <th className="px-6 py-4">Stability</th>
                                                    <th className="px-6 py-4">Life Impact</th>
                                                    <th className="px-6 py-4">Date</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-50">
                                                {paginatedLasik.map((row, idx) => (
                                                    <tr key={idx} className="hover:bg-slate-50/50 transition-all">
                                                        <td className="px-6 py-4">
                                                            <p className="font-black text-slate-800 text-[10px] uppercase mb-0.5">{row.name}</p>
                                                            <p className="text-[8px] text-slate-400 font-bold tracking-widest">{row.phone_no}</p>
                                                        </td>
                                                        <td className="px-6 py-4 text-[9px] font-bold text-slate-700">{row.age}</td>
                                                        <td className="px-6 py-4">
                                                            <span className="px-2 py-0.5 bg-slate-100 rounded text-[8px] font-black uppercase tracking-widest">
                                                                {row['wear_glasses_contact_lens_']}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <span className="px-2 py-0.5 bg-slate-100 rounded text-[8px] font-black uppercase tracking-widest">
                                                                {row['is_power_stable_']}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <span className="px-2 py-0.5 bg-slate-100 rounded text-[8px] font-black uppercase tracking-widest">
                                                                {row['affecting_day_to_day_activity_']}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 text-[8px] font-black text-slate-400 uppercase tracking-widest">
                                                            {formatDateReadable(row.timestamp)}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                                <Pagination totalItems={lasikData.length} itemsPerPage={lasikItemsPerPage} currentPage={lasikPage} onPageChange={setLasikPage} />
                            </div>
                        )}
                        {activeTab === 'VISITING_DASHBOARD' && <VisitingManager scriptUrl={visitingScriptUrl} loading={loading} onRefresh={fetchData} />}
                        {activeTab === 'VISITING_UPDATE' && <AccountUpdate scriptUrl={visitingScriptUrl} />}
                        {activeTab === 'SBH_FAMILY_DASHBOARD' && <SBHFamilyManager scriptUrl={sbhFamilyScriptUrl} user={user} onRefresh={fetchData} loading={loading} />}
                    </div>
                </main>
                <Footer />
            </div>
        </div>
    );
};

export default SheetDashboard;
