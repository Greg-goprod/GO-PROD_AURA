import React from "react";
import type { Offer } from "./bookingTypes";
import { Button } from "@/components/aura/Button";

export function OffersListView({
  offers,
  onViewPdf,
  onSendOffer,
  onModify,
  onMove,
  onDelete,
}: {
  offers: any[];
  onViewPdf: (offer: Offer) => void;
  onSendOffer: (offer: Offer) => void;
  onModify: (offer: Offer) => void;
  onMove: (offerId: string, newStatus: any) => void;
  onDelete: (offer: Offer) => void;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead className="text-left text-gray-600 dark:text-gray-300">
          <tr>
            <th className="py-2 px-2">Artiste</th>
            <th className="py-2 px-2">Scène</th>
            <th className="py-2 px-2">Heure</th>
            <th className="py-2 px-2">Statut</th>
            <th className="py-2 px-2">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
          {offers.map((o:any) => (
            <tr key={o.id} className="text-gray-900 dark:text-gray-100">
              <td className="py-2 px-2">{o.artist_name || "—"}</td>
              <td className="py-2 px-2">{o.stage_name || "—"}</td>
              <td className="py-2 px-2">{o.performance_time ? String(o.performance_time).slice(0,5) : "—"}</td>
              <td className="py-2 px-2">{o.status || o.booking_status || "—"}</td>
              <td className="py-2 px-2 flex flex-wrap gap-2">
                {o.type !== "performance" ? (
                  <>
                    <Button size="sm" onClick={() => onViewPdf(o)}>PDF</Button>
                    <Button size="sm" onClick={() => onSendOffer(o)}>Envoyer</Button>
                    <Button size="sm" onClick={() => onModify(o)}>Modifier</Button>
                    <Button size="sm" variant="ghost" onClick={() => onMove(o.id, "accepted")}>Valider</Button>
                    <Button size="sm" variant="danger" onClick={() => onMove(o.id, "rejected")}>Rejeter</Button>
                    <Button size="sm" variant="ghost" onClick={() => onDelete(o)}>Supprimer</Button>
                  </>
                ) : (
                  <span className="text-gray-500">Perf.</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
