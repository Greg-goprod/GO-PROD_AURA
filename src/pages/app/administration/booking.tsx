/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardHeader, CardBody } from "@/components/aura/Card";
import { Button } from "@/components/aura/Button";
import { Badge } from "@/components/aura/Badge";
import { Modal } from "@/components/aura/Modal";
import { PageHeader } from "@/components/aura/PageHeader";
import { useToast } from "@/components/aura/ToastProvider";
import { ConfirmDeleteModal } from "@/components/ui/ConfirmDeleteModal";
import { Settings, Plus, Calendar, Eye, Send, Edit } from "lucide-react";

// import { OffersKanban } from "@/features/booking/OffersKanban"; // TEMPORAIRE: Kanban supprimé
import { OffersListView } from "@/features/booking/OffersListView";
import { OfferComposer } from "@/features/booking/modals/OfferComposer";
import { SendOfferModal } from "@/features/booking/modals/SendOfferModal";
import { RejectOfferModal } from "@/features/booking/modals/RejectOfferModal";
import { PerformanceModal } from "@/features/booking/modals/PerformanceModal";

import type { Offer, OfferFilters, OfferSort, OfferStatus } from "@/features/booking/bookingTypes";
import {
  listOffers, moveOffer, getTodoPerformances, getRejectedPerformances,
  prepareOfferPdfPath, createSignedOfferPdfUrl, deleteOffer, generateOfferPdfOnStatusChange
} from "@/features/booking/bookingApi";
import { listOfferClauses, listOfferPayments } from "@/features/booking/advancedBookingApi";
import { generateContractPdfWithClauses, downloadPDF } from "@/features/booking/pdfGenerator";
import { sendOfferEmail } from "@/services/emailService";
import { getCurrentCompanyId } from "@/lib/tenant";
import { supabase } from "@/lib/supabaseClient";
import { fetchPerformancePrefill } from "@/features/booking/utils/performancePrefill";

// Simple error box to avoid white screen
function ErrorBox({ error }: { error: any }) {
  if (!error) return null;
  return (
    <div className="p-3 rounded-md border border-red-300 bg-red-50 text-red-800 dark:bg-red-900/30 dark:border-red-700 dark:text-red-200">
      <div className="font-semibold mb-1">Erreur d'affichage</div>
      <pre className="text-xs overflow-auto">{String(error?.message || error)}</pre>
    </div>
  );
}

// DEMO DATA (hors du composant pour éviter les re-créations)
const demoOffers: any[] = [
  { id:"o1", company_id:"c1", event_id:"e1", artist_id:"a1", stage_id:"s1", status:"draft", artist_name:"Artist Alpha", stage_name:"Main", amount_display: 2000, currency:"EUR" },
  { id:"o2", company_id:"c1", event_id:"e1", artist_id:"a2", stage_id:"s2", status:"ready_to_send", artist_name:"Bravo", stage_name:"Club", amount_display: 1500, currency:"EUR" },
  { id:"o3", company_id:"c1", event_id:"e1", artist_id:"a3", stage_id:"s1", status:"sent", artist_name:"Charlie", stage_name:"Main", amount_display: 2500, currency:"EUR" },
  { id:"o4", company_id:"c1", event_id:"e1", artist_id:"a4", stage_id:"s3", status:"accepted", artist_name:"Delta", stage_name:"Acoustic", amount_display: 1800, currency:"EUR" },
  { id:"o5", company_id:"c1", event_id:"e1", artist_id:"a5", stage_id:"s2", status:"rejected", artist_name:"Echo", stage_name:"Club", amount_display: 1200, currency:"EUR" },
];
const demoTodo: any[] = [
  { performance_id:"p1", event_day_date:"2025-08-20", performance_time:"20:30", duration:60, artist_name:"Zeta", stage_name:"Main" },
];
const demoRejected: any[] = [
  { performance_id:"p2", event_day_date:"2025-08-21", performance_time:"22:00", duration:45, artist_name:"Yankee", stage_name:"Club", rejection_reason:"Budget" },
];

