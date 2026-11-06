import React from 'react';
import { View, Text } from 'react-native';

export interface BadgeProps {
  label: string;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = 'primary',
  size = 'md',
  className = '',
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'secondary':
        return 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300';
      case 'success':
        return 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400';
      case 'warning':
        return 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400';
      case 'danger':
        return 'bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-400';
      case 'primary':
      default:
        return 'bg-green-100 dark:bg-green-950/60 text-green-700 dark:text-green-400';
    }
  };

  const getSizeStyles = () => {
    return size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm';
  };

  return (
    <View
      className={`self-start rounded-full flex-row items-center justify-center ${getVariantStyles()} ${getSizeStyles()} ${className}`}
    >
      <Text className="font-medium text-inherit">{label}</Text>
    </View>
  );
};

