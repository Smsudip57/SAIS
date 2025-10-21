const mongoose = require("mongoose");

const positionSchema = new mongoose.Schema({
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
    shares: {
        type: Number,
        required: true,
        default: 0,
        min: 0,
    },
    avgBuyPrice: {
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
    currentPrice: {
        type: Number,
        required: true,
        default: 0,
        min: 0,
    },
    totalValue: {
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
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
});

// Index for faster queries
positionSchema.index({ userId: 1, accountType: 1, symbol: 1 }, { unique: true });
positionSchema.index({ userId: 1, accountType: 1 });
positionSchema.index({ userId: 1, symbol: 1 });

// Update timestamp before saving
positionSchema.pre("save", function (next) {
    this.updatedAt = Date.now();
    next();
});

const Position = mongoose.models.Position || mongoose.model("Position", positionSchema);

module.exports = Position;
