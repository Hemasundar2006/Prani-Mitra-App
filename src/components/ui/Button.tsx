import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, View } from 'react-native';

export interface ButtonProps {
  title: string;
  onPress?: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  className?: string;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon,
  className = '',
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'secondary':
        return 'bg-slate-200 dark:bg-slate-800 active:bg-slate-300 dark:active:bg-slate-700';
      case 'outline':
        return 'bg-transparent border border-green-600 dark:border-green-500 active:bg-green-50 dark:active:bg-green-950/40';
      case 'ghost':
        return 'bg-transparent active:bg-slate-100 dark:active:bg-slate-800';
      case 'primary':
      default:
        return 'bg-green-600 dark:bg-green-500 active:bg-green-700 dark:active:bg-green-600';
    }
  };

  const getTextStyles = () => {
    switch (variant) {
      case 'secondary':
        return 'text-slate-900 dark:text-slate-100';
      case 'outline':
        return 'text-green-600 dark:text-green-500 font-semibold';
      case 'ghost':
        return 'text-slate-700 dark:text-slate-300';
      case 'primary':
      default:
        return 'text-white font-semibold';
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return 'py-2 px-3 rounded-lg';
      case 'lg':
        return 'py-4 px-6 rounded-2xl';
      case 'md':
      default:
        return 'py-3 px-4 rounded-xl';
    }
  };

  const getTextSizeStyles = () => {
    switch (size) {
      case 'sm':
        return 'text-sm';
      case 'lg':
        return 'text-lg';
      case 'md':
      default:
        return 'text-base';
    }
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      className={`flex-row items-center justify-center ${getVariantStyles()} ${getSizeStyles()} ${
        disabled ? 'opacity-50' : 'opacity-100'
      } ${className}`}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' ? '#ffffff' : '#16a34a'}
          className="mr-2"
        />
      ) : icon ? (
        <View className="mr-2">{icon}</View>
      ) : null}
      <Text className={`${getTextStyles()} ${getTextSizeStyles()} text-center`}>
        {title}
      </Text>
    </TouchableOpacity>
  );
};

