import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useTradingContext } from '@/contexts/TradingContext';
import { Brain, TrendingUp, TrendingDown, Target, Zap, Info, Eye } from 'lucide-react';

export default function Analytics() {
  const { stocks } = useTradingContext();
  const [selectedStock, setSelectedStock] = useState<string | null>(null);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
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
      case 'up': return <TrendingUp className="w-4 h-4" />;
      case 'down': return <TrendingDown className="w-4 h-4" />;
      default: return <Brain className="w-4 h-4" />;
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-green-600';
    if (confidence >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const stocksWithPredictions = stocks.filter(stock => stock.prediction);
  const avgConfidence = stocksWithPredictions.reduce((sum, stock) => 
    sum + (stock.prediction?.confidence || 0), 0
  ) / stocksWithPredictions.length;

  const bullishPredictions = stocksWithPredictions.filter(stock => 
    stock.prediction?.direction === 'up'
  ).length;

  const bearishPredictions = stocksWithPredictions.filter(stock => 
    stock.prediction?.direction === 'down'
  ).length;

  const selectedStockData = selectedStock ? stocks.find(s => s.symbol === selectedStock) : null;

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

      {/* AI Overview Stats */}
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
            <div className={`text-2xl font-bold ${
              bullishPredictions > bearishPredictions ? 'text-green-600' : 'text-red-600'
            }`}>
              {bullishPredictions > bearishPredictions ? 'Bullish' : 'Bearish'}
            </div>
            <p className="text-xs text-muted-foreground">
              Overall market direction
            </p>
          </CardContent>
        </Card>
      </div>

      {/* AI Predictions Table */}
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
                  <th className="text-center py-3 px-4 font-medium text-gray-900 dark:text-white">Analysis</th>
                </tr>
              </thead>
              <tbody>
                {stocksWithPredictions.map((stock) => {
                  const prediction = stock.prediction!;
                  const potential = ((prediction.targetPrice - stock.price) / stock.price) * 100;
                  
                  return (
                    <tr key={stock.symbol} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="py-4 px-4">
                        <div>
                          <div className="font-medium">{stock.symbol}</div>
                          <div className="text-sm text-gray-500">{stock.name}</div>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-right font-medium">
                        {formatCurrency(stock.price)}
                      </td>
                      <td className="py-4 px-4 text-center">
                        <div className={`flex items-center justify-center space-x-1 ${getPredictionColor(prediction.direction)}`}>
                          {getPredictionIcon(prediction.direction)}
                          <span className="capitalize font-medium">{prediction.direction}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-right font-medium">
                        {formatCurrency(prediction.targetPrice)}
                      </td>
                      <td className={`py-4 px-4 text-right font-medium ${
                        potential >= 0 ? 'text-green-600' : 'text-red-600'
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
                      <td className="py-4 px-4 text-center">
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
                                  <p className="text-lg font-bold">{formatCurrency(stock.price)}</p>
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
                                  {prediction.reasoning}
                                </p>
                              </div>

                              <div>
                                <h4 className="font-medium mb-2 flex items-center space-x-2">
                                  <Target className="w-4 h-4" />
                                  <span>Key Factors Analyzed</span>
                                </h4>
                                <div className="grid grid-cols-1 gap-2">
                                  {prediction.factors.map((factor, index) => (
                                    <div key={index} className="flex items-center space-x-2 p-2 bg-gray-50 dark:bg-gray-800 rounded">
                                      <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
                                      <span className="text-sm">{factor}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              <div className="flex items-center justify-between p-3 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg">
                                <div className="flex items-center space-x-2">
                                  <div className={`flex items-center space-x-1 ${getPredictionColor(prediction.direction)}`}>
                                    {getPredictionIcon(prediction.direction)}
                                    <span className="font-medium capitalize">{prediction.direction}</span>
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
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* AI Insights */}
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
              {stocksWithPredictions
                .filter(stock => stock.prediction?.direction === 'up')
                .sort((a, b) => (b.prediction?.confidence || 0) - (a.prediction?.confidence || 0))
                .slice(0, 3)
                .map((stock) => {
                  const prediction = stock.prediction!;
                  const potential = ((prediction.targetPrice - stock.price) / stock.price) * 100;
                  
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
                        {prediction.reasoning.substring(0, 100)}...
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
              {stocksWithPredictions
                .filter(stock => stock.prediction?.direction === 'down')
                .sort((a, b) => (b.prediction?.confidence || 0) - (a.prediction?.confidence || 0))
                .slice(0, 3)
                .map((stock) => {
                  const prediction = stock.prediction!;
                  const potential = ((prediction.targetPrice - stock.price) / stock.price) * 100;
                  
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
                        {prediction.reasoning.substring(0, 100)}...
                      </p>
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}