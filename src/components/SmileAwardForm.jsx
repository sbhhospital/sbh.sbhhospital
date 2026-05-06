import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Heart, Star, Send, User, Briefcase, MessageCircle,
    CheckCircle2, Loader2, Award, ChevronRight, Search, Plus,
    Sparkles, HandHeart, Trophy, AlertCircle, ShieldCheck
} from 'lucide-react';

const SMILE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyHNF4Yzqvh6Copcl2aL1XyWZEyBSeoaxXz277xFbkPOqPOB-Fy7tNzDpMmFimHf2kGyg/exec';

const SmileAwardForm = ({ onSubmissionSuccess }) => {
    const [formData, setFormData] = useState({
        employeeId: '',
        employeeName: '',
        department: '',
        role: '',
        remarks: '',
        voterId: '',
        voterName: ''
    });
    
    const [staffList, setStaffList] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [loadingStaff, setLoadingStaff] = useState(true);

    useEffect(() => {
        const fetchStaff = async () => {
            try {
                const response = await fetch(`${SMILE_SCRIPT_URL}?action=get_staff`);
                const data = await response.json();
                setStaffList(Array.isArray(data) ? data : []);
            } catch (err) { console.error('Staff fetch error:', err); }
            finally { setLoadingStaff(false); }
        };
        fetchStaff();
    }, []);

    const handleSelectNominee = (staff) => {
        setFormData(prev => ({ 
            ...prev, 
            employeeId: staff.Staff_ID, 
            employeeName: staff.Name, 
            department: staff.Department || 'General',
            role: staff.Role || 'Staff'
        }));
    };

    const handleSelectVoter = (staff) => {
        setFormData(prev => ({ 
            ...prev, 
            voterId: staff.Staff_ID, 
            voterName: staff.Name 
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.employeeId || !formData.voterId || !formData.remarks) {
            alert('Please select an existing staff member for both fields and provide remarks.');
            return;
        }

        setIsSubmitting(true);
        try {
            await fetch(SMILE_SCRIPT_URL, {
                method: 'POST',
                mode: 'no-cors',
                headers: { 'Content-Type': 'text/plain' },
                body: JSON.stringify({ action: 'save_vote', ...formData })
            });
            setSubmitted(true);
            if (onSubmissionSuccess) onSubmissionSuccess();
        } catch (error) {
            alert('Something went wrong. Please try again.');
        } finally { setIsSubmitting(false); }
    };

    if (submitted) {
        return (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center p-12 bg-white rounded-[3rem] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] text-center max-w-lg mx-auto border border-emerald-50">
                <div className="w-24 h-24 bg-gradient-to-br from-emerald-500 to-teal-400 rounded-3xl flex items-center justify-center text-white mb-8 shadow-xl shadow-emerald-100 rotate-6"><Trophy size={48} /></div>
                <h2 className="text-4xl font-black text-slate-800 uppercase tracking-tighter mb-4">Nomination <span className="text-emerald-600">Saved!</span></h2>
                <p className="text-slate-400 font-bold mb-10 uppercase text-[10px] tracking-[0.2em] leading-relaxed">Thank you for recognizing excellence. <br /> Your vote has been officially logged.</p>
                <button onClick={() => { setSubmitted(false); setFormData({ employeeId: '', employeeName: '', department: '', role: '', remarks: '', voterId: '', voterName: '' }); }} className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-emerald-600 transition-all shadow-xl shadow-slate-200">Submit New Nomination</button>
            </motion.div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto px-4 py-4 mb-20">
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-[3.5rem] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.08)] p-8 md:p-14 border border-slate-50 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-50/50 rounded-bl-full -mr-20 -mt-20 z-0 animate-pulse" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-orange-50/50 rounded-tr-full -ml-16 -mb-16 z-0" />
                
                <div className="relative z-10 mb-14 text-center">
                    <div className="inline-flex items-center gap-3 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-full text-[9px] font-black uppercase tracking-[0.3em] mb-6 shadow-lg shadow-emerald-100"><Award size={16} /> Official Recognition Hub</div>
                    <h2 className="text-4xl md:text-5xl font-black text-slate-800 tracking-tighter uppercase mb-4 leading-none">The Smile <span className="bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent underline decoration-orange-400 underline-offset-8">Award</span></h2>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Select existing staff members to nominate</p>
                </div>

                <form onSubmit={handleSubmit} className="relative z-10 space-y-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <SearchSelect 
                            label="Your Name (Voter)" 
                            placeholder="Search your name..."
                            icon={<HandHeart size={18} className="text-orange-500" />} 
                            options={staffList} 
                            value={formData.voterName}
                            onSelect={handleSelectVoter}
                            required
                        />

                        <SearchSelect 
                            label="Nominee (The Star)" 
                            placeholder="Search staff to nominate..."
                            icon={<Sparkles size={18} className="text-emerald-500" />} 
                            options={staffList} 
                            value={formData.employeeName}
                            onSelect={handleSelectNominee}
                            required
                        />
                    </div>

                    <div className="space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <DisplayField 
                                label="Department" 
                                icon={<Briefcase size={18} className="text-slate-400" />} 
                                value={formData.department}
                                placeholder="Select a nominee first"
                            />
                            <DisplayField 
                                label="Current Role / Post" 
                                icon={<ShieldCheck size={18} className="text-slate-400" />} 
                                value={formData.role}
                                placeholder="Select a nominee first"
                            />
                        </div>

                        <SmileInput 
                            label="Reason for Recognition" 
                            placeholder="Describe how they embody the SBH spirit of service..." 
                            icon={<MessageCircle size={18} className="text-slate-400" />} 
                            isTextArea
                            value={formData.remarks}
                            onChange={v => setFormData({...formData, remarks: v})}
                            required
                        />
                    </div>

                    <div className="pt-6">
                        <motion.button 
                            whileHover={{ scale: 1.02, y: -2 }}
                            whileTap={{ scale: 0.98 }}
                            disabled={isSubmitting || loadingStaff || !formData.employeeId || !formData.voterId}
                            className="w-full bg-slate-950 text-white py-6 rounded-[2rem] font-black uppercase tracking-[0.4em] text-xs shadow-2xl shadow-slate-300 flex items-center justify-center gap-4 hover:bg-emerald-600 transition-all disabled:opacity-50"
                        >
                            {isSubmitting ? <><Loader2 className="animate-spin" size={20} /> Processing...</> : <><Send size={20} /> Submit Recognition</>}
                        </motion.button>
                        
                        {!formData.employeeId && !loadingStaff && (
                            <div className="mt-8 p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-center gap-3">
                                <AlertCircle size={14} className="text-slate-400" />
                                <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest">
                                    Only existing staff from the roster can be nominated
                                </p>
                            </div>
                        )}
                    </div>
                </form>
            </motion.div>
        </div>
    );
};

