import React, { useState, useEffect, useMemo, useRef } from 'react';
import LasikSurvey from './LasikSurvey';
import {
    Search, Edit3, Loader2, RefreshCw, Filter, Plus, Users, Activity, Bed,
    CheckCircle2, AlertCircle, X, Save, LogOut, Hospital, ChevronRight,
    User, ClipboardList, Stethoscope, Scan, TrendingUp, BarChart3,
    Calendar, Layers, Download, Globe, Heart, Award, Trophy, Smile,
    TrendingDown, Menu, MapPin, Sparkles, Briefcase, Mail, Phone, CalendarCheck, IndianRupee, Linkedin, ShieldCheck
} from 'lucide-react';
import SmileAwardForm from './SmileAwardForm';
import { QRCodeSVG } from 'qrcode.react';
import { motion, AnimatePresence } from 'framer-motion';
import VisitingManager from './Visiting/VisitingManager';
import AccountUpdate from './Visiting/AccountUpdate';

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

const downloadSvgAsPng = (svg, filename = "SBH_QR_Code.png") => {
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
        canvas.width = 500; canvas.height = 500; ctx.fillStyle = "white"; ctx.fillRect(0, 0, canvas.width, canvas.height); ctx.drawImage(img, 50, 50, 400, 400);
        const pngFile = canvas.toDataURL("image/png");
        const downloadLink = document.createElement("a"); 
        downloadLink.download = filename; 
        downloadLink.href = pngFile; 
        downloadLink.click();
    };
    img.src = "data:image/svg+xml;base64," + btoa(svgData);
};

// --- HELPER COMPONENTS ---

const NavItem = ({ icon, label, active, onClick, dot, variant = 'primary' }) => (
    <button 
        onClick={onClick} 
        className={`w-full flex items-center gap-3 px-5 py-3.5 rounded-2xl transition-all duration-200 group relative overflow-hidden font-bold tracking-wide text-[12px] mb-1.5
            ${active 
                ? 'bg-orange-500 text-white shadow-lg shadow-orange-200/50 transform scale-[1.02]' 
                : 'text-emerald-950/80 hover:bg-orange-50 hover:text-orange-950 opacity-90 hover:opacity-100 hover:translate-x-1'}`}
    >
        {icon && (
            <span className={`transition-all ${active ? 'scale-110 text-white' : 'text-orange-500 group-hover:text-orange-600'}`}>
                {React.cloneElement(icon, { size: 18, strokeWidth: active ? 2.5 : 2 })}
            </span>
        )}
        <span className={`uppercase tracking-widest ${active ? 'text-white' : 'text-emerald-950/70 group-hover:text-emerald-950'}`}>
            {label}
        </span>
        {active && <motion.div layoutId="nav-pill" className="absolute left-0 w-1.5 h-6 bg-white rounded-r-full" />}
    </button>
);

const SectionLoader = ({ message = "Syncing with cloud..." }) => (
    <div className="flex flex-col items-center justify-center p-20 space-y-4">
        <div className="relative">
            <Loader2 className="animate-spin text-emerald-500" size={40} strokeWidth={1.5} />
            <div className="absolute inset-0 blur-xl bg-emerald-500/20 animate-pulse" />
        </div>
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 animate-pulse">{message}</p>
    </div>
);

const Footer = () => {
    return (
        <footer className="fixed bottom-0 left-0 w-full bg-gradient-to-r from-[#f59e0b] via-[#10b981] to-[#2e7d32] py-1 md:py-1.5 z-[150] overflow-hidden shadow-[0_-4px_20px_-5px_rgba(0,0,0,0.3)] select-none border-t border-white/10">
            {/* Subtle Overlay */}
            <div className="absolute inset-0 opacity-10 pointer-events-none bg-white/5"></div>

            <div className="max-w-full mx-auto px-4 md:px-10 relative z-10">

                {/* 📱 MOBILE VIEW (Simple 2-line stack - Even Smaller Height) */}
                <div className="flex flex-col items-center justify-center md:hidden py-0.5">
                    <a
                        href="https://www.sbhhospital.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 no-underline"
                    >
                        <ShieldCheck size={11} className="text-white" />
                        <span className="text-[10px] font-black text-white uppercase tracking-widest leading-none">
                            SBH Group Of Hospitals
                        </span>
                    </a>
                    <a
                        href="https://www.linkedin.com/in/ignamanmishra"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 no-underline mt-0.5 opacity-90"
                    >
                        <span className="text-[8px] font-bold text-white uppercase tracking-widest italic leading-none">
                            Architected by
                            <span className="ml-2 text-[9px] font-black text-white uppercase tracking-widest not-italic">Naman Mishra</span>
                        </span>
                        <Linkedin size={8} className="text-[#0077b5] bg-white rounded-[1px] p-[0.5px]" />
                    </a>
                </div>

                {/* 💻 DESKTOP VIEW (Tight Layout) */}
                <div className="hidden md:flex items-center justify-between gap-6 h-8">
                    {/* 🏷️ BRANDING */}
                    <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center border border-white/30 backdrop-blur-md shadow-sm">
                            <Activity size={14} className="text-white" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black text-white uppercase tracking-widest leading-none">SBH INTEL</span>
                            <span className="text-[8px] font-extrabold text-white/80 tracking-wider mt-0.5">SYSTEM OPERATIONAL</span>
                        </div>
                    </div>

                    {/* 🏢 CENTER */}
                    <a
                        href="https://www.sbhhospital.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 py-1 px-4 bg-white/10 hover:bg-white/20 rounded-full border border-white/20 backdrop-blur-lg transition-all transform hover:scale-105 group no-underline shadow-sm"
                    >
                        <ShieldCheck size={12} className="text-white" />
                        <span className="text-[10px] font-black text-white uppercase tracking-[0.2em] flex items-center gap-1.5 leading-none">
                            SBH Group Of Hospitals
                        </span>
                    </a>

                    {/* 👤 ARCHITECT */}
                    <a
                        href="https://www.linkedin.com/in/ignamanmishra"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex flex-col text-right group no-underline"
                    >
                        <span className="text-[8px] font-bold text-white/80 uppercase tracking-widest italic leading-none mb-1">Architected by</span>
                        <span className="text-[10px] font-black text-white uppercase tracking-widest flex items-center justify-end gap-1.5 leading-none">
                            Naman Mishra
                            <Linkedin size={10} className="text-[#0077b5] bg-white rounded-[2px] p-[1px] opacity-100" />
                        </span>
                    </a>
                </div>
            </div>
        </footer>
    );
};

