import React, { useEffect, useState } from "react";
import {
    ComposedChart,
    Line,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    LineChart,
    BarChart,
} from "recharts";
import { useStockStream, StockDataPoint } from "@/hooks/useStockStream";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "lucide-react";
import { format, subDays, startOfToday } from "date-fns";

interface StockChartProps {
    symbol: string;
}

export const StockRealTimeChart: React.FC<StockChartProps> = ({ symbol }) => {
    const { stockData, isConnected } = useStockStream([symbol]);
    const [displayData, setDisplayData] = useState<StockDataPoint[]>([]);
    const [timeRange, setTimeRange] = useState<"1d" | "7d" | "30d" | "all">("7d");
    const [selectedPoint, setSelectedPoint] = useState<StockDataPoint | null>(null);

    const data = stockData[symbol];

    // Update display data based on selected time range
    useEffect(() => {
        if (!data?.allData) return;

        let filtered = [...data.allData];

        if (timeRange !== "all") {
            const days = timeRange === "1d" ? 1 : timeRange === "7d" ? 7 : 30;
            const cutoffDate = subDays(new Date(), days);
            filtered = filtered.filter((point) => new Date(point.timestamp) >= cutoffDate);
        }

        setDisplayData(filtered);
    }, [data?.allData, timeRange]);

    if (!data) {
        return <div className="p-4 text-center">Loading {symbol} data...</div>;
    }

    if (data.isLoading && displayData.length === 0) {
        return <div className="p-4 text-center">Initializing {symbol}...</div>;
    }

    const currentPrice = data.currentData?.price || 0;
    const currentChange = data.currentData?.changePercent || 0;
    const isPositive = currentChange >= 0;

    // Prepare chart data - combine price and volume
    const chartData = displayData.map((point) => ({
        time: format(new Date(point.timestamp), "MM/dd HH:mm"),
        timestamp: point.timestamp,
        price: Number(point.close || point.price || 0).toFixed(2),
        volume: Math.round((point.volume || 0) / 1000000), // Convert to millions
        high: point.dayHigh || point.high,
        low: point.dayLow || point.low,
        open: point.open,
        close: point.close || point.price,
    }));

    return (
        <Card className="w-full">
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="text-2xl">{symbol}</CardTitle>
                        <CardDescription>Real-time price and volume tracking</CardDescription>
                    </div>
                    <div className="text-right">
                        <div className="text-3xl font-bold">${currentPrice.toFixed(2)}</div>
                        <div className={`text-lg font-semibold ${isPositive ? "text-green-600" : "text-red-600"}`}>
                            {isPositive ? "+" : ""}{currentChange.toFixed(2)}%
                        </div>
                        <div className={`text-xs ${isConnected ? "text-green-600" : "text-red-600"}`}>
                            {isConnected ? "● Live" : "● Offline"}
                        </div>
                    </div>
                </div>

                {/* Time Range Selector */}
                <div className="flex gap-2 mt-4">
                    {(["1d", "7d", "30d", "all"] as const).map((range) => (
                        <Button
                            key={range}
                            variant={timeRange === range ? "default" : "outline"}
                            size="sm"
                            onClick={() => setTimeRange(range)}
                            className="text-xs"
                        >
                            {range === "1d" ? "1D" : range === "7d" ? "7D" : range === "30d" ? "30D" : "All"}
                        </Button>
                    ))}
                </div>
            </CardHeader>

            <CardContent className="space-y-6">
                {/* Main Price Chart */}
                <div className="w-full h-80 bg-slate-50 rounded-lg p-2">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData}>
                            <defs>
                                <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis
                                dataKey="time"
                                tick={{ fontSize: 12 }}
                                angle={-45}
                                textAnchor="end"
                                height={80}
                            />
                            <YAxis
                                domain={["dataMin - 1", "dataMax + 1"]}
                                tick={{ fontSize: 12 }}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: "rgba(0, 0, 0, 0.8)",
                                    border: "1px solid #ccc",
                                    borderRadius: "4px",
                                    color: "#fff",
                                }}
                                formatter={(value) => `$${value}`}
                                labelFormatter={(label) => `Time: ${label}`}
                            />
                            <Legend />
                            <Line
                                type="monotone"
                                dataKey="price"
                                stroke="#3b82f6"
                                dot={false}
                                strokeWidth={2}
                                name="Price ($)"
                                isAnimationActive={false}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                {/* Volume Chart */}
                <div className="w-full h-64 bg-slate-50 rounded-lg p-2">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis
                                dataKey="time"
                                tick={{ fontSize: 12 }}
                                angle={-45}
                                textAnchor="end"
                                height={80}
                            />
                            <YAxis tick={{ fontSize: 12 }} />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: "rgba(0, 0, 0, 0.8)",
                                    border: "1px solid #ccc",
                                    borderRadius: "4px",
                                    color: "#fff",
                                }}
                                formatter={(value) => `${value}M`}
                                labelFormatter={(label) => `Time: ${label}`}
                            />
                            <Legend />
                            <Bar dataKey="volume" fill="#8b5cf6" name="Volume (Millions)" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-50 p-3 rounded">
                        <p className="text-xs text-gray-600">Day High</p>
                        <p className="text-lg font-semibold">${data.currentData?.dayHigh?.toFixed(2) || "N/A"}</p>
                    </div>
                    <div className="bg-slate-50 p-3 rounded">
                        <p className="text-xs text-gray-600">Day Low</p>
                        <p className="text-lg font-semibold">${data.currentData?.dayLow?.toFixed(2) || "N/A"}</p>
                    </div>
                    <div className="bg-slate-50 p-3 rounded">
                        <p className="text-xs text-gray-600">24h Volume</p>
                        <p className="text-lg font-semibold">{(data.currentData?.volume ? data.currentData.volume / 1000000 : 0).toFixed(2)}M</p>
                    </div>
                    <div className="bg-slate-50 p-3 rounded">
                        <p className="text-xs text-gray-600">Bid/Ask</p>
                        <p className="text-lg font-semibold">
                            ${data.currentData?.bid?.toFixed(2) || "N/A"} / ${data.currentData?.ask?.toFixed(2) || "N/A"}
                        </p>
                    </div>
                </div>

                {/* Data Points Count */}
                <div className="text-xs text-gray-500 text-center">
                    Showing {displayData.length} data points • Last update: {data.currentData?.timestamp && format(new Date(data.currentData.timestamp), "MMM dd, HH:mm:ss")}
                </div>
            </CardContent>
        </Card>
    );
};

// Multi-stock dashboard
interface StockDashboardProps {
    symbols?: string[];
}

export const StockStreamDashboard: React.FC<StockDashboardProps> = ({
    symbols = ["AAPL", "GOOGL", "MSFT", "TSLA", "AMZN", "NVDA"],
}) => {
    return (
        <div className="w-full space-y-6 p-4">
            <div>
                <h1 className="text-3xl font-bold mb-2">Stock Market Realtime</h1>
                <p className="text-gray-600">Live prices with historical data and volume analysis</p>
            </div>

            <div className="grid gap-6">
                {symbols.map((symbol) => (
                    <StockRealTimeChart key={symbol} symbol={symbol} />
                ))}
            </div>
        </div>
    );
};
