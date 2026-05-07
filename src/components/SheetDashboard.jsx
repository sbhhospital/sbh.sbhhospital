import React, { useState, useEffect, useMemo, useRef } from 'react';
import LasikSurvey from './LasikSurvey';
import {
    Search, Edit3, Loader2, RefreshCw, Filter, Plus, Users, Activity, Bed,
    CheckCircle2, AlertCircle, X, Save, LogOut, Hospital, ChevronRight, ChevronLeft,
    User, ClipboardList, Stethoscope, Scan, TrendingUp, BarChart3,
    Calendar, Layers, Download, Globe, Heart, Award, Trophy, Smile,
    TrendingDown, Menu, MapPin, Sparkles, Briefcase, Mail, Phone, CalendarCheck, IndianRupee, Linkedin, ShieldCheck, RotateCcw, UserPlus, Cake, Gift, PartyPopper, Send, Link as LinkIcon
} from 'lucide-react';
import SmileAwardForm from './SmileAwardForm';
import StaffRegistrationForm from './StaffRegistrationForm';
import { QRCodeSVG } from 'qrcode.react';
import { motion, AnimatePresence } from 'framer-motion';
import VisitingManager from './Visiting/VisitingManager';
import AccountUpdate from './Visiting/AccountUpdate';
import SBHFamilyManager from './SBHFamily/SBHFamilyManager';

// --- UTILS ---
const formatTimeToAMPM = (timeStr) => {
    if (!timeStr) return '';
    if (timeStr.toLowerCase().includes('am') || timeStr.toLowerCase().includes('pm')) return timeStr;
    try {
        const parts = timeStr.split(':');
        let h = parseInt(parts[0]);
        let m = parts.length > 1 ? parts[1].substring(0, 2) : '00';
        if (isNaN(h)) return timeStr;
        const ampm = h >= 12 ? 'PM' : 'AM';
        h = h % 12 || 12;
        m = m.toString().padStart(2, '0');
        return `${h}:${m} ${ampm}`;
    } catch (e) { return timeStr; }
};

const formatDateReadable = (dateStr) => {
    if (!dateStr) return '';
    try {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch (e) { return dateStr; }
};

// --- HELPER COMPONENTS ---

const NavItem = ({ icon, label, active, onClick }) => (
    <button 
        onClick={onClick} 
        className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all duration-300 group relative overflow-hidden mb-1
            ${active 
                ? 'bg-orange-500 text-white shadow-xl shadow-orange-100 transform scale-[1.02]' 
                : 'text-slate-600 hover:bg-slate-50 hover:text-orange-600 opacity-90 hover:opacity-100'}`}
    >
        {icon && (
            <span className={`flex items-center justify-center shrink-0 transition-transform duration-300 ${active ? 'scale-110 text-white' : 'text-orange-500 group-hover:scale-110'}`}>
                {React.cloneElement(icon, { size: 18, strokeWidth: active ? 2.5 : 2 })}
            </span>
        )}
        <span className={`uppercase tracking-[0.15em] text-[10px] font-black whitespace-nowrap leading-none ${active ? 'text-white' : 'text-slate-700 group-hover:text-orange-600'}`}>
            {label}
        </span>
        {active && (
            <motion.div layoutId="nav-pill" className="absolute left-0 w-1 h-6 bg-white rounded-r-full" />
        )}
    </button>
);

const SectionLoader = ({ message = "Syncing with cloud...", messages = [] }) => {
    const [msgIdx, setMsgIdx] = useState(0);
    useEffect(() => {
        if (messages.length > 0) {
            const t = setInterval(() => setMsgIdx(p => (p + 1) % messages.length), 2000);
            return () => clearInterval(t);
        }
    }, [messages]);
    return (
        <div className="flex flex-col items-center justify-center p-20 space-y-8 animate-in fade-in zoom-in duration-700">
            <div className="relative">
                <div className="w-20 h-20 border-4 border-emerald-100 rounded-full animate-spin border-t-emerald-600 shadow-xl shadow-emerald-500/10"></div>
                <div className="absolute inset-0 flex items-center justify-center"><Sparkles className="text-emerald-500 animate-pulse" size={24} /></div>
            </div>
            <div className="text-center space-y-2">
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-800 animate-pulse">SBH INTEL ENGINE</p>
                <AnimatePresence mode="wait"><motion.p key={msgIdx} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="text-[10px] font-bold text-slate-400 uppercase tracking-widest min-h-[1.5em]">{messages.length > 0 ? messages[msgIdx] : message}</motion.p></AnimatePresence>
            </div>
        </div>
    );
};

const Footer = () => {
    return (
        <footer className="fixed bottom-0 left-0 w-full bg-gradient-to-r from-[#f59e0b] via-[#10b981] to-[#2e7d32] py-1 md:py-1.5 z-[150] overflow-hidden shadow-[0_-4px_20px_-5px_rgba(0,0,0,0.3)] select-none border-t border-white/10">
            <div className="absolute inset-0 opacity-10 pointer-events-none bg-white/5"></div>
            <div className="max-w-full mx-auto px-4 md:px-10 relative z-10">
                <div className="flex flex-col items-center justify-center md:hidden py-0.5">
                    <a href="https://www.sbhhospital.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 no-underline"><ShieldCheck size={11} className="text-white" /><span className="text-[10px] font-black text-white uppercase tracking-widest leading-none">SBH Group Of Hospitals</span></a>
                    <a href="https://www.linkedin.com/in/ignamanmishra" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 no-underline mt-0.5 opacity-90"><span className="text-[8px] font-bold text-white uppercase tracking-widest italic leading-none">Architected by <span className="ml-2 text-[9px] font-black text-white uppercase tracking-widest not-italic">Naman Mishra</span></span><Linkedin size={8} className="text-[#0077b5] bg-white rounded-[1px] p-[0.5px]" /></a>
                </div>
                <div className="hidden md:flex items-center justify-between gap-6 h-8">
                    <div className="flex items-center gap-3"><div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center border border-white/30 backdrop-blur-md shadow-sm"><Activity size={14} className="text-white" /></div><div className="flex flex-col"><span className="text-[10px] font-black text-white uppercase tracking-widest leading-none">SBH INTEL</span><span className="text-[8px] font-extrabold text-white/80 tracking-wider mt-0.5">SYSTEM OPERATIONAL</span></div></div>
                    <a href="https://www.sbhhospital.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 py-1 px-4 bg-white/10 hover:bg-white/20 rounded-full border border-white/20 backdrop-blur-lg transition-all transform hover:scale-105 group no-underline shadow-sm"><ShieldCheck size={12} className="text-white" /><span className="text-[10px] font-black text-white uppercase tracking-[0.2em] leading-none">SBH Group Of Hospitals</span></a>
                    <a href="https://www.linkedin.com/in/ignamanmishra" target="_blank" rel="noopener noreferrer" className="flex flex-col text-right group no-underline"><span className="text-[8px] font-bold text-white/80 uppercase tracking-widest italic leading-none mb-1">Architected by</span><span className="text-[10px] font-black text-white uppercase tracking-widest flex items-center justify-end gap-1.5 leading-none">Naman Mishra <Linkedin size={10} className="text-[#0077b5] bg-white rounded-[2px] p-[1px] opacity-100" /></span></a>
                </div>
            </div>
        </footer>
    );
};

const Pagination = ({ totalItems, itemsPerPage, currentPage, onPageChange }) => {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    if (totalPages <= 1) return null;

    return (
        <div className="flex items-center justify-center gap-2 mt-8">
            <button 
                disabled={currentPage === 1}
                onClick={() => onPageChange(currentPage - 1)}
                className="p-3 bg-white border border-slate-100 rounded-xl text-slate-400 hover:text-orange-600 disabled:opacity-30 transition-all shadow-sm"
            >
                <ChevronLeft size={18} />
            </button>
            <div className="flex items-center gap-1">
                {[...Array(totalPages)].map((_, i) => {
                    const page = i + 1;
                    // Show first, last, and pages around current
                    if (page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1)) {
                        return (
                            <button
                                key={page}
                                onClick={() => onPageChange(page)}
                                className={`w-10 h-10 rounded-xl font-black text-[10px] transition-all shadow-sm border ${currentPage === page ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-400 border-slate-100 hover:border-orange-200'}`}
                            >
                                {page}
                            </button>
                        );
                    } else if (page === currentPage - 2 || page === currentPage + 2) {
                        return <span key={page} className="text-slate-300 px-1 font-black">...</span>;
                    }
                    return null;
                })}
            </div>
            <button 
                disabled={currentPage === totalPages}
                onClick={() => onPageChange(currentPage + 1)}
                className="p-3 bg-white border border-slate-100 rounded-xl text-slate-400 hover:text-orange-600 disabled:opacity-30 transition-all shadow-sm"
            >
                <ChevronRight size={18} />
            </button>
        </div>
    );
};

