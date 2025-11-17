import React, { useState } from 'react';
import { Users, DollarSign, Eye, Upload } from 'lucide-react';
import { Card, CardHeader, CardBody } from '@/components/aura/Card';
import { Button } from '@/components/aura/Button';
import { Input } from '@/components/aura/Input';
import { Badge } from '@/components/aura/Badge';
import { useToast } from '@/components/aura/ToastProvider';

export function SettingsArtistsPage() {
  const [formData, setFormData] = useState({
    defaultCurrency: 'EUR',
    roundingRules: 'round',
    publicVisibility: false,
  });
  const { success: toastSuccess } = useToast();

  const handleSave = () => {
    localStorage.setItem('artist_settings', JSON.stringify(formData));
    toastSuccess('Paramètres artistes sauvegardés');
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Paramètres artistes
            </h2>
          </div>
        </CardHeader>
        <CardBody>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Devise par défaut des cachets
                </label>
                <select
                  value={formData.defaultCurrency}
                  onChange={(e) => setFormData(prev => ({ ...prev, defaultCurrency: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="EUR">EUR (€)</option>
                  <option value="USD">USD ($)</option>
                  <option value="CHF">CHF (CHF)</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Règles d'arrondi
                </label>
                <select
                  value={formData.roundingRules}
                  onChange={(e) => setFormData(prev => ({ ...prev, roundingRules: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="round">Arrondir</option>
                  <option value="ceil">Arrondir vers le haut</option>
                  <option value="floor">Arrondir vers le bas</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="publicVisibility"
                checked={formData.publicVisibility}
                onChange={(e) => setFormData(prev => ({ ...prev, publicVisibility: e.target.checked }))}
                className="rounded border-gray-300 dark:border-gray-600"
              />
              <label htmlFor="publicVisibility" className="text-sm text-gray-700 dark:text-gray-300">
                Visibilité publique des artistes
              </label>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Fonctionnalités futures */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Fonctionnalités futures
          </h2>
        </CardHeader>
        <CardBody>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="flex items-center gap-3">
                <Upload className="w-5 h-5 text-gray-400" />
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">Mapping Spotify</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Synchronisation automatique avec Spotify</p>
                </div>
              </div>
              <Badge color="gray">Bientôt</Badge>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="flex items-center gap-3">
                <Upload className="w-5 h-5 text-gray-400" />
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">Import CSV artistes</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Import en masse depuis un fichier CSV</p>
                </div>
              </div>
              <Badge color="gray">Bientôt</Badge>
            </div>
          </div>
        </CardBody>
      </Card>

      <div className="flex justify-end">
        <Button variant="primary" onClick={handleSave}>
          Enregistrer les paramètres
        </Button>
      </div>
    </div>
  );
}

