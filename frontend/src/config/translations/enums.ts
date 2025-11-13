import i18n from '../i18n';

/**
 * Translate account type enum values
 * @param accountType - "demo" or "real"
 * @returns Translated account type string
 */
export const translateAccountType = (accountType: string): string => {
  const key = `accountType.${accountType.toLowerCase()}`;
  return i18n.t(key);
};

/**
 * Translate transaction type enum values
 * @param transactionType - "BUY" or "SELL"
 * @returns Translated transaction type string
 */
export const translateTransactionType = (transactionType: string): string => {
  const key = `transactionType.${transactionType.toLowerCase()}`;
  return i18n.t(key);
};

/**
 * Get all available account types with translations
 * @returns Array of account type options with labels
 */
export const getAccountTypeOptions = () => {
  return [
    { value: 'demo', label: i18n.t('accountType.demo') },
    { value: 'real', label: i18n.t('accountType.real') },
  ];
};

/**
 * Get all available transaction types with translations
 * @returns Array of transaction type options with labels
 */
export const getTransactionTypeOptions = () => {
  return [
    { value: 'buy', label: i18n.t('transactionType.buy') },
    { value: 'sell', label: i18n.t('transactionType.sell') },
  ];
};
