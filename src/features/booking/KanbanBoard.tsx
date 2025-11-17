import React from "react";
import type { Offer, OfferStatus } from "./bookingTypes";
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

export function KanbanBoard({
  columns,
  onMove,
  onQuickAction,
  onSendOffer,
  onModifyOffer,
  onValidateOffer,
  onRejectOffer,
  onDeleteOffer,
  onExportContract,
}: {
  columns: { id: ColumnId; title: string; offers: KanbanItem[] }[];
  onMove: (offerId: string, newStatus: ColumnId) => void;
  onQuickAction: (action: "create_offer", item: any) => void;
  onSendOffer: (offer: Offer) => void;
  onModifyOffer: (offer: Offer) => void;
  onValidateOffer: (offer: Offer) => void;
  onRejectOffer: (offer: Offer) => void;
  onDeleteOffer: (offerId: string) => void;
  onExportContract?: (offer: Offer) => void;
}) {
  const color = (id: ColumnId) =>
    id === "draft_and_todo" ? "gray" : id === "ready_to_send" ? "blue" : id === "sent" ? "yellow" : id === "accepted" ? "green" : "red";

  const getColumnStyle = (id: ColumnId) => {
    const baseStyle = "border border-dashed rounded-lg p-2 min-h-[200px]";
    // Utilise les mêmes couleurs que les cartes artistes (card-surface)
    // Mode clair: blanc avec bordure grise, Mode sombre: bleu-gris foncé avec bordure bleu-gris
    return `${baseStyle} bg-white dark:bg-[#161C31] border-gray-200 dark:border-[#24304A]`;
  };

  const getHeaderStyle = (id: ColumnId) => {
    const baseStyle = "flex items-center justify-between p-3 rounded-lg border";
    // Utilise les mêmes couleurs que les cartes artistes (card-surface)
    // Mode clair: blanc avec bordure grise, Mode sombre: bleu-gris foncé avec bordure bleu-gris
    return `${baseStyle} bg-white dark:bg-[#161C31] border-gray-200 dark:border-[#24304A]`;
  };
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {columns.map((col) => (
        <div key={col.id} className="space-y-3">
          {/* Header de colonne plus contrasté */}
          <div className={getHeaderStyle(col.id)}>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">{col.title}</h3>
            <Badge color={color(col.id)}>{col.offers.length}</Badge>
          </div>
          
          {/* Zone de contenu avec bordure plus marquée */}
          <div className={`space-y-3 ${getColumnStyle(col.id)}`}>
            {col.offers.map((item: any) => {
              const isPerf = item.type === "performance";
              return (
                <Card key={item.id} className="p-3 shadow-sm hover:shadow-md transition-shadow border border-gray-200 dark:border-gray-700">
                  <div className="text-sm text-gray-900 dark:text-gray-100">
                    <div className="font-medium text-gray-900 dark:text-gray-100">{item.artist_name || "—"}</div>
                    <div className="text-gray-600 dark:text-gray-400 text-xs mt-1">
                      {item.stage_name} {item.performance_time ? `— ${String(item.performance_time).slice(0, 5)}` : ""}
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
                        {item.status === "offre_rejetee" && <Badge color="red">Rejeté (perf)</Badge>}
                      </>
                    ) : (
                      <>
                        <Button size="sm" variant="secondary" onClick={() => onModifyOffer(item)} className="text-xs">Modifier</Button>
                        <Button size="sm" onClick={() => onSendOffer(item)} className="text-xs">Envoyer</Button>
                        {onExportContract && (
                          <Button size="sm" variant="ghost" onClick={() => onExportContract(item)} className="text-xs">📄 Contrat</Button>
                        )}
                        <Button size="sm" variant="success" onClick={() => onValidateOffer(item)} className="text-xs">Valider</Button>
                        <Button size="sm" variant="danger" onClick={() => onRejectOffer(item)} className="text-xs">Rejeter</Button>
                        <Button size="sm" variant="ghost" onClick={() => onDeleteOffer(item.id)} className="text-xs">Supprimer</Button>
                      </>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
