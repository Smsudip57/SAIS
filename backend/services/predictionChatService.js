const axios = require("axios");
const PredictionChat = require("../models/predictionChat");
const Prediction = require("../models/prediction");
const log = require("../helper/logger");

/**
 * Format initial prediction for chat display
 */
async function generateInitialChatMessage(symbol, language = "en") {
    const upperSymbol = symbol.toUpperCase();
    
    try {
        // Get the latest prediction for this symbol
        const prediction = await Prediction.findOne({ symbol: upperSymbol })
            .sort({ createdAt: -1 })
            .lean();

        if (!prediction) {
            throw new Error(`No prediction found for ${upperSymbol}`);
        }

        // Select language-specific prediction
        let predData;
        if (prediction.predictions && prediction.predictions[language]) {
            predData = prediction.predictions[language];
        } else {
            // Fallback to English or legacy format
            predData = prediction.predictions?.en || prediction.prediction;
        }

        const direction = predData.pred_pct >= 0 ? "increase" : "decrease";
        const percentage = Math.abs(predData.pred_pct || 0).toFixed(2);
        
        const messages = {
            en: `📊 **AI Analysis for ${upperSymbol}**\n\nI predict a ${direction} of ${percentage}% based on my analysis.\n\n**Confidence:** ${Math.round((predData.confidence || 0) * 100)}%\n\n**Rationale:** ${predData.rationale}\n\nFeel free to ask me any questions about this prediction!`,
            ar: `📊 **تحليل الذكاء الاصطناعي لـ ${upperSymbol}**\n\nأتوقع ${direction === "increase" ? "زيادة" : "انخفاض"} بنسبة ${percentage}٪ بناءً على تحليلي.\n\n**الثقة:** ${Math.round((predData.confidence || 0) * 100)}٪\n\n**التفسير:** ${predData.rationale}\n\nلا تتردد في سؤالي عن هذا التوقع!`,
            zh: `📊 **${upperSymbol}的AI分析**\n\n基于我的分析，我预测${direction === "increase" ? "上涨" : "下跌"}${percentage}%。\n\n**置信度:** ${Math.round((predData.confidence || 0) * 100)}%\n\n**理由:** ${predData.rationale}\n\n随时向我询问有关此预测的任何问题！`,
        };

        return {
            message: messages[language] || messages.en,
            prediction: predData,
            currentPrice: prediction.currentPrice,
        };
    } catch (error) {
        log.error("Error generating initial chat message:", error);
        throw error;
    }
}

/**
 * Answer follow-up question about prediction using AI
 */
