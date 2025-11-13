import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  TrendingUp,
  Wallet,
  BarChart3,
  Settings,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLogoutMutation } from "../../Redux/Api/authApi/Auth";
import { clearUser } from "../../Redux/authSlice";
import { useDispatch } from "react-redux";
import { useTranslation } from "react-i18next";

export const Sidebar: React.FC = () => {
  const location = useLocation();
  const [logoError, setLogoError] = useState(false);
  const [logout] = useLogoutMutation();
  const dispatch = useDispatch();
  const { t } = useTranslation();
  
  const navigation = [
    { name: t('sidebar.dashboard'), href: "/dashboard", icon: LayoutDashboard },
    { name: t('sidebar.trading'), href: "/trading", icon: TrendingUp },
    { name: t('sidebar.portfolio'), href: "/portfolio", icon: Wallet },
    { name: t('sidebar.analytics'), href: "/analytics", icon: BarChart3 },
    { name: t('sidebar.settings'), href: "/settings", icon: Settings },
  ];
  
  const handleLogout = async () => {
    try {
      await logout(undefined).unwrap();
    } catch (e) {
      // Optionally handle error
    } finally {
      dispatch(clearUser());
    }
  };
  return (
    <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-64 lg:flex-col">
      <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white dark:bg-gray-800 px-6 pb-4 shadow-lg">
        <Link
          to="/"
          className="flex h-16 shrink-0 items-center focus:outline-none"
        >
          <div className="flex items-center space-x-2">
            {!logoError ? (
              <img
                src="/android-chrome-512x512.png"
                alt="SAIS Logo"
                className="w-8 h-8 rounded-md"
                onError={() => setLogoError(true)}
              />
            ) : (
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
            )}
            <span className="text-xl font-bold text-gray-900 dark:text-white">
              SAIS
            </span>
          </div>
        </Link>
        <nav className="flex flex-1 flex-col">
          <ul role="list" className="flex flex-1 flex-col gap-y-7">
            <li>
              <ul role="list" className="-mx-2 space-y-1">
                {navigation.map((item) => {
                  const isActive = location.pathname === item.href;
                  return (
                    <li key={item.name}>
                      <Link
                        to={item.href}
                        className={cn(
                          isActive
                            ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400"
                            : "text-gray-700 dark:text-gray-300 hover:text-blue-700 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-700",
                          "group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold transition-colors"
                        )}
                      >
                        <item.icon
                          className={cn(
                            isActive
                              ? "text-blue-700 dark:text-blue-400"
                              : "text-gray-400 group-hover:text-blue-700 dark:group-hover:text-blue-400",
                            "h-6 w-6 shrink-0"
                          )}
                          aria-hidden="true"
                        />
                        {item.name}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </li>
            <li className="mt-auto">
              <button className="group -mx-2 flex w-full gap-x-3 rounded-md p-2 text-sm font-semibold leading-6 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-blue-700 dark:hover:text-blue-400" onClick={handleLogout}>
                <LogOut className="h-6 w-6 shrink-0 text-gray-400 group-hover:text-blue-700 dark:group-hover:text-blue-400" />
                {t('sidebar.signOut')}
              </button>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  );
};
