import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface TradingAccount {
    balance: number;
    portfolioValue: number;
    dayChange: number;
    dayChangePercent: number;
    totalInvested: number;
    isActive: boolean;
    createdAt: string;
}

export interface Position {
    symbol: string;
    shares: number;
    avgBuyPrice: number;
    currentPrice: number;
    totalValue: number;
    gainLoss: number;
    gainLossPercent: number;
}

export interface PortfolioHistoryItem {
    date: string;
    totalValue: number;
    totalCost: number;
    gainLoss: number;
    gainLossPercent: number;
    balance: number;
}

export interface TradingState {
    accounts: {
        demo: TradingAccount;
        real: TradingAccount;
    } | null;
    currentAccountType: "demo" | "real";
    positions: Position[] | null;
    portfolioHistory: PortfolioHistoryItem[] | null;
    loading: boolean;
    error: string | null;
}

const initialState: TradingState = {
    accounts: null,  // Will be populated from backend API
    currentAccountType: "demo",  // Default, will be overridden by backend
    positions: null,  // Will be populated from backend API
    portfolioHistory: null,  // Will be populated from backend API
    loading: false,
    error: null,
};

const tradingSlice = createSlice({
    name: "trading",
    initialState,
    reducers: {
        setAccounts(state, action: PayloadAction<TradingState["accounts"]>) {
            state.accounts = action.payload;
        },
        setCurrentAccountType(state, action: PayloadAction<"demo" | "real">) {
            state.currentAccountType = action.payload;
        },
        setPositions(state, action: PayloadAction<Position[] | null>) {
            state.positions = action.payload;
        },
        setPortfolioHistory(state, action: PayloadAction<PortfolioHistoryItem[] | null>) {
            state.portfolioHistory = action.payload;
        },
        setLoading(state, action: PayloadAction<boolean>) {
            state.loading = action.payload;
        },
        setError(state, action: PayloadAction<string | null>) {
            state.error = action.payload;
        },
        clearError(state) {
            state.error = null;
        },
    },
});

export const {
    setAccounts,
    setCurrentAccountType,
    setPositions,
    setPortfolioHistory,
    setLoading,
    setError,
    clearError,
} = tradingSlice.actions;

export default tradingSlice.reducer;
