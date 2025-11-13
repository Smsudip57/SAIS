import React, { useEffect } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { UserPopover } from "@/components/User";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "../../Redux/store";
import { DollarSign, TrendingUp, TrendingDown, Globe } from "lucide-react";
import { useGetAccountQuery, useGetPositionsQuery } from "../../Redux/Api/tradingApi/Trading";
import { setCurrentAccountType } from "../../Redux/tradingSlice";
import { useTranslation } from "react-i18next";
import { formatCurrency } from "@/config/translations/formatters";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

export const Header: React.FC = () => {
  const dispatch = useDispatch();
  const { t, i18n } = useTranslation();

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

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'ar', name: 'العربية', flag: '🇸🇦' },
    { code: 'zh', name: '中文', flag: '🇨🇳' },
  ];
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
                {currentAccountType === "demo" ? t('header.accountMode') : t('header.realAccount')}
              </Label>
              {currentAccountType === "demo" && (
                <span className="inline-flex items-center rounded-full bg-green-100 dark:bg-green-900 px-2 py-1 text-xs font-medium text-green-800 dark:text-green-200">
                  {t('header.virtualTrading')}
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
                    <p className="text-xs text-gray-500">{t('header.balance')}</p>
                    <p className="text-sm font-semibold">
                      {isLoading ? (
                        <span className="text-gray-400">{t('common.loading')}</span>
                      ) : (
                        formatCurrency(currentAccount?.balance ?? 0)
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <TrendingUp className="w-4 h-4 text-gray-500" />
                  <div>
                    <p className="text-xs text-gray-500">{t('header.portfolio')}</p>
                    <p className="text-sm font-semibold">
                      {isLoading ? (
                        <span className="text-gray-400">{t('common.loading')}</span>
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
                    <p className="text-xs text-gray-500">{t('header.today')}</p>
                    <p
                      className={`text-sm font-semibold ${(currentAccount?.dayChange ?? 0) >= 0
                        ? "text-green-600"
                        : "text-red-600"
                        }`}
                    >
                      {isLoading ? (
                        <span className="text-gray-400">{t('common.loading')}</span>
                      ) : (
                        formatCurrency(currentAccount?.dayChange ?? 0)
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            <div className="flex items-center space-x-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-2">
                    <Globe className="w-4 h-4" />
                    <span className="text-sm">
                      {languages.find(lang => lang.code === i18n.language)?.flag || '🌐'}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {languages.map((lang) => (
                    <DropdownMenuItem
                      key={lang.code}
                      onClick={() => changeLanguage(lang.code)}
                      className={`cursor-pointer ${i18n.language === lang.code ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
                    >
                      <span className="mr-2">{lang.flag}</span>
                      <span>{lang.name}</span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              
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
