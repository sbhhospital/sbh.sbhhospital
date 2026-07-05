import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Search, MessageSquare, Send, Paperclip, FileText, CheckCheck, 
    AlertCircle, Plus, RefreshCw, X, ShieldCheck, Download, Eye, Smartphone, ArrowLeft, Loader2,
    Activity, FlaskConical, Dna
} from 'lucide-react';
import { PDFDocument } from 'pdf-lib';

const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycby4RzOprfy_BYDY2SwFXgKV7RhnMuPXvT4A7sbgREj2aTBxhE_qtf5UNxtMYTarwTfN/exec';

const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            const base64 = reader.result.split(',')[1];
            resolve(base64);
        };
        reader.onerror = (error) => reject(error);
    });
};

const uint8ToBase64 = (uint8Array) => {
    let binary = '';
    const len = uint8Array.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(uint8Array[i]);
    }
    return window.btoa(binary);
};

const mergePDFs = async (files) => {
    const mergedPdf = await PDFDocument.create();
    for (const file of files) {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await PDFDocument.load(arrayBuffer);
        const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        copiedPages.forEach((page) => mergedPdf.addPage(page));
    }
    const mergedPdfBytes = await mergedPdf.save();
    return mergedPdfBytes;
};

const cleanDate = (dateVal, timestampVal) => {
    let target = dateVal || timestampVal || '';
    if (!target) return 'Unknown Date';
    
    const datePart = String(target).split(' ')[0];
    
    const ymd = datePart.split('-');
    if (ymd.length === 3) {
        if (ymd[0].length === 4) {
            return `${ymd[2]}-${ymd[1]}-${ymd[0]}`;
        }
        return datePart;
    }
    
    const dmy = datePart.split('/');
    if (dmy.length === 3) {
        return dmy.join('-');
    }
    
    return datePart;
};

const cleanTime = (timestampVal) => {
    if (!timestampVal) return '';
    try {
        const isoStr = String(timestampVal).replace(' ', 'T');
        const dateObj = new Date(isoStr);
        if (isNaN(dateObj.getTime())) {
            const parts = String(timestampVal).split(' ');
            const timePart = parts.length >= 2 ? parts[1] : String(timestampVal);
            const timeParts = timePart.split(':');
            if (timeParts.length >= 2) {
                let h = parseInt(timeParts[0]);
                const m = timeParts[1];
                const ampm = h >= 12 ? 'PM' : 'AM';
                h = h % 12;
                h = h ? h : 12;
                return `${String(h).padStart(2, '0')}:${m} ${ampm}`;
            }
            return timePart;
        }
        let hours = dateObj.getHours();
        const minutes = String(dateObj.getMinutes()).padStart(2, '0');
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12;
        return `${String(hours).padStart(2, '0')}:${minutes} ${ampm}`;
    } catch (e) {
        return '';
    }
};

const formatDateTime = (timestampVal) => {
    if (!timestampVal) return '';
    try {
        const isoStr = String(timestampVal).replace(' ', 'T');
        const dateObj = new Date(isoStr);
        if (isNaN(dateObj.getTime())) {
            return String(timestampVal);
        }
        const day = String(dateObj.getDate()).padStart(2, '0');
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const year = dateObj.getFullYear();
        
        let hours = dateObj.getHours();
        const minutes = String(dateObj.getMinutes()).padStart(2, '0');
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12;
        
        return `${day}-${month}-${year} ${String(hours).padStart(2, '0')}:${minutes}${ampm}`;
    } catch (e) {
        return String(timestampVal);
    }
};

