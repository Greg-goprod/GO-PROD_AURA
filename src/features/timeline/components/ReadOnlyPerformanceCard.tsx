import React from "react";
import { useNavigate } from "react-router-dom";
import type { Performance, EventDay, EventStage } from "../timelineApi";
import { minutesSinceOpen, minToHHMM, hhmmToMin } from "../timelineApi";

interface ReadOnlyPerformanceCardProps {
  performance: Performance;
  day: EventDay;
  stage: EventStage;
  stageIndex: number;
}

const ROW_HEIGHT = 72;
const MINUTE_WIDTH = 130 / 60;

export function ReadOnlyPerformanceCard({
  performance,
  day,
  stage,
  stageIndex,
}: ReadOnlyPerformanceCardProps) {
  const navigate = useNavigate();

  // Calculer la position et la taille en pourcentage
  // Durée totale de la journée en minutes
  const dayStartMin = parseInt(day.open_time?.split(':')[0] || '0') * 60 + parseInt(day.open_time?.split(':')[1] || '0');
  const dayEndMin = parseInt(day.close_time?.split(':')[0] || '0') * 60 + parseInt(day.close_time?.split(':')[1] || '0');
  const totalDayMinutes = dayEndMin < dayStartMin ? (24 * 60 - dayStartMin + dayEndMin) : (dayEndMin - dayStartMin);
  
  const minutesSinceOpenTime = minutesSinceOpen(performance.performance_time, day.open_time);
  const leftPercent = (minutesSinceOpenTime / totalDayMinutes) * 100;
  const widthPercent = (performance.duration / totalDayMinutes) * 100;
  const top = stageIndex * ROW_HEIGHT + 4; // Petit padding
  const height = ROW_HEIGHT - 8; // Petit padding

  // Couleurs AURA selon le statut
  const getStatusStyles = (status: string) => {
    switch (status) {
      case "idee":
      case "offre_a_faire":
        return {
          bg: "bg-orange-50 dark:bg-orange-900/20",
          border: "border-orange-300 dark:border-orange-700",
          text: "text-orange-900 dark:text-orange-300",
          amount: "text-orange-700 dark:text-orange-400",
        };
      case "offre_validee":
        return {
          bg: "bg-green-50 dark:bg-green-900/20",
          border: "border-green-300 dark:border-green-700",
          text: "text-green-900 dark:text-green-300",
          amount: "text-green-700 dark:text-green-400",
        };
      case "offre_envoyee":
        return {
          bg: "bg-blue-50 dark:bg-blue-900/20",
          border: "border-blue-300 dark:border-blue-700",
          text: "text-blue-900 dark:text-blue-300",
          amount: "text-blue-700 dark:text-blue-400",
        };
      case "offre_rejetee":
        return {
          bg: "bg-red-50 dark:bg-red-900/20",
          border: "border-red-300 dark:border-red-700",
          text: "text-red-900 dark:text-red-300",
          amount: "text-red-700 dark:text-red-400",
        };
      default:
        return {
          bg: "bg-gray-50 dark:bg-gray-800",
          border: "border-gray-300 dark:border-gray-600",
          text: "text-gray-900 dark:text-gray-300",
          amount: "text-gray-700 dark:text-gray-400",
        };
    }
  };

  const styles = getStatusStyles(performance.booking_status);

  // Extraire le temps de début et de fin
  const startMin = hhmmToMin(performance.performance_time);
  const endMin = startMin + performance.duration;
  const startTime = minToHHMM(startMin);
  const endTime = minToHHMM(endMin);

  // Formater le montant (fee)
  const formatAmount = (amount: number | null, currency: string) => {
    if (amount === null || amount === 0) return "";
    return `${amount.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} ${currency}`;
  };

  const handleClick = () => {
    // Naviguer vers la page détail de l'artiste
    navigate(`/app/artistes/detail?id=${performance.artist_id}`);
  };

  return (
    <div
      style={{
        position: "absolute",
        left: `${leftPercent}%`,
        top: `${top}px`,
        width: `${widthPercent}%`,
        height: `${height}px`,
      }}
      className={`
        ${styles.bg} ${styles.border} ${styles.text}
        border-2 rounded-xl shadow-sm
        transition-all duration-200
        hover:shadow-md hover:scale-[1.02] hover:z-10
        cursor-pointer
        flex flex-col justify-between p-2
      `}
      onClick={handleClick}
    >
      {/* Nom de l'artiste */}
      <div className="font-bold text-sm uppercase truncate">
        {performance.artist_name || "Artiste inconnu"}
      </div>

      {/* Montant */}
      {performance.fee_amount && (
        <div className={`text-lg font-bold ${styles.amount}`}>
          {formatAmount(performance.fee_amount, performance.fee_currency || 'EUR')}
        </div>
      )}

      {/* Horaires */}
      <div className="text-xs opacity-70">
        {startTime} - {endTime}
      </div>
    </div>
  );
}

