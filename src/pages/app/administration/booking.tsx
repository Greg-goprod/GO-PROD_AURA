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
import { Settings, Plus, Calendar } from "lucide-react";

import { OffersKanban } from "@/features/booking/OffersKanban";
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

  const closedOffers = useMemo(() => {
    const accepted = offers.filter((o) => o.status === "accepted");
    const rejected = [
      ...offers.filter((o) => o.status === "rejected"),
      ...(rejectedPerfItems as any[]),
    ];
    return [...accepted, ...rejected];
  }, [offers, rejectedPerfItems]);

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
    const performanceId = item.id?.startsWith('perf_') ? item.id.replace('perf_', '') : null;
    
    if (!performanceId) {
      toastError("ID de performance manquant");
      console.error("[ERROR] performanceId manquant depuis item.id:", item.id);
      return;
    }
    
    try {
      // Récupérer la performance complète avec toutes les relations
      const { data: performance, error } = await supabase
        .from('artist_performances')
        .select(`
          *,
          artists(id, name),
          event_days(id, date),
          event_stages(id, name)
        `)
        .eq('id', performanceId)
        .single();
      
      if (error) throw error;
      
      if (!performance) {
        toastError("Performance introuvable");
        return;
      }
      
      console.log("[OK] Performance complète récupérée:", performance);
      
      // Pré-remplir le formulaire avec toutes les données
      setPrefilledOfferData({
        artist_name: performance.artists?.name || item.artist_name,
        artist_id: performance.artist_id,
        stage_name: performance.event_stages?.name || item.stage_name,
        stage_id: performance.event_stage_id,
        event_day_date: performance.event_days?.date,
        performance_time: performance.performance_time || item.performance_time,
        duration: performance.duration || item.duration,
        fee_amount: performance.fee_amount || item.fee_amount,
        fee_currency: performance.fee_currency || item.fee_currency || 'EUR',
        performance_id: performance.id,
      });
      
      console.log("[OK] OfferComposer prêt à s'ouvrir");
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
                <OffersKanban
                  columns={kanbanColumns}
                  onMove={handleMove}
                  onQuickAction={handleQuickAction}
                  onSendOffer={handleSendOffer}
                  onModifyOffer={() => setShowComposer(true)}
                  onValidateOffer={(o) => handleMove(o.id, "accepted")}
                  onRejectOffer={(o) => handleRejectOfferModal(o)}
                  onDeleteOffer={handleDelete}
                  onExportContract={handleExportContract}
                />
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-900 dark:text-gray-100">Offres clôturées</span>
                <Badge color="blue">{closedOffers.length}</Badge>
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Offres acceptées et rejetées
              </div>
            </CardHeader>
            <CardBody>
              {loading ? (
                <div className="text-gray-600 dark:text-gray-300">Chargement…</div>
              ) : closedOffers.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  Aucune offre clôturée
                </div>
              ) : (
                <OffersListView
                  offers={closedOffers}
                  onViewPdf={handleViewPdf}
                  onSendOffer={handleSendOffer}
                  onModify={() => setShowComposer(true)}
                  onMove={handleMove}
                  onDelete={(o) => handleDelete(o.id)}
                />
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
