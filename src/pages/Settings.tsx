import { useState } from "react";
import { 
  Settings as SettingsIcon, 
  User, 
  Lock, 
  Bell, 
  Shield, 
  Key, 
  Database, 
  Cloud, 
  Smartphone,
  Save,
  CheckCircle2,
  AlertCircle,
  Globe
} from "lucide-react";
import { cn } from "../lib/utils";
import { motion, AnimatePresence } from "framer-motion";

export default function Settings() {
  const [activeTab, setActiveTab] = useState("profile");
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    }, 1500);
  };

  const tabs = [
    { id: "profile", icon: User, label: "Profile" },
    { id: "security", icon: Shield, label: "Security" },
    { id: "api", icon: Key, label: "API Keys" },
    { id: "notifications", icon: Bell, label: "Notifications" },
    { id: "system", icon: SettingsIcon, label: "System" },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 bg-white dark:bg-zinc-950 min-h-screen transition-colors duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-zinc-900 dark:text-white tracking-tight">Settings</h1>
          <p className="text-sm font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mt-1">Configure your workspace & preferences</p>
        </div>
        <button 
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center justify-center gap-2 bg-black dark:bg-white text-white dark:text-zinc-950 px-8 py-3 rounded-2xl font-black text-sm uppercase tracking-widest hover:scale-105 transition-transform active:scale-95 shadow-xl shadow-black/10 disabled:opacity-50 disabled:scale-100"
        >
          {isSaving ? (
            <div className="w-5 h-5 border-2 border-white/30 dark:border-zinc-950/30 border-t-white dark:border-t-zinc-950 rounded-full animate-spin" />
          ) : (
            <Save className="w-5 h-5" />
          )}
          {isSaving ? "Saving..." : "Save Changes"}
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-12">
        {/* Sidebar Tabs */}
        <div className="w-full lg:w-64 space-y-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "w-full flex items-center gap-3 p-4 rounded-2xl transition-all duration-200 group",
                activeTab === tab.id 
                  ? "bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 shadow-xl shadow-black/10 dark:shadow-white/5" 
                  : "text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:text-zinc-900 dark:hover:text-white"
              )}
            >
              <tab.icon className={cn("w-5 h-5", activeTab === tab.id ? "text-white dark:text-zinc-950" : "text-zinc-400 dark:text-zinc-600 group-hover:text-zinc-900 dark:group-hover:text-white")} />
              <span className="font-black text-xs uppercase tracking-widest">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="flex-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[3rem] p-10 shadow-sm min-h-[600px]">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-10"
          >
            {activeTab === "profile" && (
              <div className="space-y-8">
                <div className="flex items-center gap-8">
                  <div className="w-32 h-32 bg-zinc-100 dark:bg-zinc-800 rounded-[2.5rem] border-4 border-white dark:border-zinc-900 shadow-xl flex items-center justify-center text-4xl font-black text-zinc-300 dark:text-zinc-600 relative group overflow-hidden">
                    LT
                    <div className="absolute inset-0 bg-black/60 dark:bg-white/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                      <Smartphone className="w-8 h-8 text-white dark:text-zinc-950" />
                    </div>
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">Profile Information</h2>
                    <p className="text-sm font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mt-1">Update your personal details</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest ml-1">Full Name</label>
                    <input 
                      type="text" 
                      defaultValue="Leo Thomas"
                      className="w-full px-6 py-4 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 rounded-2xl font-bold text-sm text-zinc-900 dark:text-white outline-none focus:border-black dark:focus:border-white focus:ring-4 focus:ring-zinc-100 dark:focus:ring-zinc-800 transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest ml-1">Email Address</label>
                    <input 
                      type="email" 
                      defaultValue="leothomas1916@gmail.com"
                      className="w-full px-6 py-4 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 rounded-2xl font-bold text-sm text-zinc-900 dark:text-white outline-none focus:border-black dark:focus:border-white focus:ring-4 focus:ring-zinc-100 dark:focus:ring-zinc-800 transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest ml-1">Bio</label>
                  <textarea 
                    defaultValue="Senior Full-Stack AI Engineer & Product Designer at Kirin AI CRM."
                    className="w-full px-6 py-4 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 rounded-2xl font-bold text-sm text-zinc-900 dark:text-white outline-none focus:border-black dark:focus:border-white focus:ring-4 focus:ring-zinc-100 dark:focus:ring-zinc-800 transition-all min-h-[120px] resize-none"
                  />
                </div>
              </div>
            )}

            {activeTab === "api" && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">API Configuration</h2>
                  <p className="text-sm font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mt-1">Manage external service integrations</p>
                </div>

                <div className="space-y-6">
                  <div className="p-8 bg-zinc-50 dark:bg-zinc-800/50 rounded-[2rem] border border-zinc-100 dark:border-zinc-800 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white dark:bg-zinc-900 rounded-xl flex items-center justify-center border border-zinc-200 dark:border-zinc-800">
                          <Key className="w-5 h-5 text-zinc-900 dark:text-white" />
                        </div>
                        <div>
                          <p className="text-sm font-black text-zinc-900 dark:text-white">OpenRouter API Key</p>
                          <p className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mt-0.5">Required for AI Assistant</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 px-3 py-1 rounded-lg border border-emerald-100 dark:border-emerald-500/20">
                        <CheckCircle2 className="w-3 h-3" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Active</span>
                      </div>
                    </div>
                    <input 
                      type="password" 
                      defaultValue="sk-or-v1-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                      className="w-full px-6 py-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl font-bold text-sm text-zinc-900 dark:text-white outline-none focus:border-black dark:focus:border-white transition-all"
                    />
                  </div>

                  <div className="p-8 bg-zinc-50 dark:bg-zinc-800/50 rounded-[2rem] border border-zinc-100 dark:border-zinc-800 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white dark:bg-zinc-900 rounded-xl flex items-center justify-center border border-zinc-200 dark:border-zinc-800">
                          <Globe className="w-5 h-5 text-zinc-900 dark:text-white" />
                        </div>
                        <div>
                          <p className="text-sm font-black text-zinc-900 dark:text-white">Google My Business ID</p>
                          <p className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mt-0.5">For review automation</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-zinc-400 dark:text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-3 py-1 rounded-lg border border-zinc-200 dark:border-zinc-700">
                        <AlertCircle className="w-3 h-3" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Pending</span>
                      </div>
                    </div>
                    <input 
                      type="text" 
                      placeholder="Enter your GMB Location ID"
                      className="w-full px-6 py-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl font-bold text-sm text-zinc-900 dark:text-white outline-none focus:border-black dark:focus:border-white transition-all"
                    />
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>

      {/* Success Toast */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-3 z-50"
          >
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            <span className="text-sm font-black uppercase tracking-widest">Settings saved successfully</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
