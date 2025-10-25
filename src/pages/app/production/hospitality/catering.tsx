import { UtensilsCrossed } from "lucide-react";
import { useI18n } from "../../../../lib/i18n";

export default function CateringPage() {
  const { t } = useI18n();
  
  return (
    <div className="p-6">
      <header className="flex items-center gap-2 mb-6">
        <UtensilsCrossed className="w-5 h-5 text-violet-400" />
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">{t('catering').toUpperCase()}</h1>
      </header>

      <p className="text-sm text-gray-400 mb-6">Production / Hospitality / Catering</p>

      {/* TODO: Implémenter la gestion du catering (repas, riders) */}
    </div>
  );
}
