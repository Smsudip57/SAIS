import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useTradingContext } from '@/contexts/TradingContext';
import { Stock } from '@/lib/mockData';
import { Calculator, TrendingUp, TrendingDown } from 'lucide-react';
import { toast } from 'sonner';

interface TradingModalProps {
  stock: Stock;
  action: 'buy' | 'sell';
  onClose: () => void;
}

export const TradingModal: React.FC<TradingModalProps> = ({ stock, action, onClose }) => {
  const { buyStock, sellStock, currentAccount, isDemo } = useTradingContext();
  const [shares, setShares] = useState<number>(1);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const totalCost = shares * stock.price;
  const canAfford = currentAccount.balance >= totalCost;
  
  const currentPosition = currentAccount.positions.find(p => p.symbol === stock.symbol);
  const canSell = currentPosition && currentPosition.shares >= shares;

  const handleTrade = () => {
    let success = false;
    
    if (action === 'buy') {
      success = buyStock(stock.symbol, shares);
      if (success) {
        toast.success(`Successfully bought ${shares} shares of ${stock.symbol}`);
      } else {
        toast.error('Insufficient funds for this purchase');
      }
    } else {
      success = sellStock(stock.symbol, shares);
      if (success) {
        toast.success(`Successfully sold ${shares} shares of ${stock.symbol}`);
      } else {
        toast.error('Insufficient shares to sell');
      }
    }
    
    if (success) {
      onClose();
    }
  };

  const maxShares = action === 'buy' 
    ? Math.floor(currentAccount.balance / stock.price)
    : currentPosition?.shares || 0;

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            {action === 'buy' ? (
              <TrendingUp className="w-5 h-5 text-green-600" />
            ) : (
              <TrendingDown className="w-5 h-5 text-red-600" />
            )}
            <span>{action === 'buy' ? 'Buy' : 'Sell'} {stock.symbol}</span>
          </DialogTitle>
          <DialogDescription>
            {stock.name} • {formatCurrency(stock.price)} per share
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Stock Info */}
          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600">Current Price</span>
              <span className="font-semibold">{formatCurrency(stock.price)}</span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600">Available Balance</span>
              <span className="font-semibold">{formatCurrency(currentAccount.balance)}</span>
            </div>
            {currentPosition && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Current Position</span>
                <span className="font-semibold">{currentPosition.shares} shares</span>
              </div>
            )}
          </div>

          {/* Shares Input */}
          <div className="space-y-2">
            <Label htmlFor="shares">Number of Shares</Label>
            <div className="flex items-center space-x-2">
              <Input
                id="shares"
                type="number"
                min="1"
                max={maxShares}
                value={shares}
                onChange={(e) => setShares(Math.max(1, parseInt(e.target.value) || 1))}
                className="flex-1"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShares(maxShares)}
                disabled={maxShares === 0}
              >
                Max
              </Button>
            </div>
            <p className="text-xs text-gray-500">
              Maximum: {maxShares} shares
            </p>
          </div>

          {/* Order Summary */}
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <div className="flex items-center space-x-2 mb-3">
              <Calculator className="w-4 h-4 text-blue-600" />
              <span className="font-medium text-blue-900 dark:text-blue-100">Order Summary</span>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Shares:</span>
                <span>{shares}</span>
              </div>
              <div className="flex justify-between">
                <span>Price per share:</span>
                <span>{formatCurrency(stock.price)}</span>
              </div>
              <div className="flex justify-between font-semibold text-base border-t pt-2">
                <span>Total {action === 'buy' ? 'Cost' : 'Proceeds'}:</span>
                <span>{formatCurrency(totalCost)}</span>
              </div>
            </div>
          </div>

          {/* Warnings */}
          {action === 'buy' && !canAfford && (
            <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
              <p className="text-sm text-red-800 dark:text-red-200">
                Insufficient funds. You need {formatCurrency(totalCost - currentAccount.balance)} more.
              </p>
            </div>
          )}

          {action === 'sell' && !canSell && (
            <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
              <p className="text-sm text-red-800 dark:text-red-200">
                Insufficient shares. You only have {currentPosition?.shares || 0} shares.
              </p>
            </div>
          )}

          {isDemo && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg">
              <div className="flex items-center space-x-2">
                <Badge variant="secondary">Demo Mode</Badge>
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  This is a simulated trade with virtual money.
                </p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button
              onClick={handleTrade}
              disabled={
                (action === 'buy' && !canAfford) || 
                (action === 'sell' && !canSell) ||
                shares <= 0
              }
              className={`flex-1 ${
                action === 'buy' 
                  ? 'bg-green-600 hover:bg-green-700' 
                  : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              {action === 'buy' ? 'Buy Shares' : 'Sell Shares'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};