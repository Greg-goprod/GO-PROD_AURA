import React from "react";
export const Badge: React.FC<{ color?: "gray"|"blue"|"green"|"yellow"|"red"; children: React.ReactNode }> = ({ color="gray", children }) => {
  const map: Record<string,string> = {
    gray:"bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
    blue:"bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
    green:"bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
    yellow:"bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300",
    red:"bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
  };
  return <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${map[color]}`}>{children}</span>;
};
