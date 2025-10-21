const mongoose = require("mongoose");

const portfolioHistorySchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    accountType: {
        type: String,
        enum: ["demo", "real"],
        required: true,
        default: "demo",
    },
    date: {
        type: Date,
        required: true,
        default: () => new Date().setHours(0, 0, 0, 0),
    },
    totalValue: {
        type: Number,
        required: true,
        default: 0,
        min: 0,
    },
    totalCost: {
        type: Number,
        required: true,
        default: 0,
        min: 0,
    },
    gainLoss: {
        type: Number,
        required: true,
        default: 0,
    },
    gainLossPercent: {
        type: Number,
        required: true,
        default: 0,
    },
    balance: {
        type: Number,
        required: true,
        default: 0,
        min: 0,
    },
    positions: [
        {
            symbol: {
                type: String,
                uppercase: true,
                trim: true,
            },
            shares: {
                type: Number,
                min: 0,
            },
            avgBuyPrice: {
                type: Number,
                min: 0,
            },
            price: {
                type: Number,
                min: 0,
            },
            value: {
                type: Number,
                min: 0,
            },
            gainLoss: {
                type: Number,
            },
        },
    ],
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

// Index for faster queries
portfolioHistorySchema.index({ userId: 1, accountType: 1, date: -1 });
portfolioHistorySchema.index({ userId: 1, accountType: 1, createdAt: -1 });
portfolioHistorySchema.index({ userId: 1, date: -1 });
portfolioHistorySchema.index({ date: -1 });

// Keep only one entry per user per account type per day
portfolioHistorySchema.index({ userId: 1, accountType: 1, date: 1 }, { unique: true });

const PortfolioHistory =
    mongoose.models.PortfolioHistory ||
    mongoose.model("PortfolioHistory", portfolioHistorySchema);

module.exports = PortfolioHistory;
