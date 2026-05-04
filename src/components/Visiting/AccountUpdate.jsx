import React, { useState, useEffect } from 'react';
import { 
    CheckCircle2, DollarSign, Calendar, MessageSquare, 
    Loader2, ShieldCheck, AlertCircle, TrendingUp
} from 'lucide-react';
import { motion } from 'framer-motion';

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
            <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-10">
                <Loader2 className="animate-spin text-emerald-500 mb-4" size={40} />
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Verifying Payment Link...</p>
            </div>
        );
    }

    if (!paymentData && !success) {
        return (
            <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-10 text-center">
                <AlertCircle className="text-rose-500 mb-6" size={60} />
                <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-2">Invalid or Expired Link</h2>
                <p className="text-slate-400 text-sm max-w-md">The payment reference could not be found. Please contact the HR department if you believe this is an error.</p>
            </div>
        );
    }

    if (success) {
        return (
            <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-10 text-center">
                <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-emerald-500/10 p-10 rounded-[4rem] border border-emerald-500/20">
                    <CheckCircle2 className="text-emerald-500 mx-auto mb-6" size={80} />
                    <h2 className="text-3xl font-black text-white uppercase tracking-tight mb-2">Payment Confirmed</h2>
                    <p className="text-slate-400 text-sm mb-8">The record has been updated and HR has been notified.</p>
                    <div className="bg-slate-800/50 rounded-3xl p-6 text-left border border-slate-700">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Doctor</p>
                        <p className="text-white font-bold mb-4">{paymentData.Doctor_Name}</p>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Amount Paid</p>
                        <p className="text-emerald-400 font-black text-2xl">₹{formData.paidAmount}</p>
                    </div>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 sm:p-10">
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="w-full max-w-lg bg-slate-900 rounded-[3.5rem] border border-slate-800 shadow-2xl overflow-hidden">
                <div className="p-10 border-b border-slate-800 bg-gradient-to-br from-slate-900 to-slate-800 relative overflow-hidden">
                    <TrendingUp className="absolute -right-4 -bottom-4 text-emerald-500/10" size={150} />
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-6">
                            <span className="px-3 py-1 bg-emerald-600 text-white rounded-full text-[8px] font-black uppercase tracking-widest">Account Portal</span>
                        </div>
                        <h2 className="text-3xl font-black text-white uppercase tracking-tight leading-none mb-2">Confirm <span className="text-emerald-500">Payment</span></h2>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Update status for visiting consultant</p>
                    </div>
                </div>

                <div className="p-10 space-y-8">
                    {/* Summary Info */}
                    <div className="bg-slate-800/40 rounded-3xl p-6 border border-slate-800 flex justify-between items-center">
                        <div>
                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Consultant Name</p>
                            <p className="text-lg font-black text-white uppercase">{paymentData.Doctor_Name}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Expected Amount</p>
                            <p className="text-xl font-black text-emerald-500">₹{paymentData.Amount_To_Pay}</p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2 flex items-center gap-2"><DollarSign size={14} /> Actual Amount Paid (₹) *</label>
                            <input 
                                required 
                                type="number" 
                                value={formData.paidAmount} 
                                onChange={e => setFormData({...formData, paidAmount: e.target.value})} 
                                className="w-full bg-slate-800 border-2 border-slate-800 rounded-2xl p-5 text-white font-bold focus:border-emerald-500/30 outline-none" 
                                placeholder="0.00" 
                            />
                        </div>

                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2 flex items-center gap-2"><Calendar size={14} /> Date of Payment *</label>
                            <input 
                                required 
                                type="date" 
                                value={formData.paymentDate} 
                                onChange={e => setFormData({...formData, paymentDate: e.target.value})} 
                                className="w-full bg-slate-800 border-2 border-slate-800 rounded-2xl p-5 text-white font-bold focus:border-emerald-500/30 outline-none uppercase" 
                            />
                        </div>

                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2 flex items-center gap-2"><MessageSquare size={14} /> Remark / TXN Details</label>
                            <textarea 
                                value={formData.remarks} 
                                onChange={e => setFormData({...formData, remarks: e.target.value})} 
                                className="w-full bg-slate-800 border-2 border-slate-800 rounded-2xl p-5 text-white font-bold focus:border-emerald-500/30 outline-none min-h-[100px]" 
                                placeholder="Optional remarks or transaction ID" 
                            />
                        </div>

                        <button 
                            disabled={submitting} 
                            type="submit" 
                            className="w-full py-5 bg-emerald-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-emerald-500 transition-all shadow-xl shadow-emerald-500/20 disabled:opacity-50 flex items-center justify-center gap-3"
                        >
                            {submitting ? <Loader2 className="animate-spin" size={16} /> : <ShieldCheck size={18} />}
                            {submitting ? "Updating Cloud..." : "Confirm & Notify HR"}
                        </button>
                    </form>
                </div>
                
                <div className="p-8 bg-slate-800/20 text-center">
                    <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest">© 2026 SBH Hospital Management System</p>
                </div>
            </motion.div>
        </div>
    );
};

export default AccountUpdate;
