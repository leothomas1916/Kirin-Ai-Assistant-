import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import axios from "axios";
import { google } from "googleapis";
import { OAuth2Client } from "google-auth-library";
import admin from "firebase-admin";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: "irepair2k-database",
  });
}

const db = admin.firestore();
const auth = admin.auth();

// OAuth2 Client Setup
const getRedirectUri = () => {
  const baseUri = process.env.GOOGLE_REDIRECT_URI || process.env.APP_URL || "http://localhost:3000";
  // Ensure it ends with the callback path
  if (baseUri.includes("/api/auth/gmb/callback")) return baseUri;
  return `${baseUri.replace(/\/$/, "")}/api/auth/gmb/callback`;
};

const oauth2Client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  getRedirectUri()
);

// Middleware to verify Firebase ID Token
const verifyToken = async (req: any, res: any, next: any) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const idToken = authHeader.split("Bearer ")[1];
  try {
    const decodedToken = await auth.verifyIdToken(idToken);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error("Token verification error:", error);
    res.status(401).json({ error: "Invalid token" });
  }
};

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // GMB OAuth2: Generate Auth URL
  app.get("/api/auth/gmb/url", verifyToken, (req: any, res) => {
    const userId = req.user.uid;
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: "offline",
      scope: ["https://www.googleapis.com/auth/business.manage"],
      state: userId, // Pass userId in state to handle it in callback
      prompt: "consent",
    });
    res.json({ url: authUrl });
  });

  // GMB OAuth2: Handle Callback
  app.get("/api/auth/gmb/callback", async (req, res) => {
    const { code, state: userId } = req.query;

    if (!code || !userId) {
      return res.status(400).send("Invalid request");
    }

    try {
      const { tokens } = await oauth2Client.getToken(code as string);
      
      // Store tokens in Firestore
      await db.collection("gmb_tokens").doc(userId as string).set({
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiryDate: tokens.expiry_date,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      res.send(`
        <html>
          <body style="font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; background: #09090b; color: white;">
            <div style="text-align: center; background: #18181b; padding: 2rem; border-radius: 1rem; border: 1px solid #27272a;">
              <h1 style="color: #f97316;">Authentication Successful</h1>
              <p>Your Google Business Profile is now connected.</p>
              <p>This window will close automatically.</p>
              <script>
                setTimeout(() => {
                  window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS' }, '*');
                  window.close();
                }, 2000);
              </script>
            </div>
          </body>
        </html>
      `);
    } catch (error) {
      console.error("OAuth Callback Error:", error);
      res.status(500).send("Authentication failed");
    }
  });

  // GMB: Get Accounts
  app.get("/api/gmb/accounts", verifyToken, async (req: any, res) => {
    const userId = req.user.uid;
    try {
      const tokenDoc = await db.collection("gmb_tokens").doc(userId).get();
      if (!tokenDoc.exists) return res.status(404).json({ error: "GMB not connected" });

      const tokens = tokenDoc.data();
      oauth2Client.setCredentials({
        access_token: tokens?.accessToken,
        refresh_token: tokens?.refreshToken,
        expiry_date: tokens?.expiryDate,
      });

      const { token } = await oauth2Client.getAccessToken();

      const mybusinessaccountmanagement = google.mybusinessaccountmanagement({
        version: "v1",
        auth: oauth2Client,
      });

      const response = await mybusinessaccountmanagement.accounts.list();
      res.json(response.data);
    } catch (error: any) {
      console.error("GMB Accounts Error:", error);
      res.status(500).json({ error: "Failed to fetch accounts" });
    }
  });

  // GMB: Get Locations
  app.get("/api/gmb/locations", verifyToken, async (req: any, res) => {
    const { accountId } = req.query;
    const userId = req.user.uid;
    try {
      const tokenDoc = await db.collection("gmb_tokens").doc(userId).get();
      if (!tokenDoc.exists) return res.status(404).json({ error: "GMB not connected" });

      const tokens = tokenDoc.data();
      oauth2Client.setCredentials({
        access_token: tokens?.accessToken,
        refresh_token: tokens?.refreshToken,
        expiry_date: tokens?.expiryDate,
      });

      const { token } = await oauth2Client.getAccessToken();

      const mybusinessbusinessinformation = google.mybusinessbusinessinformation({
        version: "v1",
        auth: oauth2Client,
      });

      const response = await mybusinessbusinessinformation.accounts.locations.list({
        parent: accountId as string,
        readMask: "name,title,storeCode",
      });
      res.json(response.data);
    } catch (error) {
      console.error("GMB Locations Error:", error);
      res.status(500).json({ error: "Failed to fetch locations" });
    }
  });

  // GMB: Get Logs
  app.get("/api/gmb/logs", verifyToken, async (req: any, res) => {
    const userId = req.user.uid;
    try {
      const logsSnapshot = await db.collection("gmb_logs")
        .where("userId", "==", userId)
        .orderBy("timestamp", "desc")
        .limit(50)
        .get();
      
      const logs = logsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      res.json(logs);
    } catch (error) {
      console.error("GMB Logs Error:", error);
      res.status(500).json({ error: "Failed to fetch logs" });
    }
  });

  // GMB: Get Reviews
  app.get("/api/gmb/reviews", verifyToken, async (req: any, res) => {
    const { locationName } = req.query;
    const userId = req.user.uid;
    try {
      const tokenDoc = await db.collection("gmb_tokens").doc(userId).get();
      if (!tokenDoc.exists) return res.status(404).json({ error: "GMB not connected" });
      
      const tokens = tokenDoc.data();
      oauth2Client.setCredentials({
        access_token: tokens?.accessToken,
        refresh_token: tokens?.refreshToken,
        expiry_date: tokens?.expiryDate,
      });

      // Refresh token if needed
      const { token } = await oauth2Client.getAccessToken();
      
      const response = await axios.get(
        `https://mybusiness.googleapis.com/v4/${locationName}/reviews`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      res.json(response.data);
    } catch (error) {
      console.error("GMB Reviews Error:", error);
      res.status(500).json({ error: "Failed to fetch reviews" });
    }
  });

  // GMB: Reply to Review
  app.post("/api/gmb/reply", verifyToken, async (req: any, res) => {
    const { reviewName, replyText } = req.body;
    const userId = req.user.uid;
    try {
      const tokenDoc = await db.collection("gmb_tokens").doc(userId).get();
      if (!tokenDoc.exists) return res.status(404).json({ error: "GMB not connected" });

      const tokens = tokenDoc.data();
      oauth2Client.setCredentials({
        access_token: tokens?.accessToken,
        refresh_token: tokens?.refreshToken,
        expiry_date: tokens?.expiryDate,
      });

      const { token } = await oauth2Client.getAccessToken();
      
      const response = await axios.put(
        `https://mybusiness.googleapis.com/v4/${reviewName}/reply`,
        { comment: replyText },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      await db.collection("gmb_logs").add({
        userId,
        reviewId: reviewName,
        reply: replyText,
        status: "success",
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });

      res.json(response.data);
    } catch (error) {
      console.error("GMB Reply Error:", error);
      res.status(500).json({ error: "Failed to post reply" });
    }
  });

  // GMB: Bulk Auto Reply
  app.post("/api/gmb/bulk-auto-reply", verifyToken, async (req: any, res) => {
    const userId = req.user.uid;
    try {
      const tokenDoc = await db.collection("gmb_tokens").doc(userId).get();
      if (!tokenDoc.exists) return res.status(404).json({ error: "GMB not connected" });

      const settingsDoc = await db.collection("gmb_settings").doc(userId).get();
      const settings = settingsDoc.exists ? settingsDoc.data() : { autoReplyEnabled: true, minRating: 4 };

      const tokens = tokenDoc.data();
      oauth2Client.setCredentials({
        access_token: tokens?.accessToken,
        refresh_token: tokens?.refreshToken,
        expiry_date: tokens?.expiryDate,
      });

      const { token } = await oauth2Client.getAccessToken();
      
      // 1. Get Accounts
      const accountsRes = await axios.get("https://mybusinessaccountmanagement.googleapis.com/v1/accounts", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const accounts = accountsRes.data.accounts || [];

      let totalReplied = 0;

      for (const account of accounts) {
        // 2. Get Locations
        const locationsRes = await axios.get(`https://mybusinessbusinessinformation.googleapis.com/v1/${account.name}/locations?readMask=name,title`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const locations = locationsRes.data.locations || [];

        for (const location of locations) {
          // 3. Get Reviews
          const reviewsRes = await axios.get(`https://mybusiness.googleapis.com/v4/${location.name}/reviews`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          const reviews = reviewsRes.data.reviews || [];

          for (const review of reviews) {
            // Skip if already replied or rating too low
            const ratingNum = { "FIVE": 5, "FOUR": 4, "THREE": 3, "TWO": 2, "ONE": 1 }[review.starRating as string] || 0;
            if (review.reviewReply || ratingNum < (settings?.minRating || 1)) continue;

            // 4. Generate AI Reply
            const aiResponse = await axios.post(
              "https://openrouter.ai/api/v1/chat/completions",
              {
                model: "google/gemini-2.0-flash-001",
                messages: [
                  { role: "system", content: `Write a professional and polite reply to this customer review. Style: ${settings?.replyStyle || "professional"}. Keep it concise.` },
                  { role: "user", content: review.comment || "No comment provided, just a rating." }
                ],
              },
              {
                headers: {
                  "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
                  "Content-Type": "application/json",
                },
              }
            );
            const replyText = aiResponse.data.choices[0].message.content;

            // 5. Post Reply
            await axios.put(
              `https://mybusiness.googleapis.com/v4/${review.name}/reply`,
              { comment: replyText },
              {
                headers: { Authorization: `Bearer ${token}` }
              }
            );

            // 6. Log
            await db.collection("gmb_logs").add({
              userId,
              reviewId: review.name,
              reply: replyText,
              status: "auto_success",
              timestamp: admin.firestore.FieldValue.serverTimestamp(),
            });

            totalReplied++;
          }
        }
      }

      res.json({ status: "success", totalReplied });
    } catch (error: any) {
      console.error("Bulk Auto Reply Error:", error.response?.data || error.message);
      res.status(500).json({ error: "Bulk auto reply failed", details: error.response?.data || error.message });
    }
  });

  // OpenRouter Proxy
  app.post("/api/ai/chat", verifyToken, async (req: any, res) => {
    const { messages, model = "google/gemini-2.0-flash-001" } = req.body;
    
    if (!process.env.OPENROUTER_API_KEY) {
      return res.status(500).json({ error: "OPENROUTER_API_KEY not configured" });
    }

    try {
      const response = await axios.post(
        "https://openrouter.ai/api/v1/chat/completions",
        {
          model,
          messages,
        },
        {
          headers: {
            "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
            "HTTP-Referer": process.env.APP_URL || "http://localhost:3000",
            "X-Title": "Kirin AI",
            "Content-Type": "application/json",
          },
        }
      );
      res.json(response.data);
    } catch (error: any) {
      console.error("OpenRouter Error:", error.response?.data || error.message);
      res.status(error.response?.status || 500).json({
        error: "AI service error",
        details: error.response?.data || error.message,
      });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Kirin AI Server running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
});
