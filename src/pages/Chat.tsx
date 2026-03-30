import React, { useState, useEffect, useRef } from "react";
import { Bot, User, Send, Sparkles, Trash2, MoreVertical } from "lucide-react";
import { cn } from "../lib/utils";
import { auth } from "../lib/firebase";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: "Hello! I'm Kirin AI. How can I help you today? I can manage your bookings, reply to GMB reviews, or help with personal tasks.",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: messages.concat(userMessage).map(m => ({
            role: m.role,
            content: m.content
          }))
        })
      });

      const data = await response.json();
      const aiContent = data.choices?.[0]?.message?.content || "I'm sorry, I encountered an error.";

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: aiContent,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Chat Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-[calc(100vh-14rem)] flex flex-col bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2.5rem] shadow-xl overflow-hidden transition-colors duration-300">
      {/* Chat Header */}
      <div className="p-8 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/30 dark:bg-zinc-900/50">
        <div className="flex items-center gap-5">
          <div className="w-14 h-14 bg-zinc-900 dark:bg-white rounded-2xl flex items-center justify-center shadow-lg shadow-zinc-900/10">
            <Bot className="text-white dark:text-black w-8 h-8" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tighter">Kirin Intelligence</h2>
            <div className="flex items-center gap-2 mt-1">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
              <span className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.2em]">Neural Link Active</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="w-10 h-10 bg-zinc-100 dark:bg-zinc-800 rounded-xl flex items-center justify-center hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-500 transition-all">
            <Trash2 className="w-5 h-5 text-zinc-500 dark:text-zinc-400" />
          </button>
          <button className="w-10 h-10 bg-zinc-100 dark:bg-zinc-800 rounded-xl flex items-center justify-center hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all">
            <MoreVertical className="w-5 h-5 text-zinc-500 dark:text-zinc-400" />
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-10 space-y-10 scroll-smooth bg-white dark:bg-zinc-950"
      >
        {messages.map((message) => (
          <div 
            key={message.id}
            className={cn(
              "flex gap-6 max-w-4xl",
              message.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
            )}
          >
            <div className={cn(
              "w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm border",
              message.role === "assistant" 
                ? "bg-zinc-900 dark:bg-white text-white dark:text-black border-zinc-900 dark:border-white" 
                : "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white border-zinc-200 dark:border-zinc-800"
            )}>
              {message.role === "assistant" ? <Bot className="w-6 h-6" /> : <User className="w-6 h-6" />}
            </div>
            <div className={cn(
              "p-6 rounded-[2rem] text-sm font-bold leading-relaxed shadow-sm border",
              message.role === "assistant" 
                ? "bg-zinc-50 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 border-zinc-100 dark:border-zinc-800 rounded-tl-none" 
                : "bg-zinc-900 dark:bg-white text-white dark:text-black border-zinc-800 dark:border-zinc-200 rounded-tr-none"
            )}>
              {message.content}
              <div className={cn(
                "mt-4 text-[10px] font-black uppercase tracking-widest opacity-30",
                message.role === "user" ? "text-right" : "text-left"
              )}>
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex gap-6 max-w-4xl mr-auto">
            <div className="w-12 h-12 rounded-2xl bg-zinc-900 dark:bg-white text-white dark:text-black flex items-center justify-center flex-shrink-0 animate-pulse">
              <Bot className="w-6 h-6" />
            </div>
            <div className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 p-6 rounded-[2rem] rounded-tl-none flex items-center gap-2">
              <div className="w-2 h-2 bg-zinc-300 dark:bg-zinc-600 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-zinc-300 dark:bg-zinc-600 rounded-full animate-bounce [animation-delay:0.2s]"></div>
              <div className="w-2 h-2 bg-zinc-300 dark:bg-zinc-600 rounded-full animate-bounce [animation-delay:0.4s]"></div>
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-8 bg-zinc-50/50 dark:bg-zinc-900/50 border-t border-zinc-100 dark:border-zinc-800">
        <form onSubmit={handleSend} className="relative group max-w-5xl mx-auto">
          <div className="absolute -inset-1 bg-zinc-900/5 dark:bg-white/5 rounded-3xl blur opacity-0 group-focus-within:opacity-100 transition duration-1000"></div>
          <div className="relative flex items-center gap-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3 rounded-2xl shadow-xl shadow-zinc-200/50 dark:shadow-none">
            <div className="pl-4">
              <Sparkles className="w-6 h-6 text-orange-500" />
            </div>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Command Kirin AI..."
              className="flex-1 bg-transparent py-4 px-2 text-zinc-900 dark:text-white font-bold text-lg focus:outline-none placeholder:text-zinc-300 dark:placeholder:text-zinc-600"
            />
            <button 
              disabled={isLoading || !input.trim()}
              className="bg-zinc-900 dark:bg-white text-white dark:text-black px-8 py-4 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-all disabled:opacity-50 shadow-lg shadow-zinc-900/20 dark:shadow-none"
            >
              Send
            </button>
          </div>
        </form>
        <p className="text-center text-[10px] text-zinc-400 dark:text-zinc-500 mt-6 font-black uppercase tracking-[0.2em]">
          Neural Link Active • Kirin AI v2.5
        </p>
      </div>
    </div>
  );
}
