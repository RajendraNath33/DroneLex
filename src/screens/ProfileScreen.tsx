import React, { useState } from 'react';
import { Bell, Moon, Globe, HelpCircle, LogOut, ChevronRight } from 'lucide-react';

export const ProfileScreen: React.FC<{ onSignOut: () => void }> = ({ onSignOut }) => {
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(true);
  const [language, setLanguage] = useState('English');

  const handleNotificationsToggle = () => {
    setNotifications(!notifications);
    alert(`Notifications are now ${!notifications ? 'On' : 'Off'}`);
  };

  const handleDarkModeToggle = () => {
    setDarkMode(!darkMode);
    alert(`Dark Mode is now ${!darkMode ? 'Active' : 'Inactive'}`);
  };

  const handleLanguageChange = () => {
    const newLang = language === 'English' ? 'Hindi' : 'English';
    setLanguage(newLang);
    alert(`Language changed to ${newLang}`);
  };

  const handleHelpSupport = () => {
    alert("Help & Support: For DGCA regulations and app assistance, contact support@dronelex.ai");
  };

  return (
    <div className="p-4 max-w-md mx-auto space-y-6 pb-24 text-white">
      <h2 className="text-2xl font-bold">Settings</h2>
      
      <div className="space-y-3">
        <button 
          onClick={handleNotificationsToggle}
          className="w-full flex items-center justify-between p-4 bg-slate-800/60 rounded-xl hover:bg-slate-800 transition"
        >
          <div className="flex items-center space-x-3">
            <Bell className="w-5 h-5 text-blue-400" />
            <span>Notifications</span>
          </div>
          <div className="flex items-center space-x-2 text-slate-400">
            <span>{notifications ? 'On' : 'Off'}</span>
            <ChevronRight className="w-4 h-4" />
          </div>
        </button>

        <button 
          onClick={handleDarkModeToggle}
          className="w-full flex items-center justify-between p-4 bg-slate-800/60 rounded-xl hover:bg-slate-800 transition"
        >
          <div className="flex items-center space-x-3">
            <Moon className="w-5 h-5 text-purple-400" />
            <span>Dark Mode</span>
          </div>
          <div className="flex items-center space-x-2 text-slate-400">
            <span>{darkMode ? 'Active' : 'Inactive'}</span>
            <ChevronRight className="w-4 h-4" />
          </div>
        </button>

        <button 
          onClick={handleLanguageChange}
          className="w-full flex items-center justify-between p-4 bg-slate-800/60 rounded-xl hover:bg-slate-800 transition"
        >
          <div className="flex items-center space-x-3">
            <Globe className="w-5 h-5 text-green-400" />
            <span>Language</span>
          </div>
          <div className="flex items-center space-x-2 text-slate-400">
            <span>{language}</span>
            <ChevronRight className="w-4 h-4" />
          </div>
        </button>

        <button 
          onClick={handleHelpSupport}
          className="w-full flex items-center justify-between p-4 bg-slate-800/60 rounded-xl hover:bg-slate-800 transition"
        >
          <div className="flex items-center space-x-3">
            <HelpCircle className="w-5 h-5 text-amber-400" />
            <span>Help & Support</span>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </button>
      </div>

      <button 
        onClick={onSignOut}
        className="w-full flex items-center justify-center space-x-2 p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl hover:bg-red-500/20 transition mt-6"
      >
        <LogOut className="w-5 h-5" />
        <span className="font-medium">Sign Out</span>
      </button>

      <p className="text-center text-xs text-slate-500 pt-4">DroneLex & Pilot AI v1.0.0</p>
    </div>
  );
};
