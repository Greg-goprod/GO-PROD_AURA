import React, { useState, ReactNode } from 'react';
import { DndContext, DragOverlay, closestCorners, DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import { KanbanColumn } from './KanbanColumn';
import { AuraColor, AURA_KANBAN_COLORS } from './kanbanColors';

// Réexporter pour la rétrocompatibilité
export { AuraColor, AURA_KANBAN_COLORS } from './kanbanColors';

export interface KanbanColumnConfig<T extends string = string> {
  id: T;
  title: string;
  color: AuraColor;
}

export interface KanbanItem {
  id: string;
  [key: string]: any;
}

export interface KanbanBoardProps<TColumnId extends string, TItem extends KanbanItem> {
  columns: KanbanColumnConfig<TColumnId>[];
  items: TItem[];
  getItemColumn: (item: TItem) => TColumnId;
  onMove?: (itemId: string, newColumnId: TColumnId) => void;
  renderCard: (item: TItem) => ReactNode;
  enableDragAndDrop?: boolean;
  minHeight?: string;
  className?: string;
}

/**
 * Composant Kanban Board AURA générique
 * 
 * @example
 * ```tsx
 * <KanbanBoard
 *   columns={[
 *     { id: 'draft', title: 'Brouillon', color: 'taupe' },
 *     { id: 'ready', title: 'Prêt', color: 'eminence' },
 *     { id: 'sent', title: 'Envoyé', color: 'lightgreen' },
 *   ]}
 *   items={offers}
 *   getItemColumn={(offer) => offer.status}
 *   onMove={(id, newStatus) => handleMove(id, newStatus)}
 *   renderCard={(offer) => <OfferCard offer={offer} />}
 *   enableDragAndDrop
 * />
 * ```
 */
export function KanbanBoard<TColumnId extends string, TItem extends KanbanItem>({
  columns,
  items,
  getItemColumn,
  onMove,
  renderCard,
  enableDragAndDrop = true,
  minHeight = '200px',
  className = '',
}: KanbanBoardProps<TColumnId, TItem>) {
  const [activeId, setActiveId] = useState<string | null>(null);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) {
      setActiveId(null);
      return;
    }

    const itemId = active.id as string;
    const newColumnId = over.id as TColumnId;

    // Ne pas changer si c'est la même colonne
    const item = items.find((i) => i.id === itemId);
    if (item && getItemColumn(item) !== newColumnId && onMove) {
      onMove(itemId, newColumnId);
    }

    setActiveId(null);
  };

  const handleDragCancel = () => {
    setActiveId(null);
  };

  const activeItem = activeId ? items.find((i) => i.id === activeId) : null;

  const content = (
    <div className={`grid grid-cols-1 md:grid-cols-${columns.length} gap-4 ${className}`}>
      {columns.map((column) => {
        const columnItems = items.filter((item) => getItemColumn(item) === column.id);
        return (
          <KanbanColumn
            key={column.id}
            id={column.id}
            title={column.title}
            color={column.color}
            count={columnItems.length}
            minHeight={minHeight}
            enableDrop={enableDragAndDrop}
          >
            {columnItems.map((item) => (
              <div key={item.id}>{renderCard(item)}</div>
            ))}
          </KanbanColumn>
        );
      })}
    </div>
  );

  if (enableDragAndDrop && onMove) {
    return (
      <DndContext
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
        collisionDetection={closestCorners}
      >
        {content}

        <DragOverlay>
          {activeItem ? (
            <div className="rotate-3 opacity-80">{renderCard(activeItem)}</div>
          ) : null}
        </DragOverlay>
      </DndContext>
    );
  }

  return content;
}




