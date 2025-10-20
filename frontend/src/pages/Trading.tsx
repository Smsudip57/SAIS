import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTradingContext } from '@/contexts/TradingContext';
import { StockCard } from '@/components/StockCard';
import { TradingModal } from '@/components/TradingModal';
import { Search, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { mockStocks } from '@/lib/mockData';

// Real stock symbols for real-time data
const REAL_TIME_SYMBOLS = ["AAPL", "GOOGL", "MSFT", "TSLA", "AMZN", "NVDA"];

export default function Trading() {
  const { stocks } = useTradingContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStock, setSelectedStock] = useState<string | null>(null);
  const [tradeAction, setTradeAction] = useState<'buy' | 'sell'>('buy');

  // Filter real-time symbols based on search
  const filteredSymbols = REAL_TIME_SYMBOLS.filter(symbol => {
    const stock = mockStocks.find(s => s.symbol === symbol);
    return (
      symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (stock?.name.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  });

  const handleTrade = (symbol: string, action: 'buy' | 'sell') => {
    setSelectedStock(symbol);
    setTradeAction(action);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Stock Trading
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Buy and sell stocks with real-time market data
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Market Search</CardTitle>
          <CardDescription>
            Search for stocks to trade
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search stocks by symbol or name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="secondary">
                {filteredSymbols.length} stocks
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stock Grid with Real-Time Data */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSymbols.map((symbol) => (
          <StockCard
            key={symbol}
            symbol={symbol}
            onTrade={handleTrade}
          />
        ))}
      </div>

      {/* Trading Modal */}
      {selectedStock && (
        <TradingModal
          symbol={selectedStock}
          action={tradeAction}
          onClose={() => setSelectedStock(null)}
        />
      )}
    </div>
  );
}