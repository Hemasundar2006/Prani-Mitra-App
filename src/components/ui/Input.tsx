import React from 'react';
import { View, Text, TextInput, TextInputProps } from 'react-native';

export interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerClassName?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  containerClassName = '',
  className = '',
  ...props
}) => {
  return (
    <View className={`w-full mb-4 ${containerClassName}`}>
      {label ? (
        <Text className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
          {label}
        </Text>
      ) : null}

      <View
        className={`flex-row items-center bg-slate-50 dark:bg-slate-800/80 border ${
          error
            ? 'border-red-500'
            : 'border-slate-200 dark:border-slate-700 focus:border-green-500'
        } rounded-xl px-3.5 py-2.5`}
      >
        {leftIcon ? <View className="mr-2">{leftIcon}</View> : null}
        <TextInput
          className={`flex-1 text-base text-slate-900 dark:text-slate-100 ${className}`}
          placeholderTextColor="#94a3b8"
          {...props}
        />
        {rightIcon ? <View className="ml-2">{rightIcon}</View> : null}
      </View>

      {error ? (
        <Text className="text-xs text-red-500 mt-1 font-medium">{error}</Text>
      ) : helperText ? (
        <Text className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          {helperText}
        </Text>
      ) : null}
    </View>
  );
};

