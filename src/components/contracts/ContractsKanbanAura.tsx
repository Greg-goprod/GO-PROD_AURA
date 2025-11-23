import React, { useState } from 'react';
import { DndContext, DragOverlay, closestCorners, DragEndEvent } from '@dnd-kit/core';
import type { Contract, ContractStatus } from '@/types/contracts';
import { KanbanBoard, KanbanColumnConfig, AuraColor } from '@/components/aura/KanbanBoard';
import { KanbanCard } from '@/components/aura/KanbanCard';
import { ContractCard } from './ContractCard';

export interface ContractsKanbanAuraProps {
  contracts: Contract[];
  onStatusChange: (contractId: string, newStatus: ContractStatus) => void;
  onView?: (contract: Contract) => void;
  onUpload?: (contract: Contract) => void;
  onSendEmail?: (contract: Contract) => void;
  onDelete?: (contract: Contract) => void;
}

/**
 * Configuration des colonnes Kanban avec couleurs AURA officielles
 * 
 * Mapping des statuts contrats → Couleurs AURA :
 * - to_receive → Taupe gray (neutre, en attente)
 * - review → Cobalt blue (en révision)
 * - internal_sign → Resolution Blue (action importante)
 * - internal_signed → Eminence (signature interne - violet AURA principal)
 * - external_sign → Purpureus (signature externe)
 * - finalized → Light green (succès)
 */
const getColumnColor = (status: ContractStatus): AuraColor => {
  const colorMap: Record<ContractStatus, AuraColor> = {
    to_receive: 'taupe',
    review: 'cobalt',
    internal_sign: 'resolution',
    internal_signed: 'eminence',
    external_sign: 'purpureus',
    finalized: 'lightgreen',
  };
  return colorMap[status] || 'taupe';
};

const columns: KanbanColumnConfig<ContractStatus>[] = [
  { id: 'to_receive', title: 'À recevoir', color: 'taupe' },
  { id: 'review', title: 'En relecture', color: 'cobalt' },
  { id: 'internal_sign', title: 'Signature interne', color: 'resolution' },
  { id: 'internal_signed', title: 'Signé interne', color: 'eminence' },
  { id: 'external_sign', title: 'Signature externe', color: 'purpureus' },
  { id: 'finalized', title: 'Finalisé', color: 'lightgreen' },
];

/**
 * Kanban Board AURA pour les Contrats
 * Utilise le système Kanban AURA unifié avec drag & drop
 */
export const ContractsKanbanAura: React.FC<ContractsKanbanAuraProps> = ({
  contracts,
  onStatusChange,
  onView,
  onUpload,
  onSendEmail,
  onDelete,
}) => {
  const [activeId, setActiveId] = useState<string | null>(null);

  const handleDragStart = (event: any) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) {
      setActiveId(null);
      return;
    }

    const contractId = active.id as string;
    const newStatus = over.id as ContractStatus;

    // Ne pas changer si c'est la même colonne
    const contract = contracts.find((c) => c.id === contractId);
    if (contract && contract.status !== newStatus) {
      onStatusChange(contractId, newStatus);
    }

    setActiveId(null);
  };

  const handleDragCancel = () => {
    setActiveId(null);
  };

  const activeContract = activeId ? contracts.find((c) => c.id === activeId) : null;

  return (
    <DndContext
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
      collisionDetection={closestCorners}
    >
      <div className="flex gap-4 h-[600px] pb-4 overflow-x-auto">
        <KanbanBoard
          columns={columns}
          items={contracts}
          getItemColumn={(contract) => contract.status}
          onMove={onStatusChange}
          enableDragAndDrop={true}
          minHeight="500px"
          renderCard={(contract) => (
            <KanbanCard id={contract.id} enableDrag={true}>
              <ContractCard
                contract={contract}
                onView={onView}
                onUpload={onUpload}
                onSendEmail={onSendEmail}
                onDelete={onDelete}
              />
            </KanbanCard>
          )}
        />
      </div>

      <DragOverlay>
        {activeContract ? (
          <div className="rotate-3">
            <ContractCard contract={activeContract} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};