const RefreshButton = ({ onRefresh, loading, className = "" }) => (
    <button 
        onClick={onRefresh} 
        disabled={loading}
        className={`p-3 bg-white border border-slate-100 rounded-2xl text-slate-400 hover:text-orange-600 transition-all shadow-sm active:scale-95 disabled:opacity-50 ${className}`}
        title="Refresh Data"
    >
        <RotateCcw size={18} className={loading ? "animate-spin text-orange-500" : ""} />
    </button>
);

const CollapsibleCategory = ({ icon, label, children, isOpen, onToggle }) => (
    <div className="mb-3">
        <button onClick={onToggle} className={`w-full flex items-center justify-between px-6 py-4 rounded-2xl transition-all duration-300 ${isOpen ? 'bg-slate-900 text-white shadow-xl' : 'text-slate-600 hover:bg-slate-50'}`}>
            <div className="flex items-center gap-4"><span className={`flex items-center justify-center shrink-0 ${isOpen ? 'text-orange-500' : 'text-slate-400'}`}>{React.cloneElement(icon, { size: 18, strokeWidth: 2.5 })}</span><span className="uppercase tracking-[0.2em] text-[10px] font-black leading-none">{label}</span></div>
            <motion.div animate={{ rotate: isOpen ? 90 : 0 }} transition={{ duration: 0.3 }} className="flex items-center shrink-0"><ChevronRight size={14} className={isOpen ? 'text-white' : 'text-slate-300'} /></motion.div>
        </button>
        <AnimatePresence>{isOpen && (<motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden bg-slate-50/50 rounded-2xl mt-1.5 p-1.5 space-y-1">{children}</motion.div>)}</AnimatePresence>
    </div>
);

// --- SMILE AWARD MODULES ---

const SmileEntriesSection = ({ entries, onOpenForm, loading, onRefresh }) => {
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    
    const paginatedEntries = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return entries.slice(start, start + itemsPerPage);
    }, [entries, currentPage]);

    if (loading) return <SectionLoader messages = {["Retrieving nomination history...", "Loading staff recognitions...", "Syncing award records..."]} />;
    
    return (
        <div className="space-y-12 animate-in fade-in duration-700 pb-20">
            <div className="px-1 flex flex-col xl:flex-row justify-between xl:items-end gap-6">
                <div><h2 className="text-4xl font-black text-slate-800 uppercase tracking-tighter leading-none mb-2">Nomination <span className="text-orange-600">Ledger</span></h2><p className="text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">Recent recognitions from our team members</p></div>
                <div className="flex items-center gap-3">
                    <RefreshButton onRefresh={onRefresh} loading={loading} />
                    <button onClick={onOpenForm} className="px-10 py-5 bg-slate-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-orange-600 transition-all shadow-xl shadow-slate-200 flex items-center justify-center gap-3 whitespace-nowrap"><Edit3 size={16}/> Cast Your Vote</button>
                </div>
            </div>
            <div className="bg-white rounded-[3rem] border border-slate-100 overflow-hidden shadow-2xl shadow-slate-100">
                <div className="overflow-x-auto"><table className="w-full text-left min-w-[800px] lg:min-w-full">
                    <thead><tr className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 bg-slate-50/80 border-b border-slate-100"><th className="px-10 py-6">Timestamp</th><th className="px-10 py-6">Nominated Professional</th><th className="px-10 py-6">Acknowledged By</th><th className="px-10 py-6">Recognition Remarks</th></tr></thead>
                    <tbody className="divide-y divide-slate-50">
                        {paginatedEntries.map((e, i) => (
                            <tr key={i} className="hover:bg-slate-50/50 transition-all group">
                                <td className="px-10 py-7"><div><p className="font-black text-slate-800 uppercase text-[10px] mb-1">{e.month}</p><p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{e.timestamp.split(' ')[0]}</p></div></td>
                                <td className="px-10 py-7"><div><p className="font-black text-slate-800 uppercase text-[11px] mb-1">{e.employee_name}</p><p className="text-[9px] text-emerald-600 font-bold uppercase tracking-widest">{e.department}</p></div></td>
                                <td className="px-10 py-7"><div className="flex items-center gap-2 text-[9px] font-bold text-slate-500 uppercase tracking-widest"><User size={12} className="text-slate-400"/> {e.voter_name}</div></td>
                                <td className="px-10 py-7 max-w-[300px]"><p className="text-[10px] font-bold text-slate-500 italic leading-relaxed group-hover:text-slate-800 transition-colors">"{e.remarks || 'No specific remarks provided'}"</p></td>
                            </tr>
                        ))}
                        {entries.length === 0 && <tr><td colSpan="4" className="text-center py-24 text-[10px] font-black uppercase text-slate-300 tracking-widest">No nominations found in the ledger</td></tr>}
                    </tbody>
                </table></div>
            </div>
            <Pagination totalItems={entries.length} itemsPerPage={itemsPerPage} currentPage={currentPage} onPageChange={setCurrentPage} />
        </div>
    );
};

