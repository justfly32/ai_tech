import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import Parser from "rss-parser";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;
  const parser = new Parser();

  app.use(express.json());

  // API Routes
  app.get("/api/news-raw", async (req, res) => {
    try {
      console.log("Fetching raw news...");
      
      const sources = [
        "https://hnrss.org/newest?q=AI",
        "https://techcrunch.com/category/artificial-intelligence/feed/",
      ];

      const allArticles = [];
      for (const url of sources) {
        try {
          const feed = await parser.parseURL(url);
          allArticles.push(...feed.items.map(item => ({
            title: item.title,
            link: item.link,
            content: item.contentSnippet || item.content,
            pubDate: item.pubDate,
            source: url.includes("hnrss") ? "Hacker News" : "TechCrunch"
          })));
        } catch (e) {
          console.error(`Error fetching from ${url}:`, e);
        }
      }

      const recentArticles = allArticles
        .sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime())
        .slice(0, 20);

      res.json({ articles: recentArticles });
    } catch (error) {
      console.error("Error in /api/news-raw:", error);
      res.status(500).json({ error: "Failed to fetch raw news" });
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
