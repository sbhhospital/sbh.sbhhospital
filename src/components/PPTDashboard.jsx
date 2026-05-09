import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Activity, AlertTriangle, ArrowDownRight, ArrowUpRight, BarChart3, Bell, 
    Calendar, Check, CheckCircle2, ChevronRight, Clock, Download, Edit3, 
    Filter, Loader2, MoreVertical, Plus, Presentation, RefreshCw, Search, 
    Send, Shield, ShieldAlert, TrendingUp, UserCheck, UserPlus, Users, X, Trash, Tag, Mail
} from 'lucide-react';

const PPTDashboard = ({ scriptUrl, loading: parentLoading, onRefresh }) => {
    const [data, setData] = useState({
        master: [],
        submissions: [],
        admins: [],
        director: [],
        reminders: [],
        config: [],
        schedule: {}
    });
    const [loading, setLoading] = useState(true);
    const [selectedMonth, setSelectedMonth] = useState(() => {
        const d = new Date();
        return d.toLocaleString('en-US', { month: 'long', year: 'numeric' });
    });
    const [activeSubTab, setActiveSubTab] = useState('STATUS'); // STATUS, MASTER, CONFIG
    const [searchTerm, setSearchTerm] = useState('');

    // Modal States
    const [showLeaderModal, setShowLeaderModal] = useState(false);
    const [showAdminModal, setShowAdminModal] = useState(false);
    const [showDirectorModal, setShowDirectorModal] = useState(false);
    
    // Form States
    const [leaderForm, setLeaderForm] = useState({ 
        staff_id: '', name: '', department: '', mobile: '', email: '', 
        submission_day: '5', reminder_days: 'Wednesday,Friday',
        ppt_type: 'Center Head PPT' 
    });
    const [adminForm, setAdminForm] = useState({ name: '', mobile: '', email: '', role: 'Admin' });
    const [directorForm, setDirectorForm] = useState({ name: '', mobile: '', email: '' });

    const pptTypes = [
        "Center Head PPT", "Eye Center Head PPT", "Women Center Head PPT", 
        "COO PPT", "Operations PPT", "HR PPT", "Pharmacy PPT", 
        "Marketing PPT", "Account Eye PPT", "Account Women PPT", 
        "London Eye Account PPT", "Women Doctors PPT", "Eye Doctors PPT",
        "Hospital Admin PPT", "Quality PPT", "Monthly Performance PPT"
    ];

    // Loading Logic
    const loadingMessages = [
        "Synchronizing PPT Protocols...",
        "Scanning Submission Horizon...",
        "Calibrating Reminder Schedules...",
        "Connecting to Master Authority..."
    ];
    const [msgIdx, setMsgIdx] = useState(0);

    useEffect(() => {
        if (loading || parentLoading) {
            const t = setInterval(() => setMsgIdx(p => (p + 1) % loadingMessages.length), 1500);
            return () => clearInterval(t);
        }
    }, [loading, parentLoading]);

    const fetchData = async (silent = false) => {
        if (!silent) setLoading(true);
        try {
            const r = await fetch(`${scriptUrl}?action=get_ppt_data`);
            const res = await r.json();
            setData(res);
            if (res.director?.[0]) setDirectorForm(res.director[0]);
        } catch (err) {
            console.error("PPT Data Fetch Error:", err);
        } finally {
            if (!silent) setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(() => fetchData(true), 30000);
        return () => clearInterval(interval);
    }, [selectedMonth]);

    const stats = useMemo(() => {
        const monthSubmissions = data.submissions.filter(s => s.month === selectedMonth);
        const submittedCount = monthSubmissions.length;
        const totalLeaders = data.master.length;
        const pendingCount = Math.max(0, totalLeaders - submittedCount);
        
        let totalScore = 0;
        monthSubmissions.forEach(s => {
            let score = 100;
            const delay = parseInt(s.delay_days) || 0;
            if (delay > 10) {
                score = Math.max(0, 100 - (delay - 10) * 5);
            }
            totalScore += score;
        });
        
        const avgCompliance = totalLeaders > 0 ? (totalScore / totalLeaders).toFixed(1) : 0;
        const delayOver15 = monthSubmissions.filter(s => (parseInt(s.delay_days) || 0) > 15).length;

        return { totalLeaders, submittedCount, pendingCount, avgCompliance, delayOver15 };
    }, [data, selectedMonth]);

    const filteredMaster = useMemo(() => {
        return data.master.filter(m => 
            m.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            m.department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            m.ppt_type?.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [data.master, searchTerm]);

    const statusList = useMemo(() => {
        return data.master.map(leader => {
            const sub = data.submissions.find(s => s.staff_id == leader.staff_id && s.month === selectedMonth);
            return {
                ...leader,
                status: sub ? 'SUBMITTED' : 'PENDING',
                submissionDate: sub ? sub.submitted_date : null,
                delay: sub ? sub.delay_days : 0,
                link: sub ? sub.ppt_link : null
            };
        });
    }, [data.master, data.submissions, selectedMonth]);

    const handleAction = async (action, payload) => {
        setLoading(true);
        try {
            await fetch(scriptUrl, {
                method: 'POST',
                mode: 'no-cors',
                headers: { 'Content-Type': 'text/plain' },
                body: JSON.stringify({ action, ...payload })
            });
            setTimeout(fetchData, 1000); 
            setShowLeaderModal(false);
            setShowAdminModal(false);
            setShowDirectorModal(false);
        } catch (err) {
            alert("Action failed. Please check connection.");
        } finally {
            setLoading(false);
        }
    };

    const handleSendManualReminder = async (staffId, type = 'Manual') => {
        setLoading(true);
        try {
            await fetch(scriptUrl, {
                method: 'POST',
                mode: 'no-cors',
                headers: { 'Content-Type': 'text/plain' },
                body: JSON.stringify({
                    action: 'send_reminder',
                    staff_id: staffId,
                    month: selectedMonth,
                    manual_type: type
                })
            });
            alert(`Reminder Protocol Initiated: ${type}`);
            fetchData();
        } catch (err) {
            alert("Reminder failed to transmit.");
        } finally {
            setLoading(false);
        }
    };

    const editLeader = (leader) => {
        setLeaderForm({
            staff_id: leader.staff_id,
            name: leader.name,
            department: leader.department,
            mobile: leader.mobile,
            email: leader.email,
            submission_day: leader.submission_day || '5',
            reminder_days: leader.reminder_days || 'Wednesday,Friday',
            ppt_type: leader.ppt_type || 'Center Head PPT'
        });
        setShowLeaderModal(true);
    };

    if (loading || parentLoading) {
        return (
            <div className="flex flex-col items-center justify-center p-32 space-y-8 min-h-[60vh]">
                <div className="relative">
                    <div className="w-24 h-24 border-4 border-orange-100 rounded-full animate-spin border-t-orange-600"></div>
                    <Presentation className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-orange-600" size={36} />
                </div>
                <p className="text-sm font-black text-slate-800 uppercase tracking-tighter italic">{loadingMessages[msgIdx]}</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-20">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-1">
                <div>
                    <h2 className="text-3xl font-black text-slate-800 uppercase tracking-tighter flex items-center gap-3">
                        PPT <span className="text-orange-600">Reminders</span>
                        <div className="px-3 py-1 bg-orange-50 text-orange-600 rounded-full text-[10px] font-black tracking-widest border border-orange-100 uppercase">System v3.2</div>
                    </h2>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2 flex items-center gap-2">
                        <Activity size={12} className="text-emerald-500" />
                        Monitoring Compliance Horizon for Hospital Leaders
                    </p>
                </div>
                
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border border-slate-100 shadow-sm">
                        <div className="flex items-center gap-2 px-3 border-r border-slate-50">
                            <Calendar size={14} className="text-orange-600" />
                            <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Active Cycle</span>
                        </div>
                        <select 
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(e.target.value)}
                            className="bg-transparent text-[10px] font-black uppercase tracking-widest text-slate-800 outline-none px-4 py-1.5 cursor-pointer appearance-none min-w-[140px]"
                        >
                            {[...Array(12)].map((_, i) => {
                                const d = new Date();
                                d.setMonth(d.getMonth() - i);
                                const m = d.toLocaleString('en-US', { month: 'long', year: 'numeric' });
                                return <option key={m} value={m}>{m}</option>;
                            })}
                        </select>
                    </div>
                    <button 
                        onClick={() => fetchData()}
                        className="p-3 bg-white border border-slate-100 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-2xl transition-all shadow-sm group"
                    >
                        <RefreshCw size={16} className={loading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'} />
                    </button>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard label="Compliance Score" value={`${stats.avgCompliance}%`} icon={<TrendingUp size={24} />} color="emerald" trend={stats.avgCompliance > 90 ? 'Healthy' : 'Needs Review'} />
                <StatCard label="Total Leaders" value={stats.totalLeaders} icon={<Users size={24} />} color="slate" trend={`${stats.submittedCount} Submissions`} />
                <StatCard label="Pending Cycle" value={stats.pendingCount} icon={<CheckCircle2 size={24} />} color="orange" trend="Action Required" />
                <StatCard label="Escalations" value={stats.delayOver15} icon={<ShieldAlert size={24} />} color="rose" trend={stats.delayOver15 > 0 ? 'Director Informed' : 'All Clear'} />
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-2 p-1.5 bg-slate-100/50 rounded-2xl w-fit border border-slate-100">
                <TabButton active={activeSubTab === 'STATUS'} onClick={() => setActiveSubTab('STATUS')} label="Submission Ledger" icon={<BarChart3 size={14} />} />
                <TabButton active={activeSubTab === 'MASTER'} onClick={() => setActiveSubTab('MASTER')} label="Leader Master" icon={<Users size={14} />} />
                <TabButton active={activeSubTab === 'CONFIG'} onClick={() => setActiveSubTab('CONFIG')} label="System Config" icon={<Shield size={14} />} />
            </div>

            {/* Main Content Area */}
            <AnimatePresence mode="wait">
                <motion.div key={activeSubTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="min-h-[400px]">
                    {activeSubTab === 'STATUS' && (
                        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden">
                            <div className="p-8 border-b border-slate-50 flex items-center justify-between">
                                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Submission Horizon - {selectedMonth}</h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left min-w-[900px]">
                                    <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100">
                                        <tr>
                                            <th className="px-8 py-5">Leader Detail</th>
                                            <th className="px-8 py-5">PPT Type</th>
                                            <th className="px-8 py-5">Status</th>
                                            <th className="px-8 py-5">Submission Date</th>
                                            <th className="px-8 py-5 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {statusList.map((row, i) => (
                                            <tr key={i} className="group hover:bg-slate-50/50 transition-all">
                                                <td className="px-8 py-6">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center font-black text-xs shadow-lg group-hover:bg-orange-600 transition-colors">{row.name?.[0]}</div>
                                                        <div>
                                                            <p className="text-[11px] font-black text-slate-800 leading-none mb-1.5 uppercase">{row.name}</p>
                                                            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{row.department}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <div className="flex items-center gap-2">
                                                        <Tag size={12} className="text-orange-500" />
                                                        <span className="text-[9px] font-black text-slate-700 uppercase tracking-widest">{row.ppt_type || 'General PPT'}</span>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    {row.status === 'SUBMITTED' ? (
                                                        <div className="flex items-center gap-2 text-emerald-600 font-black text-[9px] uppercase tracking-widest bg-emerald-50 px-3 py-1.5 rounded-full w-fit border border-emerald-100">
                                                            <Check size={12} strokeWidth={3} /> Synchronized
                                                        </div>
                                                    ) : (
                                                        <div className={`flex items-center gap-2 font-black text-[9px] uppercase tracking-widest px-3 py-1.5 rounded-full w-fit border ${
                                                            parseInt(row.delay) >= 15 ? 'text-rose-600 bg-rose-50 border-rose-100' :
                                                            parseInt(row.delay) >= 10 ? 'text-orange-600 bg-orange-50 border-orange-100' :
                                                            'text-slate-500 bg-slate-50 border-slate-100'
                                                        }`}>
                                                            <Clock size={12} strokeWidth={3} /> {
                                                                parseInt(row.delay) >= 15 ? 'Critical Escalation' :
                                                                parseInt(row.delay) >= 10 ? 'Delayed Over 10 Days' :
                                                                'Upcoming / Pending'
                                                            }
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-8 py-6">
                                                    {row.submissionDate ? (
                                                        <div>
                                                            <p className="text-[10px] font-black text-slate-700 leading-none mb-1">{new Date(row.submissionDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                                                            <p className={`text-[8px] font-bold uppercase tracking-widest ${parseInt(row.delay) > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>{parseInt(row.delay) > 0 ? `Delayed by ${row.delay} Days` : 'On Time Protocol'}</p>
                                                        </div>
                                                    ) : (
                                                        <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest italic">Not Logged</span>
                                                    )}
                                                </td>
                                                <td className="px-8 py-6 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button onClick={() => handleSendManualReminder(row.staff_id)} className="p-2 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-all" title="Send WhatsApp & Email"><Bell size={14} /></button>
                                                        {row.status === 'PENDING' && (
                                                            <button onClick={() => handleSendManualReminder(row.staff_id, 'Super Alert')} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all" title="Direct Director Alert"><ShieldAlert size={14} /></button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeSubTab === 'MASTER' && (
                        <div className="space-y-6">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="relative flex-1 max-w-md">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                    <input type="text" placeholder="Search Leaders, Departments, PPT Types..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-12 pr-6 py-4 bg-white border border-slate-100 rounded-2xl text-xs font-bold text-slate-700 outline-none focus:border-orange-500/20 focus:ring-4 ring-orange-500/5 transition-all shadow-sm" />
                                </div>
                                <button onClick={() => { setLeaderForm({ staff_id: '', name: '', department: '', mobile: '', email: '', submission_day: '5', reminder_days: 'Wednesday,Friday', ppt_type: 'Center Head PPT' }); setShowLeaderModal(true); }} className="flex items-center gap-3 px-6 py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:bg-orange-600 transition-all group">
                                    <UserPlus size={16} className="group-hover:scale-110 transition-transform" /> Add New Leader
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {filteredMaster.map((leader, i) => (
                                    <motion.div key={i} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden">
                                        <button onClick={() => editLeader(leader)} className="absolute top-6 right-6 p-2 bg-slate-50 text-slate-300 hover:text-orange-600 hover:bg-orange-50 rounded-xl transition-all"><Edit3 size={14} /></button>
                                        <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-orange-50 transition-colors">
                                            <UserCheck size={24} className="text-slate-400 group-hover:text-orange-600 transition-colors" />
                                        </div>
                                        <h4 className="text-sm font-black text-slate-800 leading-tight mb-2 uppercase">{leader.name}</h4>
                                        <div className="flex flex-wrap items-center gap-2 mb-6">
                                            <div className="px-3 py-1 bg-slate-100 text-slate-500 rounded-full text-[8px] font-black uppercase tracking-widest">{leader.department}</div>
                                            <div className="px-3 py-1 bg-orange-50 text-orange-600 rounded-full text-[8px] font-black uppercase tracking-widest">{leader.ppt_type || 'General PPT'}</div>
                                        </div>
                                        <div className="space-y-3 pt-6 border-t border-slate-50">
                                            <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-widest">
                                                <span className="text-slate-400">Node Email</span>
                                                <span className="text-slate-700 text-[8px]">{leader.email || 'N/A'}</span>
                                            </div>
                                            <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-widest">
                                                <span className="text-slate-400">Deadline</span>
                                                <span className="text-slate-700">{leader.submission_day || 5}th of Month</span>
                                            </div>
                                            <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-widest">
                                                <span className="text-slate-400">Mobile Node</span>
                                                <span className="text-slate-700">{leader.mobile}</span>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeSubTab === 'CONFIG' && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-orange-50 rounded-full -mr-16 -mt-16 opacity-50" />
                                <div className="flex items-center justify-between mb-10 relative">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center shadow-lg"><Shield size={20} /></div>
                                        <div>
                                            <h4 className="text-xs font-black uppercase tracking-widest text-slate-800">Master Authority</h4>
                                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Director's Global Node</p>
                                        </div>
                                    </div>
                                    <button onClick={() => {
                                        setDirectorForm(data.director[0] || { name: '', mobile: '', email: '' });
                                        setShowDirectorModal(true);
                                    }} className="p-2.5 bg-slate-50 hover:bg-orange-50 text-slate-400 hover:text-orange-600 rounded-xl transition-all"><Edit3 size={14} /></button>
                                </div>
                                {data.director[0] ? (
                                    <div className="space-y-6 relative">
                                        <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Primary Director</p>
                                            <p className="text-lg font-black text-slate-900 uppercase">{data.director[0].name}</p>
                                            <div className="flex flex-col gap-2 mt-4 text-[10px] font-black text-orange-600 uppercase tracking-widest">
                                                <div className="flex items-center gap-2"><Send size={12} /> {data.director[0].mobile}</div>
                                                <div className="flex items-center gap-2"><Mail size={12} /> {data.director[0].email || 'No Email Configured'}</div>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="py-10 text-center opacity-30 italic text-[10px] font-black uppercase tracking-widest">Director Node Not Configured</div>
                                )}
                            </div>

                            <div className="bg-slate-900 p-10 rounded-[3rem] text-white shadow-2xl relative overflow-hidden">
                                <div className="flex items-center justify-between mb-10 relative">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center border border-white/10"><Bell size={20} className="text-orange-500" /></div>
                                        <div>
                                            <h4 className="text-xs font-black uppercase tracking-widest text-white">System Admins</h4>
                                            <p className="text-[9px] font-bold text-white/40 uppercase tracking-widest mt-1">Notification Controllers</p>
                                        </div>
                                    </div>
                                    <button onClick={() => {
                                        setAdminForm({ name: '', mobile: '', email: '', role: 'Admin' });
                                        setShowAdminModal(true);
                                    }} className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all">Manage</button>
                                </div>
                                <div className="space-y-4 relative">
                                    {data.admins.length > 0 ? data.admins.map((admin, i) => (
                                        <div key={i} className="flex items-center justify-between p-5 bg-white/5 border border-white/5 rounded-[2rem]">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 bg-orange-500 text-white rounded-xl flex items-center justify-center font-black text-xs shadow-lg shadow-orange-500/20">{admin.name?.[0]}</div>
                                                <div>
                                                    <p className="text-[11px] font-black leading-none mb-1.5 uppercase">{admin.name}</p>
                                                    <p className="text-[8px] font-bold text-white/40 uppercase tracking-widest">{admin.role}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[9px] font-black leading-none mb-1 text-orange-500">{admin.mobile}</p>
                                                <p className="text-[7px] font-bold text-white/20 uppercase tracking-widest">{admin.email || 'No Email'}</p>
                                            </div>
                                        </div>
                                    )) : (
                                        <div className="py-10 text-center opacity-30 italic text-[10px] font-black uppercase tracking-widest">Admin Nodes Not Configured</div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </motion.div>
            </AnimatePresence>

            {/* MODALS */}
            <Modal isOpen={showLeaderModal} onClose={() => setShowLeaderModal(false)} title="Configure Hospital Leader">
                <div className="space-y-6 max-h-[75vh] overflow-y-auto px-2 custom-scrollbar">
                    <div className="grid grid-cols-2 gap-4">
                        <InputField label="Staff ID" value={leaderForm.staff_id} onChange={v => setLeaderForm({...leaderForm, staff_id: v})} />
                        <InputField label="Leader Name" value={leaderForm.name} onChange={v => setLeaderForm({...leaderForm, name: v})} />
                    </div>
                    
                    <div className="space-y-2">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Assigned PPT Protocol (Post/Dept)</label>
                        <select 
                            value={leaderForm.ppt_type}
                            onChange={(e) => setLeaderForm({...leaderForm, ppt_type: e.target.value})}
                            className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-900 outline-none focus:bg-white focus:border-orange-500 transition-all text-xs appearance-none"
                        >
                            {pptTypes.map(type => <option key={type} value={type}>{type}</option>)}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <InputField label="Department" value={leaderForm.department} onChange={v => setLeaderForm({...leaderForm, department: v})} />
                        <InputField label="Mobile Number" value={leaderForm.mobile} onChange={v => setLeaderForm({...leaderForm, mobile: v})} />
                    </div>
                    
                    <InputField label="Official Email Node" value={leaderForm.email} onChange={v => setLeaderForm({...leaderForm, email: v})} />

                    <div className="pt-4 border-t border-slate-100">
                        <p className="text-[10px] font-black text-slate-800 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <Calendar size={14} className="text-orange-600" /> Individual Protocol Settings
                        </p>
                        
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Submission Deadline Day</label>
                                <select 
                                    value={leaderForm.submission_day}
                                    onChange={(e) => setLeaderForm({...leaderForm, submission_day: e.target.value})}
                                    className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-900 outline-none focus:bg-white focus:border-orange-500 transition-all text-xs"
                                >
                                    {[...Array(31)].map((_, i) => <option key={i+1} value={i+1}>{i+1}th of Next Month</option>)}
                                </select>
                            </div>

                            <div className="space-y-3">
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Weekly Reminder Days</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => {
                                        const isSelected = leaderForm.reminder_days.includes(day);
                                        return (
                                            <button 
                                                key={day}
                                                type="button"
                                                onClick={() => {
                                                    const days = leaderForm.reminder_days.split(',').filter(d => d);
                                                    const next = days.includes(day) ? days.filter(d => d !== day) : [...days, day];
                                                    setLeaderForm({...leaderForm, reminder_days: next.join(',')});
                                                }}
                                                className={`flex items-center justify-between p-3 rounded-xl border text-[9px] font-black uppercase transition-all ${isSelected ? 'bg-orange-50 border-orange-200 text-orange-600' : 'bg-white border-slate-100 text-slate-400'}`}
                                            >
                                                {day.slice(0,3)}
                                                {isSelected && <Check size={12} />}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>

                    <button onClick={() => handleAction('update_master', leaderForm)} className="w-full py-5 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest mt-6 shadow-xl shadow-slate-200">Synchronize Leader Profile</button>
                </div>
            </Modal>

            <Modal isOpen={showAdminModal} onClose={() => setShowAdminModal(false)} title="Register System Admin">
                <div className="space-y-4">
                    <InputField label="Admin Name" value={adminForm.name} onChange={v => setAdminForm({...adminForm, name: v})} />
                    <InputField label="Mobile Number" value={adminForm.mobile} onChange={v => setAdminForm({...adminForm, mobile: v})} />
                    <InputField label="Email Address" value={adminForm.email} onChange={v => setAdminForm({...adminForm, email: v})} />
                    <InputField label="Role" value={adminForm.role} onChange={v => setAdminForm({...adminForm, role: v})} />
                    <button onClick={() => handleAction('update_admins', adminForm)} className="w-full py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest mt-6">Connect Admin Node</button>
                </div>
            </Modal>

            <Modal isOpen={showDirectorModal} onClose={() => setShowDirectorModal(false)} title="Update Master Authority">
                <div className="space-y-4">
                    <InputField label="Director Name" value={directorForm.name} onChange={v => setDirectorForm({...directorForm, name: v})} />
                    <InputField label="Mobile Number" value={directorForm.mobile} onChange={v => setDirectorForm({...directorForm, mobile: v})} />
                    <InputField label="Email Address" value={directorForm.email} onChange={v => setDirectorForm({...directorForm, email: v})} />
                    <button onClick={() => handleAction('update_director', directorForm)} className="w-full py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest mt-6">Synchronize Director</button>
                </div>
            </Modal>

            {/* Processing Overlay */}
            {loading && !parentLoading && data.master.length > 0 && (
                <div className="fixed inset-0 z-[2000] bg-white/80 backdrop-blur-sm flex items-center justify-center">
                    <div className="flex flex-col items-center gap-4">
                        <Loader2 size={40} className="text-orange-600 animate-spin" />
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-800">Processing Protocol...</p>
                    </div>
                </div>
            )}
        </div>
    );
};

const Modal = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-[2.5rem] p-10 max-w-md w-full shadow-2xl relative">
                <button onClick={onClose} className="absolute top-8 right-8 text-slate-300 hover:text-slate-900 transition-colors"><X size={20} /></button>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-8">{title}</h3>
                {children}
            </motion.div>
        </div>
    );
};

const InputField = ({ label, value, onChange }) => (
    <div className="space-y-2">
        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">{label}</label>
        <input value={value} onChange={e => onChange(e.target.value)} className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-900 outline-none focus:bg-white focus:border-orange-500 transition-all text-xs" />
    </div>
);

const StatCard = ({ label, value, icon, color, trend }) => {
    const colors = { emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100', orange: 'bg-orange-50 text-orange-600 border-orange-100', rose: 'bg-rose-50 text-rose-600 border-rose-100', slate: 'bg-slate-50 text-slate-600 border-slate-100' };
    return (
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all group overflow-hidden relative">
            <div className={`absolute top-0 right-0 w-24 h-24 ${colors[color]} opacity-10 rounded-full -mr-12 -mt-12 transition-all group-hover:scale-150`} />
            <div className="flex items-start justify-between mb-6 relative">
                <div className={`p-4 rounded-2xl ${colors[color]} shadow-lg shadow-inner`}>{icon}</div>
                {trend && <div className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${colors[color]}`}>{trend}</div>}
            </div>
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</h4>
            <p className="text-3xl font-black text-slate-900 tracking-tighter">{value}</p>
        </div>
    );
};

const TabButton = ({ active, onClick, label, icon }) => (
    <button onClick={onClick} className={`flex items-center gap-3 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${active ? 'bg-white text-slate-900 shadow-lg shadow-slate-200/50' : 'text-slate-400 hover:text-slate-600'}`}>{icon} {label}</button>
);

export default PPTDashboard;
