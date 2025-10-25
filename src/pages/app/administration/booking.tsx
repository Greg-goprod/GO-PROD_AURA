import { Calendar } from "lucide-react";
import { useI18n } from "../../../lib/i18n";

export default function AdminBookingPage() {
  const { t } = useI18n();
  
  return (
    <div className="p-6">
      <header className="flex items-center gap-2 mb-6">
        <Calendar className="w-5 h-5 text-violet-400" />
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">{t('booking').toUpperCase()}</h1>
      </header>

      <p className="text-sm text-gray-400 mb-6">Administration / Booking</p>

      {/* TODO: Implémenter la gestion administrative des bookings */}
    </div>
  );
}
