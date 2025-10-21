const yahooFinance = require("yahoo-finance2").default;
const log = require("../helper/logger");


let ioInstance = null;

function setIOInstance(io) {
    ioInstance = io;
}

// Utility function to get current time in ET
function getCurrentETTime() {
    const now = new Date();
    const etTime = new Date(now.toLocaleString("en-US", { timeZone: "America/New_York" }));
    const hours = etTime.getHours();
    const minutes = etTime.getMinutes().toString().padStart(2, "0");
    const seconds = etTime.getSeconds().toString().padStart(2, "0");
    const ampm = hours >= 12 ? "PM" : "AM";
    const displayHours = hours % 12 === 0 ? 12 : hours % 12;
    return { etTime, hours, minutes, seconds, ampm, displayHours };
}

// Check if market is open (9:30 AM - 4:00 PM ET, Monday-Friday)
function isMarketOpen() {
    // return true
    const { etTime } = getCurrentETTime();
    const day = etTime.getDay(); // 0 = Sunday, 5 = Friday, 6 = Saturday

    // Market closed on weekends
    if (day === 0 || day === 6) {
        return false;
    }

    const hours = etTime.getHours();
    const minutes = etTime.getMinutes();
    const totalMinutes = hours * 60 + minutes;

    // Market open: 9:30 AM (570 minutes) to 4:00 PM (960 minutes)
    const marketOpenMinutes = 9 * 60 + 30; // 9:30 AM
    const marketCloseMinutes = 16 * 60; // 4:00 PM

    return totalMinutes >= marketOpenMinutes && totalMinutes < marketCloseMinutes;
}

const stockCache = {
    AAPL: [],
    GOOGL: [],
    MSFT: [],
    TSLA: [],
    AMZN: [],
    NVDA: [],
};

// Store last known real prices for simulation
// Initialize with fallback prices if API is unavailable
const lastKnownPrices = {
    AAPL: 226.50,
    GOOGL: 166.80,
    MSFT: 413.20,
    TSLA: 248.75,
    AMZN: 191.50,
    NVDA: 135.40,
};

const STOCKS = ["AAPL", "GOOGL", "MSFT", "TSLA", "AMZN", "NVDA"];
const CACHE_MAX_SIZE = 1440; // Store 1 day of 1-minute data (24 * 60)
const INTERVAL = 1000; // 1 second

let streamingActive = false;
let streamInterval = null;


async function fetchStockQuote(symbol) {
    try {
        const quote = await yahooFinance.quote(symbol);
        const quoteData = {
            symbol: quote.symbol,
            timestamp: new Date().toISOString(),
            timestampMs: Date.now(),
            price: quote.regularMarketPrice,
            change: quote.regularMarketChange,
            changePercent: quote.regularMarketChangePercent,
            volume: quote.regularMarketVolume,
            dayHigh: quote.regularMarketDayHigh,
            dayLow: quote.regularMarketDayLow,
            bid: quote.bid || quote.regularMarketPrice,
            ask: quote.ask || quote.regularMarketPrice,
            marketCap: quote.marketCap,
            currency: quote.currency,
        };
        // Store last known real price
        lastKnownPrices[symbol] = quoteData.price;
        return quoteData;
    } catch (error) {
        log.error(`❌ Error fetching quote for ${symbol}:`, {
            message: error.message,
            code: error.code,
            statusCode: error.statusCode,
            errno: error.errno,
            syscall: error.syscall,
        });
        log.warn(`⚠️  Using simulated data for ${symbol} (fallback price: $${lastKnownPrices[symbol]})`);
        return generateSimulatedQuote(symbol);
    }
}

// Generate simulated data with minimal randomness (0.10-0.30% change)
function generateSimulatedQuote(symbol) {
    const lastPrice = lastKnownPrices[symbol];
    if (!lastPrice) {
        return null; // Can't simulate without a known price
    }

    // Random change between -0.30% and +0.30%
    const randomChangePercent = (Math.random() - 0.5) * 0.6; // Range: -0.3 to +0.3
    const newPrice = lastPrice * (1 + randomChangePercent / 100);
    const change = newPrice - lastPrice;

    return {
        symbol,
        timestamp: new Date().toISOString(),
        timestampMs: Date.now(),
        price: parseFloat(newPrice.toFixed(2)),
        change: parseFloat(change.toFixed(2)),
        changePercent: parseFloat(randomChangePercent.toFixed(2)),
        volume: Math.floor(Math.random() * 5000000) + 1000000, // Random volume
        dayHigh: lastPrice * 1.02,
        dayLow: lastPrice * 0.98,
        bid: parseFloat((newPrice - 0.01).toFixed(2)),
        ask: parseFloat((newPrice + 0.01).toFixed(2)),
        marketCap: 2000000000000, // Placeholder
        currency: "USD",
    };
}

