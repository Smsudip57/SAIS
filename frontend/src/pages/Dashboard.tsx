import React, { useEffect, useMemo, useContext } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { PortfolioChart } from '@/components/PortfolioChart';
import { StockCard } from '@/components/StockCard';
import { TrendingUp, TrendingDown, DollarSign, PieChart, Activity } from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../Redux/store';
import { useGetPositionsQuery } from '../../Redux/Api/tradingApi/Trading';
import { StockStreamContext } from '@/contexts/StockStreamContextValue';
import { useTranslation } from 'react-i18next';
import { formatCurrency } from '@/config/translations/formatters';

export default function Dashboard() {
  const dispatch = useDispatch();
  const { t } = useTranslation();

  // Get trading state from Redux
  const { accounts, currentAccountType, positions } = useSelector(
    (state: RootState) => state.trading
  );

  // Get real-time stock prices from socket stream
  const stockStreamContext = useContext(StockStreamContext);

  // Fetch positions for current account
  const { data: positionsData, isLoading: positionsLoading, refetch } = useGetPositionsQuery(
    { accountType: currentAccountType },
    { skip: !currentAccountType }
  );

  // Refetch positions when account type changes
  useEffect(() => {
    if (currentAccountType) {
      refetch();
    }
  }, [currentAccountType, refetch]);

  // Get current account based on selected type
  const currentAccount = accounts?.[currentAccountType as keyof typeof accounts];

  // Top stock symbols to display
  const topStockSymbols = ['AAPL', 'GOOGL', 'MSFT', 'TSLA'];
  const isDemo = currentAccountType === 'demo';

  // Calculate real-time portfolio value and gains using streamed prices
  const portfolioMetrics = useMemo(() => {
    if (!positions || positions.length === 0) {
      return {
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
      portfolioValue: totalCurrentValue,
      totalGainLoss,
      totalGainLossPercent,
    };
  }, [positions, stockStreamContext?.stockData]);

  const topStocks = topStockSymbols.slice(0, 4);
  const totalValue = (currentAccount?.balance ?? 0) + portfolioMetrics.portfolioValue;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {t('dashboard.title')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {t('dashboard.totalValue')}
          </p>
        </div>
        <Badge variant={isDemo ? "secondary" : "default"} className="text-sm">
          {isDemo ? t('header.accountMode') : t('header.realAccount')}
        </Badge>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Value Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('dashboard.totalValue')}</CardTitle>
            {!currentAccount ? <Skeleton className="h-4 w-4" /> : <DollarSign className="h-4 w-4 text-muted-foreground" />}
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
                <p className="text-xs text-muted-foreground">{t('header.balance')} + {t('header.portfolio')}</p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Available Cash Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('dashboard.availableCash')}</CardTitle>
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
                <div className="text-2xl font-bold">{formatCurrency(currentAccount?.balance ?? 0)}</div>
                <p className="text-xs text-muted-foreground">{t('dashboard.totalInvested')}</p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Portfolio Value Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('header.portfolio')}</CardTitle>
            {!currentAccount ? <Skeleton className="h-4 w-4" /> : <Activity className="h-4 w-4 text-muted-foreground" />}
          </CardHeader>
          <CardContent>
            {!currentAccount ? (
              <>
                <Skeleton className="h-8 w-32 mb-2" />
                <Skeleton className="h-3 w-24" />
              </>
            ) : (
              <>
                <div className="text-2xl font-bold">{formatCurrency(portfolioMetrics.portfolioValue)}</div>
                <p className="text-xs text-muted-foreground">{positions?.length ?? 0} {t('portfolio.holdings')}</p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Today's Change Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('dashboard.dayChange')}</CardTitle>
            {!currentAccount ? (
              <Skeleton className="h-4 w-4" />
            ) : (currentAccount?.dayChange ?? 0) >= 0 ? (
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
                <div className={`text-2xl font-bold ${(currentAccount?.dayChange ?? 0) >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                  {formatCurrency(currentAccount?.dayChange ?? 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {(currentAccount?.dayChangePercent ?? 0) >= 0 ? '+' : ''}{(currentAccount?.dayChangePercent ?? 0).toFixed(2)}%
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Portfolio Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{t('dashboard.portfolioPerformance')}</CardTitle>
            <CardDescription>{t('dashboard.last30Days')}</CardDescription>
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

        <Card>
          <CardHeader>
            <CardTitle>{t('portfolio.holdings')}</CardTitle>
            <CardDescription>{t('portfolio.description')}</CardDescription>
          </CardHeader>
          <CardContent>
            {positionsLoading || !currentAccount ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-3 w-40" />
                    </div>
                    <div className="text-right space-y-2">
                      <Skeleton className="h-4 w-24 ml-auto" />
                      <Skeleton className="h-3 w-20 ml-auto" />
                    </div>
                  </div>
                ))}
              </div>
            ) : !positions || positions.length === 0 ? (
              <div className="text-center py-6 text-gray-500">
                {t('dashboard.noPositions')}
              </div>
            ) : (
              <div className="space-y-3">
                {positions?.map((position) => {
                  // Get real-time price from socket stream
                  const streamData = stockStreamContext?.stockData[position.symbol];
                  const currentPrice = streamData?.currentData?.price || position.currentPrice || 0;

                  // Calculate real-time values
                  const realTimeValue = position.shares * currentPrice;
                  const costBasis = position.shares * position.avgBuyPrice;
                  const realTimeGainLoss = realTimeValue - costBasis;

                  return (
                    <div key={position?.symbol} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div>
                        <p className="font-medium">{position?.symbol}</p>
                        <p className="text-sm text-gray-500">{position?.shares ?? 0} shares @ AVR ${position?.avgBuyPrice.toFixed(2)}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatCurrency(realTimeValue)}</p>
                        <p className={`text-sm ${realTimeGainLoss >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                          {realTimeGainLoss >= 0 ? '+' : ''}{formatCurrency(realTimeGainLoss)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Stocks */}
      <Card>
        <CardHeader>
          <CardTitle>Market Overview</CardTitle>
          <CardDescription>Top performing stocks with AI predictions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {!currentAccount
              ? [1, 2, 3, 4].map((i) => (
                <div key={i} className="space-y-3 p-4 border rounded-lg">
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-8 w-24" />
                  <Skeleton className="h-4 w-20" />
                  <div className="space-y-2 mt-4">
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-3/4" />
                    <Skeleton className="h-3 w-full" />
                  </div>
                </div>
              ))
              : topStocks?.map((symbol) => (
                <StockCard key={symbol} symbol={symbol} compact />
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}