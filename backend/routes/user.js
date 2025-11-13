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
const { getOrCreatePrediction } = require("../services/predictionService");

// Import models
const User = require("../models/user");
const Position = require("../models/position");
const Transaction = require("../models/transaction");
const PortfolioHistory = require("../models/portfolioHistory");

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

// Get single stock prediction
router.get("/predict", async (req, res) => {
  try {
    const { stock } = req.query;

    if (!stock) {
      return res.status(400).json({
        success: false,
        message: "Stock symbol is required",
      });
    }

    // Use the prediction service to get or create prediction
    const result = await getOrCreatePrediction(stock);

    res.status(200).json({
      success: true,
      data: {
        stock: result.symbol,
        currentPrice: result.currentPrice,
        recentChange: result.recentChange,
        prediction: result.prediction,
        predictions: result.predictions,  // ✅ Include all 3 languages (en, ar, zh)
        model: result.model,
        timestamp: result.timestamp,
        fromCache: result.fromCache,
        cacheInfo: result.fromCache
          ? `Cached prediction from ${result.cachedAt}`
          : `Fresh prediction generated at ${result.savedAt}`,
      },
    });
  } catch (error) {
    console.error("Error in stock prediction:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to get stock prediction",
      error: error.message,
    });
  }
});

// Get predictions for all stocks (with sequential scheduling to avoid API rate limits)
router.get("/stocks/predictions", async (req, res) => {
  try {
    const result = {};
    const errors = [];

    // Fetch predictions sequentially with index-based delays to avoid rate limiting
    await Promise.all(
      STOCKS.map(async (symbol, index) => {
        try {
          const prediction = await getOrCreatePrediction(symbol, index);
          result[symbol] = {
            symbol: prediction.symbol,
            currentPrice: prediction.currentPrice,
            recentChange: prediction.recentChange,
            prediction: prediction.prediction,
            predictions: prediction.predictions,  // ✅ Include all 3 languages (en, ar, zh)
            model: prediction.model,
            timestamp: prediction.timestamp,
            fromCache: prediction.fromCache,
            isFresh: prediction.isFresh,
            isStale: prediction.isStale,
            cachedAt: prediction.cachedAt,
            scheduledRefreshIn: prediction.scheduledRefreshIn,
          };
        } catch (error) {
          console.error(`Error fetching prediction for ${symbol}:`, error.message);
          errors.push({
            symbol,
            error: error.message,
          });
          result[symbol] = null;
        }
      })
    );

    res.status(200).json({
      success: true,
      data: result,
      stocks: STOCKS,
      generatedAt: new Date().toISOString(),
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error("Error fetching stock predictions:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch stock predictions",
      error: error.message,
    });
  }
});

// Get historical data for stocks (initial load for charts)
router.get("/stocks/historical", async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const result = {};

    // Fetch all historical data in parallel
    const historicalPromises = STOCKS.map(async (symbol) => {
      try {
        const data = await fetchHistoricalData(symbol, parseInt(days));
        result[symbol] = data;
      } catch (error) {
        // console.error(`Error fetching historical data for ${symbol}:`, error);
        result[symbol] = [];
      }
    });

    await Promise.all(historicalPromises);

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

// ==================== TRADING APIs ====================

// 1. GET /api/user/account - Get trading account info
router.get("/account", async (req, res) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    const user = await User.findById(userId).select("tradingAccounts currentAccountType");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      accounts: {
        demo: user.tradingAccounts.demo,
        real: user.tradingAccounts.real,
      },
      currentAccountType: user.currentAccountType,
    });
  } catch (error) {
    console.error("Error fetching account info:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch account info",
      error: error.message,
    });
  }
});

// 2. GET /api/user/positions - Get all positions for current account
router.get("/positions", async (req, res) => {
  try {
    const userId = req.user?._id;
    const { accountType } = req.query; // optional, defaults to user's current account

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    const user = await User.findById(userId).select("currentAccountType");
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const finalAccountType = accountType || user.currentAccountType;

    const positions = await Position.find({
      userId,
      accountType: finalAccountType,
    })
      .select("symbol shares avgBuyPrice currentPrice totalValue gainLoss gainLossPercent")
      .lean();

    res.status(200).json({
      success: true,
      accountType: finalAccountType,
      positions: positions || [],
      count: positions?.length || 0,
    });
  } catch (error) {
    console.error("Error fetching positions:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch positions",
      error: error.message,
    });
  }
});

