import React, { useEffect } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { UserPopover } from "@/components/User";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "../../Redux/store";
import { DollarSign, TrendingUp, TrendingDown } from "lucide-react";
import { useGetAccountQuery, useGetPositionsQuery } from "../../Redux/Api/tradingApi/Trading";
import { setCurrentAccountType } from "../../Redux/tradingSlice";

export const Header: React.FC = () => {
  const dispatch = useDispatch();

  // Get auth user
  const user = useSelector((state: RootState) => state.auth.user);

  // Get trading state from Redux
  const { accounts, currentAccountType } = useSelector(
    (state: RootState) => state.trading
  );

  // Fetch account data from backend (once on mount)
  const { data: accountData, isLoading, refetch: refetchAccount } = useGetAccountQuery(undefined);
  const { refetch: refetchPositions } = useGetPositionsQuery(
    { accountType: currentAccountType },
    { skip: !currentAccountType }
  );

  // Get current account based on selected type
  const currentAccount = accounts?.[currentAccountType as keyof typeof accounts];

  const handleAccountSwitch = (isChecked: boolean) => {
    const newAccountType = isChecked ? "demo" : "real";
    dispatch(setCurrentAccountType(newAccountType));
  };

  // Refetch both account and positions when account type changes
  useEffect(() => {
    if (currentAccountType) {
      refetchAccount();
      refetchPositions();
    }
  }, [currentAccountType, refetchAccount, refetchPositions]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };
  return (
    <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 justify-between items-center">
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <Switch
                id="account-mode"
                checked={currentAccountType === "demo"}
                onCheckedChange={handleAccountSwitch}
              />
              <Label htmlFor="account-mode" className="text-sm font-medium">
                {currentAccountType === "demo" ? "Demo Mode" : "Real Account"}
              </Label>
              {currentAccountType === "demo" && (
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
                      {isLoading ? (
                        <span className="text-gray-400">Loading...</span>
                      ) : (
                        formatCurrency(currentAccount?.balance ?? 0)
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <TrendingUp className="w-4 h-4 text-gray-500" />
                  <div>
                    <p className="text-xs text-gray-500">Portfolio</p>
                    <p className="text-sm font-semibold">
                      {isLoading ? (
                        <span className="text-gray-400">Loading...</span>
                      ) : (
                        formatCurrency(currentAccount?.portfolioValue ?? 0)
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {(currentAccount?.dayChange ?? 0) >= 0 ? (
                    <TrendingUp className="w-4 h-4 text-green-500" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-red-500" />
                  )}
                  <div>
                    <p className="text-xs text-gray-500">Today</p>
                    <p
                      className={`text-sm font-semibold ${(currentAccount?.dayChange ?? 0) >= 0
                        ? "text-green-600"
                        : "text-red-600"
                        }`}
                    >
                      {isLoading ? (
                        <span className="text-gray-400">Loading...</span>
                      ) : (
                        formatCurrency(currentAccount?.dayChange ?? 0)
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            <div className="flex items-center space-x-2">
              <UserPopover
                isDemo={currentAccountType === "demo"}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
