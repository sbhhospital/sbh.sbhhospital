import React, { useState, useEffect, useMemo } from 'react';
import { 
    Users, Plus, Calendar, IndianRupee, Clock, CheckCircle2, 
    AlertCircle, Search, Filter, Loader2, Save, X, Phone, 
    Stethoscope, Briefcase, TrendingUp, BarChart3, Download, Activity, User, RefreshCw, ChevronRight,
    Building2, Wallet, FileText, Send, PieChart, LayoutGrid, CalendarDays, History, Umbrella
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const UNITS = ["SBH Women", "SBH Eye", "SBH Fafadih", "SBH pharmacy", "SBH Lab", "SBH Cosmetic"];
const DEPARTMENTS = ["Nursing", "Front Desk", "Account", "HR", "Housekeeping", "Pharmacy", "Laboratory", "OT", "General"];

const SBHFamilyManager = ({ scriptUrl, user }) => {
    const [activeSubTab, setActiveSubTab] = useState('DASHBOARD'); // DASHBOARD, UNIT_VIEW, HR_ENTRY, ACCOUNT_PANEL, MASTER
    const [staff, setStaff] = useState([]);
    const [ledger, setLedger] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedUnit, setSelectedUnit] = useState('ALL');
    const [selectedMonth, setSelectedMonth] = useState(new Date().toLocaleString('en-US', { month: 'long' }));
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
    const [selectedStaff, setSelectedStaff] = useState(null);

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
            const matchesUnit = selectedUnit === 'ALL' || item.Unit === selectedUnit;
            const matchesSearch = !searchQuery || 
                item.Staff_Name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.Staff_ID.toLowerCase().includes(searchQuery.toLowerCase());
            return matchesMonth && matchesUnit && matchesSearch;
        });
    }, [ledger, selectedMonth, selectedYear, selectedUnit, searchQuery]);

    const stats = useMemo(() => {
        // Filter by Year and Unit for broad stats
        const yearData = ledger.filter(item => item.Year === selectedYear && (selectedUnit === 'ALL' || item.Unit === selectedUnit));
        const currentMonthData = yearData.filter(item => item.Month === selectedMonth);
        
        return {
            totalYearly: yearData.reduce((sum, item) => sum + (parseFloat(item.Net_Salary) || 0), 0),
            totalMonthly: currentMonthData.reduce((sum, item) => sum + (parseFloat(item.Net_Salary) || 0), 0),
            pendingMonthly: currentMonthData.filter(i => i.Status === 'Pending').reduce((sum, item) => sum + (parseFloat(item.Net_Salary) || 0), 0),
            staffCount: [...new Set(currentMonthData.map(i => i.Staff_ID))].length
        };
    }, [ledger, selectedMonth, selectedYear, selectedUnit]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center p-32 space-y-8 animate-pulse">
                <div className="relative">
                    <div className="w-20 h-20 border-4 border-emerald-100 rounded-full animate-spin border-t-emerald-600"></div>
                    <Building2 className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-emerald-600" size={30} />
                </div>
                <div className="text-center">
                    <p className="text-sm font-black uppercase tracking-[0.4em] text-slate-800 mb-2">SBH Family Cloud</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Loading Unit Data...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500 pb-20 max-w-[1600px] mx-auto px-4">
            {/* Multi-Level Navigation Header */}
            <div className="bg-white rounded-[2rem] border border-slate-100 p-4 sticky top-0 z-40 shadow-sm space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 md:pb-0">
                        {[
                            { id: 'DASHBOARD', label: 'Overview', icon: BarChart3 },
                            { id: 'UNIT_VIEW', label: 'Units', icon: LayoutGrid },
                            { id: 'HR_ENTRY', label: 'Processing', icon: Plus },
                            { id: 'ACCOUNT_PANEL', label: 'Settlement', icon: CheckCircle2 },
                            { id: 'MASTER', label: 'Staff Master', icon: Users }
                        ].map(tab => {
                            if (tab.id === 'HR_ENTRY' && user === 'ACCOUNT') return null;
                            if (tab.id === 'ACCOUNT_PANEL' && user === 'SBH HRD') return null;
                            return (
                                <button 
                                    key={tab.id}
                                    onClick={() => setActiveSubTab(tab.id)}
                                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeSubTab === tab.id ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}
                                >
                                    <tab.icon size={12} />
                                    {tab.label}
                                </button>
                            );
                        })}
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <select 
                            value={selectedUnit} 
                            onChange={(e) => setSelectedUnit(e.target.value)}
                            className="bg-emerald-50 text-emerald-700 border-none rounded-xl px-4 py-2.5 text-[9px] font-black uppercase tracking-widest outline-none focus:ring-2 focus:ring-emerald-500/20"
                        >
                            <option value="ALL">All Units</option>
                            {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                        </select>
                        <select 
                            value={selectedMonth} 
                            onChange={(e) => setSelectedMonth(e.target.value)}
                            className="bg-slate-50 border-none rounded-xl px-4 py-2.5 text-[9px] font-black uppercase tracking-widest text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500/20"
                        >
                            {months.map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                        <select 
                            value={selectedYear} 
                            onChange={(e) => setSelectedYear(e.target.value)}
                            className="bg-slate-50 border-none rounded-xl px-4 py-2.5 text-[9px] font-black uppercase tracking-widest text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500/20"
                        >
                            {years.map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                        <button onClick={fetchData} className="p-2.5 bg-slate-50 border border-slate-100 rounded-xl text-slate-400 hover:text-emerald-600 transition-all active:scale-95"><RefreshCw size={14} /></button>
                    </div>
                </div>
            </div>

            {/* Main Content Areas */}
            {activeSubTab === 'DASHBOARD' && (
                <div className="space-y-8 px-2">
                    {/* Stats Highlights */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <StatCard icon={<IndianRupee />} label="Monthly Payroll" value={`₹${stats.totalMonthly.toLocaleString()}`} color="bg-emerald-600" count={`${stats.staffCount} Staff in ${selectedUnit === 'ALL' ? 'All Units' : selectedUnit}`} />
                        <StatCard icon={<TrendingUp />} label="Yearly Disbursement" value={`₹${stats.totalYearly.toLocaleString()}`} color="bg-blue-600" count={`Total for ${selectedYear}`} />
                        <StatCard icon={<Clock />} label="Pending Disbursement" value={`₹${stats.pendingMonthly.toLocaleString()}`} color="bg-orange-500" count="Awaiting Settlement" />
                        <StatCard icon={<Building2 />} label="Active Unit" value={selectedUnit === 'ALL' ? '6 Locations' : selectedUnit} color="bg-slate-900" count="Scope" />
                    </div>

                    {/* Main Ledger Table */}
                    <div className="bg-white rounded-[2.5rem] border border-slate-100 overflow-hidden shadow-sm">
                        <div className="p-8 border-b border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <h2 className="text-xs font-black uppercase tracking-widest text-slate-800">Global Ledger: {selectedMonth} {selectedYear}</h2>
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Scope: {selectedUnit}</p>
                            </div>
                            <div className="relative group w-full md:w-80">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                                <input 
                                    type="text" 
                                    placeholder="Search by Name or Staff ID..." 
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full bg-slate-50 border-none rounded-2xl py-3 pl-10 pr-4 text-[10px] font-bold text-slate-700 outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500/10 transition-all"
                                />
                            </div>
                        </div>
                        <div className="overflow-x-auto no-scrollbar">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-slate-50/50 border-b border-slate-50">
                                    <tr>
                                        <th className="px-8 py-6 text-[9px] font-black uppercase tracking-widest text-slate-400">Staff & Unit</th>
                                        <th className="px-8 py-6 text-[9px] font-black uppercase tracking-widest text-slate-400">Payroll Details</th>
                                        <th className="px-8 py-6 text-[9px] font-black uppercase tracking-widest text-slate-400">Status</th>
                                        <th className="px-8 py-6 text-[9px] font-black uppercase tracking-widest text-slate-400">Settlement</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {filteredLedger.map((row, idx) => (
                                        <tr key={idx} className="hover:bg-slate-50/50 transition-colors group">
                                            <td className="px-8 py-6">
                                                <button 
                                                    onClick={() => setSelectedStaff(staff.find(s => s.Staff_ID === row.Staff_ID))}
                                                    className="font-black text-slate-800 text-[11px] uppercase tracking-tighter hover:text-emerald-600 transition-colors block text-left"
                                                >
                                                    {row.Staff_Name}
                                                </button>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-[9px] font-bold text-slate-400 tracking-widest uppercase">{row.Staff_ID}</span>
                                                    <span className="w-1 h-1 bg-slate-200 rounded-full" />
                                                    <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">{row.Unit}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-10">
                                                    <div>
                                                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Attendance</p>
                                                        <p className="text-[11px] font-black text-slate-700">{row.Days_Worked} Days</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Gross</p>
                                                        <p className="text-[11px] font-black text-slate-700">₹{parseFloat(row.Gross_Salary).toLocaleString()}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <span className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border ${row.Status === 'Settled' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-orange-50 text-orange-600 border-orange-100'}`}>
                                                    {row.Status}
                                                </span>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex flex-col">
                                                    <p className="text-[12px] font-black text-slate-900 tracking-tighter">₹{parseFloat(row.Net_Salary).toLocaleString()}</p>
                                                    <p className="text-[8px] font-bold text-slate-400 uppercase mt-0.5">{row.Account_Confirm_Date ? `Paid on ${row.Account_Confirm_Date.split(' ')[0]}` : 'Awaiting confirmation'}</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredLedger.length === 0 && (
                                        <tr>
                                            <td colSpan="4" className="px-8 py-24 text-center">
                                                <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
                                                    <PieChart className="text-slate-200" size={32} />
                                                </div>
                                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">No payroll data found for this period</p>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {activeSubTab === 'UNIT_VIEW' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {UNITS.map(unit => {
                        const unitData = ledger.filter(l => l.Unit === unit && l.Month === selectedMonth && l.Year === selectedYear);
                        const total = unitData.reduce((sum, i) => sum + (parseFloat(i.Net_Salary) || 0), 0);
                        const pending = unitData.filter(i => i.Status === 'Pending').length;
                        
                        return (
                            <div key={unit} className="bg-white rounded-[2.5rem] border border-slate-100 p-8 hover:border-emerald-200 transition-all group overflow-hidden relative">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2 group-hover:bg-emerald-500/10 transition-all" />
                                <div className="flex items-center justify-between mb-8">
                                    <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-all">
                                        <Building2 size={24} />
                                    </div>
                                    <button 
                                        onClick={() => { setSelectedUnit(unit); setActiveSubTab('DASHBOARD'); }}
                                        className="p-3 bg-slate-50 text-slate-400 rounded-xl hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
                                    >
                                        <ChevronRight size={16} />
                                    </button>
                                </div>
                                <h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter mb-1">{unit}</h3>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-8">{unitData.length} Staff Members</p>
                                
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-5 bg-slate-50 rounded-[2rem] border border-slate-100 group-hover:bg-white transition-colors">
                                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Net</p>
                                        <p className="text-lg font-black text-slate-900 tracking-tighter">₹{total.toLocaleString()}</p>
                                    </div>
                                    <div className={`p-5 rounded-[2rem] border transition-all ${pending > 0 ? 'bg-orange-50 border-orange-100 text-orange-600' : 'bg-emerald-50 border-emerald-100 text-emerald-600'}`}>
                                        <p className="text-[8px] font-black uppercase tracking-widest opacity-60 mb-1">Pending</p>
                                        <p className="text-lg font-black tracking-tighter">{pending} Staff</p>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {activeSubTab === 'HR_ENTRY' && (
                <SalaryEntryForm 
                    staff={staff.filter(s => selectedUnit === 'ALL' || s.Unit === selectedUnit)} 
                    onSubmit={async (data) => {
                        setSubmitting(true);
                        try {
                            const res = await fetch(scriptUrl, {
                                method: 'POST',
                                mode: 'no-cors',
                                body: JSON.stringify({ action: 'submit_salary', ...data, month: selectedMonth, year: selectedYear, unit: data.unit })
                            });
                            alert("Salary submitted successfully");
                            fetchData();
                            setActiveSubTab('DASHBOARD');
                        } catch (err) { alert("Submission failed"); }
                        setSubmitting(false);
                    }}
                    submitting={submitting}
                />
            )}

            {activeSubTab === 'ACCOUNT_PANEL' && (
                <AccountSettlementPanel 
                    pending={ledger.filter(item => item.Status === 'Pending' && (selectedUnit === 'ALL' || item.Unit === selectedUnit) && item.Month === selectedMonth && item.Year === selectedYear)} 
                    staff={staff}
                    onSettle={async (salaryId, remarks, staffData) => {
                        setSubmitting(true);
                        try {
                            await fetch(scriptUrl, {
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
                            alert("Settlement confirmed & notification sent");
                            fetchData();
                        } catch (err) { alert("Settlement failed"); }
                        setSubmitting(false);
                    }}
                    submitting={submitting}
                />
            )}

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
                        } catch (err) { alert("Failed to add staff"); }
                        setSubmitting(false);
                    }}
                    submitting={submitting}
                />
            )}

            {/* Enhanced Staff Popup with History */}
            <AnimatePresence>
                {selectedStaff && (
                    <StaffDetailPopup 
                        staff={selectedStaff} 
                        history={ledger.filter(l => l.Staff_ID === selectedStaff.Staff_ID)} 
                        onClose={() => setSelectedStaff(null)} 
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

const StaffDetailPopup = ({ staff, history, onClose }) => {
    const totalLifetime = history.reduce((sum, i) => sum + (parseFloat(i.Net_Salary) || 0), 0);
    const settledPayments = history.filter(i => i.Status === 'Settled');

    return (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xl z-[250] flex items-center justify-center p-4 md:p-10">
            <motion.div 
                initial={{ scale: 0.95, opacity: 0, y: 20 }} 
                animate={{ scale: 1, opacity: 1, y: 0 }} 
                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                className="bg-white w-full max-w-4xl rounded-[3.5rem] overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            >
                {/* Header Section */}
                <div className="bg-gradient-to-br from-emerald-600 via-teal-700 to-slate-900 p-10 md:p-14 text-white relative flex-shrink-0">
                    <button onClick={onClose} className="absolute top-8 right-8 p-3 bg-white/10 hover:bg-white/20 rounded-2xl transition-all"><X size={20} /></button>
                    <div className="flex flex-col md:flex-row md:items-center gap-10">
                        <div className="w-24 h-24 bg-white/20 rounded-[2.5rem] flex items-center justify-center backdrop-blur-2xl border border-white/30 shadow-2xl">
                            <User size={40} />
                        </div>
                        <div className="space-y-4">
                            <div>
                                <h3 className="text-3xl font-black uppercase tracking-tighter leading-none mb-2">{staff.Name}</h3>
                                <p className="text-sm font-bold text-white/60 uppercase tracking-[0.2em]">{staff.Designation} • {staff.Unit}</p>
                            </div>
                            <div className="flex flex-wrap items-center gap-3">
                                <Badge label={`ID: ${staff.Staff_ID}`} />
                                <Badge label={`Dept: ${staff.Department}`} />
                                <Badge label={`Joined: ${staff.Joining_Date || 'N/A'}`} color="bg-blue-500/20" />
                                {staff.Status === 'Ex-Staff' && <Badge label="Ex-Staff" color="bg-rose-500/20 text-rose-300" />}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content Section - Scrollable */}
                <div className="flex-1 overflow-y-auto p-10 md:p-14 space-y-12 no-scrollbar">
                    {/* Stats Row */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <PopupStat icon={<IndianRupee />} label="Lifetime Paid" value={`₹${totalLifetime.toLocaleString()}`} color="text-emerald-600" />
                        <PopupStat icon={<CalendarDays />} label="Payments" value={settledPayments.length} color="text-blue-600" />
                        <PopupStat icon={<Umbrella />} label="Leave Balance (CL/EL)" value={`${staff.CL_Total - (staff.CL_Used || 0)} / ${staff.EL_Total - (staff.EL_Used || 0)}`} color="text-orange-500" />
                    </div>

                    {/* Salary History Table */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400"><History size={16} /></div>
                            <h4 className="text-xs font-black uppercase tracking-widest text-slate-800">Payment Timeline</h4>
                        </div>
                        <div className="bg-slate-50/50 rounded-[2.5rem] border border-slate-100 overflow-hidden">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-slate-100/50">
                                    <tr>
                                        <th className="px-8 py-5 text-[9px] font-black uppercase tracking-widest text-slate-400">Month/Year</th>
                                        <th className="px-8 py-5 text-[9px] font-black uppercase tracking-widest text-slate-400">Days</th>
                                        <th className="px-8 py-5 text-[9px] font-black uppercase tracking-widest text-slate-400">Amount</th>
                                        <th className="px-8 py-5 text-[9px] font-black uppercase tracking-widest text-slate-400">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {history.sort((a,b) => b.Year - a.Year).map((item, idx) => (
                                        <tr key={idx} className="hover:bg-white transition-colors">
                                            <td className="px-8 py-4 text-[11px] font-black text-slate-700 uppercase">{item.Month} {item.Year}</td>
                                            <td className="px-8 py-4 text-[10px] font-bold text-slate-500">{item.Days_Worked} Days</td>
                                            <td className="px-8 py-4 text-[11px] font-black text-slate-900 font-mono">₹{parseFloat(item.Net_Salary).toLocaleString()}</td>
                                            <td className="px-8 py-4">
                                                <span className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase ${item.Status === 'Settled' ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'}`}>
                                                    {item.Status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                    {history.length === 0 && (
                                        <tr><td colSpan="4" className="px-8 py-10 text-center text-[10px] font-bold text-slate-300 uppercase">No history found</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Bank Details */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 pt-8 border-t border-slate-100">
                        <DetailItem label="Account Number" value={staff.Account_Number} />
                        <DetailItem label="IFSC Code" value={staff.IFSC_Code} />
                        <DetailItem label="Mobile" value={staff.Mobile} />
                        <DetailItem label="Base Pay" value={`₹${parseFloat(staff.Base_Salary || 0).toLocaleString()}`} />
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

const Badge = ({ label, color = "bg-white/10 border-white/20" }) => (
    <span className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border ${color}`}>
        {label}
    </span>
);

const PopupStat = ({ icon, label, value, color }) => (
    <div className="bg-slate-50 p-6 rounded-[2.5rem] border border-slate-100">
        <div className={`w-10 h-10 bg-white rounded-xl flex items-center justify-center mb-4 shadow-sm ${color}`}>
            {icon}
        </div>
        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
        <p className="text-xl font-black text-slate-900 tracking-tighter">{value}</p>
    </div>
);

const DetailItem = ({ label, value }) => (
    <div className="space-y-1">
        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
        <p className="text-xs font-black text-slate-800">{value || 'N/A'}</p>
    </div>
);

// --- OTHER SUB-COMPONENTS (Entry, Master) ---

const SalaryEntryForm = ({ staff, onSubmit, submitting }) => {
    const [formData, setFormData] = useState({ staffId: '', staffName: '', unit: '', daysWorked: '30', grossSalary: '', incentives: '0', deductions: '0' });

    const handleStaffSelect = (id) => {
        const s = staff.find(x => x.Staff_ID === id);
        if (s) {
            setFormData({ ...formData, staffId: id, staffName: s.Name, unit: s.Unit, grossSalary: s.Base_Salary });
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
                    <h2 className="text-lg font-black uppercase tracking-tighter text-slate-800">Salary Disbursement</h2>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">HR & Payroll Processor</p>
                </div>
            </div>

            <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Staff Member</label>
                        <select 
                            value={formData.staffId} 
                            onChange={(e) => handleStaffSelect(e.target.value)}
                            className="w-full bg-slate-50 border-none rounded-2xl py-4 px-6 text-[11px] font-bold outline-none focus:ring-2 focus:ring-emerald-500/10 transition-all"
                        >
                            <option value="">Select Employee...</option>
                            {staff.map(s => <option key={s.Staff_ID} value={s.Staff_ID}>{s.Name} ({s.Unit})</option>)}
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Days Worked</label>
                        <input type="number" value={formData.daysWorked} onChange={(e) => setFormData({...formData, daysWorked: e.target.value})} className="w-full bg-slate-50 border-none rounded-2xl py-4 px-6 text-[11px] font-bold outline-none focus:ring-2 focus:ring-emerald-500/10 transition-all" />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                        <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Gross Salary</label>
                        <input type="number" value={formData.grossSalary} onChange={(e) => setFormData({...formData, grossSalary: e.target.value})} className="w-full bg-slate-50 border-none rounded-2xl py-4 px-6 text-[11px] font-bold outline-none focus:ring-2 focus:ring-emerald-500/10 transition-all" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Incentives</label>
                        <input type="number" value={formData.incentives} onChange={(e) => setFormData({...formData, incentives: e.target.value})} className="w-full bg-slate-50 border-none rounded-2xl py-4 px-6 text-[11px] font-bold outline-none focus:ring-2 focus:ring-emerald-500/10 transition-all" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Deductions</label>
                        <input type="number" value={formData.deductions} onChange={(e) => setFormData({...formData, deductions: e.target.value})} className="w-full bg-slate-50 border-none rounded-2xl py-4 px-6 text-[11px] font-bold outline-none focus:ring-2 focus:ring-emerald-500/10 transition-all" />
                    </div>
                </div>

                <div className="p-8 bg-slate-900 rounded-[2.5rem] flex items-center justify-between text-white shadow-2xl">
                    <div>
                        <p className="text-[9px] font-black uppercase tracking-widest opacity-60 mb-1">Net Payable</p>
                        <p className="text-3xl font-black tracking-tighter">₹{netSalary.toLocaleString()}</p>
                    </div>
                    <button 
                        onClick={() => onSubmit({ ...formData, netSalary })}
                        disabled={submitting || !formData.staffId}
                        className="flex items-center gap-3 px-8 py-4 bg-emerald-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl disabled:opacity-50"
                    >
                        {submitting ? <Loader2 className="animate-spin" size={16} /> : <><Send size={16} /> Process & Notify</>}
                    </button>
                </div>
            </div>
        </div>
    );
};

const AccountSettlementPanel = ({ pending, staff, onSettle, submitting }) => {
    const [remarks, setRemarks] = useState({});

    return (
        <div className="space-y-6">
            {pending.length === 0 ? (
                <div className="bg-white rounded-[3rem] p-32 text-center border border-slate-100">
                    <CheckCircle2 className="mx-auto text-emerald-100 mb-6" size={80} />
                    <h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter">Clearance Complete</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">No pending settlements in current scope</p>
                </div>
            ) : (
                pending.map((item, idx) => {
                    const s = staff.find(x => x.Staff_ID === item.Staff_ID);
                    return (
                        <div key={idx} className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                            <div className="flex items-center gap-6">
                                <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center font-black border border-blue-100">{item.Staff_Name.substring(0, 2)}</div>
                                <div>
                                    <h4 className="text-lg font-black text-slate-800 uppercase tracking-tighter leading-none mb-2">{item.Staff_Name}</h4>
                                    <div className="flex items-center gap-3">
                                        <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest">{item.Unit}</span>
                                        <span className="w-1 h-1 bg-slate-200 rounded-full" />
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{item.Month} {item.Year}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex-1 lg:px-10 space-y-4">
                                <div className="grid grid-cols-3 gap-6">
                                    <div><p className="text-[8px] font-black text-slate-400 uppercase mb-1">Gross</p><p className="text-sm font-black text-slate-800">₹{item.Gross_Salary}</p></div>
                                    <div><p className="text-[8px] font-black text-slate-400 uppercase mb-1">Net</p><p className="text-sm font-black text-emerald-600">₹{item.Net_Salary}</p></div>
                                    <div><p className="text-[8px] font-black text-slate-400 uppercase mb-1">Bank</p><p className="text-sm font-black text-slate-800">****{s?.Account_Number?.slice(-4)}</p></div>
                                </div>
                                <input type="text" placeholder="Settlement Remarks..." value={remarks[item.Salary_ID] || ''} onChange={(e) => setRemarks({ ...remarks, [item.Salary_ID]: e.target.value })} className="w-full bg-slate-50 border-none rounded-xl py-3 px-4 text-[10px] font-bold outline-none" />
                            </div>
                            <button onClick={() => onSettle(item.Salary_ID, remarks[item.Salary_ID], { ...item, ...s })} disabled={submitting} className="px-8 py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-3 shadow-xl">
                                {submitting ? <Loader2 className="animate-spin" size={16} /> : <><CheckCircle2 size={16} /> Confirm Payment</>}
                            </button>
                        </div>
                    );
                })
            )}
        </div>
    );
};

const StaffMaster = ({ staff, onAdd, submitting }) => {
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({ name: '', designation: '', department: 'Nursing', unit: 'SBH Women', mobile: '', accountNumber: '', ifscCode: '', baseSalary: '', joiningDate: '', clTotal: '12', elTotal: '15' });

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-black text-slate-800 uppercase tracking-tighter">Family Master</h2>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Employee Central Repository</p>
                </div>
                <button onClick={() => setShowForm(!showForm)} className="px-6 py-3 bg-emerald-500 text-white rounded-2xl text-[10px] font-black uppercase shadow-xl hover:bg-emerald-600 transition-all">
                    {showForm ? 'Close Form' : 'Register New Staff'}
                </button>
            </div>

            <AnimatePresence>
                {showForm && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                        <div className="bg-white rounded-[3rem] border border-slate-100 p-10 mb-10 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-6">
                            <MasterInput label="Full Name" value={formData.name} onChange={(v) => setFormData({...formData, name: v})} />
                            <MasterInput label="Designation" value={formData.designation} onChange={(v) => setFormData({...formData, designation: v})} />
                            <div className="space-y-2">
                                <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Department</label>
                                <select value={formData.department} onChange={(e) => setFormData({...formData, department: e.target.value})} className="w-full bg-slate-50 border-none rounded-2xl py-4 px-6 text-[10px] font-black outline-none uppercase">
                                    {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Assigned Unit</label>
                                <select value={formData.unit} onChange={(e) => setFormData({...formData, unit: e.target.value})} className="w-full bg-slate-50 border-none rounded-2xl py-4 px-6 text-[10px] font-black outline-none uppercase">
                                    {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                                </select>
                            </div>
                            <MasterInput label="Mobile" value={formData.mobile} onChange={(v) => setFormData({...formData, mobile: v})} />
                            <MasterInput label="Bank A/C" value={formData.accountNumber} onChange={(v) => setFormData({...formData, accountNumber: v})} />
                            <MasterInput label="IFSC Code" value={formData.ifscCode} onChange={(v) => setFormData({...formData, ifscCode: v})} />
                            <MasterInput label="Joining Date" value={formData.joiningDate} onChange={(v) => setFormData({...formData, joiningDate: v})} type="date" />
                            <MasterInput label="Base Salary" value={formData.baseSalary} onChange={(v) => setFormData({...formData, baseSalary: v})} type="number" />
                            <div className="grid grid-cols-2 gap-4">
                                <MasterInput label="CL Total" value={formData.clTotal} onChange={(v) => setFormData({...formData, clTotal: v})} type="number" />
                                <MasterInput label="EL Total" value={formData.elTotal} onChange={(v) => setFormData({...formData, elTotal: v})} type="number" />
                            </div>
                            <div className="md:col-span-2 flex items-end">
                                <button onClick={() => { onAdd(formData); setShowForm(false); }} disabled={submitting || !formData.name} className="w-full py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase shadow-2xl disabled:opacity-50">
                                    {submitting ? 'Saving...' : 'Confirm Registration'}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {staff.map((s, idx) => (
                    <div key={idx} className="bg-white rounded-[2.5rem] p-8 border border-slate-100 hover:border-emerald-200 transition-all group shadow-sm">
                        <div className="flex items-center gap-5 mb-6">
                            <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-all"><User size={24} /></div>
                            <div>
                                <h4 className="font-black text-slate-800 uppercase tracking-tighter leading-none mb-1">{s.Name}</h4>
                                <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">{s.Unit}</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 pt-6 border-t border-slate-50">
                            <div><p className="text-[8px] font-black text-slate-400 uppercase mb-1">Role</p><p className="text-[10px] font-black text-slate-700">{s.Designation}</p></div>
                            <div><p className="text-[8px] font-black text-slate-400 uppercase mb-1">Joined</p><p className="text-[10px] font-black text-slate-700">{s.Joining_Date || 'N/A'}</p></div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const StatCard = ({ icon, label, value, color, count }) => (
    <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 flex items-center gap-6 group hover:-translate-y-1 transition-all duration-500 shadow-sm relative overflow-hidden">
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg ${color}`}>{icon}</div>
        <div>
            <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-1">{label}</p>
            <p className="text-2xl font-black text-slate-800 tracking-tighter leading-none mb-1.5">{value}</p>
            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{count}</p>
        </div>
    </div>
);

const MasterInput = ({ label, value, onChange, type = 'text' }) => (
    <div className="space-y-2">
        <label className="text-[9px] font-black uppercase text-slate-400 ml-1">{label}</label>
        <input type={type} value={value} onChange={(e) => onChange(e.target.value)} className="w-full bg-slate-50 border-none rounded-2xl py-4 px-6 text-[10px] font-black outline-none" />
    </div>
);

export default SBHFamilyManager;
