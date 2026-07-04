import React, { useState, useEffect } from 'react';
import LoginPanel from './components/LoginPanel';
import SheetDashboard from './components/SheetDashboard';
import { Download, FileText, Hospital } from 'lucide-react';

function App() {
  const [user, setUser] = useState(null);
  const [isPublicMode, setIsPublicMode] = useState(false);
  const [reportId, setReportId] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const type = params.get('type') || params.get('mode');
    const id = params.get('id');
    
    if (id) {
      setReportId(id);
    }

    if (type === 'survey' || type === 'smile_award' || type === 'smile' || type === 'lasik' || type === 'visiting_update' || type === 'register' || type === 'ppt_submit') {
      setIsPublicMode(type === 'smile' ? 'smile_award' : type); 
    }

    const savedUser = localStorage.getItem('auth_user');
    if (savedUser) {
      setUser(savedUser);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('auth_user');
    setUser(null);
  };

  // Render Public Report Viewer Page
  if (reportId) {
    const pdfUrl = `/api/view-pdf?id=${reportId}`;
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
        <header className="h-16 bg-white border-b border-slate-100 px-6 flex items-center justify-between shadow-sm shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-600 rounded-xl flex items-center justify-center text-white shadow-md">
              <Hospital className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xs font-black uppercase tracking-wider text-slate-800">SBH Group of Hospitals</h1>
              <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Online Report Viewer</p>
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
    <div className="min-h-screen bg-[#050505]">
      {!user ? (
        <LoginPanel onLogin={setUser} />
      ) : (
        <SheetDashboard user={user} onLogout={handleLogout} />
      )}
    </div>
  );
}

export default App;
