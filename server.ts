import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import axios from "axios";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Proxy Route for Quotes
  app.get("/api/quotes/random", async (req, res) => {
    try {
      const { tags, limit } = req.query;
      const response = await axios.get("https://api.quotable.io/quotes/random", {
        params: { tags, limit },
      });
      res.json(response.data);
    } catch (error: any) {
      console.error("Error proxying quote request:", error.message);
      res.status(500).json({ error: "Failed to fetch quotes" });
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
      const response = await axios.get("https://dummyjson.com/quotes/random");
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
}

startServer();
