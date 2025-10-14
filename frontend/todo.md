# Stock Trading Dashboard MVP - Development Plan

## Core Features to Implement:
1. **Authentication System** - Face recognition placeholder + traditional login
2. **Dashboard Layout** - Modern financial UI with sidebar navigation
3. **Portfolio Overview** - Real-time portfolio value, P&L, holdings
4. **Demo vs Real Account Toggle** - Switch between $10,000 demo and $0 real account
5. **Stock Trading Interface** - Buy/sell stocks with real-time quotes
6. **Dynamic Charts** - Portfolio performance and stock price charts
7. **Market Data** - Live stock prices and market trends
8. **Prediction Models** - AI-powered stock predictions display

## Files to Create/Modify:

### 1. Core Layout & Navigation
- `src/components/Layout.tsx` - Main dashboard layout with sidebar
- `src/components/Sidebar.tsx` - Navigation sidebar
- `src/components/Header.tsx` - Top header with account toggle

### 2. Authentication
- `src/pages/Login.tsx` - Login page with face recognition option
- `src/components/FaceAuth.tsx` - Face recognition component

### 3. Dashboard Pages
- `src/pages/Dashboard.tsx` - Main dashboard overview
- `src/pages/Portfolio.tsx` - Portfolio management page
- `src/pages/Trading.tsx` - Stock trading interface
- `src/pages/Analytics.tsx` - Predictions and market analysis

### 4. Trading Components
- `src/components/StockCard.tsx` - Individual stock display
- `src/components/TradingModal.tsx` - Buy/sell modal
- `src/components/PortfolioChart.tsx` - Portfolio performance chart

### 5. Data & State Management
- `src/lib/mockData.ts` - Mock stock data and user accounts
- `src/lib/tradingUtils.ts` - Trading calculations and utilities
- `src/contexts/TradingContext.tsx` - Global trading state

### 6. Updated Files
- `src/App.tsx` - Add routing for all pages
- `src/pages/Index.tsx` - Redirect to dashboard or login
- `index.html` - Update title to "StockTrader Pro"

## Technical Approach:
- Use localStorage for demo/real account data persistence
- Implement simulated real-time data updates
- Modern financial UI with dark theme option
- Responsive design for web and potential desktop use
- Mock face recognition with camera placeholder