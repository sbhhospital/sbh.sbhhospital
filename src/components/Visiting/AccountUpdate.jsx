import React, { useState, useEffect } from 'react';
import { 
    CheckCircle2, IndianRupee, Calendar, MessageSquare, 
    Loader2, ShieldCheck, AlertCircle, TrendingUp, User, ArrowRight,
    Award, Sparkles, Send, CheckCircle, Clock
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
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-10">
                <div className="relative">
                    <div className="w-20 h-20 border-4 border-emerald-100 rounded-full animate-spin border-t-emerald-600"></div>
                    <IndianRupee className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-emerald-600" size={28} />
                </div>
                <p className="mt-8 text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Verifying Ledger Access</p>
            </div>
        );
    }

    if (!paymentData && !success) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-10 text-center">
                <div className="w-24 h-24 bg-white rounded-[2.5rem] flex items-center justify-center mb-8 border border-slate-200 shadow-xl shadow-slate-100">
                    <AlertCircle className="text-rose-500" size={40} />
                </div>
                <h2 className="text-3xl font-black text-slate-800 uppercase tracking-tighter mb-3">Link <span className="text-rose-500">Invalid</span></h2>
                <p className="text-slate-400 text-[10px] max-w-xs font-black uppercase tracking-widest leading-relaxed">The payment reference could not be validated or has already been settled.</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-4 sm:p-10 font-sans selection:bg-emerald-500 selection:text-white">
            <AnimatePresence mode="wait">
                {!success ? (
                    <motion.div 
                        key="form"
                        initial={{ scale: 0.95, opacity: 0, y: 20 }} 
                        animate={{ scale: 1, opacity: 1, y: 0 }} 
                        exit={{ scale: 1.05, opacity: 0, y: -20 }}
                        className="w-full max-w-xl bg-white rounded-[3.5rem] border border-slate-100 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.06)] overflow-hidden relative"
                    >
                        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-50/50 rounded-bl-full -mr-20 -mt-20 z-0" />
                        
                        <div className="p-10 md:p-14 border-b border-slate-50 bg-white relative z-10">
                            <div className="flex items-center gap-4 mb-10">
                                <div className="px-4 py-1.5 bg-emerald-500 text-white rounded-full text-[9px] font-black uppercase tracking-[0.3em] shadow-lg shadow-emerald-100 flex items-center gap-2">
                                    <ShieldCheck size={14} /> Account Clearance
                                </div>
                                <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{paymentData?.Payment_ID}</span>
                            </div>
                            
                            <h2 className="text-4xl md:text-5xl font-black text-slate-800 uppercase tracking-tighter leading-none mb-4">
                                Confirm <span className="text-emerald-600 underline decoration-orange-400 underline-offset-8">Settlement</span>
                            </h2>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] italic">Validate consultant payment for ledger closing</p>
                        </div>

                        <div className="p-10 md:p-14 space-y-12 relative z-10">
                            {/* Summary Card */}
                            <div className="bg-slate-50 rounded-[2rem] p-8 border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-6">
                                <div className="space-y-2">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2"><User size={12} className="text-emerald-500" /> Consultant</p>
                                    <p className="text-xl font-black text-slate-800 uppercase tracking-tight">{paymentData?.Doctor_Name}</p>
                                    <div className="flex items-center gap-2">
                                        <Clock size={12} className="text-orange-400" />
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Raised: {paymentData?.HR_Entry_Date?.split(' ')[0]}</span>
                                    </div>
                                </div>
                                <div className="text-left md:text-right">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Expected Amount</p>
                                    <p className="text-4xl font-black text-slate-900 tracking-tighter">₹{paymentData?.Amount_To_Pay}</p>
                                </div>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-10">
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">1. Exact Amount Paid (₹)</label>
                                    <div className="relative group">
                                        <IndianRupee className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-500 transition-colors" size={20} />
                                        <input 
                                            required 
                                            type="number" 
                                            value={formData.paidAmount} 
                                            onChange={e => setFormData({...formData, paidAmount: e.target.value})} 
                                            className="w-full bg-slate-50 border-2 border-slate-50 rounded-3xl p-6 pl-16 text-slate-800 text-2xl font-black focus:border-emerald-500/20 focus:bg-white transition-all outline-none shadow-inner" 
                                            placeholder="0" 
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">2. Payment Date</label>
                                        <input 
                                            required 
                                            type="date" 
                                            value={formData.paymentDate} 
                                            onChange={e => setFormData({...formData, paymentDate: e.target.value})} 
                                            className="w-full bg-slate-50 border-2 border-slate-50 rounded-3xl p-5 text-slate-800 font-black focus:border-emerald-500/20 focus:bg-white transition-all outline-none uppercase text-xs" 
                                        />
                                    </div>
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">3. Reference ID</label>
                                        <input 
                                            value={formData.remarks} 
                                            onChange={e => setFormData({...formData, remarks: e.target.value})} 
                                            className="w-full bg-slate-50 border-2 border-slate-50 rounded-3xl p-5 text-slate-800 font-black focus:border-emerald-500/20 focus:bg-white transition-all outline-none text-xs" 
                                            placeholder="UTR / Transaction No." 
                                        />
                                    </div>
                                </div>

                                <button 
                                    disabled={submitting} 
                                    type="submit" 
                                    className="w-full py-7 bg-slate-900 text-white rounded-[2.5rem] font-black uppercase tracking-[0.3em] text-[11px] hover:bg-emerald-600 transition-all shadow-2xl shadow-slate-200 disabled:opacity-50 active:scale-[0.98] flex items-center justify-center gap-4 group"
                                >
                                    {submitting ? <Loader2 className="animate-spin" size={20} /> : <CheckCircle2 className="group-hover:rotate-12 transition-transform" size={20} />}
                                    {submitting ? "Closing Ledger..." : "Authorize Settlement"}
                                </button>
                            </form>
                        </div>
                        
                        <div className="p-8 bg-slate-50/50 text-center border-t border-slate-50 flex items-center justify-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.4em]">SBH Financial Protocol Suite v4.0</p>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div 
                        key="success"
                        initial={{ scale: 0.9, opacity: 0 }} 
                        animate={{ scale: 1, opacity: 1 }} 
                        className="w-full max-w-xl bg-white rounded-[4rem] p-16 text-center border border-emerald-50 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.1)] relative overflow-hidden"
                    >
                        <div className="relative z-10">
                            <motion.div 
                                initial={{ y: 20, opacity: 0, rotate: -15 }}
                                animate={{ y: 0, opacity: 1, rotate: 5 }}
                                transition={{ delay: 0.2 }}
                                className="w-28 h-28 bg-gradient-to-br from-emerald-500 to-teal-400 rounded-[2.5rem] mx-auto flex items-center justify-center text-white mb-10 shadow-2xl shadow-emerald-200"
                            >
                                <Award size={56} />
                            </motion.div>
                            
                            <h2 className="text-4xl md:text-5xl font-black text-slate-800 uppercase tracking-tighter leading-none mb-4">
                                Ledger <span className="text-emerald-600">Updated!</span>
                            </h2>
                            <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-12 max-w-[300px] mx-auto leading-relaxed">
                                Payment verified and archived. <br/> The consultant and HR desk have been notified of the clearance.
                            </p>
                            
                            <div className="bg-slate-50 rounded-[3rem] p-8 border border-slate-100 mb-10 flex flex-col items-center">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] mb-2">Total Settled Amount</p>
                                <p className="text-5xl font-black text-slate-900 tracking-tighter">₹{formData.paidAmount}</p>
                                <div className="mt-4 px-4 py-1.5 bg-white rounded-full border border-slate-200 text-[9px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-2">
                                    <Sparkles size={12} /> Confirmed by Accounts
                                </div>
                            </div>

                            <button 
                                onClick={() => window.close()}
                                className="px-10 py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-xl shadow-slate-200 flex items-center gap-3 mx-auto"
                            >
                                Close Dashboard <ArrowRight size={16} />
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AccountUpdate;
