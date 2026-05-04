import React, { useState, useEffect } from 'react';
import { 
    CheckCircle2, IndianRupee, Calendar, MessageSquare, 
    Loader2, ShieldCheck, AlertCircle, TrendingUp, User, ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const AccountUpdate = ({ scriptUrl }) => {
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [paymentData, setPaymentData] = useState(null);
    const [success, setSuccess] = useState(false);
    const [formData, setFormData] = useState({ paidAmount: '', paymentDate: new Date().toISOString().split('T')[0], remarks: '' });

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const paymentId = params.get('paymentId');
        if (paymentId) {
            fetchPaymentDetails(paymentId);
        } else {
            setLoading(false);
        }
    }, []);

    const fetchPaymentDetails = async (id) => {
        try {
            const response = await fetch(`${scriptUrl}?action=get_visiting_payments`);
            const allPayments = await response.json();
            const payment = allPayments.find(p => p.Payment_ID === id);
            if (payment) {
                setPaymentData(payment);
                setFormData({ ...formData, paidAmount: payment.Amount_To_Pay });
            }
        } catch (err) {
            console.error('Error fetching payment details:', err);
        }
        setLoading(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await fetch(scriptUrl, {
                method: 'POST',
                mode: 'no-cors',
                headers: { 'Content-Type': 'text/plain' },
                body: JSON.stringify({ 
                    action: 'update_payment', 
                    paymentId: paymentData.Payment_ID,
                    ...formData 
                })
            });
            setTimeout(() => {
                setSuccess(true);
                setSubmitting(false);
            }, 1500);
        } catch (e) {
            alert("Submission failed. Please try again.");
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0f172a] flex flex-col items-center justify-center p-10">
                <div className="relative">
                    <div className="w-24 h-24 border-4 border-emerald-500/10 rounded-full animate-spin border-t-emerald-500"></div>
                    <IndianRupee className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-emerald-500" size={32} />
                </div>
                <p className="mt-8 text-sm font-black uppercase tracking-[0.4em] text-emerald-500/50">Secure Authentication</p>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-2">Connecting to Ledger...</p>
            </div>
        );
    }

    if (!paymentData && !success) {
        return (
            <div className="min-h-screen bg-[#0f172a] flex flex-col items-center justify-center p-10 text-center">
                <div className="w-24 h-24 bg-rose-500/10 rounded-[2.5rem] flex items-center justify-center mb-8 border border-rose-500/20">
                    <AlertCircle className="text-rose-500" size={48} />
                </div>
                <h2 className="text-3xl font-black text-white uppercase tracking-tighter mb-3">Link <span className="text-rose-500">Invalid</span></h2>
                <p className="text-slate-400 text-sm max-w-md font-medium leading-relaxed">The payment reference could not be validated. It may have been settled or the link is malformed.</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center p-4 sm:p-10 font-sans selection:bg-emerald-500 selection:text-white">
            <AnimatePresence mode="wait">
                {!success ? (
                    <motion.div 
                        key="form"
                        initial={{ scale: 0.95, opacity: 0, y: 20 }} 
                        animate={{ scale: 1, opacity: 1, y: 0 }} 
                        exit={{ scale: 1.05, opacity: 0, y: -20 }}
                        className="w-full max-w-xl bg-[#0f172a] rounded-[4rem] border border-slate-800 shadow-[0_35px_100px_-15px_rgba(0,0,0,0.6)] overflow-hidden relative"
                    >
                        {/* Gradient Accents */}
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-1 bg-gradient-to-r from-transparent via-emerald-500 to-transparent shadow-[0_0_20px_rgba(16,185,129,0.5)]"></div>
                        
                        <div className="p-10 md:p-14 border-b border-slate-800 bg-gradient-to-b from-slate-800/20 to-transparent relative overflow-hidden">
                            <TrendingUp className="absolute -right-10 -bottom-10 text-emerald-500/5 rotate-12" size={250} />
                            <div className="relative z-10">
                                <div className="flex items-center gap-4 mb-8">
                                    <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-emerald-500/20"><ShieldCheck size={24} /></div>
                                    <div>
                                        <p className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.3em]">Account Clearance</p>
                                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{paymentData?.Payment_ID}</p>
                                    </div>
                                </div>
                                <h2 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tighter leading-[0.9] mb-4">Settle <br/><span className="text-emerald-500">Payment</span></h2>
                                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest opacity-60 italic">Please verify the transaction details below</p>
                            </div>
                        </div>

                        <div className="p-10 md:p-14 space-y-12">
                            {/* Detailed Info Card */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-1">
                                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2"><User size={12} /> Doctor Name</p>
                                    <p className="text-xl font-black text-white uppercase tracking-tight">{paymentData?.Doctor_Name}</p>
                                </div>
                                <div className="space-y-1 text-right">
                                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center justify-end gap-2"><IndianRupee size={12} /> Bill Amount</p>
                                    <p className="text-3xl font-black text-emerald-500 tracking-tighter">₹{paymentData?.Amount_To_Pay}</p>
                                </div>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-8">
                                <div className="space-y-4">
                                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] ml-2 flex items-center gap-3"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div> Amount Paid</label>
                                    <div className="relative group">
                                        <IndianRupee className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-emerald-500 transition-colors" size={20} />
                                        <input 
                                            required 
                                            type="number" 
                                            value={formData.paidAmount} 
                                            onChange={e => setFormData({...formData, paidAmount: e.target.value})} 
                                            className="w-full bg-slate-950/50 border-2 border-slate-800 rounded-3xl p-6 pl-16 text-white text-xl font-black focus:border-emerald-500/30 focus:bg-slate-950 transition-all outline-none" 
                                            placeholder="0" 
                                        />
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] ml-2 flex items-center gap-3"><Calendar size={18} className="text-slate-600" /> Transaction Date</label>
                                    <input 
                                        required 
                                        type="date" 
                                        value={formData.paymentDate} 
                                        onChange={e => setFormData({...formData, paymentDate: e.target.value})} 
                                        className="w-full bg-slate-950/50 border-2 border-slate-800 rounded-3xl p-6 text-white font-black focus:border-emerald-500/30 focus:bg-slate-950 transition-all outline-none uppercase text-sm" 
                                    />
                                </div>

                                <div className="space-y-4">
                                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] ml-2 flex items-center gap-3"><MessageSquare size={18} className="text-slate-600" /> Remarks / Ref No.</label>
                                    <textarea 
                                        value={formData.remarks} 
                                        onChange={e => setFormData({...formData, remarks: e.target.value})} 
                                        className="w-full bg-slate-950/50 border-2 border-slate-800 rounded-3xl p-6 text-white font-bold focus:border-emerald-500/30 focus:bg-slate-950 transition-all outline-none min-h-[120px] resize-none text-sm" 
                                        placeholder="Add transaction details or notes..." 
                                    />
                                </div>

                                <button 
                                    disabled={submitting} 
                                    type="submit" 
                                    className="w-full py-7 bg-emerald-600 text-white rounded-[2.5rem] font-black uppercase tracking-[0.3em] text-sm hover:bg-emerald-500 transition-all shadow-[0_20px_50px_-10px_rgba(16,185,129,0.4)] disabled:opacity-50 active:scale-[0.98] flex items-center justify-center gap-4 group"
                                >
                                    {submitting ? <Loader2 className="animate-spin" size={24} /> : <CheckCircle2 className="group-hover:scale-125 transition-transform" size={24} />}
                                    {submitting ? "Processing Transaction..." : "Complete Settlement"}
                                </button>
                            </form>
                        </div>
                        
                        <div className="p-10 bg-slate-950/50 text-center border-t border-slate-800">
                            <p className="text-[9px] font-black text-slate-600 uppercase tracking-[0.4em]">SBH Hospital • Advanced Accounting Protocol</p>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div 
                        key="success"
                        initial={{ scale: 0.8, opacity: 0 }} 
                        animate={{ scale: 1, opacity: 1 }} 
                        className="w-full max-w-lg bg-[#0f172a] rounded-[5rem] p-16 text-center border border-emerald-500/20 shadow-[0_50px_100px_rgba(0,0,0,0.8)] relative overflow-hidden"
                    >
                        {/* Success Particle Effect (Subtle) */}
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.1)_0%,transparent_70%)]"></div>
                        
                        <div className="relative z-10">
                            <motion.div 
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.2 }}
                                className="w-24 h-24 bg-emerald-500 rounded-[2.5rem] mx-auto flex items-center justify-center text-white mb-10 shadow-[0_20px_40px_rgba(16,185,129,0.3)]"
                            >
                                <CheckCircle2 size={48} />
                            </motion.div>
                            
                            <h2 className="text-5xl font-black text-white uppercase tracking-tighter mb-4">Payment <br/><span className="text-emerald-500">Settled</span></h2>
                            <p className="text-slate-400 text-sm font-medium mb-12 max-w-[280px] mx-auto leading-relaxed">Transaction recorded successfully. HR and Doctor have been notified of the clearance.</p>
                            
                            <div className="space-y-4 mb-10">
                                <div className="bg-slate-950/50 rounded-3xl p-8 border border-slate-800 flex flex-col items-center">
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Final Amount Settled</p>
                                    <p className="text-5xl font-black text-white tracking-tighter">₹{formData.paidAmount}</p>
                                </div>
                            </div>

                            <button 
                                onClick={() => window.close()}
                                className="inline-flex items-center gap-3 text-emerald-500 text-xs font-black uppercase tracking-[0.3em] hover:text-emerald-400 transition-all hover:gap-5"
                            >
                                Close Window <ArrowRight size={16} />
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AccountUpdate;
