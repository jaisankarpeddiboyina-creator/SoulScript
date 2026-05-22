import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import axios from "axios";
import https from "https";
import { Resend } from "resend";
import PocketBase from "pocketbase";
import dotenv from "dotenv";
import crypto from "crypto";

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

  // ==========================================
  // PAYMENT & SUBSCRIPTION ENDPOINTS (RAZORPAY)
  // ==========================================

  // Create Razorpay subscription/payment order
  app.post("/api/payments/create-order", async (req, res) => {
    const { plan, billingCycle } = req.body;
    if (!plan) return res.status(400).json({ error: "Plan type required" });

    // Determine price in Paise (1 INR = 100 Paise)
    let amount = 0;
    if (plan === "basic") {
      amount = 49 * 100; // ₹49
    } else if (plan === "pro" || plan === "premium") {
      amount = billingCycle === "yearly" ? 999 * 100 : 149 * 100; // ₹999 or ₹149
    } else {
      return res.status(400).json({ error: "Invalid plan" });
    }

    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    const receipt = `rcpt_${plan}_${Date.now()}`;

    // Sandbox Fallback
    if (!keyId || !keySecret) {
      console.warn("RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET not set. Generating sandbox checkout order.");
      return res.json({
        id: `order_sandbox_${Math.random().toString(36).substring(2, 11)}`,
        entity: "order",
        amount,
        amount_due: amount,
        amount_paid: 0,
        currency: "INR",
        receipt,
        status: "created",
        attempts: 0,
        notes: [],
        created_at: Math.floor(Date.now() / 1000),
        isSandbox: true,
        keyId: "rzp_test_sandbox_key"
      });
    }

    try {
      // Basic auth payload for Razorpay Orders API
      const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");
      const rzpResponse = await axios.post(
        "https://api.razorpay.com/v1/orders",
        {
          amount,
          currency: "INR",
          receipt,
        },
        {
          headers: {
            Authorization: `Basic ${auth}`,
            "Content-Type": "application/json",
          },
        }
      );

      res.json({
        ...rzpResponse.data,
        keyId,
        isSandbox: false
      });
    } catch (error: any) {
      const errorMsg = error.response?.data?.error?.description || error.message;
      console.error("Razorpay API Order Error:", errorMsg);
      res.status(500).json({ error: `Razorpay Order Error: ${errorMsg}` });
    }
  });

  // Verify signature and update plan in database
  app.post("/api/payments/verify", async (req, res) => {
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature, userId, plan } = req.body;
    
    if (!userId || !plan) {
      return res.status(400).json({ error: "Missing required parameters (userId, plan)" });
    }

    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    const isSandboxOrder = razorpay_order_id && razorpay_order_id.startsWith("order_sandbox_");

    if (!keySecret || isSandboxOrder) {
      console.warn("Signature verification bypassed (Sandbox order or keys missing).");
      try {
        await pbAuth();
        await pb.collection("users").update(userId, { plan });
        
        // Log in subscriptions history
        try {
          await pb.collection("subscriptions").create({
            user: userId,
            plan,
            status: "active",
            startDate: new Date().toISOString(),
            razorpayPaymentId: razorpay_payment_id || "pay_sandbox_12345"
          });
        } catch (subErr) {
          console.error("Could not write record to subscriptions collection:", subErr);
        }

        return res.json({ success: true, plan, sandbox: true });
      } catch (pbError: any) {
        console.error("Database update error:", pbError.message);
        return res.status(500).json({ error: "Database plan update failed" });
      }
    }

    // Verify Real Signature
    try {
      const hmac = crypto.createHmac("sha256", keySecret);
      hmac.update(`${razorpay_order_id}|${razorpay_payment_id}`);
      const generated_signature = hmac.digest("hex");

      if (generated_signature !== razorpay_signature) {
        return res.status(400).json({ error: "Signature mismatch. Verification failed." });
      }

      // Upgrade in Database
      await pbAuth();
      await pb.collection("users").update(userId, { plan });

      // Save in subscriptions history
      try {
        await pb.collection("subscriptions").create({
          user: userId,
          plan,
          status: "active",
          startDate: new Date().toISOString(),
          razorpayPaymentId: razorpay_payment_id
        });
      } catch (subErr) {
        console.error("Could not write record to subscriptions collection:", subErr);
      }

      res.json({ success: true, plan });
    } catch (error: any) {
      console.error("Secure signature processing error:", error.message);
      res.status(500).json({ error: "Verification server-side error" });
    }
  });

  // Cancel subscription and return to free
  app.post("/api/payments/cancel", async (req, res) => {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: "userId required" });

    try {
      await pbAuth();
      await pb.collection("users").update(userId, { plan: "free" });

      // Find subscription and mark cancelled
      try {
        const subscriptions = await pb.collection("subscriptions").getList(1, 1, {
          filter: `user = "${userId}" && status = "active"`,
          sort: "-created",
        });

        if (subscriptions.items.length > 0) {
          await pb.collection("subscriptions").update(subscriptions.items[0].id, {
            status: "cancelled",
            endDate: new Date().toISOString(),
          });
        }
      } catch (subError) {
        console.error("Failed to cancel active subscription reference:", subError);
      }

      res.json({ success: true, plan: "free" });
    } catch (error: any) {
      console.error("Cancellation Endpoint Error:", error.message);
      res.status(500).json({ error: "Failed to cancel database plan details" });
    }
  });

  // Webhooks
  app.post("/api/payments/webhook", async (req, res) => {
    const signature = req.headers["x-razorpay-signature"] as string;
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (!webhookSecret || !signature) {
      return res.status(200).send("No secret or signature. Bypassed webhook logging.");
    }

    try {
      const hmac = crypto.createHmac("sha256", webhookSecret);
      hmac.update(JSON.stringify(req.body));
      const expectedSignature = hmac.digest("hex");

      if (expectedSignature !== signature) {
        return res.status(400).send("Signature verification failed for webhook");
      }

      const event = req.body.event;
      console.log(`Verified Webhook: ${event}`);

      res.status(200).json({ received: true });
    } catch (error: any) {
      console.error("Webhook processing error:", error.message);
      res.status(500).send("Webhook failed parsing");
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
