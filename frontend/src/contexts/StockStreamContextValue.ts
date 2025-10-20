import { createContext } from "react";
import { StockChartData } from "@/hooks/useStockStream";

export interface StockStreamContextType {
    stockData: Record<string, StockChartData>;
    isConnected: boolean;
    isLoadingHistorical: boolean;
}

export const StockStreamContext = createContext<StockStreamContextType | null>(
    null
);
