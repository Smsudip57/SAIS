import React, { useEffect, useState, useRef } from "react";
import { io, Socket } from "socket.io-client";
import axios from "axios";
import { StockDataPoint, StockChartData } from "@/hooks/useStockStream";
import { StockStreamContext } from "@/contexts/StockStreamContextValue";

export const StockStreamProvider: React.FC<{ children: React.ReactNode }> = ({
    children,
}) => {
    const [stockData, setStockData] = useState<Record<string, StockChartData>>({});
    const [isConnected, setIsConnected] = useState(false);
    const [isLoadingHistorical, setIsLoadingHistorical] = useState(true);
    const socketRef = useRef<Socket | null>(null);
    const dataRef = useRef<Record<string, StockDataPoint[]>>({});
    const historicalFetchedRef = useRef(false);
    const stocksRef = useRef(["AAPL", "GOOGL", "MSFT", "TSLA", "AMZN", "NVDA"]);
    const CACHE_MAX_SIZE = 1440;

    // Initialize socket connection (once)
    useEffect(() => {
        // Get the base URL and remove /api suffix if present
        const baseUrl = import.meta.env.VITE_BASE_URL || "http://localhost:3001/api";
        const socketUrl = baseUrl.replace(/\/api\/?$/, '') || "http://localhost:3001";

        const newSocket = io(socketUrl, {
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            reconnectionAttempts: 5,
        });

        socketRef.current = newSocket;

        const handleConnect = () => {
            console.log("Socket connected, subscribing to stocks");
            newSocket.emit("subscribeToStocks");
            setIsConnected(true);
        };

        const handleStockUpdate = (data: {
            timestamp: string;
            updates: Record<string, StockDataPoint>;
        }) => {
            setStockData((prev) => {
                const updated = { ...prev };
                Object.entries(data.updates).forEach(([symbol, update]) => {
                    if (updated[symbol]) {
                        dataRef.current[symbol] = dataRef.current[symbol] || [];
                        dataRef.current[symbol].push(update);

                        // Maintain cache size
                        if (dataRef.current[symbol].length > CACHE_MAX_SIZE) {
                            dataRef.current[symbol].shift();
                        }

                        updated[symbol] = {
                            ...updated[symbol],
                            currentData: update,
                            allData: [...dataRef.current[symbol]],
                        };
                    }
                });
                return updated;
            });
        };

        const handleDisconnect = () => {
            console.log("Socket disconnected");
            setIsConnected(false);
        };

        newSocket.on("connect", handleConnect);
        newSocket.on("stockUpdate", handleStockUpdate);
        newSocket.on("disconnect", handleDisconnect);

        if (newSocket.connected) {
            handleConnect();
        }

        return () => {
            newSocket.off("connect", handleConnect);
            newSocket.off("stockUpdate", handleStockUpdate);
            newSocket.off("disconnect", handleDisconnect);
            newSocket.emit("unsubscribeFromStocks");
            newSocket.disconnect();
        };
    }, []);

    // Fetch historical data ONCE for all stocks
    useEffect(() => {
        if (historicalFetchedRef.current) return;

        const fetchHistoricalData = async () => {
            try {
                historicalFetchedRef.current = true;
                setIsLoadingHistorical(true);

                const apiUrl = import.meta.env.VITE_BASE_URL || "http://localhost:3001/api";
                const response = await axios.get(
                    `${apiUrl}/user/stocks/historical?days=30`,
                    {
                        timeout: 30000, // 30 second timeout
                    }
                );

                if (response.data.success && response.data.data) {
                    const historicalData = response.data.data;

                    // Initialize all stock data
                    const newStockData: Record<string, StockChartData> = {};
                    stocksRef.current.forEach((symbol) => {
                        const symbolData = historicalData[symbol] || [];
                        dataRef.current[symbol] = [...symbolData];

                        newStockData[symbol] = {
                            symbol,
                            currentData:
                                symbolData.length > 0 ? symbolData[symbolData.length - 1] : null,
                            historicalData: symbolData,
                            allData: symbolData,
                            isLoading: false,
                            error: null,
                        };
                    });

                    setStockData(newStockData);
                    console.log("Historical data loaded successfully for all stocks");
                }
            } catch (error) {
                console.error("Error fetching historical data:", error);
                // Initialize with empty data but mark as not loading
                const newStockData: Record<string, StockChartData> = {};
                stocksRef.current.forEach((symbol) => {
                    newStockData[symbol] = {
                        symbol,
                        currentData: null,
                        historicalData: [],
                        allData: [],
                        isLoading: false,
                        error: "Failed to load historical data",
                    };
                });
                setStockData(newStockData);
            } finally {
                setIsLoadingHistorical(false);
            }
        };

        fetchHistoricalData();
    }, []);

    return (
        <StockStreamContext.Provider
            value={{
                stockData,
                isConnected,
                isLoadingHistorical,
            }}
        >
            {children}
        </StockStreamContext.Provider>
    );
};
