import { useState, useRef, useEffect } from "react";
import { Send, Bot, X, Sparkles, Command, MessageSquare, Plus, CheckCircle2, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "../lib/utils";
import { processAICommand } from "../services/aiService";
import { db } from "../firebase";
import { collection, addDoc, serverTimestamp, query, orderBy, onSnapshot } from "firebase/firestore";
import { Booking } from "../types";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  action?: any;
}

export default function AIChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hello! I'm Kirin AI. How can I help you manage your CRM today?",
      timestamp: new Date()
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const q = query(collection(db, "bookings"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const bookingsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Booking[];
      setBookings(bookingsData);
    });

    return () => unsubscribe();
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      role: "user",
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const aiResponse = await processAICommand(input, { bookings });
      
      const assistantMessage: Message = {
        role: "assistant",
        content: aiResponse.message,
        timestamp: new Date(),
        action: aiResponse.action
      };

      setMessages(prev => [...prev, assistantMessage]);
      
      // Execute actions if any
      if (aiResponse.intent === "create_booking" && aiResponse.action) {
        await addDoc(collection(db, "bookings"), {
          ...aiResponse.action,
          createdAt: serverTimestamp()
        });
      }
    } catch (error) {
      console.error("Chat Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(true)}
        className={cn(
          "fixed bottom-8 right-8 w-16 h-16 bg-black dark:bg-white text-white dark:text-black rounded-2xl flex items-center justify-center shadow-2xl z-50 transition-all duration-300",
          isOpen && "scale-0 opacity-0"
        )}
      >
        <Bot className="w-8 h-8" />
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white dark:border-zinc-950 animate-pulse" />
      </motion.button>

      {/* Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-8 right-8 w-[450px] h-[650px] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2.5rem] shadow-2xl flex flex-col z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="p-6 bg-zinc-950 dark:bg-black text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white dark:bg-zinc-100 rounded-xl flex items-center justify-center">
                  <Bot className="w-6 h-6 text-black" />
                </div>
                <div>
                  <h3 className="font-black text-lg tracking-tight">Kirin AI Assistant</h3>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                    <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Online & Ready</span>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-zinc-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
              {messages.map((msg, i) => (
                <motion.div
                  initial={{ opacity: 0, x: msg.role === "user" ? 20 : -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  key={i}
                  className={cn(
                    "flex flex-col gap-2",
                    msg.role === "user" ? "items-end" : "items-start"
                  )}
                >
                  <div className={cn(
                    "max-w-[85%] p-4 rounded-2xl text-sm font-bold leading-relaxed",
                    msg.role === "user" 
                      ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-tr-none" 
                      : "bg-zinc-950 dark:bg-black text-white rounded-tl-none shadow-lg"
                  )}>
                    {msg.content}
                  </div>
                  <span className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest px-1">
                    {msg.role === "user" ? "You" : "Kirin AI"} • {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </motion.div>
              ))}
              {isLoading && (
                <div className="flex items-center gap-2 text-zinc-400 dark:text-zinc-500">
                  <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 bg-zinc-400 dark:bg-zinc-600 rounded-full animate-bounce" />
                    <div className="w-1.5 h-1.5 bg-zinc-400 dark:bg-zinc-600 rounded-full animate-bounce [animation-delay:0.2s]" />
                    <div className="w-1.5 h-1.5 bg-zinc-400 dark:bg-zinc-600 rounded-full animate-bounce [animation-delay:0.4s]" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest">Kirin is thinking...</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-6 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
              <div className="flex items-center gap-3 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 p-2 rounded-2xl shadow-sm focus-within:border-black dark:focus-within:border-white transition-all">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  placeholder="Ask Kirin to add a booking, show jobs..."
                  className="flex-1 bg-transparent border-none outline-none px-3 py-2 text-sm font-bold text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400"
                />
                <button 
                  onClick={handleSend}
                  disabled={isLoading || !input.trim()}
                  className="w-10 h-10 bg-black dark:bg-white text-white dark:text-black rounded-xl flex items-center justify-center hover:scale-105 transition-transform active:scale-95 disabled:opacity-50 disabled:scale-100"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
              <div className="mt-4 flex items-center gap-4 overflow-x-auto pb-2 scrollbar-hide">
                <button className="flex-shrink-0 flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-full text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-widest hover:border-black dark:hover:border-white hover:text-black dark:hover:text-white transition-all">
                  <Plus className="w-3 h-3" />
                  Add Booking
                </button>
                <button className="flex-shrink-0 flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-full text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-widest hover:border-black dark:hover:border-white hover:text-black dark:hover:text-white transition-all">
                  <CheckCircle2 className="w-3 h-3" />
                  Show Jobs
                </button>
                <button className="flex-shrink-0 flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-full text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-widest hover:border-black dark:hover:border-white hover:text-black dark:hover:text-white transition-all">
                  <AlertCircle className="w-3 h-3" />
                  Pending
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