export default function LabReportManager() {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    
    // Active chat state
    const [activeMobile, setActiveMobile] = useState('');
    const [isNewChat, setIsNewChat] = useState(false);
    const [showChatWindowOnMobile, setShowChatWindowOnMobile] = useState(false);
    
    // Send form state
    const [formMobile, setFormMobile] = useState('');
    const [formName, setFormName] = useState('');
    const [formMrd, setFormMrd] = useState('');
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [fileError, setFileError] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [sendChannel, setSendChannel] = useState(null); // 'WhatsApp' or 'SMS'
    
    // Background jobs queue state
    const [sendingJobs, setSendingJobs] = useState([]);

    // PDF Preview Modal State
    const [previewUrl, setPreviewUrl] = useState(null);
    
    // Dynamic lab loading status text state
    const [loadingMessage, setLoadingMessage] = useState('Connecting to secure gateway...');

    useEffect(() => {
        if (!loading) return;
        const messages = [
            'Syncing pathology databases...',
            'Connecting to secure lab gateway...',
            'Parsing medical MRD records...',
            'Updating WhatsApp/SMS transmission feeds...',
            'Loading digital verification signatures...',
            'Securing patient data channels...'
        ];
        let idx = 0;
        const interval = setInterval(() => {
            idx = (idx + 1) % messages.length;
            setLoadingMessage(messages[idx]);
        }, 1200);
        return () => clearInterval(interval);
    }, [loading]);

    // Fetch history
    const fetchHistory = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${SCRIPT_URL}?action=get_history`);
            const data = await res.json();
            if (Array.isArray(data)) {
                setHistory(data);
            }
        } catch (err) {
            console.error('Failed to load history:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHistory();
    }, []);

    // Combine history and background sending jobs for live updates
    const combinedHistory = useMemo(() => {
        return [...history, ...sendingJobs];
    }, [history, sendingJobs]);

    // Group logs by mobile number
    const chatsList = useMemo(() => {
        const groups = {};
        combinedHistory.forEach(log => {
            const mob = log.Mobile_No || 'Unknown';
            if (!groups[mob]) {
                groups[mob] = [];
            }
            groups[mob].push(log);
        });

        return Object.entries(groups).map(([mobile, logs]) => {
            const sortedLogs = [...logs].sort((a, b) => new Date(a.Timestamp) - new Date(b.Timestamp));
            const lastLog = sortedLogs[sortedLogs.length - 1];
            return {
                mobile,
                logs: sortedLogs,
                lastLog
            };
        }).sort((a, b) => new Date(b.lastLog.Timestamp) - new Date(a.lastLog.Timestamp));
    }, [combinedHistory]);

    // Filter chats
    const filteredChats = useMemo(() => {
        if (!searchQuery.trim()) return chatsList;
        const q = searchQuery.toLowerCase().trim();
        return chatsList.filter(chat => 
            chat.mobile.includes(q) || 
            chat.logs.some(log => 
                String(log.MRD_No || '').toLowerCase().includes(q) ||
                String(log.Patient_Name || '').toLowerCase().includes(q)
            )
        );
    }, [chatsList, searchQuery]);

    // Limit displayed chats to top 100 for smooth rendering performance
    const displayedChats = useMemo(() => {
        return filteredChats.slice(0, 100);
    }, [filteredChats]);

    // Logs for active chat
    const activeChatLogs = useMemo(() => {
        if (!activeMobile) return [];
        const chat = chatsList.find(c => c.mobile === activeMobile);
        return chat ? chat.logs : [];
    }, [chatsList, activeMobile]);

    // Group logs by date
    const groupedLogs = useMemo(() => {
        const groups = {};
        activeChatLogs.forEach(log => {
            const dateKey = cleanDate(log.Date, log.Timestamp);
            if (!groups[dateKey]) {
                groups[dateKey] = [];
            }
            groups[dateKey].push(log);
        });
        return Object.entries(groups);
    }, [activeChatLogs]);

    // Handle selecting a chat
    const handleSelectChat = (mobile) => {
        setActiveMobile(mobile);
        setIsNewChat(false);
        
        let displayMobile = mobile;
        if (displayMobile.startsWith('91')) {
            displayMobile = displayMobile.substring(2);
        }
        setFormMobile(displayMobile);

        const chat = chatsList.find(c => c.mobile === mobile);
        if (chat && chat.lastLog) {
            setFormMrd(chat.lastLog.MRD_No || '');
            setFormName(chat.lastLog.Patient_Name || '');
        } else {
            setFormMrd('');
            setFormName('');
        }
        setSelectedFiles([]);
        setFileError('');
        setShowChatWindowOnMobile(true);
    };

    // Prepare for new chat
    const handleNewChatClick = () => {
        setActiveMobile('');
        setIsNewChat(true);
        setFormMobile('');
        setFormName('');
        setFormMrd('');
        setSelectedFiles([]);
        setFileError('');
        setShowChatWindowOnMobile(true);
    };

    // File check
    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);
        setFileError('');
        if (files.length === 0) return;

        const validFiles = [];
        for (const file of files) {
            if (file.type !== 'application/pdf') {
                setFileError('Only PDF files are supported.');
                return;
            }

            if (file.size > 5 * 1024 * 1024) {
                setFileError('One of the files exceeds the 5MB size limit.');
                return;
            }
            validFiles.push(file);
        }

        setSelectedFiles(prev => [...prev, ...validFiles]);
    };

    // Send logic (accepts channel param: 'WhatsApp' or 'SMS')
    const handleSendReport = async (channel) => {
        if (!formMobile || !formName || !formMrd || selectedFiles.length === 0) {
            alert('Please fill out all fields and select at least one PDF file.');
            return;
        }

        const cleanMobile = formMobile.replace(/[^0-9]/g, "");
        const fullMobile = "91" + cleanMobile;

        const jobId = Date.now();
        const today = new Date();
        const dateStr = `${String(today.getDate()).padStart(2, '0')}-${String(today.getMonth() + 1).padStart(2, '0')}-${today.getFullYear()}`;
        const timeStr = `${String(today.getHours()).padStart(2, '0')}:${String(today.getMinutes()).padStart(2, '0')}:${String(today.getSeconds()).padStart(2, '0')}`;

        const tempLog = {
            Timestamp: `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')} ${timeStr}`,
            Date: dateStr,
            Patient_Name: formName,
            MRD_No: formMrd,
            Mobile_No: fullMobile,
            PDF_Link: '#',
            Status: 'Sending',
            Channel: channel,
            jobId: jobId
        };

        // Instantly add to sending queue local state
        setSendingJobs(prev => [...prev, tempLog]);

        // Copy files for async background thread execution
        const currentFiles = [...selectedFiles];
        const currentName = formName;
        const currentMrd = formMrd;

        // Clear files and MRD immediately to free UI for next send (keep Mobile/Name populated for consecutive sends)
        setSelectedFiles([]);
        setFormMrd('');

        setActiveMobile(fullMobile);
        setIsNewChat(false);

        // Run request in background
        (async () => {
            try {
                let base64Data = '';
                if (currentFiles.length === 1) {
                    base64Data = await fileToBase64(currentFiles[0]);
                } else {
                    const mergedBytes = await mergePDFs(currentFiles);
                    base64Data = uint8ToBase64(mergedBytes);
                }

                const payload = {
                    action: 'send_report',
                    patientName: currentName,
                    mrdNo: currentMrd,
                    mobileNo: fullMobile,
                    fileName: currentFiles.length === 1 ? currentFiles[0].name : `${currentMrd}_merged.pdf`,
                    fileData: base64Data,
                    channel: channel
                };

                await fetch(SCRIPT_URL, {
                    method: 'POST',
                    mode: 'no-cors',
                    headers: { 'Content-Type': 'text/plain' },
                    body: JSON.stringify(payload)
                });

                // Short delay to sync sheet
                setTimeout(async () => {
                    await fetchHistory();
                    setSendingJobs(prev => prev.filter(j => j.jobId !== jobId));
                }, 4000);

            } catch (err) {
                console.error('Background send error:', err);
                setSendingJobs(prev => prev.map(j => j.jobId === jobId ? { ...j, Status: 'Failed' } : j));
            }
        })();
    };


    return (
        <div className="h-[calc(100vh-12rem)] min-h-[500px] bg-white rounded-[2rem] overflow-hidden border border-slate-100 shadow-sm flex flex-row text-slate-800 relative font-sans">
            
            {/* 1. LEFT COLUMN: CHAT LIST */}
            <div className={`w-full md:w-80 lg:w-96 border-r border-slate-100 flex flex-col bg-slate-50/50 shrink-0 ${showChatWindowOnMobile ? 'hidden md:flex' : 'flex'}`}>
                {/* Header */}
                <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-white">
                    <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-orange-600 animate-pulse" />
                        <h2 className="text-[10px] font-black uppercase tracking-wider text-slate-800">Lab Delivery Console</h2>
                    </div>
                    <button 
                        onClick={fetchHistory} 
                        disabled={loading}
                        className="p-2 text-slate-400 hover:text-orange-600 hover:bg-slate-50 rounded-xl transition-all"
                        title="Sync History"
                    >
                        <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>

                {/* Search & New Chat */}
                <div className="p-4 space-y-3 bg-white border-b border-slate-50">
                    <div className="relative group">
                        <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-orange-600 transition-colors" />
                        <input 
                            type="text"
                            placeholder="Search Mobile or MRD..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-slate-50 border-none rounded-2xl pl-10 pr-4 py-2.5 text-[11px] font-bold text-slate-700 placeholder:text-slate-400 outline-none focus:bg-white focus:ring-4 focus:ring-orange-500/5 transition-all shadow-inner"
                        />
                    </div>
                    <button 
                        onClick={handleNewChatClick}
                        className="w-full py-3 bg-orange-600 hover:bg-orange-500 text-white rounded-2xl font-black text-[9px] uppercase tracking-widest transition-all active:scale-[0.98] shadow-lg shadow-orange-600/10 flex items-center justify-center gap-2"
                    >
                        <Plus size={14} /> Send New Report
                    </button>
                </div>

                {/* Chats list */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-1.5">
                    {loading && history.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                            <RefreshCw size={24} className="animate-spin mb-3 text-orange-600" />
                            <p className="text-[9px] font-black uppercase tracking-widest">Loading history...</p>
                        </div>
                    ) : displayedChats.length === 0 ? (
                        <div className="text-center py-16 text-slate-400">
                            <MessageSquare size={28} className="mx-auto mb-2 opacity-30 text-slate-300" />
                            <p className="text-[9px] font-black uppercase tracking-wider">No Records Found</p>
                        </div>
                    ) : (
                        displayedChats.map((chat) => (
                            <button
                                key={chat.mobile}
                                onClick={() => handleSelectChat(chat.mobile)}
                                className={`w-full p-4 rounded-2xl flex items-center justify-between text-left transition-all border ${
                                    activeMobile === chat.mobile 
                                    ? 'bg-orange-50/50 border-orange-200 shadow-sm' 
                                    : 'hover:bg-slate-50 border-transparent'
                                }`}
                            >
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs ${
                                        activeMobile === chat.mobile ? 'bg-orange-600 text-white shadow-md' : 'bg-slate-100 text-slate-500'
                                    }`}>
                                        {chat.mobile.slice(-4)}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-xs font-black tracking-tight text-slate-800">
                                            {chat.lastLog?.Patient_Name || `+${chat.mobile}`}
                                        </p>
                                        <p className="text-[9px] font-bold text-slate-400 truncate mt-0.5">
                                            {chat.lastLog?.Patient_Name ? `+${chat.mobile} • ` : ''}MRD: {chat.lastLog?.MRD_No || 'N/A'}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right shrink-0">
                                    <span className="text-[8px] font-bold text-slate-400 block whitespace-nowrap">
                                        {formatDateTime(chat.lastLog?.Timestamp)}
                                    </span>
                                </div>
                            </button>
                        ))
                    )}
                </div>
            </div>

            {/* 2. RIGHT COLUMN: ACTIVE CHAT VIEW */}
            <div className={`flex-1 flex flex-col bg-white relative ${showChatWindowOnMobile ? 'flex' : 'hidden md:flex'}`}>
                {activeMobile || isNewChat ? (
                    <>
                        {/* Chat Header */}
                        <div className="h-16 border-b border-slate-100 px-6 flex items-center justify-between bg-slate-50/20">
                            <div className="flex items-center gap-3">
                                {/* Back button on mobile */}
                                <button 
                                    onClick={() => setShowChatWindowOnMobile(false)}
                                    className="p-2 -ml-2 text-slate-500 hover:text-orange-600 hover:bg-slate-100 rounded-xl md:hidden transition-all"
                                    title="Back to list"
                                >
                                    <ArrowLeft size={16} />
                                </button>
                                <div>
                                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
                                        {isNewChat ? 'New Dispatch Session' : `Transmission Feed`}
                                    </h3>
                                    <p className="text-[9px] font-bold text-orange-600 tracking-wider uppercase mt-0.5">
                                        {isNewChat ? 'Configure fields below to transmit' : `Destination Mobile: +${activeMobile}`}
                                    </p>
                                </div>
                            </div>
                            {!isNewChat && (
                                <span className="px-3.5 py-1.5 bg-slate-100 rounded-xl text-[9px] font-black uppercase text-slate-500 tracking-widest border border-slate-200/45">
                                    Dispatched: {activeChatLogs.length}
                                </span>
                            )}
                        </div>

                        {/* History Bubbles */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/30 custom-scrollbar flex flex-col">
                            {isNewChat ? (
                                <div className="h-full flex flex-col items-center justify-center text-slate-400 text-center px-6">
                                    <ShieldCheck size={36} className="text-orange-600/30 mb-3 animate-pulse" />
                                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-700">Transmission Gateway Active</h4>
                                    <p className="text-[10px] text-slate-400 max-w-xs mt-1.5 leading-relaxed">
                                        Enter patient mobile number, reference MRD, and attach the report PDF to get started.
                                    </p>
                                </div>
                            ) : (
                                groupedLogs.map(([dateKey, logs]) => (
                                    <div key={dateKey} className="space-y-4 flex flex-col">
                                        {/* Date Badge Indicator */}
                                        <div className="flex justify-center my-2">
                                            <span className="px-3.5 py-1 bg-slate-200 text-[8px] font-black uppercase text-slate-500 tracking-widest rounded-full shadow-sm border border-slate-300/30">
                                                {dateKey}
                                            </span>
                                        </div>
                                        {logs.map((log, index) => {
                                            const isSMS = log.Channel === 'SMS';
                                            const isFailed = log.Status !== 'Sending' && log.Status !== 'Success';
                                            return (
                                                <div key={index} className="flex flex-col items-end w-full">
                                                    <div className={`border rounded-[1.5rem] rounded-tr-sm p-4 max-w-md shadow-sm relative group bg-white transition-all duration-300 ${
                                                        isFailed 
                                                        ? 'border-rose-200 bg-rose-50/10' 
                                                        : isSMS ? 'border-blue-100' : 'border-emerald-100'
                                                    }`}>
                                                        <div className="flex items-center justify-between gap-3 mb-2.5 pb-2 border-b border-slate-100">
                                                            <div className="flex items-center gap-2">
                                                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                                                                    isFailed
                                                                    ? 'bg-rose-50 text-rose-600'
                                                                    : isSMS ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600'
                                                                }`}>
                                                                    <FileText size={16} />
                                                                </div>
                                                                <div>
                                                                    <p className="text-[9px] font-black text-slate-800 uppercase tracking-widest">Lab Report (PDF)</p>
                                                                    <p className="text-[8px] font-bold text-slate-400 uppercase mt-0.5">MRD No: {log.MRD_No}</p>
                                                                </div>
                                                            </div>
                                                            <span className={`px-2 py-0.5 rounded text-[7px] font-black uppercase tracking-widest ${
                                                                isFailed
                                                                ? 'bg-rose-50 text-rose-600 border border-rose-100'
                                                                : isSMS ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600'
                                                            }`}>
                                                                {log.Channel || 'WhatsApp'}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center justify-between gap-6">
                                                            <div className="flex gap-1.5">
                                                                <button 
                                                                    type="button"
                                                                    onClick={() => setPreviewUrl(log.PDF_Link)}
                                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all"
                                                                >
                                                                    <Eye size={10} /> Preview
                                                                </button>
                                                                <a 
                                                                    href={log.PDF_Link} 
                                                                    target="_blank" 
                                                                    rel="noopener noreferrer" 
                                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-[9px] font-black uppercase tracking-wider transition-all"
                                                                >
                                                                    <Download size={10} /> Download
                                                                </a>
                                                            </div>
                                                            <div className="flex flex-col items-end text-[7px] text-slate-400 font-bold">
                                                                <span>{cleanTime(log.Timestamp)}</span>
                                                                <div className="flex items-center gap-1 mt-0.5">
                                                                    {log.Status === 'Sending' ? (
                                                                        <div className="flex items-center gap-0.5 text-orange-500 font-black uppercase tracking-wider text-[7px]">
                                                                            <Loader2 size={10} className="animate-spin" />
                                                                            <span>Sending</span>
                                                                        </div>
                                                                    ) : log.Status === 'Success' ? (
                                                                        <div className="flex items-center gap-0.5 text-emerald-600 font-black uppercase tracking-wider text-[7px]">
                                                                            <CheckCheck size={10} />
                                                                            <span>Sent</span>
                                                                        </div>
                                                                    ) : (
                                                                        <div className="flex items-center gap-0.5 text-rose-600 font-black uppercase tracking-wider text-[7px]" title={log.Status}>
                                                                            <AlertCircle size={10} />
                                                                            <span>Failed</span>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Input Footer Form */}
                        <div className="p-5 border-t border-slate-100 bg-white space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Patient Mobile No</label>
                                    <div className="flex items-center bg-slate-50 rounded-2xl px-5 py-3.5 focus-within:bg-white focus-within:ring-4 focus-within:ring-orange-500/5 transition-all">
                                        <span className="text-xs font-black text-slate-400 select-none mr-2 shrink-0">+91</span>
                                        <input 
                                            type="number"
                                            required
                                            disabled={!isNewChat}
                                            value={formMobile}
                                            onChange={(e) => setFormMobile(e.target.value)}
                                            placeholder="10 digit mobile number"
                                            className="w-full bg-transparent border-none p-0 text-xs font-bold text-slate-700 outline-none placeholder:text-slate-400 disabled:opacity-50"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Patient Name</label>
                                    <input 
                                        type="text"
                                        required
                                        disabled={!isNewChat}
                                        value={formName}
                                        onChange={(e) => setFormName(e.target.value)}
                                        placeholder="Enter Patient Name"
                                        className="w-full bg-slate-50 border-none rounded-2xl px-5 py-3.5 text-xs font-bold text-slate-700 outline-none focus:bg-white focus:ring-4 focus:ring-orange-500/5 transition-all placeholder:text-slate-400 disabled:opacity-50"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">MRD Reference No</label>
                                    <input 
                                        type="text"
                                        required
                                        disabled={false}
                                        value={formMrd}
                                        onChange={(e) => setFormMrd(e.target.value)}
                                        placeholder="e.g. MRD_9401"
                                        className="w-full bg-slate-50 border-none rounded-2xl px-5 py-3.5 text-xs font-bold text-slate-700 outline-none focus:bg-white focus:ring-4 focus:ring-orange-500/5 transition-all placeholder:text-slate-400 disabled:opacity-50"
                                    />
                                </div>
                            </div>

                            {/* File Attachment & Dual Send Buttons */}
                            <div className="flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-4 pt-1.5 border-t border-slate-50">
                                <div className="flex-1">
                                    <div className="relative flex items-center">
                                        <input 
                                            type="file" 
                                            id="pdf-upload" 
                                            accept="application/pdf"
                                            multiple
                                            onChange={handleFileChange}
                                            disabled={false}
                                            className="hidden" 
                                        />
                                        <label 
                                            htmlFor="pdf-upload" 
                                            className="flex items-center gap-2 px-4.5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest cursor-pointer transition-all border border-slate-200/50"
                                        >
                                            <Paperclip size={12} />
                                            {selectedFiles.length > 0 ? 'Add More PDFs' : 'Attach PDF Report(s)'}
                                        </label>
                                        
                                        {selectedFiles.length > 0 && (
                                            <div className="ml-3 flex flex-wrap gap-2 max-w-lg">
                                                {selectedFiles.map((file, idx) => (
                                                    <div key={idx} className="flex items-center gap-1.5 bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-xl">
                                                        <FileText size={10} className="text-orange-600" />
                                                        <span className="text-[8px] font-bold text-slate-600 max-w-[100px] truncate">{file.name}</span>
                                                        <button 
                                                            type="button" 
                                                            onClick={() => setSelectedFiles(prev => prev.filter((_, i) => i !== idx))} 
                                                            className="text-slate-400 hover:text-slate-600"
                                                        >
                                                            <X size={10}/>
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {fileError && (
                                            <p className="ml-3 text-[9px] font-black text-rose-600 uppercase tracking-widest flex items-center gap-1">
                                                <AlertCircle size={10} /> {fileError}
                                            </p>
                                        )}
                                    </div>
                                    <p className="text-[8px] font-bold text-slate-400 mt-2 uppercase tracking-wider">Format: PDF only • Limit: 5MB per file • Select multiple files to merge them</p>
                                </div>

                                <div className="flex gap-2 shrink-0">
                                    {/* Send WhatsApp Button */}
                                    <button
                                        type="button"
                                        onClick={() => handleSendReport('WhatsApp')}
                                        disabled={selectedFiles.length === 0}
                                        className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-100 text-white disabled:text-slate-400 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-[0.98] shadow-lg shadow-emerald-600/10 flex items-center gap-2"
                                    >
                                        <MessageSquare size={13} /> Send WhatsApp
                                    </button>

                                    {/* Send SMS Button */}
                                    <button
                                        type="button"
                                        onClick={() => handleSendReport('SMS')}
                                        disabled={selectedFiles.length === 0}
                                        className="px-6 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-100 text-white disabled:text-slate-400 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-[0.98] shadow-lg shadow-blue-600/10 flex items-center gap-2"
                                    >
                                        <Smartphone size={13} /> Send SMS
                                    </button>
                                </div>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400 text-center px-12 bg-slate-50/20">
                        <div className="w-16 h-16 bg-white border border-slate-100 rounded-3xl flex items-center justify-center text-orange-600/30 mb-4 shadow-sm">
                            <MessageSquare size={24} />
                        </div>
                        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-700">Dispatcher Console</h3>
                        <p className="text-[10px] text-slate-400 max-w-sm mt-1.5 leading-relaxed">
                            Select a dispatch log from the left sidebar to view history, or click **"Send New Report"** to send a report to a new patient.
                        </p>
                    </div>
                )}
            </div>

            {/* 3. PDF PREVIEW MODAL */}
            <AnimatePresence>
                {previewUrl && (
                    <div className="fixed inset-0 z-[1200] flex items-center justify-center p-4">
                        <div onClick={() => setPreviewUrl(null)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
                        <motion.div 
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="w-full max-w-4xl h-[80vh] bg-white border border-slate-100 rounded-[2rem] overflow-hidden shadow-2xl relative flex flex-col z-10"
                        >
                            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                                <div className="flex items-center gap-2">
                                    <FileText className="text-orange-600" size={18} />
                                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">Report Preview</h3>
                                </div>
                                <button 
                                    onClick={() => setPreviewUrl(null)}
                                    className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-all"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                            <div className="flex-1 bg-slate-100">
                                <iframe 
                                    src={`https://docs.google.com/viewer?url=${encodeURIComponent(previewUrl)}&embedded=true`}
                                    className="w-full h-full border-none"
                                    title="PDF Report Preview"
                                />
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* LAB REPORT THEMED GLASS OVERLAY LOADER */}
            <AnimatePresence>
                {loading && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-slate-900/10 backdrop-blur-[6px] z-[1000] flex items-center justify-center p-4 transition-all duration-300"
                    >
                        <div className="bg-white/95 border border-slate-100 rounded-[2.5rem] p-8 max-w-sm w-full shadow-2xl flex flex-col items-center text-center space-y-6">
                            {/* Medical / Lab graphic container */}
                            <div className="relative w-20 h-20 flex items-center justify-center bg-orange-50 rounded-3xl text-orange-600">
                                <div className="absolute inset-0 rounded-3xl bg-orange-500/10 animate-ping" />
                                <div className="relative flex items-center justify-center gap-1">
                                    <FlaskConical size={32} className="animate-bounce" />
                                    <Dna size={20} className="absolute -top-1 -right-2 text-emerald-500 animate-pulse" />
                                </div>
                            </div>
                            
                            <div className="space-y-2">
                                <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-800">
                                    Analyzing Lab Records
                                </h4>
                                <div className="h-[1.5px] w-12 bg-orange-100 mx-auto rounded-full overflow-hidden relative">
                                    <motion.div 
                                        className="h-full bg-orange-600 rounded-full"
                                        animate={{ x: [-30, 60] }}
                                        transition={{ repeat: Infinity, duration: 1.2, ease: "easeInOut" }}
                                        style={{ width: '50%' }}
                                    />
                                </div>
                            </div>
                            
                            {/* ECG Pulse Indicator */}
                            <div className="w-full h-8 flex items-center justify-center text-orange-600/40 relative">
                                <Activity size={24} className="animate-pulse" />
                                <span className="absolute text-[8px] font-black tracking-widest text-emerald-500/80 uppercase bottom-[-8px]">Secure connection active</span>
                            </div>

                            <p className="text-[10px] font-bold text-slate-500 animate-pulse h-4 mt-2">
                                {loadingMessage}
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