// 3. POST /api/user/buy - Execute buy order
router.post("/buy", async (req, res) => {
  try {
    const userId = req.user?._id;
    const { symbol, shares, accountType } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    if (!symbol || !shares || shares <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid symbol or shares",
      });
    }

    // Get user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const finalAccountType = accountType || user.currentAccountType;

    // Get current stock price with timeout and fallback
    let pricePerShare;
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000); // 5 second timeout
      const stockData = await yahooFinance.quote(symbol);
      clearTimeout(timeout);

      if (!stockData) {
        return res.status(404).json({
          success: false,
          message: `Stock ${symbol} not found`,
        });
      }
      pricePerShare = stockData.regularMarketPrice;
    } catch (stockError) {
      console.warn(`Yahoo Finance timeout for ${symbol}, using fallback...`);
      // Try to get cached price from stockStream
      const cachedData = getAllCachedData();
      const cachedStock = cachedData[symbol.toUpperCase()];

      if (!cachedStock || cachedStock.length === 0) {
        return res.status(503).json({
          success: false,
          message: `Unable to fetch price for ${symbol}. Stock service unavailable.`,
        });
      }

      const latestCachedData = cachedStock[cachedStock.length - 1];
      // Real-time data has 'price' field, historical has 'close'
      pricePerShare = latestCachedData.price || latestCachedData.close;

      if (!pricePerShare) {
        return res.status(503).json({
          success: false,
          message: `No price data available for ${symbol}.`,
        });
      }

      console.log(`Using cached price for ${symbol}: $${pricePerShare}`);
    }
    const totalAmount = shares * pricePerShare;
    const account = user.tradingAccounts[finalAccountType];

    // Check balance
    if (account.balance < totalAmount) {
      return res.status(400).json({
        success: false,
        message: `Insufficient balance. Required: $${totalAmount.toFixed(2)}, Available: $${account.balance.toFixed(2)}`,
      });
    }

    // Create/Update Position
    let position = await Position.findOne({
      userId,
      accountType: finalAccountType,
      symbol: symbol.toUpperCase(),
    });

    if (position) {
      // Update existing position
      const oldTotalCost = position.totalCost;
      const oldShares = position.shares;
      const newTotalCost = oldTotalCost + totalAmount;
      const newShares = oldShares + shares;
      const newAvgBuyPrice = newTotalCost / newShares;

      position.shares = newShares;
      position.avgBuyPrice = newAvgBuyPrice;
      position.totalCost = newTotalCost;
      position.currentPrice = pricePerShare;
      position.totalValue = newShares * pricePerShare;
      position.gainLoss = position.totalValue - position.totalCost;
      position.gainLossPercent = (position.gainLoss / position.totalCost) * 100;
    } else {
      // Create new position
      position = new Position({
        userId,
        accountType: finalAccountType,
        symbol: symbol.toUpperCase(),
        shares,
        avgBuyPrice: pricePerShare,
        totalCost: totalAmount,
        currentPrice: pricePerShare,
        totalValue: totalAmount,
        gainLoss: 0,
        gainLossPercent: 0,
      });
    }

    await position.save();

    // Create Transaction
    const transaction = new Transaction({
      userId,
      accountType: finalAccountType,
      symbol: symbol.toUpperCase(),
      type: "BUY",
      shares,
      pricePerShare,
      totalAmount,
      balanceBefore: account.balance,
      balanceAfter: account.balance - totalAmount,
    });

    await transaction.save();

    // Update User trading account
    account.balance -= totalAmount;
    account.totalInvested += totalAmount;
    account.portfolioValue = account.portfolioValue + totalAmount;

    // Add position to user's positions array if new
    if (!position.createdAt) {
      if (finalAccountType === "demo") {
        user.demoPositions.push(position._id);
      } else {
        user.realPositions.push(position._id);
      }
    }

    await user.save();

    // Create/Update PortfolioHistory snapshot
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const allPositions = await Position.find({
      userId,
      accountType: finalAccountType,
    }).lean();

    const portfolioSnapshot = {
      totalValue: account.balance + account.portfolioValue,
      totalCost: allPositions.reduce((sum, p) => sum + p.totalCost, 0),
      balance: account.balance,
      positions: allPositions.map((p) => ({
        symbol: p.symbol,
        shares: p.shares,
        avgBuyPrice: p.avgBuyPrice,
        price: p.currentPrice,
        value: p.totalValue,
        gainLoss: p.gainLoss,
      })),
    };

    portfolioSnapshot.gainLoss = portfolioSnapshot.totalValue - portfolioSnapshot.totalCost;
    portfolioSnapshot.gainLossPercent = (portfolioSnapshot.gainLoss / portfolioSnapshot.totalCost) * 100 || 0;

    await PortfolioHistory.findOneAndUpdate(
      { userId, accountType: finalAccountType, date: today },
      { $set: portfolioSnapshot },
      { upsert: true, new: true }
    );

    res.status(200).json({
      success: true,
      message: `Successfully bought ${shares} shares of ${symbol}`,
      transaction: {
        id: transaction._id,
        symbol: symbol.toUpperCase(),
        type: "BUY",
        shares,
        pricePerShare: pricePerShare.toFixed(2),
        totalAmount: totalAmount.toFixed(2),
        timestamp: transaction.timestamp,
      },
      position: {
        symbol: position.symbol,
        shares: position.shares,
        avgBuyPrice: position.avgBuyPrice.toFixed(2),
        currentPrice: position.currentPrice.toFixed(2),
        totalValue: position.totalValue.toFixed(2),
        gainLoss: position.gainLoss.toFixed(2),
      },
      updatedBalance: account.balance.toFixed(2),
      updatedPortfolioValue: account.portfolioValue.toFixed(2),
    });
  } catch (error) {
    console.error("Error in buy operation:", error);
    res.status(500).json({
      success: false,
      message: "Failed to execute buy order",
      error: error.message,
    });
  }
});

