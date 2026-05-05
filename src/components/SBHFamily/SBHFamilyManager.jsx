import React, { useState, useEffect, useMemo } from 'react';
import { 
    Users, Plus, Calendar, IndianRupee, Clock, CheckCircle2, 
    AlertCircle, Search, Filter, Loader2, Save, X, Phone, 
    Stethoscope, Briefcase, TrendingUp, BarChart3, Download, Activity, User, RefreshCw, ChevronRight,
    Building2, Wallet, FileText, Send, PieChart
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const SBHFamilyManager = ({ scriptUrl, user }) => {
    const [activeSubTab, setActiveSubTab] = useState('DASHBOARD'); // DASHBOARD, HR_ENTRY, ACCOUNT_PANEL, MASTER
    const [staff, setStaff] = useState([]);
    const [ledger, setLedger] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedStaff, setSelectedStaff] = useState(null);
    const [selectedMonth, setSelectedMonth] = useState(new Date().toLocaleString('en-US', { month: 'long' }));
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());

    const fetchData = async () => {
        setLoading(true);
        try {
            const [staffData, ledgerData] = await Promise.all([
                fetch(`${scriptUrl}?action=get_staff_master`).then(r => r.json()),
                fetch(`${scriptUrl}?action=get_salary_ledger`).then(r => r.json())
            ]);
            setStaff(Array.isArray(staffData) ? staffData : []);
            setLedger(Array.isArray(ledgerData) ? ledgerData : []);
        } catch (err) {
            console.error('Fetch error:', err);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchData();
    }, []);

    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const years = ["2024", "2025", "2026"];

    const filteredLedger = useMemo(() => {
        return ledger.filter(item => {
            const matchesMonth = item.Month === selectedMonth && item.Year === selectedYear;
            const matchesSearch = !searchQuery || 
                item.Staff_Name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.Staff_ID.toLowerCase().includes(searchQuery.toLowerCase());
            return matchesMonth && matchesSearch;
        });
    }, [ledger, selectedMonth, selectedYear, searchQuery]);

    const stats = useMemo(() => {
        const current = ledger.filter(item => item.Month === selectedMonth && item.Year === selectedYear);
        const settled = current.filter(item => item.Status === 'Settled');
        const pending = current.filter(item => item.Status === 'Pending');
        
        return {
            totalAmount: current.reduce((sum, item) => sum + (parseFloat(item.Net_Salary) || 0), 0),
            settledAmount: settled.reduce((sum, item) => sum + (parseFloat(item.Net_Salary) || 0), 0),
            pendingAmount: pending.reduce((sum, item) => sum + (parseFloat(item.Net_Salary) || 0), 0),
            staffCount: current.length,
            settledCount: settled.length,
            pendingCount: pending.length
        };
    }, [ledger, selectedMonth, selectedYear]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center p-32 space-y-8 animate-pulse">
                <div className="relative">
                    <div className="w-20 h-20 border-4 border-emerald-100 rounded-full animate-spin border-t-emerald-600"></div>
                    <Building2 className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-emerald-600" size={30} />
                </div>
                <div className="text-center">
                    <p className="text-sm font-black uppercase tracking-[0.4em] text-slate-800 mb-2">SBH Family Sync</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Accessing Salary Ledger...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500 pb-10 max-w-[1600px] mx-auto">
            {/* Top Navigation Bar */}
            <div className="bg-white border-b border-slate-200 -mx-6 px-10 py-3 sticky top-0 z-30 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 md:pb-0">
                    {[
                        { id: 'DASHBOARD', label: 'Dashboard', icon: BarChart3 },
                        { id: 'HR_ENTRY', label: 'Salary Entry', icon: Plus },
                        { id: 'ACCOUNT_PANEL', label: 'Settlements', icon: CheckCircle2 },
                        { id: 'MASTER', label: 'Staff Master', icon: Users }
                    ].map(tab => {
                        // Role-based access
                        if (tab.id === 'HR_ENTRY' && user === 'ACCOUNT') return null;
                        if (tab.id === 'ACCOUNT_PANEL' && user === 'SBH HRD') return null;
                        
                        return (
                            <button 
                                key={tab.id}
                                onClick={() => setActiveSubTab(tab.id)}
                                className={`flex items-center gap-2 px-5 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeSubTab === tab.id ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}
                            >
                                <tab.icon size={12} />
                                {tab.label}
                            </button>
                        );
                    })}
                    <div className="w-[1px] h-5 bg-slate-200 mx-2 hidden md:block"></div>
                    <button onClick={fetchData} className="p-2 bg-slate-50 border border-slate-100 rounded-lg text-slate-400 hover:text-emerald-600 transition-all active:scale-95 shadow-sm"><RefreshCw size={14} /></button>
                </div>

                <div className="flex items-center gap-3">
                    <select 
                        value={selectedMonth} 
                        onChange={(e) => setSelectedMonth(e.target.value)}
                        className="bg-slate-50 border-none rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500/20"
                    >
                        {months.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                    <select 
                        value={selectedYear} 
                        onChange={(e) => setSelectedYear(e.target.value)}
                        className="bg-slate-50 border-none rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500/20"
                    >
                        {years.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                </div>
            </div>

            {/* Dashboard View */}
            {activeSubTab === 'DASHBOARD' && (
                <div className="space-y-8 px-2">
                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        <StatCard icon={<IndianRupee />} label="Total Payroll" value={`₹${stats.totalAmount.toLocaleString()}`} color="bg-emerald-600" count={`${stats.staffCount} Staff`} />
                        <StatCard icon={<CheckCircle2 />} label="Settled Amount" value={`₹${stats.settledAmount.toLocaleString()}`} color="bg-blue-600" count={`${stats.settledCount} Paid`} />
                        <StatCard icon={<Clock />} label="Pending Amount" value={`₹${stats.pendingAmount.toLocaleString()}`} color="bg-orange-500" count={`${stats.pendingCount} Waiting`} />
                        <StatCard icon={<Activity />} label="Disbursement" value={`${Math.round((stats.settledAmount/stats.totalAmount || 0) * 100)}%`} color="bg-slate-900" count="Of Budget" />
                    </div>

                    {/* Salary Table */}
                    <div className="bg-white rounded-[2.5rem] border border-slate-100 overflow-hidden shadow-sm">
                        <div className="p-6 border-b border-slate-50 flex items-center justify-between">
                            <h2 className="text-xs font-black uppercase tracking-widest text-slate-800">Payroll Ledger: {selectedMonth} {selectedYear}</h2>
                            <div className="relative group w-64">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                                <input 
                                    type="text" 
                                    placeholder="Filter by name or ID..." 
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full bg-slate-50 border-none rounded-xl py-2 pl-10 pr-4 text-[10px] font-bold text-slate-700 outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500/10 transition-all"
                                />
                            </div>
                        </div>
                        <div className="overflow-x-auto no-scrollbar">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50/50">
                                    <tr>
                                        <th className="px-8 py-5 text-[9px] font-black uppercase tracking-widest text-slate-400">Staff Member</th>
                                        <th className="px-8 py-5 text-[9px] font-black uppercase tracking-widest text-slate-400">Attendance</th>
                                        <th className="px-8 py-5 text-[9px] font-black uppercase tracking-widest text-slate-400">Salary Breakup</th>
                                        <th className="px-8 py-5 text-[9px] font-black uppercase tracking-widest text-slate-400">Net Payable</th>
                                        <th className="px-8 py-5 text-[9px] font-black uppercase tracking-widest text-slate-400">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {filteredLedger.map((row, idx) => (
                                        <tr key={idx} className="hover:bg-slate-50/50 transition-colors group">
                                            <td className="px-8 py-5">
                                                <button 
                                                    onClick={() => setSelectedStaff(staff.find(s => s.Staff_ID === row.Staff_ID))}
                                                    className="font-black text-slate-800 text-[11px] uppercase tracking-tighter hover:text-emerald-600 transition-colors"
                                                >
                                                    {row.Staff_Name}
                                                </button>
                                                <p className="text-[9px] font-bold text-slate-400 mt-0.5 tracking-widest uppercase">{row.Staff_ID}</p>
                                            </td>
                                            <td className="px-8 py-5">
                                                <div className="flex items-center gap-2">
                                                    <div className="px-2 py-1 bg-blue-50 text-blue-600 rounded-lg text-[9px] font-black">{row.Days_Worked} Days</div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5">
                                                <div className="space-y-1">
                                                    <p className="text-[10px] text-slate-600 font-bold">Gross: ₹{parseFloat(row.Gross_Salary).toLocaleString()}</p>
                                                    <p className="text-[9px] text-rose-500 font-bold">Deduct: ₹{parseFloat(row.Deductions).toLocaleString()}</p>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5">
                                                <p className="text-[12px] font-black text-slate-900 tracking-tighter">₹{parseFloat(row.Net_Salary).toLocaleString()}</p>
                                            </td>
                                            <td className="px-8 py-5">
                                                <span className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${row.Status === 'Settled' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-orange-50 text-orange-600 border border-orange-100 animate-pulse'}`}>
                                                    {row.Status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredLedger.length === 0 && (
                                        <tr>
                                            <td colSpan="5" className="px-8 py-20 text-center">
                                                <PieChart className="mx-auto text-slate-200 mb-4" size={48} />
                                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">No payroll records for this month</p>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* Salary Entry View */}
            {activeSubTab === 'HR_ENTRY' && (
                <SalaryEntryForm 
                    staff={staff} 
                    onSubmit={async (data) => {
                        setSubmitting(true);
                        try {
                            const res = await fetch(scriptUrl, {
                                method: 'POST',
                                mode: 'no-cors',
                                body: JSON.stringify({ action: 'submit_salary', ...data, month: selectedMonth, year: selectedYear })
                            });
                            alert("Salary submitted for approval");
                            fetchData();
                            setActiveSubTab('DASHBOARD');
                        } catch (err) { alert("Error submitting salary"); }
                        setSubmitting(false);
                    }}
                    submitting={submitting}
                />
            )}

            {/* Account Settlement View */}
            {activeSubTab === 'ACCOUNT_PANEL' && (
                <AccountSettlementPanel 
                    pending={ledger.filter(item => item.Status === 'Pending' && item.Month === selectedMonth && item.Year === selectedYear)} 
                    staff={staff}
                    onSettle={async (salaryId, remarks, staffData) => {
                        setSubmitting(true);
                        try {
                            const res = await fetch(scriptUrl, {
                                method: 'POST',
                                mode: 'no-cors',
                                body: JSON.stringify({ 
                                    action: 'settle_salary', 
                                    salaryId, 
                                    remarks,
                                    staffName: staffData.Name,
                                    staffMobile: staffData.Mobile,
                                    netSalary: staffData.Net_Salary,
                                    month: staffData.Month,
                                    year: staffData.Year,
                                    daysWorked: staffData.Days_Worked,
                                    deductions: staffData.Deductions
                                })
                            });
                            alert("Salary settled and staff notified");
                            fetchData();
                        } catch (err) { alert("Error settling salary"); }
                        setSubmitting(false);
                    }}
                    submitting={submitting}
                />
            )}

            {/* Staff Master View */}
            {activeSubTab === 'MASTER' && (
                <StaffMaster 
                    staff={staff} 
                    onAdd={async (data) => {
                        setSubmitting(true);
                        try {
                            await fetch(scriptUrl, {
                                method: 'POST',
                                mode: 'no-cors',
                                body: JSON.stringify({ action: 'add_staff', ...data })
                            });
                            fetchData();
                        } catch (err) { alert("Error adding staff"); }
                        setSubmitting(false);
                    }}
                    submitting={submitting}
                />
            )}

            {/* Staff Detail Popup */}
            <AnimatePresence>
                {selectedStaff && (
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[250] flex items-center justify-center p-6">
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0 }} 
                            animate={{ scale: 1, opacity: 1 }} 
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white w-full max-w-lg rounded-[3rem] overflow-hidden shadow-2xl"
                        >
                            <div className="bg-gradient-to-br from-emerald-600 to-teal-700 p-10 text-white relative">
                                <button onClick={() => setSelectedStaff(null)} className="absolute top-6 right-6 p-2 hover:bg-white/10 rounded-full transition-all"><X size={20} /></button>
                                <div className="flex items-center gap-6">
                                    <div className="w-20 h-20 bg-white/20 rounded-[2rem] flex items-center justify-center backdrop-blur-xl border border-white/30 shadow-xl">
                                        <User size={32} />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-black uppercase tracking-tighter leading-none mb-2">{selectedStaff.Name}</h3>
                                        <div className="flex items-center gap-3">
                                            <span className="px-3 py-1 bg-white/10 rounded-full text-[9px] font-black uppercase tracking-widest border border-white/20">{selectedStaff.Staff_ID}</span>
                                            <span className="px-3 py-1 bg-white/10 rounded-full text-[9px] font-black uppercase tracking-widest border border-white/20">{selectedStaff.Designation}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="p-10 space-y-8">
                                <div className="grid grid-cols-2 gap-8">
                                    <DetailItem label="Department" value={selectedStaff.Department} icon={<Building2 size={16} />} />
                                    <DetailItem label="Mobile Number" value={selectedStaff.Mobile} icon={<Phone size={16} />} />
                                    <DetailItem label="Bank Account" value={selectedStaff.Account_Number} icon={<Wallet size={16} />} />
                                    <DetailItem label="IFSC Code" value={selectedStaff.IFSC_Code} icon={<Building2 size={16} />} />
                                </div>
                                <div className="pt-8 border-t border-slate-100 flex items-center justify-between">
                                    <div>
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Base Salary</p>
                                        <p className="text-xl font-black text-slate-900 tracking-tighter">₹{parseFloat(selectedStaff.Base_Salary || 0).toLocaleString()}</p>
                                    </div>
                                    <button className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-xl shadow-slate-200">
                                        Update Details <ChevronRight size={14} />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

const StatCard = ({ icon, label, value, color, count }) => (
    <div className="bg-white rounded-[2.5rem] p-7 border border-slate-100 flex items-center gap-6 group hover:-translate-y-1 transition-all duration-500 shadow-sm relative overflow-hidden">
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg ${color}`}>{icon}</div>
        <div>
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">{label}</p>
            <p className="text-2xl font-black text-slate-800 tracking-tighter leading-none mb-1.5">{value}</p>
            <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{count}</span>
            </div>
        </div>
    </div>
);

const DetailItem = ({ label, value, icon }) => (
    <div className="space-y-2">
        <div className="flex items-center gap-2 text-slate-400">
            {icon}
            <span className="text-[9px] font-black uppercase tracking-widest">{label}</span>
        </div>
        <p className="text-sm font-black text-slate-800 truncate">{value || 'Not Added'}</p>
    </div>
);

// --- SUB-COMPONENTS ---

const SalaryEntryForm = ({ staff, onSubmit, submitting }) => {
    const [formData, setFormData] = useState({ staffId: '', staffName: '', daysWorked: '30', grossSalary: '', incentives: '0', deductions: '0' });

    const handleStaffSelect = (id) => {
        const s = staff.find(x => x.Staff_ID === id);
        if (s) {
            setFormData({ ...formData, staffId: id, staffName: s.Name, grossSalary: s.Base_Salary });
        }
    };

    const netSalary = (parseFloat(formData.grossSalary || 0) + parseFloat(formData.incentives || 0)) - parseFloat(formData.deductions || 0);

    return (
        <div className="max-w-2xl mx-auto bg-white rounded-[3rem] border border-slate-100 p-10 shadow-sm">
            <div className="flex items-center gap-4 mb-10">
                <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center border border-emerald-100">
                    <IndianRupee size={24} />
                </div>
                <div>
                    <h2 className="text-lg font-black uppercase tracking-tighter text-slate-800">New Salary Log</h2>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">HR Processing Unit</p>
                </div>
            </div>

            <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Select Employee</label>
                        <select 
                            value={formData.staffId} 
                            onChange={(e) => handleStaffSelect(e.target.value)}
                            className="w-full bg-slate-50 border-none rounded-2xl py-4 px-6 text-[11px] font-bold outline-none focus:ring-2 focus:ring-emerald-500/10 transition-all"
                        >
                            <option value="">Choose Staff...</option>
                            {staff.map(s => <option key={s.Staff_ID} value={s.Staff_ID}>{s.Name} ({s.Staff_ID})</option>)}
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Worked Days</label>
                        <input 
                            type="number" 
                            value={formData.daysWorked}
                            onChange={(e) => setFormData({...formData, daysWorked: e.target.value})}
                            className="w-full bg-slate-50 border-none rounded-2xl py-4 px-6 text-[11px] font-bold outline-none focus:ring-2 focus:ring-emerald-500/10 transition-all"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <FormInput label="Gross Salary" value={formData.grossSalary} onChange={(v) => setFormData({...formData, grossSalary: v})} />
                    <FormInput label="Incentives" value={formData.incentives} onChange={(v) => setFormData({...formData, incentives: v})} />
                    <FormInput label="Deductions" value={formData.deductions} onChange={(v) => setFormData({...formData, deductions: v})} />
                </div>

                <div className="p-8 bg-slate-900 rounded-[2.5rem] flex items-center justify-between text-white shadow-2xl shadow-slate-200">
                    <div>
                        <p className="text-[9px] font-black uppercase tracking-widest opacity-60 mb-1">Net Payable Amount</p>
                        <p className="text-3xl font-black tracking-tighter">₹{netSalary.toLocaleString()}</p>
                    </div>
                    <button 
                        onClick={() => onSubmit({ ...formData, netSalary })}
                        disabled={submitting || !formData.staffId}
                        className="flex items-center gap-3 px-8 py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl shadow-emerald-900/20 disabled:opacity-50"
                    >
                        {submitting ? <Loader2 className="animate-spin" size={16} /> : <><Send size={16} /> Submit to Accounts</>}
                    </button>
                </div>
            </div>
        </div>
    );
};

const FormInput = ({ label, value, onChange }) => (
    <div className="space-y-2">
        <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">{label}</label>
        <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 font-bold text-xs">₹</span>
            <input 
                type="number" 
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full bg-slate-50 border-none rounded-2xl py-4 pl-8 pr-6 text-[11px] font-bold outline-none focus:ring-2 focus:ring-emerald-500/10 transition-all"
            />
        </div>
    </div>
);

const AccountSettlementPanel = ({ pending, staff, onSettle, submitting }) => {
    const [remarks, setRemarks] = useState({});

    return (
        <div className="space-y-6">
            {pending.length === 0 ? (
                <div className="bg-white rounded-[3rem] p-32 text-center border border-slate-100">
                    <CheckCircle2 className="mx-auto text-emerald-100 mb-6" size={80} />
                    <h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter">All Salaries Settled</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">No pending payments for this month</p>
                </div>
            ) : (
                pending.map((item, idx) => {
                    const staffDetails = staff.find(s => s.Staff_ID === item.Staff_ID);
                    return (
                        <motion.div 
                            key={idx}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm group hover:border-blue-200 transition-all"
                        >
                            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                                <div className="flex items-center gap-6">
                                    <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center border border-blue-100 font-black text-sm uppercase">
                                        {item.Staff_Name.substring(0, 2)}
                                    </div>
                                    <div>
                                        <h4 className="text-lg font-black text-slate-800 uppercase tracking-tighter leading-none mb-2">{item.Staff_Name}</h4>
                                        <div className="flex items-center gap-3">
                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">ID: {item.Staff_ID}</span>
                                            <span className="w-1 h-1 bg-slate-200 rounded-full" />
                                            <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest">{item.Month} {item.Year}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 flex-1 lg:px-12 border-l border-r border-slate-50 border-dashed mx-4">
                                    <div className="space-y-1">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Worked Days</p>
                                        <p className="text-sm font-black text-slate-800">{item.Days_Worked} Days</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Gross / Deduct</p>
                                        <p className="text-sm font-black text-slate-800">₹{item.Gross_Salary} / <span className="text-rose-500">₹{item.Deductions}</span></p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Net Payable</p>
                                        <p className="text-lg font-black text-emerald-600 tracking-tighter leading-none">₹{parseFloat(item.Net_Salary).toLocaleString()}</p>
                                    </div>
                                    <div className="space-y-2">
                                        <input 
                                            type="text" 
                                            placeholder="Account Remarks..." 
                                            value={remarks[item.Salary_ID] || ''}
                                            onChange={(e) => setRemarks({ ...remarks, [item.Salary_ID]: e.target.value })}
                                            className="w-full bg-slate-50 border-none rounded-xl py-2 px-4 text-[10px] font-bold text-slate-700 outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/10 transition-all"
                                        />
                                    </div>
                                </div>

                                <button 
                                    onClick={() => onSettle(item.Salary_ID, remarks[item.Salary_ID], { ...item, ...staffDetails })}
                                    disabled={submitting}
                                    className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-blue-200 transition-all active:scale-95 flex items-center gap-3"
                                >
                                    {submitting ? <Loader2 className="animate-spin" size={16} /> : <><CheckCircle2 size={16} /> Settle & Notify</>}
                                </button>
                            </div>
                        </motion.div>
                    );
                })
            )}
        </div>
    );
};

const StaffMaster = ({ staff, onAdd, submitting }) => {
    const [showAddForm, setShowAddForm] = useState(false);
    const [formData, setFormData] = useState({ name: '', designation: '', department: '', mobile: '', accountNumber: '', ifscCode: '', baseSalary: '' });

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between px-2">
                <div>
                    <h2 className="text-lg font-black uppercase tracking-tighter text-slate-800 leading-none mb-1">Staff Roster</h2>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Total Registered Family Members: {staff.length}</p>
                </div>
                <button 
                    onClick={() => setShowAddForm(!showAddForm)}
                    className="flex items-center gap-3 px-6 py-3 bg-emerald-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-xl shadow-emerald-100"
                >
                    {showAddForm ? <><X size={16} /> Close Form</> : <><Plus size={16} /> Add New Staff</>}
                </button>
            </div>

            <AnimatePresence>
                {showAddForm && (
                    <motion.div 
                        initial={{ height: 0, opacity: 0 }} 
                        animate={{ height: 'auto', opacity: 1 }} 
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="bg-white rounded-[2.5rem] border border-slate-100 p-10 mb-10 shadow-sm grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <MasterInput label="Full Name" value={formData.name} onChange={(v) => setFormData({...formData, name: v})} />
                            <MasterInput label="Designation" value={formData.designation} onChange={(v) => setFormData({...formData, designation: v})} />
                            <MasterInput label="Department" value={formData.department} onChange={(v) => setFormData({...formData, department: v})} />
                            <MasterInput label="Mobile Number" value={formData.mobile} onChange={(v) => setFormData({...formData, mobile: v})} />
                            <MasterInput label="Account Number" value={formData.accountNumber} onChange={(v) => setFormData({...formData, accountNumber: v})} />
                            <MasterInput label="IFSC Code" value={formData.ifscCode} onChange={(v) => setFormData({...formData, ifscCode: v})} />
                            <MasterInput label="Base Salary" value={formData.baseSalary} onChange={(v) => setFormData({...formData, baseSalary: v})} type="number" />
                            <div className="lg:col-span-2 flex items-end">
                                <button 
                                    onClick={() => { onAdd(formData); setShowAddForm(false); }}
                                    disabled={submitting || !formData.name || !formData.mobile}
                                    className="w-full py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-xl disabled:opacity-50"
                                >
                                    {submitting ? <Loader2 className="animate-spin mx-auto" size={16} /> : "Save New Staff Record"}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-2">
                {staff.map((s, idx) => (
                    <div key={idx} className="bg-white rounded-[2.5rem] p-8 border border-slate-100 hover:border-emerald-200 transition-all group relative overflow-hidden">
                        <div className="absolute top-6 right-6 px-2 py-1 bg-slate-50 rounded-lg text-[8px] font-black text-slate-400 uppercase tracking-widest border border-slate-100">{s.Staff_ID}</div>
                        <div className="flex items-center gap-5 mb-8">
                            <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors">
                                <User size={24} />
                            </div>
                            <div>
                                <h4 className="font-black text-slate-800 uppercase tracking-tighter leading-none mb-1.5">{s.Name}</h4>
                                <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">{s.Designation}</p>
                            </div>
                        </div>
                        <div className="space-y-4 mb-8">
                            <div className="flex items-center justify-between text-[10px] font-bold">
                                <span className="text-slate-400 uppercase">Department</span>
                                <span className="text-slate-700">{s.Department}</span>
                            </div>
                            <div className="flex items-center justify-between text-[10px] font-bold">
                                <span className="text-slate-400 uppercase">Bank A/C</span>
                                <span className="text-slate-700 truncate ml-4">****{s.Account_Number?.slice(-4)}</span>
                            </div>
                        </div>
                        <div className="flex items-center justify-between pt-6 border-t border-slate-50">
                            <div>
                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Base Salary</p>
                                <p className="font-black text-slate-900 text-lg tracking-tighter">₹{parseFloat(s.Base_Salary || 0).toLocaleString()}</p>
                            </div>
                            <button className="p-3 bg-slate-50 text-slate-400 rounded-xl hover:bg-rose-50 hover:text-rose-600 transition-all"><X size={14} /></button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const MasterInput = ({ label, value, onChange, type = 'text' }) => (
    <div className="space-y-2">
        <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">{label}</label>
        <input 
            type={type} 
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full bg-slate-50 border-none rounded-2xl py-4 px-6 text-[11px] font-bold outline-none focus:ring-2 focus:ring-emerald-500/10 transition-all"
        />
    </div>
);

export default SBHFamilyManager;
