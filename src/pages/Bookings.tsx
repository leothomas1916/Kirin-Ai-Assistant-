import React, { useState, useEffect } from "react";
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  updateDoc, 
  deleteDoc, 
  doc, 
} from "firebase/firestore";
import { db } from "../firebase";
import { Booking, BookingStatus } from "../types";
import { 
  Search, 
  Plus, 
  Filter, 
  MoreVertical, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Smartphone, 
  User, 
  Phone,
  Trash2,
  Edit2,
  ChevronRight
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "../lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useStore } from "../store/useStore";

export default function Bookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<BookingStatus | "all">("all");
  const { openNewBookingModal } = useStore();

  useEffect(() => {
    const q = query(collection(db, "bookings"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const bookingsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Booking[];
      setBookings(bookingsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleUpdateStatus = async (id: string, status: BookingStatus) => {
    try {
      await updateDoc(doc(db, "bookings", id), { status });
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  const handleDeleteBooking = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this booking?")) {
      try {
        await deleteDoc(doc(db, "bookings", id));
      } catch (error) {
        console.error("Error deleting booking:", error);
      }
    }
  };

  const filteredBookings = bookings.filter(booking => {
    const matchesSearch = 
      booking.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.device.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.phone.includes(searchTerm);
    
    const matchesFilter = filterStatus === "all" || booking.status === filterStatus;
    
    return matchesSearch && matchesFilter;
  });

  const getStatusIcon = (status: BookingStatus) => {
    switch (status) {
      case "pending": return <Clock className="w-4 h-4 text-amber-500" />;
      case "in-progress": return <AlertCircle className="w-4 h-4 text-blue-500" />;
      case "completed": return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case "delivered": return <ChevronRight className="w-4 h-4 text-zinc-400" />;
    }
  };

  const getStatusColor = (status: BookingStatus) => {
    switch (status) {
      case "pending": return "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-100 dark:border-amber-500/20";
      case "in-progress": return "bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-100 dark:border-blue-500/20";
      case "completed": return "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-500/20";
      case "delivered": return "bg-zinc-50 dark:bg-zinc-500/10 text-zinc-700 dark:text-zinc-400 border-zinc-100 dark:border-zinc-500/20";
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 min-h-screen transition-colors duration-300 dark:bg-zinc-950">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-zinc-900 dark:text-white tracking-tight">Bookings</h1>
          <p className="text-sm font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mt-1">Manage repair workflow & status</p>
        </div>
        <button 
          onClick={openNewBookingModal}
          className="flex items-center justify-center gap-2 bg-black dark:bg-white dark:text-black text-white px-6 py-3 rounded-2xl font-black text-sm uppercase tracking-widest hover:scale-105 transition-transform active:scale-95 shadow-xl shadow-black/10"
        >
          <Plus className="w-5 h-5" />
          New Booking
        </button>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 group-focus-within:text-black dark:group-focus-within:text-white transition-colors" />
          <input 
            type="text" 
            placeholder="Search by name, device, or phone..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl font-bold text-sm outline-none focus:border-black dark:focus:border-white focus:ring-4 focus:ring-zinc-100 dark:focus:ring-white/5 transition-all dark:text-white"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
          {["all", "pending", "in-progress", "completed", "delivered"].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status as any)}
              className={cn(
                "px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest border transition-all whitespace-nowrap",
                filterStatus === status 
                  ? "bg-black text-white border-black dark:bg-white dark:text-black dark:border-white shadow-lg shadow-black/10" 
                  : "bg-white dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700"
              )}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Bookings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {filteredBookings.map((booking) => (
            <motion.div
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              key={booking.id}
              className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2.5rem] p-6 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleDeleteBooking(booking.id)}
                    className="w-8 h-8 bg-red-50 dark:bg-red-500/10 text-red-500 rounded-lg flex items-center justify-center hover:bg-red-500 hover:text-white transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className={cn(
                    "px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5",
                    getStatusColor(booking.status)
                  )}>
                    {getStatusIcon(booking.status)}
                    {booking.status}
                  </div>
                  <span className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">
                    {booking.createdAt ? format(booking.createdAt.toDate(), "MMM d, h:mm a") : "Just now"}
                  </span>
                </div>

                <div>
                  <h3 className="text-xl font-black text-zinc-900 dark:text-white tracking-tight">{booking.customerName}</h3>
                  <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400 mt-1">
                    <Phone className="w-3 h-3" />
                    <span className="text-xs font-bold">{booking.phone}</span>
                  </div>
                </div>

                <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-800 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-white dark:bg-zinc-900 rounded-lg flex items-center justify-center border border-zinc-200 dark:border-zinc-800">
                      <Smartphone className="w-4 h-4 text-zinc-400 dark:text-zinc-500" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest leading-none">Device</p>
                      <p className="text-sm font-black text-zinc-900 dark:text-white mt-0.5">{booking.device}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-white dark:bg-zinc-900 rounded-lg flex items-center justify-center border border-zinc-200 dark:border-zinc-800">
                      <AlertCircle className="w-4 h-4 text-zinc-400 dark:text-zinc-500" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest leading-none">Issue</p>
                      <p className="text-sm font-black text-zinc-900 dark:text-white mt-0.5 line-clamp-1">{booking.issue}</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div className="text-2xl font-black text-zinc-900 dark:text-white tracking-tighter">
                    ${booking.price}
                  </div>
                  <div className="flex gap-2">
                    {booking.status !== "completed" && booking.status !== "delivered" && (
                      <button 
                        onClick={() => handleUpdateStatus(booking.id, "completed")}
                        className="px-4 py-2 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 hover:text-white transition-all"
                      >
                        Complete
                      </button>
                    )}
                    {booking.status === "completed" && (
                      <button 
                        onClick={() => handleUpdateStatus(booking.id, "delivered")}
                        className="px-4 py-2 bg-zinc-900 dark:bg-white text-white dark:text-black rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black dark:hover:bg-zinc-200 transition-all"
                      >
                        Deliver
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
