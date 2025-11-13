const mongoose = require("mongoose");

const predictionChatSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        symbol: {
            type: String,
            required: true,
            uppercase: true,
            index: true,
        },
        chatHistory: [
            {
                sender: {
                    type: String,
                    enum: ["user", "ai"],
                    required: true,
                },
                message: {
                    type: String,
                    required: true,
                },
                language: {
                    type: String,
                    enum: ["en", "ar", "zh"],
                    default: "en",
                },
                timestamp: {
                    type: Date,
                    default: Date.now,
                },
                model: {
                    type: String,
                    default: "deepseek/deepseek-r1",
                },
                tokens: {
                    type: Number,
                    default: 0,
                },
            },
        ],
        initialPrediction: {
            en: {
                pred_pct: Number,
                confidence: Number,
                rationale: String,
                evidence: [
                    {
                        detail: String,
                        source_link: String,
                    },
                ],
            },
            ar: {
                pred_pct: Number,
                confidence: Number,
                rationale: String,
                evidence: [
                    {
                        detail: String,
                        source_link: String,
                    },
                ],
            },
            zh: {
                pred_pct: Number,
                confidence: Number,
                rationale: String,
                evidence: [
                    {
                        detail: String,
                        source_link: String,
                    },
                ],
            },
        },
    },
    {
        timestamps: true,
    }
);

// Compound index for faster queries
predictionChatSchema.index({ userId: 1, symbol: 1 });

module.exports = mongoose.model("PredictionChat", predictionChatSchema);
