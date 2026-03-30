import { 
  LayoutDashboard, 
  CalendarDays, 
  Users, 
  Settings, 
  Bot, 
  LogOut,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Globe,
  Zap
} from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "../lib/utils";
import { motion } from "framer-motion";

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/" },
  { icon: CalendarDays, label: "Bookings", path: "/bookings" },
  { icon: Users, label: "Customers", path: "/customers" },
  { icon: Globe, label: "GMB Reviews", path: "/gmb" },
  { icon: TrendingUp, label: "Analytics", path: "/analytics" },
  { icon: Settings, label: "Settings", path: "/settings" },
];

export default function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const location = useLocation();

  return (
    <motion.aside 
      initial={false}
      animate={{ width: isCollapsed ? 80 : 280 }}
      className="h-screen bg-zinc-900 dark:bg-black border-r border-zinc-800 dark:border-zinc-900 flex flex-col relative z-50 transition-colors duration-300"
    >
      {/* Logo */}
      <div className="h-20 flex items-center px-6 mb-4">
        <div className="w-10 h-10 bg-white dark:bg-zinc-100 rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-white/10 dark:shadow-white/5">
          <Zap className="w-6 h-6 text-black fill-black" />
        </div>
        {!isCollapsed && (
          <motion.div 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="ml-4"
          >
            <h1 className="text-xl font-black text-white dark:text-zinc-100 tracking-tighter">KIRIN AI</h1>
            <p className="text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-[0.2em] -mt-1">Repair CRM</p>
          </motion.div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 space-y-2">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link 
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-4 px-4 py-3 rounded-2xl transition-all duration-300 group relative",
                isActive 
                  ? "bg-white dark:bg-zinc-100 text-black shadow-xl shadow-white/5" 
                  : "text-zinc-500 dark:text-zinc-400 hover:text-white dark:hover:text-zinc-100 hover:bg-zinc-800 dark:hover:bg-zinc-900"
              )}
            >
              <item.icon className={cn("w-5 h-5 shrink-0 transition-transform duration-300", isActive ? "scale-110" : "group-hover:scale-110")} />
              {!isCollapsed && (
                <span className="text-sm font-black uppercase tracking-widest">{item.label}</span>
              )}
              {isActive && !isCollapsed && (
                <motion.div 
                  layoutId="active-pill"
                  className="absolute right-4 w-1.5 h-1.5 bg-black rounded-full"
                />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-zinc-800 dark:border-zinc-900">
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="w-full flex items-center gap-4 px-4 py-3 text-zinc-500 dark:text-zinc-400 hover:text-white dark:hover:text-zinc-100 hover:bg-zinc-800 dark:hover:bg-zinc-900 rounded-2xl transition-all group"
        >
          {isCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          {!isCollapsed && <span className="text-sm font-black uppercase tracking-widest">Collapse</span>}
        </button>
        
        <button className="w-full flex items-center gap-4 px-4 py-3 text-red-500 hover:bg-red-500/10 rounded-2xl transition-all mt-2">
          <LogOut className="w-5 h-5" />
          {!isCollapsed && <span className="text-sm font-black uppercase tracking-widest">Logout</span>}
        </button>
      </div>
    </motion.aside>
  );
}
