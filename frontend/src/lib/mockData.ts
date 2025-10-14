export interface Stock {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap: string;
  prediction?: {
    direction: 'up' | 'down' | 'neutral';
    confidence: number;
    targetPrice: number;
    reasoning: string;
    factors: string[];
  };
}

export interface Position {
  symbol: string;
  shares: number;
  avgPrice: number;
  currentPrice: number;
  totalValue: number;
  gainLoss: number;
  gainLossPercent: number;
}

export interface Account {
  balance: number;
  portfolioValue: number;
  totalValue: number;
  dayChange: number;
  dayChangePercent: number;
  positions: Position[];
}

export const mockStocks: Stock[] = [
  {
    symbol: 'AAPL',
    name: 'Apple Inc.',
    price: 182.52,
    change: 2.34,
    changePercent: 1.30,
    volume: 45678900,
    marketCap: '2.85T',
    prediction: { 
      direction: 'up', 
      confidence: 78, 
      targetPrice: 195.00,
      reasoning: 'Strong iPhone 15 sales momentum and services revenue growth, coupled with expansion into AI and AR markets. Recent supply chain improvements and strong Q4 earnings beat expectations.',
      factors: ['iPhone 15 strong sales', 'Services revenue growth +12%', 'AI integration roadmap', 'Supply chain optimization', 'Strong brand loyalty']
    }
  },
  {
    symbol: 'GOOGL',
    name: 'Alphabet Inc.',
    price: 138.21,
    change: -1.45,
    changePercent: -1.04,
    volume: 23456789,
    marketCap: '1.75T',
    prediction: { 
      direction: 'up', 
      confidence: 65, 
      targetPrice: 145.00,
      reasoning: 'Google Cloud gaining market share against AWS and Azure. AI advancements in search and advertising, plus YouTube revenue recovery. However, regulatory concerns remain a headwind.',
      factors: ['Google Cloud growth +28%', 'AI integration in search', 'YouTube ad recovery', 'Regulatory headwinds', 'Competition in AI space']
    }
  },
  {
    symbol: 'MSFT',
    name: 'Microsoft Corp.',
    price: 378.85,
    change: 4.12,
    changePercent: 1.10,
    volume: 34567890,
    marketCap: '2.81T',
    prediction: { 
      direction: 'up', 
      confidence: 82, 
      targetPrice: 395.00,
      reasoning: 'Azure cloud dominance continues with 29% growth. OpenAI partnership driving AI integration across all products. Strong enterprise demand for Microsoft 365 Copilot and Teams.',
      factors: ['Azure growth +29%', 'OpenAI partnership success', 'Copilot adoption', 'Enterprise demand', 'Cloud market leadership']
    }
  },
  {
    symbol: 'TSLA',
    name: 'Tesla Inc.',
    price: 248.50,
    change: -8.23,
    changePercent: -3.20,
    volume: 67890123,
    marketCap: '791B',
    prediction: { 
      direction: 'down', 
      confidence: 71, 
      targetPrice: 230.00,
      reasoning: 'Increased competition in EV market from traditional automakers. Price cuts impacting margins. Cybertruck production delays and FSD regulatory challenges continue.',
      factors: ['EV competition intensifying', 'Margin pressure from price cuts', 'Cybertruck delays', 'FSD regulatory issues', 'China market challenges']
    }
  },
  {
    symbol: 'AMZN',
    name: 'Amazon.com Inc.',
    price: 145.86,
    change: 1.92,
    changePercent: 1.33,
    volume: 28901234,
    marketCap: '1.51T',
    prediction: { 
      direction: 'up', 
      confidence: 69, 
      targetPrice: 155.00,
      reasoning: 'AWS growth stabilizing and Prime membership reaching new highs. Holiday season e-commerce strength and advertising revenue growth. Cost optimization efforts showing results.',
      factors: ['AWS stabilization', 'Prime membership growth', 'Holiday season strength', 'Ad revenue +24%', 'Cost optimization success']
    }
  },
  {
    symbol: 'NVDA',
    name: 'NVIDIA Corp.',
    price: 875.28,
    change: 15.67,
    changePercent: 1.82,
    volume: 45123456,
    marketCap: '2.16T',
    prediction: { 
      direction: 'up', 
      confidence: 85, 
      targetPrice: 920.00,
      reasoning: 'AI boom driving unprecedented demand for H100 and H200 chips. Data center revenue up 206% YoY. Strong partnerships with major cloud providers and enterprise AI adoption accelerating.',
      factors: ['AI chip demand surge', 'Data center revenue +206%', 'H100/H200 backlog', 'Cloud partnerships', 'Enterprise AI adoption']
    }
  }
];

export const createInitialAccount = (isDemo: boolean): Account => ({
  balance: isDemo ? 10000 : 0,
  portfolioValue: 0,
  totalValue: isDemo ? 10000 : 0,
  dayChange: 0,
  dayChangePercent: 0,
  positions: []
});

export const mockUser = {
  id: '1',
  name: 'John Doe',
  email: 'john.doe@example.com',
  demoAccount: createInitialAccount(true),
  realAccount: createInitialAccount(false)
};

// Simulate real-time price updates
export const updateStockPrices = (stocks: Stock[]): Stock[] => {
  return stocks.map(stock => {
    const changePercent = (Math.random() - 0.5) * 0.02; // ±1% max change
    const newPrice = stock.price * (1 + changePercent);
    const change = newPrice - stock.price;
    
    return {
      ...stock,
      price: Number(newPrice.toFixed(2)),
      change: Number(change.toFixed(2)),
      changePercent: Number((changePercent * 100).toFixed(2))
    };
  });
};