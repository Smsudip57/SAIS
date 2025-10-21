import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useSelector } from 'react-redux';
import { RootState } from '../../Redux/store';
import { useGetPortfolioHistoryQuery } from '../../Redux/Api/tradingApi/Trading';

interface TooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number;
    dataKey: string;
  }>;
  label?: string;
}

export const PortfolioChart: React.FC = () => {
  const { accounts, currentAccountType, portfolioHistory } = useSelector(
    (state: RootState) => state.trading
  );

  const currentAccount = accounts?.[currentAccountType as keyof typeof accounts];

  // Fetch portfolio history from API
  const { data: historyData, isLoading: historyLoading } = useGetPortfolioHistoryQuery(
    { accountType: currentAccountType, days: 30 },
    { skip: !currentAccountType }
  );

  // Prepare chart data from API response
  const chartData = useMemo(() => {
    // Use API data if available, otherwise use Redux portfolioHistory
    const historyList = historyData?.history || portfolioHistory || [];
    
    if (!historyList || historyList.length === 0) {
      // Return empty data placeholder if no history
      return [{
        date: 'No data',
        value: 0,
      }];
    }

    // Convert history data to chart format
    return historyList.map((item: any) => ({
      date: new Date(item?.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      value: item?.totalValue ?? 0,
      fullDate: item?.date,
    }));
  }, [historyData, portfolioHistory]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const CustomTooltip: React.FC<TooltipProps> = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
          <p className="text-sm font-medium">{label}</p>
          <p className="text-sm text-blue-600">
            Portfolio Value: {formatCurrency(payload[0].value)}
          </p>
        </div>
      );
    }
    return null;
  };

  const minValue = Math.min(...chartData.map(d => d?.value ?? 0));
  const maxValue = Math.max(...chartData.map(d => d?.value ?? 0));
  const padding = (maxValue - minValue) * 0.1 || 100;

  // Show loading state
  if (historyLoading) {
    return (
      <div className="h-80 flex items-center justify-center">
        <p className="text-gray-500">Loading portfolio history...</p>
      </div>
    );
  }

  // Show empty state
  if (!chartData || chartData.length === 0 || (chartData.length === 1 && chartData[0].value === 0)) {
    return (
      <div className="h-80 flex items-center justify-center">
        <p className="text-gray-500">No portfolio history available yet</p>
      </div>
    );
  }

  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
          <XAxis
            dataKey="date"
            className="text-gray-600 dark:text-gray-400"
            fontSize={12}
          />
          <YAxis
            domain={[minValue - padding, maxValue + padding]}
            tickFormatter={formatCurrency}
            className="text-gray-600 dark:text-gray-400"
            fontSize={12}
          />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone"
            dataKey="value"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 2, fill: '#ffffff' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
