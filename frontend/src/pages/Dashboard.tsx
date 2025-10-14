import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useTradingContext } from '@/contexts/TradingContext';
import { PortfolioChart } from '@/components/PortfolioChart';
import { StockCard } from '@/components/StockCard';
import { TrendingUp, TrendingDown, DollarSign, PieChart, Activity } from 'lucide-react';

export default function Dashboard() {
  const { currentAccount, stocks, isDemo } = useTradingContext();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const topStocks = stocks.slice(0, 4);
  const totalValue = currentAccount.balance + currentAccount.portfolioValue;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Trading Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Welcome back! Here's your portfolio overview.
          </p>
        </div>
        <Badge variant={isDemo ? "secondary" : "default"} className="text-sm">
          {isDemo ? "Demo Trading" : "Live Trading"}
        </Badge>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalValue)}</div>
            <p className="text-xs text-muted-foreground">
              Balance + Portfolio
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Cash</CardTitle>
            <PieChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(currentAccount.balance)}</div>
            <p className="text-xs text-muted-foreground">
              Ready to invest
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Portfolio Value</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(currentAccount.portfolioValue)}</div>
            <p className="text-xs text-muted-foreground">
              {currentAccount.positions.length} positions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Change</CardTitle>
            {currentAccount.dayChange >= 0 ? (
              <TrendingUp className="h-4 w-4 text-green-600" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-600" />
            )}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${
              currentAccount.dayChange >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {formatCurrency(currentAccount.dayChange)}
            </div>
            <p className="text-xs text-muted-foreground">
              {currentAccount.dayChangePercent >= 0 ? '+' : ''}{currentAccount.dayChangePercent.toFixed(2)}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Portfolio Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Portfolio Performance</CardTitle>
            <CardDescription>
              Your portfolio value over time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PortfolioChart />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Current Positions</CardTitle>
            <CardDescription>
              Your active stock holdings
            </CardDescription>
          </CardHeader>
          <CardContent>
            {currentAccount.positions.length === 0 ? (
              <div className="text-center py-6 text-gray-500">
                No positions yet. Start trading to see your holdings here.
              </div>
            ) : (
              <div className="space-y-3">
                {currentAccount.positions.map((position) => (
                  <div key={position.symbol} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div>
                      <p className="font-medium">{position.symbol}</p>
                      <p className="text-sm text-gray-500">{position.shares} shares</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatCurrency(position.totalValue)}</p>
                      <p className={`text-sm ${
                        position.gainLoss >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {position.gainLoss >= 0 ? '+' : ''}{formatCurrency(position.gainLoss)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Stocks */}
      <Card>
        <CardHeader>
          <CardTitle>Market Overview</CardTitle>
          <CardDescription>
            Top performing stocks with AI predictions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {topStocks.map((stock) => (
              <StockCard key={stock.symbol} stock={stock} compact />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}