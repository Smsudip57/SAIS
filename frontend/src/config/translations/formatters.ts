import { format as dateFnsFormat } from 'date-fns';
import { enUS, zhCN, ar } from 'date-fns/locale';
import i18n from '../i18n';

/**
 * Get date-fns locale based on current language
 */
const getDateLocale = () => {
  const currentLang = i18n.language;
  
  switch (currentLang) {
    case 'ar':
      return ar;
    case 'zh':
      return zhCN;
    case 'en':
    default:
      return enUS;
  }
};

/**
 * Format currency based on current locale
 * @param amount - The amount to format
 * @param currency - Currency code (default: USD)
 * @returns Formatted currency string
 */
export const formatCurrency = (amount: number, currency: string = 'USD'): string => {
  const currentLang = i18n.language;
  
  // Map language codes to appropriate locales
  const localeMap: Record<string, string> = {
    en: 'en-US',
    ar: 'ar-SA',
    zh: 'zh-CN',
  };
  
  const locale = localeMap[currentLang] || 'en-US';
  
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch (error) {
    // Fallback to English if locale is not supported
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  }
};

/**
 * Format number based on current locale
 * @param value - The number to format
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted number string
 */
export const formatNumber = (value: number, decimals: number = 2): string => {
  const currentLang = i18n.language;
  
  const localeMap: Record<string, string> = {
    en: 'en-US',
    ar: 'ar-SA',
    zh: 'zh-CN',
  };
  
  const locale = localeMap[currentLang] || 'en-US';
  
  try {
    return new Intl.NumberFormat(locale, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(value);
  } catch (error) {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(value);
  }
};

/**
 * Format percentage based on current locale
 * @param value - The value to format as percentage (e.g., 0.15 for 15%)
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted percentage string
 */
export const formatPercentage = (value: number, decimals: number = 2): string => {
  const currentLang = i18n.language;
  
  const localeMap: Record<string, string> = {
    en: 'en-US',
    ar: 'ar-SA',
    zh: 'zh-CN',
  };
  
  const locale = localeMap[currentLang] || 'en-US';
  
  try {
    return new Intl.NumberFormat(locale, {
      style: 'percent',
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(value);
  } catch (error) {
    return new Intl.NumberFormat('en-US', {
      style: 'percent',
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(value);
  }
};

/**
 * Format date based on current locale
 * @param date - Date to format
 * @param formatString - Format string (date-fns format)
 * @returns Formatted date string
 */
export const formatDate = (date: Date | string | number, formatString: string = 'PP'): string => {
  const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  
  try {
    return dateFnsFormat(dateObj, formatString, {
      locale: getDateLocale(),
    });
  } catch (error) {
    // Fallback to ISO string if formatting fails
    return dateObj.toISOString();
  }
};

/**
 * Format date and time based on current locale
 * @param date - Date to format
 * @param formatString - Format string (date-fns format)
 * @returns Formatted date and time string
 */
export const formatDateTime = (date: Date | string | number, formatString: string = 'PPp'): string => {
  return formatDate(date, formatString);
};

/**
 * Format relative time (e.g., "2 hours ago")
 * @param date - Date to format
 * @returns Relative time string
 */
export const formatRelativeTime = (date: Date | string | number): string => {
  const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);
  
  const currentLang = i18n.language;
  
  // Define time units based on language
  const timeUnits: Record<string, { singular: string; plural: string }[]> = {
    en: [
      { singular: 'year', plural: 'years' },
      { singular: 'month', plural: 'months' },
      { singular: 'day', plural: 'days' },
      { singular: 'hour', plural: 'hours' },
      { singular: 'minute', plural: 'minutes' },
      { singular: 'second', plural: 'seconds' },
    ],
    ar: [
      { singular: 'سنة', plural: 'سنوات' },
      { singular: 'شهر', plural: 'أشهر' },
      { singular: 'يوم', plural: 'أيام' },
      { singular: 'ساعة', plural: 'ساعات' },
      { singular: 'دقيقة', plural: 'دقائق' },
      { singular: 'ثانية', plural: 'ثوان' },
    ],
    zh: [
      { singular: '年', plural: '年' },
      { singular: '个月', plural: '个月' },
      { singular: '天', plural: '天' },
      { singular: '小时', plural: '小时' },
      { singular: '分钟', plural: '分钟' },
      { singular: '秒', plural: '秒' },
    ],
  };
  
  const units = timeUnits[currentLang] || timeUnits.en;
  const intervals = [31536000, 2592000, 86400, 3600, 60, 1];
  
  for (let i = 0; i < intervals.length; i++) {
    const interval = Math.floor(diffInSeconds / intervals[i]);
    if (interval >= 1) {
      const unit = interval === 1 ? units[i].singular : units[i].plural;
      
      if (currentLang === 'ar') {
        return `منذ ${interval} ${unit}`;
      } else if (currentLang === 'zh') {
        return `${interval}${unit}前`;
      } else {
        return `${interval} ${unit} ago`;
      }
    }
  }
  
  return currentLang === 'ar' ? 'الآن' : currentLang === 'zh' ? '刚刚' : 'just now';
};
