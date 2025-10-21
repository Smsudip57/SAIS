const yahooFinance = require("yahoo-finance2").default;
const axios = require("axios");
const Prediction = require("../models/prediction");

/**
 * Background job to refresh prediction without blocking user
 * This runs independently and updates DB silently
 */
async function refreshPredictionBackground(symbol) {
  try {
    console.log(`🔄 [BG] Starting background refresh for ${symbol}...`);
    await generateNewPrediction(symbol);
    console.log(`✅ [BG] Background refresh completed for ${symbol}`);
  } catch (error) {
    console.error(`❌ [BG] Background refresh failed for ${symbol}:`, error.message);
    // Don't throw - background job failures shouldn't affect anything
  }
}

/**
 * Generate new prediction and save to DB
 * Used by both direct calls and background refresh
 */
async function generateNewPrediction(symbol) {
  const upperSymbol = symbol.toUpperCase();

  // Fetch current stock data from Yahoo Finance
  const stockData = await yahooFinance.quote(upperSymbol);

  if (!stockData) {
    throw new Error(`Stock ${upperSymbol} not found`);
  }

  // Get historical data for the last 30 days
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 30);

  let historicalData = [];
  try {
    historicalData = await yahooFinance.historical(upperSymbol, {
      period1: startDate,
      period2: endDate,
      interval: "1d",
    });
  } catch (histError) {
    console.warn("Historical data fetch failed:", histError.message);
  }

  // Create historical summary
  let historicalSummary = "Historical data not available";
  if (historicalData && historicalData.length > 0) {
    const prices = historicalData.map((d) => d.close);
    const volumes = historicalData.map((d) => d.volume);
    const avgPrice = (prices.reduce((a, b) => a + b, 0) / prices.length).toFixed(2);
    const avgVolume = Math.round(volumes.reduce((a, b) => a + b, 0) / volumes.length);
    const priceRange = `${Math.min(...prices).toFixed(2)} - ${Math.max(...prices).toFixed(2)}`;

    historicalSummary = `Average price: $${avgPrice}, Price range: $${priceRange}, Average volume: ${avgVolume.toLocaleString()}`;
  }

  // Extract key data
  const ticker = stockData.symbol;
  const currentPrice = stockData.regularMarketPrice;
  const recentChange = stockData.regularMarketChangePercent;

  // Fetch real news using Alpha Vantage News Sentiment API
  let newsSection = "No recent news available";

  try {
    console.log(`📰 Fetching news for ${ticker}...`);
    const avApiKey = process.env.AV_Key;

    if (!avApiKey) {
      console.warn("AV_Key environment variable not set");
    } else {
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

            return `[${date}] ${sentiment}${score} ${title}: ${summary.substring(0, 150)}... SOURCE: ${url}`;
          })
          .join(" ");

        console.log(`✅ Fetched ${recentNews.length} news articles for ${ticker}`);
      } else if (newsResponse.data && newsResponse.data.Information) {
        console.warn("Alpha Vantage API limit:", newsResponse.data.Information);
        newsSection = `API rate limit reached for ${ticker}. Analysis will focus on technical indicators.`;
      }
    }
  } catch (newsError) {
    console.error("Error fetching news from Alpha Vantage:", newsError.message);
    if (newsError.response?.status === 429) {
      newsSection = `API rate limit exceeded for ${ticker}. Analysis based on price data only.`;
    } else {
      newsSection = `Unable to fetch recent news for ${ticker}. Using historical context only.`;
    }
  }

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
  const openRouterApiKey = process.env.OpenRouter_Key?.replace(/"/g, "");

  if (!openRouterApiKey) {
    throw new Error("OpenRouter_Key environment variable not set");
  }

  console.log("🤖 Calling AI model for prediction...");

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
      temperature: 0.2,
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
    throw new Error("No response from AI model");
  }

  const aiMessage = response.data.choices[0].message.content;

  // Try to parse the JSON response from AI
  let prediction;
  try {
    let cleanedMessage = aiMessage.replace(/```json\n?/g, "").replace(/```\n?/g, "");
    const jsonMatch = cleanedMessage.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      prediction = JSON.parse(jsonMatch[0]);
    } else {
      throw new Error("No valid JSON found in response");
    }
  } catch (parseError) {
    console.error("JSON parsing error:", parseError.message);
    prediction = {
      pred_pct: null,
      confidence: null,
      rationale: aiMessage,
      evidence: ["AI response could not be parsed as JSON"],
    };
  }

  // Update or create prediction (replace old with new)
  const predictionDoc = await Prediction.findOneAndUpdate(
    { symbol: upperSymbol }, // Find by symbol
    {
      // Replace with new data
      symbol: upperSymbol,
      currentPrice,
      recentChange,
      prediction,
      model: "deepseek/deepseek-r1",
      timestamp: new Date(), // Update timestamp
    },
    { 
      upsert: true, // Create if doesn't exist
      new: true, // Return updated document
      runValidators: true,
    }
  );

  console.log(`💾 Saved/Updated prediction for ${upperSymbol} to database`);

  return {
    _id: predictionDoc._id,
    symbol: predictionDoc.symbol,
    currentPrice: predictionDoc.currentPrice,
    recentChange: predictionDoc.recentChange,
    prediction: predictionDoc.prediction,
    model: predictionDoc.model,
    timestamp: predictionDoc.timestamp,
  };
}

