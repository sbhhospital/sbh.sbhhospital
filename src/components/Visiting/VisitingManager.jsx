import React, { useState, useEffect, useMemo } from 'react';
import { 
    Users, Plus, Calendar, IndianRupee, Clock, CheckCircle2, 
    AlertCircle, Search, Filter, Loader2, Save, X, Phone, 
    Stethoscope, Briefcase, TrendingUp, BarChart3, Download, Activity, User, RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const VisitingManager = ({ scriptUrl, loading: parentLoading }) => {
    const [activeSubTab, setActiveSubTab] = useState('DASHBOARD'); // DASHBOARD, HR_ENTRY, REPORT
    const [doctors, setDoctors] = useState([]);
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [showDoctorForm, setShowDoctorForm] = useState(false);
    const [doctorFormData, setDoctorFormData] = useState({ name: '', specialty: '', mobile: '', email: '' });
    const [paymentFormData, setPaymentFormData] = useState({ 
        doctorId: '', 
        doctorName: '', 
        amountPerVisit: '', 
        visitDates: [], 
        currentDate: new Date().toISOString().split('T')[0] 
    });

    // Filters
    const [filterDoctor, setFilterDoctor] = useState('All');
    const [filterMonth, setFilterMonth] = useState('All');

    const fetchData = async () => {
        setLoading(true);
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
        setLoading(false);
    };

    useEffect(() => {
        fetchData();
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
        
        const totalAmount = parseFloat(paymentFormData.amountPerVisit) * paymentFormData.visitDates.length;
        
        setSubmitting(true);
        try {
            await fetch(scriptUrl, {
                method: 'POST',
                mode: 'no-cors',
                headers: { 'Content-Type': 'text/plain' },
                body: JSON.stringify({ 
                    action: 'log_payment', 
                    ...paymentFormData,
                    amount: totalAmount,
                    visitDates: paymentFormData.visitDates.join(', '),
                    visitCount: paymentFormData.visitDates.length
                })
            });
            setTimeout(() => {
                fetchData();
                setPaymentFormData({ ...paymentFormData, amountPerVisit: '', visitDates: [] });
                setSubmitting(false);
                alert(`Payment requirement logged! Total: ₹${totalAmount} for ${paymentFormData.visitDates.length} visits. Reminder sent to Account Team!`);
            }, 1000);
        } catch (e) {
            alert("Error logging payment");
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
        const pending = payments.filter(p => p.Status === 'Pending');
        const paid = payments.filter(p => p.Status === 'Paid');
        const totalPendingAmount = pending.reduce((sum, p) => sum + parseFloat(p.Amount_To_Pay || 0), 0);
        
        // Month matching for "This Month" stats
        const now = new Date();
        const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        
        const paidThisMonth = paid.filter(p => p.Payment_Date && p.Payment_Date.startsWith(currentMonthStr));
        const totalPaidThisMonth = paidThisMonth.reduce((sum, p) => sum + parseFloat(p.Paid_Amount || 0), 0);
        
        return { 
            pendingCount: pending.length, 
            paidCount: paidThisMonth.length, 
            totalPendingAmount,
            totalPaidThisMonth
        };
    }, [payments]);

    const filteredHistory = useMemo(() => {
        return payments.filter(p => p.Status === 'Paid').filter(p => {
            const matchesDoctor = filterDoctor === 'All' || p.Doctor_Name === filterDoctor;
            const matchesMonth = filterMonth === 'All' || (p.Payment_Date && p.Payment_Date.startsWith(filterMonth));
            return matchesDoctor && matchesMonth;
        });
    }, [payments, filterDoctor, filterMonth]);

    const settlementsThisMonth = useMemo(() => {
        const now = new Date();
        const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        return payments.filter(p => p.Status === 'Paid' && p.Payment_Date && p.Payment_Date.startsWith(currentMonthStr));
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

    if (loading || parentLoading) {
        return (
            <div className="flex flex-col items-center justify-center p-32 space-y-8 animate-pulse">
                <div className="relative">
                    <div className="w-20 h-20 border-4 border-emerald-100 rounded-full animate-spin border-t-emerald-600"></div>
                    <IndianRupee className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-emerald-600" size={30} />
                </div>
                <div className="text-center">
                    <p className="text-sm font-black uppercase tracking-[0.4em] text-slate-800 mb-2">Secure Syncing</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Accessing SBH Accounting Ledger...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500 pb-10 max-w-[1600px] mx-auto">
            {/* Professional Navigation Sticky Bar */}
            <div className="bg-white border-b border-slate-200 -mx-6 px-10 py-3 sticky top-0 z-[100] flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 md:pb-0">
                    {[
                        { id: 'DASHBOARD', label: 'Dashboard', icon: BarChart3 },
                        { id: 'HR_ENTRY', label: 'New Log', icon: Plus },
                        { id: 'SETTLED', label: 'Settlements', icon: CheckCircle2 },
                        { id: 'REPORT', label: 'Archive', icon: Briefcase },
                        { id: 'MASTER', label: 'Master', icon: User }
                    ].map(tab => (
                        <button 
                            key={tab.id}
                            onClick={() => setActiveSubTab(tab.id)}
                            className={`flex items-center gap-2 px-5 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeSubTab === tab.id ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}
                        >
                            <tab.icon size={12} />
                            {tab.label}
                        </button>
                    ))}
                    <div className="w-[1px] h-5 bg-slate-200 mx-2 hidden md:block"></div>
                    <button onClick={fetchData} className="p-2 bg-slate-50 border border-slate-100 rounded-lg text-slate-400 hover:text-emerald-600 transition-all active:scale-95 shadow-sm"><RefreshCw size={14} /></button>
                </div>
                
                <div className="hidden md:flex items-center gap-3">
                    <div className="flex items-center gap-2 text-[8px] font-black text-slate-400 uppercase tracking-widest">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Service: Ledger-v4.0
                    </div>
                </div>
            </div>

            {activeSubTab === 'DASHBOARD' && (
                <div className="space-y-6">
                    {/* Compact Stat Matrix */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                        <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm flex items-center gap-4 hover:border-orange-200 transition-all">
                            <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center text-orange-600"><Clock size={18} /></div>
                            <div><p className="text-[8px] font-black uppercase text-slate-400 tracking-widest mb-0.5">Pending</p><p className="text-lg font-black text-slate-800 tracking-tight">{stats.pendingCount}</p></div>
                        </div>
                        <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm flex items-center gap-4 hover:border-emerald-200 transition-all">
                            <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600"><IndianRupee size={18} /></div>
                            <div><p className="text-[8px] font-black uppercase text-slate-400 tracking-widest mb-0.5">Due Amt</p><p className="text-lg font-black text-slate-800 tracking-tight">₹{stats.totalPendingAmount.toLocaleString()}</p></div>
                        </div>
                        <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm flex items-center gap-4 hover:border-blue-200 transition-all">
                            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600"><CheckCircle2 size={18} /></div>
                            <div><p className="text-[8px] font-black uppercase text-slate-400 tracking-widest mb-0.5">Paid (Count)</p><p className="text-lg font-black text-slate-800 tracking-tight">{stats.paidCount}</p></div>
                        </div>
                        <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm flex items-center gap-4 hover:border-indigo-200 transition-all">
                            <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600"><TrendingUp size={18} /></div>
                            <div><p className="text-[8px] font-black uppercase text-slate-400 tracking-widest mb-0.5">Paid (Value)</p><p className="text-lg font-black text-slate-800 tracking-tight">₹{stats.totalPaidThisMonth.toLocaleString()}</p></div>
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
                                    {payments.filter(p => p.Status === 'Pending').map((p, i) => (
                                        <tr key={i} className="hover:bg-slate-50/80 transition-all group">
                                            <td className="px-8 py-4 text-[11px] font-black text-slate-400">{p.Payment_ID}</td>
                                            <td className="px-8 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-white transition-colors"><User size={14} /></div>
                                                    <p className="font-black text-slate-800 uppercase text-[11px]">{p.Doctor_Name}</p>
                                                </div>
                                            </td>
                                            <td className="px-8 py-4 text-center">
                                                <span className="font-black text-slate-900 text-[11px]">₹{parseFloat(p.Amount_To_Pay).toLocaleString()}</span>
                                            </td>
                                            <td className="px-8 py-4 text-center">
                                                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest truncate max-w-[150px] mx-auto">{p.Visit_Dates}</div>
                                            </td>
                                            <td className="px-8 py-4 text-center">
                                                <span className="px-3 py-1 bg-slate-100 rounded-md text-[10px] font-black text-slate-600">{p.Visit_Count}</span>
                                            </td>
                                            <td className="px-8 py-4 text-right">
                                                <span className="px-3 py-1 bg-orange-50 text-orange-600 rounded-md text-[9px] font-black uppercase tracking-widest border border-orange-100">Pending</span>
                                            </td>
                                        </tr>
                                    ))}
                                    {payments.filter(p => p.Status === 'Pending').length === 0 && (
                                        <tr><td colSpan="6" className="text-center py-20 text-[11px] font-bold uppercase text-slate-300 italic tracking-widest">No outstanding payments found.</td></tr>
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
                            
                            <div className="space-y-2">
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Fee Per Visit (₹)</label>
                                <div className="relative">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 font-black text-[11px]">₹</div>
                                    <input required type="number" value={paymentFormData.amountPerVisit} onChange={e => setPaymentFormData({...paymentFormData, amountPerVisit: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 pl-8 text-[12px] font-black focus:bg-white focus:border-emerald-500/30 outline-none transition-all shadow-sm" placeholder="0" />
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

                            <div className="p-6 bg-slate-900 rounded-2xl text-center border-b-4 border-emerald-500">
                                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Total Fee Calculation</p>
                                <p className="text-3xl font-black text-white tracking-tighter">₹{(parseFloat(paymentFormData.amountPerVisit || 0) * paymentFormData.visitDates.length).toLocaleString()}</p>
                                <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mt-1">{paymentFormData.visitDates.length} Visits Logged</p>
                            </div>

                            <button disabled={submitting} type="submit" className="w-full py-4 bg-emerald-600 text-white rounded-xl font-black uppercase tracking-widest text-[11px] hover:bg-emerald-500 transition-all shadow-lg disabled:opacity-50 flex items-center justify-center gap-3">
                                {submitting ? <Loader2 className="animate-spin" size={14} /> : <Save size={14} />}
                                {submitting ? "Processing..." : "Generate Voucher & Send Reminders"}
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
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{p.Payment_ID}</p>
                                <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-between">
                                    <p className="text-[16px] font-black text-emerald-600 tracking-tight">₹{parseFloat(p.Paid_Amount).toLocaleString()}</p>
                                    <span className="text-[8px] font-black text-slate-400 uppercase bg-slate-50 px-2 py-1 rounded">Settled</span>
                                </div>
                            </motion.div>
                        ))}
                        {settlementsThisMonth.length === 0 && (
                            <div className="col-span-full py-20 text-center text-[11px] font-black uppercase text-slate-300 tracking-widest italic border-2 border-dashed border-slate-50 rounded-[2rem]">No settlements recorded in this cycle yet.</div>
                        )}
                    </div>
                </div>
            )}

            {activeSubTab === 'HR_ENTRY' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                    {/* Log New Payment */}
                    <div className="bg-white rounded-[3.5rem] p-10 md:p-14 border border-slate-100 shadow-2xl shadow-slate-100 h-fit border-t-4 border-t-emerald-500">
                        <h3 className="text-2xl font-black text-slate-800 uppercase mb-10 flex items-center gap-4"><IndianRupee className="text-emerald-500" size={28} /> Log Visits & Payment</h3>
                        <form onSubmit={handleLogPayment} className="space-y-10">
                            <div className="space-y-4">
                                <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] ml-3">1. Select Visiting Doctor</label>
                                <select 
                                    required 
                                    value={paymentFormData.doctorId} 
                                    onChange={e => {
                                        const doc = doctors.find(d => d.Doctor_ID === e.target.value);
                                        setPaymentFormData({...paymentFormData, doctorId: e.target.value, doctorName: doc ? doc.Name : ''});
                                    }}
                                    className="w-full bg-slate-50 border-2 border-slate-50 rounded-3xl p-6 text-slate-800 font-black focus:bg-white focus:border-emerald-500/30 outline-none uppercase transition-all shadow-sm"
                                >
                                    <option value="">Choose Doctor From Master</option>
                                    {doctors.map(d => <option key={d.Doctor_ID} value={d.Doctor_ID}>{d.Name} — {d.Specialty}</option>)}
                                </select>
                            </div>
                            
                            <div className="space-y-4">
                                <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] ml-3">2. Amount Per Visit (₹)</label>
                                <div className="relative">
                                    <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 font-black text-lg">₹</div>
                                    <input required type="number" value={paymentFormData.amountPerVisit} onChange={e => setPaymentFormData({...paymentFormData, amountPerVisit: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-50 rounded-3xl p-6 pl-12 text-slate-800 font-black focus:bg-white focus:border-emerald-500/30 outline-none text-xl transition-all shadow-sm" placeholder="0" />
                                </div>
                            </div>

                            <div className="space-y-5 pt-8 border-t border-slate-100">
                                <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] ml-3">3. Add Visit Dates</label>
                                <div className="flex gap-4">
                                    <input type="date" value={paymentFormData.currentDate} onChange={e => setPaymentFormData({...paymentFormData, currentDate: e.target.value})} className="flex-1 bg-slate-50 border-2 border-slate-50 rounded-3xl p-5 text-slate-800 font-black focus:bg-white focus:border-emerald-500/30 outline-none uppercase transition-all shadow-sm" />
                                    <button type="button" onClick={handleAddVisitDate} className="w-16 bg-emerald-600 text-white rounded-3xl flex items-center justify-center hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-500/20 active:scale-95"><Plus size={24} /></button>
                                </div>
                                
                                <div className="flex flex-wrap gap-2.5 mt-4 min-h-[50px] p-2">
                                    {paymentFormData.visitDates.map(date => (
                                        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} key={date} className="flex items-center gap-3 px-5 py-2.5 bg-white text-slate-600 rounded-2xl text-[11px] font-black border border-slate-200 shadow-sm">
                                            {date}
                                            <button type="button" onClick={() => removeVisitDate(date)} className="text-rose-500 hover:scale-125 transition-transform"><X size={16} /></button>
                                        </motion.div>
                                    ))}
                                    {paymentFormData.visitDates.length === 0 && <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest italic opacity-50 pl-2">No dates selected</p>}
                                </div>
                            </div>

                            <div className="p-8 bg-slate-900 rounded-[3rem] text-center border-b-8 border-emerald-500 shadow-2xl shadow-slate-200">
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-2">Final Payment Voucher</p>
                                <p className="text-5xl font-black text-white tracking-tighter">₹{(parseFloat(paymentFormData.amountPerVisit || 0) * paymentFormData.visitDates.length).toLocaleString()}</p>
                                <div className="inline-flex items-center gap-3 px-5 py-2 bg-emerald-500/10 rounded-full mt-4">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                    <p className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em]">{paymentFormData.visitDates.length} Official Visits</p>
                                </div>
                            </div>

                            <button disabled={submitting} type="submit" className="w-full py-6 bg-emerald-600 text-white rounded-3xl font-black uppercase tracking-[0.2em] text-sm hover:bg-emerald-500 transition-all shadow-xl shadow-emerald-600/30 disabled:opacity-50 active:scale-95 flex items-center justify-center gap-4">
                                {submitting ? <Loader2 className="animate-spin" size={20} /> : <><RefreshCw size={18} /> Log & Ping Account Team</>}
                            </button>
                        </form>
                    </div>

                    {/* Manage Doctor Master */}
                    <div className="space-y-10">
                        <div className="bg-white rounded-[3.5rem] p-10 border border-slate-100 shadow-sm h-full">
                            <div className="flex items-center justify-between mb-10">
                                <div>
                                    <h3 className="text-2xl font-black text-slate-800 uppercase flex items-center gap-4"><Stethoscope className="text-blue-500" size={28} /> Doctors Master</h3>
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Manage permanent visiting staff</p>
                                </div>
                                <button onClick={() => setShowDoctorForm(!showDoctorForm)} className={`p-4 rounded-3xl transition-all shadow-lg active:scale-90 ${showDoctorForm ? 'bg-rose-500 text-white shadow-rose-200' : 'bg-blue-600 text-white shadow-blue-200'}`}>{showDoctorForm ? <X size={24} /> : <Plus size={24} />}</button>
                            </div>

                            <AnimatePresence>
                                {showDoctorForm && (
                                    <motion.form 
                                        initial={{ height: 0, opacity: 0, y: -20 }} 
                                        animate={{ height: 'auto', opacity: 1, y: 0 }} 
                                        exit={{ height: 0, opacity: 0, y: -20 }} 
                                        onSubmit={handleAddDoctor}
                                        className="space-y-6 mb-12 overflow-hidden bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100 shadow-inner"
                                    >
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                            <div className="space-y-2">
                                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">Doctor Name</label>
                                                <input required value={doctorFormData.name} onChange={e => setDoctorFormData({...doctorFormData, name: e.target.value})} className="w-full bg-white rounded-2xl p-4 text-[12px] font-black outline-none border border-slate-200 focus:border-blue-500 transition-all" placeholder="Full Name" />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">Specialty</label>
                                                <input value={doctorFormData.specialty} onChange={e => setDoctorFormData({...doctorFormData, specialty: e.target.value})} className="w-full bg-white rounded-2xl p-4 text-[12px] font-black outline-none border border-slate-200 focus:border-blue-500 transition-all" placeholder="e.g. Cardiology" />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                            <div className="space-y-2">
                                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">Contact Number</label>
                                                <input required value={doctorFormData.mobile} onChange={e => setDoctorFormData({...doctorFormData, mobile: e.target.value})} className="w-full bg-white rounded-2xl p-4 text-[12px] font-black outline-none border border-slate-200 focus:border-blue-500 transition-all" placeholder="Mobile" />
                                            </div>
                                            <div className="pt-6">
                                                <button disabled={submitting} type="submit" className="w-full h-full bg-blue-600 text-white rounded-2xl font-black uppercase text-[11px] tracking-[0.2em] shadow-xl shadow-blue-200 hover:bg-blue-700 transition-all active:scale-95">Save Profile</button>
                                            </div>
                                        </div>
                                    </motion.form>
                                )}
                            </AnimatePresence>

                            <div className="space-y-5 max-h-[500px] overflow-y-auto custom-scrollbar pr-3">
                                {doctors.map((d, i) => (
                                    <motion.div layout key={i} className="flex items-center justify-between p-6 bg-white rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-all group">
                                        <div className="flex items-center gap-5">
                                            <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 group-hover:bg-blue-50 group-hover:text-blue-500 transition-all border border-slate-50"><User size={24} /></div>
                                            <div>
                                                <p className="font-black text-slate-800 uppercase text-[12px] mb-1">{d.Name}</p>
                                                <p className="text-[10px] text-blue-600 font-bold uppercase tracking-widest">{d.Specialty}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[11px] font-black text-slate-900 mb-1">{d.Mobile}</p>
                                            <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[8px] font-black uppercase tracking-widest border border-emerald-100">Verified</span>
                                        </div>
                                    </motion.div>
                                ))}
                                {doctors.length === 0 && <div className="text-center py-10 text-slate-300 text-[10px] font-black uppercase tracking-widest">No doctors registered yet</div>}
                            </div>
                        </div>
                    </div>
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
                                {filteredHistory.map((p, i) => (
                                    <tr key={i} className="hover:bg-emerald-50/30 transition-all group">
                                        <td className="px-8 py-3.5 text-[10px] font-black text-slate-400">{p.Payment_ID}</td>
                                        <td className="px-8 py-3.5">
                                            <p className="font-black text-slate-800 uppercase text-[11px]">{p.Doctor_Name}</p>
                                            <p className="text-[9px] text-slate-400 font-bold uppercase">{p.Visit_Count} Visits</p>
                                        </td>
                                        <td className="px-8 py-3.5 text-center text-[11px] font-black text-slate-500">₹{p.Amount_To_Pay}</td>
                                        <td className="px-8 py-3.5 text-center">
                                            <span className="inline-block px-3 py-1 bg-emerald-600 text-white rounded-lg text-[10px] font-black shadow-md">₹{p.Paid_Amount}</span>
                                        </td>
                                        <td className="px-8 py-3.5 text-center">
                                            <div className="text-[10px] font-black text-slate-700 uppercase tracking-widest">{p.Payment_Date}</div>
                                        </td>
                                        <td className="px-8 py-3.5 text-right">
                                            <p className="text-[10px] font-medium text-slate-500 italic max-w-[200px] ml-auto">"{p.Account_Remarks || 'No Remarks'}"</p>
                                        </td>
                                    </tr>
                                ))}
                                {filteredHistory.length === 0 && (
                                    <tr><td colSpan="6" className="text-center py-20 text-[11px] font-bold uppercase text-slate-300 italic tracking-widest">No matching records found.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
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
                            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[600px] overflow-y-auto custom-scrollbar">
                                {doctors.map((d, i) => (
                                    <div key={i} className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-xl hover:border-blue-200 transition-all group">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all"><User size={18} /></div>
                                            <div>
                                                <p className="font-black text-slate-800 uppercase text-[11px] mb-0.5">{d.Name}</p>
                                                <p className="text-[9px] text-blue-600 font-bold uppercase tracking-widest">{d.Specialty}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] font-black text-slate-900 mb-0.5">{d.Mobile}</p>
                                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Active</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default VisitingManager;
