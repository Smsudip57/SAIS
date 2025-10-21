import { baseApi } from "../baseApi";
import {
    setAccounts,
    setCurrentAccountType,
    setPositions,
    setPortfolioHistory,
    setLoading,
} from "../../tradingSlice";

export const tradingApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        // Get trading account info (demo & real)
        getAccount: builder.query({
            query: (arg: void) => ({
                url: "/user/account",
                method: "GET",
            }),
            providesTags: ["Portfolio"],
            async onQueryStarted(_, { dispatch, queryFulfilled }) {
                dispatch(setLoading(true));
                try {
                    const { data } = await queryFulfilled;
                    console.log("🎯 Account API Response:", data);

                    // Save accounts to Redux (demo + real balances)
                    if (data.accounts) {
                        console.log("💾 Saving accounts to Redux:", data.accounts);
                        dispatch(setAccounts(data.accounts));
                    }

                    // DO NOT overwrite currentAccountType from backend
                    // Account type selection is managed by Redux (frontend state only)
                    // This allows user toggle to persist without being reset by API response

                    dispatch(setLoading(false));
                } catch (error) {
                    console.error("❌ Failed to fetch account:", error);
                    dispatch(setLoading(false));
                }
            },
        }),

        // Get all positions for current account
        getPositions: builder.query({
            query: ({ accountType }: { accountType: string }) => ({
                url: `/user/positions?accountType=${accountType}`,
                method: "GET",
            }),
            providesTags: ["Trade"],
            async onQueryStarted(_, { dispatch, queryFulfilled }) {
                try {
                    const result = await queryFulfilled;
                    console.log("🎯 Positions API Response:", result.data);

                    if (result.data?.positions) {
                        console.log("💾 Saving positions to Redux:", result.data.positions);
                        dispatch(setPositions(result.data.positions));
                    }
                } catch (error) {
                    console.error("❌ Failed to fetch positions:", error);
                }
            },
        }),

        // Get portfolio history for charting
        getPortfolioHistory: builder.query({
            query: ({ accountType, days = 30 }: { accountType: string; days?: number }) => ({
                url: `/user/portfolio-history?accountType=${accountType}&days=${days}`,
                method: "GET",
            }),
            providesTags: ["Portfolio"],
            async onQueryStarted(_, { dispatch, queryFulfilled }) {
                try {
                    const { data } = await queryFulfilled;
                    dispatch(setPortfolioHistory(data.history));
                } catch (error) {
                    console.error("Failed to fetch portfolio history:", error);
                }
            },
        }),

        // Execute buy order
        buyStock: builder.mutation({
            query: (body: { symbol: string; shares: number; accountType?: string }) => ({
                url: "/user/buy",
                method: "POST",
                body,
            }),
            invalidatesTags: ["Trade", "Portfolio", "Transaction"],
            async onQueryStarted(_, { dispatch, queryFulfilled }) {
                try {
                    const { data } = await queryFulfilled;
                    if (data.success) {
                        // Invalidate positions and portfolio to refetch
                        dispatch(setPositions(null)); // Will trigger refetch
                    }
                } catch (error) {
                    console.error("Failed to buy stock:", error);
                }
            },
        }),

        // Execute sell order
        sellStock: builder.mutation({
            query: (body: { symbol: string; shares: number; accountType?: string }) => ({
                url: "/user/sell",
                method: "POST",
                body,
            }),
            invalidatesTags: ["Trade", "Portfolio", "Transaction"],
            async onQueryStarted(_, { dispatch, queryFulfilled }) {
                try {
                    const { data } = await queryFulfilled;
                    if (data.success) {
                        // Invalidate positions and portfolio to refetch
                        dispatch(setPositions(null)); // Will trigger refetch
                    }
                } catch (error) {
                    console.error("Failed to sell stock:", error);
                }
            },
        }),

        // Get predictions for all stocks
        getStocksPredictions: builder.query({
            query: () => ({
                url: "/user/stocks/predictions",
                method: "GET",
            }),
            providesTags: ["Predictions"],
            async onQueryStarted(_, { dispatch, queryFulfilled }) {
                try {
                    const { data } = await queryFulfilled;
                    console.log("🔮 Stock Predictions API Response:", data);
                } catch (error) {
                    console.error( error);
                }
            },
        }),
    }),
    overrideExisting: false,
});

export const {
    useGetAccountQuery,
    useGetPositionsQuery,
    useGetPortfolioHistoryQuery,
    useGetStocksPredictionsQuery,
    useBuyStockMutation,
    useSellStockMutation,
} = tradingApi;
