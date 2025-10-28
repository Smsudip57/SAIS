import React, { useState, useContext, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Brain, TrendingUp, TrendingDown, Target, Zap, Info, Eye, Loader } from 'lucide-react';
import { useGetStocksPredictionsQuery } from '../../Redux/Api/tradingApi/Trading';
import { StockStreamContext } from '@/contexts/StockStreamContextValue';

export default function Analytics() {
  const [selectedStock, setSelectedStock] = useState<string | null>(null);

  // Fetch stock predictions from backend
  const { data: predictionsData, isLoading: predictionsLoading } = useGetStocksPredictionsQuery(undefined);

  // Get real-time stock prices from socket stream
  const stockStreamContext = useContext(StockStreamContext);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getPredictionColor = (value: number | null) => {
    if (!value) return 'text-gray-600';
    if (value > 0) return 'text-green-600';
    return 'text-red-600';
  };

  const getPredictionIcon = (value: number | null) => {
    if (!value) return <Brain className="w-4 h-4" />;
    if (value > 0) return <TrendingUp className="w-4 h-4" />;
    return <TrendingDown className="w-4 h-4" />;
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-green-600';
    if (confidence >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  // Process predictions data
  const processedPredictions = useMemo(() => {
    const stockData = stockStreamContext?.stockData || {};

    if (!predictionsData?.data) return [];

    return Object.entries(predictionsData.data)
      .filter(([_, prediction]: [string, any]) => prediction !== null)
      .map(([symbol, prediction]: [string, any]) => {
        const streamData = stockData[symbol];
        const currentPrice = streamData?.currentData?.price || prediction.currentPrice || 0;
        const pred = prediction.prediction || {};
        const predictedChange = pred.pred_pct || 0;
        const targetPrice = currentPrice * (1 + predictedChange / 100);
        const confidence = Math.round((pred.confidence || 0) * 100);

        return {
          symbol,
          currentPrice,
          recentChange: prediction.recentChange || 0,
          prediction: {
            predictedChange,
            targetPrice,
            confidence,
            rationale: pred.rationale || 'No rationale available',
            evidence: pred.evidence || [],
          },
        };
      });
  }, [predictionsData?.data, stockStreamContext?.stockData]);

  const bullishPredictions = processedPredictions.filter(
    (stock) => stock.prediction.predictedChange > 0
  ).length;

  const bearishPredictions = processedPredictions.filter(
    (stock) => stock.prediction.predictedChange < 0
  ).length;

  const avgConfidence =
    processedPredictions.length > 0
      ? processedPredictions.reduce((sum, stock) => sum + stock.prediction.confidence, 0) /
      processedPredictions.length
      : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            AI Analytics & Predictions
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Advanced market analysis powered by artificial intelligence
          </p>
        </div>
        <Badge variant="outline" className="text-purple-600 border-purple-600">
          <Brain className="w-4 h-4 mr-1" />
          AI Powered
        </Badge>
      </div>

      {/* Loading State */}
      {predictionsLoading && (
        <>
          {/* Skeleton Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-4" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-20 mb-2" />
                  <Skeleton className="h-2 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Skeleton Predictions Table */}
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48 mb-2" />
              <Skeleton className="h-4 w-64" />
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-3 px-4"><Skeleton className="h-4 w-16" /></th>
                      <th className="text-right py-3 px-4"><Skeleton className="h-4 w-20 ml-auto" /></th>
                      <th className="text-center py-3 px-4"><Skeleton className="h-4 w-20 mx-auto" /></th>
                      <th className="text-right py-3 px-4"><Skeleton className="h-4 w-20 ml-auto" /></th>
                      <th className="text-right py-3 px-4"><Skeleton className="h-4 w-16 ml-auto" /></th>
                      <th className="text-center py-3 px-4"><Skeleton className="h-4 w-16 mx-auto" /></th>
                      <th className="text-center py-3 px-4"><Skeleton className="h-4 w-16 mx-auto" /></th>
                    </tr>
                  </thead>
                  <tbody>
                    {[1, 2, 3, 4, 5].map((i) => (
                      <tr key={i} className="border-b border-gray-100 dark:border-gray-800">
                        <td className="py-4 px-4"><Skeleton className="h-4 w-12" /></td>
                        <td className="py-4 px-4 text-right"><Skeleton className="h-4 w-24 ml-auto" /></td>
                        <td className="py-4 px-4 text-center"><Skeleton className="h-4 w-16 mx-auto" /></td>
                        <td className="py-4 px-4 text-right"><Skeleton className="h-4 w-24 ml-auto" /></td>
                        <td className="py-4 px-4 text-right"><Skeleton className="h-4 w-16 ml-auto" /></td>
                        <td className="py-4 px-4 text-center"><Skeleton className="h-4 w-12 mx-auto" /></td>
                        <td className="py-4 px-4 text-center"><Skeleton className="h-9 w-16 mx-auto" /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Skeleton Insights Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[1, 2].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-40 mb-2" />
                  <Skeleton className="h-4 w-56" />
                </CardHeader>
                <CardContent className="space-y-4">
                  {[1, 2, 3].map((j) => (
                    <div key={j} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg space-y-2">
                      <div className="flex justify-between">
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-4 w-20" />
                      </div>
                      <Skeleton className="h-3 w-full" />
                      <Skeleton className="h-3 w-3/4" />
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

      {/* AI Overview Stats */}
      {!predictionsLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Confidence</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{avgConfidence.toFixed(1)}%</div>
              <Progress value={avgConfidence} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Bullish Signals</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{bullishPredictions}</div>
              <p className="text-xs text-muted-foreground">
                Stocks with upward predictions
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Bearish Signals</CardTitle>
              <TrendingDown className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{bearishPredictions}</div>
              <p className="text-xs text-muted-foreground">
                Stocks with downward predictions
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Market Sentiment</CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${bullishPredictions > bearishPredictions ? 'text-green-600' : 'text-red-600'
                }`}>
                {bullishPredictions > bearishPredictions ? 'Bullish' : 'Bearish'}
              </div>
              <p className="text-xs text-muted-foreground">
                Overall market direction
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* AI Predictions Table */}
      {!predictionsLoading && (
        <Card>
          <CardHeader>
            <CardTitle>AI Stock Predictions with Detailed Analysis</CardTitle>
            <CardDescription>
              Machine learning-powered price predictions with comprehensive reasoning
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Stock</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-900 dark:text-white">Current Price</th>
                    <th className="text-center py-3 px-4 font-medium text-gray-900 dark:text-white">Prediction</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-900 dark:text-white">Target Price</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-900 dark:text-white">Potential</th>
                    <th className="text-center py-3 px-4 font-medium text-gray-900 dark:text-white">Confidence</th>
                    {/* <th className="text-center py-3 px-4 font-medium text-gray-900 dark:text-white">Analysis</th> */}
                  </tr>
                </thead>
                <tbody>
                  {processedPredictions.map((stock) => {
                    const prediction = stock.prediction;
                    const potential = ((prediction.targetPrice - stock.currentPrice) / stock.currentPrice) * 100;

                    return (
                      <tr key={stock.symbol} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="py-4 px-4">
                          <div className="font-medium">{stock.symbol}</div>
                        </td>
                        <td className="py-4 px-4 text-right font-medium">
                          {formatCurrency(stock.currentPrice)}
                        </td>
                        <td className="py-4 px-4 text-center">
                          <div className={`flex items-center justify-center space-x-1 ${getPredictionColor(prediction.predictedChange)}`}>
                            {getPredictionIcon(prediction.predictedChange)}
                            <span className="font-medium">{prediction.predictedChange >= 0 ? '+' : ''}{prediction.predictedChange.toFixed(1)}%</span>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-right font-medium">
                          {formatCurrency(prediction.targetPrice)}
                        </td>
                        <td className={`py-4 px-4 text-right font-medium ${potential >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                          {potential >= 0 ? '+' : ''}{potential.toFixed(1)}%
                        </td>
                        <td className="py-4 px-4 text-center">
                          <div className="flex items-center justify-center space-x-2">
                            <span className={`font-medium ${getConfidenceColor(prediction.confidence)}`}>
                              {prediction.confidence}%
                            </span>
                            <Progress value={prediction.confidence} className="w-16" />
                          </div>
                        </td>
                        {/* <td className="py-4 px-4 text-center">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedStock(stock.symbol)}
                              >
                                <Eye className="w-4 h-4 mr-1" />
                                View
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle className="flex items-center space-x-2">
                                  <Brain className="w-5 h-5 text-purple-600" />
                                  <span>AI Analysis for {stock.symbol}</span>
                                </DialogTitle>
                                <DialogDescription>
                                  Detailed reasoning behind the AI prediction
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                                    <p className="text-sm text-gray-600 dark:text-gray-400">Current Price</p>
                                    <p className="text-lg font-bold">{formatCurrency(stock.currentPrice)}</p>
                                  </div>
                                  <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                                    <p className="text-sm text-gray-600 dark:text-gray-400">Target Price</p>
                                    <p className="text-lg font-bold">{formatCurrency(prediction.targetPrice)}</p>
                                  </div>
                                </div>

                                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                                  <div className="flex items-center space-x-2 mb-2">
                                    <Info className="w-4 h-4 text-blue-600" />
                                    <h4 className="font-medium text-blue-900 dark:text-blue-100">AI Reasoning</h4>
                                  </div>
                                  <p className="text-sm text-blue-800 dark:text-blue-200">
                                    {prediction.rationale}
                                  </p>
                                </div>

                                <div>
                                  <h4 className="font-medium mb-2 flex items-center space-x-2">
                                    <Target className="w-4 h-4" />
                                    <span>Supporting Evidence</span>
                                  </h4>
                                  <div className="grid grid-cols-1 gap-2">
                                    {prediction.evidence && prediction.evidence.length > 0 ? (
                                      prediction.evidence.map((evidence, index) => (
                                        <div key={index} className="flex items-start space-x-2 p-2 bg-gray-50 dark:bg-gray-800 rounded">
                                          <div className="w-2 h-2 bg-purple-600 rounded-full mt-1"></div>
                                          <span className="text-sm">{evidence}</span>
                                        </div>
                                      ))
                                    ) : (
                                      <div className="flex items-center space-x-2 p-2 bg-gray-50 dark:bg-gray-800 rounded text-gray-500">
                                        <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                                        <span className="text-sm">No evidence details available</span>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                <div className="flex items-center justify-between p-3 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg">
                                  <div className="flex items-center space-x-2">
                                    <div className={`flex items-center space-x-1 ${getPredictionColor(prediction.predictedChange)}`}>
                                      {getPredictionIcon(prediction.predictedChange)}
                                      <span className="font-medium">{prediction.predictedChange >= 0 ? '+' : ''}{prediction.predictedChange.toFixed(1)}%</span>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-sm text-gray-600 dark:text-gray-400">Confidence</p>
                                    <p className={`font-bold ${getConfidenceColor(prediction.confidence)}`}>
                                      {prediction.confidence}%
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </td> */}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* AI Insights */}
      {!predictionsLoading && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Top AI Recommendations</CardTitle>
              <CardDescription>
                Highest confidence predictions for potential gains
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {processedPredictions
                  .filter(stock => stock.prediction.predictedChange > 0)
                  .sort((a, b) => b.prediction.confidence - a.prediction.confidence)
                  .slice(0, 3)
                  .map((stock) => {
                    const prediction = stock.prediction;
                    const potential = ((prediction.targetPrice - stock.currentPrice) / stock.currentPrice) * 100;

                    return (
                      <div key={stock.symbol} className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <p className="font-medium">{stock.symbol}</p>
                            <p className="text-sm text-gray-600">+{potential.toFixed(1)}% potential</p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-green-600">{prediction.confidence}%</p>
                            <p className="text-sm text-gray-500">confidence</p>
                          </div>
                        </div>
                        <p className="text-xs text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 p-2 rounded">
                          {prediction.rationale.substring(0, 100)}...
                        </p>
                      </div>
                    );
                  })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Risk Alerts</CardTitle>
              <CardDescription>
                Stocks with bearish predictions to watch
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {processedPredictions
                  .filter(stock => stock.prediction.predictedChange < 0)
                  .sort((a, b) => b.prediction.confidence - a.prediction.confidence)
                  .slice(0, 3)
                  .map((stock) => {
                    const prediction = stock.prediction;
                    const potential = ((prediction.targetPrice - stock.currentPrice) / stock.currentPrice) * 100;

                    return (
                      <div key={stock.symbol} className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <p className="font-medium">{stock.symbol}</p>
                            <p className="text-sm text-gray-600">{potential.toFixed(1)}% potential decline</p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-red-600">{prediction.confidence}%</p>
                            <p className="text-sm text-gray-500">confidence</p>
                          </div>
                        </div>
                        <p className="text-xs text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 p-2 rounded">
                          {prediction.rationale.substring(0, 100)}...
                        </p>
                      </div>
                    );
                  })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}