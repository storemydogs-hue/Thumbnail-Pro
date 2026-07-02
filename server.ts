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

  // Image Proxy to avoid CORS and handle fallbacks
  app.get("/api/proxy-image", async (req, res) => {
    let imageUrl = req.query.url as string;
    if (!imageUrl) return res.status(400).send("URL is required");

    const fetchWithFallback = async (url: string) => {
      const userAgents = [
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36"
      ];
      
      const domains = ["img.youtube.com", "i.ytimg.com", "i1.ytimg.com", "i2.ytimg.com"];
      
      const attemptFetch = (targetUrl: string) => fetch(targetUrl, {
        headers: {
          "User-Agent": userAgents[Math.floor(Math.random() * userAgents.length)],
          "Referer": "https://www.youtube.com/"
        }
      });

      let response = await attemptFetch(url);

      // If it's a YouTube thumbnail and it fails, try different domains and resolutions
      if (!response.ok && url.includes("youtube.com") || url.includes("ytimg.com")) {
        const fallbacks = ["maxresdefault", "hqdefault", "sddefault", "mqdefault", "default"];
        let currentType = fallbacks.find(f => url.includes(f)) || "maxresdefault";

        // Try rotating domains first for the same quality
        for (const domain of domains) {
          const domainUrl = url.replace(/img\.youtube\.com|i\.ytimg\.com|i\d\.ytimg\.com/, domain);
          if (domainUrl === url) continue;
          
          const domainResponse = await attemptFetch(domainUrl);
          if (domainResponse.ok) return domainResponse;
        }

        // Try lower qualities across all domains
        for (const fallbackType of fallbacks) {
          if (fallbacks.indexOf(fallbackType) <= fallbacks.indexOf(currentType)) continue;
          
          for (const domain of domains) {
            const fallbackUrl = url.replace(currentType, fallbackType).replace(/img\.youtube\.com|i\.ytimg\.com|i\d\.ytimg\.com/, domain);
            const fbResponse = await attemptFetch(fallbackUrl);
            if (fbResponse.ok) return fbResponse;
          }
        }
      }

      return response;
    };

    try {
      const response = await fetchWithFallback(imageUrl);

      if (!response.ok) {
        console.error(`Proxy failure for ${imageUrl}: ${response.status} ${response.statusText}`);
        return res.status(response.status).send(`External source error: ${response.statusText}`);
      }

      const blob = await response.arrayBuffer();
      const contentType = response.headers.get("content-type") || "image/jpeg";
      
      res.setHeader("Content-Type", contentType);
      res.setHeader("Cache-Control", "public, max-age=31536000"); // Cache for 1 year
      res.send(Buffer.from(blob));
    } catch (err) {
      console.error("Proxy error:", err);
      res.status(500).send("Internal proxy error");
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
