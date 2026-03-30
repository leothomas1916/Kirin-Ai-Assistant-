import React, { useState, useEffect } from "react";
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  serverTimestamp,
  where
} from "firebase/firestore";
import { db } from "../firebase";
import { Customer, Booking } from "../types";
import { 
  Search, 
  Plus, 
  User, 
  Phone, 
  Mail, 
  History, 
  MoreVertical, 
  Trash2, 
  Edit2, 
  ExternalLink,
  MessageSquare,
  ChevronRight,
  FileText,
  X
} from "lucide-react";
import { cn } from "../lib/utils";
import { motion, AnimatePresence } from "framer-motion";

export default function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form State
  const [newCustomer, setNewCustomer] = useState({
    name: "",
    phone: "",
    email: "",
    notes: ""
  });

  useEffect(() => {
    const customersQuery = query(collection(db, "customers"), orderBy("name", "asc"));
    const bookingsQuery = query(collection(db, "bookings"), orderBy("createdAt", "desc"));

    const unsubscribeCustomers = onSnapshot(customersQuery, (snapshot) => {
      const customersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Customer[];
      setCustomers(customersData);
      setLoading(false);
    });

    const unsubscribeBookings = onSnapshot(bookingsQuery, (snapshot) => {
      const bookingsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Booking[];
      setBookings(bookingsData);
    });

    return () => {
      unsubscribeCustomers();
      unsubscribeBookings();
    };
  }, []);

  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, "customers"), {
        ...newCustomer,
        history: [],
        createdAt: serverTimestamp()
      });
      setIsAddModalOpen(false);
      setNewCustomer({ name: "", phone: "", email: "", notes: "" });
    } catch (error) {
      console.error("Error adding customer:", error);
    }
  };

  const handleDeleteCustomer = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this customer?")) {
      try {
        await deleteDoc(doc(db, "customers", id));
        if (selectedCustomer?.id === id) setSelectedCustomer(null);
      } catch (error) {
        console.error("Error deleting customer:", error);
      }
    }
  };

  const filteredCustomers = customers.filter(customer => 
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone.includes(searchTerm) ||
    customer.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getCustomerBookings = (phone: string) => {
    return bookings.filter(b => b.phone === phone);
  };

  return (
    <div className="h-[calc(100vh-80px)] flex overflow-hidden dark:bg-zinc-950 transition-colors duration-300">
      {/* Sidebar List */}
      <div className="w-96 border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex flex-col">
        <div className="p-6 space-y-4 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">Customers</h1>
            <button 
              onClick={() => setIsAddModalOpen(true)}
              className="w-10 h-10 bg-black dark:bg-white dark:text-black text-white rounded-xl flex items-center justify-center hover:scale-105 transition-transform active:scale-95 shadow-lg shadow-black/10"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 group-focus-within:text-black dark:group-focus-within:text-white transition-colors" />
            <input 
              type="text" 
              placeholder="Search customers..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl font-bold text-sm outline-none focus:border-black dark:focus:border-white focus:ring-4 focus:ring-zinc-100 dark:focus:ring-white/5 transition-all dark:text-white"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2 scrollbar-hide">
          {filteredCustomers.map((customer) => (
            <button
              key={customer.id}
              onClick={() => setSelectedCustomer(customer)}
              className={cn(
                "w-full p-4 rounded-3xl text-left transition-all group relative overflow-hidden",
                selectedCustomer?.id === customer.id 
                  ? "bg-zinc-950 dark:bg-white text-white dark:text-black shadow-xl shadow-black/10" 
                  : "hover:bg-zinc-50 dark:hover:bg-zinc-800 border border-transparent hover:border-zinc-200 dark:hover:border-zinc-700"
              )}
            >
              <div className="flex items-center gap-4">
                <div className={cn(
                  "w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg",
                  selectedCustomer?.id === customer.id 
                    ? "bg-white dark:bg-zinc-950 text-black dark:text-white" 
                    : "bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500"
                )}>
                  {customer.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-black truncate tracking-tight">{customer.name}</p>
                  <p className={cn(
                    "text-[10px] font-black uppercase tracking-widest mt-0.5",
                    selectedCustomer?.id === customer.id 
                      ? "text-zinc-400 dark:text-zinc-500" 
                      : "text-zinc-400 dark:text-zinc-500"
                  )}>
                    {customer.phone}
                  </p>
                </div>
                <ChevronRight className={cn(
                  "w-4 h-4 transition-transform",
                  selectedCustomer?.id === customer.id ? "translate-x-0 opacity-100" : "-translate-x-2 opacity-0 group-hover:translate-x-0 group-hover:opacity-100"
                )} />
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Detail View */}
      <div className="flex-1 bg-zinc-50/50 dark:bg-zinc-950 overflow-y-auto scrollbar-hide">
        <AnimatePresence mode="wait">
          {selectedCustomer ? (
            <motion.div
              key={selectedCustomer.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="p-12 max-w-5xl mx-auto space-y-12"
            >
              {/* Profile Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-8">
                  <div className="w-32 h-32 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2.5rem] flex items-center justify-center text-5xl font-black text-zinc-900 dark:text-white shadow-xl shadow-black/5">
                    {selectedCustomer.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h2 className="text-5xl font-black text-zinc-900 dark:text-white tracking-tighter">{selectedCustomer.name}</h2>
                    <div className="flex items-center gap-6 mt-4">
                      <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400">
                        <Phone className="w-4 h-4" />
                        <span className="text-sm font-bold">{selectedCustomer.phone}</span>
                      </div>
                      {selectedCustomer.email && (
                        <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400">
                          <Mail className="w-4 h-4" />
                          <span className="text-sm font-bold">{selectedCustomer.email}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button className="w-12 h-12 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl flex items-center justify-center hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors shadow-sm">
                    <Edit2 className="w-5 h-5 text-zinc-400 dark:text-zinc-500" />
                  </button>
                  <button 
                    onClick={() => handleDeleteCustomer(selectedCustomer.id)}
                    className="w-12 h-12 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl flex items-center justify-center hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors shadow-sm group"
                  >
                    <Trash2 className="w-5 h-5 text-zinc-400 dark:text-zinc-500 group-hover:text-red-500" />
                  </button>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-6">
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2rem] p-6 shadow-sm">
                  <p className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Total Repairs</p>
                  <p className="text-3xl font-black text-zinc-900 dark:text-white mt-2">{getCustomerBookings(selectedCustomer.phone).length}</p>
                </div>
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2rem] p-6 shadow-sm">
                  <p className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Total Spent</p>
                  <p className="text-3xl font-black text-zinc-900 dark:text-white mt-2">
                    ${getCustomerBookings(selectedCustomer.phone).reduce((acc, b) => acc + b.price, 0)}
                  </p>
                </div>
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2rem] p-6 shadow-sm">
                  <p className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Customer Since</p>
                  <p className="text-3xl font-black text-zinc-900 dark:text-white mt-2">2024</p>
                </div>
              </div>

              {/* History & Notes */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <History className="w-5 h-5 text-zinc-900 dark:text-white" />
                    <h3 className="text-xl font-black text-zinc-900 dark:text-white tracking-tight">Repair History</h3>
                  </div>
                  <div className="space-y-4">
                    {getCustomerBookings(selectedCustomer.phone).map((booking) => (
                      <div key={booking.id} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm flex items-center justify-between group hover:border-black dark:hover:border-white transition-all">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-zinc-50 dark:bg-zinc-800 rounded-xl flex items-center justify-center border border-zinc-100 dark:border-zinc-700">
                            <FileText className="w-5 h-5 text-zinc-400 dark:text-zinc-500" />
                          </div>
                          <div>
                            <p className="text-sm font-black text-zinc-900 dark:text-white">{booking.device}</p>
                            <p className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mt-0.5">{booking.issue}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-black text-zinc-900 dark:text-white">${booking.price}</p>
                          <p className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mt-0.5">{booking.status}</p>
                        </div>
                      </div>
                    ))}
                    {getCustomerBookings(selectedCustomer.phone).length === 0 && (
                      <div className="p-12 text-center bg-zinc-50 dark:bg-zinc-900 rounded-3xl border border-dashed border-zinc-200 dark:border-zinc-800">
                        <p className="text-sm font-bold text-zinc-400 dark:text-zinc-500">No repair history found</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <MessageSquare className="w-5 h-5 text-zinc-900 dark:text-white" />
                    <h3 className="text-xl font-black text-zinc-900 dark:text-white tracking-tight">Internal Notes</h3>
                  </div>
                  <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2.5rem] p-8 shadow-sm h-full min-h-[300px]">
                    <p className="text-sm font-bold text-zinc-600 dark:text-zinc-400 leading-relaxed">
                      {selectedCustomer.notes || "No internal notes for this customer yet."}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-12">
              <div className="w-24 h-24 bg-zinc-100 dark:bg-zinc-900 rounded-[2rem] flex items-center justify-center mb-6">
                <User className="w-10 h-10 text-zinc-300 dark:text-zinc-700" />
              </div>
              <h3 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">Select a Customer</h3>
              <p className="text-sm font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mt-2">Choose from the list to view details</p>
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Add Customer Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-white dark:bg-zinc-900 rounded-[3rem] p-8 shadow-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">New Customer</h2>
                  <p className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mt-1">Create a new profile</p>
                </div>
                <button 
                  onClick={() => setIsAddModalOpen(false)}
                  className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  <X className="w-5 h-5 text-zinc-400 dark:text-zinc-500" />
                </button>
              </div>

              <form onSubmit={handleAddCustomer} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest ml-1">Full Name</label>
                  <input 
                    required
                    type="text" 
                    value={newCustomer.name}
                    onChange={(e) => setNewCustomer({...newCustomer, name: e.target.value})}
                    className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl font-bold text-sm outline-none focus:border-black dark:focus:border-white focus:ring-4 focus:ring-zinc-100 dark:focus:ring-white/5 transition-all dark:text-white"
                    placeholder="Jane Smith"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest ml-1">Phone Number</label>
                    <input 
                      required
                      type="tel" 
                      value={newCustomer.phone}
                      onChange={(e) => setNewCustomer({...newCustomer, phone: e.target.value})}
                      className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl font-bold text-sm outline-none focus:border-black dark:focus:border-white focus:ring-4 focus:ring-zinc-100 dark:focus:ring-white/5 transition-all dark:text-white"
                      placeholder="555-0987"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest ml-1">Email (Optional)</label>
                    <input 
                      type="email" 
                      value={newCustomer.email}
                      onChange={(e) => setNewCustomer({...newCustomer, email: e.target.value})}
                      className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl font-bold text-sm outline-none focus:border-black dark:focus:border-white focus:ring-4 focus:ring-zinc-100 dark:focus:ring-white/5 transition-all dark:text-white"
                      placeholder="jane@example.com"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest ml-1">Internal Notes</label>
                  <textarea 
                    value={newCustomer.notes}
                    onChange={(e) => setNewCustomer({...newCustomer, notes: e.target.value})}
                    className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl font-bold text-sm outline-none focus:border-black dark:focus:border-white focus:ring-4 focus:ring-zinc-100 dark:focus:ring-white/5 transition-all min-h-[100px] resize-none dark:text-white"
                    placeholder="Regular customer, prefers text updates..."
                  />
                </div>

                <button 
                  type="submit"
                  className="w-full py-4 bg-black dark:bg-white text-white dark:text-black rounded-2xl font-black text-sm uppercase tracking-widest hover:scale-[1.02] transition-transform active:scale-95 shadow-xl shadow-black/10 mt-4"
                >
                  Create Profile
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