// 4. POST /api/user/sell - Execute sell order
router.post("/sell", async (req, res) => {
  try {
    const userId = req.user?._id;
    const { symbol, shares, accountType } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    if (!symbol || !shares || shares <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid symbol or shares",
      });
    }

    // Get user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const finalAccountType = accountType || user.currentAccountType;

    // Get existing position
    const position = await Position.findOne({
      userId,
      accountType: finalAccountType,
      symbol: symbol.toUpperCase(),
    });

    if (!position || position.shares < shares) {
      return res.status(400).json({
        success: false,
        message: `Insufficient shares. You have ${position?.shares || 0} shares`,
      });
    }

    // Get current stock price with timeout and fallback
    let pricePerShare;
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000); // 5 second timeout
      const stockData = await yahooFinance.quote(symbol);
      clearTimeout(timeout);

      if (!stockData) {
        return res.status(404).json({
          success: false,
          message: `Stock ${symbol} not found`,
        });
      }
      pricePerShare = stockData.regularMarketPrice;
    } catch (stockError) {
      console.warn(`Yahoo Finance timeout for ${symbol}, using fallback...`);
      // Try to get cached price from stockStream
      const cachedData = getAllCachedData();
      const cachedStock = cachedData[symbol.toUpperCase()];

      if (!cachedStock || cachedStock.length === 0) {
        return res.status(503).json({
          success: false,
          message: `Unable to fetch price for ${symbol}. Stock service unavailable.`,
        });
      }

      const latestCachedData = cachedStock[cachedStock.length - 1];
      // Real-time data has 'price' field, historical has 'close'
      pricePerShare = latestCachedData.price || latestCachedData.close;

      if (!pricePerShare) {
        return res.status(503).json({
          success: false,
          message: `No price data available for ${symbol}.`,
        });
      }

      console.log(`Using cached price for ${symbol}: $${pricePerShare}`);
    }
    const totalAmount = shares * pricePerShare;
    const account = user.tradingAccounts[finalAccountType];

    // Calculate realized gain/loss
    const costOfSoldShares = shares * position.avgBuyPrice;
    const realizedGainLoss = totalAmount - costOfSoldShares;

    // Create Transaction
    const transaction = new Transaction({
      userId,
      accountType: finalAccountType,
      symbol: symbol.toUpperCase(),
      type: "SELL",
      shares,
      pricePerShare,
      totalAmount,
      balanceBefore: account.balance,
      balanceAfter: account.balance + totalAmount,
    });

    await transaction.save();

    // Update Position
    position.shares -= shares;
    position.totalCost = position.shares * position.avgBuyPrice;
    position.currentPrice = pricePerShare;
    position.totalValue = position.shares * pricePerShare;
    position.gainLoss = position.totalValue - position.totalCost;
    position.gainLossPercent = (position.gainLoss / position.totalCost) * 100 || 0;

    if (position.shares === 0) {
      // Delete position if all shares sold
      await Position.findByIdAndDelete(position._id);
      if (finalAccountType === "demo") {
        user.demoPositions = user.demoPositions.filter((id) => id.toString() !== position._id.toString());
      } else {
        user.realPositions = user.realPositions.filter((id) => id.toString() !== position._id.toString());
      }
    } else {
      await position.save();
    }

    // Update User trading account
    account.balance += totalAmount;
    account.portfolioValue -= costOfSoldShares;

    await user.save();

    // Create/Update PortfolioHistory snapshot
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const allPositions = await Position.find({
      userId,
      accountType: finalAccountType,
    }).lean();

    const portfolioSnapshot = {
      totalValue: account.balance + account.portfolioValue,
      totalCost: allPositions.reduce((sum, p) => sum + p.totalCost, 0),
      balance: account.balance,
      positions: allPositions.map((p) => ({
        symbol: p.symbol,
        shares: p.shares,
        avgBuyPrice: p.avgBuyPrice,
        price: p.currentPrice,
        value: p.totalValue,
        gainLoss: p.gainLoss,
      })),
    };

    portfolioSnapshot.gainLoss = portfolioSnapshot.totalValue - portfolioSnapshot.totalCost;
    portfolioSnapshot.gainLossPercent = (portfolioSnapshot.gainLoss / portfolioSnapshot.totalCost) * 100 || 0;

    await PortfolioHistory.findOneAndUpdate(
      { userId, accountType: finalAccountType, date: today },
      { $set: portfolioSnapshot },
      { upsert: true, new: true }
    );

    res.status(200).json({
      success: true,
      message: `Successfully sold ${shares} shares of ${symbol}`,
      transaction: {
        id: transaction._id,
        symbol: symbol.toUpperCase(),
        type: "SELL",
        shares,
        pricePerShare: pricePerShare.toFixed(2),
        totalAmount: totalAmount.toFixed(2),
        timestamp: transaction.timestamp,
      },
      position: position.shares > 0 ? {
        symbol: position.symbol,
        shares: position.shares,
        avgBuyPrice: position.avgBuyPrice.toFixed(2),
        currentPrice: position.currentPrice.toFixed(2),
        totalValue: position.totalValue.toFixed(2),
        gainLoss: position.gainLoss.toFixed(2),
      } : null,
      realizedGainLoss: realizedGainLoss.toFixed(2),
      updatedBalance: account.balance.toFixed(2),
      updatedPortfolioValue: account.portfolioValue.toFixed(2),
    });
  } catch (error) {
    console.error("Error in sell operation:", error);
    res.status(500).json({
      success: false,
      message: "Failed to execute sell order",
      error: error.message,
    });
  }
});