const SmileLeaderboardSection = ({ stats, winners, selectedMonth, onMonthChange, loading, onRefresh }) => {
    const [departmentFilter, setDepartmentFilter] = useState('ALL');
    const filteredStats = useMemo(() => {
        const target = (selectedMonth || "").trim().toLowerCase();
        let list = (stats.all || []).filter(s => { const m = (s.month || "").trim().toLowerCase(); return m === target || m.includes(target); });
        if (departmentFilter !== 'ALL') list = list.filter(s => (s.dept || "").toLowerCase() === departmentFilter.toLowerCase());
        return list;
    }, [stats.all, selectedMonth, departmentFilter]);

    const approvedWinner = useMemo(() => {
        const target = (selectedMonth || "").trim().toLowerCase();
        return (winners || []).find(w => (w.month || "").trim().toLowerCase().includes(target));
    }, [winners, selectedMonth]);

    const departments = useMemo(() => { const set = new Set((stats.all || []).map(s => s.dept || "General")); return Array.from(set).filter(Boolean).sort(); }, [stats.all]);
    const months = useMemo(() => { const set = new Set((stats.all || []).map(s => (s.month || "").trim())); set.add(new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' })); return Array.from(set).filter(Boolean).sort((a,b) => new Date(b) - new Date(a)); }, [stats.all]);
    
    if (loading) return <SectionLoader message="Compiling live standings..." />;
    
    return (
        <div className="space-y-10 animate-in fade-in duration-700 pb-20">
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 px-1">
                <div><h2 className="text-4xl font-black text-slate-800 uppercase tracking-tighter mb-2">Leader <span className="text-emerald-600">Board</span></h2><p className="text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">Real-time voting scoreboard & champion highlight</p></div>
                <div className="flex flex-col md:flex-row items-center gap-4">
                    <RefreshButton onRefresh={onRefresh} loading={loading} />
                    <div className="flex items-center gap-3 bg-white p-2.5 rounded-2xl shadow-xl border border-slate-100 min-w-[200px]"><div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center text-orange-600"><Briefcase size={20} /></div><select value={departmentFilter} onChange={(e) => setDepartmentFilter(e.target.value)} className="flex-1 bg-transparent border-none outline-none font-black text-[11px] uppercase tracking-widest text-slate-700 cursor-pointer"><option value="ALL">All Depts</option>{departments.map(d => <option key={d} value={d}>{d}</option>)}</select></div>
                    <div className="flex items-center gap-3 bg-white p-2.5 rounded-2xl shadow-xl border border-slate-100 min-w-[200px]"><div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600"><Calendar size={20} /></div><select value={selectedMonth} onChange={(e) => onMonthChange(e.target.value)} className="flex-1 bg-transparent border-none outline-none font-black text-[11px] uppercase tracking-widest text-slate-700 cursor-pointer">{months.map(m => <option key={m} value={m}>{m}</option>)}</select></div>
                </div>
            </div>

            {approvedWinner && (
                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-[3rem] p-10 relative overflow-hidden shadow-2xl border border-white/10 group mb-14">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl group-hover:scale-150 transition-transform duration-1000" />
                    <Sparkles className="absolute -left-6 -top-6 text-orange-400/20 rotate-12" size={150} />
                    <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
                        <div className="w-32 h-32 rounded-[2.5rem] bg-gradient-to-br from-orange-500 to-rose-600 flex items-center justify-center text-white shadow-2xl shadow-orange-500/30 shrink-0"><Trophy size={60} strokeWidth={2.5} /></div>
                        <div className="text-center md:text-left flex-1">
                            <span className="px-5 py-2 bg-orange-500/10 text-orange-500 rounded-full text-[9px] font-black uppercase tracking-[0.3em] border border-orange-500/20 inline-block mb-4 animate-pulse">Official Champion of {selectedMonth}</span>
                            <h3 className="text-5xl font-black text-white uppercase tracking-tighter leading-none mb-3">{approvedWinner.employee_name}</h3>
                            <p className="text-[12px] font-black text-slate-400 uppercase tracking-[0.3em]">{approvedWinner.department} Department • {approvedWinner.votes} Total Votes</p>
                        </div>
                    </div>
                </motion.div>
            )}

            <div className="bg-white rounded-[3rem] border border-slate-100 overflow-hidden shadow-2xl shadow-slate-100">
                <div className="px-6 md:px-10 py-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
                    <h3 className="text-xs font-black text-slate-800 uppercase tracking-[0.3em] flex items-center gap-4">
                        <Activity className="text-emerald-600" size={18} /> Detailed Standings
                    </h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left min-w-[600px] md:min-w-full">
                        <thead>
                            <tr className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 bg-white">
                                <th className="px-10 py-6">Rank</th>
                                <th className="px-10 py-6 font-bold">Staff Member</th>
                                <th className="px-10 py-6">Department</th>
                                <th className="px-10 py-6 text-right">Votes</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filteredStats.map((entry, i) => (
                                <tr key={i} className={`hover:bg-slate-50 transition-all group ${approvedWinner?.employee_name.toLowerCase() === entry.name.toLowerCase() ? 'bg-orange-50/30' : ''}`}>
                                    <td className="px-10 py-7">
                                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-sm transition-all ${i === 0 ? 'bg-orange-100 text-orange-700 shadow-lg' : 'bg-slate-100 text-slate-400'}`}>
                                            {i+1}
                                        </div>
                                    </td>
                                    <td className="px-10 py-7">
                                        <div>
                                            <p className="font-black text-slate-800 uppercase text-[11px] leading-tight mb-1">{entry.name} {approvedWinner?.employee_name.toLowerCase() === entry.name.toLowerCase() && '🏆'}</p>
                                            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest leading-none">Nominated Professional</p>
                                        </div>
                                    </td>
                                    <td className="px-10 py-7 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">{entry.dept}</td>
                                    <td className="px-10 py-7 text-right">
                                        <span className={`inline-block px-5 py-2.5 rounded-2xl text-[11px] font-black transition-all ${i === 0 ? 'bg-orange-600 text-white shadow-xl' : 'bg-slate-100 text-slate-600'}`}>
                                            {entry.votes} <span className="text-[8px] opacity-60 ml-0.5">VOTES</span>
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

const SmileWinnersSection = ({ winners, selectedMonth, onMonthChange, loading, onRefresh }) => {
    const months = useMemo(() => { const set = new Set((winners || []).map(w => (w.month || "").trim())); set.add(new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' })); return Array.from(set).filter(Boolean).sort((a,b) => new Date(b) - new Date(a)); }, [winners]);
    const approvedWinners = useMemo(() => { const target = (selectedMonth || "").trim().toLowerCase(); return (winners || []).filter(w => (w.month || "").trim().toLowerCase().includes(target)); }, [winners, selectedMonth]);
    if (loading) return <SectionLoader message="Fetching champion gallery..." />;
    return (
        <div className="space-y-12 animate-in fade-in duration-700 pb-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-1">
                <div><h2 className="text-4xl font-black text-slate-800 uppercase tracking-tighter">Champion <span className="text-orange-500">Hall of Fame</span></h2><p className="text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">Honoring our approved excellence stars</p></div>
                <div className="flex items-center gap-3">
                    <RefreshButton onRefresh={onRefresh} loading={loading} />
                    <div className="flex items-center gap-3 bg-white p-2.5 rounded-2xl shadow-xl border border-slate-100 min-w-[200px]"><div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600"><Calendar size={20} /></div><select value={selectedMonth} onChange={(e) => onMonthChange(e.target.value)} className="flex-1 bg-transparent border-none outline-none font-black text-[11px] uppercase tracking-widest text-slate-700 cursor-pointer">{months.map(m => <option key={m} value={m}>{m}</option>)}</select></div>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">{approvedWinners.map((winner, idx) => (<motion.div key={idx} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: idx * 0.1 }} className="bg-slate-900 rounded-[3rem] p-9 relative overflow-hidden group shadow-2xl shadow-slate-200"><div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-bl-full group-hover:scale-125 transition-transform duration-700" /><Sparkles className="absolute -left-4 -top-4 text-orange-400/20 group-hover:rotate-12 transition-transform" size={100} /><div className="relative z-10"><div className="flex items-center gap-2 mb-6"><span className="px-3 py-1 bg-gradient-to-r from-orange-600 to-amber-500 text-white rounded-full text-[8px] font-black uppercase tracking-[0.2em] shadow-lg shadow-orange-500/30">Official Champion</span></div><p className="text-[10px] font-black text-orange-400 uppercase tracking-[0.2em] mb-1">{winner.department}</p><h3 className="text-2xl font-black text-white uppercase tracking-tight mb-6 leading-tight">{winner.employee_name}</h3><div className="flex items-center justify-between items-end border-t border-slate-800 pt-6"><div><p className="text-3xl font-black text-white leading-none mb-1">{winner.votes}</p><p className="text-[8px] font-black uppercase text-slate-500 tracking-widest">Approved Votes</p></div><div className="text-right text-[9px] font-bold text-slate-500 uppercase tracking-widest italic">{winner.month}</div></div></div></motion.div>))}{approvedWinners.length === 0 && (<div className="col-span-full py-20 bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200 text-center"><Trophy size={48} className="mx-auto text-slate-200 mb-4" /><p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">No champions have been finalized for this month yet</p></div>)}</div>
        </div>
    );
};

const SmileAwardFormSection = ({ onSubmissionSuccess }) => (
    <div className="animate-in fade-in slide-in-from-bottom-5 duration-700 max-w-4xl mx-auto w-full">
        <div className="mb-10 text-center"><h2 className="text-4xl font-black text-slate-800 uppercase tracking-tighter leading-none mb-3">Award <span className="text-orange-500">Form</span></h2><p className="text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">Acknowledge excellence in our SBH family</p></div>
        <SmileAwardForm onSubmissionSuccess={onSubmissionSuccess} />
    </div>
);

// --- REMAINING COMPONENTS (Simplified) ---
const HRApprovalPanel = ({ stats, winners, onApprove, loading, onRefresh }) => {
    const [submitting, setSubmitting] = useState(false);
    const monthsArr = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const now = new Date();
    const currentMonthLabel = monthsArr[now.getMonth()].toLowerCase();
    const currentYearLabel = now.getFullYear().toString();
    if (loading) return <SectionLoader message="Loading nominations for review..." />;
    const groupedData = (stats.all || []).filter(c => { let m = (c.month || "").trim(); if (m.includes('T') && m.endsWith('Z')) { try { const d = new Date(m); m = monthsArr[d.getUTCMonth()] + " " + d.getUTCFullYear(); } catch(e) {} } const matchesMonth = m.toLowerCase().includes(currentMonthLabel) && m.toLowerCase().includes(currentYearLabel); const isApprovedAlready = (winners || []).some(w => (w.employee_name || "").toLowerCase() === (c.name || "").toLowerCase() && (w.department || "").toLowerCase() === (c.dept || "").toLowerCase() && (w.month || "").toLowerCase().includes(currentMonthLabel)); return matchesMonth && !isApprovedAlready; }).reduce((acc, curr) => { const dept = curr.dept || 'General'; if (!acc[dept]) acc[dept] = []; acc[dept].push(curr); return acc; }, {});
    const handleApproved = async (candidate) => { setSubmitting(candidate.name); try { await onApprove(candidate); alert(`Approved ${candidate.name}!`); } catch(e) { alert("Approval failed."); } setSubmitting(false); };
    return (
        <div className="space-y-12 animate-in fade-in pb-20">
            <div className="px-1 flex items-center justify-between">
                <div><h2 className="text-4xl font-black text-slate-800 uppercase tracking-tighter">Approval <span className="text-orange-600">Hub</span></h2><p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-2">Designate monthly champions from top nominees</p></div>
                <RefreshButton onRefresh={onRefresh} loading={loading} />
            </div>
            {Object.keys(groupedData).length === 0 ? (<div className="bg-white rounded-[3rem] p-24 text-center border-2 border-dashed border-slate-100"><p className="text-[11px] font-black text-slate-300 uppercase tracking-[0.3em]">No pending nominations for this month</p></div>) : Object.entries(groupedData).map(([dept, candidates]) => (
                <div key={dept} className="bg-white rounded-[3rem] border border-slate-100 shadow-2xl overflow-hidden mb-8"><div className="px-6 md:px-10 py-6 bg-slate-50/80 border-b border-slate-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"><div className="flex items-center gap-4"><div className="w-12 h-12 bg-orange-600 text-white rounded-2xl flex items-center justify-center shadow-lg"><Briefcase size={20} /></div><div><p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-0.5">Department</p><p className="text-xl font-black text-slate-800 uppercase tracking-tight">{dept}</p></div></div><div className="px-4 py-2 bg-emerald-50 text-emerald-700 rounded-xl text-[9px] font-black uppercase tracking-widest">{candidates.length} Nominees</div></div><div className="overflow-x-auto"><table className="w-full text-left min-w-[500px] md:min-w-full"><tbody className="divide-y divide-slate-50">{candidates.map((c, i) => (<tr key={i} className="group hover:bg-slate-50/50 transition-all"><td className="px-10 py-7"><div><p className="font-black text-slate-800 uppercase text-xs leading-none mb-1">{c.name}</p><p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest italic">{c.votes} Overall Votes</p></div></td><td className="px-10 py-7 text-right"><button disabled={submitting === c.name} onClick={() => handleApproved(c)} className="px-10 py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-orange-600 transition-all disabled:opacity-50">{submitting === c.name ? "Processing..." : "Approve as Star"}</button></td></tr>))}</tbody></table></div></div>
            ))}
        </div>
    );
};

const EmployeeRoster = ({ staffList, smileScriptUrl, fetchStaff, loading }) => {
    const [submitting, setSubmitting] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    const [formData, setFormData] = useState({ staffId: '', name: '', mobile: '', email: '', birthday: '', anniversary: '', department: '', role: '', dol: '' });

    const filteredStaff = useMemo(() => {
        let list = staffList;
        if (searchTerm) {
            const s = searchTerm.toLowerCase();
            list = list.filter(item => 
                (item.Name || '').toLowerCase().includes(s) || 
                (item.Staff_ID || '').toLowerCase().includes(s) ||
                (item.Department || '').toLowerCase().includes(s)
            );
        }
        return list;
    }, [staffList, searchTerm]);

    const paginatedStaff = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filteredStaff.slice(start, start + itemsPerPage);
    }, [filteredStaff, currentPage]);

    useEffect(() => { setCurrentPage(1); }, [searchTerm]);

    const handleEdit = (s) => {
        const toFormDate = (val) => {
            if (!val) return '';
            const sVal = String(val);
            if (sVal.length === 10 && sVal.charAt(2) === '-') {
                const parts = sVal.split('-');
                return `${parts[2]}-${parts[1]}-${parts[0]}`;
            }
            return sVal.substring(0, 10);
        };
        setFormData({
            staffId: s.Staff_ID,
            name: s.Name,
            mobile: s.Mobile,
            email: s.Email,
            birthday: toFormDate(s.Birthday),
            anniversary: toFormDate(s.Anniversary),
            department: s.Department,
            role: s.Role,
            dol: toFormDate(s.DOL)
        });
        setShowModal(true);
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
            fetchStaff();
            alert("Roster Updated Successfully!");
        } catch (e) {
            alert("Sync Failed. Please check connectivity.");
        }
        setSubmitting(false);
    };

    return (
        <div className="space-y-8 animate-in fade-in pb-20">
            {/* HEADER & SEARCH */}
            <div className="px-1 flex flex-col xl:flex-row justify-between xl:items-center gap-6">
                <div>
                    <h2 className="text-4xl font-black text-slate-800 uppercase tracking-tighter">Staff <span className="text-emerald-600">Roster</span></h2>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-2">Manage employee profiles and automated triggers</p>
                </div>
                
                <div className="flex flex-col sm:flex-row items-center gap-4">
                    {/* SEARCH BAR */}
                    <div className="relative w-full sm:w-80 group">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-600 transition-colors" size={18} />
                        <input 
                            type="text"
                            placeholder="Search name, ID or dept..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-white border border-slate-100 pl-14 pr-6 py-4 rounded-2xl font-bold text-sm outline-none focus:border-emerald-500/20 focus:ring-4 focus:ring-emerald-500/5 transition-all shadow-sm"
                        />
                    </div>

                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        <RefreshButton onRefresh={fetchStaff} loading={loading} />
                        <button onClick={handleNew} className="flex-1 sm:flex-none px-8 py-4 bg-emerald-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-emerald-200 flex items-center justify-center gap-3 transition-all hover:bg-slate-900 active:scale-95">
                            <Plus size={16}/> New Entry
                        </button>
                    </div>
                </div>
            </div>

            {/* SCROLLABLE TABLE CONTAINER */}
            <div className="bg-white rounded-[3rem] border border-slate-100 shadow-2xl overflow-hidden relative">
                <div className="max-h-[650px] overflow-y-auto custom-scrollbar overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50/80 backdrop-blur-md sticky top-0 z-10">
                            <tr className="text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100">
                                <th className="px-10 py-6">Identity</th>
                                <th className="px-10 py-6">Dept & Role</th>
                                <th className="px-10 py-6">WhatsApp</th>
                                <th className="px-10 py-6">Dates & Milestones</th>
                                <th className="px-10 py-6 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                             {paginatedStaff.map((s, i) => (
                                <tr key={i} className={`hover:bg-slate-50/50 transition-all group ${s.DOL ? 'opacity-40 bg-slate-50/30' : ''}`}>
                                    <td className="px-10 py-7">
                                        <div className="flex items-center gap-3">
                                            <div>
                                                <p className="font-black text-slate-800 uppercase text-[11px] mb-1">{s.Name}</p>
                                                <p className="text-[9px] text-slate-400 font-bold tracking-widest uppercase">{s.Staff_ID}</p>
                                            </div>
                                            {s.DOL && <span className="px-3 py-1 bg-slate-200 text-slate-500 rounded-lg text-[8px] font-black uppercase tracking-widest">Left</span>}
                                        </div>
                                    </td>
                                    <td className="px-10 py-7">
                                        <p className="text-[10px] font-black text-slate-700 uppercase leading-none mb-1.5">{s.Department}</p>
                                        <p className="text-[9px] text-emerald-600 font-bold uppercase tracking-widest leading-none">{s.Role || 'Professional Staff'}</p>
                                    </td>
                                    <td className="px-10 py-7">
                                        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500">
                                            <Phone size={12} className="text-slate-300"/> {s.Mobile}
                                        </div>
                                    </td>
                                    <td className="px-10 py-7">
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-slate-400">
                                                <Cake size={10} className="text-orange-400"/> {s.Birthday || 'Not Set'}
                                            </div>
                                            <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-slate-400">
                                                <Award size={10} className="text-emerald-400"/> {s.Anniversary || 'Not Set'}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-10 py-7 text-right">
                                        <button onClick={() => handleEdit(s)} className="p-3 text-slate-300 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all">
                                            <Edit3 size={16}/>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {paginatedStaff.length === 0 && (
                                <tr>
                                    <td colSpan="4" className="px-10 py-20 text-center">
                                        <div className="flex flex-col items-center gap-4 opacity-30">
                                            <Search size={48} />
                                            <p className="text-[10px] font-black uppercase tracking-widest">No staff members match your search</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* PAGINATION */}
            <Pagination 
                totalItems={filteredStaff.length} 
                itemsPerPage={itemsPerPage} 
                currentPage={currentPage} 
                onPageChange={setCurrentPage} 
            />

            {/* POPUP MODAL FOR ADD/EDIT */}
            <AnimatePresence>
                {showModal && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6">
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowModal(false)}
                            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                        />
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]"
                        >
                            <div className="px-10 py-8 border-b border-slate-50 flex items-center justify-between shrink-0">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-emerald-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-100">
                                        {formData.staffId ? <Edit3 size={20} /> : <Plus size={20} />}
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter leading-none">{formData.staffId ? 'Modify Profile' : 'New Specialist'}</h3>
                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1.5">{formData.staffId ? `Updating ID: ${formData.staffId}` : 'Entering system roster'}</p>
                                    </div>
                                </div>
                                <button onClick={() => setShowModal(false)} className="p-3 bg-slate-50 text-slate-400 rounded-xl hover:bg-slate-100 transition-all"><X size={20}/></button>
                            </div>

                            <div className="p-10 overflow-y-auto custom-scrollbar">
                                <form id="staff-form" onSubmit={handleSubmit} className="space-y-8">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Full Name</label>
                                            <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-slate-50 p-5 rounded-2xl font-bold outline-none border-2 border-transparent focus:border-emerald-500/20 focus:bg-white transition-all" placeholder="Enter name"/>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase text-slate-400 ml-2">WhatsApp Number</label>
                                            <input required value={formData.mobile} onChange={e => setFormData({...formData, mobile: e.target.value})} className="w-full bg-slate-50 p-5 rounded-2xl font-bold outline-none border-2 border-transparent focus:border-emerald-500/20 focus:bg-white transition-all" placeholder="Phone No."/>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Department</label>
                                            <input required value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})} className="w-full bg-slate-50 p-5 rounded-2xl font-bold outline-none border-2 border-transparent focus:border-emerald-500/20 focus:bg-white transition-all" placeholder="e.g. Nursing"/>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Official Role</label>
                                            <input required value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} className="w-full bg-slate-50 p-5 rounded-2xl font-bold outline-none border-2 border-transparent focus:border-emerald-500/20 focus:bg-white transition-all" placeholder="e.g. Senior Nurse"/>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Birth Date</label>
                                            <input type="date" value={formData.birthday} onChange={e => setFormData({...formData, birthday: e.target.value})} className="w-full bg-slate-50 p-5 rounded-2xl font-bold outline-none border-2 border-transparent focus:border-emerald-500/20 focus:bg-white transition-all"/>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Joining Date</label>
                                            <input type="date" value={formData.anniversary} onChange={e => setFormData({...formData, anniversary: e.target.value})} className="w-full bg-slate-50 p-5 rounded-2xl font-bold outline-none border-2 border-transparent focus:border-emerald-500/20 focus:bg-white transition-all"/>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Email (Optional)</label>
                                            <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full bg-slate-50 p-5 rounded-2xl font-bold outline-none border-2 border-transparent focus:border-emerald-500/20 focus:bg-white transition-all" placeholder="email@sbh.com"/>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase text-rose-400 ml-2">Date of Leaving (DOL)</label>
                                            <input type="date" value={formData.dol} onChange={e => setFormData({...formData, dol: e.target.value})} className="w-full bg-rose-50/50 p-5 rounded-2xl font-bold outline-none border-2 border-transparent focus:border-rose-500/20 focus:bg-white transition-all"/>
                                        </div>
                                    </div>
                                </form>
                            </div>

                            <div className="p-10 border-t border-slate-50 flex items-center justify-end gap-4 shrink-0 bg-slate-50/50">
                                <button onClick={() => setShowModal(false)} className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors">Discard</button>
                                <button form="staff-form" type="submit" disabled={submitting} className="px-10 py-5 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-emerald-600 transition-all flex items-center gap-3 disabled:opacity-50">
                                    {submitting ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                                    {submitting ? 'Processing...' : 'Finalize Profile'}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

const PrintQRSection = () => {
    const PUBLIC_URL = "https://lasik-feedback.vercel.app";
    const urls = [
        { label: "Smile Award Form", url: `${PUBLIC_URL}?type=smile_award`, color: "from-orange-500 to-amber-500", icon: <Award size={20} className="text-white" /> },
        { label: "Staff Self-Registration", url: `${PUBLIC_URL}?type=register`, color: "from-blue-500 to-indigo-600", icon: <UserPlus size={20} className="text-white" /> },
        { label: "Lasik Feedback", url: `${PUBLIC_URL}?type=lasik`, color: "from-emerald-500 to-teal-500", icon: <CheckCircle2 size={20} className="text-white" /> }
    ];
    const printItem = (item) => { const win = window.open('', '', 'width=800,height=800'); win.document.write(`<html><head><title>Print</title><style>body{display:flex;justify-content:center;align-items:center;height:100vh;margin:0;font-family:sans-serif;}.card{text-align:center;border:2px solid #eee;border-radius:2rem;padding:3rem;}.title{font-size:2rem;font-weight:900;text-transform:uppercase;margin-bottom:2rem;}.url{font-size:0.8rem;margin-top:2rem;color:#666;word-break:break-all;}</style></head><body><div class="card"><div class="title">${item.label}</div><div id="qr-target" style="display:flex;justify-content:center;"></div><div class="url">${item.url}</div></div><script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"></script><script>new QRCode(document.getElementById("qr-target"), {text: "${item.url}", width: 300, height: 300}); setTimeout(()=>{window.print();window.close();},800);</script></body></html>`); };
    const copyLink = (link) => { navigator.clipboard.writeText(link); alert("Link Copied!"); };

    return (
        <div className="space-y-12 animate-in fade-in pb-20">
            <div className="px-1"><h2 className="text-4xl font-black text-slate-800 uppercase tracking-tighter">QR <span className="text-emerald-600">Station</span></h2><p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-2">Physical touchpoints for patient feedback & staff onboarding</p></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {urls.map((item, idx) => (
                    <div key={idx} className="bg-white rounded-[3rem] p-10 border border-slate-100 shadow-xl text-center relative overflow-hidden group">
                        <div className={`absolute top-0 inset-x-0 h-2 bg-gradient-to-r ${item.color}`} />
                        <div className={`w-16 h-16 rounded-2xl mx-auto flex items-center justify-center mb-8 shadow-xl bg-gradient-to-br ${item.color}`}>{item.icon}</div>
                        <h3 className="text-lg font-black text-slate-800 uppercase mb-8">{item.label}</h3>
                        <div className="bg-slate-50 p-6 rounded-3xl inline-block mb-8 border border-slate-100 shadow-inner"><QRCodeSVG value={item.url} size={200} level="H" includeMargin={true} /></div>
                        
                        <div className="mb-8 px-4 py-3 bg-slate-50 rounded-xl border border-slate-100 overflow-hidden">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest break-all leading-relaxed select-all">{item.url}</p>
                        </div>

                        <div className="flex flex-col gap-3">
                            <button onClick={() => printItem(item)} className="w-full py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl flex items-center justify-center gap-2 transition-all hover:bg-emerald-600"><Download size={14}/> Print QR Code</button>
                            <button onClick={() => copyLink(item.url)} className="w-full py-4 bg-slate-50 text-slate-400 rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-white transition-all flex items-center justify-center gap-2 border border-slate-100"><LinkIcon size={12}/> Copy Link</button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const CelebrationsSection = ({ staffList, loading, onRefresh, smileScriptUrl }) => {
    const [sending, setSending] = useState(null);

    const handleSendManual = async (ev) => {
        const sendKey = ev.staffId + ev.type;
        setSending(sendKey);
        try {
            await fetch(smileScriptUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain' },
                body: JSON.stringify({ 
                    action: 'send_manual_reminder', 
                    type: ev.type, 
                    name: ev.name, 
                    mobile: ev.mobile,
                    email: ev.email,
                    years: ev.type === 'ANNIVERSARY' ? (new Date().getFullYear() - ev.date.getFullYear()) : 0
                })
            });
            // We use a small delay because no-cors doesn't give us the response body
            await new Promise(r => setTimeout(r, 1500));
            alert(`Wishes sent to ${ev.name}!`);
        } catch (e) {
            alert("Failed to send wishes.");
        }
        setSending(null);
    };

    const parseDate = (val) => {
        if (!val) return null;
        const sVal = String(val);
        // Handle DD-MM-YYYY
        if (sVal.length === 10 && sVal.charAt(2) === '-') {
            const [d, m, y] = sVal.split('-').map(Number);
            return new Date(y, m - 1, d);
        }
        // Handle YYYY-MM-DD
        const d = new Date(val);
        return isNaN(d.getTime()) ? null : d;
    };

    const getDaysUntil = (date) => {
        if (!date) return 999;
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        const event = new Date(now.getFullYear(), date.getMonth(), date.getDate());
        if (event < now) {
            event.setFullYear(now.getFullYear() + 1);
        }
        const diffTime = event - now;
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    };

    const events = useMemo(() => {
        const list = [];
        (staffList || []).forEach(s => {
            // SKIP IF LEFT (DOL is present)
            if (s.DOL || s.dol) return;

            const bday = parseDate(s.Birthday);
            if (bday) {
                const days = getDaysUntil(bday);
                if (days <= 60) { // Show events in next 60 days
                    list.push({ type: 'BIRTHDAY', name: s.Name, date: bday, days, dept: s.Department, staffId: s.Staff_ID, mobile: s.Mobile, email: s.Email });
                }
            }
            const anniv = parseDate(s.Anniversary);
            if (anniv) {
                const days = getDaysUntil(anniv);
                if (days <= 60) { // Show events in next 60 days
                    list.push({ type: 'ANNIVERSARY', name: s.Name, date: anniv, days, dept: s.Department, staffId: s.Staff_ID, mobile: s.Mobile, email: s.Email });
                }
            }
        });
        return list.sort((a, b) => a.days - b.days);
    }, [staffList]);

    if (loading) return <SectionLoader message="Syncing celebrations calendar..." />;

    return (
        <div className="space-y-12 animate-in fade-in duration-700 pb-20">
            <style>{`
                @keyframes slow-blink {
                    0%, 100% { opacity: 1; transform: scale(1); }
                    50% { opacity: 0.7; transform: scale(0.98); }
                }
                .animate-slow-blink {
                    animation: slow-blink 3s infinite ease-in-out;
                }
            `}</style>
            <div className="px-1 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h2 className="text-4xl font-black text-slate-800 uppercase tracking-tighter leading-none mb-3">Event <span className="text-orange-500">Radar</span></h2>
                    <p className="text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">Upcoming birthdays and work anniversaries</p>
                </div>
                <div className="flex items-center gap-3">
                    <RefreshButton onRefresh={onRefresh} loading={loading} />
                    {events.some(e => e.days === 0) && (
                        <button 
                            disabled={sending === 'ALL_TODAY'}
                            onClick={async () => {
                                const todayEvents = events.filter(e => e.days === 0);
                                if (window.confirm(`Send wishes to all ${todayEvents.length} staff members celebrating today?`)) {
                                    setSending('ALL_TODAY');
                                    for (const ev of todayEvents) {
                                        await handleSendManual(ev);
                                    }
                                    setSending(null);
                                    alert("All today's wishes dispatched!");
                                }
                            }}
                            className="px-6 py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl flex items-center gap-2 hover:bg-orange-600 transition-all disabled:opacity-50"
                        >
                            {sending === 'ALL_TODAY' ? <Loader2 className="animate-spin" size={14}/> : <Send size={14}/>}
                            {sending === 'ALL_TODAY' ? 'Dispatching...' : "Dispatch Today's Wishes"}
                        </button>
                    )}
                </div>
            </div>

            <div className="bg-white rounded-[3rem] border border-slate-100 shadow-2xl overflow-hidden">
                <div className="max-h-[800px] overflow-y-auto custom-scrollbar p-8 md:p-12 bg-slate-50/30">
                    {events.length === 0 ? (
                        <div className="py-32 text-center">
                            <PartyPopper size={48} className="mx-auto text-slate-200 mb-6" />
                            <p className="text-[11px] font-black text-slate-300 uppercase tracking-[0.3em]">No upcoming celebrations found in next 60 days</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {events.map((ev, i) => (
                                <motion.div 
                                    key={`${ev.staffId}-${ev.type}`}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                    className={`p-8 rounded-[2.5rem] relative overflow-hidden group transition-all duration-500 border ${
                                        ev.days === 0 
                                        ? 'bg-slate-900 border-slate-900 shadow-2xl shadow-orange-100 scale-[1.02] z-10' 
                                        : 'bg-white border-slate-50 hover:border-orange-200 shadow-sm hover:shadow-xl'
                                    }`}
                                >
                                    <div className="relative z-10">
                                        <div className="flex items-center justify-between mb-4">
                                            <span className={`px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-[0.2em] border ${
                                                ev.days === 0 
                                                ? 'bg-orange-500 text-white border-orange-400 animate-pulse' 
                                                : 'bg-slate-50 text-slate-400 border-slate-100'
                                            }`}>
                                                {ev.type === 'BIRTHDAY' ? 'Birthday' : 'Work Anniversary'}
                                            </span>
                                            {ev.days === 0 && (
                                                <span className="text-[8px] font-black text-orange-400 uppercase tracking-widest animate-bounce">Today!</span>
                                            )}
                                            {ev.days === 1 && (
                                                <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">Tomorrow</span>
                                            )}
                                        </div>

                                        <p className={`text-[8px] font-black uppercase tracking-[0.2em] mb-1 ${ev.days === 0 ? 'text-orange-400' : 'text-slate-400'}`}>{ev.dept}</p>
                                        <h3 className={`text-base font-black uppercase tracking-tight mb-4 leading-tight ${ev.days === 0 ? 'text-white animate-slow-blink' : 'text-slate-800'}`}>{ev.name}</h3>
                                        
                                        <div className={`flex items-center justify-between pt-6 border-t ${ev.days === 0 ? 'border-slate-800' : 'border-slate-50'}`}>
                                            <div className="flex items-center gap-3">
                                                <Calendar size={14} className={ev.days === 0 ? 'text-slate-500' : 'text-slate-300'} />
                                                <span className={`text-[10px] font-bold uppercase tracking-widest ${ev.days === 0 ? 'text-slate-400' : 'text-slate-500'}`}>
                                                    {ev.date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                                                </span>
                                            </div>
                                            <button 
                                                onClick={() => handleSendManual(ev)}
                                                disabled={sending === (ev.staffId + ev.type)}
                                                className={`p-3 rounded-xl transition-all flex items-center gap-2 group/btn ${
                                                    ev.days === 0 
                                                    ? 'bg-orange-500 text-white hover:bg-white hover:text-orange-600' 
                                                    : 'bg-slate-50 text-slate-400 hover:bg-emerald-50 hover:text-emerald-600'
                                                } disabled:opacity-50`}
                                            >
                                                {sending === (ev.staffId + ev.type) ? (
                                                    <Loader2 className="animate-spin" size={14} />
                                                ) : (
                                                    <Send size={14} className="group-hover/btn:translate-x-1 transition-transform" />
                                                )}
                                                <span className="text-[9px] font-black uppercase tracking-widest">
                                                    {sending === (ev.staffId + ev.type) ? 'Sending...' : 'Send Wishes'}
                                                </span>
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
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
    const [openCategories, setOpenCategories] = useState({ smile: true, results: true, lasik: false, accounting: user === 'ACCOUNT', employees: false });

    const smileScriptUrl = 'https://script.google.com/macros/s/AKfycbyHNF4Yzqvh6Copcl2aL1XyWZEyBSeoaxXz277xFbkPOqPOB-Fy7tNzDpMmFimHf2kGyg/exec';
    const visitingScriptUrl = 'https://script.google.com/macros/s/AKfycbybBim6gXGxKgcwpivSGWOdzW4hyA_NAG-WwzoBk3mpsfJ-rznT-U99oVj6m1qNLeKwVw/exec';
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

    return (
        <div className="min-h-screen bg-[#F8FAFC] flex font-sans overflow-x-hidden">
            {!isPublic && (
                <aside className={`fixed top-0 left-0 h-full w-72 bg-white border-r border-slate-100 z-[110] flex flex-col transition-transform duration-500 lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full shadow-2xl'}`}>
                    <div className="h-24 px-8 flex items-center gap-4 border-b border-slate-50 sticky top-0 bg-white z-20">
                        <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-rose-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-orange-200 rotate-3"><Activity size={24} strokeWidth={2.5} /></div>
                        <div><h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter leading-none">SBH <span className="text-orange-600">CORE</span></h2><p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Hospital Intel Hub</p></div>
                        <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden ml-auto p-2 text-slate-400 hover:text-slate-600"><X size={20}/></button>
                    </div>
                    <div className="p-6 flex-1 space-y-4 overflow-y-auto custom-scrollbar bg-slate-50/20">
                        <CollapsibleCategory icon={<Award />} label="Smile Award" isOpen={openCategories.smile} onToggle={() => setOpenCategories(p => ({...p, smile: !p.smile}))}>
                            <NavItem icon={<Plus />} label="Cast Nomination" active={activeTab === 'SMILE_FORM'} onClick={() => handleNavClick('SMILE_FORM')} />
                            <NavItem icon={<ClipboardList />} label="Nomination Ledger" active={activeTab === 'SMILE_ENTRIES'} onClick={() => handleNavClick('SMILE_ENTRIES')} />
                            <NavItem icon={<TrendingUp />} label="Leader Board" active={activeTab === 'SMILE_LEADERBOARD'} onClick={() => handleNavClick('SMILE_LEADERBOARD')} />
                            <NavItem icon={<Trophy />} label="Honor Roll" active={activeTab === 'SMILE_WINNERS'} onClick={() => handleNavClick('SMILE_WINNERS')} />
                            {(user === 'SBH' || user === 'SBH HRD') && (
                                <NavItem icon={<CheckCircle2 />} label="Approval Desk" active={activeTab === 'HR_PANEL'} onClick={() => handleNavClick('HR_PANEL')} />
                            )}
                        </CollapsibleCategory>
                        <CollapsibleCategory icon={<Users />} label="Workforce" isOpen={openCategories.employees} onToggle={() => setOpenCategories(p => ({...p, employees: !p.employees}))}>
                            <NavItem icon={<Users />} label="Staff Roster" active={activeTab === 'EMPLOYEE_ROSTER'} onClick={() => handleNavClick('EMPLOYEE_ROSTER')} />
                            <NavItem icon={<Scan />} label="QR Manager" active={activeTab === 'PRINT_QR'} onClick={() => handleNavClick('PRINT_QR')} />
                            <NavItem icon={<Cake />} label="Celebrations" active={activeTab === 'CELEBRATIONS'} onClick={() => handleNavClick('CELEBRATIONS')} />
                        </CollapsibleCategory>
                        <CollapsibleCategory icon={<ClipboardList />} label="Lasik Section" isOpen={openCategories.lasik} onToggle={() => setOpenCategories(p => ({...p, lasik: !p.lasik}))}>
                            <NavItem icon={<Edit3 />} label="Lasik Form" active={activeTab === 'LASIK_FORM'} onClick={() => handleNavClick('LASIK_FORM')} />
                            <NavItem icon={<BarChart3 />} label="Feedback Data" active={activeTab === 'LASIK_DATA'} onClick={() => handleNavClick('LASIK_DATA')} />
                        </CollapsibleCategory>
                        <CollapsibleCategory icon={<IndianRupee />} label="Accounting" isOpen={openCategories.accounting} onToggle={() => setOpenCategories(p => ({...p, accounting: !p.accounting}))}>
                            <NavItem icon={<Users />} label="SBH Family" active={activeTab === 'SBH_FAMILY_DASHBOARD'} onClick={() => handleNavClick('SBH_FAMILY_DASHBOARD')} />
                            <NavItem icon={<IndianRupee />} label="Visiting" active={activeTab === 'VISITING_DASHBOARD'} onClick={() => handleNavClick('VISITING_DASHBOARD')} />
                        </CollapsibleCategory>
                        
                        {/* MANAGEMENT CONTROLS */}
                        <div className="pt-8 border-t border-slate-100">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-6 mb-4">Management Controls</p>
                            <button onClick={onLogout} className="w-full flex items-center gap-4 px-6 py-4 text-rose-500 hover:bg-rose-50 rounded-2xl transition-all group">
                                <div className="w-10 h-10 bg-rose-50 text-rose-500 rounded-xl flex items-center justify-center group-hover:bg-rose-500 group-hover:text-white transition-all">
                                    <LogOut size={18}/>
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-widest">Sign Out System</span>
                            </button>
                        </div>
                    </div>
                </aside>
            )}
            <div className={`flex-1 flex flex-col pb-20 w-full ${isPublic ? 'min-h-screen py-10 bg-slate-50' : 'lg:pl-72'}`}>
                {!isPublic && (
                    <header className="h-20 bg-white/80 backdrop-blur-xl border-b border-slate-100 px-8 flex items-center justify-between sticky top-0 z-40 shadow-sm">
                        <div className="flex items-center gap-5"><button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="lg:hidden p-3 bg-orange-500 text-white rounded-xl shadow-lg active:scale-90 transition-all"><Menu size={24} /></button><div><h1 className="text-lg font-black text-slate-900 uppercase tracking-tighter leading-none">{activeTab.replace(/_/g, ' ')}</h1><p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Management Operations</p></div></div>
                        <div className="flex items-center gap-4">
                            <RefreshButton onRefresh={fetchData} loading={loading} className="hidden sm:flex border-none shadow-none hover:bg-slate-50" />
                            <div className="flex items-center gap-3 px-4 py-2 bg-slate-50 border border-slate-100 rounded-2xl">
                                <div className="w-8 h-8 rounded-xl bg-orange-500 flex items-center justify-center text-white"><User size={16} /></div>
                                <p className="text-[11px] font-black text-slate-800 uppercase tracking-tighter hidden sm:block">{user}</p>
                            </div>
                        </div>
                    </header>
                )}
                <main className={`flex-1 p-4 sm:p-6 lg:p-14 max-w-[1400px] mx-auto w-full ${isPublic ? 'flex flex-col items-center' : ''}`}>
                    <AnimatePresence mode="wait">
                        {activeTab === 'SMILE_ENTRIES' && <SmileEntriesSection entries={smileEntriesList} onOpenForm={() => handleNavClick('SMILE_FORM')} loading={loading} onRefresh={fetchData} />}
                        {activeTab === 'SMILE_FORM' && <SmileAwardFormSection key="form" onSubmissionSuccess={() => { fetchData(); if(!isPublic) handleNavClick('SMILE_ENTRIES'); }} />}
                        {activeTab === 'SMILE_LEADERBOARD' && <SmileLeaderboardSection key="stats" stats={smileStats} winners={smileWinnersList} selectedMonth={selectedMonth} onMonthChange={setSelectedMonth} loading={loading} onRefresh={fetchData} />}
                        {activeTab === 'SMILE_WINNERS' && <SmileWinnersSection key="winners" winners={smileWinnersList} selectedMonth={selectedMonth} onMonthChange={setSelectedMonth} loading={loading} onRefresh={fetchData} />}
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
                            />
                        )}
                        {activeTab === 'EMPLOYEE_ROSTER' && <EmployeeRoster staffList={staffList} fetchStaff={fetchData} smileScriptUrl={smileScriptUrl} loading={loading} />}
                        {activeTab === 'PRINT_QR' && <PrintQRSection onRefresh={fetchData} loading={loading} />}
                        {activeTab === 'CELEBRATIONS' && <CelebrationsSection staffList={staffList} loading={loading} onRefresh={fetchData} smileScriptUrl={smileScriptUrl} />}
                        {activeTab === 'STAFF_REGISTER' && <StaffRegistrationForm />}
                        {activeTab === 'LASIK_FORM' && <LasikSurvey isPublic={isPublic} />}
                        {activeTab === 'LASIK_DATA' && (
                            <div className="space-y-10 animate-in fade-in pb-20">
                                <div className="flex items-center justify-between px-1">
                                    <div><h2 className="text-4xl font-black text-slate-800 uppercase tracking-tighter leading-none mb-2">Lasik <span className="text-emerald-600">Analytics</span></h2><p className="text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">Patient feedback and life impact data</p></div>
                                    <RefreshButton onRefresh={fetchData} loading={loading} />
                                </div>
                                <div className="bg-white rounded-[3rem] border border-slate-100 overflow-hidden shadow-sm shadow-slate-100">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left min-w-[1000px]">
                                            <thead className="bg-slate-50/50">
                                                <tr><th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Patient Identity</th><th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Age</th><th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Visual Aids?</th><th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Stability</th><th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Life Impact</th><th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Date</th></tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {paginatedLasik.map((row, idx) => (
                                                    <tr key={idx} className="hover:bg-slate-50/50 transition-all"><td className="px-8 py-5"><p className="font-black text-slate-800 text-xs uppercase mb-0.5">{row.name}</p><p className="text-[9px] text-slate-400 font-bold tracking-widest">{row.phone_no}</p></td><td className="px-8 py-5 text-[10px] font-bold text-slate-700">{row.age}</td><td className="px-8 py-5"><span className="px-3 py-1 bg-slate-100 rounded-full text-[9px] font-black uppercase tracking-widest">{row['wear_glasses_contact_lens_']}</span></td><td className="px-8 py-5"><span className="px-3 py-1 bg-slate-100 rounded-full text-[9px] font-black uppercase tracking-widest">{row['is_power_stable_']}</span></td><td className="px-8 py-5"><span className="px-3 py-1 bg-slate-100 rounded-full text-[9px] font-black uppercase tracking-widest">{row['affecting_day_to_day_activity_']}</span></td><td className="px-8 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest">{formatDateReadable(row.timestamp)}</td></tr>
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
                    </AnimatePresence>
                </main>
            </div>
            <Footer />
        </div>
    );
};

export default SheetDashboard;
