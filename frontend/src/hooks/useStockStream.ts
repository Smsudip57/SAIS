import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { io } from "socket.io-client";
import axios from "axios";

export interface StockDataPoint {
    symbol: string;
    timestamp: string;
    timestampMs: number;
    price: number;
    change: number;
    changePercent: number;
    volume: number;
    dayHigh?: number;
    dayLow?: number;
    bid?: number;
    ask?: number;
    marketCap?: number;
    currency?: string;
    open?: number;
    high?: number;
    low?: number;
    close?: number;
    adjClose?: number;
}

export interface StockChartData {
    symbol: string;
    currentData: StockDataPoint | null;
    historicalData: StockDataPoint[];
    allData: StockDataPoint[];
    isLoading: boolean;
    error: string | null;
}

export const useStockStream = (symbolsInput: string | string[] = ["AAPL", "GOOGL", "MSFT", "TSLA", "AMZN", "NVDA"]) => {
    const socket = useSocket();
    const [stockData, setStockData] = useState<Record<string, StockChartData>>({});
    const [isConnected, setIsConnected] = useState(false);
    const dataRef = useRef<Record<string, StockDataPoint[]>>({});

    // Convert single symbol string to array
    const symbols = useMemo(() => {
        if (typeof symbolsInput === 'string') {
            return symbolsInput ? [symbolsInput] : [];
        }
        return symbolsInput;
    }, [symbolsInput]);

    // Initialize empty state for all symbols - only when symbols actually change
    useEffect(() => {
        if (symbols.length === 0) return;

        const initialData: Record<string, StockChartData> = {};
        symbols.forEach((symbol) => {
            initialData[symbol] = {
                symbol,
                currentData: null,
                historicalData: [],
                allData: [],
                isLoading: true,
                error: null,
            };
            if (!dataRef.current[symbol]) {
                dataRef.current[symbol] = [];
            }
        });
        setStockData(initialData);
    }, [symbols]);

    // Fetch initial historical data
    useEffect(() => {
        if (symbols.length === 0) return;

        const fetchHistoricalData = async () => {
            try {
                const apiUrl = import.meta.env.VITE_BASE_URL || "http://localhost:3001/api";
                const response = await axios.get(
                    `${apiUrl}/user/stocks/historical?days=30`
                );

                if (response.data.success && response.data.data) {
                    const historicalData = response.data.data;

                    symbols.forEach((symbol) => {
                        const symbolData = historicalData[symbol] || [];
                        dataRef.current[symbol] = [...symbolData];

                        setStockData((prev) => ({
                            ...prev,
                            [symbol]: {
                                ...prev[symbol],
                                historicalData: symbolData,
                                allData: symbolData,
                                isLoading: false,
                                currentData: symbolData.length > 0 ? symbolData[symbolData.length - 1] : null,
                            },
                        }));
                    });
                }
            } catch (error) {
                console.error("Error fetching historical data:", error);
                symbols.forEach((symbol) => {
                    setStockData((prev) => ({
                        ...prev,
                        [symbol]: {
                            ...prev[symbol],
                            error: "Failed to load historical data",
                            isLoading: false,
                        },
                    }));
                });
            }
        };

        fetchHistoricalData();
    }, [symbols]);

    // Subscribe to real-time updates
    useEffect(() => {
        if (!socket) return;

        const handleConnect = () => {
            console.log("Socket connected, subscribing to stocks");
            socket.emit("subscribeToStocks");
            setIsConnected(true);
        };

        const handleStockUpdate = (data: { timestamp: string; updates: Record<string, StockDataPoint> }) => {
            setStockData((prev) => {
                const updated = { ...prev };
                Object.entries(data.updates).forEach(([symbol, update]) => {
                    if (updated[symbol]) {
                        // Add to data reference
                        dataRef.current[symbol] = dataRef.current[symbol] || [];
                        dataRef.current[symbol].push(update);

                        // Update state with new real-time data
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

        socket.on("connect", handleConnect);
        socket.on("stockUpdate", handleStockUpdate);
        socket.on("disconnect", handleDisconnect);

        // Subscribe on mount
        if (socket.connected) {
            socket.emit("subscribeToStocks");
            setIsConnected(true);
        }

        return () => {
            socket.off("connect", handleConnect);
            socket.off("stockUpdate", handleStockUpdate);
            socket.off("disconnect", handleDisconnect);
            socket.emit("unsubscribeFromStocks");
        };
    }, [socket]);

    // Function to get data for a specific date range
    const getDataForDateRange = useCallback(
        (symbol: string, startDate: Date, endDate: Date) => {
            const start = startDate.getTime();
            const end = endDate.getTime();

            return (dataRef.current[symbol] || []).filter((point) => {
                const pointTime = new Date(point.timestamp).getTime();
                return pointTime >= start && pointTime <= end;
            });
        },
        []
    );

    // Function to refresh data for a specific date range from server
    const refreshDataForDateRange = useCallback(
        async (symbol: string, startDate: Date, endDate: Date) => {
            try {
                const response = await axios.get(
                    `${import.meta.env.VITE_BASE_URL || "http://localhost:3001/api"}/user/stocks/range`,
                    {
                        params: {
                            symbol,
                            startDate: startDate.toISOString(),
                            endDate: endDate.toISOString(),
                        },
                    }
                );

                if (response.data.success) {
                    return response.data.data || [];
                }
            } catch (error) {
                console.error("Error refreshing data for date range:", error);
            }
            return [];
        },
        []
    );

    return {
        stockData,
        isConnected,
        getDataForDateRange,
        refreshDataForDateRange,
    };
};

// Helper hook to create socket connection
export const useSocket = () => {
    const [socket, setSocket] = useState<any>(null);

    useEffect(() => {
        const newSocket = io(import.meta.env.VITE_BASE_URL?.replace('/api', '') || "http://localhost:3001", {
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            reconnectionAttempts: 5,
        });

        setSocket(newSocket);

        return () => {
            newSocket.disconnect();
        };
    }, []);

    return socket;
};
