import React from 'react';
import { NavLink } from 'react-router-dom';
import { Settings, Calendar, Users, Phone, Truck, Coffee, Shield } from 'lucide-react';

const tabs = [
  {
    id: 'general',
    label: 'Général',
    icon: Settings,
    path: '/app/settings/general',
  },
  {
    id: 'events',
    label: 'Événements',
    icon: Calendar,
    path: '/app/settings/events',
  },
  {
    id: 'artists',
    label: 'Artistes',
    icon: Users,
    path: '/app/settings/artists',
  },
  {
    id: 'contacts',
    label: 'Contacts',
    icon: Phone,
    path: '/app/settings/contacts',
  },
  {
    id: 'ground',
    label: 'Ground',
    icon: Truck,
    path: '/app/settings/ground',
  },
  {
    id: 'hospitality',
    label: 'Hospitality',
    icon: Coffee,
    path: '/app/settings/hospitality',
  },
  {
    id: 'staff',
    label: 'Staff',
    icon: Users,
    path: '/app/settings/staff',
  },
  {
    id: 'admin',
    label: 'Administratif',
    icon: Shield,
    path: '/app/settings/admin',
  },
];

export function SettingsTabs() {
  return (
    <div className="sticky top-0 z-40 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-6">
        <nav className="flex space-x-8 overflow-x-auto" role="tablist">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <NavLink
                key={tab.id}
                to={tab.path}
                className={({ isActive }) =>
                  `flex items-center space-x-2 px-1 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                    isActive
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:border-gray-600'
                  }`
                }
                role="tab"
                aria-selected={false}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
