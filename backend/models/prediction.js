const mongoose = require("mongoose");

const predictionSchema = new mongoose.Schema(
    {
        symbol: {
            type: String,
            required: true,
            uppercase: true,
            index: true,
        },
        currentPrice: {
            type: Number,
            required: true,
        },
        recentChange: {
            type: Number,
            required: true,
        },
        prediction: {
            pred_pct: {
                type: Number,
                required: true,
            },
            confidence: {
                type: Number,
                required: true,
                min: 0,
                max: 1,
            },
            rationale: {
                type: String,
                required: true,
            },
            evidence: [
                {
                    detail: String,
                    source_link: String,
                },
            ],
        },
        model: {
            type: String,
            default: "deepseek/deepseek-r1",
        },
        timestamp: {
            type: Date,
            default: Date.now,
            index: true,
        },
    },
    {
        timestamps: true,
    }
);

// Index to quickly find valid predictions for a stock
predictionSchema.index({ symbol: 1, createdAt: -1 });

module.exports = mongoose.model("Prediction", predictionSchema);
