import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Stock } from '@/lib/mockData';
import { TrendingUp, TrendingDown, Brain, ChevronDown, ChevronUp, Info } from 'lucide-react';

interface StockCardProps {
  stock: Stock;
  compact?: boolean;
  onTrade?: (symbol: string, action: 'buy' | 'sell') => void;
}

export const StockCard: React.FC<StockCardProps> = ({ stock, compact = false, onTrade }) => {
  const [showReasoning, setShowReasoning] = useState(false);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatVolume = (volume: number) => {
    if (volume >= 1000000) {
      return `${(volume / 1000000).toFixed(1)}M`;
    }
    return `${(volume / 1000).toFixed(0)}K`;
  };

  const getPredictionColor = (direction: string) => {
    switch (direction) {
      case 'up': return 'text-green-600';
      case 'down': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getPredictionIcon = (direction: string) => {
    switch (direction) {
      case 'up': return <TrendingUp className="w-3 h-3" />;
      case 'down': return <TrendingDown className="w-3 h-3" />;
      default: return <Brain className="w-3 h-3" />;
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className={compact ? "p-4" : "p-6"}>
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="font-bold text-lg">{stock.symbol}</h3>
            {!compact && (
              <p className="text-sm text-gray-600 dark:text-gray-400">{stock.name}</p>
            )}
          </div>
          <div className="text-right">
            <p className="font-bold text-lg">{formatCurrency(stock.price)}</p>
            <div className={`flex items-center text-sm ${
              stock.change >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {stock.change >= 0 ? (
                <TrendingUp className="w-3 h-3 mr-1" />
              ) : (
                <TrendingDown className="w-3 h-3 mr-1" />
              )}
              {stock.change >= 0 ? '+' : ''}{formatCurrency(stock.change)} ({stock.changePercent >= 0 ? '+' : ''}{stock.changePercent}%)
            </div>
          </div>
        </div>

        {!compact && (
          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Volume:</span>
              <span>{formatVolume(stock.volume)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Market Cap:</span>
              <span>{stock.marketCap}</span>
            </div>
          </div>
        )}

        {stock.prediction && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-1">
                <Brain className="w-4 h-4 text-purple-600" />
                <span className="text-sm font-medium">AI Prediction</span>
              </div>
              <Badge variant="outline" className={getPredictionColor(stock.prediction.direction)}>
                <div className="flex items-center space-x-1">
                  {getPredictionIcon(stock.prediction.direction)}
                  <span className="capitalize">{stock.prediction.direction}</span>
                </div>
              </Badge>
            </div>
            <div className="text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-600">Target Price:</span>
                <span className="font-medium">{formatCurrency(stock.prediction.targetPrice)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Confidence:</span>
                <span className="font-medium">{stock.prediction.confidence}%</span>
              </div>
            </div>

            {!compact && (
              <Collapsible open={showReasoning} onOpenChange={setShowReasoning}>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className="w-full mt-2 p-0 h-auto text-xs">
                    <div className="flex items-center space-x-1">
                      <Info className="w-3 h-3" />
                      <span>View AI Reasoning</span>
                      {showReasoning ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </div>
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-2">
                  <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg text-xs space-y-2">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white mb-1">Analysis:</p>
                      <p className="text-gray-700 dark:text-gray-300">{stock.prediction.reasoning}</p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white mb-1">Key Factors:</p>
                      <div className="flex flex-wrap gap-1">
                        {stock.prediction.factors.map((factor, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {factor}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            )}
          </div>
        )}

        {onTrade && !compact && (
          <div className="flex space-x-2">
            <Button 
              size="sm" 
              variant="outline" 
              className="flex-1 text-green-600 border-green-600 hover:bg-green-50"
              onClick={() => onTrade(stock.symbol, 'buy')}
            >
              Buy
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              className="flex-1 text-red-600 border-red-600 hover:bg-red-50"
              onClick={() => onTrade(stock.symbol, 'sell')}
            >
              Sell
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};