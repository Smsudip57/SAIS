const yahooFinance = require("yahoo-finance2").default;

let ioInstance = null;

function setIOInstance(io) {
    ioInstance = io;
}

const stockCache = {
    AAPL: [],
    GOOGL: [],
    MSFT: [],
    TSLA: [],
    AMZN: [],
    NVDA: [],
};

const STOCKS = ["AAPL", "GOOGL", "MSFT", "TSLA", "AMZN", "NVDA"];
const CACHE_MAX_SIZE = 1440; // Store 1 day of 1-minute data (24 * 60)
const INTERVAL = 1000; // 1 second

let streamingActive = false;
let streamInterval = null;


async function fetchStockQuote(symbol) {
    try {
        const quote = await yahooFinance.quote(symbol);
        return {
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
    } catch (error) {
        // console.error(`Error fetching quote for ${symbol}:`, error.message);
        return null;
    }
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
        // console.error(`Error fetching historical data for ${symbol}:`, error.message);
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
    for (const symbol of STOCKS) {
        const historical = await fetchHistoricalData(symbol, 30);
        stockCache[symbol] = historical;
    }

    // Start the streaming interval
    streamInterval = setInterval(async () => {
        try {
            if (!ioInstance) {
                // console.error("Socket.IO instance not available");
                return;
            }

            const updates = {};

            // Fetch data for all stocks in parallel
            const promises = STOCKS.map(async (symbol) => {
                const quote = await fetchStockQuote(symbol);
                if (quote) {
                    addToCache(symbol, quote);
                    updates[symbol] = quote;
                }
            });

            await Promise.all(promises);

            ioInstance.to("stocks").emit("stockUpdate", {
                timestamp: new Date().toISOString(),
                updates,
            });
        } catch (error) {
            // console.error("Error in stock streaming:", error.message);
        }
    }, INTERVAL);
}


function stopStockStream() {
    if (streamInterval) {
        clearInterval(streamInterval);
        streamInterval = null;
    }
    streamingActive = false;
    console.log("Stock stream stopped");
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
