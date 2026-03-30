import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, googleProvider, signInWithPopup, db, doc, setDoc, getDoc } from "../lib/firebase";
import { Bot, Mail, Lock, Chrome } from "lucide-react";

export default function Login() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      // Check if user exists in Firestore
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (!userDoc.exists()) {
        // Create initial user profile
        const isAdmin = user.email === "leothomas1916@gmail.com";
        await setDoc(doc(db, "users", user.uid), {
          uid: user.uid,
          name: user.displayName || "User",
          email: user.email,
          role: isAdmin ? "admin" : "user",
          preferences: {},
          createdAt: new Date().toISOString()
        });
      }
      
      navigate("/");
    } catch (error) {
      console.error("Login Error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center p-4 transition-colors duration-300">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-orange-500 rounded-2xl flex items-center justify-center mb-6 shadow-2xl shadow-orange-500/20">
            <Bot className="text-white w-10 h-10" />
          </div>
          <h1 className="text-4xl font-black text-zinc-900 dark:text-white tracking-tighter mb-2">KIRIN AI</h1>
          <p className="text-zinc-500 dark:text-zinc-400 font-medium">Your personal + business automation assistant.</p>
        </div>

        <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 p-8 rounded-3xl backdrop-blur-xl shadow-2xl shadow-black/5 dark:shadow-black/20">
          <div className="space-y-4">
            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 font-bold py-4 rounded-2xl hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-all duration-200 disabled:opacity-50 shadow-lg shadow-black/10 dark:shadow-white/5"
            >
              <Chrome className="w-5 h-5" />
              {loading ? "Signing in..." : "Continue with Google"}
            </button>

            <div className="relative py-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-zinc-200 dark:border-zinc-800"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white dark:bg-zinc-900 px-2 text-zinc-400 dark:text-zinc-500 font-bold tracking-widest">or</span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400 dark:text-zinc-600 group-focus-within:text-orange-500 transition-colors" />
                <input
                  type="email"
                  placeholder="Email address"
                  className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl py-4 pl-12 pr-4 text-zinc-900 dark:text-white focus:outline-none focus:border-orange-500 transition-all"
                />
              </div>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400 dark:text-zinc-600 group-focus-within:text-orange-500 transition-colors" />
                <input
                  type="password"
                  placeholder="Password"
                  className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl py-4 pl-12 pr-4 text-zinc-900 dark:text-white focus:outline-none focus:border-orange-500 transition-all"
                />
              </div>
              <button
                disabled={loading}
                className="w-full bg-orange-500 text-white font-bold py-4 rounded-2xl hover:bg-orange-600 transition-all duration-200 shadow-lg shadow-orange-500/20 disabled:opacity-50"
              >
                Sign In
              </button>
            </div>
          </div>
        </div>

        <p className="text-center text-zinc-500 dark:text-zinc-600 text-sm font-medium">
          Don't have an account? <span className="text-orange-500 cursor-pointer hover:underline">Sign up</span>
        </p>
      </div>
    </div>
  );
}
