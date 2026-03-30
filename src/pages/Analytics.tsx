import { useState, useEffect } from "react";
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot 
} from "firebase/firestore";
import { db } from "../firebase";
import { Booking } from "../types";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  Smartphone, 
  Clock, 
  Calendar, 
  ArrowUpRight, 
  ArrowDownRight,
  BarChart3,
  PieChart as PieChartIcon
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
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import { cn } from "../lib/utils";

export default function Analytics() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const checkDarkMode = () => {
      setIsDarkMode(document.documentElement.classList.contains('dark'));
    };
    checkDarkMode();
    
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    
    return () => observer.disconnect();
  }, []);

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

  const getRevenueByDay = () => {
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const d = subDays(new Date(), i);
      return format(d, "MMM d");
    }).reverse();

    return last30Days.map(day => {
      const dayBookings = bookings.filter(b => b.createdAt && format(b.createdAt.toDate(), "MMM d") === day);
      return {
        name: day,
        revenue: dayBookings.reduce((acc, b) => acc + b.price, 0),
        bookings: dayBookings.length
      };
    });
  };

  const getDeviceStats = () => {
    const counts: Record<string, number> = {};
    bookings.forEach(b => {
      counts[b.device] = (counts[b.device] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  };

  const getIssueStats = () => {
    const counts: Record<string, number> = {};
    bookings.forEach(b => {
      const issue = b.issue.split(",")[0].trim();
      counts[issue] = (counts[issue] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  };

  const COLORS = isDarkMode 
    ? ["#ffffff", "#a1a1aa", "#71717a", "#3f3f46", "#27272a"]
    : ["#18181b", "#71717a", "#a1a1aa", "#d4d4d8", "#e4e4e7"];

  const totalRevenue = bookings.reduce((acc, b) => acc + b.price, 0);
  const avgTicket = bookings.length > 0 ? (totalRevenue / bookings.length).toFixed(2) : 0;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 min-h-screen transition-colors duration-300 dark:bg-zinc-950">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-zinc-900 dark:text-white tracking-tight">Analytics</h1>
          <p className="text-sm font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mt-1">Deep insights into business performance</p>
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all">
            Last 30 Days
          </button>
          <button className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-black/10">
            Export Report
          </button>
        </div>
      </div>

      {/* High-Level Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2.5rem] p-8 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl flex items-center justify-center border border-emerald-100 dark:border-emerald-500/20">
              <DollarSign className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="flex items-center gap-1 text-emerald-500">
              <TrendingUp className="w-4 h-4" />
              <span className="text-[10px] font-black uppercase tracking-widest">+12%</span>
            </div>
          </div>
          <p className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Total Revenue</p>
          <p className="text-3xl font-black text-zinc-900 dark:text-white tracking-tighter mt-1">${totalRevenue.toLocaleString()}</p>
        </div>
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2.5rem] p-8 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 bg-blue-50 dark:bg-blue-500/10 rounded-xl flex items-center justify-center border border-blue-100 dark:border-blue-500/20">
              <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex items-center gap-1 text-blue-500">
              <TrendingUp className="w-4 h-4" />
              <span className="text-[10px] font-black uppercase tracking-widest">+8%</span>
            </div>
          </div>
          <p className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Active Customers</p>
          <p className="text-3xl font-black text-zinc-900 dark:text-white tracking-tighter mt-1">842</p>
        </div>
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2.5rem] p-8 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 bg-zinc-950 dark:bg-white rounded-xl flex items-center justify-center">
              <Clock className="w-5 h-5 text-white dark:text-black" />
            </div>
            <div className="flex items-center gap-1 text-red-500">
              <TrendingDown className="w-4 h-4" />
              <span className="text-[10px] font-black uppercase tracking-widest">-2%</span>
            </div>
          </div>
          <p className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Avg. Ticket</p>
          <p className="text-3xl font-black text-zinc-900 dark:text-white tracking-tighter mt-1">${avgTicket}</p>
        </div>
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2.5rem] p-8 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 bg-amber-50 dark:bg-amber-500/10 rounded-xl flex items-center justify-center border border-amber-100 dark:border-amber-500/20">
              <Smartphone className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="flex items-center gap-1 text-emerald-500">
              <TrendingUp className="w-4 h-4" />
              <span className="text-[10px] font-black uppercase tracking-widest">+15%</span>
            </div>
          </div>
          <p className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Repairs Done</p>
          <p className="text-3xl font-black text-zinc-900 dark:text-white tracking-tighter mt-1">{bookings.length}</p>
        </div>
      </div>

      {/* Revenue Chart */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[3rem] p-10 shadow-sm">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h2 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">Revenue Growth</h2>
            <p className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mt-1">Last 30 Days Trend</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-zinc-900 dark:bg-white" />
              <span className="text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">Revenue</span>
            </div>
          </div>
        </div>
        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={getRevenueByDay()}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={isDarkMode ? "#ffffff" : "#18181b"} stopOpacity={0.1}/>
                  <stop offset="95%" stopColor={isDarkMode ? "#ffffff" : "#18181b"} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? "#27272a" : "#f4f4f5"} />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fontWeight: 700, fill: isDarkMode ? '#71717a' : '#a1a1aa' }}
                dy={10}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fontWeight: 700, fill: isDarkMode ? '#71717a' : '#a1a1aa' }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: isDarkMode ? '#ffffff' : '#18181b', 
                  border: 'none', 
                  borderRadius: '16px',
                  color: isDarkMode ? '#000000' : '#ffffff',
                  fontSize: '12px',
                  fontWeight: '700',
                  padding: '12px'
                }}
                itemStyle={{ color: isDarkMode ? '#000000' : '#ffffff' }}
              />
              <Area 
                type="monotone" 
                dataKey="revenue" 
                stroke={isDarkMode ? "#ffffff" : "#18181b"} 
                strokeWidth={4}
                fillOpacity={1} 
                fill="url(#colorRevenue)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Distribution Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[3rem] p-10 shadow-sm">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">Top Devices</h2>
              <p className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mt-1">Popular Repair Models</p>
            </div>
            <div className="w-12 h-12 bg-zinc-50 dark:bg-zinc-800 rounded-2xl flex items-center justify-center border border-zinc-100 dark:border-zinc-700">
              <PieChartIcon className="w-6 h-6 text-zinc-400 dark:text-zinc-500" />
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={getDeviceStats()}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={120}
                  paddingAngle={8}
                  dataKey="value"
                >
                  {getDeviceStats().map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: isDarkMode ? '#18181b' : '#ffffff', 
                    border: isDarkMode ? '1px solid #27272a' : '1px solid #f4f4f5', 
                    borderRadius: '16px',
                    fontSize: '12px',
                    fontWeight: '700',
                    color: isDarkMode ? '#ffffff' : '#000000'
                  }}
                  itemStyle={{ color: isDarkMode ? '#ffffff' : '#000000' }}
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

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[3rem] p-10 shadow-sm">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">Common Issues</h2>
              <p className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mt-1">Problem Classification</p>
            </div>
            <div className="w-12 h-12 bg-zinc-50 dark:bg-zinc-800 rounded-2xl flex items-center justify-center border border-zinc-100 dark:border-zinc-700">
              <BarChart3 className="w-6 h-6 text-zinc-400 dark:text-zinc-500" />
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={getIssueStats()} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={isDarkMode ? "#27272a" : "#f4f4f5"} />
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 700, fill: isDarkMode ? '#71717a' : '#a1a1aa' }}
                  width={100}
                />
                <Tooltip 
                  cursor={{ fill: isDarkMode ? '#27272a' : '#f4f4f5' }}
                  contentStyle={{ 
                    backgroundColor: isDarkMode ? '#ffffff' : '#18181b', 
                    border: 'none', 
                    borderRadius: '16px',
                    color: isDarkMode ? '#000000' : '#ffffff',
                    fontSize: '12px',
                    fontWeight: '700'
                  }}
                  itemStyle={{ color: isDarkMode ? '#000000' : '#ffffff' }}
                />
                <Bar dataKey="value" fill={isDarkMode ? "#ffffff" : "#18181b"} radius={[0, 8, 8, 0]} barSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
