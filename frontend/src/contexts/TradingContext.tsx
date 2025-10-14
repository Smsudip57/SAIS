import React, { createContext, useContext, useState, useEffect } from 'react';
import { mockStocks, mockUser, updateStockPrices, Stock, Account, Position } from '@/lib/mockData';

interface TradingContextType {
  user: typeof mockUser;
  stocks: Stock[];
  isDemo: boolean;
  currentAccount: Account;
  setIsDemo: (demo: boolean) => void;
  buyStock: (symbol: string, shares: number) => boolean;
  sellStock: (symbol: string, shares: number) => boolean;
  refreshPrices: () => void;
}

const TradingContext = createContext<TradingContextType | undefined>(undefined);

export const useTradingContext = () => {
  const context = useContext(TradingContext);
  if (!context) {
    throw new Error('useTradingContext must be used within a TradingProvider');
  }
  return context;
};

export const TradingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState(mockUser);
  const [stocks, setStocks] = useState(mockStocks);
  const [isDemo, setIsDemo] = useState(true);

  const currentAccount = isDemo ? user.demoAccount : user.realAccount;

  // Simulate real-time price updates
  useEffect(() => {
    const interval = setInterval(() => {
      setStocks(prevStocks => updateStockPrices(prevStocks));
    }, 3000); // Update every 3 seconds

    return () => clearInterval(interval);
  }, []);

  // Update portfolio values when stock prices change
  useEffect(() => {
    setUser(prevUser => {
      const updatedUser = { ...prevUser };
      
      // Update demo account positions
      updatedUser.demoAccount.positions = updatedUser.demoAccount.positions.map(position => {
        const stock = stocks.find(s => s.symbol === position.symbol);
        if (stock) {
          const totalValue = position.shares * stock.price;
          const gainLoss = totalValue - (position.shares * position.avgPrice);
          const gainLossPercent = (gainLoss / (position.shares * position.avgPrice)) * 100;
          
          return {
            ...position,
            currentPrice: stock.price,
            totalValue,
            gainLoss,
            gainLossPercent
          };
        }
        return position;
      });

      // Update real account positions
      updatedUser.realAccount.positions = updatedUser.realAccount.positions.map(position => {
        const stock = stocks.find(s => s.symbol === position.symbol);
        if (stock) {
          const totalValue = position.shares * stock.price;
          const gainLoss = totalValue - (position.shares * position.avgPrice);
          const gainLossPercent = (gainLoss / (position.shares * position.avgPrice)) * 100;
          
          return {
            ...position,
            currentPrice: stock.price,
            totalValue,
            gainLoss,
            gainLossPercent
          };
        }
        return position;
      });

      // Recalculate portfolio values
      const updateAccountValue = (account: Account) => {
        const portfolioValue = account.positions.reduce((sum, pos) => sum + pos.totalValue, 0);
        const totalValue = account.balance + portfolioValue;
        return { ...account, portfolioValue, totalValue };
      };

      updatedUser.demoAccount = updateAccountValue(updatedUser.demoAccount);
      updatedUser.realAccount = updateAccountValue(updatedUser.realAccount);

      return updatedUser;
    });
  }, [stocks]);

  const buyStock = (symbol: string, shares: number): boolean => {
    const stock = stocks.find(s => s.symbol === symbol);
    if (!stock) return false;

    const totalCost = stock.price * shares;
    const account = isDemo ? user.demoAccount : user.realAccount;

    if (account.balance < totalCost) return false;

    setUser(prevUser => {
      const updatedUser = { ...prevUser };
      const targetAccount = isDemo ? updatedUser.demoAccount : updatedUser.realAccount;
      
      // Update balance
      targetAccount.balance -= totalCost;
      
      // Add or update position
      const existingPosition = targetAccount.positions.find(p => p.symbol === symbol);
      if (existingPosition) {
        const totalShares = existingPosition.shares + shares;
        const totalCost = (existingPosition.shares * existingPosition.avgPrice) + (shares * stock.price);
        existingPosition.shares = totalShares;
        existingPosition.avgPrice = totalCost / totalShares;
      } else {
        const newPosition: Position = {
          symbol,
          shares,
          avgPrice: stock.price,
          currentPrice: stock.price,
          totalValue: shares * stock.price,
          gainLoss: 0,
          gainLossPercent: 0
        };
        targetAccount.positions.push(newPosition);
      }

      return updatedUser;
    });

    return true;
  };

  const sellStock = (symbol: string, shares: number): boolean => {
    const stock = stocks.find(s => s.symbol === symbol);
    if (!stock) return false;

    const account = isDemo ? user.demoAccount : user.realAccount;
    const position = account.positions.find(p => p.symbol === symbol);
    
    if (!position || position.shares < shares) return false;

    const saleValue = stock.price * shares;

    setUser(prevUser => {
      const updatedUser = { ...prevUser };
      const targetAccount = isDemo ? updatedUser.demoAccount : updatedUser.realAccount;
      
      // Update balance
      targetAccount.balance += saleValue;
      
      // Update or remove position
      const positionIndex = targetAccount.positions.findIndex(p => p.symbol === symbol);
      if (positionIndex !== -1) {
        const pos = targetAccount.positions[positionIndex];
        pos.shares -= shares;
        
        if (pos.shares === 0) {
          targetAccount.positions.splice(positionIndex, 1);
        }
      }

      return updatedUser;
    });

    return true;
  };

  const refreshPrices = () => {
    setStocks(prevStocks => updateStockPrices(prevStocks));
  };

  return (
    <TradingContext.Provider value={{
      user,
      stocks,
      isDemo,
      currentAccount,
      setIsDemo,
      buyStock,
      sellStock,
      refreshPrices
    }}>
      {children}
    </TradingContext.Provider>
  );
};