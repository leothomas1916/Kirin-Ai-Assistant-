import { useState, useEffect } from "react";
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  doc,
  getDoc
} from "firebase/firestore";
import { db, auth } from "../lib/firebase";
import { 
  Globe, 
  Star, 
  MessageSquare, 
  Send, 
  Sparkles, 
  Bot, 
  RefreshCw,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Lock
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "../lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

interface Review {
  name: string; // Google's review name format: accounts/{accountId}/locations/{locationId}/reviews/{reviewId}
  reviewer: {
    displayName: string;
    profilePhotoUrl?: string;
  };
  starRating: string; // "FIVE", "FOUR", etc.
  comment: string;
  createTime: string;
  reviewReply?: {
    comment: string;
    updateTime: string;
  };
}

const ratingToNumber = (rating: string) => {
  const map: Record<string, number> = {
    "FIVE": 5,
    "FOUR": 4,
    "THREE": 3,
    "TWO": 2,
    "ONE": 1
  };
  return map[rating] || 0;
};

export default function GMB() {
  const [activeTab, setActiveTab] = useState<"reviews" | "automation" | "logs">("reviews");
  const [reviews, setReviews] = useState<Review[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>({
    autoReplyEnabled: false,
    minRating: 4,
    replyStyle: "professional"
  });
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isBulkReplying, setIsBulkReplying] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [locationName, setLocationName] = useState<string | null>(null);

  useEffect(() => {
    const checkConnection = async () => {
      if (!auth.currentUser) return;
      try {
        const tokenDoc = await getDoc(doc(db, "gmb_tokens", auth.currentUser.uid));
        setIsConnected(tokenDoc.exists());
        if (tokenDoc.exists()) {
          fetchGMBData();
          fetchSettings();
          fetchLogs();
        } else {
          setLoading(false);
        }
      } catch (error) {
        console.error("Error checking GMB connection:", error);
        setLoading(false);
      }
    };

    checkConnection();

    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
        setIsConnected(true);
        fetchGMBData();
        fetchSettings();
        fetchLogs();
        toast.success("Google Business Profile connected!");
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const fetchSettings = async () => {
    if (!auth.currentUser) return;
    try {
      const settingsDoc = await getDoc(doc(db, "gmb_settings", auth.currentUser.uid));
      if (settingsDoc.exists()) {
        setSettings(settingsDoc.data());
      }
    } catch (error) {
      console.error("Error fetching GMB settings:", error);
    }
  };

  const fetchLogs = async () => {
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const response = await fetch("/api/gmb/logs", {
        headers: { Authorization: `Bearer ${idToken}` }
      });
      const data = await response.json();
      setLogs(data);
    } catch (error) {
      console.error("Error fetching GMB logs:", error);
    }
  };

  const saveSettings = async (newSettings: any) => {
    if (!auth.currentUser) return;
    try {
      const idToken = await auth.currentUser?.getIdToken();
      // We can use direct Firestore for settings since rules allow it
      const { setDoc, doc, serverTimestamp } = await import("firebase/firestore");
      await setDoc(doc(db, "gmb_settings", auth.currentUser.uid), {
        ...newSettings,
        updatedAt: serverTimestamp()
      });
      setSettings(newSettings);
      toast.success("Settings saved successfully");
    } catch (error) {
      console.error("Error saving GMB settings:", error);
      toast.error("Failed to save settings");
    }
  };

  const handleBulkAutoReply = async () => {
    setIsBulkReplying(true);
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const response = await fetch("/api/gmb/bulk-auto-reply", {
        method: "POST",
        headers: { Authorization: `Bearer ${idToken}` }
      });
      const data = await response.json();
      if (response.ok) {
        toast.success(`Automation complete! Replied to ${data.totalReplied} reviews.`);
        fetchGMBData();
        fetchLogs();
      } else {
        throw new Error(data.error || "Bulk reply failed");
      }
    } catch (error: any) {
      console.error("Error in bulk auto-reply:", error);
      toast.error(error.message || "Bulk auto-reply failed");
    } finally {
      setIsBulkReplying(false);
    }
  };

  const fetchGMBData = async () => {
    setLoading(true);
    try {
      const idToken = await auth.currentUser?.getIdToken();
      
      // 1. Get Accounts
      const accountsRes = await fetch("/api/gmb/accounts", {
        headers: { Authorization: `Bearer ${idToken}` }
      });
      const accountsData = await accountsRes.json();
      if (!accountsData.accounts || accountsData.accounts.length === 0) {
        setLoading(false);
        return;
      }
      const accountId = accountsData.accounts[0].name;

      // 2. Get Locations
      const locationsRes = await fetch(`/api/gmb/locations?accountId=${accountId}`, {
        headers: { Authorization: `Bearer ${idToken}` }
      });
      const locationsData = await locationsRes.json();
      if (!locationsData.locations || locationsData.locations.length === 0) {
        setLoading(false);
        return;
      }
      const locName = locationsData.locations[0].name;
      setLocationName(locName);

      // 3. Get Reviews
      const reviewsRes = await fetch(`/api/gmb/reviews?locationName=${locName}`, {
        headers: { Authorization: `Bearer ${idToken}` }
      });
      const reviewsData = await reviewsRes.json();
      setReviews(reviewsData.reviews || []);
    } catch (error) {
      console.error("Error fetching GMB data:", error);
      toast.error("Failed to fetch GMB data");
    } finally {
      setLoading(false);
    }
  };

  const handleConnectGMB = async () => {
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const response = await fetch("/api/auth/gmb/url", {
        headers: { Authorization: `Bearer ${idToken}` }
      });
      const { url } = await response.json();
      window.open(url, "gmb_auth", "width=600,height=700");
    } catch (error) {
      console.error("Error starting GMB auth:", error);
      toast.error("Failed to start authentication");
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchGMBData();
    setIsRefreshing(false);
  };

  const handleGenerateReply = async (review: Review) => {
    setIsGenerating(true);
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`
        },
        body: JSON.stringify({
          messages: [
            { role: "system", content: "Write a professional and polite reply to this customer review. Keep it concise and helpful." },
            { role: "user", content: review.comment || "No comment provided, just a rating." }
          ]
        })
      });
      const data = await response.json();
      setReplyText(data.choices[0].message.content);
    } catch (error) {
      console.error("Error generating AI reply:", error);
      toast.error("Failed to generate AI reply");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSendReply = async (reviewName: string) => {
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const response = await fetch("/api/gmb/reply", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`
        },
        body: JSON.stringify({ reviewName, replyText })
      });
      
      if (response.ok) {
        toast.success("Reply posted successfully!");
        setReviews(prev => prev.map(r => r.name === reviewName ? { ...r, reviewReply: { comment: replyText, updateTime: new Date().toISOString() } } : r));
        setReplyingTo(null);
        setReplyText("");
      } else {
        throw new Error("Failed to post reply");
      }
    } catch (error) {
      console.error("Error sending reply:", error);
      toast.error("Failed to post reply to Google");
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-white dark:bg-zinc-950">
        <Loader2 className="w-12 h-12 text-orange-500 animate-spin" />
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="p-8 max-w-4xl mx-auto h-[80vh] flex flex-col items-center justify-center text-center space-y-8">
        <div className="w-24 h-24 bg-zinc-100 dark:bg-zinc-900 rounded-[2rem] flex items-center justify-center shadow-2xl">
          <Globe className="w-12 h-12 text-zinc-400 dark:text-zinc-600" />
        </div>
        <div className="space-y-4">
          <h1 className="text-4xl font-black text-zinc-900 dark:text-white tracking-tight">Connect GMB</h1>
          <p className="text-zinc-500 dark:text-zinc-400 font-bold max-w-md mx-auto">
            Integrate your Google Business Profile to automate review replies, manage your presence, and gain AI-powered insights.
          </p>
        </div>
        <button 
          onClick={handleConnectGMB}
          className="bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 px-10 py-5 rounded-[2rem] font-black text-sm uppercase tracking-widest hover:scale-105 transition-all active:scale-95 shadow-2xl shadow-black/20"
        >
          Connect Google Business Profile
        </button>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 bg-white dark:bg-zinc-950 min-h-screen transition-colors duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-zinc-950 dark:bg-white rounded-[1.5rem] flex items-center justify-center shadow-xl shadow-black/10">
            <Globe className="w-8 h-8 text-white dark:text-zinc-950" />
          </div>
          <div>
            <h1 className="text-4xl font-black text-zinc-900 dark:text-white tracking-tight">GMB Intelligence</h1>
            <p className="text-sm font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mt-1">Manage reviews & business presence</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleRefresh}
            className="flex items-center justify-center gap-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-6 py-3 rounded-2xl font-black text-sm uppercase tracking-widest text-zinc-900 dark:text-white hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-all active:scale-95 shadow-sm"
          >
            <RefreshCw className={cn("w-5 h-5", isRefreshing && "animate-spin")} />
            Sync
          </button>
          <button 
            onClick={handleBulkAutoReply}
            disabled={isBulkReplying}
            className="flex items-center justify-center gap-2 bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 px-6 py-3 rounded-2xl font-black text-sm uppercase tracking-widest hover:scale-105 transition-all active:scale-95 shadow-xl shadow-black/10 disabled:opacity-50"
          >
            {isBulkReplying ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
            Auto-Reply All
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 p-1 bg-zinc-100 dark:bg-zinc-900 rounded-2xl w-fit">
        {[
          { id: "reviews", label: "Reviews", icon: MessageSquare },
          { id: "automation", label: "Automation", icon: Bot },
          { id: "logs", label: "History", icon: RefreshCw }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              "flex items-center gap-2 px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all",
              activeTab === tab.id 
                ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm" 
                : "text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-400"
            )}
          >
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "reviews" && (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2.5rem] p-8 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <p className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Average Rating</p>
                <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
              </div>
              <p className="text-4xl font-black text-zinc-900 dark:text-white tracking-tighter">
                {(reviews.reduce((acc, r) => acc + ratingToNumber(r.starRating), 0) / (reviews.length || 1)).toFixed(1)}
              </p>
              <div className="flex gap-1 mt-2">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} className={cn("w-3 h-3", s <= Math.round(reviews.reduce((acc, r) => acc + ratingToNumber(r.starRating), 0) / (reviews.length || 1)) ? "text-amber-400 fill-amber-400" : "text-zinc-200 dark:text-zinc-700")} />
                ))}
              </div>
            </div>
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2.5rem] p-8 shadow-sm">
              <p className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-4">Total Reviews</p>
              <p className="text-4xl font-black text-zinc-900 dark:text-white tracking-tighter">{reviews.length}</p>
              <p className="text-xs font-bold text-emerald-500 mt-2">Live from Google</p>
            </div>
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2.5rem] p-8 shadow-sm">
              <p className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-4">Response Rate</p>
              <p className="text-4xl font-black text-zinc-900 dark:text-white tracking-tighter">
                {Math.round((reviews.filter(r => r.reviewReply).length / (reviews.length || 1)) * 100)}%
              </p>
              <p className="text-xs font-bold text-zinc-400 dark:text-zinc-500 mt-2">AI automation active</p>
            </div>
          </div>

          {/* Reviews List */}
          <div className="space-y-6">
            <h2 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">Recent Reviews</h2>
            <div className="grid grid-cols-1 gap-6">
              {reviews.length === 0 ? (
                <div className="p-20 text-center bg-zinc-50 dark:bg-zinc-900/50 rounded-[2.5rem] border border-dashed border-zinc-200 dark:border-zinc-800">
                  <MessageSquare className="w-12 h-12 text-zinc-300 dark:text-zinc-700 mx-auto mb-4" />
                  <p className="text-zinc-500 dark:text-zinc-400 font-bold">No reviews found for this location.</p>
                </div>
              ) : (
                reviews.map((review) => (
                  <motion.div
                    layout
                    key={review.name}
                    className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2.5rem] p-8 shadow-sm hover:shadow-xl dark:hover:shadow-black/40 transition-all"
                  >
                    <div className="flex flex-col md:flex-row gap-8">
                      <div className="flex-1 space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {review.reviewer.profilePhotoUrl ? (
                              <img 
                                src={review.reviewer.profilePhotoUrl} 
                                alt={review.reviewer.displayName}
                                className="w-12 h-12 rounded-2xl object-cover"
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <div className="w-12 h-12 bg-zinc-100 dark:bg-zinc-800 rounded-2xl flex items-center justify-center font-black text-zinc-400 dark:text-zinc-500">
                                {review.reviewer.displayName.charAt(0)}
                              </div>
                            )}
                            <div>
                              <h3 className="font-black text-zinc-900 dark:text-white tracking-tight">{review.reviewer.displayName}</h3>
                              <div className="flex gap-0.5 mt-0.5">
                                {Array.from({ length: 5 }).map((_, i) => (
                                  <Star key={i} className={cn("w-3 h-3", i < ratingToNumber(review.starRating) ? "text-amber-400 fill-amber-400" : "text-zinc-200 dark:text-zinc-700")} />
                                ))}
                              </div>
                            </div>
                          </div>
                          <span className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">
                            {format(new Date(review.createTime), "MMM d, yyyy")}
                          </span>
                        </div>
                        <p className="text-zinc-600 dark:text-zinc-400 font-bold leading-relaxed">{review.comment || "No comment provided."}</p>
                        
                        {review.reviewReply && (
                          <div className="p-6 bg-zinc-50 dark:bg-zinc-800/50 rounded-3xl border border-zinc-100 dark:border-zinc-800 space-y-2">
                            <div className="flex items-center gap-2">
                              <Bot className="w-4 h-4 text-zinc-900 dark:text-white" />
                              <span className="text-[10px] font-black text-zinc-900 dark:text-white uppercase tracking-widest">Kirin AI Reply</span>
                            </div>
                            <p className="text-sm font-bold text-zinc-500 dark:text-zinc-400">{review.reviewReply.comment}</p>
                          </div>
                        )}
                      </div>

                      <div className="w-full md:w-80 space-y-4">
                        {!review.reviewReply && replyingTo !== review.name && (
                          <button 
                            onClick={() => setReplyingTo(review.name)}
                            className="w-full py-4 bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-transform active:scale-95 shadow-xl shadow-black/10 dark:shadow-white/5 flex items-center justify-center gap-2"
                          >
                            <MessageSquare className="w-4 h-4" />
                            Reply to Review
                          </button>
                        )}

                        {replyingTo === review.name && (
                          <div className="space-y-4">
                            <div className="relative">
                              <textarea 
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                className="w-full p-4 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 rounded-2xl font-bold text-sm text-zinc-900 dark:text-white outline-none focus:border-black dark:focus:border-white transition-all min-h-[120px] resize-none"
                                placeholder="Write your reply..."
                              />
                              <button 
                                onClick={() => handleGenerateReply(review)}
                                disabled={isGenerating}
                                className="absolute bottom-3 right-3 w-8 h-8 bg-black dark:bg-white text-white dark:text-zinc-950 rounded-lg flex items-center justify-center hover:scale-110 transition-transform shadow-lg disabled:opacity-50"
                              >
                                {isGenerating ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Sparkles className="w-4 h-4" />
                                )}
                              </button>
                            </div>
                            <div className="flex gap-2">
                              <button 
                                onClick={() => setReplyingTo(null)}
                                className="flex-1 py-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl font-black text-[10px] uppercase tracking-widest text-zinc-400 dark:text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-all"
                              >
                                Cancel
                              </button>
                              <button 
                                onClick={() => handleSendReply(review.name)}
                                className="flex-1 py-3 bg-black dark:bg-white text-white dark:text-zinc-950 rounded-xl font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-transform"
                              >
                                Send Reply
                              </button>
                            </div>
                          </div>
                        )}

                        {review.reviewReply && (
                          <div className="flex items-center justify-center gap-2 text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 py-4 rounded-2xl border border-emerald-100 dark:border-emerald-500/20">
                            <CheckCircle2 className="w-4 h-4" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Replied Successfully</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        </>
      )}

      {activeTab === "automation" && (
        <div className="max-w-2xl space-y-8">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2.5rem] p-8 shadow-sm space-y-8">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black text-zinc-900 dark:text-white tracking-tight">Auto-Reply Mode</h3>
                <p className="text-sm font-bold text-zinc-400 dark:text-zinc-500">Automatically reply to new reviews using AI</p>
              </div>
              <button 
                onClick={() => saveSettings({ ...settings, autoReplyEnabled: !settings.autoReplyEnabled })}
                className={cn(
                  "w-16 h-8 rounded-full transition-all relative",
                  settings.autoReplyEnabled ? "bg-orange-500" : "bg-zinc-200 dark:bg-zinc-800"
                )}
              >
                <div className={cn(
                  "absolute top-1 w-6 h-6 bg-white rounded-full transition-all",
                  settings.autoReplyEnabled ? "right-1" : "left-1"
                )} />
              </button>
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Minimum Rating to Reply</label>
              <div className="flex gap-4">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <button
                    key={rating}
                    onClick={() => saveSettings({ ...settings, minRating: rating })}
                    className={cn(
                      "flex-1 py-4 rounded-2xl font-black text-sm transition-all border",
                      settings.minRating === rating 
                        ? "bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 border-transparent" 
                        : "bg-white dark:bg-zinc-900 text-zinc-400 dark:text-zinc-500 border-zinc-200 dark:border-zinc-800"
                    )}
                  >
                    {rating}+ Stars
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Reply Style</label>
              <div className="grid grid-cols-3 gap-4">
                {["professional", "friendly", "concise"].map((style) => (
                  <button
                    key={style}
                    onClick={() => saveSettings({ ...settings, replyStyle: style })}
                    className={cn(
                      "py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all border",
                      settings.replyStyle === style 
                        ? "bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 border-transparent" 
                        : "bg-white dark:bg-zinc-900 text-zinc-400 dark:text-zinc-500 border-zinc-200 dark:border-zinc-800"
                    )}
                  >
                    {style}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-orange-50 dark:bg-orange-500/10 border border-orange-100 dark:border-orange-500/20 rounded-[2.5rem] p-8">
            <div className="flex gap-4">
              <div className="w-12 h-12 bg-orange-500 rounded-2xl flex items-center justify-center shrink-0">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div className="space-y-2">
                <h4 className="font-black text-orange-900 dark:text-orange-400 tracking-tight">Bulk Automation</h4>
                <p className="text-sm font-bold text-orange-800/60 dark:text-orange-400/60 leading-relaxed">
                  Run a bulk automation task now to reply to all unreplied reviews that match your criteria.
                </p>
                <button 
                  onClick={handleBulkAutoReply}
                  disabled={isBulkReplying}
                  className="mt-4 px-6 py-3 bg-orange-500 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-orange-600 transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {isBulkReplying && <Loader2 className="w-3 h-3 animate-spin" />}
                  Run Bulk Automation
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "logs" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">Automation History</h2>
            <button 
              onClick={fetchLogs}
              className="p-2 text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2.5rem] overflow-hidden shadow-sm">
            <table className="w-full text-left">
              <thead>
                <tr className="border-bottom border-zinc-100 dark:border-zinc-800">
                  <th className="px-8 py-6 text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Timestamp</th>
                  <th className="px-8 py-6 text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Review ID</th>
                  <th className="px-8 py-6 text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">AI Reply</th>
                  <th className="px-8 py-6 text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-8 py-20 text-center text-zinc-500 dark:text-zinc-400 font-bold">
                      No automation logs found.
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                      <td className="px-8 py-6 text-xs font-bold text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
                        {log.timestamp?.toDate ? format(log.timestamp.toDate(), "MMM d, HH:mm") : "Just now"}
                      </td>
                      <td className="px-8 py-6 text-xs font-bold text-zinc-900 dark:text-white max-w-[200px] truncate">
                        {log.reviewId.split('/').pop()}
                      </td>
                      <td className="px-8 py-6 text-xs font-bold text-zinc-500 dark:text-zinc-400 max-w-md truncate">
                        {log.reply}
                      </td>
                      <td className="px-8 py-6">
                        <span className={cn(
                          "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                          log.status === "auto_success" ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400" : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                        )}>
                          {log.status.replace('_', ' ')}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
