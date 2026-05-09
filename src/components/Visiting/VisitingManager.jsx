import React, { useState, useEffect, useMemo } from 'react';
import { 
    Users, Plus, Calendar, IndianRupee, Clock, CheckCircle2, 
    AlertCircle, Search, Filter, Loader2, Save, X, Phone, 
    Stethoscope, Briefcase, TrendingUp, BarChart3, Download, Activity, User, RefreshCw, ChevronRight, Award, Linkedin, ChevronLeft, History
} from 'lucide-react';

const getVal = (obj, key) => {
    if (!obj) return '';
    const foundKey = Object.keys(obj).find(k => k.toLowerCase() === key.toLowerCase());
    return foundKey ? obj[foundKey] : '';
};

const formatCurrency = (val) => {
    if (!val) return 0;
    if (typeof val === 'number') return val;
    const clean = String(val).replace(/[₹,]/g, '').trim();
    return parseFloat(clean) || 0;
};

const formatDateReadable = (dateStr) => {
    if (!dateStr) return "-";
    try {
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch (e) { return dateStr; }
};

const VisitingManager = ({ scriptUrl, user, loading: parentLoading }) => {
    const [activeSubTab, setActiveSubTab] = useState('DASHBOARD'); 
    const [doctors, setDoctors] = useState([]);
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingMessage, setLoadingMessage] = useState("Consulting the digital oracle...");
    const [submitting, setSubmitting] = useState(false);
    const [confirmModal, setConfirmModal] = useState(null);
    const [showDoctorForm, setShowDoctorForm] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedPayment, setSelectedPayment] = useState(null);
    const [selectedDoctor, setSelectedDoctor] = useState(null);
    const [masterPage, setMasterPage] = useState(1);
    const [historyPage, setHistoryPage] = useState(1);
    const ITEMS_PER_PAGE = 8;
    
    const [doctorFormData, setDoctorFormData] = useState({ name: '', specialty: '', mobile: '', email: '' });
    const [paymentFormData, setPaymentFormData] = useState({ 
        doctorId: '', 
        doctorName: '', 
        amountPerVisit: '', 
        deductions: '0',
        visitDates: [], 
        currentDate: new Date().toISOString().split('T')[0] 
    });

    // Filters
    const [filterDoctor, setFilterDoctor] = useState('All');
    const [filterMonth, setFilterMonth] = useState('All');
    const [filterYear, setFilterYear] = useState(new Date().getFullYear().toString());

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

    const stats = useMemo(() => {
        const pending = payments.filter(p => {
            const status = String(p.Status || '').trim().toUpperCase();
            return status === 'PENDING' || status === 'DUE';
        });
        const settled = payments.filter(p => {
            const status = String(p.Status || '').trim().toUpperCase();
            return status === 'PAID' || status === 'SETTLED';
        });
        
        const now = new Date();
        const currentMonthName = now.toLocaleString('en-US', { month: 'long' });
        const currentYearStr = now.getFullYear().toString();
        
        const settledThisMonth = settled.filter(p => 
            (p.Month === currentMonthName && p.Year === currentYearStr) ||
            (p.Payment_Date && p.Payment_Date.startsWith(now.toISOString().slice(0, 7)))
        );

        return { 
            pendingCount: pending.length, 
            pendingAmount: pending.reduce((sum, p) => sum + formatCurrency(p.Amount_To_Pay), 0),
            settledMonthCount: settledThisMonth.length,
            settledMonthAmount: settledThisMonth.reduce((sum, p) => sum + formatCurrency(p.Paid_Amount || p.Amount_To_Pay), 0),
            totalDoctors: doctors.length
        };
    }, [payments, doctors]);

    const filteredHistory = useMemo(() => {
        const filtered = payments.filter(p => {
            const status = String(p.Status || '').trim().toUpperCase();
            const isSettled = status === 'PAID' || status === 'SETTLED';
            if (!isSettled) return false;

            const pMonth = String(p.Month || '').trim();
            const pYear = String(p.Year || '').trim();
            const pDate = String(p.Payment_Date || '').trim();

            const matchesDoctor = filterDoctor === 'All' || p.Doctor_Name === filterDoctor;
            
            // Robust Month Match
            let matchesMonth = filterMonth === 'All' || pMonth === filterMonth;
            if (filterMonth !== 'All' && !matchesMonth && pDate) {
                const monthIndex = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].indexOf(filterMonth) + 1;
                const monthStr = monthIndex < 10 ? `0${monthIndex}` : `${monthIndex}`;
                matchesMonth = pDate.includes(`-${monthStr}-`);
            }

            // Robust Year Match
            let matchesYear = filterYear === 'All' || pYear === filterYear;
            if (filterYear !== 'All' && !matchesYear && pDate) {
                matchesYear = pDate.startsWith(filterYear);
            }

            const matchesSearch = !searchQuery || 
                p.Doctor_Name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                p.Payment_ID?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                p.Settlement_ID?.toLowerCase().includes(searchQuery.toLowerCase());
            
            return matchesDoctor && matchesMonth && matchesYear && matchesSearch;
        });

        const totalAmount = filtered.reduce((sum, p) => sum + formatCurrency(p.Paid_Amount || p.Amount_To_Pay), 0);
        return { data: filtered, totalAmount, count: filtered.length };
    }, [payments, filterDoctor, filterMonth, filterYear, searchQuery]);

    const paginatedHistory = useMemo(() => {
        const start = (historyPage - 1) * ITEMS_PER_PAGE;
        return filteredHistory.data.slice(start, start + ITEMS_PER_PAGE);
    }, [filteredHistory, historyPage]);

    const handleLogPayment = async (e) => {
        e.preventDefault();
        if (!paymentFormData.doctorId) return alert("Select a doctor");
        if (paymentFormData.visitDates.length === 0) return alert("Add visit dates");
        
        const grossAmount = parseFloat(paymentFormData.amountPerVisit) * paymentFormData.visitDates.length;
        const deductions = parseFloat(paymentFormData.deductions || 0);
        const netAmount = grossAmount - deductions;
        
        setSubmitting(true);
        try {
            await fetch(scriptUrl, {
                method: 'POST',
                mode: 'no-cors',
                body: JSON.stringify({ 
                    action: 'log_payment', 
                    ...paymentFormData,
                    grossAmount, deductions, netAmount,
                    visitCount: paymentFormData.visitDates.length
                })
            });
            setTimeout(() => {
                fetchData();
                setPaymentFormData({ ...paymentFormData, amountPerVisit: '', deductions: '0', visitDates: [] });
                setSubmitting(false);
                alert("Voucher logged successfully!");
            }, 1000);
        } catch (e) { alert("Error logging payment"); setSubmitting(false); }
    };

    const handleAddDoctor = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await fetch(scriptUrl, {
                method: 'POST',
                mode: 'no-cors',
                body: JSON.stringify({ action: 'add_visiting_doctor', ...doctorFormData })
            });
            setTimeout(() => {
                fetchData();
                setDoctorFormData({ name: '', specialty: '', mobile: '', email: '' });
                setSubmitting(false);
                alert("Consultant registered successfully!");
            }, 1000);
        } catch (e) { alert("Error registering doctor"); setSubmitting(false); }
    };

    const onSettlePayout = async (paymentId, paidAmount, remarks, doctorData, paymentDate) => {
        setSubmitting(true);
        try {
            await fetch(scriptUrl, {
                method: 'POST',
                mode: 'no-cors',
                body: JSON.stringify({ 
                    action: 'settle_payout', 
                    paymentId, paidAmount, remarks, paymentDate,
                    doctorName: doctorData.Doctor_Name,
                    doctorMobile: doctorData.Mobile || doctors.find(d => d.Doctor_ID === doctorData.Doctor_ID)?.Mobile,
                    visitDates: doctorData.Visit_Dates,
                    visitCount: doctorData.Visit_Count,
                    grossAmount: doctorData.Gross_Amount,
                    deductions: doctorData.Deductions
                })
            });
            setTimeout(() => {
                fetchData();
                setConfirmModal(null);
                setSubmitting(false);
                alert("Payout settled successfully!");
            }, 1000);
        } catch (e) { alert("Error settling payout"); setSubmitting(false); }
    };

    const loadingMessages = ["Syncing official records...", "Calculating totals...", "Preparing advisories...", "Updating doctor master..."];
    const [msgIdx, setMsgIdx] = useState(0);
    useEffect(() => {
        if (loading) {
            const t = setInterval(() => setMsgIdx(p => (p + 1) % loadingMessages.length), 1500);
            return () => clearInterval(t);
        }
    }, [loading]);

    if (loading || parentLoading) {
        return (
            <div className="flex flex-col items-center justify-center p-32 space-y-8">
                <div className="relative">
                    <div className="w-24 h-24 border-4 border-orange-100 rounded-full animate-spin border-t-orange-600"></div>
                    <IndianRupee className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-orange-600" size={36} />
                </div>
                <p className="text-sm font-black text-slate-800 uppercase tracking-tighter italic">{loadingMessages[msgIdx]}</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-20 max-w-[1600px] mx-auto px-4">
            {/* Header / Nav */}
            <div className="bg-white rounded-[2rem] border border-slate-100 p-4 sticky top-0 z-40 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 md:pb-0">
                    {[
                        { id: 'DASHBOARD', label: 'Overview', icon: Activity },
                        { id: 'HR_ENTRY', label: 'Voucher Desk', icon: Plus },
                        { id: 'ACCOUNT_PANEL', label: 'Payout Desk', icon: IndianRupee },
                        { id: 'REPORT', label: 'History', icon: Clock },
                        { id: 'MASTER', label: 'Doctor Master', icon: Stethoscope },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveSubTab(tab.id)}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                activeSubTab === tab.id 
                                ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/20' 
                                : 'text-slate-400 hover:bg-slate-50'
                            }`}
                        >
                            <tab.icon size={14} />
                            <span>{tab.label}</span>
                        </button>
                    ))}
                    <button onClick={fetchData} className="p-2.5 text-slate-400 hover:text-orange-600 transition-all"><RefreshCw size={14} /></button>
                </div>

                <div className="relative flex-1 max-w-md group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-orange-500" size={16} />
                    <input 
                        type="text" 
                        placeholder="Search ID or Doctor..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-slate-50 border-none rounded-2xl py-2.5 pl-12 pr-4 text-[11px] font-bold text-slate-700 outline-none focus:bg-white focus:ring-4 focus:ring-orange-500/5 transition-all"
                    />
                </div>
            </div>

            {activeSubTab === 'DASHBOARD' && (
                <div className="space-y-8">
                    {/* Stat Matrix */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <InteractiveStatCard 
                            icon={<Clock />} label="Pending Settlements" 
                            value={`₹${stats.pendingAmount.toLocaleString()}`} 
                            subValue={`${stats.pendingCount} Vouchers Awaiting`}
                            color="bg-orange-500"
                            onClick={() => setActiveSubTab('ACCOUNT_PANEL')}
                        />
                        <InteractiveStatCard 
                            icon={<CheckCircle2 />} label="Paid This Month" 
                            value={`₹${stats.settledMonthAmount.toLocaleString()}`} 
                            subValue={`${stats.settledMonthCount} Payouts Completed`}
                            color="bg-emerald-600"
                            onClick={() => setActiveSubTab('REPORT')}
                        />
                        <InteractiveStatCard 
                            icon={<TrendingUp />} label="Total Registered" 
                            value={stats.totalDoctors} 
                            subValue="Active Consultants"
                            color="bg-blue-600"
                            onClick={() => setActiveSubTab('MASTER')}
                        />
                        <InteractiveStatCard 
                            icon={<BarChart3 />} label="Financial Health" 
                            value="Optimal" 
                            subValue="System Fully Operational"
                            color="bg-slate-900"
                        />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Recent Pending */}
                        <div className="lg:col-span-2 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
                            <div className="px-8 py-6 border-b border-slate-50 flex items-center justify-between">
                                <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-800">Priority Payouts</h3>
                                <button onClick={() => setActiveSubTab('ACCOUNT_PANEL')} className="text-[9px] font-black uppercase text-orange-600 hover:underline">View All</button>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <tbody className="divide-y divide-slate-50">
                                        {payments.filter(p => p.Status === 'Pending').slice(0, 5).map((p, i) => (
                                            <tr key={i} className="hover:bg-slate-50 transition-colors group">
                                                <td className="px-8 py-5">
                                                    <div className="text-[11px] font-black text-slate-900">{p.Doctor_Name}</div>
                                                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">{p.Payment_ID}</p>
                                                </td>
                                                <td className="px-8 py-5 text-center">
                                                    <span className="px-3 py-1 bg-slate-100 rounded-lg text-[9px] font-black text-slate-500">{p.Visit_Count} Visits</span>
                                                </td>
                                                <td className="px-8 py-5 text-right">
                                                    <p className="text-[12px] font-black text-slate-900 tracking-tight">₹{parseFloat(p.Amount_To_Pay).toLocaleString()}</p>
                                                    <button onClick={() => setActiveSubTab('ACCOUNT_PANEL')} className="text-[8px] font-black text-orange-600 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all">Settle Now →</button>
                                                </td>
                                            </tr>
                                        ))}
                                        {payments.filter(p => p.Status === 'Pending').length === 0 && (
                                            <tr><td className="px-8 py-20 text-center text-[10px] font-bold text-slate-300 uppercase tracking-widest">No pending payouts</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Quick Actions / Master Link */}
                        <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2 group-hover:bg-orange-500/20 transition-all" />
                            <h3 className="text-xl font-black uppercase tracking-tighter mb-2">Master Ledger</h3>
                            <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-8 leading-relaxed">Manage consultant profiles and view lifetime settlement history.</p>
                            
                            <div className="space-y-4">
                                {doctors.slice(0, 3).map((d, i) => (
                                    <div key={i} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 transition-all cursor-pointer" onClick={() => { setSelectedDoctor(d); }}>
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-orange-500/20 flex items-center justify-center text-orange-400"><User size={14} /></div>
                                            <div>
                                                <p className="text-[10px] font-black uppercase tracking-tight">{d.Name}</p>
                                                <p className="text-[8px] font-bold text-white/30 uppercase tracking-widest">{d.Specialty}</p>
                                            </div>
                                        </div>
                                        <ChevronRight size={14} className="text-white/20" />
                                    </div>
                                ))}
                            </div>
                            
                            <button 
                                onClick={() => setActiveSubTab('MASTER')}
                                className="w-full mt-8 py-4 bg-orange-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-orange-500 transition-all shadow-xl shadow-orange-600/20"
                            >
                                Explore Directory
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {activeSubTab === 'HR_ENTRY' && (
                <div className="max-w-3xl mx-auto">
                    <div className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-sm">
                        <div className="flex items-center gap-4 mb-10">
                            <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-2xl flex items-center justify-center border border-orange-100"><Plus size={24} /></div>
                            <div>
                                <h3 className="text-lg font-black uppercase tracking-tighter text-slate-800">Generate Payout Voucher</h3>
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Administrative Fee Processing</p>
                            </div>
                        </div>

                        <form onSubmit={handleLogPayment} className="space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Consultant</label>
                                    <select 
                                        required 
                                        value={paymentFormData.doctorId} 
                                        onChange={e => {
                                            const doc = doctors.find(d => d.Doctor_ID === e.target.value);
                                            setPaymentFormData({...paymentFormData, doctorId: e.target.value, doctorName: doc ? doc.Name : ''});
                                        }}
                                        className="w-full bg-slate-50 border-none rounded-2xl py-4 px-6 text-[11px] font-bold outline-none focus:ring-4 focus:ring-orange-500/5 transition-all appearance-none"
                                    >
                                        <option value="">Select Doctor...</option>
                                        {doctors.map(d => <option key={d.Doctor_ID} value={d.Doctor_ID}>{d.Name} — {d.Specialty}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Fee Per Visit (₹)</label>
                                    <input required type="number" value={paymentFormData.amountPerVisit} onChange={e => setPaymentFormData({...paymentFormData, amountPerVisit: e.target.value})} className="w-full bg-slate-50 border-none rounded-2xl py-4 px-6 text-[11px] font-bold outline-none focus:ring-4 focus:ring-orange-500/5 transition-all" placeholder="0" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Deductions (₹)</label>
                                    <input type="number" value={paymentFormData.deductions} onChange={e => setPaymentFormData({...paymentFormData, deductions: e.target.value})} className="w-full bg-slate-50 border-none rounded-2xl py-4 px-6 text-[11px] font-bold outline-none focus:ring-4 focus:ring-orange-500/5 transition-all" placeholder="0" />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Visit Dates Selection</label>
                                <div className="flex gap-4">
                                    <input type="date" value={paymentFormData.currentDate} onChange={e => setPaymentFormData({...paymentFormData, currentDate: e.target.value})} className="flex-1 bg-slate-50 border-none rounded-2xl py-3 px-6 text-[11px] font-bold outline-none" />
                                    <button type="button" onClick={() => {
                                        if (paymentFormData.visitDates.includes(paymentFormData.currentDate)) return;
                                        setPaymentFormData({...paymentFormData, visitDates: [...paymentFormData.visitDates, paymentFormData.currentDate].sort()});
                                    }} className="px-6 bg-slate-900 text-white rounded-2xl hover:bg-orange-600 transition-all"><Plus size={18} /></button>
                                </div>
                                <div className="flex flex-wrap gap-2 pt-2">
                                    {paymentFormData.visitDates.map(date => (
                                        <div key={date} className="px-4 py-2 bg-orange-50 text-orange-600 rounded-xl text-[10px] font-black border border-orange-100 flex items-center gap-2">
                                            {date}
                                            <button type="button" onClick={() => setPaymentFormData({...paymentFormData, visitDates: paymentFormData.visitDates.filter(d => d !== date)})}><X size={12} /></button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="p-8 bg-slate-900 rounded-[2.5rem] flex items-center justify-between shadow-2xl relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2" />
                                <div>
                                    <p className="text-[9px] font-black uppercase tracking-widest text-white/40 mb-1">Total Net Payable</p>
                                    <p className="text-3xl font-black text-white tracking-tighter">₹{((parseFloat(paymentFormData.amountPerVisit || 0) * paymentFormData.visitDates.length) - parseFloat(paymentFormData.deductions || 0)).toLocaleString()}</p>
                                </div>
                                <button 
                                    disabled={submitting} 
                                    type="submit" 
                                    className="px-10 py-4 bg-orange-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-orange-500 transition-all shadow-xl shadow-orange-600/20 active:scale-95 flex items-center gap-2"
                                >
                                    {submitting ? <Loader2 className="animate-spin" size={14} /> : <Save size={14} />}
                                    Process Voucher
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {activeSubTab === 'REPORT' && (
                <div className="space-y-6">
                    <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center border border-blue-100"><History size={24} /></div>
                            <div>
                                <h3 className="text-lg font-black uppercase tracking-tighter text-slate-800">Financial Archive</h3>
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Audited Settlement Records</p>
                            </div>
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-3">
                            <FilterSelect value={filterDoctor} onChange={setFilterDoctor} options={['All', ...doctors.map(d => d.Name)]} icon={<User size={12} />} />
                            <FilterSelect value={filterMonth} onChange={setFilterMonth} options={['All', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']} icon={<Calendar size={12} />} />
                            <FilterSelect value={filterYear} onChange={setFilterYear} options={['All', '2024', '2025', '2026']} icon={<Activity size={12} />} />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-slate-900 rounded-[2rem] p-6 text-white flex flex-col justify-center">
                            <p className="text-[9px] font-black uppercase tracking-widest text-white/40 mb-1">Filtered Total</p>
                            <p className="text-2xl font-black tracking-tighter">₹{filteredHistory.totalAmount.toLocaleString()}</p>
                        </div>
                        <div className="bg-white rounded-[2rem] p-6 border border-slate-100 flex flex-col justify-center shadow-sm">
                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Settlement Count</p>
                            <p className="text-2xl font-black text-slate-800 tracking-tighter">{filteredHistory.count}</p>
                        </div>
                        <div className="bg-white rounded-[2rem] p-6 border border-slate-100 flex flex-col justify-center shadow-sm">
                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Avg Settlement</p>
                            <p className="text-2xl font-black text-slate-800 tracking-tighter">₹{filteredHistory.count > 0 ? Math.round(filteredHistory.totalAmount / filteredHistory.count).toLocaleString() : 0}</p>
                        </div>
                    </div>

                    <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 border-b border-slate-100">
                                <tr className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                                    <th className="px-8 py-5">Settlement Info</th>
                                    <th className="px-8 py-5">Consultant</th>
                                    <th className="px-8 py-5">Period</th>
                                    <th className="px-8 py-5 text-right">Amount</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {paginatedHistory.map((p, i) => (
                                    <tr key={i} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-8 py-4">
                                            <p className="text-[10px] font-black text-slate-800 uppercase tracking-tight">{p.Settlement_ID || 'ARCHIVED'}</p>
                                            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">Ref: {p.Payment_ID}</p>
                                        </td>
                                        <td className="px-8 py-4">
                                            <p className="text-[10px] font-black text-slate-800">{p.Doctor_Name}</p>
                                        </td>
                                        <td className="px-8 py-4">
                                            <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">{p.Month} {p.Year}</p>
                                            <p className="text-[8px] font-bold text-slate-400 mt-1">{p.Payment_Date?.split(' ')[0]}</p>
                                        </td>
                                        <td className="px-8 py-4 text-right">
                                            <p className="text-[12px] font-black text-emerald-600 tracking-tight">₹{parseFloat(p.Paid_Amount || p.Amount_To_Pay || 0).toLocaleString()}</p>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {filteredHistory.data.length > ITEMS_PER_PAGE && (
                            <div className="px-8 py-6 border-t border-slate-50 flex items-center justify-center gap-6">
                                <button onClick={() => setHistoryPage(p => Math.max(1, p-1))} disabled={historyPage === 1} className="p-2 hover:bg-slate-100 rounded-lg disabled:opacity-30"><ChevronLeft size={20} /></button>
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Page {historyPage}</span>
                                <button onClick={() => setHistoryPage(p => p+1)} disabled={historyPage * ITEMS_PER_PAGE >= filteredHistory.data.length} className="p-2 hover:bg-slate-100 rounded-lg disabled:opacity-30"><ChevronRight size={20} /></button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {activeSubTab === 'ACCOUNT_PANEL' && (
                <div className="space-y-6 max-w-5xl mx-auto">
                    <div className="flex items-center justify-between mb-2 px-2">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-orange-50 text-orange-600 rounded-2xl flex items-center justify-center border border-orange-100"><Clock size={20} /></div>
                            <div>
                                <h3 className="text-lg font-black uppercase tracking-tighter text-slate-800">Payout Queue</h3>
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{payments.filter(p => p.Status === 'Pending').length} Vouchers Awaiting Settlement</p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                        {payments.filter(p => p.Status === 'Pending').map((p, i) => (
                            <div key={i} className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-8 hover:border-orange-200 transition-all group relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/5 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2" />
                                <div className="flex items-center gap-6">
                                    <div className="w-16 h-16 bg-slate-50 text-slate-400 rounded-3xl flex items-center justify-center font-black border border-slate-100 group-hover:bg-orange-600 group-hover:text-white transition-all text-xl">{p.Doctor_Name.substring(0, 2).toUpperCase()}</div>
                                    <div>
                                        <h4 className="text-xl font-black text-slate-800 tracking-tighter leading-none mb-2">{p.Doctor_Name}</h4>
                                        <div className="flex items-center gap-4">
                                            <span className="text-[9px] font-black text-orange-600 uppercase tracking-widest">{p.Payment_ID}</span>
                                            <span className="w-1 h-1 bg-slate-200 rounded-full" />
                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{p.Visit_Count} Visits</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex flex-col md:flex-row items-center gap-6 flex-1 max-w-2xl">
                                    <div className="w-full bg-slate-50 rounded-[2rem] p-6 flex flex-col justify-center border border-slate-100/50">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Approved Amount</p>
                                        <p className="text-3xl font-black text-slate-900 tracking-tighter">₹{parseFloat(p.Amount_To_Pay).toLocaleString()}</p>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => setConfirmModal({ 
                                        paymentId: p.Payment_ID, 
                                        amount: p.Amount_To_Pay, 
                                        remarks: 'Official fee processed. Amount will be credited to your account shortly.', 
                                        docData: p,
                                        paymentDate: new Date().toISOString().split('T')[0]
                                    })}
                                    className="px-12 py-5 bg-slate-900 text-white rounded-[2rem] text-[10px] font-black uppercase tracking-widest hover:bg-orange-600 transition-all shadow-xl active:scale-95 flex items-center gap-3"
                                >
                                    <CheckCircle2 size={16} /> Settle Payout
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {activeSubTab === 'MASTER' && (
                <div className="space-y-8">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-sm h-fit">
                            <h3 className="text-lg font-black uppercase tracking-tighter text-slate-800 mb-8 flex items-center gap-3"><Plus className="text-blue-600" size={24} /> New Consultant</h3>
                            <form onSubmit={(e) => {
                                e.preventDefault();
                                handleAddDoctor(e);
                            }} className="space-y-6">
                                <MasterInput label="Full Name" placeholder="Dr. Name" value={doctorFormData.name} onChange={v => setDoctorFormData({...doctorFormData, name: v})} />
                                <MasterInput label="Specialty" placeholder="e.g. Cardiology" value={doctorFormData.specialty} onChange={v => setDoctorFormData({...doctorFormData, specialty: v})} />
                                <MasterInput label="Contact Mobile" placeholder="WhatsApp Number" value={doctorFormData.mobile} onChange={v => setDoctorFormData({...doctorFormData, mobile: v})} />
                                <button disabled={submitting} type="submit" className="w-full py-5 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl shadow-blue-600/20 active:scale-95">Register Consultant</button>
                            </form>
                        </div>

                        <div className="lg:col-span-2 space-y-6">
                            <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm flex items-center justify-between">
                                <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-800">Active Directory</h3>
                                <span className="px-4 py-1.5 bg-slate-100 rounded-full text-[9px] font-black uppercase text-slate-500">{doctors.length} Registered</span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {doctors.filter(d => !searchQuery || d.Name.toLowerCase().includes(searchQuery.toLowerCase())).map((d, i) => (
                                    <div key={i} className="bg-white p-6 rounded-[2rem] border border-slate-100 hover:border-blue-500/30 transition-all group flex items-center justify-between shadow-sm">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all"><User size={20} /></div>
                                            <div>
                                                <p className="text-[11px] font-black text-slate-800">{d.Name}</p>
                                                <p className="text-[9px] font-bold text-blue-600 uppercase tracking-widest">{d.Specialty}</p>
                                            </div>
                                        </div>
                                        <button onClick={() => setSelectedDoctor(d)} className="p-3 bg-slate-50 text-slate-400 rounded-xl hover:bg-blue-50 hover:text-blue-600 transition-all"><History size={16} /></button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modals & Popups */}
            {selectedDoctor && (
                <DoctorDetailPopup 
                    doctor={selectedDoctor} 
                    history={payments.filter(p => p.Doctor_ID === selectedDoctor.Doctor_ID || p.Doctor_Name === selectedDoctor.Name)} 
                    onClose={() => setSelectedDoctor(null)} 
                />
            )}

            {confirmModal && (
                <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4">
                    <div onClick={() => setConfirmModal(null)} className="absolute inset-0 bg-slate-900/80 backdrop-blur-md" />
                    <div className="relative w-full max-w-md bg-white rounded-[3rem] p-10 shadow-2xl space-y-8 animate-in zoom-in-95">
                        <div className="w-20 h-20 bg-orange-50 text-orange-600 rounded-[2rem] flex items-center justify-center mx-auto shadow-sm"><IndianRupee size={40} /></div>
                        <div className="text-center space-y-2">
                            <h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter">Confirm Payout?</h3>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">Settle fee for <span className="text-slate-800 font-black tracking-normal">{confirmModal.docData.Doctor_Name}</span>.</p>
                        </div>
                        <div className="bg-slate-50 rounded-[2rem] p-8 space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Final Amount</span>
                                <span className="text-2xl font-black text-slate-900 tracking-tighter">₹{parseFloat(confirmModal.amount).toLocaleString()}</span>
                            </div>
                            <div className="space-y-4 pt-4 border-t border-slate-200">
                                <div className="space-y-1">
                                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Payment Date</label>
                                    <input type="date" value={confirmModal.paymentDate} onChange={e => setConfirmModal({...confirmModal, paymentDate: e.target.value})} className="w-full bg-white border border-slate-200 rounded-xl p-3 text-[11px] font-bold outline-none" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Account Remarks</label>
                                    <input type="text" value={confirmModal.remarks} onChange={e => setConfirmModal({...confirmModal, remarks: e.target.value})} placeholder="Ref ID / Notes..." className="w-full bg-white border border-slate-200 rounded-xl p-3 text-[11px] font-bold outline-none" />
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <button onClick={() => setConfirmModal(null)} className="flex-1 py-4 bg-slate-100 text-slate-400 rounded-full text-[10px] font-black uppercase">Cancel</button>
                            <button 
                                onClick={() => onSettlePayout(confirmModal.paymentId, confirmModal.amount, confirmModal.remarks, confirmModal.docData, confirmModal.paymentDate)} 
                                className="flex-1 py-4 bg-orange-600 text-white rounded-full text-[10px] font-black uppercase shadow-xl shadow-orange-600/20"
                            >
                                {submitting ? <Loader2 className="animate-spin mx-auto" size={16} /> : "Confirm Pay"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const InteractiveStatCard = ({ icon, label, value, subValue, color, onClick }) => (
    <div 
        onClick={onClick}
        className={`bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden group cursor-pointer transition-all hover:border-orange-500/20 hover:shadow-xl hover:shadow-orange-50`}
    >
        <div className={`w-12 h-12 ${color} text-white rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform`}>{icon}</div>
        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
        <div className="flex items-baseline gap-2">
            <p className="text-2xl font-black text-slate-900 tracking-tighter">{value}</p>
            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">{subValue}</p>
        </div>
        <div className={`absolute bottom-0 left-0 h-1 ${color} w-0 group-hover:w-full transition-all duration-500`} />
    </div>
);

const FilterSelect = ({ value, onChange, options, icon }) => (
    <div className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100 group">
        <span className="text-slate-300 group-hover:text-orange-500 transition-colors">{icon}</span>
        <select value={value} onChange={e => onChange(e.target.value)} className="bg-transparent text-[9px] font-black uppercase tracking-widest outline-none text-slate-600 min-w-[100px] cursor-pointer">
            {options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
    </div>
);

const MasterInput = ({ label, placeholder, value, onChange }) => (
    <div className="space-y-2">
        <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">{label}</label>
        <input required type="text" value={value} onChange={e => onChange(e.target.value)} className="w-full bg-slate-50 border-none rounded-2xl py-4 px-6 text-[11px] font-bold outline-none focus:ring-4 focus:ring-blue-500/5 transition-all" placeholder={placeholder} />
    </div>
);

const DoctorDetailPopup = ({ doctor, history, onClose }) => {
    const totalPaid = history.filter(p => p.Status === 'Paid' || p.Status === 'Settled').reduce((sum, p) => sum + (parseFloat(p.Paid_Amount || p.Amount_To_Pay || 0)), 0);
    const pendingCount = history.filter(p => p.Status === 'Pending').length;
    const pendingAmount = history.filter(p => p.Status === 'Pending').reduce((sum, p) => sum + (parseFloat(p.Amount_To_Pay || 0)), 0);

    return (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-xl z-[1200] flex items-center justify-center p-4 md:p-10">
            <div className="bg-white w-full max-w-5xl rounded-[3.5rem] overflow-hidden shadow-2xl flex flex-col max-h-[90vh] animate-in slide-in-from-bottom-10">
                <div className="bg-gradient-to-br from-orange-600 to-slate-900 p-10 md:p-14 text-white relative">
                    <button onClick={onClose} className="absolute top-8 right-8 p-3 bg-white/10 hover:bg-white/20 rounded-2xl transition-all"><X size={20} /></button>
                    <div className="flex flex-col md:flex-row items-center gap-10">
                        <div className="w-24 h-24 bg-white/10 rounded-[2.5rem] flex items-center justify-center border border-white/20 shadow-2xl text-4xl font-black">{doctor.Name.substring(0, 2).toUpperCase()}</div>
                        <div className="text-center md:text-left space-y-4">
                            <h3 className="text-4xl font-black uppercase tracking-tighter leading-none">{doctor.Name}</h3>
                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                                <span className="px-4 py-1.5 bg-white/10 rounded-xl text-[9px] font-black uppercase tracking-widest border border-white/10">{doctor.Specialty}</span>
                                <span className="px-4 py-1.5 bg-white/10 rounded-xl text-[9px] font-black uppercase tracking-widest border border-white/10">{doctor.Mobile}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-10 md:p-14 space-y-12 no-scrollbar">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <PopupStat icon={<IndianRupee />} label="Lifetime Settled" value={`₹${totalPaid.toLocaleString()}`} color="text-orange-600" />
                        <PopupStat icon={<Clock />} label="Pending Vouchers" value={pendingCount} subValue={`₹${pendingAmount.toLocaleString()}`} color="text-blue-600" />
                        <PopupStat icon={<CheckCircle2 />} label="Total Payouts" value={history.filter(p => p.Status === 'Paid' || p.Status === 'Settled').length} color="text-emerald-600" />
                    </div>

                    <div className="space-y-6">
                        <h4 className="text-xs font-black uppercase tracking-[0.3em] text-slate-400 flex items-center gap-3">Financial Timeline <div className="h-px flex-1 bg-slate-100" /></h4>
                        <div className="bg-slate-50/50 rounded-[2.5rem] border border-slate-100 overflow-hidden">
                            <table className="w-full text-left">
                                <thead className="bg-slate-100/50 text-[8px] font-black uppercase tracking-widest text-slate-400">
                                    <tr>
                                        <th className="px-8 py-5">Settlement ID</th>
                                        <th className="px-8 py-5">Period</th>
                                        <th className="px-8 py-5">Visits</th>
                                        <th className="px-8 py-5 text-right">Amount</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {history.sort((a,b) => new Date(b.HR_Entry_Date) - new Date(a.HR_Entry_Date)).map((p, idx) => (
                                        <tr key={idx} className="hover:bg-white transition-colors">
                                            <td className="px-8 py-5">
                                                <p className="text-[10px] font-black text-slate-800 uppercase tracking-tight">{p.Settlement_ID || 'PENDING'}</p>
                                                <p className="text-[8px] font-bold text-slate-400 mt-1 uppercase">{p.Payment_ID}</p>
                                            </td>
                                            <td className="px-8 py-5">
                                                <p className="text-[10px] font-bold text-slate-700 uppercase">{p.Month} {p.Year}</p>
                                            </td>
                                            <td className="px-8 py-5">
                                                <p className="text-[10px] font-black text-slate-600">{p.Visit_Count} Visits</p>
                                            </td>
                                            <td className="px-8 py-5 text-right">
                                                <p className={`text-[11px] font-black ${p.Status === 'Pending' ? 'text-orange-500' : 'text-emerald-600'}`}>₹{parseFloat(p.Paid_Amount || p.Amount_To_Pay || 0).toLocaleString()}</p>
                                                <p className="text-[7px] font-black uppercase tracking-widest mt-1 opacity-40">{p.Status}</p>
                                            </td>
                                        </tr>
                                    ))}
                                    {history.length === 0 && (
                                        <tr><td colSpan="4" className="px-8 py-20 text-center text-[10px] font-bold text-slate-300 uppercase tracking-widest italic">No financial history available</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const PopupStat = ({ icon, label, value, subValue, color }) => (
    <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100">
        <div className={`w-12 h-12 bg-white rounded-2xl flex items-center justify-center mb-6 shadow-sm ${color}`}>{icon}</div>
        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
        <div className="flex items-baseline gap-3">
            <p className="text-3xl font-black text-slate-900 tracking-tighter">{value}</p>
            {subValue && <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{subValue}</p>}
        </div>
    </div>
);

export default VisitingManager;