const StatCard = ({ icon, label, value, color, gradient }) => (
    <div className="bg-white rounded-[2.5rem] p-7 border border-slate-100 flex items-center gap-6 group hover:translate-y-[-4px] transition-all duration-500 shadow-sm relative overflow-hidden">
        <div className={`absolute -right-10 -bottom-10 opacity-[0.03] group-hover:opacity-[0.07] group-hover:scale-125 transition-all duration-700`}>{React.cloneElement(icon, { size: 120 })}</div>
        <div className={`w-16 h-16 rounded-[1.25rem] flex items-center justify-center text-white shadow-xl ${gradient || color}`}>{React.cloneElement(icon, { size: 30 })}</div>
        <div className="relative z-10"><p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.15em] mb-1">{label}</p><p className="text-4xl font-black text-slate-800 tracking-tighter">{value}</p></div>
    </div>
);

const DataTable = ({ data = [], type, onEdit }) => (
    <div className="bg-white rounded-[3rem] border border-slate-100 overflow-hidden shadow-sm">
        <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left min-w-[800px] lg:min-w-full">
                <thead className="bg-slate-50/50">
                    <tr>
                        <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Identity</th>
                        <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Details</th>
                        <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Consultant</th>
                        <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                        <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Action</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {data.map(row => (
                        <tr key={row.id} className="group hover:bg-slate-50/50 transition-colors">
                            <td className="px-8 py-5">
                                <p className="font-bold text-slate-800 leading-tight">{row.name}</p>
                                <div className="flex items-center gap-2 mt-1">
                                    {row.mrd_number && <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">MRD #{row.mrd_number}</span>}
                                    <span className="text-[9px] text-emerald-600 font-bold uppercase tracking-widest">{formatDateReadable(row.date)}</span>
                                </div>
                            </td>
                            <td className="px-8 py-5">
                                <p className="text-sm font-black text-slate-600">{row.number || row.patient_number}</p>
                            </td>
                            <td className="px-8 py-5">
                                <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-lg w-fit text-slate-700 font-black text-[10px] uppercase"><User size={14} className="text-slate-400" /> {row.dr_name}</div>
                            </td>
                            <td className="px-8 py-5">
                                <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${row.status === 'ARRIVED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-500 border-slate-100'}`}>{row.status}</span>
                            </td>
                            <td className="px-8 py-5 text-right"><button onClick={() => onEdit(row)} className="p-2.5 text-slate-300 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"><Edit3 className="w-5 h-5" /></button></td>
                        </tr>
                    ))}
                    {data.length === 0 && <tr><td colSpan="5" className="px-8 py-20 text-center text-slate-300 text-[10px] font-black uppercase tracking-widest">No matching clinical records found</td></tr>}
                </tbody>
            </table>
        </div>
    </div>
);

const SmileAwardStats = ({ stats, winners, selectedMonth, onMonthChange, loading }) => {
    const [departmentFilter, setDepartmentFilter] = useState('ALL');

    const filteredStats = useMemo(() => {
        const target = (selectedMonth || "").trim().toLowerCase();
        let list = (stats.all || []).filter(s => {
            const m = (s.month || "").trim().toLowerCase();
            return m === target || m.includes(target);
        });
        if (departmentFilter !== 'ALL') {
            list = list.filter(s => (s.dept || "").toLowerCase() === departmentFilter.toLowerCase());
        }
        return list;
    }, [stats.all, selectedMonth, departmentFilter]);

    const approvedWinners = useMemo(() => {
        const target = (selectedMonth || "").trim().toLowerCase();
        let list = (winners || []).filter(w => (w.month || "").trim().toLowerCase().includes(target));
        if (departmentFilter !== 'ALL') {
             list = list.filter(w => (w.department || "").toLowerCase() === departmentFilter.toLowerCase());
        }
        return list;
    }, [winners, selectedMonth, departmentFilter]);

    const months = useMemo(() => {
        const set = new Set((stats.all || []).map(s => (s.month || "").trim()));
        set.add(new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' }));
        return Array.from(set).filter(Boolean).sort((a,b) => new Date(b) - new Date(a));
    }, [stats.all]);

    const departments = useMemo(() => {
        const set = new Set((stats.all || []).map(s => s.dept || "General"));
        return Array.from(set).filter(Boolean).sort();
    }, [stats.all]);

    if (loading) return <SectionLoader message="Syncing leaderboard..." />;

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-5 duration-700 pb-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-1">
                <div>
                    <h2 className="text-4xl font-black text-slate-800 uppercase tracking-tighter leading-none mb-2">Excellence <span className="bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent">Stars</span></h2>
                    <p className="text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">Honoring our department champions</p>
                </div>
                <div className="flex flex-col md:flex-row items-center gap-4">
                    <div className="flex items-center gap-3 bg-white p-2.5 rounded-2xl shadow-xl shadow-slate-100 border border-slate-100 min-w-[200px]">
                        <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center text-orange-600"><Briefcase size={20} /></div>
                        <select value={departmentFilter} onChange={(e) => setDepartmentFilter(e.target.value)} className="flex-1 bg-transparent border-none outline-none font-black text-[11px] uppercase tracking-widest text-slate-700 cursor-pointer">
                            <option value="ALL">All Depts</option>
                            {departments.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                    </div>
                    <div className="flex items-center gap-3 bg-white p-2.5 rounded-2xl shadow-xl shadow-slate-100 border border-slate-100 min-w-[200px]">
                        <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600"><Calendar size={20} /></div>
                        <select value={selectedMonth} onChange={(e) => onMonthChange(e.target.value)} className="flex-1 bg-transparent border-none outline-none font-black text-[11px] uppercase tracking-widest text-slate-700 cursor-pointer">{months.map(m => <option key={m} value={m}>{m}</option>)}</select>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {approvedWinners.map((winner, idx) => (
                    <motion.div key={idx} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: idx * 0.1 }} className="bg-slate-900 rounded-[3rem] p-9 relative overflow-hidden group shadow-2xl shadow-slate-200">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-bl-full group-hover:scale-125 transition-transform duration-700" />
                        <Sparkles className="absolute -left-4 -top-4 text-orange-400/20 group-hover:rotate-12 transition-transform" size={100} />
                        <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-6">
                                <span className="px-3 py-1 bg-gradient-to-r from-orange-600 to-amber-500 text-white rounded-full text-[8px] font-black uppercase tracking-[0.2em] shadow-lg shadow-orange-500/30">Department Champion</span>
                            </div>
                            <p className="text-[10px] font-black text-orange-400 uppercase tracking-[0.2em] mb-1">{winner.department}</p>
                            <h3 className="text-2xl font-black text-white uppercase tracking-tight mb-6 leading-tight">{winner.employee_name}</h3>
                            <div className="flex items-center justify-between items-end border-t border-slate-800 pt-6">
                                <div><p className="text-3xl font-black text-white leading-none mb-1">{winner.votes}</p><p className="text-[8px] font-black uppercase text-slate-500 tracking-widest">Total Votes</p></div>
                                <div className="text-right text-[9px] font-bold text-slate-500 uppercase tracking-widest italic">{winner.month}</div>
                            </div>
                        </div>
                    </motion.div>
                ))}
                {approvedWinners.length === 0 && (
                    <div className="col-span-full py-20 bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200 text-center">
                        <Trophy size={48} className="mx-auto text-slate-200 mb-4" />
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Winners for this month have not been announced yet.</p>
                    </div>
                )}
            </div>

            <div className="bg-white rounded-[3rem] border border-slate-100 overflow-hidden shadow-2xl shadow-slate-100">
                <div className="px-6 md:px-10 py-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/50"><h3 className="text-xs font-black text-slate-800 uppercase tracking-[0.3em] flex items-center gap-4"><Activity className="text-emerald-600" size={18} /> Detailed Standings</h3></div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left min-w-[600px] md:min-w-full">
                        <thead><tr className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 bg-white"><th className="px-10 py-6">Rank</th><th className="px-10 py-6 font-bold">Staff Member</th><th className="px-10 py-6">Department</th><th className="px-10 py-6 text-right">Votes</th></tr></thead>
                        <tbody className="divide-y divide-slate-50">
                            {filteredStats.map((entry, i) => (
                                <tr key={i} className="hover:bg-emerald-50/30 transition-all group">
                                    <td className="px-10 py-7"><div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-sm transition-all ${i === 0 ? 'bg-orange-100 text-orange-700 shadow-lg shadow-orange-100' : 'bg-slate-100 text-slate-400'}`}>{i+1}</div></td>
                                    <td className="px-10 py-7"><div><p className="font-black text-slate-800 uppercase text-[11px] leading-tight mb-1">{entry.name}</p><p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest leading-none">Nominated Professional</p></div></td>
                                    <td className="px-10 py-7 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">{entry.dept}</td>
                                    <td className="px-10 py-7 text-right"><span className={`inline-block px-5 py-2.5 rounded-2xl text-[11px] font-black transition-all ${i === 0 ? 'bg-orange-600 text-white shadow-xl shadow-orange-200' : 'bg-slate-100 text-slate-600'}`}>{entry.votes} <span className="text-[8px] opacity-60 ml-0.5">VOTES</span></span></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

const HRApprovalPanel = ({ stats, winners, onApprove, loading }) => {
    const [submitting, setSubmitting] = useState(false);
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const now = new Date();
    const currentMonthLabel = months[now.getMonth()].toLowerCase();
    const currentYearLabel = now.getFullYear().toString();
    
    if (loading) return <SectionLoader message="Loading nominations for review..." />;

    const groupedData = (stats.all || []).filter(c => {
        let m = (c.month || "").trim();
        if (m.includes('T') && m.endsWith('Z')) {
            try { const d = new Date(m); m = months[d.getUTCMonth()] + " " + d.getUTCFullYear(); } catch(e) {}
        }
        const matchesMonth = m.toLowerCase().includes(currentMonthLabel) && m.toLowerCase().includes(currentYearLabel);
        
        // Exclude already approved candidates from pending view completely
        const isApprovedAlready = (winners || []).some(w => 
            (w.employee_name || "").toLowerCase() === (c.name || "").toLowerCase() && 
            (w.department || "").toLowerCase() === (c.dept || "").toLowerCase() &&
            (w.month || "").toLowerCase().includes(currentMonthLabel)
        );

        return matchesMonth && !isApprovedAlready;

    }).reduce((acc, curr) => {
        const dept = curr.dept || 'General';
        if (!acc[dept]) acc[dept] = [];
        acc[dept].push(curr);
        return acc;
    }, {});

    const isWinnerApproved = (name, dept) => {
        return (winners || []).some(w => 
            (w.employee_name || "").toLowerCase() === (name || "").toLowerCase() && 
            (w.department || "").toLowerCase() === (dept || "").toLowerCase() &&
            (w.month || "").toLowerCase().includes(currentMonthLabel)
        );
    };

    const handleApproved = async (candidate) => {
        setSubmitting(candidate.name);
        try {
            await onApprove(candidate);
            alert(`Approved ${candidate.name} as Star of the Month for ${candidate.dept}!`);
        } catch(e) { alert("Approval failed. Please try again."); }
        setSubmitting(false);
    };

    return (
        <div className="space-y-12 animate-in fade-in pb-20">
            <div className="px-1">
                <h2 className="text-4xl font-black text-slate-800 uppercase tracking-tighter">Approval <span className="text-orange-600">Portal</span></h2>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-2">Select and approve one champion per department</p>
            </div>

            {Object.keys(groupedData).length === 0 ? (
                <div className="bg-white rounded-[3rem] p-24 text-center border-2 border-dashed border-slate-100">
                    <p className="text-[11px] font-black text-slate-300 uppercase tracking-[0.3em]">No pending nominations found in cloud</p>
                </div>
            ) : Object.entries(groupedData).map(([dept, candidates]) => (
                <div key={dept} className="bg-white rounded-[3rem] border border-slate-100 shadow-2xl shadow-slate-100 overflow-hidden">
                    <div className="px-6 md:px-10 py-6 bg-slate-50/80 border-b border-slate-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-orange-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/20 shrink-0"><Briefcase size={20} /></div>
                            <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-0.5">Department</p><p className="text-xl font-black text-slate-800 uppercase tracking-tight">{dept}</p></div>
                        </div>
                        <div className="px-4 py-2 bg-emerald-50 text-emerald-700 rounded-xl text-[9px] font-black uppercase tracking-widest">{candidates.length} Nominees</div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left min-w-[500px] md:min-w-full">
                            <tbody className="divide-y divide-slate-50">
                                {candidates.map((c, i) => {
                                    return (
                                        <tr key={i} className="group hover:bg-slate-50/50 transition-all">
                                            <td className="px-10 py-7"><div><p className="font-black text-slate-800 uppercase text-xs leading-none mb-1">{c.name}</p><p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest italic">{c.votes} Overall Votes</p></div></td>
                                            <td className="px-10 py-7 text-right">
                                                <button disabled={submitting === c.name} onClick={() => handleApproved(c)} className="px-10 py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-orange-600 hover:shadow-xl hover:shadow-orange-200 transition-all disabled:opacity-50">
                                                    {submitting === c.name ? "Processing..." : "Approve as Star"}
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            ))}
        </div>
    );
};

// --- EMPLOYEE ROSTER MODULE ---
const EmployeeRoster = ({ staffList, smileScriptUrl, fetchStaff, smileWinnersList }) => {
    const [submitting, setSubmitting] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({ staffId: '', name: '', department: '', role: '', email: '', mobile: '', dob: '', doj: '', dol: '' });

    const handleEdit = (s) => {
        setFormData({
            staffId: s.Staff_ID, name: s.Name, department: s.Department, role: s.Role, email: s.Email, mobile: s.Mobile, 
            dob: s.DOB ? s.DOB.substring(0, 10) : '', 
            doj: s.DOJ ? s.DOJ.substring(0, 10) : '', 
            dol: s.DOL ? s.DOL.substring(0, 10) : ''
        });
        setShowForm(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleAddNew = () => {
        setFormData({ staffId: '', name: '', department: '', role: '', email: '', mobile: '', dob: '', doj: '', dol: '' });
        setShowForm(!showForm);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const isEditing = !!formData.staffId;

        if (!isEditing) {
             const isDuplicate = staffList.some(s => 
                 (formData.mobile && s.Mobile === formData.mobile) || 
                 (formData.email && formData.email !== '' && s.Email === formData.email)
             );
             if (isDuplicate) {
                 alert("Duplicate Employee Detected! An employee with this Mobile Number or Email already exists.");
                 return;
             }
        }

        setSubmitting(true);
        try {
            await fetch(smileScriptUrl, {
                method: 'POST', mode: 'no-cors',
                headers: { 'Content-Type': 'text/plain' },
                body: JSON.stringify({ action: isEditing ? 'edit_staff' : 'add_staff', ...formData })
            });
            
            await new Promise(r => setTimeout(r, 1500));
            
            setShowForm(false);
            fetchStaff();
            setFormData({ staffId: '', name: '', department: '', role: '', email: '', mobile: '', dob: '', doj: '', dol: '' });
            alert(isEditing ? "Successfully updated!" : "Successfully registered!");
        } catch(e) {
            alert("Error saving employee.");
        }
        setSubmitting(false);
    };

    const handleManualReminder = async (s, type) => {
        if (!confirm(`Send ${type} WhatsApp reminder to ${s.Name}?`)) return;
        try {
            await fetch(smileScriptUrl, {
                method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain' },
                body: JSON.stringify({ action: 'send_manual_reminder', type, mobile: s.Mobile, name: s.Name, years: type === 'anniversary' && s.DOJ ? new Date().getFullYear() - parseInt(s.DOJ.substring(0,4)) : 0 })
            });
            alert("Reminder triggered!");
        } catch(e) {
            alert("Error sending reminder");
        }
    };

    return (
        <div className="space-y-12 animate-in fade-in pb-20">
            <div className="px-1 flex flex-col md:flex-row justify-between md:items-end gap-6">
                <div>
                    <h2 className="text-4xl font-black text-slate-800 uppercase tracking-tighter">Staff <span className="text-emerald-600">Roster</span></h2>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-2">Manage employee records and automated reminders</p>
                </div>
                <button onClick={handleAddNew} className="px-8 py-4 bg-emerald-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-3">
                    {showForm ? <><X size={16} /> Close Form</> : <><Plus size={16} /> Add Employee</>}
                </button>
            </div>

            <AnimatePresence>
                {showForm && (
                     <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                        <form onSubmit={handleSubmit} className="bg-white rounded-[3rem] p-10 md:p-14 border border-slate-100 shadow-2xl shadow-slate-100 mb-10">
                            <h3 className="text-xl font-black text-slate-800 uppercase mb-8 flex items-center gap-3"><Users className="text-emerald-500" /> {formData.staffId ? `Update ${formData.name}` : 'New Employee Profile'}</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-8">
                                <div className="space-y-3"><label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Full Name *</label><input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl p-5 text-slate-800 font-bold focus:bg-white focus:border-emerald-500/30 outline-none" placeholder="e.g. Rahul Sharma" /></div>
                                <div className="space-y-3"><label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Department *</label><input required value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl p-5 text-slate-800 font-bold focus:bg-white focus:border-emerald-500/30 outline-none" placeholder="e.g. OPD" /></div>
                                <div className="space-y-3"><label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Role/Position</label><input value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl p-5 text-slate-800 font-bold focus:bg-white focus:border-emerald-500/30 outline-none" placeholder="e.g. Senior Consultant" /></div>
                                <div className="space-y-3"><label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Mobile Number (WhatsApp) *</label><input required value={formData.mobile} onChange={e => setFormData({...formData, mobile: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl p-5 text-slate-800 font-bold focus:bg-white focus:border-emerald-500/30 outline-none" placeholder="10-digit number" /></div>
                                <div className="space-y-3"><label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Email Address</label><input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl p-5 text-slate-800 font-bold focus:bg-white focus:border-emerald-500/30 outline-none" placeholder="Optional" /></div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10 pt-8 border-t border-slate-100">
                                <div className="space-y-3"><label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2 flex items-center gap-2"><CalendarCheck size={14} className="text-orange-500"/> Date of Birth</label><input type="date" value={formData.dob} onChange={e => setFormData({...formData, dob: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl p-5 text-slate-800 font-bold focus:bg-white focus:border-emerald-500/30 outline-none uppercase" /></div>
                                <div className="space-y-3"><label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2 flex items-center gap-2"><Award size={14} className="text-emerald-500"/> Date of Joining</label><input type="date" value={formData.doj} onChange={e => setFormData({...formData, doj: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl p-5 text-slate-800 font-bold focus:bg-white focus:border-emerald-500/30 outline-none uppercase" /></div>
                                <div className="space-y-3"><label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2 flex items-center gap-2 text-rose-500"><LogOut size={14} /> Date of Leaving</label><input type="date" value={formData.dol} onChange={e => setFormData({...formData, dol: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl p-5 text-rose-600 font-bold focus:bg-white focus:border-rose-500/30 outline-none uppercase" /></div>
                            </div>
                            <div className="flex justify-end">
                                <button disabled={submitting} type="submit" className={`w-full md:w-auto px-12 py-5 text-white rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-xl disabled:opacity-50 ${formData.staffId ? 'bg-orange-500 hover:bg-orange-600 shadow-orange-200' : 'bg-slate-900 hover:bg-emerald-600 shadow-slate-200'}`}>
                                    {submitting ? "Saving..." : formData.staffId ? "Update Employee" : "Save Employee Record"}
                                </button>
                            </div>
                        </form>
                     </motion.div>
                )}
            </AnimatePresence>

            <div className="bg-white rounded-[3rem] border border-slate-100 overflow-hidden shadow-2xl shadow-slate-100 mt-6">
                <div className="overflow-x-auto">
                    <table className="w-full text-left min-w-[800px] lg:min-w-full">
                        <thead><tr className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 bg-slate-50/80 border-b border-slate-100"><th className="px-10 py-6">ID & Name</th><th className="px-10 py-6">Role & Dept</th><th className="px-10 py-6">Contact</th><th className="px-10 py-6">Important Dates</th></tr></thead>
                        <tbody className="divide-y divide-slate-50">
                            {staffList.map((s, i) => {
                                const winCount = (smileWinnersList || []).filter(w => (w.employee_name || "").toLowerCase() === (s.Name || "").toLowerCase()).length;
                                const todayStr = new Date().toISOString().substring(5, 10);
                                const isBirthday = s.DOB && s.DOB.substring(s.DOB.length - 5) === todayStr;
                                const isWorkAnniv = s.DOJ && s.DOJ.substring(s.DOJ.length - 5) === todayStr;
                                const hasLeft = s.DOL && s.DOL.length > 0;
                                const cleanDob = s.DOB ? s.DOB.substring(0, 10) : 'N/A';
                                const cleanDoj = s.DOJ ? s.DOJ.substring(0, 10) : 'N/A';
                                const cleanDol = s.DOL ? s.DOL.substring(0, 10) : '';

                                return (
                                <tr key={i} className={`hover:bg-slate-50/50 transition-all ${hasLeft ? 'opacity-50 grayscale' : ''}`}>
                                    <td className="px-10 py-6">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <p className="font-black text-slate-800 uppercase text-[11px] mb-1">{s.Name}</p>
                                                <div className="flex gap-2 items-center">
                                                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{s.Staff_ID}</p>
                                                    {winCount > 0 && <span className="px-2 py-0.5 bg-orange-100 text-orange-600 rounded text-[8px] font-black uppercase"><Trophy size={8} className="inline mr-1" /> {winCount}x Star</span>}
                                                </div>
                                            </div>
                                            <button onClick={() => handleEdit(s)} className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"><Edit3 size={14} /></button>
                                        </div>
                                    </td>
                                    <td className="px-10 py-6"><div><p className="font-black text-slate-700 uppercase text-[10px] mb-1">{s.Department}</p><p className="text-[9px] text-emerald-600 font-bold uppercase tracking-widest">{s.Role || 'Staff'}</p></div></td>
                                    <td className="px-10 py-6"><div className="flex items-center gap-2 text-[9px] font-bold text-slate-500 tracking-widest"><Phone size={12} className="text-slate-400" /> {s.Mobile || 'N/A'}</div></td>
                                    <td className="px-10 py-6">
                                        <div className="space-y-2">
                                            {hasLeft ? (
                                                <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-100 text-slate-500 text-[8px] font-black uppercase tracking-widest rounded"><LogOut size={10}/> Left: {cleanDol}</div>
                                            ) : (
                                                <>
                                                    {s.DOB && <div className={`flex items-center justify-between gap-2 text-[9px] font-bold uppercase tracking-widest ${isBirthday ? 'text-rose-500 animate-pulse' : 'text-orange-500'}`}>
                                                        <span><CalendarCheck size={12} className="inline mr-1" /> {isBirthday ? 'TODAY IS BIRTHDAY! 🎉' : `DOB: ${cleanDob}`}</span>
                                                        {isBirthday && <button onClick={() => handleManualReminder(s, 'birthday')} className="px-2 py-1 bg-rose-50 hover:bg-rose-500 text-rose-500 hover:text-white rounded text-[8px] transition-colors shadow-sm">Send WhatsApp</button>}
                                                    </div>}
                                                    {s.DOJ && <div className={`flex items-center justify-between gap-2 text-[9px] font-bold uppercase tracking-widest ${isWorkAnniv ? 'text-indigo-500 animate-pulse' : 'text-emerald-500'}`}>
                                                        <span><Award size={12} className="inline mr-1" /> {isWorkAnniv ? 'WORK ANNIVERSARY! 🎊' : `JOIN: ${cleanDoj}`}</span>
                                                        {isWorkAnniv && <button onClick={() => handleManualReminder(s, 'anniversary')} className="px-2 py-1 bg-indigo-50 hover:bg-indigo-500 text-indigo-500 hover:text-white rounded text-[8px] transition-colors shadow-sm">Send WhatsApp</button>}
                                                    </div>}
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                                );
                            })}
                            {staffList.length === 0 && <tr><td colSpan="4" className="text-center py-20 text-[10px] font-black uppercase text-slate-400">No staff records found. Add one above.</td></tr>}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

// --- PRINT QR MODULE ---
const PrintQRSection = () => {
    const urls = [
        { label: "Smile Award Nomination", url: window.location.origin + "?type=smile_award", color: "from-orange-500 to-amber-500", icon: <Award size={20} className="text-white" /> },
        { label: "Lasik Feedback Survey", url: window.location.origin + "?type=lasik", color: "from-emerald-500 to-teal-500", icon: <CheckCircle2 size={20} className="text-white" /> }
    ];

    const printItem = (index) => {
        const item = document.getElementById(`qr-card-${index}`);
        const printWindow = window.open('', '', 'width=800,height=800');
        printWindow.document.write(`
            <html>
            <head><title>Print QR</title>
            <style>
                body { display: flex; justify-content: center; align-items: center; height: 100vh; font-family: sans-serif; background: white; margin: 0; }
                .card { text-align: center; border: 2px solid #e2e8f0; border-radius: 2rem; padding: 3rem; }
                .title { font-size: 2rem; font-weight: 900; text-transform: uppercase; color: #1e293b; margin-bottom: 2rem; }
            </style>
            </head>
            <body>
                <div class="card">
                    <div class="title">${urls[index].label}</div>
                    ${item.querySelector('svg').outerHTML}
                </div>
                <script>setTimeout(() => { window.print(); window.close(); }, 500);</script>
            </body>
            </html>
        `);
    };

    return (
        <div className="space-y-12 animate-in fade-in pb-20">
            <div className="px-1"><h2 className="text-4xl font-black text-slate-800 uppercase tracking-tighter">QR <span className="text-emerald-600">Station</span></h2><p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-2">Print scannable quick-links for your reception desk</p></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {urls.map((item, idx) => (
                    <div key={idx} className="bg-white rounded-[3rem] p-10 border border-slate-100 shadow-xl shadow-slate-100 text-center relative overflow-hidden group">
                        <div className={`absolute top-0 inset-x-0 h-2 bg-gradient-to-r ${item.color}`} />
                        <div className={`w-16 h-16 rounded-2xl mx-auto flex items-center justify-center mb-8 shadow-xl bg-gradient-to-br ${item.color}`}>
                            {item.icon}
                        </div>
                        <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight mb-8">{item.label}</h3>
                        <div id={`qr-card-${idx}`} className="bg-slate-50 p-6 rounded-3xl inline-block mb-8">
                            <QRCodeSVG value={item.url} size={200} level="H" includeMargin={true} />
                        </div>
                        <div>
                            <button onClick={() => printItem(idx)} className="px-8 py-3 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-slate-200 hover:-translate-y-1 active:translate-y-0 transition-all">Print QR Code</button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

// --- MAIN COMPONENT ---

const SheetDashboard = ({ user, onLogout, isPublic, publicType }) => {
    const [activeTab, setActiveTab] = useState(() => {
        if (isPublic) {
            if (publicType === 'smile_award') return 'SMILE_AWARD';
            if (publicType === 'lasik') return 'LASIK_FORM';
            if (publicType === 'visiting_update') return 'VISITING_UPDATE';
            return 'SMILE_AWARD';
        }
        return 'DASHBOARD';
    });
    const [opdData, setOpdData] = useState([]);
    const [sonoData, setSonoData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [editingRow, setEditingRow] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [formType, setFormType] = useState('OPD');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [smileStats, setSmileStats] = useState({ all: [] });
    const [smileWinnersList, setSmileWinnersList] = useState([]);
    const [staffList, setStaffList] = useState([]);
    const [lasikData, setLasikData] = useState([]);
    const [selectedMonth, setSelectedMonth] = useState(new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' }));

    const scriptUrl = 'https://script.google.com/macros/s/AKfycbx9ZM4dSz8Yu3jmuVhWWgBdxCuUjeNRF7WXEio_hhs6JFfHvktAFraoy7Mtar6sL3c/exec';
    const smileScriptUrl = 'https://script.google.com/macros/s/AKfycbybBim6gXGxKgcwpivSGWOdzW4hyA_NAG-WwzoBk3mpsfJ-rznT-U99oVj6m1qNLeKwVw/exec';
    const lasikScriptUrl = 'https://script.google.com/macros/s/AKfycbxuFDz3LDBM88Wy-7naDgffvXQ0hH37-EMQhJuMcUId40PNG5yX_PFZLyXXiGYMB0zQ/exec';

    const fetchData = async () => {
        setLoading(true);
        try {
            const [opd, sono, leaderboard, winners, staff, lasik] = await Promise.all([
                fetch(`${scriptUrl}?sheet=OPD_Records&date=${selectedDate}`).then(r => r.json()),
                fetch(`${scriptUrl}?sheet=SONO_Records&date=${selectedDate}`).then(r => r.json()),
                fetch(`${smileScriptUrl}?action=get_leaderboard`).then(r => r.json()),
                fetch(`${smileScriptUrl}?action=get_winners`).then(r => r.json()),
                fetch(`${smileScriptUrl}?action=get_staff`).then(r => r.json()),
                fetch(lasikScriptUrl).then(r => r.json())
            ]);
            setOpdData(opd || []);
            setSonoData(sono || []);
            setSmileStats({ all: Array.isArray(leaderboard) ? leaderboard : [] });
            setSmileWinnersList(Array.isArray(winners) ? winners : []);
            setStaffList(Array.isArray(staff) ? staff : []);
            setLasikData(Array.isArray(lasik) ? lasik : []);
        } catch (err) { console.error('Fetch error:', err); }
        setLoading(false);
    };

    useEffect(() => { fetchData(); }, [selectedDate]);

    const handleNavClick = (tab) => {
        setActiveTab(tab);
        if (window.innerWidth < 1024) setIsSidebarOpen(false);
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] flex font-sans overflow-x-hidden">
            {!isPublic && (
                <>
                    {isSidebarOpen && <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40 lg:hidden" onClick={() => setIsSidebarOpen(false)} />}
                    <aside className={`fixed inset-y-0 left-0 bg-white border-r border-slate-100 z-50 transition-transform duration-500 w-72 shadow-[20px_0_50px_rgba(0,0,0,0.02)] flex flex-col ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
                        <div className="p-8 border-b border-slate-100 flex flex-col items-center group relative cursor-pointer overflow-hidden bg-white">
                            <button onClick={() => setIsSidebarOpen(false)} className="absolute top-4 right-4 lg:hidden p-2 text-slate-400 hover:text-rose-500 rounded-full hover:bg-rose-50 transition-colors z-20"><X size={20} /></button>
                            <h1 className="text-[20px] font-black text-slate-900 uppercase tracking-tighter relative z-10 text-center leading-none mb-1">
                                SBH GROUP <br/>
                                <span className="text-emerald-600">OF HOSPITALS</span>
                            </h1>
                            <div className="w-full h-1 bg-emerald-100/50 mt-4 rounded-full overflow-hidden">
                                <div className="w-2/3 h-full bg-emerald-500/20" />
                            </div>
                        </div>
                    <div className="p-6 flex-1 space-y-6 overflow-y-auto custom-scrollbar bg-slate-50/30">
                        {/* Dashboard Hidden per Request */}
                        {/* <NavItem icon={<Heart size={18}/>} label="SBH Feedbacks" active={activeTab === 'DASHBOARD'} onClick={() => handleNavClick('DASHBOARD')} /> */}
                        
                        {/* HIDDEN: Management Section */}

                        <p className="px-5 text-[9px] font-black text-orange-400 uppercase tracking-[0.3em]">Smile Award System</p>
                        <div className="space-y-2">
                            <NavItem icon={<Award size={18}/>} label="Nominate Staff" active={activeTab === 'SMILE_AWARD'} onClick={() => handleNavClick('SMILE_AWARD')} variant="orange" />
                            <NavItem icon={<Trophy size={18}/>} label="Leaderboard" active={activeTab === 'SMILE_STATS'} onClick={() => handleNavClick('SMILE_STATS')} variant="orange" />
                            {(user === 'SBH' || user === 'HR') && (
                                <>
                                    <NavItem icon={<Users size={18}/>} label="Employee List" active={activeTab === 'EMPLOYEE_ROSTER'} onClick={() => handleNavClick('EMPLOYEE_ROSTER')} variant="orange" />
                                    <NavItem icon={<CheckCircle2 size={18}/>} label="Approval Portal" active={activeTab === 'HR_PANEL'} onClick={() => handleNavClick('HR_PANEL')} variant="orange" />
                                </>
                            )}
                        </div>

                        <p className="px-5 text-[9px] font-black text-emerald-600 uppercase tracking-[0.3em]">LASIK Questionnaire</p>
                        <div className="space-y-2">
                            <NavItem icon={<ClipboardList size={18}/>} label="Lasik Form" active={activeTab === 'LASIK_FORM'} onClick={() => handleNavClick('LASIK_FORM')} />
                            <NavItem icon={<TrendingUp size={18}/>} label="Lasik Responses" active={activeTab === 'LASIK_DATA'} onClick={() => handleNavClick('LASIK_DATA')} />
                            {user === 'SBH' && <NavItem icon={<Scan size={18}/>} label="QR Station" active={activeTab === 'PRINT_QR'} onClick={() => handleNavClick('PRINT_QR')} variant="orange" />}
                        </div>

                        {(user === 'HR' || user === 'SBH' || user === 'ADMIN') && (
                            <div className="mt-8">
                                <p className="px-5 text-[9px] font-black text-emerald-800 uppercase tracking-[0.3em] mb-4">Accounting Desk</p>
                                <div className="space-y-2">
                                    <NavItem icon={<IndianRupee size={18}/>} label="Visiting Doctors" active={activeTab === 'VISITING_DASHBOARD'} onClick={() => handleNavClick('VISITING_DASHBOARD')} />
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="p-6 border-t border-slate-100 bg-white/50">
                        <button onClick={onLogout} className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-rose-50 text-rose-600 border border-rose-100 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all hover:bg-rose-600 hover:text-white shadow-sm active:scale-95 group">
                            <LogOut size={18} className="group-hover:-translate-x-1 transition-transform" /> Logout Securely
                        </button>
                    </div>
                </aside>
                </>
            )}
            <div className={`flex-1 flex flex-col pb-20 w-full ${isPublic ? '' : 'lg:pl-72'}`}>
                <header className="h-20 bg-white/80 backdrop-blur-xl border-b border-slate-100 px-8 flex items-center justify-between sticky top-0 z-40 shadow-sm">
                    <div className="flex items-center gap-5">
                        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="lg:hidden p-3 bg-gradient-to-br from-orange-500 to-rose-500 text-white rounded-xl shadow-lg shadow-orange-500/30 active:scale-90 transition-all"><Menu size={24} /></button>
                        <div><h1 className="text-lg font-black text-slate-900 uppercase tracking-tighter leading-none">{activeTab.replace(/_/g, ' ')}</h1><p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Hospital Management System</p></div>
                    </div>
                        {/* Dashboard header input hidden */}
                        <div className="flex items-center gap-6">
                            {/* HIDDEN: Date and Add Entry */}
                        </div>
                </header>
                <main className="flex-1 p-4 sm:p-6 lg:p-14 max-w-[1400px] mx-auto w-full">
                    <AnimatePresence mode="wait">
                        {activeTab === 'DASHBOARD' && (
                            <div className="space-y-12 animate-in fade-in duration-700">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <StatCard icon={<Heart />} label="Smile Award Votes" value={smileStats.all.length} color="bg-orange-500" gradient="bg-gradient-to-br from-orange-600 to-amber-500" />
                                    <StatCard icon={<Award />} label="Approved Winners" value={smileWinnersList.length} color="bg-emerald-600" gradient="bg-gradient-to-br from-emerald-600 to-teal-500" />
                                </div>
                            </div>
                        )}
                        {activeTab === 'SMILE_AWARD' && <SmileAwardForm key="smile-award" onSubmissionSuccess={() => setTimeout(fetchData, 2000)} />}
                        {activeTab === 'SMILE_STATS' && <SmileAwardStats stats={smileStats} winners={smileWinnersList} selectedMonth={selectedMonth} onMonthChange={setSelectedMonth} loading={loading} />}
                        {activeTab === 'HR_PANEL' && <HRApprovalPanel stats={smileStats} winners={smileWinnersList} onApprove={async(d)=> { await fetch(smileScriptUrl,{method:'POST',mode:'no-cors',headers:{'Content-Type':'text/plain'},body:JSON.stringify({action:'approve_winner',...d})}); fetchData(); }} loading={loading} />}
                        {activeTab === 'EMPLOYEE_ROSTER' && <EmployeeRoster staffList={staffList} fetchStaff={fetchData} smileScriptUrl={smileScriptUrl} smileWinnersList={smileWinnersList} />}
                        {activeTab === 'PRINT_QR' && <PrintQRSection />}
                        {(activeTab === 'OPD' || activeTab === 'RADIOLOGY') && <DataTable data={activeTab === 'RADIOLOGY' ? sonoData : opdData} type={activeTab} onEdit={setEditingRow} />}
                        {activeTab === 'LASIK_FORM' && <LasikSurvey isPublic={isPublic} />}
                        {activeTab === 'LASIK_DATA' && (
                            <div className="bg-white rounded-[3rem] border border-slate-100 overflow-hidden shadow-sm">
                                <div className="overflow-x-auto custom-scrollbar">
                                    <table className="w-full text-left min-w-[1000px]">
                                        <thead className="bg-slate-50/50">
                                            <tr>
                                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Patient Details</th>
                                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">18-40?</th>
                                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Glasses/Lens?</th>
                                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Stable?</th>
                                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Affecting Life?</th>
                                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Timestamp</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {lasikData.map((row, idx) => (
                                                <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                                                    <td className="px-8 py-5">
                                                        <p className="font-bold text-slate-800 uppercase text-xs">{row.name}</p>
                                                        <div className="flex items-center gap-3 mt-1">
                                                            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{row.phone_no}</span>
                                                            <span className="text-[9px] text-emerald-600 font-bold uppercase tracking-widest">Age: {row.age}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-5"><span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase ${row['18_40_years_old_'] === 'YES' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>{row['18_40_years_old_']}</span></td>
                                                    <td className="px-8 py-5"><span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase ${row['wear_glasses_contact_lens_'] === 'YES' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>{row['wear_glasses_contact_lens_']}</span></td>
                                                    <td className="px-8 py-5"><span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase ${row['is_power_stable_'] === 'YES' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>{row['is_power_stable_']}</span></td>
                                                    <td className="px-8 py-5"><span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase ${row['affecting_day_to_day_activity_'] === 'YES' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>{row['affecting_day_to_day_activity_']}</span></td>
                                                    <td className="px-8 py-5 text-[9px] font-bold text-slate-400 uppercase">{formatDateReadable(row.timestamp)}</td>
                                                </tr>
                                            ))}
                                            {lasikData.length === 0 && <tr><td colSpan="6" className="px-8 py-20 text-center text-slate-300 text-[10px] font-black uppercase tracking-widest">No survey responses recorded yet</td></tr>}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                        {activeTab === 'VISITING_DASHBOARD' && <VisitingManager scriptUrl={smileScriptUrl} loading={loading} />}
                        {activeTab === 'VISITING_UPDATE' && <AccountUpdate scriptUrl={smileScriptUrl} />}
                    </AnimatePresence>
                </main>
            </div>
            <Footer />
        </div>
    );
};

export default SheetDashboard;
