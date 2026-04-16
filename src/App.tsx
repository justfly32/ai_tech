import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  RefreshCw, 
  ExternalLink, 
  ChevronRight, 
  Sparkles, 
  Newspaper,
  Calendar,
  AlertCircle
} from "lucide-react";
import { GoogleGenAI } from "@google/genai";

interface Article {
  title: string;
  summary: string[];
  url: string;
  source: string;
}

// Initialize AI
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export default function App() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>("");

  const fetchNews = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/news-raw");
      if (!response.ok) throw new Error("Failed to fetch raw news");
      const { articles: rawArticles } = await response.json();

      if (rawArticles.length === 0) {
        setArticles([]);
        return;
      }

      const prompt = `
        You are an expert AI Tech News Editor. 
        Below is a list of recent news articles related to AI and LLMs.
        
        Tasks:
        1. Select the top 5-7 most technically significant and impactful articles. Ignore gossip or minor updates.
        2. For each selected article, provide:
           - A professional Korean title.
           - A 3-line Korean summary (bullet points) that is professional and informative.
           - The original link.
           - The source name.
           - A technical category tag (e.g., Generative AI, Open Source, Chipset, Software).

        Input Articles:
        ${JSON.stringify(rawArticles)}

        Output Format (JSON array of objects):
        [
          {
            "title": "Korean Title",
            "summary": ["Point 1", "Point 2", "Point 3"],
            "url": "original link",
            "source": "Source Name",
            "category": "Category Name"
          }
        ]
        
        Return ONLY the JSON array.
      `;

      const aiResponse = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: prompt,
      });

      const responseText = aiResponse.text || "[]";
      const jsonMatch = responseText.match(/\[[\s\S]*\]/);
      const curatedNews = jsonMatch ? JSON.parse(jsonMatch[0]) : [];

      setArticles(curatedNews);
      setLastUpdated(new Date().toLocaleTimeString("ko-KR", { 
        hour: "2-digit", 
        minute: "2-digit" 
      }));
    } catch (err) {
      setError("뉴스를 분석하는 중 오류가 발생했습니다.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
  }, []);

  const today = new Date();
  const formattedDate = `${today.getFullYear()}.${String(today.getMonth() + 1).padStart(2, '0')}.${String(today.getDate()).padStart(2, '0')} ${today.toLocaleString('en-US', { month: 'long' }).toUpperCase()}`;

  return (
    <div className="min-h-screen bg-ios-bg flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 ios-blur px-10 py-6 flex justify-between items-center">
        <div className="header-left">
          <h1 className="text-[24px] font-bold tracking-[-0.5px] text-ios-text">AI Tech Blueprint</h1>
          <p className="text-[13px] text-ios-gray uppercase tracking-[1px] mt-1 font-medium">Curated Technical Insights</p>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={fetchNews}
            disabled={loading}
            className="p-2 rounded-full bg-[#E5E5EA] active:scale-95 transition-transform disabled:opacity-50"
          >
            <RefreshCw className={`w-5 h-5 text-ios-blue ${loading ? 'animate-spin' : ''}`} />
          </button>
          <div className="date-badge">{formattedDate}</div>
        </div>
      </header>

      <main className="flex-1 grid grid-cols-[300px_1fr] gap-6 px-10 py-8 max-w-[1400px] mx-auto w-full">
        {/* Sidebar */}
        <aside className="flex flex-col gap-5">
          <div className="sleek-sidebar-card">
            <h3 className="text-[15px] font-semibold text-[#3A3A3C] mb-4">Curation Pulse</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-[14px]">
                <span className="text-ios-gray">Total Scanned</span>
                <span className="font-semibold text-ios-blue">20 Articles</span>
              </div>
              <div className="flex justify-between text-[14px]">
                <span className="text-ios-gray">High Signal</span>
                <span className="font-semibold text-ios-blue">{articles.length} Selected</span>
              </div>
              <div className="flex justify-between text-[14px]">
                <span className="text-ios-gray">Category</span>
                <span className="font-semibold text-ios-blue">LLM / Vision / OS</span>
              </div>
              <div className="flex justify-between text-[14px]">
                <span className="text-ios-gray">Read Time</span>
                <span className="font-semibold text-ios-blue">~4 min</span>
              </div>
            </div>
          </div>

          <div className="sleek-sidebar-card bg-gradient-to-br from-ios-blue to-ios-purple text-white">
            <h3 className="text-[15px] font-semibold mb-3">Editor's Note</h3>
            <p className="text-[13px] leading-[1.6] opacity-90">
              오늘의 핵심은 최신 AI 모델의 기술적 진보와 실질적인 성능 향상입니다. 기술적 세부사항 위주로 엄선되었습니다.
            </p>
          </div>
        </aside>

        {/* News Grid */}
        <div className="news-grid grid grid-cols-2 gap-5 auto-rows-min">
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div 
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="col-span-2 grid grid-cols-2 gap-5"
              >
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="sleek-card h-64 animate-pulse bg-white/50" />
                ))}
              </motion.div>
            ) : error ? (
              <motion.div 
                key="error"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="col-span-2 sleek-card p-12 text-center space-y-4"
              >
                <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto">
                  <AlertCircle className="w-6 h-6 text-red-500" />
                </div>
                <p className="text-ios-text font-medium">{error}</p>
                <button 
                  onClick={fetchNews}
                  className="text-ios-blue font-semibold text-sm"
                >
                  다시 시도하기
                </button>
              </motion.div>
            ) : (
              articles.map((article, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="sleek-card p-6 flex flex-col hover:scale-[1.01]"
                >
                  <div className="category-tag">{(article as any).category || "General AI"}</div>
                  <h2 className="text-[18px] font-bold leading-[1.3] mb-3 text-black line-clamp-2">
                    {article.title}
                  </h2>
                  <ul className="flex-1 space-y-2">
                    {article.summary.map((point, pIdx) => (
                      <li key={pIdx} className="text-[13px] leading-[1.5] text-[#3A3A3C] pl-4 relative before:content-['•'] before:absolute before:left-0 before:text-ios-blue before:font-bold">
                        {point}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-4 pt-3 border-t border-black/5 flex justify-between items-center">
                    <span className="text-[11px] text-ios-gray font-medium">{article.source}</span>
                    <a 
                      href={article.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-[12px] text-ios-blue font-semibold hover:underline"
                    >
                      Details →
                    </a>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>

          {!loading && !error && articles.length === 0 && (
            <div className="col-span-2 text-center py-20 text-ios-gray">
              <Newspaper className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p>현재 표시할 뉴스가 없습니다.</p>
            </div>
          )}
        </div>
      </main>

      <footer className="py-4 px-10 text-[11px] text-[#AEAEB2] text-center bg-white border-t border-black/10">
        Blueprint AI Tech Curator • Designed with iOS Human Interface Guidelines • Confidential Research Daily Feed
      </footer>
    </div>
  );
}
