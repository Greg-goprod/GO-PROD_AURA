import { useDraggable } from "@dnd-kit/core";
import { Edit2, Trash2, Clock } from "lucide-react";
import type { Performance, EventDay, EventStage } from "../timelineApi";
import { minToHHMM, hhmmToMin } from "../timelineApi";

interface PerformanceCardProps {
  performance: Performance;
  day: EventDay;
  stage: EventStage;
  stageIndex: number;
  onEdit: () => void;
  onDelete: () => void;
  onOpenTimePicker: () => void;
  isDragging: boolean;
  isInOverlay?: boolean; // Nouveau : indique si la carte est dans le DragOverlay
}

export function PerformanceCard({
  performance,
  stage,
  onEdit,
  onDelete,
  onOpenTimePicker,
  isInOverlay = false,
}: PerformanceCardProps) {
  // Ne pas appeler useDraggable si la carte est dans le DragOverlay
  const draggableHook = useDraggable({
    id: performance.id,
    data: {
      performance,
      event_day_id: performance.event_day_id,
      event_stage_id: performance.stage_id,
    },
    disabled: isInOverlay, // Désactiver le draggable dans l'overlay
  });
  
  const { attributes, listeners, setNodeRef, transform, isDragging: isDraggingDnd } = isInOverlay 
    ? { attributes: {}, listeners: {}, setNodeRef: () => {}, transform: null, isDragging: false }
    : draggableHook;

  // Couleurs AURA selon le statut
  const getStatusStyles = (status: string) => {
    switch (status) {
      case "idee":
      case "offre_a_faire":
        return {
          bg: "bg-white dark:bg-gray-800",
          border: "border-2 border-orange-400 dark:border-orange-500",
          text: "text-gray-900 dark:text-gray-100",
          amount: "text-orange-600 dark:text-orange-400"
        };
      case "offre_envoyee":
      case "sent":
        return {
          bg: "bg-blue-50 dark:bg-blue-900/20",
          border: "border border-blue-300 dark:border-blue-600",
          text: "text-blue-900 dark:text-blue-100",
          amount: "text-blue-600 dark:text-blue-400"
        };
      case "offre_validee":
      case "accepted":
        return {
          bg: "bg-green-50 dark:bg-green-900/20",
          border: "border border-green-400 dark:border-green-600",
          text: "text-green-900 dark:text-green-100",
          amount: "text-green-600 dark:text-green-400"
        };
      case "offre_rejetee":
      case "rejected":
        return {
          bg: "bg-red-50 dark:bg-red-900/20",
          border: "border border-red-400 dark:border-red-600",
          text: "text-red-900 dark:text-red-100",
          amount: "text-red-600 dark:text-red-400"
        };
      default:
        return {
          bg: "bg-gray-50 dark:bg-gray-800",
          border: "border border-gray-300 dark:border-gray-600",
          text: "text-gray-900 dark:text-gray-100",
          amount: "text-gray-600 dark:text-gray-400"
        };
    }
  };

  const styles = getStatusStyles(performance.booking_status);

  // Calculer l'heure de fin
  const startMinutes = hhmmToMin(performance.performance_time);
  const endMinutes = startMinutes + performance.duration;
  const endTime = minToHHMM(endMinutes);

  // Le positionnement est géré par le conteneur parent (TimelineGrid)
  // On ne gère ici que le drag & drop
  const style = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    zIndex: isDraggingDnd ? 1000 : 1,
    width: '100%',
    height: '100%',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        rounded-xl cursor-move select-none
        ${styles.bg} ${styles.border} ${styles.text}
        ${isDraggingDnd ? 'shadow-xl' : 'hover:shadow-md'}
        transition-all duration-200 overflow-hidden
      `}
      {...listeners}
      {...attributes}
      title={`${performance.artist_name} – ${performance.performance_time} → ${endTime}, Durée: ${performance.duration} min, Scène: ${stage.name}${performance.fee_amount ? `, Cachet: ${performance.fee_amount} ${performance.fee_currency || ''}` : ''}, Statut: ${performance.booking_status}`}
    >
      <div className="p-2 h-full flex flex-col">
        {/* Nom de l'artiste */}
        <div className={`font-bold text-xs uppercase truncate mb-1 ${styles.text}`}>
          {performance.artist_name}
        </div>

        {/* Horaire de passage et icônes d'actions sur la même ligne */}
        <div className="flex items-center justify-between gap-2">
          <div className="text-xs opacity-70">
            {performance.performance_time.substring(0, 5)}
          </div>
          
          <div className="flex items-center gap-0.5" 
            onPointerDown={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <button
              className="p-1 rounded hover:bg-black/10 dark:hover:bg-white/10 transition-colors cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                onOpenTimePicker();
              }}
              onPointerDown={(e) => e.stopPropagation()}
              title="Modifier l'heure"
            >
              <Clock className="w-3 h-3 opacity-60 hover:opacity-100" />
            </button>
            <button
              className="p-1 rounded hover:bg-black/10 dark:hover:bg-white/10 transition-colors cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              onPointerDown={(e) => e.stopPropagation()}
              title="Modifier"
            >
              <Edit2 className="w-3 h-3 opacity-60 hover:opacity-100" />
            </button>
            <button
              className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              onPointerDown={(e) => e.stopPropagation()}
              title="Supprimer"
            >
              <Trash2 className="w-3 h-3 text-red-600 dark:text-red-400 opacity-60 hover:opacity-100" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
