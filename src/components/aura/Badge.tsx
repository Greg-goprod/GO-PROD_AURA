import React from "react";
export const Badge: React.FC<{ color?: "gray"|"blue"|"green"|"yellow"|"red"|"violet"|"taupe"|"eminence"|"lightgreen"; children: React.ReactNode }> = ({ color="gray", children }) => {
  const map: Record<string,string> = {
    gray:"bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
    blue:"bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
    green:"bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
    yellow:"bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300",
    red:"bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
    violet:"bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-300",
    // AURA Colors
    taupe:"bg-[#91939920] text-[#919399] dark:bg-[#91939930] dark:text-[#919399]",
    eminence:"bg-[#661B7D20] text-[#661B7D] dark:bg-[#9E61A930] dark:text-[#9E61A9]",
    lightgreen:"bg-[#90EE9020] text-[#4A7C4A] dark:bg-[#90EE9030] dark:text-[#90EE90]",
  };
  return <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${map[color]}`}>{children}</span>;
};
