import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TrendingUp, TrendingDown, Loader } from 'lucide-react';
import { toast } from 'sonner';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { format } from 'date-fns';
import { useSharedStockStream } from '@/hooks/useSharedStockStream';
import { useBuyStockMutation, useSellStockMutation, useGetAccountQuery, useGetPositionsQuery } from '../../Redux/Api/tradingApi/Trading';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { formatCurrency as formatCurrencyUtil } from '@/config/translations/formatters';

interface DailyPriceData {
  date: string;
  timestamp: number;
  price: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface TradingModalProps {
  symbol: string;
  action: 'buy' | 'sell';
  onClose: () => void;
}

// Helper function to prepare 1-day chart data from historical data (30 days daily)
const prepareDailyChartData = (historicalData: any[]): DailyPriceData[] => {
  if (!historicalData || historicalData.length === 0) return [];

  // Convert all historical data to proper format
  const dailyData = historicalData.map((point) => ({
    date: format(new Date(point.timestamp), 'dd MMM'),
    timestamp: new Date(point.timestamp).getTime(),
    price: Number(point.close || point.price || 0),
    open: Number(point.open || point.price || 0),
    high: Number(point.high || point.price || 0),
    low: Number(point.low || point.price || 0),
    close: Number(point.close || point.price || 0),
    volume: Number(point.volume || 0),
  }));

  // Return last 22 days of data for the 1-day chart
  return dailyData.slice(-22); // Last 22 days
};

// 1-Day Price Chart component showing 30 days of daily progression
const OneDayChart = ({ data, isPositive }: { data: DailyPriceData[]; isPositive: boolean }) => {
  if (data.length === 0) return null;

  const chartMin = Math.min(...data.map(d => d.low));
  const chartMax = Math.max(...data.map(d => d.high));
  const priceRange = chartMax - chartMin || chartMax * 0.1;
  const yAxisMin = Math.max(0, chartMin - priceRange * 0.1);
  const yAxisMax = chartMax + priceRange * 0.1;

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart
        data={data}
        margin={{ top: 5, right: 15, left: 0, bottom: -15 }}
      >
        <defs>
          <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={isPositive ? '#10b981' : '#ef4444'} stopOpacity={0.4} />
            <stop offset="100%" stopColor={isPositive ? '#10b981' : '#ef4444'} stopOpacity={0.05} />
          </linearGradient>
        </defs>

        <CartesianGrid strokeDasharray="2 2" stroke="#e5e7eb" vertical={false} strokeOpacity={0.4} />

        <XAxis
          dataKey="date"
          tick={(props) => {
            const { x, y, payload, index } = props;
            // Hide the first X-axis label
            if (index === 0) {
              return null;
            }
            return (
              <text x={x} y={y} textAnchor="middle" fill="#374151" fontSize={10}>
                {payload.value}
              </text>
            );
          }}
          stroke="#d1d5db"
          axisLine={false}
          tickLine={false}
          interval={Math.max(0, Math.floor(data.length / 8) - 1)} // Show ~8 labels max, -1 for first scale
          height={40}
        />

        <YAxis
          stroke="#d1d5db"
          tick={{ fontSize: 9, fill: '#6b7280' }}
          domain={[yAxisMin, yAxisMax]}
          axisLine={false}
          tickLine={false}
          width={45}
          ticks={Array.from({ length: 6 }, (_, i) => yAxisMin + (yAxisMax - yAxisMin) * (i / 5))}
          tickFormatter={(value) => `$${value.toFixed(1)}`}
        />

        <Tooltip
          contentStyle={{
            backgroundColor: '#ffffff',
            border: '1px solid #e5e7eb',
            borderRadius: '6px',
            color: '#ffffff',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
            padding: '10px',
          }}
          content={({ active, payload }) => {
            if (active && payload && payload[0]) {
              const point = payload[0].payload as DailyPriceData;
              const dailyChange = point.close - point.open;
              const dailyChangePercent = ((dailyChange / point.open) * 100);

              return (
                <div className="text-xs space-y-1.5 bg-white p-4 rounded-md shadow-md">
                  <p className="font-semibold text-slate-900">{point.date}</p>
                  <div className="space-y-0.5">
                    <p>Open: <span className="font-semibold">${point.open.toFixed(2)}</span></p>
                    <p>High: <span className="font-semibold text-green-600">${point.high.toFixed(2)}</span></p>
                    <p>Low: <span className="font-semibold text-red-600">${point.low.toFixed(2)}</span></p>
                    <p>Close: <span className="font-semibold">${point.close.toFixed(2)}</span></p>
                    <p className={`font-semibold ${dailyChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      Change: {dailyChange >= 0 ? '+' : ''}${dailyChange.toFixed(2)} ({dailyChangePercent >= 0 ? '+' : ''}{dailyChangePercent.toFixed(2)}%)
                    </p>
                    <p className="text-slate-600">Volume: {(point.volume / 1000000).toFixed(1)}M</p>
                  </div>
                </div>
              );
            }
            return null;
          }}
          cursor={{ strokeDasharray: '3 3', stroke: '#9ca3af', opacity: 0.6 }}
        />

        <Area
          type="monotone"
          dataKey="close"
          fill="url(#priceGradient)"
          stroke={isPositive ? '#10b981' : '#ef4444'}
          strokeWidth={2.5}
          dot={false}
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
};

export const TradingModal: React.FC<TradingModalProps> = ({ symbol, action, onClose }) => {
  const { stockData } = useSharedStockStream(symbol);
  const [shares, setShares] = useState<number>(1);
  const { t } = useTranslation();

  // Redux state
  const currentAccountType = useSelector((state: any) => state.trading.currentAccountType);
  const isDemo = currentAccountType === 'demo';

  // API hooks
  const [buyStock, { isLoading: isBuyLoading }] = useBuyStockMutation();
  const [sellStock, { isLoading: isSellLoading }] = useSellStockMutation();
  const { data: accountData } = useGetAccountQuery();
  const { data: positionsData } = useGetPositionsQuery({ accountType: currentAccountType });

  // Get real-time price from stream context
  const currentPrice = stockData?.currentData?.price || stockData?.historicalData?.[stockData.historicalData?.length - 1]?.close || 0;

  // Get account data from API
  const account = isDemo ? accountData?.accounts?.demo : accountData?.accounts?.real;
  const balance = account?.balance || 0;

  const formatCurrency = (amount: number) => {
    return formatCurrencyUtil(amount);
  };

  // Get positions from positions API (not from account)
  const positions = positionsData?.positions || [];
  const currentPosition = positions?.find((p: any) => p.symbol === symbol);

  // Prepare 1-day chart data from historical data
  const dailyChartData = useMemo(() => {
    if (!stockData?.historicalData || stockData.historicalData.length === 0) return [];
    return prepareDailyChartData(stockData.historicalData);
  }, [stockData?.historicalData]);

  const totalCost = shares * currentPrice;
  const canAfford = balance >= totalCost;
  const canSell = currentPosition && currentPosition.shares >= shares;

  const handleTrade = async () => {
    try {
      if (action === 'buy') {
        const result = await buyStock({
          symbol,
          shares,
          accountType: currentAccountType,
        }).unwrap();

        toast.success(t('tradingModal.tradeSuccess'));
        onClose();
      } else {
        const result = await sellStock({
          symbol,
          shares,
          accountType: currentAccountType,
        }).unwrap();

        toast.success(t('tradingModal.tradeSuccess'));
        onClose();
      }
    } catch (error: any) {
      toast.error(error?.data?.message || t('tradingModal.tradeFailed'));
    }
  };

  const maxShares = action === 'buy'
    ? Math.floor(balance / currentPrice)
    : currentPosition?.shares || 0;

  // Calculate price change from historical data (first to last day)
  const firstPrice = dailyChartData.length > 0 ? dailyChartData[0]?.open || 0 : 0;
  const lastPrice = dailyChartData.length > 0 ? dailyChartData[dailyChartData.length - 1]?.close || 0 : 0;
  const priceChange = lastPrice - firstPrice;
  const priceChangePercent = firstPrice > 0 ? ((priceChange / firstPrice) * 100) : 0;
  const isPositive = priceChange >= 0;

  if (stockData?.isLoading) {
    return (
      <Dialog open onOpenChange={onClose}>
        <DialogContent className="w-full max-w-4xl">
          <div className="flex items-center justify-center h-96">
            <div className="text-center space-y-4">
              <Loader className="w-8 h-8 animate-spin mx-auto text-blue-500" />
              <p className="text-gray-600">Loading {symbol} data...</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="w-full max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-3">
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {action === 'buy' ? (
                <TrendingUp className="w-5 h-5 text-green-600" />
              ) : (
                <TrendingDown className="w-5 h-5 text-red-600" />
              )}
              <span className="text-xl">{action === 'buy' ? t('trading.buy') : t('trading.sell')} {symbol}</span>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* 1-Day Price Chart */}
          {dailyChartData.length > 0 && (
            <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900/40 dark:to-slate-800/40 p-4 rounded-lg border border-slate-200 dark:border-slate-700/50">
              {/* Chart Header */}
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">30-Day Price Chart (1D)</p>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-xl font-bold text-slate-900 dark:text-slate-100">{formatCurrency(currentPrice)}</span>
                    <span className={`text-xs font-semibold ${isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {isPositive ? '▲' : '▼'} {Math.abs(priceChangePercent).toFixed(2)}%
                    </span>
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                      1D CHART
                    </span>
                  </div>
                </div>
                <div className="text-right text-xs text-slate-600 dark:text-slate-400 space-y-0.5">
                  <div>30D High: <span className="font-semibold text-slate-900 dark:text-slate-100">{formatCurrency(Math.max(...dailyChartData.map(d => d.high)))}</span></div>
                  <div>30D Low: <span className="font-semibold text-slate-900 dark:text-slate-100">{formatCurrency(Math.min(...dailyChartData.map(d => d.low)))}</span></div>
                </div>
              </div>

              {/* Chart Canvas */}
              <div className="w-full h-[380px] bg-white dark:bg-slate-950/50 px-2 py-3 rounded border border-slate-200 dark:border-slate-700/50">
                <OneDayChart data={dailyChartData} isPositive={isPositive} />
              </div>

            </div>
          )}

          {/* Compact Trading Section */}
          <div className="bg-slate-50 dark:bg-slate-900/20 p-3 rounded-lg border border-slate-200 dark:border-slate-700/30 space-y-2.5">
            {/* Stats Row */}
            <div className="grid grid-cols-4 gap-2 text-center">
              <div>
                <p className="text-xs text-slate-600 dark:text-slate-400">Price</p>
                <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{formatCurrency(currentPrice)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-600 dark:text-slate-400">Change</p>
                <p className={`text-sm font-bold ${isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>{isPositive ? '+' : ''}{priceChangePercent.toFixed(2)}%</p>
              </div>
              <div>
                <p className="text-xs text-slate-600 dark:text-slate-400">Balance</p>
                <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{formatCurrency(balance)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-600 dark:text-slate-400">Position</p>
                <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{currentPosition?.shares || '—'}</p>
              </div>
            </div>

            {/* Divider */}
            <div className="h-px bg-slate-200 dark:bg-slate-700/30"></div>

            {/* Input & Total Row */}
            <div className="flex gap-2 items-end">
              {/* Shares Input */}
              <div className="flex-1">
                <Label htmlFor="shares" className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 block">Shares</Label>
                <div className="flex gap-1">
                  <Input
                    id="shares"
                    type="number"
                    min="1"
                    max={maxShares}
                    value={shares}
                    onChange={(e) => setShares(Math.max(1, parseInt(e.target.value) || 1))}
                    className="h-8 text-sm"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShares(maxShares)}
                    disabled={maxShares === 0}
                    className="h-8 px-2 text-xs"
                  >
                    Max
                  </Button>
                </div>
              </div>

              {/* Total */}
              <div className="flex-1 text-center">
                <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Total</p>
                <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{formatCurrency(totalCost)}</p>
              </div>

              {/* Trade Buttons */}
              <div className="flex gap-1.5">
                <Button
                  onClick={handleTrade}
                  disabled={
                    (action === 'buy' && !canAfford) ||
                    (action === 'sell' && !canSell) ||
                    shares <= 0 ||
                    currentPrice === 0 ||
                    isBuyLoading ||
                    isSellLoading
                  }
                  className={`h-8 text-xs font-semibold px-5 text-white ${action === 'buy'
                    ? 'bg-green-600 hover:bg-green-700 disabled:bg-green-400 dark:bg-green-700 dark:hover:bg-green-600'
                    : 'bg-red-600 hover:bg-red-700 disabled:bg-red-400 dark:bg-red-700 dark:hover:bg-red-600'
                    }`}
                >
                  {isBuyLoading || isSellLoading ? (
                    <>
                      <Loader className="w-3 h-3 mr-1 animate-spin inline" />
                      {action === 'buy' ? 'Buying...' : 'Selling...'}
                    </>
                  ) : (
                    action === 'buy' ? 'Buy' : 'Sell'
                  )}
                </Button>

                <Button
                  variant="outline"
                  onClick={onClose}
                  className="h-8 px-3 text-xs font-semibold"
                  disabled={isBuyLoading || isSellLoading}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>

          {/* Warnings - Compact */}
          <div className="space-y-2">
            {action === 'buy' && !canAfford && (
              <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/30 p-2.5 rounded text-xs text-red-800 dark:text-red-300">
                ⚠️ Need {formatCurrency(totalCost - balance)} more funds
              </div>
            )}

            {action === 'sell' && !canSell && (
              <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/30 p-2.5 rounded text-xs text-red-800 dark:text-red-300">
                ⚠️ Only {currentPosition?.shares || 0} shares available
              </div>
            )}

            {isDemo && (
              <div className="bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800/30 p-2.5 rounded text-xs text-yellow-800 dark:text-yellow-300">
                📊 Demo mode - Using virtual money
              </div>
            )}


          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};