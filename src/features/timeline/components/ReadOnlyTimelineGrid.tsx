import React, { useMemo, useState, useEffect, useRef } from "react";
import { ReadOnlyPerformanceCard } from "./ReadOnlyPerformanceCard";
import type { EventDay, EventStage, Performance } from "../timelineApi";
import { minToHHMM } from "../timelineApi";

interface ReadOnlyTimelineGridProps {
  days: EventDay[];
  stages: EventStage[];
  performances: Performance[];
}

const STAGE_COLUMN_WIDTH = 240; // Largeur colonne scènes/dates
const ROW_HEIGHT = 72;

export function ReadOnlyTimelineGrid({
  days,
  stages,
  performances,
}: ReadOnlyTimelineGridProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  
  // 1. CALCULER LA LARGEUR DISPONIBLE DYNAMIQUEMENT
  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        const width = containerRef.current.offsetWidth;
        setContainerWidth(width);
      }
    };

    updateWidth();
    window.addEventListener('resize', updateWidth);
    
    setTimeout(updateWidth, 100);
    
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  // 2. TRIER LES SCÈNES PAR CAPACITÉ (plus grande → plus petite)
  const sortedStages = useMemo(() => {
    return [...stages].sort((a, b) => (b.capacity || 0) - (a.capacity || 0));
  }, [stages]);

  // 3. CALCULER L'AMPLITUDE HORAIRE GLOBALE
  const { globalStartHour, totalHours } = useMemo(() => {
    if (days.length === 0) return { globalStartHour: 17, globalEndHour: 5, totalHours: 12 };

    let minHour = 24;
    let maxHour = 0;

    days.forEach(day => {
      const openHour = parseInt(day.open_time?.split(':')[0] || '18');
      const closeHour = parseInt(day.close_time?.split(':')[0] || '4');
      
      minHour = Math.min(minHour, openHour);
      
      if (closeHour < openHour) {
        maxHour = Math.max(maxHour, closeHour + 24);
      } else {
        maxHour = Math.max(maxHour, closeHour);
      }
    });

    const startWithMargin = minHour;
    const endWithMargin = maxHour;
    const totalHrs = endWithMargin - startWithMargin;
    
    return { 
      globalStartHour: startWithMargin, 
      globalEndHour: endWithMargin, 
      totalHours: totalHrs 
    };
  }, [days]);

  // 4. CALCULER DYNAMIQUEMENT LA LARGEUR D'UNE HEURE (RESPONSIVE)
  const HOUR_WIDTH = useMemo(() => {
    if (containerWidth === 0 || totalHours === 0) return 130;
    
    const availableWidth = containerWidth - STAGE_COLUMN_WIDTH - 32;
    const totalHoursWithMargins = totalHours + 1;
    const calculatedWidth = Math.max(availableWidth / totalHoursWithMargins, 80);
    
    return calculatedWidth;
  }, [containerWidth, totalHours]);

  const MARGIN_LEFT = HOUR_WIDTH / 2;
  const MARGIN_RIGHT = HOUR_WIDTH / 2;
  const MINUTE_WIDTH = HOUR_WIDTH / 60;
  const totalWidth = MARGIN_LEFT + totalHours * HOUR_WIDTH + MARGIN_RIGHT;

  // 5. GÉNÉRER LA BANDE HORAIRE (en pourcentage)
  const timelineHours = useMemo(() => {
    const hours = [];
    const marginLeftPercent = (MARGIN_LEFT / totalWidth) * 100;
    const contentWidthPercent = 100 - marginLeftPercent - ((MARGIN_RIGHT / totalWidth) * 100);
    
    for (let i = 0; i < totalHours; i++) {
      const hour = (globalStartHour + i) % 24;
      const relativePosition = (i / totalHours) * contentWidthPercent;
      hours.push({
        hour,
        label: `${hour.toString().padStart(2, '0')}:00`,
        position: marginLeftPercent + relativePosition,
      });
    }
    return hours;
  }, [globalStartHour, totalHours, HOUR_WIDTH, MARGIN_LEFT, MARGIN_RIGHT, totalWidth]);

  // Helpers pour position en pourcentage
  const getHourPositionPercent = (time: string) => {
    const [h, m] = time.split(':').map(Number);
    const hoursSinceStart = h >= globalStartHour ? h - globalStartHour : h + 24 - globalStartHour;
    const minutesSinceStart = hoursSinceStart * 60 + m;
    const totalMinutes = totalHours * 60;
    
    // Position en pourcentage : marge gauche + position relative
    const marginLeftPercent = (MARGIN_LEFT / totalWidth) * 100;
    const contentWidthPercent = 100 - marginLeftPercent - ((MARGIN_RIGHT / totalWidth) * 100);
    const relativePercent = (minutesSinceStart / totalMinutes) * contentWidthPercent;
    
    return marginLeftPercent + relativePercent;
  };

  const getDayAmplitude = (day: EventDay) => {
    const openPos = getHourPositionPercent(day.open_time);
    const closePos = getHourPositionPercent(day.close_time);
    return { openPos, closePos };
  };

  // Filtrer performances par jour et scène
  const getPerformancesForDayAndStage = (dayId: string, stageId: string) => {
    return performances.filter(
      (p) => p.event_day_id === dayId && p.stage_id === stageId
    );
  };

  if (days.length === 0 || stages.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
        Aucune donnée à afficher
      </div>
    );
  }

  return (
    <div ref={containerRef} className="w-full">
      <div className="relative w-full">
        {/* GRILLE PAR JOUR */}
        {days.map((day, dayIndex) => {
          const dayDate = new Date(day.date);
          const dayName = dayDate.toLocaleDateString('fr-FR', { weekday: 'long' }).toUpperCase();
          const dayNumber = dayDate.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
          const amplitude = getDayAmplitude(day);

          return (
            <div key={day.id} className="mb-8">
              {/* HEADER DU JOUR */}
              <div
                style={{
                  gridTemplateColumns: `${STAGE_COLUMN_WIDTH}px 1fr`,
                }}
                className="grid border-b border-gray-200 dark:border-gray-700 mb-2"
              >
                {/* Colonne 1 : Date et scène */}
                <div className="bg-white dark:bg-gray-800 p-3 border-r border-gray-200 dark:border-gray-700">
                  <div className="font-bold text-sm text-violet-600 dark:text-violet-400">
                    {dayName}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                    {dayNumber}
                  </div>
                </div>

                {/* Colonne 2 : Ligne des heures */}
                <div className="relative bg-gray-50 dark:bg-gray-900/50 h-16">
                  {timelineHours.map((th) => (
                    <div
                      key={th.hour}
                      style={{ left: `${th.position}%` }}
                      className="absolute top-0 bottom-0 flex flex-col items-center justify-center"
                    >
                      <div className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                        {th.label}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* GRILLE DES SCÈNES */}
              {sortedStages.map((stage, stageIndex) => {
                const stagePerformances = getPerformancesForDayAndStage(day.id, stage.id);

                return (
                  <div
                    key={`${day.id}-${stage.id}`}
                    style={{
                      gridTemplateColumns: `${STAGE_COLUMN_WIDTH}px 1fr`,
                      height: `${ROW_HEIGHT}px`,
                    }}
                    className="grid border-b border-gray-200 dark:border-gray-700"
                  >
                    {/* Colonne 1 : Nom de la scène */}
                    <div className="bg-white dark:bg-gray-800 p-3 flex flex-col justify-center border-r border-gray-200 dark:border-gray-700">
                      <div className="font-semibold text-sm text-gray-900 dark:text-white truncate">
                        {stage.name}
                      </div>
                      {stage.type && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 capitalize">
                          {stage.type.replace(/_/g, ' ')}
                        </div>
                      )}
                    </div>

                    {/* Colonne 2 : Timeline avec performances */}
                    <div className="relative bg-white dark:bg-gray-800">
                      {/* Fond de l'amplitude horaire */}
                      <div
                        style={{
                          left: `${amplitude.openPos}%`,
                          width: `${amplitude.closePos - amplitude.openPos}%`,
                        }}
                        className="absolute inset-y-0 bg-violet-100/50 dark:bg-violet-900/10"
                      />

                      {/* Lignes verticales des heures */}
                      {timelineHours.map((th) => (
                        <div
                          key={th.hour}
                          style={{ left: `${th.position}%` }}
                          className="absolute inset-y-0 w-px bg-gray-200 dark:bg-gray-700"
                        />
                      ))}

                      {/* Lignes épaisses open_time et close_time */}
                      <div
                        style={{ left: `${amplitude.openPos}%` }}
                        className="absolute inset-y-0 w-1 bg-violet-500 dark:bg-violet-400"
                      />
                      <div
                        style={{ left: `${amplitude.closePos}%` }}
                        className="absolute inset-y-0 w-1 bg-violet-500 dark:bg-violet-400"
                      />

                      {/* Cartes de performance */}
                      {stagePerformances.map((performance) => (
                        <ReadOnlyPerformanceCard
                          key={performance.id}
                          performance={performance}
                          day={day}
                          stage={stage}
                          stageIndex={0}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

