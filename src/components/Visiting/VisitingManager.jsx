import React, { useState, useEffect, useMemo } from 'react';
import { 
    Users, Plus, Calendar, IndianRupee, Clock, CheckCircle2, 
    AlertCircle, Search, Filter, Loader2, Save, X, Phone, 
    Stethoscope, Briefcase, TrendingUp, BarChart3, Download, Activity, User, RefreshCw, ChevronRight, Award, Linkedin, ChevronLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const getVal = (obj, key) => {
    if (!obj) return '';
    const foundKey = Object.keys(obj).find(k => k.toLowerCase() === key.toLowerCase());
    return foundKey ? obj[foundKey] : '';
};

const formatDateReadable = (dateStr) => {
    if (!dateStr) return "-";
    try {
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch (e) { return dateStr; }
};

const VisitingManager = ({ scriptUrl, user, loading: parentLoading }) => {
    const [activeSubTab, setActiveSubTab] = useState(user === 'ACCOUNT' ? 'ACCOUNT_PANEL' : 'HR_ENTRY'); // HR_ENTRY, REPORT, SETTLED, MASTER, ACCOUNT_PANEL
    const [doctors, setDoctors] = useState([]);
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingMessage, setLoadingMessage] = useState("Consulting the digital oracle...");
    const [submitting, setSubmitting] = useState(false);
    const [confirmModal, setConfirmModal] = useState(null);
    const [showDoctorForm, setShowDoctorForm] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedPayment, setSelectedPayment] = useState(null);
    const [masterPage, setMasterPage] = useState(1);
    const [historyPage, setHistoryPage] = useState(1);
    const ITEMS_PER_PAGE = 6;
    const [doctorFormData, setDoctorFormData] = useState({ name: '', specialty: '', mobile: '', email: '' });
    const [paymentFormData, setPaymentFormData] = useState({ 
        doctorId: '', 
        doctorName: '', 
        amountPerVisit: '', 
        deductions: '0',
        visitDates: [], 
        currentDate: new Date().toISOString().split('T')[0] 
    });

    const funnyMessages = [
        "Consulting the digital oracle...",
        "Polishing the stethoscopes...",
        "Counting virtual coins...",
        "Asking the doctors nicely...",
        "Syncing with the mothership...",
        "Making sure the math adds up..."
    ];

    // Filters
    const [filterDoctor, setFilterDoctor] = useState('All');
    const [filterMonth, setFilterMonth] = useState('All');

    const filteredSearchResults = useMemo(() => {
        if (!searchQuery.trim()) return [];
        const q = searchQuery.toLowerCase();
        return payments.filter(p => 
            p.Payment_ID?.toLowerCase().includes(q) ||
            p.Doctor_ID?.toLowerCase().includes(q) ||
            p.Doctor_Name?.toLowerCase().includes(q)
        ).slice(0, 5);
    }, [payments, searchQuery]);

    const fetchData = async (silent = false) => {
        if (!silent) setLoading(true);
        try {
            const [docs, pays] = await Promise.all([
                fetch(`${scriptUrl}?action=get_visiting_doctors`).then(r => r.json()),
                fetch(`${scriptUrl}?action=get_visiting_payments`).then(r => r.json())
            ]);
            setDoctors(Array.isArray(docs) ? docs : []);
            setPayments(Array.isArray(pays) ? pays : []);
        } catch (err) {
            console.error('Fetch error:', err);
        }
        if (!silent) setLoading(false);
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(() => fetchData(true), 30000);
        return () => clearInterval(interval);
    }, []);

    const handleAddVisitDate = () => {
        if (!paymentFormData.currentDate) return;
        if (paymentFormData.visitDates.includes(paymentFormData.currentDate)) {
            alert("Date already added");
            return;
        }
        setPaymentFormData({
            ...paymentFormData,
            visitDates: [...paymentFormData.visitDates, paymentFormData.currentDate].sort()
        });
    };

    const removeVisitDate = (date) => {
        setPaymentFormData({
            ...paymentFormData,
            visitDates: paymentFormData.visitDates.filter(d => d !== date)
        });
    };

    const handleLogPayment = async (e) => {
        e.preventDefault();
        if (!paymentFormData.doctorId) {
            alert("Please select a doctor");
            return;
        }
        if (paymentFormData.visitDates.length === 0) {
            alert("Please add at least one visit date");
            return;
        }
        
        const grossAmount = parseFloat(paymentFormData.amountPerVisit) * paymentFormData.visitDates.length;
        const deductions = parseFloat(paymentFormData.deductions || 0);
        const netAmount = grossAmount - deductions;
        
        setSubmitting(true);
        try {
            await fetch(scriptUrl, {
                method: 'POST',
                mode: 'no-cors',
                headers: { 'Content-Type': 'text/plain' },
                body: JSON.stringify({ 
                    action: 'log_payment', 
                    ...paymentFormData,
                    grossAmount,
                    deductions,
                    netAmount,
                    visitDates: paymentFormData.visitDates.join(', '),
                    visitCount: paymentFormData.visitDates.length
                })
            });
            setTimeout(() => {
                fetchData();
                setPaymentFormData({ ...paymentFormData, amountPerVisit: '', deductions: '0', visitDates: [] });
                setSubmitting(false);
                alert(`Voucher generated! Net Payable: ₹${netAmount} (Gross: ₹${grossAmount}, Ded: ₹${deductions}).`);
            }, 1000);
        } catch (e) {
            alert("Error logging payment");
            setSubmitting(false);
        }
    };

    const onSettlePayout = async (paymentId, paidAmount, remarks, doctorData, paymentDate) => {
        setSubmitting(true);
        const payload = { 
            action: 'settle_payout', 
            paymentId, 
            paidAmount, 
            remarks,
            paymentDate,
            doctorName: doctorData.Doctor_Name,
            doctorMobile: doctorData.Mobile ? (doctorData.Mobile.toString().startsWith('91') ? doctorData.Mobile : '91' + doctorData.Mobile) : '',
            visitDates: doctorData.Visit_Dates,
            visitCount: doctorData.Visit_Count,
            grossAmount: doctorData.Gross_Amount,
            deductions: doctorData.Deductions,
            netAmount: doctorData.Net_Amount
        };

        try {
            await fetch(scriptUrl, {
                method: 'POST',
                mode: 'no-cors',
                headers: { 'Content-Type': 'text/plain' },
                body: JSON.stringify(payload)
            });
            setTimeout(() => {
                fetchData();
                setConfirmModal(null);
                setSubmitting(false);
                alert("Payout settled and WhatsApp notification sent to Doctor!");
            }, 1000);
        } catch (e) {
            alert("Error settling payout");
            setSubmitting(false);
        }
    };

    const handleAddDoctor = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await fetch(scriptUrl, {
                method: 'POST',
                mode: 'no-cors',
                headers: { 'Content-Type': 'text/plain' },
                body: JSON.stringify({ action: 'add_visiting_doctor', ...doctorFormData })
            });
            setTimeout(() => {
                fetchData();
                setDoctorFormData({ name: '', specialty: '', mobile: '', email: '' });
                setSubmitting(false);
                alert("Doctor added successfully!");
            }, 1000);
        } catch (e) {
            alert("Error adding doctor");
            setSubmitting(false);
        }
    };

    const stats = useMemo(() => {
        const pending = payments.filter(p => {
            const status = String(p.Status || '').trim().toUpperCase();
            return status === 'PENDING' || status === 'DUE';
        });
        const paid = payments.filter(p => {
            const status = String(p.Status || '').trim().toUpperCase();
            return status === 'PAID' || status === 'SETTLED';
        });
        const totalPendingAmount = pending.reduce((sum, p) => sum + (parseFloat(p.Amount_To_Pay) || 0), 0);
        
        const now = new Date();
        const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        
        const paidThisMonth = paid.filter(p => !p.Payment_Date || p.Payment_Date.startsWith(currentMonthStr));
        const totalPaidThisMonth = paidThisMonth.reduce((sum, p) => sum + (parseFloat(p.Paid_Amount || p.Amount_To_Pay) || 0), 0);
        
        return { 
            pendingCount: pending.length, 
            paidCount: paidThisMonth.length, 
            totalPendingAmount,
            totalPaidThisMonth
        };
    }, [payments]);

    const filteredHistory = useMemo(() => {
        return payments.filter(p => {
            const status = String(p.Status || '').trim().toUpperCase();
            return status === 'PAID' || status === 'SETTLED';
        }).filter(p => {
            const matchesDoctor = filterDoctor === 'All' || p.Doctor_Name === filterDoctor;
            const matchesMonth = filterMonth === 'All' || (p.Payment_Date && p.Payment_Date.startsWith(filterMonth));
            const matchesSearch = !searchQuery || p.Doctor_Name.toLowerCase().includes(searchQuery.toLowerCase());
            return matchesDoctor && matchesMonth && matchesSearch;
        });
    }, [payments, filterDoctor, filterMonth, searchQuery]);

    const paginatedHistory = useMemo(() => {
        const start = (historyPage - 1) * ITEMS_PER_PAGE;
        return filteredHistory.slice(start, start + ITEMS_PER_PAGE);
    }, [filteredHistory, historyPage]);

    const settlementsThisMonth = useMemo(() => {
        const now = new Date();
        const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        return payments.filter(p => {
            const status = String(p.Status || '').trim().toUpperCase();
            const isPaid = status === 'PAID' || status === 'SETTLED';
            if (!isPaid) return false;
            if (p.Payment_Date) return p.Payment_Date.startsWith(currentMonthStr);
            return true; // Show it if no date yet but status is Paid
        });
    }, [payments]);

    const monthOptions = useMemo(() => {
        const months = new Set();
        payments.filter(p => p.Status === 'Paid').forEach(p => {
            if (p.Payment_Date) {
                const parts = p.Payment_Date.split('-');
                if (parts.length >= 2) months.add(`${parts[0]}-${parts[1]}`);
            }
        });
        return Array.from(months).sort().reverse();
    }, [payments]);

    const loadingMessages = [
        "Syncing official payout records... 🏦",
        "Calculating totals for the month... 📊",
        "Securing accounting ledger... 🔐",
        "Preparing official advisories... 📄",
        "Updating SBH Family data... 🏥",
        "Aligning cloud financial data... ☁️"
    ];
    const [msgIdx, setMsgIdx] = useState(0);
    useEffect(() => {
        if (loading) {
            const t = setInterval(() => setMsgIdx(p => (p + 1) % loadingMessages.length), 1800);
            return () => clearInterval(t);
        }
    }, [loading]);

    if (loading || parentLoading) {
        return (
            <div className="flex flex-col items-center justify-center p-32 space-y-8 animate-in fade-in zoom-in duration-500">
                <div className="relative">
                    <div className="w-24 h-24 border-4 border-emerald-100 rounded-full animate-spin border-t-emerald-600"></div>
                    <IndianRupee className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-emerald-600" size={36} />
                </div>
                <div className="text-center">
                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 mb-3 animate-pulse">Syncing Official Records</p>
                    <p className="text-sm font-black text-slate-800 uppercase tracking-tighter italic h-5">
                        {loadingMessages[msgIdx]}
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500 pb-10 max-w-[1600px] mx-auto">
            {/* Professional Navigation Sticky Bar */}
            <div className="bg-white border-b border-slate-200 -mx-6 px-10 py-3 sticky top-0 z-30 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 md:pb-0">
                    {[
                        { id: 'HR_ENTRY', label: 'New Log', icon: Plus, show: user !== 'ACCOUNT' },
                        { id: 'ACCOUNT_PANEL', label: 'Settlement', icon: CheckCircle2, show: true },
                        { id: 'SETTLED', label: 'Paid Logs', icon: CheckCircle2, show: true },
                        { id: 'REPORT', label: 'Archive', icon: Briefcase, show: true },
                        { id: 'MASTER', label: 'Master', icon: Users, show: user !== 'ACCOUNT' }
                    ].filter(t => t.show).map(tab => (
                        <button 
                            key={tab.id}
                            onClick={() => setActiveSubTab(tab.id)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeSubTab === tab.id ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}
                        >
                            <tab.icon size={11} />
                            {tab.label}
                        </button>
                    ))}
                    <div className="w-[1px] h-5 bg-slate-200 mx-2 hidden md:block"></div>
                    <button onClick={fetchData} className="p-2 bg-slate-50 border border-slate-100 rounded-lg text-slate-400 hover:text-emerald-600 transition-all active:scale-95 shadow-sm"><RefreshCw size={12} /></button>
                </div>

                {/* Global Search Bar */}
                <div className="relative flex-1 max-w-md mx-4 group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-500 transition-colors">
                        <Search size={16} />
                    </div>
                    <input 
                        type="text" 
                        placeholder="Search ID, Doctor or Payment..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-slate-50 border-2 border-transparent rounded-2xl py-2 pl-12 pr-4 text-[11px] font-black text-slate-800 outline-none focus:bg-white focus:border-emerald-500/20 focus:ring-4 focus:ring-emerald-500/5 transition-all shadow-inner"
                    />
                    
                    {/* Search Results Dropdown */}
                    <AnimatePresence>
                        {searchQuery && filteredSearchResults.length > 0 && (
                            <motion.div 
                                initial={{ opacity: 0, y: 10 }} 
                                animate={{ opacity: 1, y: 0 }} 
                                exit={{ opacity: 0, y: 10 }}
                                className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-100 rounded-3xl shadow-2xl overflow-hidden z-[200]"
                            >
                                {filteredSearchResults.map((res, i) => (
                                    <button 
                                        key={i}
                                        onClick={() => { setSelectedPayment(res); setSearchQuery(''); }}
                                        className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-all border-b border-slate-50 last:border-0 group"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${res.Status === 'Paid' ? 'bg-emerald-50 text-emerald-600' : 'bg-orange-50 text-orange-600'}`}>
                                                <User size={14} />
                                            </div>
                                            <div className="text-left">
                                                <p className="text-[10px] font-black text-slate-800 uppercase leading-none mb-1">{res.Doctor_Name}</p>
                                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">
                                                    {res.Payment_ID} • {res.Status === 'Paid' ? `Settled: ${res.Payment_Date}` : 'Pending'}
                                                </p>
                                            </div>
                                        </div>
                                        <ChevronRight size={14} className="text-slate-300 group-hover:translate-x-1 transition-transform" />
                                    </button>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
                
                <div className="hidden md:flex items-center gap-3">
                    <div className="flex items-center gap-2 text-[8px] font-black text-slate-400 uppercase tracking-widest">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Service: Ledger-v4.1
                    </div>
                </div>
            </div>

            {activeSubTab === 'DASHBOARD' && (
                <div className="space-y-6">
                    {/* Compact Stat Matrix */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                        <div className="bg-white rounded-xl p-3 border border-slate-100 shadow-sm flex items-center gap-3 hover:border-orange-200 transition-all">
                            <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center text-orange-600"><Clock size={16} /></div>
                            <div>
                                <p className="text-[7px] font-black uppercase text-slate-400 tracking-widest mb-0.5">Pending</p>
                                <p className="text-sm font-bold text-slate-800 tracking-tight">{stats.pendingCount}</p>
                            </div>
                        </div>
                        <div className="bg-white rounded-xl p-3 border border-slate-100 shadow-sm flex items-center gap-3 hover:border-emerald-200 transition-all">
                            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600"><IndianRupee size={16} /></div>
                            <div>
                                <p className="text-[7px] font-black uppercase text-slate-400 tracking-widest mb-0.5">Due Amt</p>
                                <p className="text-sm font-bold text-slate-800 tracking-tight">₹{stats.totalPendingAmount.toLocaleString()}</p>
                            </div>
                        </div>
                        <div className="bg-white rounded-xl p-3 border border-slate-100 shadow-sm flex items-center gap-3 hover:border-blue-200 transition-all">
                            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600"><CheckCircle2 size={16} /></div>
                            <div>
                                <p className="text-[7px] font-black uppercase text-slate-400 tracking-widest mb-0.5">Paid (Count)</p>
                                <p className="text-sm font-bold text-slate-800 tracking-tight">{stats.paidCount}</p>
                            </div>
                        </div>
                        <div className="bg-white rounded-xl p-3 border border-slate-100 shadow-sm flex items-center gap-3 hover:border-indigo-200 transition-all">
                            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600"><TrendingUp size={16} /></div>
                            <div>
                                <p className="text-[7px] font-black uppercase text-slate-400 tracking-widest mb-0.5">Paid (Value)</p>
                                <p className="text-sm font-bold text-slate-800 tracking-tight">₹{stats.totalPaidThisMonth.toLocaleString()}</p>
                            </div>
                        </div>
                    </div>

                    {/* Active Pending Table */}
                    <div className="bg-white rounded-[2rem] border border-slate-200 overflow-hidden shadow-sm">
                        <div className="px-8 py-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                            <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-widest flex items-center gap-3"><Activity className="text-orange-500" size={14} /> Outstanding Payment Vouchers</h3>
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span>
                                <span className="text-[9px] font-black text-orange-600 uppercase tracking-widest">Awaiting Accounts</span>
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-slate-50">
                                    <tr className="text-[9px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100">
                                        <th className="px-8 py-4">Voucher ID</th>
                                        <th className="px-8 py-4">Consultant Name</th>
                                        <th className="px-8 py-4 text-center">Amount</th>
                                        <th className="px-8 py-4 text-center">Visit Dates</th>
                                        <th className="px-8 py-4 text-center">Count</th>
                                        <th className="px-8 py-4 text-right">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {payments.filter(p => {
                                        const status = String(p.Status || '').trim().toUpperCase();
                                        return status === 'PENDING' || status === 'DUE';
                                    }).map((p, i) => (
                                        <tr key={i} className="hover:bg-slate-50/80 transition-all group">
                                            <td className="px-6 py-3 text-[10px] font-black text-slate-400">{p.Payment_ID}</td>
                                            <td className="px-6 py-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-white transition-colors"><User size={12} /></div>
                                                    <p className="font-black text-slate-800 uppercase text-[10px]">{p.Doctor_Name}</p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-3 text-center">
                                                <span className="font-black text-slate-900 text-[10px]">₹{parseFloat(p.Amount_To_Pay).toLocaleString()}</span>
                                            </td>
                                            <td className="px-6 py-3 text-center">
                                                <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest truncate max-w-[150px] mx-auto">{p.Visit_Dates || p.Visit_Date || '—'}</div>
                                            </td>
                                            <td className="px-6 py-3 text-center">
                                                <span className="px-2 py-0.5 bg-slate-100 rounded text-[9px] font-black text-slate-600">{p.Visit_Count || (p.Visit_Dates ? p.Visit_Dates.toString().split(',').length : '0')}</span>
                                            </td>
                                            <td className="px-6 py-3 text-right">
                                                <span className="px-2 py-0.5 bg-orange-50 text-orange-600 rounded text-[8px] font-black uppercase tracking-widest border border-orange-100">Pending</span>
                                            </td>
                                        </tr>
                                    ))}
                                    {payments.filter(p => {
                                        const status = String(p.Status || '').trim().toUpperCase();
                                        return status === 'PENDING' || status === 'DUE';
                                    }).length === 0 && (
                                        <tr><td colSpan="6" className="text-center py-20 text-[11px] font-black uppercase text-slate-300 italic tracking-widest">No outstanding payments found.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {activeSubTab === 'HR_ENTRY' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Log New Payment */}
                    <div className="bg-white rounded-[2rem] p-8 border border-slate-200 shadow-sm h-fit">
                        <h3 className="text-sm font-black text-slate-800 uppercase mb-8 flex items-center gap-3"><IndianRupee className="text-emerald-500" size={18} /> Log Professional Visit</h3>
                        <form onSubmit={handleLogPayment} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Consultant Master Selection</label>
                                <select 
                                    required 
                                    value={paymentFormData.doctorId} 
                                    onChange={e => {
                                        const doc = doctors.find(d => d.Doctor_ID === e.target.value);
                                        setPaymentFormData({...paymentFormData, doctorId: e.target.value, doctorName: doc ? doc.Name : ''});
                                    }}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-[11px] font-black focus:bg-white focus:border-emerald-500/30 outline-none uppercase transition-all shadow-sm"
                                >
                                    <option value="">Choose Doctor</option>
                                    {doctors.map(d => <option key={d.Doctor_ID} value={d.Doctor_ID}>{d.Name} — {d.Specialty}</option>)}
                                </select>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Fee Per Visit (₹)</label>
                                    <div className="relative">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 font-black text-[11px]">₹</div>
                                        <input required type="number" value={paymentFormData.amountPerVisit} onChange={e => setPaymentFormData({...paymentFormData, amountPerVisit: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 pl-8 text-[12px] font-black focus:bg-white focus:border-emerald-500/30 outline-none transition-all shadow-sm" placeholder="0" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black text-rose-400 uppercase tracking-widest ml-1">Total Deductions (₹)</label>
                                    <div className="relative">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-rose-300 font-black text-[11px]">₹</div>
                                        <input type="number" value={paymentFormData.deductions} onChange={e => setPaymentFormData({...paymentFormData, deductions: e.target.value})} className="w-full bg-rose-50/30 border border-rose-100 rounded-xl p-3.5 pl-8 text-[12px] font-black text-rose-600 focus:bg-white focus:border-rose-500/30 outline-none transition-all shadow-sm" placeholder="0" />
                                    </div>
                                </div>
                            </div>

                             <div className="space-y-4 pt-4 border-t border-slate-100">
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Scheduled Visit Dates</label>
                                <div className="flex gap-3">
                                    <input type="date" value={paymentFormData.currentDate} onChange={e => setPaymentFormData({...paymentFormData, currentDate: e.target.value})} className="flex-1 bg-slate-50 border border-slate-200 rounded-xl p-3 text-[11px] font-black focus:bg-white focus:border-emerald-500/30 outline-none uppercase transition-all shadow-sm" />
                                    <button type="button" onClick={handleAddVisitDate} className="px-6 bg-emerald-600 text-white rounded-xl flex items-center justify-center hover:bg-emerald-700 transition-all shadow-md active:scale-95"><Plus size={16} /></button>
                                </div>
                                
                                <div className="flex flex-wrap gap-2 mt-2 min-h-[40px]">
                                    {paymentFormData.visitDates.map(date => (
                                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} key={date} className="flex items-center gap-2 px-4 py-2 bg-slate-50 text-slate-600 rounded-xl text-[10px] font-black border border-slate-200 shadow-sm">
                                            {date}
                                            <button type="button" onClick={() => removeVisitDate(date)} className="text-rose-500 hover:scale-110 transition-transform"><X size={12} /></button>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>

                            <div className="p-6 bg-slate-900 rounded-2xl flex flex-col gap-4 border-b-4 border-emerald-500">
                                <div className="flex justify-between items-center px-2">
                                    <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Gross Fee ({paymentFormData.visitDates.length} Visits)</p>
                                    <p className="text-sm font-black text-white/60">₹{(parseFloat(paymentFormData.amountPerVisit || 0) * paymentFormData.visitDates.length).toLocaleString()}</p>
                                </div>
                                
                                <div className="space-y-2 px-2 py-2 bg-white/5 rounded-xl">
                                    <label className="text-[8px] font-black text-rose-400 uppercase tracking-widest">Subtract Deductions (₹)</label>
                                    <input 
                                        type="number" 
                                        value={paymentFormData.deductions} 
                                        onChange={e => setPaymentFormData({...paymentFormData, deductions: e.target.value})} 
                                        className="w-full bg-transparent border-none p-0 text-lg font-black text-rose-500 outline-none" 
                                        placeholder="0" 
                                    />
                                </div>

                                <div className="h-[1px] bg-white/10" />
                                <div className="flex justify-between items-center px-2">
                                    <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Final Net Payable</p>
                                    <p className="text-3xl font-black text-white tracking-tighter">₹{((parseFloat(paymentFormData.amountPerVisit || 0) * paymentFormData.visitDates.length) - parseFloat(paymentFormData.deductions || 0)).toLocaleString()}</p>
                                </div>
                            </div>

                            <button disabled={submitting} type="submit" className="w-full py-4 bg-emerald-600 text-white rounded-xl font-black uppercase tracking-widest text-[11px] hover:bg-emerald-500 transition-all shadow-lg disabled:opacity-50 flex items-center justify-center gap-3">
                                {submitting ? <Loader2 className="animate-spin" size={14} /> : <Save size={14} />}
                                {submitting ? "Processing..." : "Confirm & Process Voucher"}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {activeSubTab === 'SETTLED' && (
                <div className="bg-white rounded-[2rem] border border-slate-200 overflow-hidden shadow-sm">
                    <div className="px-8 py-6 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-widest flex items-center gap-3"><CheckCircle2 className="text-emerald-500" size={16} /> Current Month Settlements</h3>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1 italic">Vouchers cleared in the current billing cycle</p>
                        </div>
                        <div className="px-5 py-2 bg-emerald-50 text-emerald-600 rounded-full text-[9px] font-black uppercase tracking-widest border border-emerald-100">
                            Cycle: {new Date().toLocaleString('en-GB', { month: 'long', year: 'numeric' })}
                        </div>
                    </div>
                    
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {settlementsThisMonth.map((p, i) => (
                            <motion.div 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                key={i} 
                                className="p-5 rounded-2xl bg-white border border-slate-100 hover:border-emerald-500/30 hover:shadow-xl hover:shadow-emerald-50 transition-all group"
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-all"><CheckCircle2 size={16} /></div>
                                    <div className="text-right">
                                        <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest leading-none mb-1">Paid Date</p>
                                        <p className="text-[10px] font-black text-slate-800 transition-colors">{p.Payment_Date}</p>
                                    </div>
                                </div>
                                <p className="text-[11px] font-black text-slate-900 uppercase truncate mb-0.5">{p.Doctor_Name}</p>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{p.Payment_ID}</p>
                                <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col gap-3">
                                    <div className="flex items-center justify-between">
                                        <p className="text-[14px] font-black text-emerald-600 tracking-tight">₹{parseFloat(p.Paid_Amount || p.Amount_To_Pay || 0).toLocaleString()}</p>
                                        <div className="text-right">
                                            <p className="text-[8px] font-black text-slate-400 uppercase leading-none mb-1">Credit Date</p>
                                            <p className="text-[10px] font-black text-slate-800">{p.Payment_Date}</p>
                                        </div>
                                    </div>
                                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Account Remarks</p>
                                        <p className="text-[10px] font-black text-slate-600 italic leading-snug">"{p.Account_Remarks || 'No remarks provided'}"</p>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                    
                    {/* Pagination for Monthly Settlements */}
                    {settlementsThisMonth.length > ITEMS_PER_PAGE && (
                        <div className="flex items-center justify-center gap-4 mt-8">
                            <button onClick={() => setHistoryPage(p => Math.max(1, p-1))} disabled={historyPage === 1} className="p-2 bg-white rounded-xl border border-slate-200 disabled:opacity-30"><ChevronLeft size={20} /></button>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Page {historyPage}</span>
                            <button onClick={() => setHistoryPage(p => p+1)} disabled={historyPage * ITEMS_PER_PAGE >= filteredHistory.length} className="p-2 bg-white rounded-xl border border-slate-200 disabled:opacity-30"><ChevronRight size={20} /></button>
                        </div>
                    )}
                </div>
            )}



            {activeSubTab === 'REPORT' && (
                <div className="bg-white rounded-[2rem] border border-slate-200 overflow-hidden shadow-sm">
                    <div className="px-8 py-6 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm text-emerald-600 border border-emerald-50"><Briefcase size={18} /></div>
                            <div>
                                <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-widest">Financial Archive History</h3>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5 italic">Permanent record of settled consultants</p>
                            </div>
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-3">
                            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm">
                                <User size={14} className="text-slate-300" />
                                <select value={filterDoctor} onChange={e => setFilterDoctor(e.target.value)} className="bg-transparent text-[10px] font-black uppercase tracking-widest outline-none text-slate-700 min-w-[120px]">
                                    <option value="All">All Doctors</option>
                                    {doctors.map(d => <option key={d.Doctor_ID} value={d.Name}>{d.Name}</option>)}
                                </select>
                            </div>
                            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm">
                                <Calendar size={14} className="text-slate-300" />
                                <select value={filterMonth} onChange={e => setFilterMonth(e.target.value)} className="bg-transparent text-[10px] font-black uppercase tracking-widest outline-none text-slate-700 min-w-[100px]">
                                    <option value="All">All Time</option>
                                    {monthOptions.map(m => <option key={m} value={m}>{m}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="overflow-x-auto custom-scrollbar" style={{ maxHeight: '600px' }}>
                        <table className="w-full text-left min-w-[1000px]">
                            <thead className="bg-slate-50 sticky top-0 z-10 border-b border-slate-200">
                                <tr className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                                    <th className="px-8 py-4">Ref ID</th>
                                    <th className="px-8 py-4">Consultant</th>
                                    <th className="px-8 py-4 text-center">Invoiced</th>
                                    <th className="px-8 py-4 text-center">Settled</th>
                                    <th className="px-8 py-4 text-center">Date</th>
                                    <th className="px-8 py-4 text-right">Remarks</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {paginatedHistory.map((p, i) => (
                                    <tr key={i} className="hover:bg-emerald-50/30 transition-all group">
                                        <td className="px-8 py-3.5 text-[10px] font-black text-slate-400">{p.Payment_ID}</td>
                                        <td className="px-8 py-3.5">
                                            <p className="font-black text-slate-800 uppercase text-[11px]">{p.Doctor_Name}</p>
                                            <p className="text-[9px] text-slate-400 font-black uppercase">{p.Visit_Count} Visits</p>
                                        </td>
                                        <td className="px-8 py-3.5 text-center text-[11px] font-black text-slate-500">₹{p.Amount_To_Pay}</td>
                                        <td className="px-8 py-3.5 text-center">
                                            <span className="inline-block px-3 py-1 bg-emerald-600 text-white rounded-lg text-[10px] font-black shadow-md">
                                                ₹{parseFloat(p.Paid_Amount || p.Amount_To_Pay || p.Net_Amount || 0).toLocaleString()}
                                            </span>
                                        </td>
                                        <td className="px-8 py-3.5 text-center">
                                            <div className="text-[10px] font-black text-slate-700 uppercase tracking-widest">{p.Payment_Date}</div>
                                        </td>
                                        <td className="px-8 py-3.5 text-right">
                                            <p className="text-[10px] font-black text-slate-500 italic max-w-[200px] ml-auto">"{p.Account_Remarks || 'No Remarks'}"</p>
                                        </td>
                                    </tr>
                                ))}
                                {filteredHistory.length === 0 && (
                                    <tr><td colSpan="6" className="text-center py-20 text-[11px] font-black uppercase text-slate-300 italic tracking-widest">No matching records found.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {activeSubTab === 'ACCOUNT_PANEL' && (
                <AccountSettlementPanel 
                    pending={payments.filter(p => {
                        const status = String(p.Status || '').trim().toUpperCase();
                        return status === 'PENDING' || status === 'DUE';
                    })} 
                    doctors={doctors}
                    onSettle={(paymentId, amount, remarks, docData) => {
                        setConfirmModal({ 
                            paymentId, 
                            amount, 
                            remarks: 'Official fee processed. Amount will be credited to your account shortly.', 
                            docData,
                            paymentDate: new Date().toISOString().split('T')[0]
                        });
                    }}
                    submitting={submitting}
                />
            )}

            {activeSubTab === 'MASTER' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-[2rem] p-8 border border-slate-200 shadow-sm">
                            <h3 className="text-sm font-black text-slate-800 uppercase mb-8 flex items-center gap-3"><Plus className="text-blue-600" size={18} /> New Consultant</h3>
                            <form onSubmit={handleAddDoctor} className="space-y-5">
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                                    <input required value={doctorFormData.name} onChange={e => setDoctorFormData({...doctorFormData, name: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-[11px] font-black outline-none focus:bg-white focus:border-blue-500 transition-all" placeholder="Dr. Name" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Specialty</label>
                                    <input value={doctorFormData.specialty} onChange={e => setDoctorFormData({...doctorFormData, specialty: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-[11px] font-black outline-none focus:bg-white focus:border-blue-500 transition-all" placeholder="Department" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Contact No.</label>
                                    <input required value={doctorFormData.mobile} onChange={e => setDoctorFormData({...doctorFormData, mobile: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-[11px] font-black outline-none focus:bg-white focus:border-blue-500 transition-all" placeholder="Mobile" />
                                </div>
                                <button disabled={submitting} type="submit" className="w-full py-4 bg-blue-600 text-white rounded-xl font-black uppercase text-[11px] tracking-widest hover:bg-blue-700 transition-all shadow-lg active:scale-95">{submitting ? '...' : 'Register Consultant'}</button>
                            </form>
                        </div>
                    </div>
                    
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-[2rem] border border-slate-200 overflow-hidden shadow-sm">
                            <div className="px-8 py-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                                <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Consultant Master Directory</h3>
                                <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-[9px] font-black uppercase">{doctors.length} Registered</span>
                            </div>
                            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                                {doctors.filter(d => !searchQuery || d.Name.toLowerCase().includes(searchQuery.toLowerCase())).slice((masterPage-1)*8, masterPage*8).map((d, i) => (
                                    <div key={i} className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-xl hover:border-blue-200 transition-all group">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all"><User size={18} /></div>
                                            <div>
                                                <p className="font-black text-slate-800 uppercase text-[11px] mb-0.5">{d.Name}</p>
                                                <p className="text-[9px] text-blue-600 font-black uppercase tracking-widest">{d.Specialty}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] font-black text-slate-900 mb-0.5">{d.Mobile}</p>
                                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Active</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="px-8 py-4 border-t border-slate-50 flex items-center justify-between">
                                <button onClick={() => setMasterPage(p => Math.max(1, p-1))} disabled={masterPage === 1} className="p-2 hover:bg-slate-50 rounded-lg disabled:opacity-30"><ChevronLeft size={16} /></button>
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Page {masterPage}</span>
                                <button onClick={() => setMasterPage(p => p+1)} disabled={masterPage * 8 >= doctors.length} className="p-2 hover:bg-slate-50 rounded-lg disabled:opacity-30"><ChevronRight size={16} /></button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Payout Confirmation Modal */}
            <AnimatePresence>
                {confirmModal && (
                    <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setConfirmModal(null)} className="absolute inset-0 bg-slate-900/80 backdrop-blur-md" />
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative w-full max-w-md bg-white rounded-[3rem] p-10 shadow-2xl space-y-8">
                            <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-[2rem] flex items-center justify-center mx-auto">
                                <IndianRupee size={40} />
                            </div>
                            <div className="text-center space-y-2">
                                <h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter">Confirm Payout?</h3>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-relaxed">
                                    You are about to settle the visiting fee for <br/>
                                    <span className="text-slate-800 font-black">{confirmModal.docData.Doctor_Name}</span>.
                                </p>
                            </div>

                            <div className="bg-slate-50 rounded-2xl p-6 space-y-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Net Amount</span>
                                    <span className="text-lg font-black text-slate-900">₹{parseFloat(confirmModal.docData.Amount_To_Pay || confirmModal.docData.Net_Amount || 0).toLocaleString()}</span>
                                </div>
                                <div className="space-y-4 pt-2 border-t border-slate-200/50">
                                    <div className="space-y-1">
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Credit Date</label>
                                        <input 
                                            type="date" 
                                            value={confirmModal.paymentDate}
                                            onChange={(e) => setConfirmModal({ ...confirmModal, paymentDate: e.target.value })}
                                            className="w-full bg-white border border-slate-200 rounded-xl p-3 text-[11px] font-black outline-none focus:border-emerald-500 transition-all"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Account Remarks</label>
                                        <input 
                                            type="text" 
                                            value={confirmModal.remarks}
                                            onChange={(e) => setConfirmModal({ ...confirmModal, remarks: e.target.value })}
                                            placeholder="Add remarks..."
                                            className="w-full bg-white border border-slate-200 rounded-2xl p-4 text-[11px] font-black outline-none focus:border-emerald-500 transition-all"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <button 
                                    onClick={() => setConfirmModal(null)}
                                    className="flex-1 py-4 bg-slate-50 text-slate-400 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 transition-all"
                                >
                                    Cancel
                                </button>
                                <button 
                                    disabled={submitting}
                                    onClick={() => onSettlePayout(confirmModal.paymentId, confirmModal.amount, confirmModal.remarks, confirmModal.docData, confirmModal.paymentDate)}
                                    className="flex-1 py-4 bg-emerald-600 text-white rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl shadow-emerald-600/20 active:scale-95 transition-all disabled:opacity-50"
                                >
                                    {submitting ? (
                                        <div className="flex items-center justify-center gap-2">
                                            <Loader2 className="animate-spin" size={14} />
                                            <span>Processing...</span>
                                        </div>
                                    ) : "Confirm & Pay"}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Global Search Detail Popup */}
            <AnimatePresence>
                {selectedPayment && (
                    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }} 
                            animate={{ opacity: 1 }} 
                            exit={{ opacity: 0 }} 
                            onClick={() => setSelectedPayment(null)}
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
                        />
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0, y: 20 }} 
                            animate={{ scale: 1, opacity: 1, y: 0 }} 
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="relative w-full max-w-md bg-white rounded-[3rem] shadow-2xl overflow-hidden border border-slate-100"
                        >
                            <div className="p-8 md:p-10">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="px-4 py-1 bg-slate-100 rounded-full text-[8px] font-black text-slate-400 uppercase tracking-widest border border-slate-200">
                                        Ref: {selectedPayment.Payment_ID}
                                    </div>
                                    <button onClick={() => setSelectedPayment(null)} className="p-2 hover:bg-slate-50 rounded-full transition-colors text-slate-400"><X size={16} /></button>
                                </div>

                                <div className="text-center mb-6">
                                    <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-50">
                                        <Award size={32} />
                                    </div>
                                    <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tighter leading-none mb-2">{selectedPayment.Doctor_Name}</h3>
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Consultant Profile</p>
                                </div>

                                <div className="space-y-3 bg-slate-50 rounded-[2rem] p-6 border border-slate-100 mb-8">
                                    <div className="flex items-center justify-between py-2.5 border-b border-slate-200/50">
                                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em]">Raised Date</p>
                                        <p className="text-[10px] font-black text-slate-800">{selectedPayment.HR_Entry_Date || '—'}</p>
                                    </div>
                                    {selectedPayment.Status === 'Paid' && (
                                        <div className="flex items-center justify-between py-2.5 border-b border-slate-200/50">
                                            <p className="text-[8px] font-black text-emerald-600 uppercase tracking-[0.2em]">Settled On</p>
                                            <p className="text-[10px] font-black text-emerald-700">{selectedPayment.Payment_Date}</p>
                                        </div>
                                    )}
                                    <div className="flex items-center justify-between py-2.5 border-b border-slate-200/50">
                                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em]">Status</p>
                                        <span className={`px-3 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest ${selectedPayment.Status === 'Paid' ? 'bg-emerald-500 text-white shadow-md' : 'bg-orange-100 text-orange-600'}`}>
                                            {selectedPayment.Status === 'Paid' ? 'Settled' : 'In Process'}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between py-2.5 border-b border-slate-200/50">
                                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em]">Gross Amt</p>
                                        <p className="text-[10px] font-black text-slate-800">₹{(selectedPayment.Gross_Amount || 0).toLocaleString()}</p>
                                    </div>
                                    <div className="flex items-center justify-between py-2.5 border-b border-slate-200/50">
                                        <p className="text-[8px] font-black text-rose-600 uppercase tracking-[0.2em]">Deductions</p>
                                        <p className="text-[10px] font-black text-rose-700">-₹{(selectedPayment.Deductions || 0).toLocaleString()}</p>
                                    </div>
                                    <div className="flex items-center justify-between py-2.5 border-b border-slate-200/50">
                                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em]">Net Paid</p>
                                        <p className="text-xl font-black text-slate-900 tracking-tighter">₹{(selectedPayment.Net_Amount || selectedPayment.Amount_To_Pay || 0).toLocaleString()}</p>
                                    </div>
                                    <div className="flex items-center justify-between py-2.5">
                                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em]">Source</p>
                                        <div className="flex items-center gap-2 text-[9px] font-black text-slate-600 uppercase italic">
                                            <div className={`w-1.5 h-1.5 rounded-full ${selectedPayment.Status === 'Paid' ? 'bg-emerald-500' : 'bg-orange-500 animate-pulse'}`}></div>
                                            {selectedPayment.Status === 'Paid' ? 'Archive' : 'Accounting'}
                                        </div>
                                    </div>
                                </div>

                                <button onClick={() => setSelectedPayment(null)} className="w-full py-4 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-emerald-600 transition-all shadow-xl flex items-center justify-center gap-3 group">
                                    <CheckCircle2 size={16} className="group-hover:rotate-12 transition-transform" /> Close Record
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

const AccountSettlementPanel = ({ pending, doctors, onSettle, submitting }) => {
    const [remarks, setRemarks] = useState({});

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
                <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                    <Clock className="text-orange-500" size={14} /> Payouts Awaiting Settlement
                </h3>
            </div>
            
            {pending.length === 0 ? (
                <div className="bg-white rounded-3xl border border-dashed border-slate-200 py-20 text-center">
                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">No pending payouts found</p>
                </div>
            ) : (
                pending.map((item, idx) => {
                    const doc = doctors.find(d => d.Doctor_ID === item.Doctor_ID);
                    return (
                        <div key={idx} className="bg-white rounded-[2rem] border border-slate-100 p-8 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-8 hover:border-emerald-200 transition-all group">
                            <div className="flex items-center gap-6">
                                <div className="w-14 h-14 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center font-black border border-slate-100 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-all">
                                    <Stethoscope size={24} />
                                </div>
                                <div>
                                    <h4 className="text-lg font-black text-slate-800 uppercase tracking-tighter leading-none mb-2">{item.Doctor_Name}</h4>
                                    <div className="flex items-center gap-3">
                                        <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">{doc?.Specialty || 'Consultant'}</span>
                                        <span className="w-1 h-1 bg-slate-200 rounded-full" />
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{item.Visit_Count} Visits</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="flex-1 lg:px-10 space-y-4">
                                <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
                                    <div className="md:col-span-2"><p className="text-[8px] font-black text-slate-400 uppercase mb-1">Visit Dates</p><p className="text-[10px] font-black text-slate-600 leading-relaxed">{item.Visit_Dates || '—'}</p></div>
                                    <div><p className="text-[8px] font-black text-slate-400 uppercase mb-1">Gross</p><p className="text-[10px] font-black text-slate-800">₹{(item.Gross_Amount || 0).toLocaleString()}</p></div>
                                    <div><p className="text-[8px] font-black text-rose-500 uppercase mb-1">Ded.</p><p className="text-[10px] font-black text-rose-600">₹{(item.Deductions || 0).toLocaleString()}</p></div>
                                    <div><p className="text-[8px] font-black text-emerald-600 uppercase mb-1">Net Pay</p><p className="text-lg font-black text-emerald-600 tracking-tighter">₹{(item.Net_Amount || item.Amount_To_Pay || 0).toLocaleString()}</p></div>
                                </div>
                                <input 
                                    type="text" 
                                    placeholder="Add settlement remarks..." 
                                    value={remarks[item.Payment_ID] || ''} 
                                    onChange={(e) => setRemarks({ ...remarks, [item.Payment_ID]: e.target.value })} 
                                    className="w-full bg-slate-50 border-none rounded-xl py-3 px-4 text-[10px] font-black outline-none focus:ring-2 focus:ring-emerald-500/10 transition-all" 
                                />
                            </div>

                            <button 
                                onClick={() => onSettle(item.Payment_ID, item.Amount_To_Pay, remarks[item.Payment_ID], { ...item, ...doc })} 
                                disabled={submitting} 
                                className="px-8 py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-3 shadow-xl hover:bg-emerald-600 transition-all active:scale-95 disabled:opacity-50"
                            >
                                {submitting ? <Loader2 className="animate-spin" size={16} /> : <><CheckCircle2 size={16} /> Settle Payout</>}
                            </button>
                        </div>
                    );
                })
            )}
        </div>
    );
};

export default VisitingManager;
