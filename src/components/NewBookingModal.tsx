import React, { useState } from "react";
import { 
  collection, 
  addDoc, 
  serverTimestamp 
} from "firebase/firestore";
import { db } from "../firebase";
import { BookingStatus } from "../types";
import { 
  MoreVertical, 
  X
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useStore } from "../store/useStore";
import { toast } from "sonner";

export default function NewBookingModal() {
  const { isNewBookingModalOpen, closeNewBookingModal } = useStore();
  const [isSaving, setIsSaving] = useState(false);

  // Form State
  const [newBooking, setNewBooking] = useState({
    customerName: "",
    phone: "",
    device: "",
    issue: "",
    price: 0,
    status: "pending" as BookingStatus
  });

  const handleAddBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await addDoc(collection(db, "bookings"), {
        ...newBooking,
        createdAt: serverTimestamp()
      });
      toast.success("Booking created successfully!");
      closeNewBookingModal();
      setNewBooking({
        customerName: "",
        phone: "",
        device: "",
        issue: "",
        price: 0,
        status: "pending"
      });
    } catch (error) {
      console.error("Error adding booking:", error);
      toast.error("Failed to create booking.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {isNewBookingModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeNewBookingModal}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-lg bg-white dark:bg-zinc-900 rounded-[3rem] p-8 shadow-2xl overflow-hidden border border-transparent dark:border-zinc-800"
          >
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight">New Booking</h2>
                <p className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mt-1">Enter repair details</p>
              </div>
              <button 
                onClick={closeNewBookingModal}
                className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                <X className="w-5 h-5 text-zinc-400 dark:text-zinc-500" />
              </button>
            </div>

            <form onSubmit={handleAddBooking} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest ml-1">Customer Name</label>
                  <input 
                    required
                    type="text" 
                    value={newBooking.customerName}
                    onChange={(e) => setNewBooking({...newBooking, customerName: e.target.value})}
                    className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl font-bold text-sm outline-none text-zinc-900 dark:text-zinc-100 focus:border-black dark:focus:border-white focus:ring-4 focus:ring-zinc-100 dark:focus:ring-zinc-800 transition-all placeholder:text-zinc-400 dark:placeholder:text-zinc-600"
                    placeholder="John Doe"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest ml-1">Phone Number</label>
                  <input 
                    required
                    type="tel" 
                    value={newBooking.phone}
                    onChange={(e) => setNewBooking({...newBooking, phone: e.target.value})}
                    className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl font-bold text-sm outline-none text-zinc-900 dark:text-zinc-100 focus:border-black dark:focus:border-white focus:ring-4 focus:ring-zinc-100 dark:focus:ring-zinc-800 transition-all placeholder:text-zinc-400 dark:placeholder:text-zinc-600"
                    placeholder="555-0123"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest ml-1">Device Model</label>
                <input 
                  required
                  type="text" 
                  value={newBooking.device}
                  onChange={(e) => setNewBooking({...newBooking, device: e.target.value})}
                  className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl font-bold text-sm outline-none text-zinc-900 dark:text-zinc-100 focus:border-black dark:focus:border-white focus:ring-4 focus:ring-zinc-100 dark:focus:ring-zinc-800 transition-all placeholder:text-zinc-400 dark:placeholder:text-zinc-600"
                  placeholder="iPhone 15 Pro Max"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest ml-1">Issue Description</label>
                <textarea 
                  required
                  value={newBooking.issue}
                  onChange={(e) => setNewBooking({...newBooking, issue: e.target.value})}
                  className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl font-bold text-sm outline-none text-zinc-900 dark:text-zinc-100 focus:border-black dark:focus:border-white focus:ring-4 focus:ring-zinc-100 dark:focus:ring-zinc-800 transition-all min-h-[100px] resize-none placeholder:text-zinc-400 dark:placeholder:text-zinc-600"
                  placeholder="Cracked screen, battery drain..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest ml-1">Price ($)</label>
                  <input 
                    required
                    type="number" 
                    value={newBooking.price}
                    onChange={(e) => setNewBooking({...newBooking, price: Number(e.target.value)})}
                    className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl font-bold text-sm outline-none text-zinc-900 dark:text-zinc-100 focus:border-black dark:focus:border-white focus:ring-4 focus:ring-zinc-100 dark:focus:ring-zinc-800 transition-all placeholder:text-zinc-400 dark:placeholder:text-zinc-600"
                    placeholder="149"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest ml-1">Initial Status</label>
                  <select 
                    value={newBooking.status}
                    onChange={(e) => setNewBooking({...newBooking, status: e.target.value as BookingStatus})}
                    className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl font-bold text-sm outline-none text-zinc-900 dark:text-zinc-100 focus:border-black dark:focus:border-white focus:ring-4 focus:ring-zinc-100 dark:focus:ring-zinc-800 transition-all appearance-none"
                  >
                    <option value="pending">Pending</option>
                    <option value="in-progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>

              <button 
                type="submit"
                disabled={isSaving}
                className="w-full py-4 bg-black dark:bg-white text-white dark:text-zinc-950 rounded-2xl font-black text-sm uppercase tracking-widest hover:scale-[1.02] transition-transform active:scale-95 shadow-xl shadow-black/10 dark:shadow-white/5 mt-4 disabled:opacity-50"
              >
                {isSaving ? "Creating..." : "Create Booking"}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