const SearchSelect = ({ label, icon, options, value, onSelect, placeholder, required }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');

    const filteredOptions = useMemo(() => {
        if (!query) return options.slice(0, 5);
        return options.filter(opt => 
            opt.Name.toLowerCase().includes(query.toLowerCase()) || 
            (opt.Department && opt.Department.toLowerCase().includes(query.toLowerCase()))
        ).slice(0, 10);
    }, [options, query]);

    return (
        <div className="space-y-3 relative">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-2 flex items-center gap-2">
                {icon} {label} {required && <span className="text-orange-500">*</span>}
            </label>
            <div className="relative group">
                <input 
                    type="text"
                    className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl py-5 px-6 pr-12 text-slate-800 font-black text-sm outline-none focus:bg-white focus:border-emerald-500/20 focus:ring-8 focus:ring-emerald-500/5 transition-all"
                    placeholder={placeholder}
                    value={isOpen ? query : value}
                    onChange={e => { setQuery(e.target.value); setIsOpen(true); }}
                    onFocus={() => setIsOpen(true)}
                    onBlur={() => setTimeout(() => setIsOpen(false), 200)}
                    required={required}
                />
                <div className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-500 transition-colors">
                    <Search size={18} />
                </div>
            </div>
            
            <AnimatePresence>
                {isOpen && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="absolute z-20 top-full left-0 right-0 mt-3 bg-white border border-slate-100 rounded-3xl shadow-[0_30px_60px_-15px_rgba(0,0,0,0.15)] max-h-56 overflow-hidden overflow-y-auto custom-scrollbar">
                        {filteredOptions.length > 0 ? filteredOptions.map(opt => (
                            <button key={opt.Staff_ID} type="button" onClick={() => { onSelect(opt); setQuery(''); setIsOpen(false); }} className="w-full text-left px-7 py-4 hover:bg-slate-50 transition-all border-b border-slate-50 last:border-0 group">
                                <p className="text-xs font-black text-slate-800 uppercase tracking-widest group-hover:text-emerald-600">{opt.Name}</p>
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">{opt.Department} • {opt.Role || 'Staff'}</p>
                            </button>
                        )) : (
                            <div className="px-7 py-6 text-center">
                                <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">No matching staff found</p>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

const DisplayField = ({ label, icon, value, placeholder }) => (
    <div className="space-y-3">
        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-2 flex items-center gap-2">
            {icon} {label}
        </label>
        <div className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-5 px-6 h-16 flex items-center">
            <span className={`text-sm font-black uppercase tracking-widest ${value ? 'text-slate-800' : 'text-slate-300'}`}>
                {value || placeholder}
            </span>
        </div>
    </div>
);

const SmileInput = ({ label, icon, isTextArea, value, onChange, placeholder, required }) => (
    <div className="space-y-3">
        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-2 flex items-center gap-2">
            {icon} {label} {required && <span className="text-orange-500">*</span>}
        </label>
        <textarea className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl py-5 px-6 text-slate-800 font-bold text-sm outline-none transition-all h-36 resize-none focus:bg-white focus:border-emerald-500/20 focus:ring-8 focus:ring-emerald-500/5" placeholder={placeholder} value={value} onChange={e => onChange(e.target.value)} required={required} />
    </div>
);

export default SmileAwardForm;
