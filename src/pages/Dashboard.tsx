import React, { useState, useEffect } from "react";
import { db, auth } from "../firebase";
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, limit } from "firebase/firestore";
import { Booking, Task } from "../types";
import { format } from "date-fns";
import { GoogleGenAI, Type } from "@google/genai";
import { 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Smartphone,
  User,
  Phone,
  Send,
  Sparkles,
  Calendar,
  Bot,
  Globe,
  TrendingUp,
  BarChart3,
  PieChart as PieChartIcon,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend
} from "recharts";
import { cn } from "../lib/utils";

import { useStore } from "../store/useStore";

export default function Dashboard() {
  const { isDarkMode } = useStore();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [latestGmbUpdate, setLatestGmbUpdate] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [command, setCommand] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  // Analytics Data Processing
  const getBookingsByDay = () => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return format(d, "MMM d");
    }).reverse();

    return last7Days.map(day => ({
      name: day,
      bookings: bookings.filter(b => b.createdAt && format(b.createdAt.toDate(), "MMM d") === day).length
    }));
  };

  const getDeviceDistribution = () => {
    const counts: Record<string, number> = {};
    bookings.forEach(b => {
      counts[b.device] = (counts[b.device] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  };

  const getStatusDistribution = () => {
    const counts: Record<string, number> = {};
    bookings.forEach(b => {
      counts[b.status] = (counts[b.status] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  };

  const COLORS = isDarkMode 
    ? ["#ffffff", "#a1a1aa", "#71717a", "#3f3f46", "#27272a"]
    : ["#18181b", "#71717a", "#a1a1aa", "#d4d4d8", "#e4e4e7"];

  useEffect(() => {
    const bookingsQuery = query(collection(db, "bookings"), orderBy("createdAt", "desc"));
    const tasksQuery = query(collection(db, "tasks"), orderBy("createdAt", "desc"));
    const gmbQuery = query(collection(db, "gmb_updates"), orderBy("timestamp", "desc"), limit(1));

    const unsubBookings = onSnapshot(bookingsQuery, (snapshot) => {
      setBookings(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Booking)));
      setLoading(false);
    });

    const unsubTasks = onSnapshot(tasksQuery, (snapshot) => {
      setTasks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task)));
    });

    const unsubGmb = onSnapshot(gmbQuery, (snapshot) => {
      if (!snapshot.empty) {
        setLatestGmbUpdate(snapshot.docs[0].data());
      }
    });

    return () => {
      unsubBookings();
      unsubTasks();
      unsubGmb();
    };
  }, []);

  const handleLearnGMB = async () => {
    setIsProcessing(true);
    try {
      const gmbUrl = "https://maps.app.goo.gl/NKPZfxdhFjksoHE36";
      
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Fetch and summarize key information from this Google My Business profile: ${gmbUrl}. 
        Extract the business name, full address, a list of services offered, and the average rating.`,
        config: {
          tools: [{ urlContext: {} }],
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              businessName: { type: Type.STRING },
              address: { type: Type.STRING },
              services: { 
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              rating: { type: Type.NUMBER },
              summary: { type: Type.STRING }
            },
            required: ["businessName", "address", "services", "rating", "summary"]
          }
        }
      });

      const result = JSON.parse(response.text);
      
      // Store in gmb_updates
      await addDoc(collection(db, "gmb_updates"), {
        type: "summary",
        content: result.summary,
        businessName: result.businessName,
        address: result.address,
        services: result.services,
        rating: result.rating,
        status: "completed",
        timestamp: serverTimestamp()
      });

      // Log the action
      await addDoc(collection(db, "logs"), {
        action: "LEARN_GMB",
        result: `Successfully summarized ${result.businessName}`,
        timestamp: serverTimestamp()
      });

    } catch (error) {
      console.error("GMB Learn Error:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCommand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!command.trim() || isProcessing) return;

    setIsProcessing(true);
    try {
      await addDoc(collection(db, "tasks"), {
        userId: auth.currentUser?.uid,
        command: command,
        status: "pending",
        createdAt: serverTimestamp()
      });

      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            { role: "system", content: "You are Kirin AI, a personal + business automation assistant. Parse the user command and return a structured JSON response with intent and entities. Intents: ADD_BOOKING, CREATE_TASK, GMB_REPLY, GMB_POST, UNKNOWN." },
            { role: "user", content: command }
          ]
        })
      });

      const data = await response.json();
      
      if (command.toLowerCase().includes("booking")) {
        await addDoc(collection(db, "bookings"), {
          customerName: "New Customer",
          phone: "000-000-0000",
          device: "iPhone",
          issue: "Screen Repair",
          status: "received",
          createdAt: serverTimestamp()
        });
      }

      setCommand("");
    } catch (error) {
      console.error("Command Error:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "received": return "bg-blue-50 text-blue-600 border-blue-100";
      case "in-progress": return "bg-amber-50 text-amber-600 border-amber-100";
      case "completed": return "bg-emerald-50 text-emerald-600 border-emerald-100";
      case "delivered": return "bg-zinc-50 text-zinc-600 border-zinc-100";
      default: return "bg-zinc-50 text-zinc-600 border-zinc-100";
    }
  };

  return (
    <div className="space-y-10 pb-20 p-8 bg-zinc-50 dark:bg-zinc-950 min-h-screen transition-colors duration-300">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "Total Bookings", value: bookings.length, icon: Calendar, color: "text-zinc-900 dark:text-zinc-100", bg: "bg-white dark:bg-zinc-900" },
          { label: "Pending Tasks", value: tasks.filter(t => t.status === "pending").length, icon: Clock, color: "text-zinc-900 dark:text-zinc-100", bg: "bg-white dark:bg-zinc-900" },
          { label: "Completed Jobs", value: bookings.filter(b => b.status === "completed").length, icon: CheckCircle2, color: "text-zinc-900 dark:text-zinc-100", bg: "bg-white dark:bg-zinc-900" },
          { label: "GMB Updates", value: "12", icon: Globe, color: "text-zinc-900 dark:text-zinc-100", bg: "bg-white dark:bg-zinc-900" },
        ].map((stat, i) => (
          <div key={i} className={cn("p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col justify-between h-40", stat.bg)}>
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 bg-zinc-50 dark:bg-zinc-800 rounded-xl flex items-center justify-center border border-zinc-100 dark:border-zinc-700">
                <stat.icon className={cn("w-5 h-5", stat.color)} />
              </div>
              <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Live</span>
              </div>
            </div>
            <div>
              <p className="text-3xl font-black text-zinc-900 dark:text-zinc-100 tracking-tighter">{stat.value}</p>
              <p className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mt-1">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>
      
      {/* Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Bookings Trend */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2.5rem] p-8 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-xl font-black text-zinc-900 dark:text-white tracking-tight">Booking Trends</h2>
              <p className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mt-1">Last 7 Days Performance</p>
            </div>
            <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-500 px-3 py-1 rounded-lg border border-emerald-100 dark:border-emerald-500/20">
              <TrendingUp className="w-4 h-4" />
              <span className="text-[10px] font-black uppercase tracking-widest">+12.5%</span>
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={getBookingsByDay()}>
                <defs>
                  <linearGradient id="colorBookings" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={isDarkMode ? '#fff' : '#18181b'} stopOpacity={0.1}/>
                    <stop offset="95%" stopColor={isDarkMode ? '#fff' : '#18181b'} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? '#27272a' : '#f4f4f5'} />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 700, fill: '#a1a1aa' }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 700, fill: '#a1a1aa' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: isDarkMode ? '#fff' : '#18181b', 
                    border: 'none', 
                    borderRadius: '12px',
                    color: isDarkMode ? '#18181b' : '#fff',
                    fontSize: '12px',
                    fontWeight: '700'
                  }}
                  itemStyle={{ color: isDarkMode ? '#18181b' : '#fff' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="bookings" 
                  stroke={isDarkMode ? '#fff' : '#18181b'} 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorBookings)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Device Distribution */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2.5rem] p-8 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-xl font-black text-zinc-900 dark:text-white tracking-tight">Device Distribution</h2>
              <p className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mt-1">Market Share Analysis</p>
            </div>
            <div className="w-10 h-10 bg-zinc-50 dark:bg-zinc-800 rounded-xl flex items-center justify-center border border-zinc-100 dark:border-zinc-700">
              <PieChartIcon className="w-5 h-5 text-zinc-400 dark:text-zinc-500" />
            </div>
          </div>
          <div className="h-[300px] w-full flex items-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={getDeviceDistribution()}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {getDeviceDistribution().map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: isDarkMode ? '#18181b' : '#fff', 
                    border: isDarkMode ? '1px solid #27272a' : '1px solid #f4f4f5', 
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: '700',
                    color: isDarkMode ? '#fff' : '#18181b'
                  }}
                />
                <Legend 
                  verticalAlign="middle" 
                  align="right" 
                  layout="vertical"
                  iconType="circle"
                  formatter={(value) => <span className="text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-widest ml-2">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Column */}
        <div className="lg:col-span-2 space-y-8">
          {/* AI Command Interface */}
          <div className="bg-zinc-900 dark:bg-zinc-900/50 border border-zinc-800 rounded-[2.5rem] p-8 shadow-2xl shadow-zinc-900/20 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <Bot className="w-32 h-32 text-white" />
            </div>
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-md">
                  <Sparkles className="text-orange-400 w-6 h-6" />
                </div>
                <h2 className="text-xl font-black text-white tracking-tight">Kirin Intelligence</h2>
              </div>
              
              <form onSubmit={handleCommand} className="relative flex items-center gap-3 bg-white/5 border border-white/10 p-2 rounded-2xl backdrop-blur-xl">
                <input
                  type="text"
                  value={command}
                  onChange={(e) => setCommand(e.target.value)}
                  placeholder="Ask Kirin to automate your business..."
                  className="flex-1 bg-transparent py-4 px-4 text-white font-bold text-lg focus:outline-none placeholder:text-zinc-600"
                />
                <button 
                  disabled={isProcessing}
                  className="bg-white text-zinc-900 px-8 py-4 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-zinc-200 transition-all disabled:opacity-50"
                >
                  {isProcessing ? "Processing..." : "Execute"}
                </button>
              </form>
              
              <div className="mt-6 flex items-center gap-4">
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Quick Actions:</p>
                <div className="flex gap-2">
                  {["Add Booking", "Reply Reviews", "Post Update"].map(action => (
                    <button key={action} className="text-[10px] font-bold text-zinc-400 border border-white/5 px-3 py-1.5 rounded-lg hover:bg-white/5 transition-colors">
                      {action}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Bookings Table */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2.5rem] overflow-hidden shadow-sm">
            <div className="p-8 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
              <h2 className="text-xl font-black text-zinc-900 dark:text-white tracking-tight">Active Bookings</h2>
              <button className="w-10 h-10 bg-zinc-50 dark:bg-zinc-800 rounded-xl flex items-center justify-center hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors border border-zinc-100 dark:border-zinc-700">
                <Filter className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-zinc-50/50 dark:bg-zinc-800/50">
                    <th className="px-8 py-5 text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.2em]">Customer</th>
                    <th className="px-8 py-5 text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.2em]">Device</th>
                    <th className="px-8 py-5 text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.2em]">Status</th>
                    <th className="px-8 py-5 text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.2em]">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800">
                  {bookings.map((booking) => (
                    <tr key={booking.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/50 transition-colors group cursor-pointer">
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-zinc-100 dark:bg-zinc-800 rounded-2xl flex items-center justify-center group-hover:bg-white dark:group-hover:bg-zinc-700 transition-colors border border-transparent group-hover:border-zinc-200 dark:group-hover:border-zinc-600">
                            <User className="w-6 h-6 text-zinc-400 dark:text-zinc-500" />
                          </div>
                          <div>
                            <p className="font-black text-zinc-900 dark:text-white tracking-tight">{booking.customerName}</p>
                            <p className="text-xs font-bold text-zinc-400 dark:text-zinc-500 mt-0.5">{booking.phone}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-3">
                          <Smartphone className="w-5 h-5 text-zinc-300 dark:text-zinc-600" />
                          <div>
                            <p className="text-sm font-black text-zinc-900 dark:text-white">{booking.device}</p>
                            <p className="text-[11px] font-bold text-zinc-400 dark:text-zinc-500">{booking.issue}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <span className={cn(
                          "px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border",
                          getStatusColor(booking.status)
                        )}>
                          {booking.status}
                        </span>
                      </td>
                      <td className="px-8 py-6">
                        <p className="text-sm font-bold text-zinc-400 dark:text-zinc-500">
                          {booking.createdAt ? format(booking.createdAt.toDate(), "MMM d") : "Today"}
                        </p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Sidebar Column */}
        <div className="space-y-8">
          {/* GMB Intelligence Card */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2.5rem] p-8 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-lg font-black text-zinc-900 dark:text-white tracking-tight">GMB Insights</h2>
              <button 
                onClick={handleLearnGMB}
                disabled={isProcessing}
                className="w-10 h-10 bg-orange-50 dark:bg-orange-500/10 rounded-xl flex items-center justify-center hover:bg-orange-100 dark:hover:bg-orange-500/20 transition-colors border border-orange-100 dark:border-orange-500/20"
              >
                <Globe className="w-5 h-5 text-orange-500" />
              </button>
            </div>
            
            {latestGmbUpdate ? (
              <div className="space-y-6">
                <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl p-5 border border-zinc-100 dark:border-zinc-800">
                  <h3 className="text-sm font-black text-zinc-900 dark:text-white mb-2">{latestGmbUpdate.businessName}</h3>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 font-medium leading-relaxed italic">
                    "{latestGmbUpdate.content}"
                  </p>
                  <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-3 font-bold">{latestGmbUpdate.address}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                    <p className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-1">Rating</p>
                    <p className="text-xl font-black text-zinc-900 dark:text-white">{latestGmbUpdate.rating}/5.0</p>
                  </div>
                  <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                    <p className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-1">Services</p>
                    <p className="text-xl font-black text-zinc-900 dark:text-white">{latestGmbUpdate.services?.length || 0}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {latestGmbUpdate.services?.slice(0, 3).map((service: string, idx: number) => (
                    <span key={idx} className="text-[9px] font-black uppercase tracking-widest px-2 py-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 rounded-md">
                      {service}
                    </span>
                  ))}
                </div>
                <button className="w-full py-4 bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-all">
                  Full Analysis
                </button>
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-zinc-50 dark:bg-zinc-800 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-zinc-100 dark:border-zinc-700">
                  <Globe className="w-8 h-8 text-zinc-200 dark:text-zinc-700" />
                </div>
                <p className="text-sm font-bold text-zinc-400 dark:text-zinc-500">No GMB data collected yet.</p>
                <button 
                  onClick={handleLearnGMB}
                  className="mt-4 text-xs font-black text-orange-500 uppercase tracking-widest hover:underline"
                >
                  Collect Now
                </button>
              </div>
            )}
          </div>
          
          {/* Status Breakdown */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2.5rem] p-8 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-lg font-black text-zinc-900 dark:text-white tracking-tight">Status Breakdown</h2>
              <div className="w-10 h-10 bg-zinc-50 dark:bg-zinc-800 rounded-xl flex items-center justify-center border border-zinc-100 dark:border-zinc-700">
                <BarChart3 className="w-5 h-5 text-zinc-400 dark:text-zinc-500" />
              </div>
            </div>
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={getStatusDistribution()}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? '#27272a' : '#f4f4f5'} />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 8, fontWeight: 700, fill: '#a1a1aa' }}
                  />
                  <Tooltip 
                    cursor={{ fill: isDarkMode ? '#27272a' : '#f4f4f5' }}
                    contentStyle={{ 
                      backgroundColor: isDarkMode ? '#fff' : '#18181b', 
                      border: 'none', 
                      borderRadius: '12px',
                      color: isDarkMode ? '#18181b' : '#fff',
                      fontSize: '10px',
                      fontWeight: '700'
                    }}
                  />
                  <Bar dataKey="value" fill={isDarkMode ? '#fff' : '#18181b'} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-8 space-y-4">
              <div className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-white dark:bg-zinc-800 rounded-lg flex items-center justify-center border border-zinc-200 dark:border-zinc-700">
                    <ArrowUpRight className="w-4 h-4 text-emerald-500" />
                  </div>
                  <p className="text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">Avg. Repair Time</p>
                </div>
                <p className="text-sm font-black text-zinc-900 dark:text-white">2.4 Days</p>
              </div>
              <div className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-white dark:bg-zinc-800 rounded-lg flex items-center justify-center border border-zinc-200 dark:border-zinc-700">
                    <ArrowDownRight className="w-4 h-4 text-red-500" />
                  </div>
                  <p className="text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">Bounce Rate</p>
                </div>
                <p className="text-sm font-black text-zinc-900 dark:text-white">14.2%</p>
              </div>
            </div>
          </div>

          {/* Intelligence Log */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2.5rem] p-8 shadow-sm">
            <h2 className="text-lg font-black text-zinc-900 dark:text-white tracking-tight mb-8">Intelligence Log</h2>
            <div className="space-y-8">
              {tasks.slice(0, 5).map((task) => (
                <div key={task.id} className="flex gap-5 relative group">
                  <div className="flex flex-col items-center">
                    <div className={cn(
                      "w-10 h-10 rounded-2xl flex items-center justify-center z-10 shadow-sm border",
                      task.status === "completed" ? "bg-white dark:bg-zinc-800 text-emerald-500 border-emerald-100 dark:border-emerald-500/20" : "bg-white dark:bg-zinc-800 text-amber-500 border-amber-100 dark:border-amber-500/20"
                    )}>
                      {task.status === "completed" ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                    </div>
                    <div className="w-px h-full bg-zinc-100 dark:bg-zinc-800 absolute top-10 left-5 -z-0"></div>
                  </div>
                  <div className="flex-1 pb-8">
                    <p className="text-sm font-black text-zinc-900 dark:text-white leading-tight">"{task.command}"</p>
                    <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 mt-2 uppercase tracking-widest">
                      {task.status === "completed" ? "Success" : "In Progress"} • {task.createdAt ? format(task.createdAt.toDate(), "h:mm a") : "Just now"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
