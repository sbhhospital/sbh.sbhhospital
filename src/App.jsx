import React, { useState, useEffect } from 'react';
import LoginPanel from './components/LoginPanel';
import SheetDashboard from './components/SheetDashboard';

function App() {
  const [user, setUser] = useState(null);
  const [isPublicMode, setIsPublicMode] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const type = params.get('type') || params.get('mode');
    
    if (type === 'survey' || type === 'smile_award' || type === 'smile' || type === 'lasik' || type === 'visiting_update' || type === 'register') {
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