// 5. GET /api/user/portfolio-history - Get portfolio performance history
router.get("/portfolio-history", async (req, res) => {
  try {
    const userId = req.user?._id;
    const { accountType, days = 30 } = req.query;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    const user = await User.findById(userId).select("currentAccountType");
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const finalAccountType = accountType || user.currentAccountType;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));
    startDate.setHours(0, 0, 0, 0);

    const history = await PortfolioHistory.find({
      userId,
      accountType: finalAccountType,
      date: { $gte: startDate },
    })
      .select("date totalValue totalCost gainLoss gainLossPercent balance")
      .sort({ date: 1 })
      .lean();

    res.status(200).json({
      success: true,
      accountType: finalAccountType,
      days: parseInt(days),
      history: history || [],
      count: history?.length || 0,
    });
  } catch (error) {
    console.error("Error fetching portfolio history:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch portfolio history",
      error: error.message,
    });
  }
});

// Prediction Chat Routes
const {
  answerPredictionQuestion,
  getChatHistory,
  saveChatMessage,
} = require("../services/predictionChatService");

// Get chat history for a symbol
router.get("/predictions/chat/:symbol", async (req, res) => {
  try {
    // ✅ Check if user is authenticated
    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized - Please log in to access chat history",
      });
    }

    const { symbol } = req.params;
    const userId = req.user._id;

    const history = await getChatHistory(userId, symbol);

    res.status(200).json({
      success: true,
      symbol: symbol.toUpperCase(),
      history,
    });
  } catch (error) {
    console.error("Error fetching chat history:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch chat history",
      error: error.message,
    });
  }
});

