import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import axios from "axios";
import https from "https";
import { Resend } from "resend";
import PocketBase from "pocketbase";
import dotenv from "dotenv";

dotenv.config();

const pb = new PocketBase(process.env.POCKETBASE_URL || 'http://127.0.0.1:8090');
const resend = new Resend(process.env.RESEND_API_KEY || 're_123');

// Create an agent that ignores certificate expiration (use with caution, but necessary for third-party API issues)
const httpsAgent = new https.Agent({
  rejectUnauthorized: false,
});

// Auth with PB
const pbAuth = async () => {
  try {
    if (process.env.POCKETBASE_ADMIN_EMAIL && process.env.POCKETBASE_ADMIN_PASSWORD) {
      await pb.admins.authWithPassword(
        process.env.POCKETBASE_ADMIN_EMAIL,
        process.env.POCKETBASE_ADMIN_PASSWORD
      );
      console.log("PocketBase authenticated");
    }
  } catch (error) {
    console.error("PB Auth Failed:", error);
  }
};
pbAuth();

async function startServer() {
  try {
    const app = express();
    const PORT = 3000;

  app.use(express.json());

  // Email Verification Endpoint
  app.post("/api/verify/email", async (req, res) => {
    const { email, code } = req.body;
    if (!email || !code) return res.status(400).json({ error: "Email and code required" });

    try {
      await resend.emails.send({
        from: "SoulScript <verify@soulscript.io>",
        to: email,
        subject: "Your SoulScript verification code",
        html: `
          <div style="font-family: sans-serif; padding: 40px; text-align: center; background: #0a0a0a; color: white; border-radius: 20px;">
            <h1 style="color: #818cf8;">SoulScript</h1>
            <p style="font-size: 18px; margin-bottom: 30px;">Your verification code is:</p>
            <div style="font-size: 48px; font-weight: 900; letter-spacing: 10px; color: #818cf8; background: rgba(129, 140, 248, 0.1); padding: 20px; border-radius: 15px; display: inline-block;">
              ${code}
            </div>
            <p style="margin-top: 30px; color: #666; font-size: 14px;">This code expires in 10 minutes.<br/>If you did not request this, please ignore this email.</p>
          </div>
        `,
      });

      // Also save to PB for future reference (optional but good for syncing)
      try {
        await pb.collection("verifications").create({
          email,
          code,
          channel: "email",
          expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
          verified: false,
        });
      } catch (pbErr) {
        // PB might not be setup yet, swallow error
      }

      res.json({ success: true });
    } catch (error: any) {
      console.error("Resend Error:", error.message);
      res.status(500).json({ error: "Failed to send verification email" });
    }
  });

  // Telegram Verification Start
  app.post("/api/verify/telegram", async (req, res) => {
    const { username, code } = req.body;
    try {
      await pb.collection("verifications").create({
        username,
        code,
        channel: "telegram",
        expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
        verified: false,
      });
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: "Failed to initiate Telegram verification" });
    }
  });

  // Check verification status
  app.get("/api/verify/status", async (req, res) => {
    const { username, email } = req.query;
    try {
      const filter = username ? `username = "${username}"` : `email = "${email}"`;
      const record = await pb.collection("verifications").getFirstListItem(`${filter} && verified = true`, {
        sort: "-created",
      });
      res.json({ verified: true, record });
    } catch (error) {
      res.json({ verified: false });
    }
  });

  // API Proxy Route for Quotes (Random)
  app.get("/api/quotes/random", async (req, res) => {
    try {
      const { tags, limit } = req.query;
      const response = await axios.get("https://api.quotable.io/quotes/random", {
        params: { tags, limit },
        httpsAgent,
      });
      res.json(response.data);
    } catch (error: any) {
      console.error("Error proxying random quote request:", error.message);
      res.status(500).json({ error: "Failed to fetch quotes" });
    }
  });

  // API Proxy Route for Quotes (List/Search)
  app.get("/api/quotes", async (req, res) => {
    try {
      const { tags, author, limit, page } = req.query;
      const response = await axios.get("https://api.quotable.io/quotes", {
        params: { tags, author, limit, page },
        httpsAgent,
      });
      res.json(response.data);
    } catch (error: any) {
      console.error("Error proxying quote list request:", error.message);
      res.status(500).json({ error: "Failed to fetch quotes" });
    }
  });

  // Proxy for image resolution
  app.get("/api/resolve-image", async (req, res) => {
    try {
      const { url } = req.query;
      if (!url) return res.status(400).json({ error: "URL required" });
      
      const response = await axios.get(url as string, {
        maxRedirects: 5,
      });
      
      const finalUrl = response.request.res.responseUrl || url;
      res.json({ url: finalUrl });
    } catch (error: any) {
      // If it fails (e.g. timeout), just return the original URL
      res.json({ url: req.query.url });
    }
  });

  // Proxy for DummyJSON.com quotes
  app.get("/api/dummy/quotes", async (req, res) => {
    try {
      const { limit, skip } = req.query;
      const response = await axios.get("https://dummyjson.com/quotes", {
        params: { limit, skip },
      });
      res.json(response.data);
    } catch (error: any) {
      console.error("Error proxying DummyJSON request:", error.message);
      res.status(500).json({ error: "Failed to fetch DummyJSON quotes" });
    }
  });

  // Fallback API if quotable is down
  app.get("/api/fallback-quotes", async (req, res) => {
    try {
      const response = await axios.get("https://dummyjson.com/quotes/random", {
        httpsAgent,
      });
      res.json(response.data);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to fetch fallback quotes" });
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
    console.log(`Server running on http://localhost:${PORT}`);
  });
  } catch (err) {
    console.error("Server failed to start:", err);
  }
}

startServer();
