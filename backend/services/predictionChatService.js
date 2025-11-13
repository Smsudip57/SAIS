const PredictionChat = require("../models/predictionChat");
const Prediction = require("../models/prediction");
const log = require("../helper/logger");
const OpenAI = require("openai");
const { Agent, run } = require('@openai/agents');

// Initialize OpenAI client once at module load
let openaiClient = null;

function getOpenAIClient() {
    if (!openaiClient) {
        const openaiApiKey = process.env.OPENAI_API_KEY || process.env.OpenAI_Key?.replace(/"/g, "");
        if (!openaiApiKey) {
            throw new Error("OPENAI_API_KEY or OpenAI_Key environment variable not set");
        }
        openaiClient = new OpenAI({
            apiKey: openaiApiKey,
        });
    }
    return openaiClient;
}

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
 * Answer follow-up question about prediction using OpenAI Agent
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

        // Language-specific prompts with strict instructions
        const prompts = {
            en: `You are a STRICT financial AI assistant that ONLY answers questions related to stocks, financial markets, and trading. You are helping users understand stock predictions.

Stock: ${upperSymbol}
Current Prediction: ${predData.pred_pct >= 0 ? "+" : ""}${predData.pred_pct}% (Confidence: ${Math.round((predData.confidence || 0) * 100)}%)
Rationale: ${predData.rationale}

Previous conversation:
${contextMessages || "No previous conversation"}

User question: ${question}

IMPORTANT RULES:
1. ONLY answer questions about stocks, financial markets, trading, investments, and related financial concepts
2. If the question is NOT related to stocks or finance, IMMEDIATELY respond with: "I am a financial AI agent. I can't answer irrelevant prompts. Please ask me questions about stocks, trading, or financial analysis."
3. Do NOT try to answer off-topic questions even if you could
4. Be concise, friendly, and explain financial concepts clearly (max 200 words)
5. Always prioritize relevance to the stock ${upperSymbol} being analyzed`,
            ar: `أنت مساعد ذكاء اصطناعي مالي صارم يجيب فقط على الأسئلة المتعلقة بالأسهم والأسواق المالية والتداول. أنت تساعد المستخدمين على فهم توقعات الأسهم.

السهم: ${upperSymbol}
التوقع الحالي: ${predData.pred_pct >= 0 ? "+" : ""}${predData.pred_pct}٪ (الثقة: ${Math.round((predData.confidence || 0) * 100)}٪)
التفسير: ${predData.rationale}

المحادثة السابقة:
${contextMessages || "لا توجد محادثة سابقة"}

سؤال المستخدم: ${question}

قواعد مهمة:
1. أجب فقط على الأسئلة حول الأسهم والأسواق المالية والتداول والاستثمارات والمفاهيم المالية ذات الصلة
2. إذا كان السؤال غير متعلق بالأسهم أو التمويل، استجب فوراً بـ: "أنا وكيل ذكاء اصطناعي مالي. لا أستطيع الإجابة على أسئلة غير ذات صلة. يرجى سؤالي عن الأسهم أو التحليل المالي."
3. لا تحاول الإجابة على أسئلة خارج الموضوع حتى لو كان بإمكانك ذلك
4. كن ودوداً وموجزاً واشرح المفاهيم المالية بوضوح (بحد أقصى 200 كلمة)
5. ركز دائماً على الصلة بالسهم ${upperSymbol} قيد التحليل`,
            zh: `您是一位STRICT的金融AI助手，ONLY回答与股票、金融市场和交易相关的问题。您正在帮助用户理解股票预测。

股票: ${upperSymbol}
当前预测: ${predData.pred_pct >= 0 ? "+" : ""}${predData.pred_pct}% (置信度: ${Math.round((predData.confidence || 0) * 100)}%)
理由: ${predData.rationale}

之前的对话:
${contextMessages || "无之前的对话"}

用户问题: ${question}

重要规则:
1. ONLY回答关于股票、金融市场、交易、投资和相关金融概念的问题
2. 如果问题与股票或金融无关，立即回复："我是金融AI助手。我无法回答无关的问题。请问我关于股票、交易或财务分析的问题。"
3. 即使您可以回答，也不要尝试回答主题外的问题
4. 简洁友好，清楚解释金融概念（最多200字）
5. 始终优先考虑与股票${upperSymbol}分析的相关性`,
        };

        log.log(`🤖 Answering question for ${upperSymbol} in ${language} using OpenAI Agent (strict financial mode)...`);

        // Create a strict financial assistant agent
        const financialAgent = new Agent({
            name: 'Strict Financial Analyst Assistant',
            instructions: `You are a STRICT financial AI assistant that ONLY answers questions related to stocks, financial markets, trading, and investments.

CRITICAL RULES:
1. You MUST only answer questions about stocks, finance, trading, investments, and related topics
2. If a question is not related to stocks or finance, you MUST respond with EXACTLY: "I am a financial AI agent. I can't answer irrelevant prompts. Please ask me questions about stocks, trading, or financial analysis."
3. Do NOT provide answers to off-topic questions no matter what
4. Do NOT make exceptions or try to be helpful with non-financial topics
5. Be concise and friendly in your financial answers (max 200 words)
6. Always relate your answers back to the stock being analyzed

Remember: Your sole purpose is financial analysis and stock predictions. Reject all other topics firmly and politely.`,
            openaiClient: getOpenAIClient()
        });

        const agentInput = prompts[language] || prompts.en;

        log.log(`📤 Sending question to OpenAI Agent for ${upperSymbol}...`);
        const result = await run(financialAgent, agentInput);

        if (!result || !result.finalOutput) {
            throw new Error("No response from AI agent");
        }

        const aiMessage = result.finalOutput;
        const tokens = result.usage?.total_tokens || 0;

        log.log(`✅ Received AI response for ${upperSymbol}`);

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
