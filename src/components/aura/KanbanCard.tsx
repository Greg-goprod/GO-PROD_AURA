import React, { ReactNode } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { Card } from './Card';
import cn from 'classnames';

export interface KanbanCardProps {
  id: string;
  children: ReactNode;
  enableDrag?: boolean;
  className?: string;
}

/**
 * Composant Carte Kanban AURA
 * - Draggable (optionnel)
 * - Style uniforme avec Card AURA
 * - Hover et transitions
 */
export function KanbanCard({
  id,
  children,
  enableDrag = true,
  className = '',
}: KanbanCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id,
    disabled: !enableDrag,
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        opacity: isDragging ? 0.5 : 1,
      }
    : undefined;

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <Card
        className={cn(
          'p-3 shadow-sm hover:shadow-md transition-all',
          'border border-gray-200 dark:border-gray-700',
          enableDrag && 'cursor-grab active:cursor-grabbing',
          isDragging && 'shadow-2xl',
          className,
        )}
      >
        {children}
      </Card>
    </div>
  );
}




