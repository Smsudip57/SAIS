const yahooFinance = require("yahoo-finance2").default;
const axios = require("axios");
const Prediction = require("../models/prediction");
const log = require("../helper/logger");


async function refreshPredictionBackground(symbol) {
    try {
        log.log(`🔄 [BG] Starting background refresh for ${symbol}...`);
        await generateNewPrediction(symbol);
        log.log(`✅ [BG] Background refresh completed for ${symbol}`);
    } catch (error) {
        log.error(`❌ [BG] Background refresh failed for ${symbol}:`, error.message);
    }
}


async function generateNewPrediction(symbol) {
    const upperSymbol = symbol.toUpperCase();

    const stockData = await yahooFinance.quote(upperSymbol);

    if (!stockData) {
        throw new Error(`Stock ${upperSymbol} not found`);
    }

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
        log.warn("Historical data fetch failed:", histError.message);
    }

    let historicalSummary = "Historical data not available";
    if (historicalData && historicalData.length > 0) {
        const prices = historicalData.map((d) => d.close);
        const volumes = historicalData.map((d) => d.volume);
        const avgPrice = (prices.reduce((a, b) => a + b, 0) / prices.length).toFixed(2);
        const avgVolume = Math.round(volumes.reduce((a, b) => a + b, 0) / volumes.length);
        const priceRange = `${Math.min(...prices).toFixed(2)} - ${Math.max(...prices).toFixed(2)}`;

        historicalSummary = `Average price: $${avgPrice}, Price range: $${priceRange}, Average volume: ${avgVolume.toLocaleString()}`;
    }

    const ticker = stockData.symbol;
    const currentPrice = stockData.regularMarketPrice;
    const recentChange = stockData.regularMarketChangePercent;

    let newsSection = "No recent news available";

    try {
        log.log(`📰 Fetching news for ${ticker}...`);
        const avApiKey = process.env.AV_Key;

        if (!avApiKey) {
            log.warn("AV_Key environment variable not set");
        } else {
            const newsResponse = await axios.get(
                `https://www.alphavantage.co/query?function=NEWS_SENTIMENT&tickers=${ticker}&apikey=${avApiKey}`,
                {
                    timeout: 15000,
                    headers: {
                        "User-Agent": "SAIS-Stock-Predictor/1.0",
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

                log.log(`✅ Fetched ${recentNews.length} news articles for ${ticker}`);
            } else if (newsResponse.data && newsResponse.data.Information) {
                log.warn("Alpha Vantage API limit:", newsResponse.data.Information);
                newsSection = `API rate limit reached for ${ticker}. Analysis will focus on technical indicators.`;
            }
        }
    } catch (newsError) {
        log.error("Error fetching news from Alpha Vantage:", newsError.message);
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

    const openRouterApiKey = process.env.OpenRouter_Key?.replace(/"/g, "");

    if (!openRouterApiKey) {
        throw new Error("OpenRouter_Key environment variable not set");
    }

    log.log("🤖 Calling AI model for prediction...");

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
                "X-Title": "SAIS AI Assistant",
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
        log.error("JSON parsing error:", parseError.message);
        prediction = {
            pred_pct: null,
            confidence: null,
            rationale: aiMessage,
            evidence: ["AI response could not be parsed as JSON"],
        };
    }

    const predictionDoc = await Prediction.findOneAndUpdate(
        { symbol: upperSymbol },
        {
            symbol: upperSymbol,
            currentPrice,
            recentChange,
            prediction,
            model: "deepseek/deepseek-r1",
            timestamp: new Date(),
        },
        {
            upsert: true,
            new: true,
            runValidators: true,
        }
    );

    log.log(`💾 Saved/Updated prediction for ${upperSymbol} to database`);

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


async function getOrCreatePrediction(symbol, index = 0) {
    try {
        const upperSymbol = symbol.toUpperCase();

        const latestPrediction = await Prediction.findOne({
            symbol: upperSymbol,
        })
            .sort({ createdAt: -1 })
            .lean();

        const now = new Date();
        const sixHoursAgo = new Date(now - 6 * 60 * 60 * 1000);
        const isExpired = latestPrediction && latestPrediction.updatedAt < sixHoursAgo;
        if (latestPrediction && !isExpired) {
            log.log(`✅ Using cached prediction for ${upperSymbol}`);
            return {
                fromCache: true,
                isFresh: true,
                cachedAt: latestPrediction.updatedAt,
                ...latestPrediction,
            };
        }

        if (latestPrediction && isExpired) {
            log.log(`⏰ Cache expired for ${upperSymbol}, returning stale data + refreshing background (index: ${index})`);

            const delayMs = index * 10 * 60 * 1000;

            setTimeout(() => {
                refreshPredictionBackground(upperSymbol);
            }, delayMs);

            log.log(`🕐 Background refresh for ${upperSymbol} scheduled in ${delayMs / 60000} minutes`);

            return {
                fromCache: true,
                isFresh: false,
                isStale: true,
                staleSince: latestPrediction.updatedAt,
                message: `Returning cached data while refreshing in background (scheduled in ${delayMs / 60000} minutes)...`,
                scheduledRefreshIn: `${delayMs / 60000} minutes`,
                ...latestPrediction,
            };
        }

        log.log(`🆕 No prediction found for ${upperSymbol}, generating new...`);
        const newPrediction = await generateNewPrediction(upperSymbol);

        return {
            fromCache: false,
            isFresh: true,
            isFirstTime: true,
            savedAt: newPrediction.timestamp,
            ...newPrediction,
        };
    } catch (error) {
        log.error(`❌ Error in getOrCreatePrediction for ${symbol}:`, error.message);
        throw error;
    }
}

module.exports = {
    getOrCreatePrediction,
    refreshPredictionBackground,
    generateNewPrediction,
};

