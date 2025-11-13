const dotenv = require("dotenv");
dotenv.config();
const express = require("express");
const dbConnect = require("./dbConnect/dbConnect"); 
const auth = require("./routes/auth");
const user = require("./routes/user");
const admin = require("./routes/admin");
const { adminAuth, userAuth } = require("./middlewares/Auth");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const app = express();
const PORT = process.env.PORT || 5000;

const http = require("http"); 
const { Server } = require("socket.io");
const { setupSocket, getIO } = require("./socket/socket");

const server = http.createServer(app); 
const io = setupSocket(server);

// Connect to MongoDB
app.use(
  cors({
    origin: [
      "http://localhost:5173", "https://stockaisarge.com/",
      process.env.Client_Url
    ],
    credentials: true,
  })
);
app.use(express.static("public"));
app.use(cookieParser());

app.use((req, res, next) => {
  console.log(`Path hit: ${req.originalUrl}`);
  console.log(req.cookies.access);
  next();
});
app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.use(
  "/api/payment/stripe_webhook",
  express.raw({ type: "application/json" })
);
app.use(express.json());

app.use("/api", auth);
app.use("/api/user", userAuth, user);
app.use("/api/admin", adminAuth, admin);

app.use((req, res, next) => {
  console.log(`Path hit: ${req.originalUrl}`);
  console.log("This route does not exist!");
  res.status(404).send("This route does not exist!");
});

const start = async () => {
  await dbConnect();
  server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
};

start();