export default function AdminBookingPage() {
  // TOUS les hooks DOIVENT être appelés dans le même ordre à chaque render
  const { success: toastSuccess, error: toastError } = useToast();
  const navigate = useNavigate();
  
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [demoMode, setDemoMode] = useState(false);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [todoPerfs, setTodoPerfs] = useState<any[]>([]);
  const [rejectedPerfs, setRejectedPerfs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<OfferFilters>({});
  const [sort, setSort] = useState<OfferSort>({ field: "created_at", direction: "desc" });
  const [showComposer, setShowComposer] = useState(false);
  const [prefilledOfferData, setPrefilledOfferData] = useState<any>(null);
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [showSendModal, setShowSendModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showPerformanceModal, setShowPerformanceModal] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
  const [selectedPerformance, setSelectedPerformance] = useState<any>(null);
  const [deletingOffer, setDeletingOffer] = useState<Offer | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [renderError, setRenderError] = useState<any>(null);

  // Valeurs calculées directement (PAS de hooks conditionnels)
  const eventId =
    localStorage.getItem("selected_event_id") ||
    localStorage.getItem("current_event_id") ||
    "";
  const hasEvent = Boolean(eventId);

  // Initialiser demoMode au premier render
  useEffect(() => {
    if (!hasEvent) {
      setDemoMode(true);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Récupération du company_id
  useEffect(() => {
    (async () => {
      try {
        const cid = await getCurrentCompanyId(supabase);
        console.log("[COMPANY] Company ID récupéré:", cid);
        setCompanyId(cid);
      } catch (e) {
        console.error('[ERROR] Erreur récupération company_id:', e);
        // Fallback vers localStorage si getCurrentCompanyId échoue
        const fallbackId = localStorage.getItem("company_id") || 
                          localStorage.getItem("auth_company_id") || 
                          "00000000-0000-0000-0000-000000000000";
        console.log("[COMPANY] Company ID fallback:", fallbackId);
        setCompanyId(fallbackId);
      }
    })();
  }, []);

  // Fonction pour charger les offres
  const loadOffers = useCallback(async () => {
    if (demoMode) {
      // Pas d'appels RPC en mode démo
      setOffers(demoOffers as any);
      setTodoPerfs(demoTodo as any);
      setRejectedPerfs(demoRejected as any);
      return;
    }
    if (!hasEvent) return;

    try {
      setRenderError(null);
      setLoading(true);
      const [o, t, r] = await Promise.all([
        listOffers({ eventId, filters, sort, limit: 300, offset: 0 }),
        getTodoPerformances(eventId),
        getRejectedPerformances(eventId),
      ]);
      setOffers(o || []);
      setTodoPerfs(t || []);
      setRejectedPerfs(r || []);
    } catch (e:any) {
      console.error("[Booking] load error", e);
      toastError(e?.message || "Erreur de chargement Booking");
      setRenderError(e);
    } finally {
      setLoading(false);
    }
  }, [demoMode, hasEvent, eventId, filters, sort, toastError]);

  useEffect(() => {
    loadOffers();
  }, [loadOffers]);

  // 🔄 Rafraîchissement automatique au retour sur la page
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('[REFRESH] Page visible - Rechargement des données...');
        loadOffers();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [loadOffers]);

  // 🔴 SUPABASE REALTIME - Écoute des changements en temps réel
  useEffect(() => {
    if (!eventId || demoMode) return;

    console.log('[REALTIME] REALTIME activé pour event:', eventId);

    const channel = supabase
      .channel(`booking-realtime-${eventId}`)
      // Écouter les changements sur artist_performances
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'artist_performances',
          filter: `event_id=eq.${eventId}`,
        },
        (payload) => {
          console.log('[REALTIME] [performances] -', payload.eventType, payload);
          loadOffers();
        }
      )
      // Écouter les changements sur offers
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'offers',
          filter: `event_id=eq.${eventId}`,
        },
        (payload) => {
          console.log('[REALTIME] [offers] -', payload.eventType, payload);
          loadOffers();
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('[REALTIME] Connecté');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('[REALTIME] Erreur de connexion');
        }
      });

    // Cleanup au unmount
    return () => {
      console.log('[REALTIME] Désinscription');
      supabase.removeChannel(channel);
    };
  }, [eventId, demoMode, loadOffers]);

  const offreAFaireItems = useMemo(() => {
    return (todoPerfs || []).map((perf: any) => ({
      id: perf.id, // Déjà préfixé avec 'perf_' par la fonction RPC
      type: "performance",
      artist_id: perf.artist_id,
      artist_name: perf.artist_name,
      stage_id: perf.stage_id,
      stage_name: perf.stage_name,
      date_time: perf.date_time,
      performance_time: perf.performance_time,
      duration: perf.duration,
      fee_amount: perf.fee_amount,
      fee_currency: perf.fee_currency,
      status: "offre_a_faire",
      ready_to_send: false,
    }));
  }, [todoPerfs]);

  const rejectedPerfItems = useMemo(() => {
    return (rejectedPerfs || []).map((perf: any) => ({
      id: perf.id, // Déjà préfixé avec 'perf_' par la fonction RPC
      type: "performance",
      artist_id: perf.artist_id,
      artist_name: perf.artist_name,
      stage_id: perf.stage_id,
      stage_name: perf.stage_name,
      date_time: perf.date_time,
      performance_time: perf.performance_time,
      duration: perf.duration,
      rejection_reason: perf.rejection_reason,
      rejection_date: perf.rejection_date,
      status: "offre_rejetee",
      ready_to_send: false,
    }));
  }, [rejectedPerfs]);

  const kanbanColumns = useMemo(() => {
    const draftOffers = offers.filter((o) => o.status === "draft");
    const ready = offers.filter((o) => o.status === "ready_to_send");
    const sent = offers.filter((o) => o.status === "sent");
    return [
      { id: "draft_and_todo", title: "Brouillon / À faire", offers: [...(offreAFaireItems as any[]), ...draftOffers] },
      { id: "ready_to_send", title: "Prêt à envoyer", offers: ready },
      { id: "sent", title: "Envoyé", offers: sent },
    ] as any;
  }, [offers, offreAFaireItems]);

  const acceptedOffers = useMemo(() => {
    return offers.filter((o) => o.status === "accepted");
  }, [offers]);

  const rejectedOffers = useMemo(() => {
    return [
      ...offers.filter((o) => o.status === "rejected"),
      ...(rejectedPerfItems as any[]),
    ];
  }, [offers, rejectedPerfItems]);

  const closedOffers = useMemo(() => {
    return [...acceptedOffers, ...rejectedOffers];
  }, [acceptedOffers, rejectedOffers]);

  const activeOffers = useMemo(() => {
    return offers.filter((o) => o.status !== "accepted" && o.status !== "rejected");
  }, [offers]);

  async function handleMove(offerId: string, newStatus: OfferStatus | "draft_and_todo") {
    try {
      if (newStatus === "draft_and_todo") return;
      if (demoMode) {
        setOffers(prev => prev.map(o => o.id === offerId ? { ...o, status: newStatus as OfferStatus } : o));
        return;
      }
      const updated = await moveOffer(offerId, newStatus as OfferStatus);
      setOffers((prev) => prev.map((o) => (o.id === updated.id ? { ...o, status: updated.status, rejection_reason: updated.rejection_reason } : o)));
      toastSuccess("Statut mis à jour");
    } catch (e:any) {
      console.error(e);
      toastError(e?.message || "Transition non autorisée");
    }
  }

  async function handleQuickAction(action: "create_offer", item: any) {
    if (action !== "create_offer") return;
    
    console.log("[ACTION] handleQuickAction - item:", item);
    
    // Extraire le performance_id depuis l'id (format: "perf_XXX")
    const performanceId = item.performance_id
      || (typeof item.id === "string" && item.id.startsWith("perf_") ? item.id.replace("perf_", "") : null);
    
    if (!performanceId) {
      toastError("ID de performance manquant");
      console.error("[ERROR] performanceId manquant depuis item.id:", item.id);
      return;
    }
    
    try {
      const effectivePerformanceId = performanceId;
      const prefill = await fetchPerformancePrefill(effectivePerformanceId);
      if (!prefill) {
        toastError("Performance introuvable");
        return;
      }
      console.log("[OK] Performance complète récupérée:", prefill);
      setPrefilledOfferData(prefill);
      setShowComposer(true);
    } catch (e: any) {
      console.error("[ERROR] Erreur récupération performance:", e);
      toastError(e?.message || "Erreur lors de la récupération de la performance");
    }
  }

  async function handleSendOffer(offer: Offer) {
    // Ouvrir le modal d'envoi au lieu de marquer directement
    handleSendOfferModal(offer);
  }

  async function handleViewPdf(offer: Offer) {
    try {
      if (demoMode) { toastError("PDF indisponible en mode démo"); return; }
      let target = offer;
      if (!offer.pdf_storage_path) target = await prepareOfferPdfPath(offer.id);
      const url = await createSignedOfferPdfUrl(target.pdf_storage_path);
      if (!url) return toastError("Aucun PDF disponible");
      setPdfUrl(url);
      setShowPdfModal(true);
    } catch (e:any) {
      console.error(e);
      toastError(e?.message || "Impossible d'ouvrir le PDF");
    }
  }

  function handleDelete(offerId: string) {
    const offer = offers.find(o => o.id === offerId);
    if (offer) {
      setDeletingOffer(offer);
    }
  }

  async function handleConfirmDeleteOffer() {
    if (!deletingOffer) return;

    setDeleting(true);
    try {
      if (demoMode) {
        setOffers(prev => prev.filter(o => o.id !== deletingOffer.id));
        toastSuccess("Offre supprimée (démo)");
      } else {
        await deleteOffer(deletingOffer.id);
        setOffers((prev) => prev.filter((o) => o.id !== deletingOffer.id));
        toastSuccess("Offre supprimée");
      }
      setDeletingOffer(null);
    } catch (e:any) {
      console.error(e);
      toastError(e?.message || "Erreur suppression");
    } finally {
      setDeleting(false);
    }
  }

  // Nouveaux handlers pour les modaux
  async function handleSendOfferModal(offer: Offer) {
    setSelectedOffer(offer);
    setShowSendModal(true);
  }

  async function handleRejectOfferModal(offer: Offer) {
    setSelectedOffer(offer);
    setShowRejectModal(true);
  }

  async function handlePerformanceModal(performance?: any) {
    console.log("🎭 Ouverture modal performance");
    console.log("   - companyId:", companyId);
    console.log("   - eventId:", eventId);
    console.log("   - performance:", performance);
    
    if (!companyId) {
      toastError("Company ID manquant. Impossible d'ouvrir le modal.");
      return;
    }
    
    if (!eventId) {
      toastError("Aucun événement sélectionné. Impossible d'ouvrir le modal.");
      return;
    }
    
    setSelectedPerformance(performance || null);
    setShowPerformanceModal(true);
  }

  async function handleExportContract(offer: Offer) {
    if (demoMode) {
      toastError("Export PDF indisponible en mode démo");
      return;
    }
    
    if (!companyId) {
      toastError("Company ID manquant");
      return;
    }
    
    try {
      toastSuccess("Génération du contrat...");
      
      // Charger les clauses et paiements
      const [clauses, payments] = await Promise.all([
        listOfferClauses(companyId),
        listOfferPayments(offer.id),
      ]);
      
      // Filtrer les clauses activées par défaut
      const enabledClauses = clauses.filter(c => c.default_enabled);
      
      // Générer le PDF
      const pdfBytes = await generateContractPdfWithClauses({
        offer,
        clauses: enabledClauses,
        payments,
        companyInfo: {
          name: "Go-Prod HQ", // TODO: Récupérer depuis la base
          address: "Votre adresse",
          email: "contact@goprod.com",
          phone: "+33 1 23 45 67 89",
        },
      });
      
      // Télécharger le PDF
      const filename = `Contrat_${offer.artist_name?.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
      downloadPDF(pdfBytes, filename);
      
      toastSuccess("Contrat téléchargé !");
    } catch (e: any) {
      console.error("Erreur génération contrat:", e);
      toastError(e?.message || "Erreur génération du contrat");
    }
  }

  // TODO: Implement email sending functionality
  // @ts-expect-error - Fonction TODO non utilisée pour le moment
  // eslint-disable-next-line no-unused-vars
  async function _handleSendOfferEmail(data: {
    email: string; ccEmails?: string[]; sender: { name:string; email:string; label?:string };
    recipientFirstName?: string; validityDate?: string; customMessage?: string;
  }) {
    if (!selectedOffer) return;
    
    try {
      // 1. Générer PDF si nécessaire
      if (!selectedOffer.pdf_storage_path) {
        await generateOfferPdfOnStatusChange(selectedOffer.id);
        // Recharger l'offre pour avoir le pdf_storage_path
        const updatedOffers = await listOffers({ eventId, filters, sort });
        const updatedOffer = updatedOffers.find(o => o.id === selectedOffer.id);
        if (updatedOffer) setSelectedOffer(updatedOffer);
      }

      // 2. Créer URL signée
      const pdfUrl = await createSignedOfferPdfUrl(selectedOffer.pdf_storage_path);
      if (!pdfUrl) throw new Error("Impossible de générer l'URL du PDF");

      // 3. Envoyer email (API simplifiée)
      const subject = `Offre artiste - ${selectedOffer.artist_name || 'Artiste'}`;
      const message = `
Bonjour ${data.recipientFirstName || ''},

Veuillez trouver ci-joint l'offre pour ${selectedOffer.artist_name || 'l\'artiste'}.
${data.customMessage || ''}

Valable jusqu'au: ${data.validityDate || 'Non précisé'}

Télécharger l'offre: ${pdfUrl}

Cordialement,
${data.sender.name}
      `.trim();

      await sendOfferEmail({
        to: data.email,
        subject,
        message,
        pdfPath: selectedOffer.pdf_storage_path || '',
        offerData: {
          artist_name: selectedOffer.artist_name || 'Artiste',
          stage_name: selectedOffer.stage_name || 'Stage',
          amount_display: selectedOffer.amount_display ?? null,
          currency: selectedOffer.currency ?? null,
        },
      });

      // 4. Marquer comme envoyé
      await moveOffer(selectedOffer.id, "sent");
      setOffers(prev => prev.map(o => o.id === selectedOffer.id ? { ...o, status: "sent" } : o));
      
      toastSuccess("Offre envoyée par email");
      setShowSendModal(false);
      setSelectedOffer(null);
    } catch (e: any) {
      console.error("Erreur envoi email:", e);
      toastError(e?.message || "Erreur envoi email");
    }
  }

  async function handleRejectOffer(reason: string) {
    if (!selectedOffer) return;
    
    try {
      await moveOffer(selectedOffer.id, "rejected", reason);
      setOffers(prev => prev.map(o => o.id === selectedOffer.id ? { ...o, status: "rejected", rejection_reason: reason } : o));
      toastSuccess("Offre rejetée");
      setShowRejectModal(false);
      setSelectedOffer(null);
    } catch (e: any) {
      console.error("Erreur rejet:", e);
      toastError(e?.message || "Erreur rejet offre");
    }
  }

  // TODO: Implement performance save functionality
  // @ts-expect-error - Fonction TODO non utilisée pour le moment
  // eslint-disable-next-line no-unused-vars
  async function _handleSavePerformance(perf: any) {
    try {
      // TODO: Implémenter la sauvegarde de performance
      console.log("Sauvegarde performance:", perf);
      toastSuccess("Performance sauvegardée");
      setShowPerformanceModal(false);
      setSelectedPerformance(null);
    } catch (e: any) {
      console.error("Erreur sauvegarde:", e);
      toastError(e?.message || "Erreur sauvegarde performance");
    }
  }
  
  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Booking"
        actions={
          <>
            <Button
              variant="ghost"
              onClick={() => navigate('/app/settings/admin')}
            >
              <Settings className="w-4 h-4 mr-1" />
              Paramètres
            </Button>
            <Button
              variant="primary"
              onClick={() => handlePerformanceModal()}
            >
              <Plus className="w-4 h-4 mr-1" />
              Ajouter une performance
            </Button>
            <Button
              onClick={() => window.open('/app/booking/timeline', '_blank')}
            >
              <Calendar className="w-4 h-4 mr-1" />
              Timeline
            </Button>
            <input
              className="px-3 py-2 rounded border dark:bg-gray-900 dark:border-gray-800 dark:text-gray-100"
              placeholder="Recherche (artiste, scène)"
              onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value || undefined }))}
            />
            <select
              className="px-3 py-2 rounded border dark:bg-gray-900 dark:border-gray-800 dark:text-gray-100"
              defaultValue="desc"
              onChange={(e) => setSort((s) => ({ ...s, direction: e.target.value as "asc" | "desc" }))}
            >
              <option value="desc">Plus récent</option>
              <option value="asc">Plus ancien</option>
            </select>
            <Button variant={demoMode ? "success" : "secondary"} onClick={() => setDemoMode(d => !d)}>
              {demoMode ? "Mode Démo ON" : "Mode Démo OFF"}
            </Button>
          </>
        }
      />

      {!hasEvent && !demoMode && (
        <Card>
          <CardBody>
            <div className="text-gray-700 dark:text-gray-300">
              Aucun événement sélectionné. Tu peux soit activer le <b>Mode Démo</b> (bouton en haut), soit définir un <code>selected_event_id</code>.
            </div>
            <div className="mt-2 text-xs text-gray-500">
              DevTools:&nbsp;<code>localStorage.setItem("selected_event_id","UUID-EVENT")</code>
            </div>
          </CardBody>
        </Card>
      )}

      {renderError && <ErrorBox error={renderError} />}

      {(demoMode || hasEvent) && (
        <>
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-900 dark:text-gray-100">Kanban Booking</span>
                <Badge color="blue">{offers.length} offres</Badge>
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Dataset • offers:{offers.length} • todo:{(todoPerfs||[]).length} • rejPerf:{(rejectedPerfs||[]).length}
              </div>
            </CardHeader>
            <CardBody>
              {loading ? (
                <div className="text-gray-600 dark:text-gray-300">Chargement…</div>
              ) : (
                <div className="grid grid-cols-3 gap-6">
                  {/* COLONNE 1: Brouillon / À faire */}
                  <div className="space-y-3 p-4 rounded-lg border border-gray-200 dark:border-gray-800">
                    <div 
                      className="px-4 py-3 rounded-lg font-semibold text-white text-center flex items-center justify-center gap-2"
                      style={{ backgroundColor: '#1246A3' }}
                    >
                      <span>Brouillon / À faire</span>
                      <span className="px-2 py-0.5 rounded text-sm font-bold bg-white text-gray-900">
                        {kanbanColumns[0]?.offers?.length || 0}
                      </span>
                    </div>
                    <div className="space-y-3 min-h-[200px]">
                      {(kanbanColumns[0]?.offers || []).map((item: any) => (
                        <div
                          key={item.id}
                          className="p-4 rounded-lg border border-gray-200 dark:border-gray-800 transition-all hover:shadow-lg hover:border-opacity-50"
                          style={{ 
                            borderColor: 'color-mix(in srgb, #1246A3 25%, transparent)',
                            backgroundColor: 'var(--color-bg-elevated)'
                          }}
                        >
                          {item.type === "performance" ? (
                            <>
                              <div className="flex items-center justify-between gap-2 text-sm">
                                <span className="font-semibold text-gray-900 dark:text-gray-100">
                                  {item.artist_name}
                                </span>
                                <div className="flex items-center gap-2">
                                  <span className="text-gray-600 dark:text-gray-400">
                                    {item.stage_name}
                                  </span>
                                  <span className="text-gray-400">•</span>
                                  <span className="text-gray-600 dark:text-gray-400">
                                    {item.performance_time ? item.performance_time.substring(0, 5) : ''}
                                  </span>
                                </div>
                              </div>
                              <Button
                                size="sm"
                                variant="primary"
                                className="mt-3 w-full"
                                onClick={async () => {
                                  try {
                                    const performanceId =
                                      item.performance_id ||
                                      (typeof item.id === "string" && item.id.startsWith("perf_")
                                        ? item.id.replace("perf_", "")
                                        : null);
                                    const prefill = await fetchPerformancePrefill(performanceId);
                                    if (!prefill) {
                                      toastError("Performance introuvable");
                                      return;
                                    }
                                    setPrefilledOfferData(prefill);
                                    setShowComposer(true);
                                  } catch (error: any) {
                                    console.error("[ERROR] Prefill depuis carte performance:", error);
                                    toastError(error?.message || "Impossible de charger la performance");
                                  }
                                }}
                              >
                                Établir l'offre
                              </Button>
                            </>
                          ) : (
                            <>
                              <div className="flex items-center justify-between gap-2 text-sm">
                                <span className="font-semibold text-gray-900 dark:text-gray-100">
                                  {item.artist_name}
                                </span>
                                <div className="flex items-center gap-2">
                                  <span className="text-gray-600 dark:text-gray-400">
                                    {item.stage_name}
                                  </span>
                                  {item.performance_time && (
                                    <>
                                      <span className="text-gray-400">•</span>
                                      <span className="text-gray-600 dark:text-gray-400">
                                        {item.performance_time.substring(0, 5)}
                                      </span>
                                    </>
                                  )}
                                </div>
                              </div>
                              {item.amount_display && (
                                <div className="text-sm font-medium text-violet-600 dark:text-violet-400 mt-2">
                                  {item.amount_display} {item.currency}
                                </div>
                              )}
                              <div className="flex gap-2 mt-3">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="flex-1"
                                  onClick={() => handleViewPdf(item)}
                                >
                                  <Eye className="w-3 h-3 mr-1" />
                                  Voir
                                </Button>
                                <Button
                                  size="sm"
                                  variant="primary"
                                  className="flex-1"
                                  onClick={() => handleMove(item.id, "ready_to_send")}
                                >
                                  <Edit className="w-3 h-3 mr-1" />
                                  Prêt
                                </Button>
                              </div>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* COLONNE 2: Prêt à envoyer */}
                  <div className="space-y-3 p-4 rounded-lg border border-gray-200 dark:border-gray-800">
                    <div 
                      className="px-4 py-3 rounded-lg font-semibold text-white text-center flex items-center justify-center gap-2"
                      style={{ backgroundColor: '#661B7D' }}
                    >
                      <span>Prêt à envoyer</span>
                      <span className="px-2 py-0.5 rounded text-sm font-bold bg-white text-gray-900">
                        {kanbanColumns[1]?.offers?.length || 0}
                      </span>
                    </div>
                    <div className="space-y-3 min-h-[200px]">
                      {(kanbanColumns[1]?.offers || []).map((item: any) => (
                        <div
                          key={item.id}
                          className="p-4 rounded-lg border border-gray-200 dark:border-gray-800 transition-all hover:shadow-lg hover:border-opacity-50"
                          style={{ 
                            borderColor: 'color-mix(in srgb, #661B7D 25%, transparent)',
                            backgroundColor: 'var(--color-bg-elevated)'
                          }}
                        >
                          <div className="flex items-center justify-between gap-2 text-sm">
                            <span className="font-semibold text-gray-900 dark:text-gray-100">
                              {item.artist_name}
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="text-gray-600 dark:text-gray-400">
                                {item.stage_name}
                              </span>
                              {item.performance_time && (
                                <>
                                  <span className="text-gray-400">•</span>
                                  <span className="text-gray-600 dark:text-gray-400">
                                    {item.performance_time.substring(0, 5)}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                          {item.amount_display && (
                            <div className="text-sm font-medium text-violet-600 dark:text-violet-400 mt-2">
                              {item.amount_display} {item.currency}
                            </div>
                          )}
                          <div className="flex gap-2 mt-3">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="flex-1"
                              onClick={() => handleViewPdf(item)}
                            >
                              <Eye className="w-3 h-3 mr-1" />
                              Voir
                            </Button>
                            <Button
                              size="sm"
                              variant="primary"
                              className="flex-1"
                              onClick={() => handleSendOffer(item)}
                            >
                              <Send className="w-3 h-3 mr-1" />
                              Envoyer
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* COLONNE 3: Envoyées */}
                  <div className="space-y-3 p-4 rounded-lg border border-gray-200 dark:border-gray-800">
                    <div 
                      className="px-4 py-3 rounded-lg font-semibold text-center flex items-center justify-center gap-2"
                      style={{ backgroundColor: '#90EE90', color: '#0A0D29' }}
                    >
                      <span>Envoyées</span>
                      <span className="px-2 py-0.5 rounded text-sm font-bold bg-white text-gray-900">
                        {kanbanColumns[2]?.offers?.length || 0}
                      </span>
                    </div>
                    <div className="space-y-3 min-h-[200px]">
                      {(kanbanColumns[2]?.offers || []).map((item: any) => (
                        <div
                          key={item.id}
                          className="p-4 rounded-lg border border-gray-200 dark:border-gray-800 transition-all hover:shadow-lg hover:border-opacity-50"
                          style={{ 
                            borderColor: 'color-mix(in srgb, #90EE90 25%, transparent)',
                            backgroundColor: 'var(--color-bg-elevated)'
                          }}
                        >
                          <div className="flex items-center justify-between gap-2 text-sm">
                            <span className="font-semibold text-gray-900 dark:text-gray-100">
                              {item.artist_name}
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="text-gray-600 dark:text-gray-400">
                                {item.stage_name}
                              </span>
                              {item.performance_time && (
                                <>
                                  <span className="text-gray-400">•</span>
                                  <span className="text-gray-600 dark:text-gray-400">
                                    {item.performance_time.substring(0, 5)}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                          {item.amount_display && (
                            <div className="text-sm font-medium text-violet-600 dark:text-violet-400 mt-2">
                              {item.amount_display} {item.currency}
                            </div>
                          )}
                          {item.sent_at && (
                            <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                              Envoyé le {new Date(item.sent_at).toLocaleDateString('fr-FR')}
                            </div>
                          )}
                          <div className="flex gap-2 mt-3">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="flex-1"
                              onClick={() => handleViewPdf(item)}
                            >
                              <Eye className="w-3 h-3 mr-1" />
                              Voir PDF
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-900 dark:text-gray-100">Offres acceptées</span>
                <Badge color="lightgreen">{acceptedOffers.length}</Badge>
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Offres validées et clôturées
              </div>
            </CardHeader>
            <CardBody>
              {loading ? (
                <div className="text-gray-600 dark:text-gray-300">Chargement…</div>
              ) : acceptedOffers.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  Aucune offre acceptée
                </div>
              ) : (
                <OffersListView
                  offers={acceptedOffers}
                  onViewPdf={handleViewPdf}
                  onSendOffer={handleSendOffer}
                  onModify={() => setShowComposer(true)}
                  onMove={handleMove}
                  onDelete={(o) => handleDelete(o.id)}
                />
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-900 dark:text-gray-100">Offres rejetées</span>
                <Badge color="taupe">{rejectedOffers.length}</Badge>
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Offres refusées ou non retenues
              </div>
            </CardHeader>
            <CardBody>
              {loading ? (
                <div className="text-gray-600 dark:text-gray-300">Chargement…</div>
              ) : rejectedOffers.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  Aucune offre rejetée
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-700">
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900 dark:text-gray-100">
                          Artiste
                        </th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900 dark:text-gray-100">
                          Scène
                        </th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900 dark:text-gray-100">
                          Montant
                        </th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900 dark:text-gray-100">
                          Raison
                        </th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900 dark:text-gray-100">
                          Date rejet
                        </th>
                        <th className="text-right py-3 px-4 text-sm font-semibold text-gray-900 dark:text-gray-100">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {rejectedOffers.map((item: any) => (
                        <tr
                          key={item.id}
                          className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                        >
                          <td className="py-3 px-4">
                            <div className="font-medium text-gray-900 dark:text-gray-100">
                              {item.artist_name}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              {item.stage_name}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            {item.amount_display ? (
                              <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                {item.amount_display} {item.currency}
                              </div>
                            ) : (
                              <span className="text-sm text-gray-400">—</span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <div className="text-sm text-gray-600 dark:text-gray-400 max-w-xs truncate">
                              {item.rejection_reason || "Non précisé"}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            {item.rejected_at ? (
                              <div className="text-xs text-gray-500 dark:text-gray-500">
                                {new Date(item.rejected_at).toLocaleDateString('fr-FR')}
                              </div>
                            ) : (
                              <span className="text-xs text-gray-400">—</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex gap-2 justify-end">
                              {item.type !== "performance" && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleViewPdf(item)}
                                >
                                  <Eye className="w-3 h-3 mr-1" />
                                  Voir
                                </Button>
                              )}
                              {item.type === "performance" && (
                                <Badge color="taupe">Performance</Badge>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardBody>
          </Card>
        </>
      )}

      <OfferComposer
        open={showComposer}
        onClose={() => { setShowComposer(false); setPrefilledOfferData(null); }}
        eventId={eventId}
        companyId={companyId || ""}
        prefilledData={prefilledOfferData}
        onSuccess={() => { 
          setShowComposer(false); 
          setPrefilledOfferData(null);
          loadOffers();
          toastSuccess("Offre créée avec succès"); 
        }}
      />

      <Modal open={showPdfModal} onClose={() => setShowPdfModal(false)} title="PDF de l'offre">
        {pdfUrl ? (
          <>
            <iframe src={pdfUrl} className="w-full h-[70vh] border border-gray-200 dark:border-gray-800 rounded" title="Offer PDF" />
            <div className="mt-3 text-right">
              <a className="px-3 py-1.5 rounded bg-blue-600 text-white hover:bg-blue-700" href={pdfUrl} target="_blank" rel="noreferrer">
                Ouvrir dans un onglet
              </a>
            </div>
          </>
        ) : (
          <div className="text-gray-500">Aucun PDF.</div>
        )}
      </Modal>

      {/* Nouveaux modaux */}
      <SendOfferModal
        open={showSendModal}
        onClose={() => {
          setShowSendModal(false);
          setSelectedOffer(null);
        }}
        offer={selectedOffer as any || {
          id: "",
          artist_name: "",
          stage_name: "",
          amount_display: null,
          currency: null,
          pdf_storage_path: null,
        }}
        onSuccess={() => {
          setShowSendModal(false);
          setSelectedOffer(null);
          loadOffers();
        }}
      />

      <RejectOfferModal
        open={showRejectModal}
        onClose={() => {
          setShowRejectModal(false);
          setSelectedOffer(null);
        }}
        onReject={handleRejectOffer}
      />

      <PerformanceModal
        open={showPerformanceModal}
        onClose={() => {
          setShowPerformanceModal(false);
          setSelectedPerformance(null);
        }}
        initialData={
          companyId && eventId
            ? selectedPerformance
              ? {
                  eventId: eventId,
                  companyId: companyId,
                  performanceId: selectedPerformance.id,
                }
              : {
                  eventId: eventId,
                  companyId: companyId,
                }
            : undefined
        }
        onSuccess={() => {
          setShowPerformanceModal(false);
          setSelectedPerformance(null);
          loadOffers();
        }}
      />

      <ConfirmDeleteModal
        isOpen={!!deletingOffer}
        onClose={() => setDeletingOffer(null)}
        onConfirm={handleConfirmDeleteOffer}
        title="Supprimer l'offre"
        message="Êtes-vous sûr de vouloir supprimer cette offre ?"
        itemName={deletingOffer?.artist_name || undefined}
        loading={deleting}
      />
    </div>
  );
}
