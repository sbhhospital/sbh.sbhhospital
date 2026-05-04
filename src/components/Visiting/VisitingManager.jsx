import React, { useState, useEffect, useMemo } from 'react';
import { 
    Users, Plus, Calendar, DollarSign, Clock, CheckCircle2, 
    AlertCircle, Search, Filter, Loader2, Save, X, Phone, 
    Stethoscope, Briefcase, TrendingUp, BarChart3, Download, Activity, User
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

    const stats = useMemo(() => {
        const pending = payments.filter(p => p.Status === 'Pending');
        const paid = payments.filter(p => p.Status === 'Paid');
        const totalPendingAmount = pending.reduce((sum, p) => sum + parseFloat(p.Amount_To_Pay || 0), 0);
        return { pendingCount: pending.length, paidCount: paid.length, totalPendingAmount };
    }, [payments]);

    if (loading || parentLoading) {
        return (
            <div className="flex flex-col items-center justify-center p-20 space-y-4">
                <Loader2 className="animate-spin text-emerald-500" size={40} />
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Syncing Visiting Records...</p>
            </div>
        );
    }

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-5 duration-700 pb-20">
            {/* Header & Sub-Tabs */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-1">
                <div>
                    <h2 className="text-4xl font-black text-slate-800 uppercase tracking-tighter leading-none mb-2">Visiting <span className="text-emerald-600">Doctors</span></h2>
                    <p className="text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">Payment automation & tracking system</p>
                </div>
                <div className="flex bg-slate-100 p-1.5 rounded-2xl">
                    <button onClick={() => setActiveSubTab('DASHBOARD')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeSubTab === 'DASHBOARD' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>Dashboard</button>
                    <button onClick={() => setActiveSubTab('HR_ENTRY')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeSubTab === 'HR_ENTRY' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>New Payment</button>
                    <button onClick={() => setActiveSubTab('REPORT')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeSubTab === 'REPORT' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>History</button>
                </div>
            </div>

            {activeSubTab === 'DASHBOARD' && (
                <div className="space-y-10">
                    {/* Stat Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="bg-white rounded-[2.5rem] p-7 border border-slate-100 shadow-sm flex items-center gap-6 group hover:-translate-y-1 transition-all duration-300">
                            <div className="w-16 h-16 rounded-[1.25rem] bg-orange-50 flex items-center justify-center text-orange-600"><Clock size={30} /></div>
                            <div><p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Pending Payments</p><p className="text-4xl font-black text-slate-800 tracking-tighter">{stats.pendingCount}</p></div>
                        </div>
                        <div className="bg-white rounded-[2.5rem] p-7 border border-slate-100 shadow-sm flex items-center gap-6 group hover:-translate-y-1 transition-all duration-300">
                            <div className="w-16 h-16 rounded-[1.25rem] bg-emerald-50 flex items-center justify-center text-emerald-600"><DollarSign size={30} /></div>
                            <div><p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Pending Amount</p><p className="text-4xl font-black text-slate-800 tracking-tighter">₹{stats.totalPendingAmount.toLocaleString()}</p></div>
                        </div>
                        <div className="bg-white rounded-[2.5rem] p-7 border border-slate-100 shadow-sm flex items-center gap-6 group hover:-translate-y-1 transition-all duration-300">
                            <div className="w-16 h-16 rounded-[1.25rem] bg-blue-50 flex items-center justify-center text-blue-600"><CheckCircle2 size={30} /></div>
                            <div><p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Total Paid (Month)</p><p className="text-4xl font-black text-slate-800 tracking-tighter">{stats.paidCount}</p></div>
                        </div>
                    </div>

                    {/* Pending List */}
                    <div className="bg-white rounded-[3rem] border border-slate-100 overflow-hidden shadow-2xl shadow-slate-100">
                        <div className="px-10 py-8 border-b border-slate-50 bg-slate-50/50 flex items-center justify-between">
                            <h3 className="text-xs font-black text-slate-800 uppercase tracking-[0.3em] flex items-center gap-4"><Activity className="text-orange-500" size={18} /> Active Reminders</h3>
                            <span className="px-4 py-1.5 bg-orange-100 text-orange-600 rounded-full text-[9px] font-black uppercase tracking-widest">Automation Running Daily</span>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-white">
                                    <tr className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">
                                        <th className="px-10 py-6">Doctor Details</th>
                                        <th className="px-10 py-6 text-center">Amount</th>
                                        <th className="px-10 py-6 text-center">Visit Dates</th>
                                        <th className="px-10 py-6 text-right">Status / Reminders</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {payments.filter(p => p.Status === 'Pending').map((p, i) => (
                                        <tr key={i} className="hover:bg-orange-50/20 transition-all group">
                                            <td className="px-10 py-7">
                                                <div>
                                                    <p className="font-black text-slate-800 uppercase text-[11px] mb-1">{p.Doctor_Name}</p>
                                                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest leading-none">ID: {p.Payment_ID}</p>
                                                </div>
                                            </td>
                                            <td className="px-10 py-7 text-center">
                                                <span className="inline-block px-5 py-2.5 bg-slate-900 text-white rounded-2xl text-[11px] font-black shadow-lg shadow-slate-200">₹{parseFloat(p.Amount_To_Pay).toLocaleString()}</span>
                                                <p className="text-[8px] font-black text-slate-400 uppercase mt-1">{p.Visit_Count} Visits</p>
                                            </td>
                                            <td className="px-10 py-7 text-center">
                                                <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest max-w-[200px] mx-auto line-clamp-2">{p.Visit_Dates}</div>
                                            </td>
                                            <td className="px-10 py-7 text-right">
                                                <div className="space-y-1">
                                                    <span className="px-4 py-1.5 bg-orange-100 text-orange-600 rounded-full text-[9px] font-black uppercase tracking-widest animate-pulse border border-orange-200">Waiting For Account Team</span>
                                                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-2">{p.Reminders_Sent} Reminders Sent</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {payments.filter(p => p.Status === 'Pending').length === 0 && (
                                        <tr><td colSpan="4" className="text-center py-20 text-[10px] font-black uppercase text-slate-300 tracking-[0.2em]">All payments are clear! No pending reminders.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {activeSubTab === 'HR_ENTRY' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                    {/* Log New Payment */}
                    <div className="bg-white rounded-[3rem] p-10 md:p-14 border border-slate-100 shadow-2xl shadow-slate-100 h-fit">
                        <h3 className="text-xl font-black text-slate-800 uppercase mb-8 flex items-center gap-3"><DollarSign className="text-emerald-500" /> Log Visits & Payment</h3>
                        <form onSubmit={handleLogPayment} className="space-y-8">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Select Visiting Doctor *</label>
                                <select 
                                    required 
                                    value={paymentFormData.doctorId} 
                                    onChange={e => {
                                        const doc = doctors.find(d => d.Doctor_ID === e.target.value);
                                        setPaymentFormData({...paymentFormData, doctorId: e.target.value, doctorName: doc ? doc.Name : ''});
                                    }}
                                    className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl p-5 text-slate-800 font-bold focus:bg-white focus:border-emerald-500/30 outline-none uppercase"
                                >
                                    <option value="">Choose Doctor</option>
                                    {doctors.map(d => <option key={d.Doctor_ID} value={d.Doctor_ID}>{d.Name} ({d.Specialty})</option>)}
                                </select>
                            </div>
                            
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Amount Per Visit (₹) *</label>
                                <input required type="number" value={paymentFormData.amountPerVisit} onChange={e => setPaymentFormData({...paymentFormData, amountPerVisit: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl p-5 text-slate-800 font-bold focus:bg-white focus:border-emerald-500/30 outline-none" placeholder="e.g. 500" />
                            </div>

                            <div className="space-y-4 pt-4 border-t border-slate-100">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Add Visit Dates *</label>
                                <div className="flex gap-4">
                                    <input type="date" value={paymentFormData.currentDate} onChange={e => setPaymentFormData({...paymentFormData, currentDate: e.target.value})} className="flex-1 bg-slate-50 border-2 border-slate-50 rounded-2xl p-5 text-slate-800 font-bold focus:bg-white focus:border-emerald-500/30 outline-none uppercase" />
                                    <button type="button" onClick={handleAddVisitDate} className="px-6 bg-emerald-600 text-white rounded-2xl font-black uppercase text-[10px] shadow-lg shadow-emerald-500/20"><Plus size={20} /></button>
                                </div>
                                
                                <div className="flex flex-wrap gap-2 mt-4">
                                    {paymentFormData.visitDates.map(date => (
                                        <div key={date} className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-[10px] font-black border border-slate-200">
                                            {date}
                                            <button type="button" onClick={() => removeVisitDate(date)} className="text-rose-500 hover:scale-110 transition-transform"><X size={14} /></button>
                                        </div>
                                    ))}
                                    {paymentFormData.visitDates.length === 0 && <p className="text-[9px] text-slate-400 uppercase italic">No dates added yet</p>}
                                </div>
                            </div>

                            <div className="p-6 bg-slate-900 rounded-[2rem] text-center">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Payment Calculation</p>
                                <p className="text-3xl font-black text-white">₹{(parseFloat(paymentFormData.amountPerVisit || 0) * paymentFormData.visitDates.length).toLocaleString()}</p>
                                <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mt-1">For {paymentFormData.visitDates.length} Visits</p>
                            </div>

                            <button disabled={submitting} type="submit" className="w-full py-5 bg-emerald-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-emerald-500 transition-all shadow-xl shadow-emerald-500/20 disabled:opacity-50">
                                {submitting ? "Processing..." : "Log & Send Reminder"}
                            </button>
                        </form>
                    </div>

                    {/* Manage Doctor Master */}
                    <div className="space-y-10">
                        <div className="bg-white rounded-[3rem] p-10 border border-slate-100 shadow-sm">
                            <div className="flex items-center justify-between mb-8">
                                <h3 className="text-xl font-black text-slate-800 uppercase flex items-center gap-3"><Stethoscope className="text-blue-500" /> Doctors Master</h3>
                                <button onClick={() => setShowDoctorForm(!showDoctorForm)} className="p-3 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all"><Plus size={20} /></button>
                            </div>

                            <AnimatePresence>
                                {showDoctorForm && (
                                    <motion.form 
                                        initial={{ height: 0, opacity: 0 }} 
                                        animate={{ height: 'auto', opacity: 1 }} 
                                        exit={{ height: 0, opacity: 0 }} 
                                        onSubmit={handleAddDoctor}
                                        className="space-y-6 mb-10 overflow-hidden"
                                    >
                                        <div className="grid grid-cols-2 gap-4">
                                            <input required value={doctorFormData.name} onChange={e => setDoctorFormData({...doctorFormData, name: e.target.value})} className="w-full bg-slate-50 rounded-xl p-4 text-[11px] font-bold outline-none border border-slate-100" placeholder="Doctor Name" />
                                            <input value={doctorFormData.specialty} onChange={e => setDoctorFormData({...doctorFormData, specialty: e.target.value})} className="w-full bg-slate-50 rounded-xl p-4 text-[11px] font-bold outline-none border border-slate-100" placeholder="Specialty" />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <input required value={doctorFormData.mobile} onChange={e => setDoctorFormData({...doctorFormData, mobile: e.target.value})} className="w-full bg-slate-50 rounded-xl p-4 text-[11px] font-bold outline-none border border-slate-100" placeholder="Mobile Number" />
                                            <button disabled={submitting} type="submit" className="w-full bg-blue-600 text-white rounded-xl font-black uppercase text-[10px] tracking-widest">{submitting ? '...' : 'Save'}</button>
                                        </div>
                                    </motion.form>
                                )}
                            </AnimatePresence>

                            <div className="space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                                {doctors.map((d, i) => (
                                    <div key={i} className="flex items-center justify-between p-5 bg-slate-50 rounded-2xl border border-slate-100">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-slate-400 border border-slate-100 shadow-sm"><User size={20} /></div>
                                            <div>
                                                <p className="font-black text-slate-800 uppercase text-[11px] mb-0.5">{d.Name}</p>
                                                <p className="text-[9px] text-blue-600 font-bold uppercase tracking-widest">{d.Specialty}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] font-bold text-slate-400">{d.Mobile}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeSubTab === 'REPORT' && (
                <div className="bg-white rounded-[3rem] border border-slate-100 overflow-hidden shadow-2xl shadow-slate-100">
                    <div className="px-10 py-8 border-b border-slate-50 bg-slate-50/50 flex items-center justify-between">
                        <h3 className="text-xs font-black text-slate-800 uppercase tracking-[0.3em] flex items-center gap-4"><Briefcase className="text-blue-600" size={18} /> Payment History</h3>
                        <button onClick={fetchData} className="p-3 text-slate-400 hover:text-emerald-600 transition-colors"><TrendingUp size={20} /></button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left min-w-[1000px]">
                            <thead className="bg-white">
                                <tr className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">
                                    <th className="px-10 py-6">Reference</th>
                                    <th className="px-10 py-6">Doctor</th>
                                    <th className="px-10 py-6 text-center">Expected</th>
                                    <th className="px-10 py-6 text-center">Dates (Count)</th>
                                    <th className="px-10 py-6 text-center">Paid Amount</th>
                                    <th className="px-10 py-6 text-center">Paid Date</th>
                                    <th className="px-10 py-6 text-right">Remarks</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {payments.filter(p => p.Status === 'Paid').map((p, i) => (
                                    <tr key={i} className="hover:bg-slate-50/50 transition-all">
                                        <td className="px-10 py-7">
                                            <div>
                                                <p className="font-black text-slate-800 uppercase text-[10px] mb-1">{p.Payment_ID}</p>
                                                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Logged: {p.HR_Entry_Date.split(' ')[0]}</p>
                                            </div>
                                        </td>
                                        <td className="px-10 py-7">
                                            <p className="font-black text-slate-800 uppercase text-[11px]">{p.Doctor_Name}</p>
                                        </td>
                                        <td className="px-10 py-7 text-center text-[11px] font-black text-slate-500">₹{p.Amount_To_Pay}</td>
                                        <td className="px-10 py-7 text-center">
                                            <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest line-clamp-1">{p.Visit_Dates}</div>
                                            <p className="text-[8px] font-black text-emerald-600 uppercase mt-1">{p.Visit_Count} Visits</p>
                                        </td>
                                        <td className="px-10 py-7 text-center">
                                            <span className="inline-block px-4 py-2 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-xl text-[11px] font-black">₹{p.Paid_Amount}</span>
                                        </td>
                                        <td className="px-10 py-7 text-center">
                                            <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{p.Payment_Date}</div>
                                        </td>
                                        <td className="px-10 py-7 text-right">
                                            <p className="text-[10px] font-medium text-slate-500 italic max-w-[200px] ml-auto">"{p.Account_Remarks}"</p>
                                        </td>
                                    </tr>
                                ))}
                                {payments.filter(p => p.Status === 'Paid').length === 0 && (
                                    <tr><td colSpan="7" className="text-center py-20 text-[10px] font-black uppercase text-slate-300">No payment history found yet.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default VisitingManager;
