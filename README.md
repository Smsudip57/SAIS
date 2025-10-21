# SAIS - Stock Market AI Learning Platform

<div align="center">

![SAIS Logo](frontend/public/android-chrome-512x512.png)

**A comprehensive platform empowering financial education through AI-powered stock market analysis, trading simulation, and real-time market data.**

[Features](#-features) • [Tech Stack](#-tech-stack) • [Getting Started](#-getting-started) • [Architecture](#-architecture) • [API Documentation](#-api-documentation)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-v18+-green)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-v19-blue)](https://react.dev/)

</div>

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Prerequisites](#-prerequisites)
- [Getting Started](#-getting-started)
- [Configuration](#-configuration)
- [Running the Application](#-running-the-application)
- [API Documentation](#-api-documentation)
- [Architecture](#-architecture)
- [Development Workflow](#-development-workflow)
- [Team](#-team)
- [License](#-license)

---

## Overview

**SAIS** (Stock AI Intelligence System) is a cutting-edge educational platform designed to democratize financial literacy. It combines modern web technologies with AI-powered market analysis to help users learn, practice, and master stock trading without financial risk.

### Mission
We empower people to understand and explore the stock market through:
- 📚 **Comprehensive Learning** - Educational resources for all levels
- 🎮 **Safe Practice** - Virtual trading with realistic market conditions
- 🤖 **AI Analytics** - Machine learning-powered stock predictions
- 📊 **Real-Time Data** - Live market updates and analysis

---

## ✨ Features

### 🎯 Core Features

#### Authentication & User Management
- **Multi-method Authentication**
  - Email/Password registration and login
  - Face recognition authentication (placeholder framework)
  - JWT-based session management
  - Secure cookie-based tokens

#### Trading Dashboard
- **Real-Time Portfolio Management**
  - Live portfolio value tracking
  - P&L (Profit/Loss) calculations
  - Position management and analysis
  - Historical transaction records

- **Demo vs Real Account**
  - $10,000 virtual capital for demo trading
  - Real account trading preparation
  - Risk-free learning environment

- **Advanced Trading Interface**
  - Buy/Sell stock trading execution
  - Real-time stock quotes
  - Order history tracking
  - Instant trade confirmations

#### AI-Powered Analytics
- **Intelligent Stock Predictions**
  - Machine learning-based price predictions
  - Confidence scoring (0-1 scale)
  - Detailed AI reasoning with evidence
  - Source attribution for analysis

- **Predictive Insights**
  - Next-day price movement predictions
  - Key factors analysis
  - Technical and fundamental analysis
  - Market sentiment indicators

#### Real-Time Market Data
- **Live Stock Streaming**
  - WebSocket-based real-time updates
  - Multi-stock simultaneous tracking
  - Historical data caching
  - Responsive chart updates

- **Market Analysis**
  - 30-day historical price trends
  - Average volume and price ranges
  - Market cap and volatility metrics
  - News integration and sentiment analysis

#### Learning & Analytics
- **Educational Hub**
  - Stock market fundamentals
  - Trading strategy guides
  - Market analysis tutorials

- **Analytics Dashboard**
  - AI prediction performance metrics
  - Average confidence levels
  - Stock performance tracking
  - Detailed prediction analysis

#### Community Features
- **User Community**
  - User profiles and account management
  - Trading strategy sharing (framework ready)
  - Performance leaderboards
  - Community engagement tools

---

## 🛠 Tech Stack

### Frontend
```
Framework:        React 19.1.1 with TypeScript
Build Tool:       Vite 5.4.1
Styling:          Tailwind CSS 3.4.11
UI Components:    Shadcn-UI (35+ pre-built components)
State Management: Redux Toolkit 2.9.0 + RTK Query
Form Handling:    React Hook Form 7.65.0
Validation:       Zod 3.25.76
Charts:           Recharts 2.15.4
Real-Time:        Socket.io-client 4.8.1
HTTP Client:      Axios 1.12.2
Icons:            Lucide React 0.462.0
Animations:       Framer Motion 11.0.0
Notifications:    Sonner 1.7.4
Package Manager:  pnpm 8.10.0
```

### Backend
```
Runtime:          Node.js
Framework:        Express.js 4.21.2
Database:         MongoDB 8.9.3 + Mongoose
Authentication:   JWT (jsonwebtoken 9.0.2)
Password Hashing: bcrypt 5.1.1
Real-Time:        Socket.io 4.8.1
Stock Data:       Yahoo Finance API (yahoo-finance2 2.13.3)
AI/ML:            OpenRouter API (DeepSeek R1)
Email:            Nodemailer 6.10.0
File Upload:      Multer 1.4.5-lts.1
Development:      Nodemon 3.1.9
Environment:      dotenv 16.4.5
CORS:             cors 2.8.5
```

---

## 📁 Project Structure

```
SAIS/
├── backend/                          # Express.js REST API server
│   ├── index.js                      # Application entry point
│   ├── package.json                  # Backend dependencies
│   ├── .env                          # Environment variables
│   ├── dbConnect/
│   │   └── dbConnect.js              # MongoDB connection setup
│   ├── models/                       # Mongoose schemas
│   │   ├── user.js                   # User account model
│   │   ├── position.js               # Trading positions
│   │   ├── prediction.js             # AI predictions
│   │   ├── transaction.js            # Trade transactions
│   │   └── portfolioHistory.js       # Portfolio snapshots
│   ├── routes/                       # API endpoints
│   │   ├── auth.js                   # Authentication endpoints
│   │   ├── user.js                   # User/trading endpoints
│   │   └── admin.js                  # Admin management
│   ├── middlewares/
│   │   └── Auth.js                   # JWT authentication middleware
│   ├── services/
│   │   ├── predictionService.js      # AI prediction logic
│   │   └── stockStream.js            # Real-time stock data streaming
│   ├── socket/
│   │   └── socket.js                 # WebSocket configuration
│   ├── helper/
│   │   └── logger.js                 # Logging utilities
│   └── public/                       # Static files
│
├── frontend/                         # React + TypeScript application
│   ├── index.html                    # HTML entry point
│   ├── package.json                  # Frontend dependencies
│   ├── .env                          # Environment variables
│   ├── vite.config.ts                # Vite configuration
│   ├── tailwind.config.ts            # Tailwind CSS configuration
│   ├── tsconfig.json                 # TypeScript configuration
│   ├── public/                       # Static assets
│   │   ├── sais-logo.png            # Application logo
│   │   ├── robots.txt               # SEO robots file
│   │   └── site.webmanifest         # PWA manifest
│   ├── src/
│   │   ├── main.tsx                 # React entry point
│   │   ├── App.tsx                  # Root component
│   │   ├── components/
│   │   │   ├── Layout.tsx           # Main dashboard layout
│   │   │   ├── Sidebar.tsx          # Navigation sidebar
│   │   │   ├── Header.tsx           # Top header
│   │   │   ├── Dashboard.tsx        # Dashboard page
│   │   │   ├── Trading.tsx          # Trading interface
│   │   │   ├── Portfolio.tsx        # Portfolio management
│   │   │   ├── Analytics.tsx        # AI predictions page
│   │   │   ├── TradingModal.tsx     # Trade execution modal
│   │   │   ├── PortfolioChart.tsx   # Performance charts
│   │   │   ├── StockCard.tsx        # Stock display card
│   │   │   └── ui/                  # Shadcn-UI components
│   │   ├── contexts/
│   │   │   ├── TradingContext.tsx   # Trading state management
│   │   │   └── StockStreamContext.tsx # Real-time data context
│   │   ├── hooks/
│   │   │   ├── useStockStream.ts    # Hook for stock streaming
│   │   │   └── use-toast.ts         # Toast notifications hook
│   │   ├── Redux/
│   │   │   ├── store.ts             # Redux store setup
│   │   │   ├── authSlice.ts         # Authentication state
│   │   │   ├── tradingSlice.ts      # Trading state
│   │   │   └── Api/
│   │   │       ├── baseApi.ts       # RTK Query base configuration
│   │   │       ├── authApi/         # Authentication endpoints
│   │   │       ├── tradingApi/      # Trading endpoints
│   │   │       └── userApi/         # User endpoints
│   │   ├── lib/
│   │   │   ├── utils.ts             # Utility functions
│   │   │   └── mockData.ts          # Mock stock data
│   │   └── pages/
│   │       ├── HomePage.tsx         # Landing page
│   │       ├── Login.tsx            # Login page
│   │       ├── Dashboard.tsx        # Main dashboard
│   │       ├── Trading.tsx          # Trading page
│   │       ├── Portfolio.tsx        # Portfolio page
│   │       ├── Analytics.tsx        # Analytics page
│   │       └── NotFound.tsx         # 404 page
│   └── Redux/
│
└── README.md                         # This file
```

---

## 📦 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18.0.0 or higher)
- **npm** (v9.0.0 or higher) OR **pnpm** (v8.10.0 or higher)
- **MongoDB** (v5.0.0 or higher) - Local instance or MongoDB Atlas
- **Git**

### Optional
- **Redis** (for caching - not currently required)
- **Docker** (for containerized deployment)

---

## 🚀 Getting Started

### Step 1: Clone the Repository

```bash
git clone https://github.com/Smsudip57/dubai.git
cd dubai
```

### Step 2: Environment Setup

#### Backend Configuration
Create a `.env` file in the `backend/` directory:

```env
# Server Configuration
PORT=3001
NODE_ENV=development
Current_Url=http://localhost:3001

# Frontend Configuration
Client_Url=http://localhost:5173

# Database Configuration
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/stockstest?retryWrites=true&w=majority

# Authentication
JWT_SECRET=your-highly-secret-key-here-minimum-32-characters

# API Keys
Key=your-unique-api-key
AV_Key=your-alpha-vantage-key
OpenRouter_Key=your-openrouter-api-key

# Email Configuration (Optional)
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
```

#### Frontend Configuration
Create a `.env` file in the `frontend/` directory:

```env
VITE_BASE_URL=http://localhost:3001/api
```

### Step 3: Install Dependencies

#### Backend
```bash
cd backend
npm install
# OR
pnpm install
```

#### Frontend
```bash
cd frontend
pnpm install
```

### Step 4: MongoDB Setup

**Option A: Local MongoDB**
```bash
# Start MongoDB locally
mongod
```

**Option B: MongoDB Atlas (Cloud)**
1. Visit [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free cluster
3. Get your connection URI
4. Add it to your `.env` file as `MONGO_URI`

---

## ⚙️ Configuration

### API Keys Setup

#### 1. **OpenRouter API** (AI Predictions)
- Visit [OpenRouter.ai](https://openrouter.ai)
- Sign up and create an API key
- Add to `.env`: `OpenRouter_Key=your-key`

#### 2. **Alpha Vantage API** (Stock Data)
- Visit [Alpha Vantage](https://www.alphavantage.co)
- Get a free API key
- Add to `.env`: `AV_Key=your-key`

#### 3. **MongoDB Atlas** (Database)
- Create a cluster at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
- Whitelist your IP address
- Get the connection string
- Add to `.env`: `MONGO_URI=your-connection-string`

### Environment Variables Explained

| Variable | Purpose | Example |
|----------|---------|---------|
| `PORT` | Backend server port | `3001` |
| `MONGO_URI` | MongoDB connection string | `mongodb+srv://...` |
| `JWT_SECRET` | Token signing secret | `highlySecretKey...` |
| `Client_Url` | Frontend URL for CORS | `http://localhost:5173` |
| `Current_Url` | Backend URL | `http://localhost:3001` |
| `OpenRouter_Key` | AI API key | `sk-or-v1-...` |
| `AV_Key` | Stock data API key | `EQUKHP6MUL...` |

---

## 🎯 Running the Application

### Development Mode

#### Terminal 1: Start Backend Server
```bash
cd backend
npm run dev
# OR
pnpm dev
```

Expected output:
```
Server is running on http://localhost:3001
Connected to MongoDB successfully
```

#### Terminal 2: Start Frontend Development Server
```bash
cd frontend
pnpm dev
```

Expected output:
```
VITE v5.4.1  ready in 450 ms

➜  Local:   http://localhost:5173/
➜  press h to show help
```

#### Access the Application
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001/api
- **API Documentation**: http://localhost:3001

---

### Production Build

#### Build Frontend
```bash
cd frontend
pnpm build
```

This creates a `dist/` folder with optimized production build.

#### Build Backend
```bash
cd backend
npm start
```

---

## 📡 API Documentation

### Authentication Endpoints

#### Register User
```http
POST /api/register
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "password": "SecurePass123"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "email": "john@example.com",
    "firstName": "John",
    "lastName": "Doe"
  }
}
```

#### Login
```http
POST /api/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "SecurePass123"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Login successful",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "email": "john@example.com",
    "profile": {
      "name": "John Doe"
    }
  }
}
```

### Trading Endpoints

#### Get Stock Data
```http
GET /api/user/stockdata?stock=AAPL
Authorization: Bearer {token}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "symbol": "AAPL",
    "currentPrice": 182.52,
    "change": 2.34,
    "changePercent": 1.30,
    "volume": 45678900,
    "marketCap": "2.85T"
  }
}
```

#### Get AI Prediction
```http
GET /api/user/prediction?stock=AAPL
Authorization: Bearer {token}
```

**Response (200 OK):**
```json
{
  "success": true,
  "prediction": {
    "symbol": "AAPL",
    "currentPrice": 182.52,
    "prediction": {
      "pred_pct": 2.5,
      "confidence": 0.78,
      "rationale": "Strong iPhone sales momentum with AI integration...",
      "evidence": [
        {
          "detail": "iPhone 15 strong sales",
          "source_link": "Market analysis"
        }
      ]
    }
  }
}
```

#### Execute Trade
```http
POST /api/user/trade
Content-Type: application/json
Authorization: Bearer {token}

{
  "symbol": "AAPL",
  "quantity": 10,
  "type": "buy",
  "price": 182.52
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Trade executed successfully",
  "transaction": {
    "id": "507f1f77bcf86cd799439011",
    "symbol": "AAPL",
    "quantity": 10,
    "type": "buy",
    "price": 182.52,
    "timestamp": "2024-10-22T10:30:00Z"
  }
}
```

### User Endpoints

#### Get User Profile
```http
GET /api/user/profile
Authorization: Bearer {token}
```

#### Get Portfolio
```http
GET /api/user/portfolio
Authorization: Bearer {token}
```

#### Get Trading History
```http
GET /api/user/history
Authorization: Bearer {token}
```

---

## 🏗️ Architecture

### System Architecture

```
┌─────────────────────────────────────────────────────┐
│          Frontend (React + TypeScript)              │
│  - Vite bundler, Tailwind CSS, Shadcn-UI          │
│  - Redux state management with RTK Query           │
│  - Socket.io for real-time updates                 │
└────────────────┬────────────────────────────────────┘
                 │ HTTP/WebSocket
         ┌───────┴────────┐
         ▼                ▼
    ┌─────────┐    ┌──────────────┐
    │ Express │◄──►│  Socket.io   │
    │ Backend │    │   (Real-time)│
    └────┬────┘    └──────────────┘
         │
         ├─────────────────────┐
         ▼                     ▼
    ┌─────────────┐    ┌───────────────┐
    │  MongoDB    │    │  Yahoo Finance│
    │  Database   │    │  API          │
    └─────────────┘    └───────────────┘
         │
         └─────────────────────┐
                               ▼
                        ┌──────────────┐
                        │ OpenRouter AI│
                        │ (Predictions)│
                        └──────────────┘
```

### Data Flow

**1. User Authentication**
```
User Credentials → Express Route → Validate → JWT Token → Redis/Cookie
```

**2. Real-Time Stock Updates**
```
Yahoo Finance API → Backend Service → Socket.io → Frontend WebSocket → UI Update
```

**3. AI Predictions**
```
Stock Symbol → Backend Service → OpenRouter API → Parse Response → Database → Frontend
```

**4. Trading Execution**
```
Buy/Sell Order → Express Route → Validate Portfolio → Execute Trade → Update DB → Response
```

---

## 👨‍💻 Development Workflow

### Adding a New Feature

1. **Create a feature branch**
   ```bash
   git checkout -b feature/feature-name
   ```

2. **Backend Development**
   ```bash
   cd backend
   npm run dev  # Nodemon watches for changes
   ```

3. **Frontend Development**
   ```bash
   cd frontend
   pnpm dev  # Vite hot reload
   ```

4. **Testing**
   ```bash
   # Backend tests
   cd backend && npm test
   
   # Frontend linting
   cd frontend && pnpm lint
   ```

5. **Commit and Push**
   ```bash
   git add .
   git commit -m "feat: add new feature"
   git push origin feature/feature-name
   ```

6. **Create Pull Request** on GitHub

### Code Style Guide

- **JavaScript/TypeScript**: Follow ESLint configuration
- **React Components**: Use functional components with hooks
- **CSS**: Use Tailwind CSS classes
- **Naming**: camelCase for variables/functions, PascalCase for components
- **Comments**: Add JSDoc comments for complex functions

---

## 🧪 Testing

### Backend Testing
```bash
cd backend
npm test
```

### Frontend Linting
```bash
cd frontend
pnpm lint
```

### Building for Production
```bash
# Frontend
cd frontend
pnpm build

# Backend (no build needed, but verify with)
cd backend
npm start
```

---

## 🐛 Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| MongoDB connection fails | Check `MONGO_URI` in `.env` and whitelist IP in Atlas |
| CORS errors | Ensure `Client_Url` matches frontend URL in backend `.env` |
| API keys not working | Verify API keys are correct and have required permissions |
| Port already in use | Change `PORT` in `.env` or kill process using the port |
| Frontend doesn't connect to backend | Check `VITE_BASE_URL` in frontend `.env` |
| Real-time updates not working | Ensure WebSocket connection is not blocked by firewall |
| AI predictions timeout | Check OpenRouter API key and rate limits |

### Getting Help

1. Check the [Issues](https://github.com/Smsudip57/dubai/issues) page
2. Review the code comments and documentation
3. Check environment variables are correctly set
4. Look at browser console for frontend errors
5. Check server logs for backend errors

---

## 📊 Performance Optimization

### Frontend
- ✅ Code splitting with lazy loading
- ✅ Image optimization
- ✅ CSS minification
- ✅ Component memoization
- ✅ Efficient state management

### Backend
- ✅ Database indexing
- ✅ API response caching
- ✅ Connection pooling
- ✅ Compression middleware
- ✅ Rate limiting

---

## 🔒 Security Features

- **JWT Authentication** - Secure token-based auth
- **Password Hashing** - bcrypt with salt rounds
- **CORS Configuration** - Restricted to trusted origins
- **Environment Variables** - Sensitive data protected
- **Input Validation** - Zod schema validation
- **HTTPS Ready** - Secure cookie flags enabled
- **SQL Injection Prevention** - Mongoose query protection

---

## 📚 Learning Resources

- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Express.js Guide](https://expressjs.com/)
- [MongoDB University](https://university.mongodb.com/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Redux Toolkit](https://redux-toolkit.js.org/)

---

## 🚢 Deployment

### Backend Deployment (Heroku/Railway)
```bash
# Build and deploy
git push heroku main
```

### Frontend Deployment (Vercel/Netlify)
```bash
cd frontend
pnpm build
# Deploy the 'dist' folder
```

---

## 👥 Team

SAIS is built by a passionate team of students dedicated to financial education:

| Member | Role | Expertise |
|--------|------|-----------|
| Hassan Al Qahtani | Lead Developer | Full-Stack Development |
| Mohamed Alblooshi | Web Engineer | Frontend Specialist |
| Mohamed Almenhali | Researcher | Financial Markets & Data Analysis |

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📞 Contact & Support

- **GitHub**: [Smsudip57](https://github.com/Smsudip57)
- **Project Repository**: [dubai](https://github.com/Smsudip57/dubai)
- **Report Issues**: [GitHub Issues](https://github.com/Smsudip57/dubai/issues)

---

## 🙏 Acknowledgments

- [Shadcn-UI](https://ui.shadcn.com/) for amazing pre-built components
- [Yahoo Finance API](https://finance.yahoo.com/) for stock data
- [OpenRouter](https://openrouter.ai/) for AI predictions
- [MongoDB](https://www.mongodb.com/) for database
- All open-source libraries that make this project possible

---

<div align="center">

**Made with ❤️ by the SAIS Team**

© 2025 SAIS Project — Stock Market Learning Platform

[⬆ back to top](#sais---stock-market-ai-learning-platform)

</div>