// Send chat question (also works via Socket.io)
router.post("/predictions/chat", async (req, res) => {
  try {
    // ✅ Check if user is authenticated
    if (!req.user || !req.user._id) {
      console.warn("❌ Chat request without authentication");
      return res.status(401).json({
        success: false,
        message: "Unauthorized - Please log in to send chat messages",
      });
    }

    const { symbol, question, language = "en" } = req.body;
    const userId = req.user._id;

    console.log(`💬 Chat request from user ${userId} for ${symbol}`);

    if (!symbol || !question) {
      return res.status(400).json({
        success: false,
        message: "Symbol and question are required",
      });
    }

    // Save user question
    await saveChatMessage(userId, symbol, "user", question, language);

    // Get chat history for context
    const history = await getChatHistory(userId, symbol, 10);

    // Get AI response
    const response = await answerPredictionQuestion(
      symbol,
      userId,
      question,
      language,
      history
    );

    // Save AI response
    await saveChatMessage(userId, symbol, "ai", response.text, language, response.tokens);

    res.status(200).json({
      success: true,
      data: {
        symbol: symbol.toUpperCase(),
        response: response.text,
        sources: response.sources,
        tokens: response.tokens,
        language,
        timestamp: new Date(),
      },
    });
  } catch (error) {
    console.error("Error processing chat question:", error);
    res.status(500).json({
      success: false,
      message: "Failed to process question",
      error: error.message,
    });
  }
});

// Face Biometric Authentication Routes

// Helper function to calculate cosine similarity
function cosineSimilarity(a, b) {
  if (!a || !b || a.length !== b.length) return 0;
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// Register face descriptor for user
router.post("/face/register", async (req, res) => {
  try {
    const userId = req.user._id;
    const { faceDescriptor } = req.body;

    if (!faceDescriptor || !Array.isArray(faceDescriptor)) {
      return res.status(400).json({
        success: false,
        message: "Valid face descriptor is required",
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    user.faceBiometric = {
      isEnabled: true,
      faceDescriptor,
      registeredAt: new Date(),
      lastUsedAt: null,
    };

    await user.save();

    res.status(200).json({
      success: true,
      message: "Face biometric registered successfully",
      data: {
        isEnabled: true,
        registeredAt: user.faceBiometric.registeredAt,
      },
    });
  } catch (error) {
    console.error("Error registering face biometric:", error);
    res.status(500).json({
      success: false,
      message: "Failed to register face biometric",
      error: error.message,
    });
  }
});

// Verify face descriptor
router.post("/face/verify", async (req, res) => {
  try {
    const userId = req.user._id;
    const { faceDescriptor } = req.body;

    if (!faceDescriptor || !Array.isArray(faceDescriptor)) {
      return res.status(400).json({
        success: false,
        message: "Valid face descriptor is required",
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (!user.faceBiometric || !user.faceBiometric.isEnabled) {
      return res.status(400).json({
        success: false,
        message: "Face authentication not enabled for this user",
      });
    }

    // Calculate similarity
    const similarity = cosineSimilarity(
      faceDescriptor,
      user.faceBiometric.faceDescriptor
    );

    const SIMILARITY_THRESHOLD = 0.6;
    const isMatch = similarity >= SIMILARITY_THRESHOLD;

    if (isMatch) {
      // Update last used timestamp
      user.faceBiometric.lastUsedAt = new Date();
      await user.save();
    }

    res.status(200).json({
      success: true,
      verified: isMatch,
      similarity,
      message: isMatch ? "Face verified successfully" : "Face verification failed",
    });
  } catch (error) {
    console.error("Error verifying face biometric:", error);
    res.status(500).json({
      success: false,
      message: "Failed to verify face biometric",
      error: error.message,
    });
  }
});

// Unregister face authentication
router.delete("/face/unregister", async (req, res) => {
  try {
    const userId = req.user._id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    user.faceBiometric = {
      isEnabled: false,
      faceDescriptor: undefined,
      registeredAt: undefined,
      lastUsedAt: undefined,
    };

    await user.save();

    res.status(200).json({
      success: true,
      message: "Face authentication disabled successfully",
    });
  } catch (error) {
    console.error("Error unregistering face biometric:", error);
    res.status(500).json({
      success: false,
      message: "Failed to disable face authentication",
      error: error.message,
    });
  }
});

// Get face auth status
router.get("/face/status", async (req, res) => {
  try {
    const userId = req.user._id;

    const user = await User.findById(userId).select("faceBiometric");
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      data: {
        isEnabled: user.faceBiometric?.isEnabled || false,
        registeredAt: user.faceBiometric?.registeredAt || null,
        lastUsedAt: user.faceBiometric?.lastUsedAt || null,
      },
    });
  } catch (error) {
    console.error("Error getting face auth status:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get face authentication status",
      error: error.message,
    });
  }
});

module.exports = router;