/**
 * Get or create a prediction for a stock with sequential refresh delay
 * NEW BEHAVIOR:
 * - If cache exists (< 3 hours): Return it immediately
 * - If cache expired (> 3 hours): Return stale data + refresh in background (with index-based delay)
 * - If no cache: Generate new prediction (user waits first time only)
 * 
 * @param {string} symbol - Stock symbol
 * @param {number} index - Index in the stocks array (0-based) for sequential refresh
 * @returns {object} Prediction data with cache info
 */
async function getOrCreatePrediction(symbol, index = 0) {
  try {
    // Convert to uppercase for consistency
    const upperSymbol = symbol.toUpperCase();

    // Check for existing prediction (any age)
    const latestPrediction = await Prediction.findOne({
      symbol: upperSymbol,
    })
      .sort({ createdAt: -1 })
      .lean();

    // Calculate age of prediction
    const now = new Date();
    const threeHoursAgo = new Date(now - 3 * 60 * 60 * 1000);
    const isExpired = latestPrediction && latestPrediction.createdAt < threeHoursAgo;

    // CASE 1: Fresh cache (< 3 hours old) - Return immediately
    if (latestPrediction && !isExpired) {
      console.log(`✅ Using cached prediction for ${upperSymbol}`);
      return {
        fromCache: true,
        isFresh: true,
        cachedAt: latestPrediction.createdAt,
        ...latestPrediction,
      };
    }

    // CASE 2: Stale cache (> 3 hours old) - Return stale + refresh background
    if (latestPrediction && isExpired) {
      console.log(`⏰ Cache expired for ${upperSymbol}, returning stale data + refreshing background (index: ${index})`);

      // Calculate delay: index * 3 minutes to spread API calls
      const delayMs = index * 10 * 60 * 1000; // Convert to milliseconds
      
      // Trigger background refresh with delay (don't await, don't block)
      setTimeout(() => {
        refreshPredictionBackground(upperSymbol);
      }, delayMs);

      console.log(`🕐 Background refresh for ${upperSymbol} scheduled in ${delayMs / 60000} minutes`);

      return {
        fromCache: true,
        isFresh: false,
        isStale: true,
        staleSince: latestPrediction.createdAt,
        message: `Returning cached data while refreshing in background (scheduled in ${delayMs / 60000} minutes)...`,
        scheduledRefreshIn: `${delayMs / 60000} minutes`,
        ...latestPrediction,
      };
    }

    // CASE 3: No cache exists - Generate new (user waits, but only first time)
    console.log(`🆕 No prediction found for ${upperSymbol}, generating new...`);
    const newPrediction = await generateNewPrediction(upperSymbol);

    return {
      fromCache: false,
      isFresh: true,
      isFirstTime: true,
      savedAt: newPrediction.timestamp,
      ...newPrediction,
    };
  } catch (error) {
    console.error(`❌ Error in getOrCreatePrediction for ${symbol}:`, error.message);
    throw error;
  }
}

module.exports = {
  getOrCreatePrediction,
  refreshPredictionBackground,
  generateNewPrediction,
};

