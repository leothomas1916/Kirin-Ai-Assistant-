import { Search, Bell, User, Plus, Sparkles, Moon, Sun } from "lucide-react";
import { useState } from "react";
import { cn } from "../lib/utils";
import { useStore } from "../store/useStore";

export default function Navbar() {
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const { openNewBookingModal, isDarkMode, toggleDarkMode } = useStore();

  return (
    <header className="h-20 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between px-8 sticky top-0 z-40 transition-colors duration-300">
      {/* Search Bar */}
      <div className="flex-1 max-w-xl relative group">
        <div 
          className={cn(
            "flex items-center gap-3 px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl transition-all duration-300 ease-in-out",
            isSearchFocused ? "bg-white dark:bg-zinc-900 border-black dark:border-white ring-4 ring-zinc-100 dark:ring-zinc-800" : "hover:bg-zinc-100 dark:hover:bg-zinc-700"
          )}
        >
          <Search className={cn("w-4 h-4 text-zinc-400 transition-colors", isSearchFocused && "text-black dark:text-white")} />
          <input 
            type="text" 
            placeholder="Search bookings, customers, or commands..." 
            className="bg-transparent border-none outline-none w-full text-sm font-bold text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400"
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
          />
          <div className="flex items-center gap-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 px-1.5 py-0.5 rounded-md shadow-sm">
            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">⌘K</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-6">
        <button 
          onClick={toggleDarkMode}
          className="w-10 h-10 flex items-center justify-center rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-all active:scale-95"
        >
          {isDarkMode ? <Sun className="w-5 h-5 text-zinc-100" /> : <Moon className="w-5 h-5 text-zinc-900" />}
        </button>

        <button 
          onClick={openNewBookingModal}
          className="flex items-center gap-2 bg-black dark:bg-white text-white dark:text-black px-5 py-2.5 rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-transform active:scale-95 shadow-lg shadow-black/10"
        >
          <Plus className="w-4 h-4" />
          New Booking
        </button>

        <div className="flex items-center gap-4 border-l border-zinc-200 dark:border-zinc-800 pl-6">
          <button className="relative w-10 h-10 flex items-center justify-center rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors text-zinc-500 dark:text-zinc-400 hover:text-black dark:hover:text-white">
            <Bell className="w-5 h-5" />
            <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-zinc-900" />
          </button>
          
          <div className="flex items-center gap-3 pl-2 group cursor-pointer">
            <div className="text-right">
              <p className="text-sm font-black text-zinc-900 dark:text-zinc-100 leading-none">Leo Thomas</p>
              <p className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mt-1">Admin</p>
            </div>
            <div className="w-10 h-10 bg-zinc-900 dark:bg-zinc-100 rounded-xl flex items-center justify-center overflow-hidden border-2 border-white dark:border-zinc-800 shadow-md group-hover:scale-105 transition-transform">
              <User className="w-6 h-6 text-white dark:text-black" />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
