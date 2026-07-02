import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Image Proxy to avoid CORS
  app.get("/api/proxy-image", async (req, res) => {
    const imageUrl = req.query.url as string;
    if (!imageUrl) return res.status(400).send("URL is required");

    try {
      const response = await fetch(imageUrl);
      const blob = await response.arrayBuffer();
      const contentType = response.headers.get("content-type") || "image/jpeg";
      
      res.setHeader("Content-Type", contentType);
      res.send(Buffer.from(blob));
    } catch (err) {
      console.error("Proxy error:", err);
      res.status(500).send("Error fetching image");
    }
  });

  // Example endpoint for report generation (simulated logic)
  app.post("/api/reports/generate", (req, res) => {
    const { downloads } = req.body;
    if (!downloads || !Array.isArray(downloads)) {
      return res.status(400).json({ error: "Invalid data" });
    }

    // In a real app, you might generate a CSV/PDF here
    // For now, we'll just return a success message and simulate data
    res.json({ 
      success: true, 
      message: "Report ready for download",
      downloadUrl: "#" // In real implementation, this would be a signed URL or stream
    });
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

startServer().catch((err) => {
  console.error("Failed to start server:", err);
});
