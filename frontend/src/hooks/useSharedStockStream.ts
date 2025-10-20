import { useContext } from "react";
import { StockStreamContext } from "@/contexts/StockStreamContextValue";

export const useSharedStockStream = (symbol?: string) => {
    const context = useContext(StockStreamContext);

    if (!context) {
        throw new Error(
            "useSharedStockStream must be used within StockStreamProvider"
        );
    }

    if (symbol) {
        return {
            stockData: context.stockData[symbol] || {
                symbol,
                currentData: null,
                historicalData: [],
                allData: [],
                isLoading: context.isLoadingHistorical,
                error: null,
            },
            isConnected: context.isConnected,
        };
    }

    return {
        allStockData: context.stockData,
        isConnected: context.isConnected,
        isLoadingHistorical: context.isLoadingHistorical,
    };
};