async function answerPredictionQuestion(symbol, userId, question, language = "en", chatHistory = []) {
    const upperSymbol = symbol.toUpperCase();
    
    try {
        // Get the prediction
        const prediction = await Prediction.findOne({ symbol: upperSymbol })
            .sort({ createdAt: -1 })
            .lean();

        if (!prediction) {
            throw new Error(`No prediction found for ${upperSymbol}`);
        }

        // Select language-specific prediction
        let predData;
        if (prediction.predictions && prediction.predictions[language]) {
            predData = prediction.predictions[language];
        } else {
            predData = prediction.predictions?.en || prediction.prediction;
        }

        // Build context from chat history (last 5 messages)
        const recentHistory = chatHistory.slice(-5);
        const contextMessages = recentHistory
            .map(msg => `${msg.sender === "user" ? "User" : "AI"}: ${msg.message}`)
            .join("\n");

        // Language-specific prompts
        const prompts = {
            en: `You are a financial AI assistant helping users understand stock predictions.

Stock: ${upperSymbol}
Current Prediction: ${predData.pred_pct >= 0 ? "+" : ""}${predData.pred_pct}% (Confidence: ${Math.round((predData.confidence || 0) * 100)}%)
Rationale: ${predData.rationale}

Previous conversation:
${contextMessages || "No previous conversation"}

User question: ${question}

Provide a helpful, concise answer (max 200 words). Be friendly and explain financial concepts clearly.`,
            ar: `أنت مساعد ذكاء اصطناعي مالي تساعد المستخدمين على فهم توقعات الأسهم.

السهم: ${upperSymbol}
التوقع الحالي: ${predData.pred_pct >= 0 ? "+" : ""}${predData.pred_pct}٪ (الثقة: ${Math.round((predData.confidence || 0) * 100)}٪)
التفسير: ${predData.rationale}

المحادثة السابقة:
${contextMessages || "لا توجد محادثة سابقة"}

سؤال المستخدم: ${question}

قدم إجابة مفيدة وموجزة (بحد أقصى 200 كلمة). كن ودودًا واشرح المفاهيم المالية بوضوح.`,
            zh: `您是一位金融AI助手，帮助用户理解股票预测。

股票: ${upperSymbol}
当前预测: ${predData.pred_pct >= 0 ? "+" : ""}${predData.pred_pct}% (置信度: ${Math.round((predData.confidence || 0) * 100)}%)
理由: ${predData.rationale}

之前的对话:
${contextMessages || "无之前的对话"}

用户问题: ${question}

提供有用、简洁的答案（最多200字）。友好并清楚地解释金融概念。`,
        };

        const openRouterApiKey = process.env.OpenRouter_Key?.replace(/"/g, "");
        if (!openRouterApiKey) {
            throw new Error("OpenRouter_Key not set");
        }

        log.log(`🤖 Answering question for ${upperSymbol} in ${language}...`);

        const response = await axios.post(
            "https://openrouter.ai/api/v1/chat/completions",
            {
                model: "deepseek/deepseek-r1",
                messages: [
                    {
                        role: "user",
                        content: prompts[language] || prompts.en,
                    },
                ],
                max_tokens: 500,
                temperature: 0.7,
            },
            {
                headers: {
                    Authorization: `Bearer ${openRouterApiKey}`,
                    "Content-Type": "application/json",
                    "HTTP-Referer": process.env.Current_Url || "http://localhost:3001",
                    "X-Title": "SAIS Prediction Chat",
                },
            }
        );

        if (!response.data || !response.data.choices || response.data.choices.length === 0) {
            throw new Error("No response from AI model");
        }

        const aiMessage = response.data.choices[0].message.content;
        const tokens = response.data.usage?.total_tokens || 0;

        return {
            text: aiMessage,
            tokens,
            confidence: predData.confidence,
            sources: predData.evidence?.map(e => e.source_link).filter(Boolean) || [],
        };
    } catch (error) {
        log.error("Error answering prediction question:", error);
        throw error;
    }
}

/**
 * Save chat message to database
 */
async function saveChatMessage(userId, symbol, sender, message, language = "en", tokens = 0) {
    const upperSymbol = symbol.toUpperCase();
    
    try {
        let chat = await PredictionChat.findOne({ userId, symbol: upperSymbol });

        const newMessage = {
            sender,
            message,
            language,
            timestamp: new Date(),
            model: "deepseek/deepseek-r1",
            tokens,
        };

        if (!chat) {
            // Create new chat
            chat = new PredictionChat({
                userId,
                symbol: upperSymbol,
                chatHistory: [newMessage],
            });
        } else {
            // Add to existing chat
            chat.chatHistory.push(newMessage);
        }

        await chat.save();
        return newMessage;
    } catch (error) {
        log.error("Error saving chat message:", error);
        throw error;
    }
}

/**
 * Get chat history for a user and symbol
 */
async function getChatHistory(userId, symbol, limit = 50) {
    const upperSymbol = symbol.toUpperCase();
    
    try {
        const chat = await PredictionChat.findOne({ userId, symbol: upperSymbol })
            .select("chatHistory")
            .lean();

        if (!chat) {
            return [];
        }

        // Return last N messages
        return chat.chatHistory.slice(-limit);
    } catch (error) {
        log.error("Error getting chat history:", error);
        throw error;
    }
}

module.exports = {
    generateInitialChatMessage,
    answerPredictionQuestion,
    saveChatMessage,
    getChatHistory,
};
