import React, { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PortfolioChart } from '@/components/PortfolioChart';
import { TrendingUp, TrendingDown, PieChart, BarChart3 } from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../Redux/store';
import { useGetPositionsQuery } from '../../Redux/Api/tradingApi/Trading';

export default function Portfolio() {
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
  const isDemo = currentAccountType === 'demo';

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const totalValue = (currentAccount?.balance ?? 0) + (currentAccount?.portfolioValue ?? 0);
  const totalInvested = useMemo(() =>
    (positions || []).reduce((sum, pos) => sum + (pos.shares * pos.avgBuyPrice), 0),
    [positions]
  );
  const totalGainLoss = useMemo(() =>
    (positions || []).reduce((sum, pos) => sum + pos.gainLoss, 0),
    [positions]
  );
  const totalGainLossPercent = totalInvested > 0 ? (totalGainLoss / totalInvested) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Portfolio Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Track your investments and portfolio performance
          </p>
        </div>
        <Badge variant={isDemo ? "secondary" : "default"}>
          {isDemo ? "Demo Portfolio" : "Live Portfolio"}
        </Badge>
      </div>

      {/* Portfolio Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Portfolio Value</CardTitle>
            <PieChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalValue)}</div>
            <p className="text-xs text-muted-foreground">
              Cash + Investments
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Invested Amount</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalInvested)}</div>
            <p className="text-xs text-muted-foreground">
              Total cost basis
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Gain/Loss</CardTitle>
            {totalGainLoss >= 0 ? (
              <TrendingUp className="h-4 w-4 text-green-600" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-600" />
            )}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${totalGainLoss >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
              {totalGainLoss >= 0 ? '+' : ''}{formatCurrency(totalGainLoss)}
            </div>
            <p className={`text-xs ${totalGainLoss >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
              {totalGainLossPercent >= 0 ? '+' : ''}{totalGainLossPercent.toFixed(2)}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Cash</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(currentAccount?.balance ?? 0)}</div>
            <p className="text-xs text-muted-foreground">
              Ready to invest
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Portfolio Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Portfolio Performance</CardTitle>
          <CardDescription>
            Your portfolio value over the last 30 days
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PortfolioChart />
        </CardContent>
      </Card>

      {/* Holdings Table */}
      <Card>
        <CardHeader>
          <CardTitle>Current Holdings</CardTitle>
          <CardDescription>
            Detailed view of your stock positions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {positionsLoading ? (
            <div className="text-center py-12">
              <p className="text-gray-600">Loading positions...</p>
            </div>
          ) : !positions || positions.length === 0 ? (
            <div className="text-center py-12">
              <PieChart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No positions yet
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Start trading to build your portfolio
              </p>
              <Button>
                Start Trading
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Symbol</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-900 dark:text-white">Shares</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-900 dark:text-white">Avg Price</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-900 dark:text-white">Current Price</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-900 dark:text-white">Market Value</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-900 dark:text-white">Gain/Loss</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-900 dark:text-white">%</th>
                  </tr>
                </thead>
                <tbody>
                  {positions?.map((position) => (
                    <tr key={position?.symbol} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="py-4 px-4">
                        <div className="font-medium">{position?.symbol}</div>
                      </td>
                      <td className="py-4 px-4 text-right">{position?.shares ?? 0}</td>
                      <td className="py-4 px-4 text-right">{formatCurrency(position?.avgBuyPrice ?? 0)}</td>
                      <td className="py-4 px-4 text-right">{formatCurrency(position?.currentPrice ?? 0)}</td>
                      <td className="py-4 px-4 text-right font-medium">{formatCurrency(position?.totalValue ?? 0)}</td>
                      <td className={`py-4 px-4 text-right font-medium ${(position?.gainLoss ?? 0) >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                        {(position?.gainLoss ?? 0) >= 0 ? '+' : ''}{formatCurrency(position?.gainLoss ?? 0)}
                      </td>
                      <td className={`py-4 px-4 text-right font-medium ${(position?.gainLossPercent ?? 0) >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                        {(position?.gainLossPercent ?? 0) >= 0 ? '+' : ''}{(position?.gainLossPercent ?? 0).toFixed(2)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}