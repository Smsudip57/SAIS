const express = require("express");
const yahooFinance = require("yahoo-finance2").default;
const axios = require("axios");
const router = express.Router();
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const { getIO } = require("../socket/socket");
const {
  getAllCachedData,
  getDataForDateRange,
  fetchHistoricalData,
  STOCKS,
} = require("../services/stockStream");

const notify = (data) => {
  const io = getIO();
  const { userId } = data;
  if (!userId) throw new Error("User ID is required for notification");
  console.log("Sending notification to user:", userId);
  io.to(userId.toString()).emit("notification", data);
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, "../public");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    if (!req.user || !req.user._id) {
      return cb(new Error("User not authenticated"));
    }
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `profile-${req.user._id}-${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only JPEG, PNG, and WebP are allowed."));
    }
  },
});

// For onetime Proxysales
const ipRanges = [
  { value: "161.248", label: "161.248", price: 30 },
  { value: "163.61", label: "163.61", price: 30 },
  { value: "157.15", label: "157.15", price: 35 },
  { value: "160.191", label: "160.191", price: 40 },
  { value: "163.227", label: "163.227", price: 40 },
  { value: "103.157", label: "103.157", price: 45 },
];

// Get stock data endpoint
router.get("/stockdata", async (req, res) => {
  try {
    const { stock } = req.query;

    if (!stock) {
      return res.status(400).json({
        success: false,
        message: "Stock symbol is required",
      });
    }

    // Fetch stock data from Yahoo Finance
    const stockData = await yahooFinance.quote(stock);

    if (!stockData) {
      return res.status(404).json({
        success: false,
        message: "Stock data not found",
      });
    }

    // Return relevant stock information
    res.status(200).json({
      success: true,
      data: {
        symbol: stockData.symbol,
        shortName: stockData.shortName,
        longName: stockData.longName,
        regularMarketPrice: stockData.regularMarketPrice,
        regularMarketChange: stockData.regularMarketChange,
        regularMarketChangePercent: stockData.regularMarketChangePercent,
        regularMarketTime: stockData.regularMarketTime,
        regularMarketDayHigh: stockData.regularMarketDayHigh,
        regularMarketDayLow: stockData.regularMarketDayLow,
        regularMarketVolume: stockData.regularMarketVolume,
        marketCap: stockData.marketCap,
        currency: stockData.currency,
      },
    });
  } catch (error) {
    console.error("Error fetching stock data:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch stock data",
      error: error.message,
    });
  }
});

router.get("/bulk", async (req, res) => {
  try {
    // Predefined list of allowed stocks
    const allowedStocks = ["AAPL", "GOOGL", "AMZN", "MSFT", "TSLA", "META"];

    // Fetch data for all allowed stocks
    const stockPromises = allowedStocks.map(async (symbol) => {
      try {
        const stockData = await yahooFinance.quote(symbol);
        return {
          symbol: stockData.symbol,
          shortName: stockData.shortName,
          longName: stockData.longName,
          regularMarketPrice: stockData.regularMarketPrice,
          regularMarketChange: stockData.regularMarketChange,
          regularMarketChangePercent: stockData.regularMarketChangePercent,
          regularMarketTime: stockData.regularMarketTime,
          regularMarketDayHigh: stockData.regularMarketDayHigh,
          regularMarketDayLow: stockData.regularMarketDayLow,
          regularMarketVolume: stockData.regularMarketVolume,
          marketCap: stockData.marketCap,
          currency: stockData.currency,
        };
      } catch (error) {
        console.error(`Error fetching data for ${symbol}:`, error.message);
        return {
          symbol: symbol,
          error: `Failed to fetch data for ${symbol}`,
        };
      }
    });

    // Wait for all stock data to be fetched
    const stocksData = await Promise.all(stockPromises);

    res.status(200).json({
      success: true,
      data: stocksData,
      count: stocksData.length,
    });
  } catch (error) {
    console.error("Error fetching bulk stock data:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch bulk stock data",
      error: error.message,
    });
  }
});

router.get("/predict", async (req, res) => {
  try {
    const { stock } = req.query;

    if (!stock) {
      return res.status(400).json({
        success: false,
        message: "Stock symbol is required",
      });
    }

    // Fetch current stock data from Yahoo Finance
    const stockData = await yahooFinance.quote(stock);

    if (!stockData) {
      return res.status(404).json({
        success: false,
        message: "Stock data not found",
      });
    }

    // Get historical data for the last 30 days
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    let historicalData;
    try {
      historicalData = await yahooFinance.historical(stock, {
        period1: startDate,
        period2: endDate,
        interval: "1d",
      });
    } catch (histError) {
      console.warn("Historical data fetch failed:", histError.message);
      historicalData = [];
    }

    // Create historical summary
    let historicalSummary = "Historical data not available";
    if (historicalData && historicalData.length > 0) {
      const prices = historicalData.map((d) => d.close);
      const volumes = historicalData.map((d) => d.volume);
      const avgPrice = (
        prices.reduce((a, b) => a + b, 0) / prices.length
      ).toFixed(2);
      const avgVolume = Math.round(
        volumes.reduce((a, b) => a + b, 0) / volumes.length
      );
      const priceRange = `${Math.min(...prices).toFixed(2)} - ${Math.max(
        ...prices
      ).toFixed(2)}`;

      historicalSummary = `Average price: $${avgPrice}, Price range: $${priceRange}, Average volume: ${avgVolume.toLocaleString()}`;
    }

    // Extract key data
    const ticker = stockData.symbol;
    const currentPrice = stockData.regularMarketPrice;
    const recentChange = stockData.regularMarketChangePercent;

    // Fetch real news using Alpha Vantage News Sentiment API
    let newsSection = "No recent news available";

    try {
      console.log(`Fetching news for ${ticker} using Alpha Vantage...`);
      const avApiKey = process.env.AV_Key;

      const newsResponse = await axios.get(
        `https://www.alphavantage.co/query?function=NEWS_SENTIMENT&tickers=${ticker}&apikey=${avApiKey}`,
        {
          timeout: 15000,
          headers: {
            "User-Agent": "NetBay-Stock-Predictor/1.0",
          },
        }
      );

      if (
        newsResponse.data &&
        newsResponse.data.feed &&
        newsResponse.data.feed.length > 0
      ) {
        // Take the most recent 10 news articles
        const recentNews = newsResponse.data.feed.slice(0, 10);

        newsSection = recentNews
          .map((article) => {
            const title = article.title || "No title";
            const summary = article.summary || "No summary available";
            const date = article.time_published
              ? article.time_published
                .substring(0, 8)
                .replace(/(\d{4})(\d{2})(\d{2})/, "$1-$2-$3")
              : "Unknown date";
            const sentiment = article.overall_sentiment_label || "Neutral";
            const score = article.overall_sentiment_score
              ? `(${(article.overall_sentiment_score * 100).toFixed(1)}%)`
              : "";
            const url = article.url || "";

            return `[${date}] ${sentiment}${score} ${title}: ${summary.substring(
              0,
              150
            )}... SOURCE: ${url}`;
          })
          .join(" ");

        console.log(
          `Successfully fetched ${recentNews.length} news articles for ${ticker}`
        );
      } else if (newsResponse.data && newsResponse.data.Information) {
        console.warn("Alpha Vantage API limit:", newsResponse.data.Information);
        newsSection = `API rate limit reached for ${ticker}. Analysis will focus on technical indicators.`;
      } else {
        newsSection = `No recent news found for ${ticker}`;
        console.log(`No news articles found for ${ticker}`);
      }
    } catch (newsError) {
      console.error(
        "Error fetching news from Alpha Vantage:",
        newsError.message
      );
      if (newsError.response?.status === 429) {
        newsSection = `API rate limit exceeded for ${ticker}. Analysis based on price data only.`;
      } else {
        newsSection = `Unable to fetch recent news for ${ticker}. Using historical context only.`;
      }
    }
    // return res.json({ success: true, message: "News fetched", news: newsSection });

    console.log("News Section:", newsSection);
    // Create the AI prompt
    const prompt = `You are a financial analyst. Ticker: ${ticker}
Current price: ${currentPrice}, recent % change: ${recentChange}
Historical summary (last 30 days):
${historicalSummary}

Recent news (each news item includes SOURCE: [url] at the end):
${newsSection}

Task:
1. Predict next-day stock movement in percent (pred_pct)
2. Provide confidence (0-1)
3. Give detailed rationale citing historical trends and news (if any)
4. Provide evidence as array of objects with "detail" and "source_link" properties

Return JSON format:
{
  "pred_pct": number,
  "confidence": number,
  "rationale": "detailed explanation",
  "evidence": [
    {"detail": "specific evidence point", "source_link": "news article url or 'Technical Analysis'"},
    {"detail": "another evidence point", "source_link": "news article url or 'Historical Data'"},
    {"detail": "third evidence point", "source_link": "news article url or 'Market Sentiment'"}
  ]
}`;

    // OpenRouter API configuration
    const openRouterApiKey = process.env.OpenRouter_Key.replace(/"/g, ""); // Remove quotes from env variable

    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "deepseek/deepseek-r1",
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        max_tokens: 1000,
        temperature: 0.2, // Lower temperature for more consistent financial analysis
      },
      {
        headers: {
          Authorization: `Bearer ${openRouterApiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": process.env.Current_Url || "http://localhost:3001",
          "X-Title": "NetBay AI Assistant",
        },
      }
    );

    if (
      !response.data ||
      !response.data.choices ||
      response.data.choices.length === 0
    ) {
      return res.status(500).json({
        success: false,
        message: "No response from AI model",
      });
    }

    const aiMessage = response.data.choices[0].message.content;

    // Try to parse the JSON response from AI
    let prediction;
    try {
      // Remove markdown code blocks if present
      let cleanedMessage = aiMessage.replace(/```json\n?/g, '').replace(/```\n?/g, '');

      // Extract JSON from the AI response (in case there's extra text)
      const jsonMatch = cleanedMessage.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        prediction = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No valid JSON found in response");
      }
    } catch (parseError) {
      console.error("JSON parsing error:", parseError.message);
      console.log("AI Message:", aiMessage);

      // If JSON parsing fails, return the raw response
      prediction = {
        pred_pct: null,
        confidence: null,
        rationale: aiMessage,
        evidence: ["AI response could not be parsed as JSON"],
      };
    }

    res.status(200).json({
      success: true,
      data: {
        stock: ticker,
        currentPrice: currentPrice,
        recentChange: recentChange,
        prediction: prediction,
        model: "deepseek/deepseek-r1",
        timestamp: new Date().toISOString(),
        usage: response.data.usage || null,
      },
    });
  } catch (error) {
    console.error(
      "Error in stock prediction:",
      error.response?.data || error.message
    );
    res.status(500).json({
      success: false,
      message: "Failed to get stock prediction",
      error: error.response?.data?.error || error.message,
    });
  }
});

// Get historical data for stocks (initial load for charts)
router.get("/stocks/historical", async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const result = {};

    // Fetch historical data for all stocks
    const promises = STOCKS.map(async (symbol) => {
      try {
        const data = await fetchHistoricalData(symbol, parseInt(days));
        result[symbol] = data;
      } catch (error) {
        console.error(`Error fetching historical data for ${symbol}:`, error);
        result[symbol] = [];
      }
    });

    await Promise.all(promises);
    res.status(200).json({
      success: true,
      data: result,
      stocks: STOCKS,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error fetching historical stock data:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch historical stock data",
      error: error.message,
    });
  }
});

// Get cached real-time data for specific date range
router.get("/stocks/range", async (req, res) => {
  try {
    const { symbol, startDate, endDate } = req.query;

    if (!symbol || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: "symbol, startDate, and endDate are required",
      });
    }

    if (!STOCKS.includes(symbol.toUpperCase())) {
      return res.status(400).json({
        success: false,
        message: `Invalid symbol. Allowed stocks: ${STOCKS.join(", ")}`,
      });
    }

    const data = getDataForDateRange(symbol, startDate, endDate);

    res.status(200).json({
      success: true,
      symbol,
      data,
      count: data.length,
      startDate,
      endDate,
    });
  } catch (error) {
    console.error("Error fetching stock data for date range:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch stock data for date range",
      error: error.message,
    });
  }
});

// Get all cached stocks data
router.get("/stocks/current", async (req, res) => {
  try {
    const allData = getAllCachedData();

    res.status(200).json({
      success: true,
      data: allData,
      stocks: STOCKS,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error fetching current stock data:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch current stock data",
      error: error.message,
    });
  }
});

module.exports = router;
