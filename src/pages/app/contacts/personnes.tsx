import { Users } from "lucide-react";
import { useI18n } from "../../../lib/i18n";

export default function PersonnesPage() {
  const { t } = useI18n();
  
  return (
    <div className="p-6">
      <header className="flex items-center gap-2 mb-6">
        <Users className="w-5 h-5 text-violet-400" />
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">{t('people').toUpperCase()}</h1>
      </header>

      <p className="text-sm text-gray-400 mb-6">Contacts / Personnes</p>

      {/* TODO: Implémenter la gestion des contacts personnes */}
    </div>
  );
}
