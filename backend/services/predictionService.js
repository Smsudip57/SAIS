const yahooFinance = require("yahoo-finance2").default;
const Prediction = require("../models/prediction");
const log = require("../helper/logger");
const OpenAI = require("openai");
const { Agent, run } = require('@openai/agents');

// Initialize OpenAI client once at module load
let openaiClient = null;

function getOpenAIClient() {
    if (!openaiClient) {
        const openaiApiKey = process.env.OPENAI_API_KEY || process.env.OpenAI_Key?.replace(/"/g, "");
        if (!openaiApiKey) {
            throw new Error("OPENAI_API_KEY or OpenAI_Key environment variable not set");
        }
        openaiClient = new OpenAI({
            apiKey: openaiApiKey,
        });
    }
    return openaiClient;
}

// Background refresh management - prevents duplicate and concurrent requests
const refreshInProgress = new Set(); // Currently running refreshes
const refreshScheduled = new Map(); // Scheduled refreshes {symbol: timeoutId}

async function refreshPredictionBackground(symbol) {
    const upperSymbol = symbol.toUpperCase();

    // Skip if already in progress
    if (refreshInProgress.has(upperSymbol)) {
        log.log(`⏭️  [SKIP] Refresh already in progress for ${upperSymbol}`);
        return;
    }

    refreshInProgress.add(upperSymbol);
    log.log(`🔄 [BG] Starting background refresh for ${upperSymbol}...`);

    try {
        await generateNewPrediction(upperSymbol);
        log.log(`✅ [BG] Background refresh completed for ${upperSymbol}`);
    } catch (error) {
        log.error(`❌ [BG] Background refresh failed for ${upperSymbol}:`, error.message);
    } finally {
        refreshInProgress.delete(upperSymbol);
        refreshScheduled.delete(upperSymbol);
    }
}

// Schedule background refresh with deduplication
function scheduleBackgroundRefresh(symbol, delayMs = 0) {
    const upperSymbol = symbol.toUpperCase();

    // Cancel existing scheduled refresh to prevent duplicates
    if (refreshScheduled.has(upperSymbol)) {
        clearTimeout(refreshScheduled.get(upperSymbol));
        log.log(`📋 [DEDUPE] Cancelled previous scheduled refresh for ${upperSymbol}`);
    }

    // Schedule new refresh
    const timeoutId = setTimeout(() => {
        refreshPredictionBackground(upperSymbol);
    }, delayMs);

    refreshScheduled.set(upperSymbol, timeoutId);
    return timeoutId;
}

// Helper function to call OpenAI Agent for all 3 languages in a single API call
async function callAIForPredictions(ticker, currentPrice, recentChange, historicalSummary, newsSection) {
    log.log(`🤖 Creating tri-language prediction agent for ${ticker}...`);

    try {
        const trilingualAgent = new Agent({
            name: 'Trilingual Financial Analyst Agent',
            instructions: `You are a financial analyst who provides stock predictions in three languages simultaneously: English, Arabic, and Chinese. 
For each analysis, provide predictions in all three languages in a single JSON response to optimize API efficiency.
Always return valid JSON with 'en', 'ar', and 'zh' keys containing predictions.
Return ONLY the JSON object with NO additional text, markdown formatting, or explanations.`,
            openaiClient: getOpenAIClient()
        });

        const analysisInput = `Analyze ${ticker} stock for next-day prediction with:
- Current price: ${currentPrice}
- Recent change: ${recentChange}%
- Historical context: ${historicalSummary}
- Recent news: ${newsSection}

Return ONLY this JSON structure (no markdown, no extra text):
{
  "en": {
    "pred_pct": number between -10 and 10,
    "confidence": number between 0 and 1,
    "rationale": "detailed explanation in English",
    "evidence": [{"detail": "point 1", "source_link": "url or source"}, {"detail": "point 2", "source_link": "url"}]
  },
  "ar": {
    "pred_pct": number between -10 and 10,
    "confidence": number between 0 and 1,
    "rationale": "شرح مفصل باللغة العربية",
    "evidence": [{"detail": "نقطة 1", "source_link": "url"}]
  },
  "zh": {
    "pred_pct": number between -10 and 10,
    "confidence": number between 0 and 1,
    "rationale": "中文详细解释",
    "evidence": [{"detail": "证据点1", "source_link": "url"}]
  }
}`;

        log.log(`📤 Sending single API request for all 3 language predictions...`);
        const result = await run(trilingualAgent, analysisInput);

        if (!result || !result.finalOutput) {
            throw new Error("No response from AI agent");
        }

        const aiMessage = result.finalOutput;
        log.log(`📩 Received AI response, parsing...`);

        // Try to parse the JSON response from AI
        let predictions;
        try {
            // Remove markdown code blocks if present
            let cleanedMessage = aiMessage.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

            // Try to extract JSON object from response
            let jsonMatch = cleanedMessage.match(/\{[\s\S]*\}/);

            if (!jsonMatch) {
                log.error(`❌ No JSON found in response. Raw response: ${aiMessage.substring(0, 200)}`);
                throw new Error("No valid JSON found in response");
            }

            const parsed = JSON.parse(jsonMatch[0]);

            // Validate that all three languages are present
            if (!parsed.en || !parsed.ar || !parsed.zh) {
                log.warn(`⚠️  Missing languages in response. Available: ${Object.keys(parsed).join(', ')}`);
            }

            // Ensure all three languages are present with fallbacks
            predictions = {
                en: parsed.en || { pred_pct: 0, confidence: 0, rationale: "No English prediction generated", evidence: [] },
                ar: parsed.ar || { pred_pct: 0, confidence: 0, rationale: "لم يتم إنشاء توقع عربي", evidence: [] },
                zh: parsed.zh || { pred_pct: 0, confidence: 0, rationale: "未生成中文预测", evidence: [] }
            };

            log.log(`✅ Successfully parsed predictions for EN, AR, ZH`);

        } catch (parseError) {
            log.error(`❌ JSON parsing error:`, parseError.message);
            log.error(`Response was: ${aiMessage.substring(0, 500)}`);

            // Return empty predictions as fallback
            predictions = {
                en: {
                    pred_pct: null,
                    confidence: 0,
                    rationale: `Failed to parse AI response: ${aiMessage.substring(0, 200)}`,
                    evidence: [],
                },
                ar: {
                    pred_pct: null,
                    confidence: 0,
                    rationale: "فشل في تحليل الاستجابة",
                    evidence: [],
                },
                zh: {
                    pred_pct: null,
                    confidence: 0,
                    rationale: "无法解析AI响应",
                    evidence: [],
                }
            };
        }

        return predictions;
    } catch (error) {
        log.error(`Error calling OpenAI Agent for tri-language prediction:`, error.message);
        throw error;
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
        log.log(`📰 Fetching news for ${ticker} using OpenAI web search...`);

        const client = getOpenAIClient();

        const newsResponse = await client.responses.create({
            model: "gpt-4o-mini",
            tools: [
                { type: "web_search" },
            ],
            input: `Find recent news and market sentiment for ${ticker} stock from the last 7 days. Focus on earnings, analyst reports, company announcements, and market developments.`,
        });

        if (newsResponse && newsResponse.output_text) {
            newsSection = newsResponse.output_text;
            log.log(`✅ Fetched recent news for ${ticker} via web search`);
        } else {
            log.warn(`No news found for ${ticker} via web search`);
            newsSection = `No recent news found for ${ticker} via web search. Analysis will focus on technical indicators.`;
        }
    } catch (newsError) {
        log.error("Error fetching news via OpenAI web search:", newsError.message);
        newsSection = `Unable to fetch recent news for ${ticker} via web search. Using historical context only.`;
    }

    // Generate predictions for all 3 languages in a SINGLE API call (optimized for cost)
    log.log("🤖 Calling AI model for all 3 language predictions in ONE API call...");

    const predictions = await callAIForPredictions(ticker, currentPrice, recentChange, historicalSummary, newsSection);

    // Use English prediction for legacy 'prediction' field (backward compatibility)
    const prediction = predictions.en;

    log.log(`💾 Attempting to save prediction for ${upperSymbol} to database...`);

    let predictionDoc;
    try {
        predictionDoc = await Prediction.findOneAndUpdate(
            { symbol: upperSymbol },
            {
                symbol: upperSymbol,
                currentPrice,
                recentChange,
                prediction,  // Legacy field for backward compatibility
                predictions, // New multi-language predictions
                model: "openai/agents-gpt-4o-mini",
                timestamp: new Date(),
            },
            {
                upsert: true,
                new: true,
                runValidators: true,
            }
        );
        log.log(`✅ Prediction saved successfully for ${upperSymbol}`);
    } catch (dbError) {
        log.error(`❌ Database error saving prediction for ${upperSymbol}:`, dbError.message);
        // Return predictions even if DB save fails
        predictionDoc = {
            _id: null,
            symbol: upperSymbol,
            currentPrice,
            recentChange,
            prediction,
            predictions,
            model: "openai/agents-gpt-4o-mini",
            timestamp: new Date(),
        };
        log.log(`⚠️  Returning prediction without DB save due to database error`);
    }

    // Ensure response always has predictions object (for backward compatibility)
    const normalizedPredictions = predictionDoc.predictions || {
        en: predictionDoc.prediction || {},
        ar: predictionDoc.prediction || {},
        zh: predictionDoc.prediction || {}
    };

    return {
        _id: predictionDoc._id,
        symbol: predictionDoc.symbol,
        currentPrice: predictionDoc.currentPrice,
        recentChange: predictionDoc.recentChange,
        prediction: predictionDoc.prediction,  // Legacy field
        predictions: normalizedPredictions,    // Multi-language predictions (normalized)
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

        // Fresh cache - return immediately without scheduling refresh
        if (latestPrediction && !isExpired) {
            log.log(`✅ Cache HIT for ${upperSymbol} (fresh, expires in ${Math.round((latestPrediction.updatedAt.getTime() + 6 * 60 * 60 * 1000 - now.getTime()) / 60000)} minutes)`);

            // Normalize predictions for backward compatibility with old predictions
            const normalizedPredictions = latestPrediction.predictions || {
                en: latestPrediction.prediction || {},
                ar: latestPrediction.prediction || {},
                zh: latestPrediction.prediction || {}
            };

            return {
                fromCache: true,
                isFresh: true,
                cachedAt: latestPrediction.updatedAt,
                ...latestPrediction,
                predictions: normalizedPredictions,
            };
        }

        // Stale cache - return data AND schedule ONE background refresh (with deduplication)
        if (latestPrediction && isExpired) {
            log.log(`⚠️  Cache EXPIRED for ${upperSymbol} (expired ${Math.round((now.getTime() - latestPrediction.updatedAt.getTime()) / 60000)} minutes ago)`);

            // Only schedule if NOT already scheduled or in progress
            if (!refreshInProgress.has(upperSymbol) && !refreshScheduled.has(upperSymbol)) {
                // Refresh immediately - no delay needed since this stock is the only one expired
                const delayMs = 0;
                scheduleBackgroundRefresh(upperSymbol, delayMs);
                log.log(`📤 [QUEUED] Refresh for ${upperSymbol} starting NOW`);
            } else {
                log.log(`📋 [SKIP] Refresh already scheduled/in-progress for ${upperSymbol}`);
            }

            // Normalize predictions for backward compatibility with old predictions
            const normalizedPredictions = latestPrediction.predictions || {
                en: latestPrediction.prediction || {},
                ar: latestPrediction.prediction || {},
                zh: latestPrediction.prediction || {}
            };

            return {
                fromCache: true,
                isFresh: false,
                isStale: true,
                staleSince: latestPrediction.updatedAt,
                message: `Returning stale cached data while background refresh is scheduled.`,
                ...latestPrediction,
                predictions: normalizedPredictions,
            };
        }

        // No prediction exists - generate new one
        log.log(`🆕 No cached prediction for ${upperSymbol}, generating new...`);
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
