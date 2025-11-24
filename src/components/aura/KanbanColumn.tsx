import React, { ReactNode } from 'react';
import { useDroppable } from '@dnd-kit/core';
import cn from 'classnames';
import { AURA_KANBAN_COLORS } from './kanbanColors';
import type { AuraColor } from './kanbanColors';

export interface KanbanColumnProps {
  id: string;
  title: string;
  color: AuraColor;
  count: number;
  children: ReactNode;
  minHeight?: string;
  enableDrop?: boolean;
}

/**
 * Composant Colonne Kanban AURA
 * - Header avec couleur AURA officielle
 * - Badge de comptage
 * - Zone droppable (optionnel)
 * - Background léger avec bordure
 */
export function KanbanColumn({
  id,
  title,
  color,
  count,
  children,
  minHeight = '200px',
  enableDrop = true,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id,
    disabled: !enableDrop,
  });

  const colorConfig = AURA_KANBAN_COLORS[color];

  const headerStyle = {
    backgroundColor: colorConfig.hex,
    borderColor: colorConfig.hex,
  };

  const columnStyle = {
    backgroundColor: colorConfig.bg,
    borderColor: colorConfig.border,
    minHeight,
  };

  return (
    <div className="space-y-3">
      {/* Header de colonne avec couleur AURA */}
      <div
        className="flex items-center justify-between p-3 rounded-lg border-2"
        style={headerStyle}
      >
        <h3 className={`font-semibold text-sm ${colorConfig.text}`}>
          {title}
        </h3>
        <div className={`px-2.5 py-0.5 rounded-full ${colorConfig.badgeBg} backdrop-blur-sm`}>
          <span className={`font-bold text-xs ${colorConfig.text}`}>
            {count}
          </span>
        </div>
      </div>

      {/* Zone de contenu */}
      <div
        ref={setNodeRef}
        className={cn(
          'space-y-3 border-2 border-dashed rounded-lg p-3 transition-all',
          isOver && enableDrop && 'ring-4 ring-opacity-30',
        )}
        style={{
          ...columnStyle,
          ...(isOver && enableDrop && { ringColor: colorConfig.hex }),
        }}
      >
        {children}
      </div>
    </div>
  );
}