async function fetchHistoricalData(symbol, days = 30) {
    try {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const historical = await yahooFinance.historical(symbol, {
            period1: startDate,
            period2: endDate,
            interval: "1d",
        });

        return historical.map((candle) => ({
            symbol,
            timestamp: new Date(candle.date).toISOString(),
            timestampMs: new Date(candle.date).getTime(),
            open: candle.open,
            high: candle.high,
            low: candle.low,
            close: candle.close,
            volume: candle.volume,
            adjClose: candle.adjClose,
        }));
    } catch (error) {
        log.error(`❌ Error fetching historical data for ${symbol}:`, {
            message: error.message,
            code: error.code,
            statusCode: error.statusCode,
            type: error.type,
            errno: error.errno,
            syscall: error.syscall,
            stack: error.stack?.split('\n')[0],
        });
        return [];
    }
}


function addToCache(symbol, dataPoint) {
    if (!stockCache[symbol]) {
        stockCache[symbol] = [];
    }

    stockCache[symbol].push(dataPoint);

    // Keep only the latest data points (1 day worth)
    if (stockCache[symbol].length > CACHE_MAX_SIZE) {
        stockCache[symbol].shift();
    }
}


async function startStockStream() {
    if (streamingActive) {
        return;
    }

    streamingActive = true;

    // Initialize cache with historical data (first time only)
    // If fetch fails, cache remains empty but that's OK - we'll use simulated data
    log.log("📍 Attempting to initialize cache with historical data...");
    for (const symbol of STOCKS) {
        const historical = await fetchHistoricalData(symbol, 30);
        if (historical && historical.length > 0) {
            stockCache[symbol] = historical;
            // Update lastKnownPrices from fresh historical data
            const lastHistoricalData = historical[historical.length - 1];
            lastKnownPrices[symbol] = lastHistoricalData.close || lastHistoricalData.adjClose;
            log.log(`  ✅ ${symbol}: Historical data loaded (${historical.length} records)`);
        } else {
            log.warn(`  ⚠️  ${symbol}: No historical data, will use simulated data with fallback price: $${lastKnownPrices[symbol]}`);
        }
    }

    // Verify lastKnownPrices are set for all symbols
    log.log("📍 Stock prices initialized:");
    for (const symbol of STOCKS) {
        log.log(`  ✅ ${symbol}: $${lastKnownPrices[symbol]}`);
    }

    // Track last logged state to avoid duplicate logs
    let lastLoggedMarketState = null;
    let lastLoggedTime = null;

    // Start the streaming interval
    streamInterval = setInterval(async () => {
        try {
            if (!ioInstance) {
                log.error("❌ Socket.IO instance not available");
                return;
            }

            const { displayHours, minutes, seconds, ampm } = getCurrentETTime();
            const marketOpen = isMarketOpen();
            const currentTimeStr = `${displayHours}:${minutes}:${seconds} ${ampm}`;

            // Log time and market status only when it changes (once per minute)
            if (lastLoggedMarketState !== marketOpen || lastLoggedTime !== `${displayHours}:${minutes}`) {
                log.log(`⏰ Current ET Time: ${currentTimeStr} | Market: ${marketOpen ? "🟢 OPEN" : "🔴 CLOSED"}`);
                lastLoggedMarketState = marketOpen;
                lastLoggedTime = `${displayHours}:${minutes}`;
            }

            const updates = {};

            if (marketOpen) {
                // Market is open - try to fetch real data, fallback to simulated
                const promises = STOCKS.map(async (symbol) => {
                    const quote = await fetchStockQuote(symbol);
                    if (quote) {
                        addToCache(symbol, quote);
                        updates[symbol] = quote;
                    }
                });

                await Promise.all(promises);
            } else {
                // Market is closed - generate simulated data
                for (const symbol of STOCKS) {
                    const simulatedQuote = generateSimulatedQuote(symbol);
                    if (simulatedQuote) {
                        addToCache(symbol, simulatedQuote);
                        updates[symbol] = simulatedQuote;
                    }
                }
            }

            if (Object.keys(updates).length > 0) {
                ioInstance.to("stocks").emit("stockUpdate", {
                    timestamp: new Date().toISOString(),
                    updates,
                });
            } else {
                log.warn("⚠️  No updates to emit");
            }
        } catch (error) {
            log.error("❌ Error in stock streaming:", error.message);
        }
    }, INTERVAL);
}


function stopStockStream() {
    if (streamInterval) {
        clearInterval(streamInterval);
        streamInterval = null;
    }
    streamingActive = false;
    log.log("Stock stream stopped");
}

function getCachedData(symbol) {
    return stockCache[symbol] || [];
}

function getAllCachedData() {
    return stockCache;
}


function getDataForDateRange(symbol, startDate, endDate) {
    const data = stockCache[symbol] || [];
    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();

    return data.filter((point) => {
        const pointTime = new Date(point.timestamp).getTime();
        return pointTime >= start && pointTime <= end;
    });
}

module.exports = {
    startStockStream,
    stopStockStream,
    getCachedData,
    getAllCachedData,
    getDataForDateRange,
    fetchHistoricalData,
    fetchStockQuote,
    setIOInstance,
    STOCKS,
};
