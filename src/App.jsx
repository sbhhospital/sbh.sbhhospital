import React, { useState, useEffect } from 'react';
import LoginPanel from './components/LoginPanel';
import SheetDashboard from './components/SheetDashboard';
import Footer from './components/Footer';
import { Download, FileText, Hospital, Lock, ShieldAlert, KeyRound, Loader2 } from 'lucide-react';

const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycby4RzOprfy_BYDY2SwFXgKV7RhnMuPXvT4A7sbgREj2aTBxhE_qtf5UNxtMYTarwTfN/exec';

function App() {
  const [user, setUser] = useState(null);
  const [isPublicMode, setIsPublicMode] = useState(false);
  
  // Public Viewer verification state
  const [reportId, setReportId] = useState(null);
  const [matchingRecord, setMatchingRecord] = useState(null);
  const [isLoadingRecord, setIsLoadingRecord] = useState(false);
  const [inputPhone, setInputPhone] = useState('');
  const [isVerified, setIsVerified] = useState(false);
  const [verificationError, setVerificationError] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const type = params.get('type') || params.get('mode');
    const id = params.get('id');
    
    if (id) {
      setReportId(id);
      fetchRecord(id);
    }

    if (type === 'survey' || type === 'smile_award' || type === 'smile' || type === 'lasik' || type === 'visiting_update' || type === 'register' || type === 'ppt_submit') {
      setIsPublicMode(type === 'smile' ? 'smile_award' : type); 
    }

    const savedUser = localStorage.getItem('auth_user');
    if (savedUser) {
      setUser(savedUser);
    }
  }, []);

  const fetchRecord = async (id) => {
    setIsLoadingRecord(true);
    try {
      const res = await fetch(`${SCRIPT_URL}?action=get_history`);
      const data = await res.json();
      if (Array.isArray(data)) {
        // Find a record where PDF_Link contains the id
        const record = data.find(r => r.PDF_Link && r.PDF_Link.includes(id));
        if (record) {
          setMatchingRecord(record);
        } else {
          setVerificationError('Invalid or expired report link.');
        }
      }
    } catch (err) {
      console.error(err);
      setVerificationError('Error connecting to verification server.');
    } finally {
      setIsLoadingRecord(false);
    }
  };

  const handleVerify = (e) => {
    e.preventDefault();
    setVerificationError('');
    if (!matchingRecord) {
      setVerificationError('No matching report found.');
      return;
    }

    let cleanInput = inputPhone.trim();
    if (cleanInput.length === 10) {
      cleanInput = '91' + cleanInput;
    }

    let recordMobile = String(matchingRecord.Mobile_No).trim();
    if (recordMobile.length === 10) {
      recordMobile = '91' + recordMobile;
    }

    if (cleanInput === recordMobile) {
      setIsVerified(true);
    } else {
      setVerificationError('Verification failed. Entered mobile number does not match our records.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('auth_user');
    setUser(null);
  };

  // Render Public Report Viewer Page with Security Check
  if (reportId) {
    const pdfUrl = `/api/view-pdf?id=${reportId}`;

    if (!isVerified) {
      return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 font-sans text-slate-800">
          <div className="w-full max-w-md bg-white border border-slate-100 rounded-[2rem] p-8 shadow-2xl flex flex-col items-center text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-orange-500 to-amber-500" />
            
            <div className="w-16 h-16 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-600 mb-6 shadow-inner mt-2">
              <KeyRound size={28} className="animate-pulse" />
            </div>

            <h2 className="text-sm font-black uppercase tracking-wider text-slate-800">Verify Your Identity</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Lab Report Access Gateway</p>

            {isLoadingRecord ? (
              <div className="my-10 flex flex-col items-center justify-center text-slate-400">
                <Loader2 size={24} className="animate-spin text-orange-600 mb-2" />
                <p className="text-[9px] font-black uppercase tracking-widest">Securing Connection...</p>
              </div>
            ) : (
              <form onSubmit={handleVerify} className="w-full mt-6 space-y-4">
                <div className="text-left bg-slate-50 border border-slate-100/50 p-4.5 rounded-2xl">
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Reference MRD</span>
                  <span className="text-xs font-black text-slate-800 mt-1 block">
                    {matchingRecord ? matchingRecord.MRD_No : 'Loading...'}
                  </span>
                </div>

                <div className="space-y-1.5 text-left">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Registered Mobile Number</label>
                  <input 
                    type="number"
                    required
                    value={inputPhone}
                    onChange={(e) => setInputPhone(e.target.value)}
                    placeholder="Enter 10 digit registered mobile number"
                    className="w-full bg-slate-50 border-none rounded-2xl px-5 py-3.5 text-xs font-bold text-slate-700 outline-none focus:bg-white focus:ring-4 focus:ring-orange-500/5 transition-all placeholder:text-slate-400"
                  />
                </div>

                {verificationError && (
                  <div className="p-3.5 bg-rose-50 border border-rose-100 rounded-xl text-[9px] font-black uppercase tracking-wider text-rose-600 flex items-start gap-2 text-left leading-relaxed">
                    <ShieldAlert size={14} className="shrink-0 text-rose-500" />
                    <span>{verificationError}</span>
                  </div>
                )}

                <button 
                  type="submit"
                  disabled={!matchingRecord}
                  className="w-full py-4 bg-orange-600 hover:bg-orange-500 disabled:bg-slate-100 text-white disabled:text-slate-400 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-[0.98] shadow-lg shadow-orange-600/10 flex items-center justify-center gap-2"
                >
                  <Lock size={12} /> Verify & Access Report
                </button>
              </form>
            )}
            
            <p className="text-[8px] font-bold text-slate-400 mt-6 uppercase tracking-wider">
              Protected by SBH Hospital Information Security
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
        <header className="h-16 bg-white border-b border-slate-100 px-6 flex items-center justify-between shadow-sm shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-600 rounded-xl flex items-center justify-center text-white shadow-md">
              <Hospital className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xs font-black uppercase tracking-wider text-slate-800">
                {matchingRecord?.Patient_Name || 'Patient Report'}
              </h1>
              <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                MRD: {matchingRecord?.MRD_No || 'N/A'} • Online Report Viewer
              </p>
            </div>
          </div>
          <a
            href={pdfUrl}
            download
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-orange-600 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all shadow-md"
          >
            <Download size={12} /> Download PDF
          </a>
        </header>
        <main className="flex-1 p-4 bg-slate-100 flex items-stretch">
          <div className="flex-1 bg-white rounded-2xl shadow-inner border border-slate-200/50 overflow-hidden relative">
            <iframe
              src={`https://docs.google.com/viewer?url=${encodeURIComponent(window.location.origin + pdfUrl)}&embedded=true`}
              className="w-full h-full border-none"
              title="Patient Lab Report"
            />
          </div>
        </main>
      </div>
    );
  }

  if (isPublicMode) {
    return (
      <div className="min-h-screen bg-[#F8FAFC]">
        <SheetDashboard isPublic={true} publicType={isPublicMode} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] pb-10">
      {!user ? (
        <LoginPanel onLogin={setUser} />
      ) : (
        <SheetDashboard user={user} onLogout={handleLogout} />
      )}
      <Footer />
    </div>
  );
}

export default App;
