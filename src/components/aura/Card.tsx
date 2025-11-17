import React from "react";
export const Card: React.FC<{ className?: string; children: React.ReactNode }> = ({ className="", children }) =>
  <div className={`bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm ${className}`}>{children}</div>;
export const CardHeader: React.FC<{ className?: string; children: React.ReactNode }> = ({ className="", children }) =>
  <div className={`px-4 py-3 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between ${className}`}>{children}</div>;
export const CardBody: React.FC<{ className?: string; children: React.ReactNode }> = ({ className="", children }) =>
  <div className={`p-4 ${className}`}>{children}</div>;
