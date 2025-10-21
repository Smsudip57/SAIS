import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Stock } from '@/lib/mockData';
import { TrendingUp, TrendingDown, Brain, ChevronDown, ChevronUp, Info, Loader } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useSharedStockStream } from '@/hooks/useSharedStockStream';
import { useGetStocksPredictionsQuery } from '../../Redux/Api/tradingApi/Trading';

interface StockCardProps {
  symbol?: string;
  stock?: Stock;
  compact?: boolean;
  onTrade?: (symbol: string, action: 'buy' | 'sell') => void;
}

export const StockCard: React.FC<StockCardProps> = ({ symbol, stock, compact = false, onTrade }) => {
  const [showReasoning, setShowReasoning] = useState(false);

  // Fetch predictions from API - only once when component mounts
  const { data: predictionsData, isLoading: predictionsLoading } = useGetStocksPredictionsQuery(undefined, {
    skip: false,
    refetchOnMountOrArgChange: false,
    refetchOnReconnect: false,
    refetchOnFocus: false,
  });

  // Use real-time data if symbol is provided
  const shouldUseRealtime = !!symbol;
  const { stockData, isConnected } = useSharedStockStream(symbol);

  // Determine which data source to use
  const realTimeData = shouldUseRealtime ? stockData : null;
  const currentData = realTimeData?.currentData;

  // Get prediction data for this stock
  const predictionData = symbol && predictionsData?.data?.[symbol?.toUpperCase()];

  React.useEffect(() => {
    console.log('🔮 Predictions Data:', predictionsData?.data);
  }, [predictionsData?.data]);

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

  const formatMarketCap = (marketCap: number | string | undefined) => {
    if (!marketCap || marketCap === 'N/A') return 'N/A';
    const value = typeof marketCap === 'string' ? parseFloat(marketCap) : marketCap;
    if (isNaN(value)) return 'N/A';
    if (value >= 1e12) {
      return `$${(value / 1e12).toFixed(2)}T`;
    }
    if (value >= 1e9) {
      return `$${(value / 1e9).toFixed(2)}B`;
    }
    if (value >= 1e6) {
      return `$${(value / 1e6).toFixed(2)}M`;
    }
    return `$${value.toFixed(0)}`;
  };

  const getPredictionColor = (direction: string) => {
    switch (direction) {
      case 'up': return 'text-green-600';
      case 'down': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getPredictionDirection = (prediction: any) => {
    if (typeof prediction === 'object' && prediction?.direction) {
      return getPredictionColor(prediction.direction);
    }
    if (typeof prediction === 'string') {
      return getPredictionColor(prediction);
    }
    return 'text-gray-600';
  };

  const getPredictionIcon = (prediction: any) => {
    const direction = typeof prediction === 'object' ? prediction?.direction : prediction;
    switch (direction) {
      case 'up': return <TrendingUp className="w-3 h-3" />;
      case 'down': return <TrendingDown className="w-3 h-3" />;
      default: return <Brain className="w-3 h-3" />;
    }
  };

  // Check if prediction is loading
  const predictionLoading = predictionsLoading;

  // Loading state for real-time data
  if (shouldUseRealtime && realTimeData?.isLoading) {
    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className={compact ? "p-4" : "p-6"}>
          <div className="space-y-3">
            {/* Header skeleton */}
            <div className="flex items-start justify-between mb-3">
              <div className="space-y-2 flex-1">
                <Skeleton className="h-6 w-20" />
                {!compact && <Skeleton className="h-4 w-32" />}
              </div>
              <div className="text-right space-y-2">
                <Skeleton className="h-6 w-24 ml-auto" />
                <Skeleton className="h-4 w-28 ml-auto" />
              </div>
            </div>

            {/* Content skeleton */}
            {!compact && (
              <>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </>
            )}

            {/* Prediction section skeleton */}
            <div className="space-y-2 mt-4 pt-4 border-t">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>

            {/* Buttons skeleton */}
            {onTrade && !compact && (
              <div className="flex space-x-2 mt-4">
                <Skeleton className="flex-1 h-9" />
                <Skeleton className="flex-1 h-9" />
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (shouldUseRealtime && realTimeData?.error) {
    return (
      <Card className="hover:shadow-md transition-shadow border-red-200">
        <CardContent className={compact ? "p-4" : "p-6"}>
          <div className="text-center space-y-2">
            <p className="text-sm text-red-600 font-medium">Error loading {symbol}</p>
            <p className="text-xs text-gray-500">{realTimeData.error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Use real-time data if available, otherwise use mock data
  const displayData = shouldUseRealtime && currentData ? {
    symbol: currentData?.symbol,
    name: currentData?.symbol,
    price: currentData?.price,
    change: currentData?.change,
    changePercent: currentData?.changePercent,
    volume: currentData?.volume,
    marketCap: currentData?.marketCap ?? 'N/A',
  } : stock;

  if (!displayData) {
    return <div className="p-4 text-center">No data available</div>;
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className={compact ? "p-4" : "p-6"}>
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="font-bold text-lg">{displayData?.symbol ?? '-'}</h3>
            {!compact && (
              <p className="text-sm text-gray-600 dark:text-gray-400">{displayData.name}</p>
            )}
          </div>
          <div className="text-right">
            <div className="flex items-center justify-end gap-2">
              <p className="font-bold text-lg">{formatCurrency(displayData?.price ?? 0)}</p>
            </div>
            <div className={`flex items-center text-sm ${displayData.change >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
              {displayData?.change >= 0 ? (
                <TrendingUp className="w-3 h-3 mr-1" />
              ) : (
                <TrendingDown className="w-3 h-3 mr-1" />
              )}
              {displayData?.change >= 0 ? '+' : ''}{formatCurrency(displayData?.change ?? 0)} ({displayData?.changePercent >= 0 ? '+' : ''}{displayData?.changePercent?.toFixed(2) ?? 0}%)
            </div>
          </div>
        </div>

        {!compact && (
          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Volume:</span>
              <span>{formatVolume(displayData?.volume ?? 0)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Market Cap:</span>
              <span>{formatMarketCap(displayData?.marketCap)}</span>
            </div>
          </div>
        )}

        {predictionData && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-1">
                <Brain className="w-4 h-4 text-purple-600" />
                <span className="text-sm font-medium">AI Prediction</span>
              </div>
              {predictionLoading ? (
                <Loader className="w-4 h-4 animate-spin text-purple-600" />
              ) : predictionData?.prediction?.pred_pct ? (
                <Badge variant="outline" className={predictionData?.prediction?.pred_pct >= 0 ? 'text-green-600' : 'text-red-600'}>
                  <div className="flex items-center space-x-1">
                    {predictionData?.prediction?.pred_pct >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    <span className="capitalize">{predictionData?.prediction?.pred_pct >= 0 ? 'Up' : 'Down'} {Math.abs(predictionData?.prediction?.pred_pct ?? 0).toFixed(2)}%</span>
                  </div>
                </Badge>
              ) : null}
            </div>
            <div className="text-sm space-y-1">
              {predictionData?.currentPrice && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Current Price:</span>
                  <span className="font-medium">{formatCurrency(predictionData?.currentPrice ?? 0)}</span>
                </div>
              )}
              {predictionData?.prediction?.pred_pct && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Predicted Change:</span>
                  <span className={`font-medium ${predictionData?.prediction?.pred_pct >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {predictionData?.prediction?.pred_pct >= 0 ? '+' : ''}{predictionData?.prediction?.pred_pct?.toFixed(2)}%
                  </span>
                </div>
              )}
              {predictionData?.prediction?.confidence && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Confidence:</span>
                  <span className="font-medium">{Math.round((predictionData?.prediction?.confidence ?? 0) * 100)}%</span>
                </div>
              )}
              {predictionData?.recentChange && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Recent Change:</span>
                  <span className={`font-medium ${predictionData?.recentChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {predictionData?.recentChange >= 0 ? '+' : ''}{predictionData?.recentChange?.toFixed(2)}%
                  </span>
                </div>
              )}
              {predictionData?.fromCache !== undefined && (
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Cache Status:</span>
                  <span className={`font-medium ${predictionData?.fromCache ? 'text-blue-600' : 'text-green-600'}`}>
                    {predictionData?.isFresh ? '🟢 Fresh' : predictionData?.isStale ? '🟡 Stale (Refreshing)' : '⚪ New'}
                  </span>
                </div>
              )}
            </div>

            {!compact && predictionData?.prediction?.rationale && (
              <Collapsible open={showReasoning} onOpenChange={setShowReasoning}>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className="w-full mt-2 p-0 h-auto text-xs">
                    <div className="flex items-center space-x-1">
                      <Info className="w-3 h-3" />
                      <span>View AI Prediction Details</span>
                      {showReasoning ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </div>
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-2">
                  <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg text-xs space-y-2">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white mb-1">AI Analysis:</p>
                      <p className="text-gray-700 dark:text-gray-300">{predictionData?.prediction?.rationale || 'No reasoning available'}</p>
                    </div>
                    {/* {predictionData?.prediction?.evidence && Array.isArray(predictionData?.prediction?.evidence) && (
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white mb-1">Key Evidence:</p>
                        <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300">
                          {predictionData?.prediction?.evidence?.map((item: any, idx: number) => (
                            <li key={idx}>{item?.text || item?.signal || item?.type || 'Evidence point'}</li>
                          ))}
                        </ul>
                      </div>
                    )} */}
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
              onClick={() => onTrade(displayData.symbol, 'buy')}
            >
              Buy
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="flex-1 text-red-600 border-red-600 hover:bg-red-50"
              onClick={() => onTrade(displayData.symbol, 'sell')}
            >
              Sell
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};