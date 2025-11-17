import React, { useState, useEffect } from 'react';
import { Globe, Palette, Upload, Image as ImageIcon, Check } from 'lucide-react';
import { Card, CardHeader, CardBody } from '@/components/aura/Card';
import { Button } from '@/components/aura/Button';
import { Badge } from '@/components/aura/Badge';
import { useToast } from '@/components/aura/ToastProvider';
import { useEventContext } from '@/hooks/useEventContext';

export function SettingsGeneralPage() {
  const [language, setLanguage] = useState('fr');
  const [theme, setTheme] = useState('dark');
  const [eventLogos, setEventLogos] = useState<string[]>([]);
  const [activeLogo, setActiveLogo] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const { success: toastSuccess, error: toastError, info: toastInfo } = useToast();
  const { hasEvent, eventId, currentEvent } = useEventContext();

  // Charger les préférences depuis localStorage
  useEffect(() => {
    const savedLanguage = localStorage.getItem('app_lang') || 'fr';
    const savedTheme = localStorage.getItem('theme') || 'dark';
    const savedActiveLogo = localStorage.getItem(`event_logo_path_${eventId}`) || null;
    
    setLanguage(savedLanguage);
    setTheme(savedTheme);
    setActiveLogo(savedActiveLogo);
    
    // Charger les logos existants (simulation)
    if (hasEvent) {
      loadEventLogos();
    }
  }, [hasEvent, eventId]);

  const loadEventLogos = () => {
    // Simulation - en réalité, charger depuis Supabase Storage
    const mockLogos = [
      'logo1.png',
      'logo2.png',
      'logo3.png',
    ];
    setEventLogos(mockLogos);
  };

  const handleLanguageChange = (newLanguage: string) => {
    setLanguage(newLanguage);
    localStorage.setItem('app_lang', newLanguage);
    
    // Appliquer la langue si i18n est disponible
    if (window.i18n) {
      window.i18n.changeLanguage(newLanguage);
    }
    
    toastSuccess(`Langue changée vers ${newLanguage === 'fr' ? 'Français' : 'English'}`);
  };

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    
    // Appliquer le thème immédiatement
    document.documentElement.setAttribute('data-theme', newTheme);
    document.documentElement.className = newTheme === 'dark' ? 'dark' : '';
    
    toastSuccess(`Thème changé vers ${newTheme === 'dark' ? 'Sombre' : 'Clair'}`);
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!hasEvent) {
      toastError('Aucun évènement sélectionné');
      return;
    }

    const file = event.target.files?.[0];
    if (!file) return;

    // Validation
    if (!file.type.startsWith('image/')) {
      toastError('Veuillez sélectionner un fichier image');
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB
      toastError('Le fichier ne doit pas dépasser 5MB');
      return;
    }

    setUploading(true);
    try {
      // Simulation upload - en réalité, uploader vers Supabase Storage
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const fileName = `logo_${Date.now()}.${file.name.split('.').pop()}`;
      setEventLogos(prev => [...prev, fileName]);
      
      toastSuccess('Logo uploadé avec succès');
    } catch (error) {
      console.error('Erreur upload logo:', error);
      toastError('Erreur lors de l\'upload du logo');
    } finally {
      setUploading(false);
    }
  };

  const handleLogoSelect = (logo: string) => {
    setActiveLogo(logo);
    localStorage.setItem(`event_logo_path_${eventId}`, logo);
    
    // En réalité, mettre à jour events.logo_path dans Supabase
    toastSuccess('Logo sélectionné comme actif');
  };

  return (
    <div className="space-y-6">
      {/* Langue */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Langue
            </h2>
          </div>
        </CardHeader>
        <CardBody>
          <div className="flex gap-4">
            <Button
              variant={language === 'fr' ? 'primary' : 'secondary'}
              onClick={() => handleLanguageChange('fr')}
              className="flex items-center gap-2"
            >
              🇫🇷 Français
            </Button>
            <Button
              variant={language === 'en' ? 'primary' : 'secondary'}
              onClick={() => handleLanguageChange('en')}
              className="flex items-center gap-2"
            >
              🇬🇧 English
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* Thème */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Palette className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Thème
            </h2>
          </div>
        </CardHeader>
        <CardBody>
          <div className="flex gap-4">
            <Button
              variant={theme === 'light' ? 'primary' : 'secondary'}
              onClick={() => handleThemeChange('light')}
              className="flex items-center gap-2"
            >
              ☀️ Clair
            </Button>
            <Button
              variant={theme === 'dark' ? 'primary' : 'secondary'}
              onClick={() => handleThemeChange('dark')}
              className="flex items-center gap-2"
            >
              🌙 Sombre
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* Logo de l'évènement */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Logo de l'évènement
            </h2>
          </div>
        </CardHeader>
        <CardBody>
          {!hasEvent ? (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <div className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
                <div className="w-4 h-4 bg-yellow-400 rounded-full"></div>
                <span className="font-medium">Aucun évènement sélectionné</span>
              </div>
              <p className="text-yellow-700 dark:text-yellow-300 text-sm mt-2">
                Veuillez sélectionner un évènement pour gérer ses logos.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Upload */}
              <div className="flex items-center gap-4">
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                    disabled={uploading}
                  />
                  <Button
                    variant="secondary"
                    disabled={uploading}
                    className="flex items-center gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    {uploading ? 'Upload...' : 'Uploader un logo'}
                  </Button>
                </label>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Formats acceptés: JPG, PNG, SVG (max 5MB)
                </span>
              </div>

              {/* Galerie des logos */}
              {eventLogos.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Logos disponibles
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {eventLogos.map((logo, index) => (
                      <div
                        key={index}
                        className="relative group cursor-pointer"
                        onClick={() => handleLogoSelect(logo)}
                      >
                        <div className="aspect-square bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 flex items-center justify-center overflow-hidden">
                          <ImageIcon className="w-8 h-8 text-gray-400" />
                        </div>
                        {activeLogo === logo && (
                          <div className="absolute top-2 right-2">
                            <Badge color="green" className="flex items-center gap-1">
                              <Check className="w-3 h-3" />
                              Actif
                            </Badge>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 rounded-lg transition-all flex items-center justify-center">
                          <span className="text-white text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                            Sélectionner
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {eventLogos.length === 0 && (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <ImageIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Aucun logo uploadé</p>
                  <p className="text-sm">Commencez par uploader un logo</p>
                </div>
              )}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}

