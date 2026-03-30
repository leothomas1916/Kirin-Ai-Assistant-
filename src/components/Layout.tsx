import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import AIChat from "./AIChat";
import NewBookingModal from "./NewBookingModal";
import { useStore } from "../store/useStore";
import { useEffect } from "react";

export default function Layout() {
  const { isDarkMode } = useStore();

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDarkMode]);

  return (
    <div className="flex h-screen bg-zinc-50 dark:bg-zinc-950 overflow-hidden transition-colors duration-300">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-y-auto scrollbar-hide">
          <Outlet />
        </main>
      </div>
      <AIChat />
      <NewBookingModal />
    </div>
  );
}
