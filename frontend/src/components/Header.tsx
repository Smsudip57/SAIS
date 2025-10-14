import React from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { UserPopover } from "@/components/User";
import { useTradingContext } from "@/contexts/TradingContext";
import { useSelector } from "react-redux";
import { RootState } from "../../Redux/store";
import { DollarSign, TrendingUp, TrendingDown } from "lucide-react";

export const Header: React.FC = () => {
  const { isDemo, setIsDemo, currentAccount } = useTradingContext();
  // Get user from Redux auth slice
  const user = useSelector((state: RootState) => state.auth.user);

  const handleLogout = () => {
    // TODO: Implement logout logic here
    alert("Logged out!");
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  // Show skeleton loader in trigger if user is not loaded
  return (
    <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 justify-between items-center">
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <Switch
                id="account-mode"
                checked={isDemo}
                onCheckedChange={setIsDemo}
              />
              <Label htmlFor="account-mode" className="text-sm font-medium">
                {isDemo ? "Demo Mode" : "Real Account"}
              </Label>
              {isDemo && (
                <span className="inline-flex items-center rounded-full bg-green-100 dark:bg-green-900 px-2 py-1 text-xs font-medium text-green-800 dark:text-green-200">
                  Virtual Trading
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <Card className="px-4 py-2 border-none shadow-none">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <DollarSign className="w-4 h-4 text-gray-500" />
                  <div>
                    <p className="text-xs text-gray-500">Balance</p>
                    <p className="text-sm font-semibold">
                      {formatCurrency(currentAccount.balance)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <TrendingUp className="w-4 h-4 text-gray-500" />
                  <div>
                    <p className="text-xs text-gray-500">Portfolio</p>
                    <p className="text-sm font-semibold">
                      {formatCurrency(currentAccount.portfolioValue)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {currentAccount.dayChange >= 0 ? (
                    <TrendingUp className="w-4 h-4 text-green-500" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-red-500" />
                  )}
                  <div>
                    <p className="text-xs text-gray-500">Today</p>
                    <p
                      className={`text-sm font-semibold ${
                        currentAccount.dayChange >= 0
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {formatCurrency(currentAccount.dayChange)}
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            <div className="flex items-center space-x-2">
              <UserPopover
                isDemo={isDemo}
                onLogout={handleLogout}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
