import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { SettingsTabs } from './SettingsTabs';

export function SettingsLayout() {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header avec titre et breadcrumb */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Paramètres
              </h1>
              <nav className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400 mt-1">
                <span>Application</span>
                <span>/</span>
                <span className="text-gray-900 dark:text-white">Paramètres</span>
              </nav>
            </div>
          </div>
        </div>
      </div>

      {/* Onglets persistants */}
      <SettingsTabs />

      {/* Contenu principal */}
      <div className="max-w-7xl mx-auto p-6">
        <div className="space-y-6">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
