const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema({
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
    symbol: {
        type: String,
        required: true,
        uppercase: true,
        trim: true,
    },
    type: {
        type: String,
        enum: ["BUY", "SELL"],
        required: true,
    },
    shares: {
        type: Number,
        required: true,
        min: 0,
    },
    pricePerShare: {
        type: Number,
        required: true,
        min: 0,
    },
    totalAmount: {
        type: Number,
        required: true,
        min: 0,
    },
    balanceBefore: {
        type: Number,
        required: true,
        min: 0,
    },
    balanceAfter: {
        type: Number,
        required: true,
        min: 0,
    },
    status: {
        type: String,
        enum: ["PENDING", "COMPLETED", "FAILED"],
        default: "COMPLETED",
    },
    timestamp: {
        type: Date,
        default: Date.now,
    },
    notes: {
        type: String,
        default: "",
    },
});

// Index for faster queries
transactionSchema.index({ userId: 1, accountType: 1, timestamp: -1 });
transactionSchema.index({ userId: 1, accountType: 1, symbol: 1 });
transactionSchema.index({ userId: 1, symbol: 1 });
transactionSchema.index({ timestamp: -1 });

const Transaction =
    mongoose.models.Transaction || mongoose.model("Transaction", transactionSchema);

module.exports = Transaction;
