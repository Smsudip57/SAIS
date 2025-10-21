import React, { useMemo, useContext } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { PortfolioChart } from '@/components/PortfolioChart';
import { TrendingUp, TrendingDown, PieChart, BarChart3 } from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../Redux/store';
import { useGetPositionsQuery } from '../../Redux/Api/tradingApi/Trading';
import { StockStreamContext } from '@/contexts/StockStreamContextValue';

export default function Portfolio() {
  const dispatch = useDispatch();

  // Get trading state from Redux
  const { accounts, currentAccountType, positions } = useSelector(
    (state: RootState) => state.trading
  );

  // Get real-time stock prices from socket stream
  const stockStreamContext = useContext(StockStreamContext);

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

  // Calculate real-time portfolio metrics using streamed prices
  const portfolioMetrics = useMemo(() => {
    if (!positions || positions.length === 0) {
      return {
        totalInvested: 0,
        portfolioValue: 0,
        totalGainLoss: 0,
        totalGainLossPercent: 0,
      };
    }

    let totalCurrentValue = 0;
    let totalCostBasis = 0;

    positions.forEach((position) => {
      // Get real-time price from socket stream, fallback to position's current price
      const streamData = stockStreamContext?.stockData[position.symbol];
      const currentPrice = streamData?.currentData?.price || position.currentPrice || 0;

      // Calculate current value based on streamed price
      const currentValue = position.shares * currentPrice;
      const costBasis = position.shares * position.avgBuyPrice;

      totalCurrentValue += currentValue;
      totalCostBasis += costBasis;
    });

    const totalGainLoss = totalCurrentValue - totalCostBasis;
    const totalGainLossPercent = totalCostBasis > 0 ? (totalGainLoss / totalCostBasis) * 100 : 0;

    return {
      totalInvested: totalCostBasis,
      portfolioValue: totalCurrentValue,
      totalGainLoss,
      totalGainLossPercent,
    };
  }, [positions, stockStreamContext?.stockData]);

  const totalValue = (currentAccount?.balance ?? 0) + portfolioMetrics.portfolioValue;

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
        {/* Total Portfolio Value Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Portfolio Value</CardTitle>
            {!currentAccount ? <Skeleton className="h-4 w-4" /> : <PieChart className="h-4 w-4 text-muted-foreground" />}
          </CardHeader>
          <CardContent>
            {!currentAccount ? (
              <>
                <Skeleton className="h-8 w-32 mb-2" />
                <Skeleton className="h-3 w-24" />
              </>
            ) : (
              <>
                <div className="text-2xl font-bold">{formatCurrency(totalValue)}</div>
                <p className="text-xs text-muted-foreground">Cash + Investments</p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Invested Amount Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Invested Amount</CardTitle>
            {!currentAccount ? <Skeleton className="h-4 w-4" /> : <BarChart3 className="h-4 w-4 text-muted-foreground" />}
          </CardHeader>
          <CardContent>
            {!currentAccount ? (
              <>
                <Skeleton className="h-8 w-32 mb-2" />
                <Skeleton className="h-3 w-24" />
              </>
            ) : (
              <>
                <div className="text-2xl font-bold">{formatCurrency(portfolioMetrics.totalInvested)}</div>
                <p className="text-xs text-muted-foreground">Total cost basis</p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Total Gain/Loss Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Gain/Loss</CardTitle>
            {!currentAccount ? (
              <Skeleton className="h-4 w-4" />
            ) : portfolioMetrics.totalGainLoss >= 0 ? (
              <TrendingUp className="h-4 w-4 text-green-600" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-600" />
            )}
          </CardHeader>
          <CardContent>
            {!currentAccount ? (
              <>
                <Skeleton className="h-8 w-32 mb-2" />
                <Skeleton className="h-3 w-24" />
              </>
            ) : (
              <>
                <div className={`text-2xl font-bold ${portfolioMetrics.totalGainLoss >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                  {portfolioMetrics.totalGainLoss >= 0 ? '+' : ''}{formatCurrency(portfolioMetrics.totalGainLoss)}
                </div>
                <p className={`text-xs ${portfolioMetrics.totalGainLoss >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                  {portfolioMetrics.totalGainLossPercent >= 0 ? '+' : ''}{portfolioMetrics.totalGainLossPercent.toFixed(2)}%
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Available Cash Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Cash</CardTitle>
            {!currentAccount ? <Skeleton className="h-4 w-4" /> : <TrendingUp className="h-4 w-4 text-muted-foreground" />}
          </CardHeader>
          <CardContent>
            {!currentAccount ? (
              <>
                <Skeleton className="h-8 w-32 mb-2" />
                <Skeleton className="h-3 w-24" />
              </>
            ) : (
              <>
                <div className="text-2xl font-bold">{formatCurrency(currentAccount?.balance ?? 0)}</div>
                <p className="text-xs text-muted-foreground">Ready to invest</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Portfolio Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Portfolio Performance</CardTitle>
          <CardDescription>Your portfolio value over the last 30 days</CardDescription>
        </CardHeader>
        <CardContent>
          {!currentAccount ? (
            <div className="space-y-3">
              <Skeleton className="h-64 w-full" />
            </div>
          ) : (
            <PortfolioChart />
          )}
        </CardContent>
      </Card>

      {/* Holdings Table */}
      <Card>
        <CardHeader>
          <CardTitle>Current Holdings</CardTitle>
          <CardDescription>Detailed view of your stock positions</CardDescription>
        </CardHeader>
        <CardContent>
          {positionsLoading || !currentAccount ? (
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
                  {[1, 2, 3].map((i) => (
                    <tr key={i} className="border-b border-gray-100 dark:border-gray-800">
                      <td className="py-4 px-4"><Skeleton className="h-4 w-16" /></td>
                      <td className="py-4 px-4 text-right"><Skeleton className="h-4 w-12 ml-auto" /></td>
                      <td className="py-4 px-4 text-right"><Skeleton className="h-4 w-20 ml-auto" /></td>
                      <td className="py-4 px-4 text-right"><Skeleton className="h-4 w-20 ml-auto" /></td>
                      <td className="py-4 px-4 text-right"><Skeleton className="h-4 w-20 ml-auto" /></td>
                      <td className="py-4 px-4 text-right"><Skeleton className="h-4 w-20 ml-auto" /></td>
                      <td className="py-4 px-4 text-right"><Skeleton className="h-4 w-16 ml-auto" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
                  {positions?.map((position) => {
                    // Get real-time price from socket stream
                    const streamData = stockStreamContext?.stockData[position.symbol];
                    const currentPrice = streamData?.currentData?.price || position.currentPrice || 0;

                    // Calculate real-time values
                    const realTimeValue = position.shares * currentPrice;
                    const costBasis = position.shares * position.avgBuyPrice;
                    const realTimeGainLoss = realTimeValue - costBasis;
                    const realTimeGainLossPercent = costBasis > 0 ? (realTimeGainLoss / costBasis) * 100 : 0;

                    return (
                      <tr key={position?.symbol} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="py-4 px-4">
                          <div className="font-medium">{position?.symbol}</div>
                        </td>
                        <td className="py-4 px-4 text-right">{position?.shares ?? 0}</td>
                        <td className="py-4 px-4 text-right">{formatCurrency(position?.avgBuyPrice ?? 0)}</td>
                        <td className="py-4 px-4 text-right">{formatCurrency(currentPrice)}</td>
                        <td className="py-4 px-4 text-right font-medium">{formatCurrency(realTimeValue)}</td>
                        <td className={`py-4 px-4 text-right font-medium ${realTimeGainLoss >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                          {realTimeGainLoss >= 0 ? '+' : ''}{formatCurrency(realTimeGainLoss)}
                        </td>
                        <td className={`py-4 px-4 text-right font-medium ${realTimeGainLossPercent >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                          {realTimeGainLossPercent >= 0 ? '+' : ''}{realTimeGainLossPercent.toFixed(2)}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}