import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  TrendingUp,
  Wallet,
  BarChart3,
  Settings,
} from "lucide-react";

import { LogOut, LogIn } from "lucide-react";
import React from "react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "../../Redux/store";
import { useLogoutMutation } from "../../Redux/Api/authApi/Auth";
import { clearUser } from "../../Redux/authSlice";

interface UserPopoverProps {
  isDemo?: boolean;
  className?: string;
}

export const UserPopover: React.FC<UserPopoverProps> = ({
  isDemo,
  className,
}) => {
  const location = useLocation();
  const navOptions = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Trading", href: "/trading", icon: TrendingUp },
    { name: "Portfolio", href: "/portfolio", icon: Wallet },
    { name: "Analytics", href: "/analytics", icon: BarChart3 },
    { name: "Settings", href: "/settings", icon: Settings },
  ];
  const user = useSelector((state: RootState) => state.auth.user);
  const loading = useSelector((state: RootState) => state.auth.loading);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [logout] = useLogoutMutation();

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
    <Popover>
      <PopoverTrigger asChild>
        {loading ? (
          <Card className="flex items-center space-x-3 px-3 py-1 cursor-pointer">
            <Skeleton className="w-8 h-8 rounded-full" />
            <div>
              <Skeleton className="h-4 w-24 mb-1" />
              <Skeleton className="h-3 w-16" />
            </div>
          </Card>
        ) : user ? (
          <Card
            className={`flex items-center space-x-3 px-3 py-1 cursor-pointer ${className}`}
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center">
              <span className="text-white text-sm font-medium">
                {`${user.firstName[0] ?? ""}${user.lastName[0] ?? ""}`}
              </span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {user.firstName} {user.lastName}
              </p>
              <p className="text-xs text-gray-500">{user.email}</p>
            </div>
          </Card>
        ) : (
          <button
            className="flex items-center space-x-3 px-3 py-1 cursor-pointer rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors text-sm font-medium"
            onClick={() => navigate("/login")}
          >
            Login
          </button>
        )}
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-72 p-0 border-none shadow-lg bg-gradient-to-br from-white via-blue-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-900 overflow-hidden rounded-lg"
      >
        <div className="flex flex-col items-center py-6 px-6">
          <div className="relative mb-3">
            <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center shadow-lg ring-4 ring-white dark:ring-gray-900">
              <span className="text-white text-2xl font-bold">
                {loading ? (
                  <Skeleton className="h-6 w-12" />
                ) : user ? (
                  `${user.firstName[0] ?? ""}${user.lastName[0] ?? ""}`
                ) : null}
              </span>
            </div>
            <span
              className="absolute bottom-0 right-0 block w-4 h-4 rounded-full bg-green-400 ring-2 ring-white dark:ring-gray-900 border-2 border-white dark:border-gray-900"
              title="Online"
            />
          </div>
          <div className="text-center mb-2">
            <p className="text-lg font-bold text-gray-900 dark:text-white">
              {loading ? (
                <Skeleton className="h-5 w-24" />
              ) : user ? (
                `${user.firstName} ${user.lastName}`
              ) : null}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {loading ? (
                <Skeleton className="h-3 w-20" />
              ) : user ? (
                user.email
              ) : null}
            </p>
          </div>
          <div className="flex items-center justify-center gap-2 mb-4">
            <span className="inline-flex items-center rounded-full bg-blue-100 dark:bg-blue-900/40 px-2 py-0.5 text-xs font-medium text-blue-700 dark:text-blue-300">
              User
            </span>
            {isDemo && (
              <span className="inline-flex items-center rounded-full bg-green-100 dark:bg-green-900 px-2 py-0.5 text-xs font-medium text-green-800 dark:text-green-200">
                Demo Mode
              </span>
            )}
          </div>
          <div className="w-full flex flex-col gap-1 mb-2">
            {navOptions
              .filter((item) => location.pathname !== item.href)
              .map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={[
                      isActive
                        ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400"
                        : "text-gray-700 dark:text-gray-300 hover:text-blue-700 hover:bg-blue-100 dark:hover:text-blue-400 dark:hover:bg-gray-700 group",
                      "flex items-center gap-2 px-2 py-1 rounded-md text-sm font-semibold leading-6 transition-colors",
                    ].join(" ")}
                  >
                    <item.icon
                      className={[
                        isActive
                          ? "text-blue-700 dark:text-blue-400 group-hover:text-blue-400"
                          : "text-gray-400 group-hover:text-blue-700 dark:group-hover:text-blue-400",
                        "w-4 h-4 shrink-0",
                      ].join(" ")}
                      aria-hidden="true"
                    />
                    {item.name}
                  </Link>
                );
              })}
          </div>
          <button
            onClick={handleLogout}
            className="w-full px-2 py-1 bg-transparent text-gray-500 dark:text-gray-400 text-sm font-medium flex items-center justify-center gap-2 hover:underline focus:outline-none"
          >
            <LogOut className="w-4 h-4" />
            Log out
          </button>
        </div>{" "}
        {/* Close main content div */}
      </PopoverContent>
    </Popover>
  );
};
