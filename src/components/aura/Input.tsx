import React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
}

export function Input({ label, helperText, error, className, ...rest }: InputProps) {
  const baseClasses = "h-[42px] px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent placeholder-gray-400 dark:placeholder-gray-500";
  const errorClasses = error ? "border-red-500 dark:border-red-400" : "";
  const inputClasses = `${baseClasses} ${errorClasses} ${className || ""}`;

  return (
    <div className="flex flex-col gap-2 mb-2">
      {label && (
        <label className="text-sm font-medium text-gray-900 dark:text-white">
          {label}
        </label>
      )}
      <input
        className={inputClasses}
        {...rest}
      />
      {error && (
        <span className="text-sm text-red-600 dark:text-red-400">{error}</span>
      )}
      {helperText && !error && (
        <span className="text-sm text-gray-500 dark:text-gray-400">{helperText}</span>
      )}
    </div>
  );
}
