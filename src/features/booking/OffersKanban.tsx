import React from "react";
import type { Offer, OfferStatus } from "./bookingTypes";
import { KanbanBoard, KanbanColumnConfig } from "@/components/aura/KanbanBoard";
import type { AuraColor } from "@/components/aura/KanbanBoard";
import { Card } from "@/components/aura/Card";
import { Badge } from "@/components/aura/Badge";
import { Button } from "@/components/aura/Button";

type ColumnId = "draft_and_todo" | OfferStatus;

export type KanbanItem =
  | (Offer & { type?: "offer" })
  | {
      id: string;
      type: "performance";
      artist_name: string;
      stage_name: string;
      date_time?: string;
      performance_time?: string;
      duration?: number | null;
      status: "offre_a_faire" | "offre_rejetee";
      ready_to_send?: boolean;
      fee_amount?: number | null;
      fee_currency?: string | null;
      rejection_reason?: string | null;
    };

export interface OffersKanbanProps {
  columns: { id: ColumnId; title: string; offers: KanbanItem[] }[];
  onMove: (offerId: string, newStatus: ColumnId) => void;
  onQuickAction: (action: "create_offer", item: any) => void;
  onSendOffer: (offer: Offer) => void;
  onModifyOffer: (offer: Offer) => void;
  onValidateOffer: (offer: Offer) => void;
  onRejectOffer: (offer: Offer) => void;
  onDeleteOffer: (offerId: string) => void;
  onExportContract?: (offer: Offer) => void;
}

/**
 * Kanban Board AURA pour les Offres
 * Utilise le système Kanban AURA unifié avec les couleurs officielles
 */
export function OffersKanban({
  columns,
  onMove,
  onQuickAction,
  onSendOffer,
  onModifyOffer,
  onValidateOffer,
  onRejectOffer,
  onDeleteOffer,
  onExportContract,
}: OffersKanbanProps) {
  // Configuration des couleurs AURA pour chaque colonne
  const getColumnColor = (id: ColumnId): AuraColor => {
    if (id === "draft_and_todo") return "taupe";
    if (id === "ready_to_send") return "eminence";
    if (id === "sent") return "lightgreen";
    return "taupe";
  };

  // Transformer la config des colonnes
  const kanbanColumns: KanbanColumnConfig<ColumnId>[] = columns.map((col) => ({
    id: col.id,
    title: col.title,
    color: getColumnColor(col.id),
  }));

  // Flatten tous les items
  const allItems: (KanbanItem & { columnId: ColumnId })[] = columns.flatMap((col) =>
    col.offers.map((offer) => ({ ...offer, columnId: col.id }))
  );

  return (
    <KanbanBoard
      columns={kanbanColumns}
      items={allItems}
      getItemColumn={(item) => item.columnId}
      onMove={onMove}
      enableDragAndDrop={false}
      renderCard={(item) => {
        const isPerf = item.type === "performance";
        return (
          <Card className="p-3 shadow-sm hover:shadow-md transition-shadow border border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-900 dark:text-gray-100">
              <div className="font-medium text-gray-900 dark:text-gray-100">
                {item.artist_name || "—"}
              </div>
              <div className="text-gray-600 dark:text-gray-400 text-xs mt-1">
                {item.stage_name}{" "}
                {item.performance_time
                  ? `— ${String(item.performance_time).slice(0, 5)}`
                  : ""}
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5 mt-3">
              {isPerf ? (
                <>
                  <Button
                    size="sm"
                    onClick={() => {
                      console.log("🎯 Click 'Établir offre' - item:", item);
                      onQuickAction("create_offer", item);
                    }}
                    className="text-xs"
                  >
                    Établir offre
                  </Button>
                  {item.status === "offre_rejetee" && (
                    <Badge color="red">Rejeté (perf)</Badge>
                  )}
                </>
              ) : (
                <>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => onModifyOffer(item as Offer)}
                    className="text-xs"
                  >
                    Modifier
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => onSendOffer(item as Offer)}
                    className="text-xs"
                  >
                    Envoyer
                  </Button>
                  {onExportContract && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onExportContract(item as Offer)}
                      className="text-xs"
                    >
                      📄 Contrat
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="success"
                    onClick={() => onValidateOffer(item as Offer)}
                    className="text-xs"
                  >
                    Valider
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => onRejectOffer(item as Offer)}
                    className="text-xs"
                  >
                    Rejeter
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onDeleteOffer(item.id)}
                    className="text-xs"
                  >
                    Supprimer
                  </Button>
                </>
              )}
            </div>
          </Card>
        );
      }}
    />
  );
}




