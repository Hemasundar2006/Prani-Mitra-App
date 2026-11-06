import React from 'react';
import { View, ViewProps } from 'react-native';

export interface CardProps extends ViewProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'elevated' | 'outlined' | 'flat';
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  variant = 'elevated',
  style,
  ...props
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'outlined':
        return 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800';
      case 'flat':
        return 'bg-slate-100 dark:bg-slate-800';
      case 'elevated':
      default:
        return 'bg-white dark:bg-slate-900 shadow-sm shadow-slate-200 dark:shadow-none border border-slate-100 dark:border-slate-800';
    }
  };

  return (
    <View
      className={`rounded-2xl p-4 ${getVariantStyles()} ${className}`}
      style={style}
      {...props}
    >
      {children}
    </View>
  );
};

