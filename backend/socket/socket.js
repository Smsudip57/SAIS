const socketio = require("socket.io");
const mongoose = require("mongoose");
const { startStockStream, stopStockStream, setIOInstance } = require("../services/stockStream");
const {
  generateInitialChatMessage,
  answerPredictionQuestion,
  saveChatMessage,
  getChatHistory,
} = require("../services/predictionChatService");
const log = require("../helper/logger");

let io;
let clientCount = 0;

const setupSocket = (server) => {
  io = socketio(server, {
    cors: {
      origin: ["http://localhost:8080", process.env.Client_Url, "https://stockaisarge.com/"],
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  // Set the IO instance for stock streaming
  setIOInstance(io);

  io.on("connection", (socket) => {
    socket.on("attachSession", async (sessionId) => {
      if (!sessionId) {
        console.error("No session ID provided.");
        return;
      }

      const session = await Session.findById(sessionId);
      if (!session || session.status === "ended") {
        console.error("Session not found or ended.");
        return;
      }

      socket.join(sessionId);
    });

    socket.on(
      "sendMessage",
      async ({ sessionId, sender, message, timestamp }) => {
        if (!sessionId) {
          console.error("No session ID provided.");
          return;
        }

        const session = await Session.findById(sessionId);
        if (session) {
          session.messages.push({ sender, message });
          await session.save();
        }
        const addedMessage = session.messages[session.messages.length - 1];

        io.to(sessionId).emit("receiveMessage", {
          _id: addedMessage._id,
          sender: addedMessage.sender,
          message: addedMessage.message,
          timestamp: addedMessage.timestamp,
          isReadByAdmin: addedMessage.isReadByAdmin,
          isReadByUser: addedMessage.isReadByUser,
          sessionId,
        });
      }
    );

    socket.on("adminReadsMessage", async (sessionId, messageId) => {
      const session = await Session.findById(sessionId);
      if (!session) return console.error("Session not found.");

      const message = session.messages.id(messageId);
      if (message && !message.isReadByAdmin) {
        message.isReadByAdmin = true;
        await session.save();
        // Emit the read message to the user
        io.to(sessionId).emit("adminReadMessage", messageId); // This lets the user know the admin has read the message
      }
    });

    socket.on("userReadsMessage", async (sessionId, messageId) => {
      const session = await Session.findById(sessionId);
      if (!session) return console.error("Session not found.");

      const message = session.messages.id(messageId);
      if (message && !message.isReadByUser) {
        message.isReadByUser = true;
        await session.save();

        // Emit the read message to the admin
        io.to(sessionId).emit("userReadMessage", { sessionId, messageId }); // This lets the admin know the user has read the message
      }
    });

    socket.on("newSessionCreated", async (sessionId) => {
      try {
        setTimeout(async () => {
          const session = await Session.findById(sessionId)
            .populate("user")
            .populate("service");
          io.emit("new-session-started", session);
        }, 3000);
      } catch (error) { }
    });

    socket.on("joinUserRoom", (userId) => {
      if (!userId) {
        return;
      }

      socket.join(userId.toString());
      console.log("User joined room:", userId);
    });

    // Stock streaming events
    socket.on("subscribeToStocks", () => {
      socket.join("stocks");
      clientCount++;
      console.log("Client subscribed to stocks. Total subscribers:", clientCount);

      // Start streaming only when first client subscribes
      if (clientCount === 1) {
        // Add a small delay to ensure IO is fully initialized
        setTimeout(() => {
          startStockStream();
        }, 100);
      }
    });

    socket.on("unsubscribeFromStocks", () => {
      socket.leave("stocks");
      clientCount--;
      console.log("Client unsubscribed from stocks. Total subscribers:", clientCount);

      // Stop streaming when last client unsubscribes
      if (clientCount === 0) {
        stopStockStream();
      }
    });

    socket.on("markNotificationsAsSeen", async (userId) => {
      if (!userId || !mongoose.isValidObjectId(userId?.userId)) {
        console.error("Invalid userId:", userId);
        return;
      }
      try {
        await Notification.updateMany({ ...userId, seen: false }, { seen: true });
        io.to(userId?.userId.toString()).emit("notificationsUpdated", {
          message: "All notifications marked as seen",
          userId,
        });
      } catch (error) { console.error("Error marking notifications as seen:", error); }
    });

    // Prediction Chat Events
    socket.on("predictionChat:start", async ({ symbol, userId, language = "en" }) => {
      try {
        log.log(`🔮 Starting prediction chat for ${symbol} in ${language}`);
        
        // Emit generating effect
        socket.emit("prediction:generating", {
          symbol,
          message: "Generating AI analysis...",
        });

        // Get chat history
        const history = await getChatHistory(userId, symbol);
        
        // Simulate loading delay (2-3 seconds)
        await new Promise(resolve => setTimeout(resolve, 2500));

        // Generate initial message
        const initialData = await generateInitialChatMessage(symbol, language);

        // Save initial AI message
        await saveChatMessage(userId, symbol, "ai", initialData.message, language);

        // Emit prediction ready
        socket.emit("prediction:ready", {
          symbol,
          message: initialData.message,
          prediction: initialData.prediction,
          currentPrice: initialData.currentPrice,
          language,
          history,
        });
      } catch (error) {
        log.error("Error in predictionChat:start:", error);
        socket.emit("prediction:error", {
          symbol,
          error: error.message || "Failed to generate prediction",
        });
      }
    });

    socket.on("chat:question", async ({ symbol, userId, question, language = "en" }) => {
      try {
        log.log(`💬 Processing question for ${symbol}: ${question}`);

        // Emit thinking status
        const questionId = Date.now().toString();
        socket.emit("chat:response:start", {
          id: questionId,
          status: "thinking",
        });

        // Save user question
        await saveChatMessage(userId, symbol, "user", question, language);

        // Get chat history for context
        const history = await getChatHistory(userId, symbol, 10);

        // Get AI response
        const response = await answerPredictionQuestion(
          symbol,
          userId,
          question,
          language,
          history
        );

        // Save AI response
        await saveChatMessage(userId, symbol, "ai", response.text, language, response.tokens);

        // Emit complete response
        socket.emit("chat:response:end", {
          id: questionId,
          symbol,
          response: response.text,
          tokens: response.tokens,
          language,
          timestamp: new Date(),
        });
      } catch (error) {
        log.error("Error in chat:question:", error);
        socket.emit("chat:response:error", {
          symbol,
          error: error.message || "Failed to get AI response",
        });
      }
    });

    socket.on("disconnect", () => {
      // Handle unsubscribe on disconnect
      if (socket.rooms.has("stocks")) {
        clientCount--;
        if (clientCount === 0) {
          stopStockStream();
        }
      }
    });
  });

  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error("Socket.io not initialized!");
  }
  return io;
};

module.exports = { setupSocket, getIO };
