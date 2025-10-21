import React, { useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PortfolioChart } from '@/components/PortfolioChart';
import { StockCard } from '@/components/StockCard';
import { TrendingUp, TrendingDown, DollarSign, PieChart, Activity } from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../Redux/store';
import { useGetPositionsQuery } from '../../Redux/Api/tradingApi/Trading';

export default function Dashboard() {
  const dispatch = useDispatch();

  // Get trading state from Redux
  const { accounts, currentAccountType, positions } = useSelector(
    (state: RootState) => state.trading
  );

  // Fetch positions for current account
  const { data: positionsData, isLoading: positionsLoading } = useGetPositionsQuery(
    { accountType: currentAccountType },
    { skip: !currentAccountType }
  );

  // Get current account based on selected type
  const currentAccount = accounts?.[currentAccountType as keyof typeof accounts];

  // Top stock symbols to display
  const topStockSymbols = ['AAPL', 'GOOGL', 'MSFT', 'TSLA'];
  const isDemo = currentAccountType === 'demo';

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const topStocks = topStockSymbols.slice(0, 4);
  const totalValue = (currentAccount?.balance ?? 0) + (currentAccount?.portfolioValue ?? 0);

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
            <div className="text-2xl font-bold">{formatCurrency(currentAccount?.balance ?? 0)}</div>
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
            <div className="text-2xl font-bold">{formatCurrency(currentAccount?.portfolioValue ?? 0)}</div>
            <p className="text-xs text-muted-foreground">
              {positions?.length ?? 0} positions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Change</CardTitle>
            {(currentAccount?.dayChange ?? 0) >= 0 ? (
              <TrendingUp className="h-4 w-4 text-green-600" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-600" />
            )}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${(currentAccount?.dayChange ?? 0) >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
              {formatCurrency(currentAccount?.dayChange ?? 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              {(currentAccount?.dayChangePercent ?? 0) >= 0 ? '+' : ''}{(currentAccount?.dayChangePercent ?? 0).toFixed(2)}%
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
            {positionsLoading ? (
              <div className="text-center py-6 text-gray-500">
                Loading positions...
              </div>
            ) : !positions || positions.length === 0 ? (
              <div className="text-center py-6 text-gray-500">
                No positions yet. Start trading to see your holdings here.
              </div>
            ) : (
              <div className="space-y-3">
                {positions?.map((position) => (
                  <div key={position?.symbol} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div>
                      <p className="font-medium">{position?.symbol}</p>
                      <p className="text-sm text-gray-500">{position?.shares ?? 0} shares</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatCurrency(position?.totalValue ?? 0)}</p>
                      <p className={`text-sm ${(position?.gainLoss ?? 0) >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                        {(position?.gainLoss ?? 0) >= 0 ? '+' : ''}{formatCurrency(position?.gainLoss ?? 0)}
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
            {topStocks?.map((symbol) => (
              <StockCard key={symbol} symbol={symbol} compact />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}