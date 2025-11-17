import React, { useState, useEffect } from "react";
import { FileText, Eye, Send, Calendar, DollarSign, User, MapPin, Clock, Plus } from "lucide-react";
import { Modal } from "../../../components/aura/Modal";
import { Button } from "../../../components/aura/Button";
import { Input } from "../../../components/aura/Input";
import { useToast } from "../../../components/aura/ToastProvider";
import { Accordion } from "../../../components/ui/Accordion";
import { supabase } from "../../../lib/supabaseClient";
// import { generateOfferPdfAndUpload } from "../pdf/pdfFill";
import { createSignedOfferPdfUrl, createOffer, updateOffer } from "../bookingApi";

import {
  fetchArtists,
  fetchEventDays,
  fetchEventStages,
  type Artist,
  type EventDay,
  type EventStage,
} from "../../timeline/timelineApi";

// =============================================================================
// TYPES
// =============================================================================

export interface Offer {
  id: string;
  event_id: string;
  company_id: string;
  artist_id: string;
  stage_id: string;
  agency_contact_id?: string;
  artist_name: string;
  stage_name: string;
  date_time: string;
  performance_time: string;
  duration: number | null;
  duration_minutes?: number | null;
  currency: string | null;
  amount_net: number | null;
  amount_gross: number | null;
  amount_is_net: boolean;
  amount_gross_is_subject_to_withholding?: boolean;
  withholding_note?: string;
  amount_display: number | null;
  agency_commission_pct: number | null;
  
  // Frais additionnels
  prod_fee_amount?: number | null;
  prod_fee_currency?: string | null;
  backline_fee_amount?: number | null;
  backline_fee_currency?: string | null;
  buyout_hotel_amount?: number | null;
  buyout_hotel_currency?: string | null;
  buyout_meal_amount?: number | null;
  buyout_meal_currency?: string | null;
  flight_contribution_amount?: number | null;
  flight_contribution_currency?: string | null;
  technical_fee_amount?: number | null;
  technical_fee_currency?: string | null;
  
  ready_to_send_at: string | null;
  status: string;
  validity_date: string | null;
  pdf_storage_path: string | null;
  original_offer_id: string | null;
  version: number;
  terms_json?: any;
  rejection_reason: string | null;
  updated_at: string;
}

export interface OfferComposerProps {
  open: boolean;
  onClose: () => void;
  eventId: string;
  companyId: string;
  editingOffer?: Offer | null;
  prefilledData?: {
    performance_id?: string;
    artist_id?: string;
    artist_name?: string;
    stage_id?: string;
    stage_name?: string;
    event_day_date?: string;
    performance_time?: string;
    duration?: number | null;
    fee_amount?: number | null;
    fee_currency?: string | null;
    isModification?: boolean;
    originalOfferId?: string;
    originalVersion?: number;
  } | null;
  onSuccess: () => void;
}

interface Contact {
  id: string;
  display_name: string;
  email_primary?: string;
}

interface BookingExtra {
  id: string;
  name: string;
  description?: string;
}

interface ExclusivityClause {
  id: string;
  text: string;
  category?: string;
}

type CurrencyCode = "EUR" | "CHF" | "USD" | "GBP";

// =============================================================================
// COMPOSANT PRINCIPAL
// =============================================================================

export function OfferComposer({
  open,
  onClose,
  eventId,
  companyId,
  editingOffer,
  prefilledData,
  onSuccess,
}: OfferComposerProps) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const { success: toastSuccess, error: toastError } = useToast();
  
  // =============================================================================
  // ÉTATS - Données chargées
  // =============================================================================
  const [artists, setArtists] = useState<Artist[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [days, setDays] = useState<EventDay[]>([]);
  const [stages, setStages] = useState<EventStage[]>([]);
  const [bookingExtras, setBookingExtras] = useState<BookingExtra[]>([]);
  const [exclusivityClauses, setExclusivityClauses] = useState<ExclusivityClause[]>([]);
  
  // =============================================================================
  // ÉTATS - Form data principale
  // =============================================================================
  const [formData, setFormData] = useState({
    artist_id: "",
    stage_id: "",
    agency_contact_id: "",
    date_time: "",
    performance_time: "14:00",
    duration: 60,
    currency: "EUR" as CurrencyCode,
    amount_net: null as number | null,
    amount_gross: null as number | null,
    amount_is_net: true,
    amount_gross_is_subject_to_withholding: false,
    withholding_note: "",
    amount_display: null as number | null,
    agency_commission_pct: null as number | null,
    validity_date: "",
  });
  
  // =============================================================================
  // ÉTATS - Frais additionnels (6 types × 2 champs = 12 états)
  // =============================================================================
  const [prodFeeAmount, setProdFeeAmount] = useState<number | undefined>();
  const [prodFeeCurrency, setProdFeeCurrency] = useState<CurrencyCode>("EUR");
  
  const [backlineFeeAmount, setBacklineFeeAmount] = useState<number | undefined>();
  const [backlineFeeCurrency, setBacklineFeeCurrency] = useState<CurrencyCode>("EUR");
  
  const [buyoutHotelAmount, setBuyoutHotelAmount] = useState<number | undefined>();
  const [buyoutHotelCurrency, setBuyoutHotelCurrency] = useState<CurrencyCode>("EUR");
  
  const [buyoutMealAmount, setBuyoutMealAmount] = useState<number | undefined>();
  const [buyoutMealCurrency, setBuyoutMealCurrency] = useState<CurrencyCode>("EUR");
  
  const [flightContributionAmount, setFlightContributionAmount] = useState<number | undefined>();
  const [flightContributionCurrency, setFlightContributionCurrency] = useState<CurrencyCode>("EUR");
  
  const [technicalFeeAmount, setTechnicalFeeAmount] = useState<number | undefined>();
  const [technicalFeeCurrency, setTechnicalFeeCurrency] = useState<CurrencyCode>("EUR");
  
  // =============================================================================
  // ÉTATS - Extras et Clauses
  // =============================================================================
  const [selectedExtras, setSelectedExtras] = useState<Record<string, "festival" | "artist">>({});
  const [exclusivityClausesSelected, setExclusivityClausesSelected] = useState<string[]>([]);
  
  // =============================================================================
  // ÉTATS - Gestion heure TBC
  // =============================================================================
  const [savedPerformanceTime, setSavedPerformanceTime] = useState<string>("20:00");
  const [isTBC, setIsTBC] = useState(false);
  
  // =============================================================================
  // ÉTATS - Validation & PDF
  // =============================================================================
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPdfPreview, setShowPdfPreview] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  
  // =============================================================================
  // CHARGEMENT INITIAL DES DONNÉES
  // =============================================================================
  useEffect(() => {
    if (!open) return;
    
    const loadData = async () => {
      setLoading(true);
      try {
        // Chargement parallèle de toutes les données
        const [
          artistsData,
          daysData,
          stagesData,
          contactsData,
          extrasData,
          clausesData,
        ] = await Promise.all([
          fetchArtists(companyId),
          fetchEventDays(eventId),
          fetchEventStages(eventId),
          loadContacts(companyId),
          loadBookingExtras(),
          loadExclusivityClauses(),
        ]);
        
        setArtists(artistsData);
        setDays(daysData);
        setStages(stagesData);
        setContacts(contactsData);
        setBookingExtras(extrasData);
        setExclusivityClauses(clausesData);
        
      } catch (error: any) {
        console.error("Erreur chargement données:", error);
        toastError(error?.message || "Erreur de chargement");
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [open, eventId, companyId]);
  
  // =============================================================================
  // CHARGEMENT CONTACTS - UNIQUEMENT BOOKING AGENTS
  // =============================================================================
  async function loadContacts(companyId: string): Promise<Contact[]> {
    try {
      const BOOKING_AGENT_ROLE_ID = "bcd6fcc3-2327-4e25-ae87-25d31605816d";
      
      // Récupérer uniquement les contacts avec rôle "Booking Agent"
      const { data, error } = await supabase
        .from("crm_contacts")
        .select(`
          id, 
          display_name, 
          email_primary,
          crm_contact_role_links!inner(role_id)
        `)
        .eq("company_id", companyId)
        .eq("crm_contact_role_links.role_id", BOOKING_AGENT_ROLE_ID)
        .order("display_name");
      
      if (error) throw error;
      
      console.log(`[OK] ${data?.length || 0} Booking Agent(s) chargé(s)`);
      return data || [];
    } catch (error) {
      console.error("Erreur chargement booking agents:", error);
      return [];
    }
  }
  
  // =============================================================================
  // CHARGEMENT BOOKING AGENT PRINCIPAL DE L'ARTISTE
  // =============================================================================
  async function loadArtistMainBookingAgent(artistId: string): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from("crm_artist_contact_links")
        .select("contact_id")
        .eq("artist_id", artistId)
        .eq("is_main_agent", true)
        .maybeSingle();
      
      if (error) throw error;
      
      if (data?.contact_id) {
        console.log(`[OK] Booking agent principal trouvé pour artiste: ${data.contact_id}`);
        return data.contact_id;
      }
      
      return null;
    } catch (error) {
      console.error("Erreur chargement booking agent principal:", error);
      return null;
    }
  }
  
  // =============================================================================
  // CHARGEMENT BOOKING EXTRAS
  // =============================================================================
  async function loadBookingExtras(): Promise<BookingExtra[]> {
    try {
      const { data, error } = await supabase
        .from("booking_extras")
        .select("*")
        .eq("is_active", true)
        .order("sort_order");
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Erreur chargement booking extras:", error);
      return [];
    }
  }
  
  // =============================================================================
  // CHARGEMENT EXCLUSIVITY CLAUSES
  // =============================================================================
  async function loadExclusivityClauses(): Promise<ExclusivityClause[]> {
    try {
      const { data, error } = await supabase
        .from("exclusivity_clauses")
        .select("*")
        .eq("is_active", true)
        .order("sort_order");
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Erreur chargement clauses:", error);
      return [];
    }
  }
  
  // =============================================================================
  // PRÉ-REMPLISSAGE DU FORMULAIRE (Édition ou Création depuis performance)
  // =============================================================================
  useEffect(() => {
    if (!open) return;
    
    if (editingOffer) {
      // MODE ÉDITION
      setFormData({
        artist_id: editingOffer.artist_id,
        stage_id: editingOffer.stage_id,
        agency_contact_id: editingOffer.agency_contact_id || "",
        date_time: editingOffer.date_time ? editingOffer.date_time.split("T")[0] : "",
        performance_time: editingOffer.performance_time ? editingOffer.performance_time.slice(0, 5) : "14:00",
        duration: editingOffer.duration || editingOffer.duration_minutes || 60,
        currency: (editingOffer.currency || "EUR") as CurrencyCode,
        amount_net: editingOffer.amount_net,
        amount_gross: editingOffer.amount_gross,
        amount_is_net: editingOffer.amount_is_net,
        amount_gross_is_subject_to_withholding: editingOffer.amount_gross_is_subject_to_withholding || false,
        withholding_note: editingOffer.withholding_note || "",
        amount_display: editingOffer.amount_display,
        agency_commission_pct: editingOffer.agency_commission_pct,
        validity_date: editingOffer.validity_date || "",
      });
      
      // Frais additionnels
      setProdFeeAmount(editingOffer.prod_fee_amount || undefined);
      setProdFeeCurrency((editingOffer.prod_fee_currency || "EUR") as CurrencyCode);
      setBacklineFeeAmount(editingOffer.backline_fee_amount || undefined);
      setBacklineFeeCurrency((editingOffer.backline_fee_currency || "EUR") as CurrencyCode);
      setBuyoutHotelAmount(editingOffer.buyout_hotel_amount || undefined);
      setBuyoutHotelCurrency((editingOffer.buyout_hotel_currency || "EUR") as CurrencyCode);
      setBuyoutMealAmount(editingOffer.buyout_meal_amount || undefined);
      setBuyoutMealCurrency((editingOffer.buyout_meal_currency || "EUR") as CurrencyCode);
      setFlightContributionAmount(editingOffer.flight_contribution_amount || undefined);
      setFlightContributionCurrency((editingOffer.flight_contribution_currency || "EUR") as CurrencyCode);
      setTechnicalFeeAmount(editingOffer.technical_fee_amount || undefined);
      setTechnicalFeeCurrency((editingOffer.technical_fee_currency || "EUR") as CurrencyCode);
      
      // Clauses d'exclusivité
      if (editingOffer.terms_json && editingOffer.terms_json.selectedClauseIds) {
        setExclusivityClausesSelected(editingOffer.terms_json.selectedClauseIds);
      }
      
      // TODO: Charger les extras depuis offer_extras
      
    } else if (prefilledData) {
      // MODE CRÉATION DEPUIS PERFORMANCE
      
      // Charger le booking agent principal de l'artiste (si artiste pré-rempli)
      const loadMainAgent = async () => {
        if (prefilledData.artist_id) {
          const mainAgentId = await loadArtistMainBookingAgent(prefilledData.artist_id);
          if (mainAgentId) {
            setFormData(prev => ({
              ...prev,
              agency_contact_id: mainAgentId
            }));
          }
        }
      };
      
      setFormData({
        artist_id: prefilledData.artist_id || "",
        stage_id: prefilledData.stage_id || "",
        agency_contact_id: "", // Sera rempli par loadMainAgent()
        date_time: prefilledData.event_day_date || "",
        performance_time: prefilledData.performance_time ? prefilledData.performance_time.slice(0, 5) : "14:00",
        duration: prefilledData.duration || 60,
        currency: (prefilledData.fee_currency || "EUR") as CurrencyCode,
        amount_net: prefilledData.fee_amount,
        amount_gross: prefilledData.fee_amount,
        amount_is_net: true,
        amount_gross_is_subject_to_withholding: false,
        withholding_note: "",
        amount_display: prefilledData.fee_amount,
        agency_commission_pct: null,
        validity_date: "",
      });
      
      // Charger le booking agent après setFormData
      loadMainAgent();
    }
  }, [open, editingOffer, prefilledData]);
  
  // =============================================================================
  // AUTO-CHARGEMENT DU BOOKING AGENT QUAND L'ARTISTE CHANGE
  // =============================================================================
  useEffect(() => {
    if (!formData.artist_id || !open) return;
    
    const loadAgentForArtist = async () => {
      const mainAgentId = await loadArtistMainBookingAgent(formData.artist_id);
      if (mainAgentId) {
        console.log(`[AUTO] Booking agent auto-sélectionné: ${mainAgentId}`);
        setFormData(prev => ({
          ...prev,
          agency_contact_id: mainAgentId
        }));
      }
    };
    
    loadAgentForArtist();
  }, [formData.artist_id, open]);
  
  // =============================================================================
  // CALCUL AUTOMATIQUE DU MONTANT D'AFFICHAGE
  // =============================================================================
  useEffect(() => {
    if (formData.amount_is_net) {
      setFormData(prev => ({ ...prev, amount_display: prev.amount_net }));
    } else {
      setFormData(prev => ({ ...prev, amount_display: prev.amount_gross }));
    }
  }, [formData.amount_is_net, formData.amount_net, formData.amount_gross]);
  
  // =============================================================================
  // GESTION BOUTON TBC
  // =============================================================================
  const handleToggleTBC = () => {
    if (isTBC) {
      // Restaurer l'heure sauvegardée
      setFormData(prev => ({ ...prev, performance_time: savedPerformanceTime }));
      setIsTBC(false);
    } else {
      // Sauvegarder l'heure actuelle et passer en TBC
      setSavedPerformanceTime(formData.performance_time);
      setFormData(prev => ({ ...prev, performance_time: "TBC" }));
      setIsTBC(true);
    }
  };
  
  // =============================================================================
  // GESTION EXTRAS (artist OU festival, mutuellement exclusif)
  // =============================================================================
  const handleExtraAssignment = (extraId: string, assignedTo: "festival" | "artist" | null) => {
    setSelectedExtras(prev => {
      const newExtras = { ...prev };
      if (assignedTo === null) {
        delete newExtras[extraId];
      } else {
        newExtras[extraId] = assignedTo;
      }
      return newExtras;
    });
  };
  
  // =============================================================================
  // GESTION CLAUSES D'EXCLUSIVITÉ
  // =============================================================================
  const handleExclusivityClauseToggle = (clauseId: string, checked: boolean) => {
    setExclusivityClausesSelected(prev =>
      checked ? [...prev, clauseId] : prev.filter(item => item !== clauseId)
    );
  };
  
  // =============================================================================
  // GESTION TYPE DE MONTANT (XOR)
  // =============================================================================
  const handleToggleAmountIsNet = (checked: boolean) => {
    if (checked) {
      setFormData(prev => ({ ...prev, amount_is_net: true, amount_gross_is_subject_to_withholding: false }));
    }
  };
  
  const handleToggleGrossWithholding = (checked: boolean) => {
    if (checked) {
      setFormData(prev => ({ ...prev, amount_is_net: false, amount_gross_is_subject_to_withholding: true }));
    }
  };
  
  // =============================================================================
  // VALIDATION DU FORMULAIRE (9 champs obligatoires)
  // =============================================================================
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    // 1. Artiste
    if (!formData.artist_id) newErrors.artist_id = "Artiste requis";
    
    // 2. Scène
    if (!formData.stage_id) newErrors.stage_id = "Scène requise";
    
    // 3. Date
    if (!formData.date_time) newErrors.date_time = "Date requise";
    
    // 4. Heure
    if (!formData.performance_time) newErrors.performance_time = "Heure requise";
    
    // 5. Durée
    if (!formData.duration || formData.duration <= 0) newErrors.duration = "Durée requise";
    
    // 6. Date de validité
    if (!formData.validity_date) newErrors.validity_date = "Date de validité requise";
    
    // 7. Au moins un montant renseigné
    const hasAmount = 
      (formData.amount_is_net && formData.amount_net) || 
      (formData.amount_gross_is_subject_to_withholding && formData.amount_gross);
    if (!hasAmount) newErrors.amount_display = "Montant requis";
    
    // 8. Au moins un type de montant sélectionné
    if (!formData.amount_is_net && !formData.amount_gross_is_subject_to_withholding) {
      newErrors.amount_type = "Type de montant requis (Net OU Brut)";
    }
    
    // 9. Devise
    if (!formData.currency) newErrors.currency = "Devise requise";
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // =============================================================================
  // HELPER : Classe CSS pour champs avec erreur
  // =============================================================================
  const getFieldClassName = (fieldName: string, baseClassName: string = ""): string => {
    const errorClass = errors[fieldName] ? "border-red-500 bg-red-50 dark:bg-red-900/10" : "";
    return `${baseClassName} ${errorClass}`.trim();
  };
  
  // =============================================================================
  // SAUVEGARDE DE L'OFFRE
  // =============================================================================
  const handleSave = async (status: "draft" | "ready_to_send" = "draft") => {
    if (!validateForm()) {
      toastError("Veuillez remplir tous les champs obligatoires");
      return;
    }
    
    setSaving(true);
    try {
      // Construction date_time
      let dateTime = "";
      if (formData.date_time && formData.performance_time) {
        if (isTBC || formData.performance_time === "TBC") {
          dateTime = `${formData.date_time}T00:00:00`;
        } else {
          const timeFormatted = formData.performance_time.includes(":") 
            ? formData.performance_time 
            : `${formData.performance_time}:00`;
          dateTime = `${formData.date_time}T${timeFormatted}:00`;
        }
      }
      
      // Calcul montant display
      const amountDisplay = formData.amount_is_net ? formData.amount_net : formData.amount_gross;
      
      // Récupérer noms pour cache
      const artistName = artists.find(a => a.id === formData.artist_id)?.name || "";
      const stageName = stages.find(s => s.id === formData.stage_id)?.name || "";
      
      // Construction payload
      const payload: any = {
        event_id: eventId,
        company_id: companyId,
        artist_id: formData.artist_id,
        stage_id: formData.stage_id,
        agency_contact_id: formData.agency_contact_id || null,
        artist_name: artistName,
        stage_name: stageName,
        date_time: dateTime,
        performance_time: isTBC ? "TBC" : formData.performance_time,
        duration: formData.duration,
        duration_minutes: formData.duration,
        currency: formData.currency,
        amount_net: formData.amount_is_net ? formData.amount_net : null,
        amount_gross: formData.amount_is_net ? null : formData.amount_gross,
        amount_is_net: formData.amount_is_net,
        amount_gross_is_subject_to_withholding: formData.amount_gross_is_subject_to_withholding,
        withholding_note: formData.withholding_note || null,
        amount_display: amountDisplay,
        agency_commission_pct: formData.agency_commission_pct,
        validity_date: formData.validity_date,
        status,
        
        // Frais additionnels
        prod_fee_amount: prodFeeAmount || null,
        prod_fee_currency: prodFeeAmount ? prodFeeCurrency : null,
        backline_fee_amount: backlineFeeAmount || null,
        backline_fee_currency: backlineFeeAmount ? backlineFeeCurrency : null,
        buyout_hotel_amount: buyoutHotelAmount || null,
        buyout_hotel_currency: buyoutHotelAmount ? buyoutHotelCurrency : null,
        buyout_meal_amount: buyoutMealAmount || null,
        buyout_meal_currency: buyoutMealAmount ? buyoutMealCurrency : null,
        flight_contribution_amount: flightContributionAmount || null,
        flight_contribution_currency: flightContributionAmount ? flightContributionCurrency : null,
        technical_fee_amount: technicalFeeAmount || null,
        technical_fee_currency: technicalFeeAmount ? technicalFeeCurrency : null,
        
        // Clauses d'exclusivité
        terms_json: {
          selectedClauseIds: exclusivityClausesSelected,
        },
      };
      
      let offerId: string;
      
      // DÉTERMINER LE MODE (CRITIQUE)
      const isModification = prefilledData?.isModification === true;
      
      if (editingOffer) {
        // MODE ÉDITION DIRECTE (modifie l'offre existante, même ID)
        await updateOffer(editingOffer.id, payload);
        offerId = editingOffer.id;
        console.log("✏️ Offre éditée:", offerId);
        
      } else if (isModification && prefilledData?.originalOfferId) {
        // MODE MODIFICATION AVEC VERSIONING (crée nouvelle version)
        console.log("🔄 Création nouvelle version");
        
        // Appeler la fonction RPC create_offer_version
        const { data, error } = await supabase.rpc("create_offer_version", {
          p_original_offer_id: prefilledData.originalOfferId,
          p_new_offer_data: payload,
        });
        
        if (error) throw error;
        
        // La fonction retourne un tableau avec {id, version}
        if (data && data.length > 0) {
          offerId = data[0].id;
          console.log(`[OK] Version ${data[0].version} créée: ${offerId}`);
        } else {
          throw new Error("Aucune donnée retournée par create_offer_version");
        }
        
      } else {
        // MODE CRÉATION NORMALE (nouvelle offre v1)
        const newOffer = await createOffer(payload);
        offerId = newOffer.id;
        console.log(`[OK] Nouvelle offre créée: ${offerId} (v1)`);
      }
      
      // Sauvegarder les extras
      await saveOfferExtras(offerId, selectedExtras);
      
      // Mise à jour statut si ready_to_send
      if (status === "ready_to_send") {
        await updateOffer(offerId, {
          ready_to_send_at: new Date().toISOString(),
        });
        
        // Déclencher l'événement de changement de statut
        window.dispatchEvent(new CustomEvent("offer-status-changed"));
      }
      
      toastSuccess(editingOffer ? "Offre modifiée" : "Offre créée");
      onSuccess();
      onClose();
      
    } catch (error: any) {
      console.error("❌ Erreur sauvegarde:", error);
      toastError(error?.message || "Erreur de sauvegarde");
    } finally {
      setSaving(false);
    }
  };
  
  // =============================================================================
  // SAUVEGARDE DES EXTRAS
  // =============================================================================
  async function saveOfferExtras(
    offerId: string, 
    extras: Record<string, "festival" | "artist">
  ): Promise<void> {
    try {
      // 1. Supprimer extras existants
      await supabase
        .from("offer_extras")
        .delete()
        .eq("offer_id", offerId);

      // 2. Préparer insertions
      const extrasToInsert = Object.entries(extras).map(([extraId, chargedTo]) => ({
        id: crypto.randomUUID(),
        offer_id: offerId,
        extra_id: extraId,
        charge_to: chargedTo,
        company_id: companyId,
      }));

      // 3. Insérer nouveaux extras
      if (extrasToInsert.length > 0) {
        const { error } = await supabase
          .from("offer_extras")
          .insert(extrasToInsert);
        
        if (error) throw error;
        console.log(`[OK] ${extrasToInsert.length} extras sauvegardés`);
      }
    } catch (error) {
      console.error("[ERROR] Erreur sauvegarde extras:", error);
      throw error;
    }
  }
  
  // =============================================================================
  // GÉNÉRATION DU PDF (À IMPLÉMENTER)
  // =============================================================================
  const handleGeneratePdf = async () => {
    if (!validateForm()) {
      toastError("Veuillez remplir tous les champs obligatoires avant de générer le PDF");
      return;
    }
    
    setGeneratingPdf(true);
    try {
      // TODO: Implémenter la génération PDF
      toastSuccess("Génération PDF - À implémenter");
    } catch (error: any) {
      console.error("Erreur génération PDF:", error);
      toastError(error?.message || "Erreur de génération PDF");
    } finally {
      setGeneratingPdf(false);
    }
  };
  
  // =============================================================================
  // MARQUER COMME PRÊT À ENVOYER
  // =============================================================================
  const handleReadyToSend = async () => {
    await handleSave("ready_to_send");
  };
  
  // =============================================================================
  // RESET DU FORMULAIRE À LA FERMETURE
  // =============================================================================
  useEffect(() => {
    if (!open) {
      setFormData({
        artist_id: "",
        stage_id: "",
        agency_contact_id: "",
        date_time: "",
        performance_time: "14:00",
        duration: 60,
        currency: "EUR",
        amount_net: null,
        amount_gross: null,
        amount_is_net: true,
        amount_gross_is_subject_to_withholding: false,
        withholding_note: "",
        amount_display: null,
        agency_commission_pct: null,
        validity_date: "",
      });
      setErrors({});
      setShowPdfPreview(false);
      setPdfUrl(null);
      setSelectedExtras({});
      setExclusivityClausesSelected([]);
      setIsTBC(false);
      
      // Reset frais
      setProdFeeAmount(undefined);
      setBacklineFeeAmount(undefined);
      setBuyoutHotelAmount(undefined);
      setBuyoutMealAmount(undefined);
      setFlightContributionAmount(undefined);
      setTechnicalFeeAmount(undefined);
    }
  }, [open]);
  
  // =============================================================================
  // RENDER - Modal chargement
  // =============================================================================
  if (loading) {
    return (
      <Modal open={open} onClose={onClose} title="Composer une offre">
        <div className="p-8 text-center">
          <div className="text-gray-500 dark:text-gray-400">Chargement...</div>
        </div>
      </Modal>
    );
  }
  
  // =============================================================================
  // RENDER - Titre dynamique
  // =============================================================================
  const modalTitle = prefilledData?.isModification 
    ? `MODIFIER OFFRE (Nouvelle version ${(prefilledData.originalVersion || 1) + 1})`
    : editingOffer 
      ? "ÉDITER OFFRE"
      : "ÉTABLIR UNE OFFRE";
  
  // =============================================================================
  // RENDER - Sections Accordion
  // =============================================================================
  const accordionItems = [
    // =========================================================================
    // SECTION 1 : DONNÉES DE BASE
    // =========================================================================
    {
      id: "general",
      title: (
        <div className="flex items-center gap-2">
          <User className="w-4 h-4 text-violet-400" />
          <span>Données de base</span>
        </div>
      ),
      content: (
        <div className="pt-4 space-y-4">
          {/* Alert erreurs validation */}
          {Object.keys(errors).length > 0 && (
            <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-500 rounded-lg p-4 mb-4">
              <h3 className="text-sm font-bold text-red-800 dark:text-red-300 mb-2">
                ⚠️ Champs obligatoires manquants
              </h3>
              <ul className="list-disc list-inside text-sm text-red-700 dark:text-red-400">
                {Object.entries(errors).map(([key, message]) => (
                  <li key={key}>{message}</li>
                ))}
              </ul>
            </div>
          )}
          
          <div className="grid grid-cols-2 gap-4">
            {/* Artiste */}
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                Artiste <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                <select
                  className={getFieldClassName("artist_id", "flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent")}
                  value={formData.artist_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, artist_id: e.target.value }))}
                >
                  <option value="">Sélectionner un artiste</option>
                  {artists.map(artist => (
                    <option key={artist.id} value={artist.id}>{artist.name}</option>
                  ))}
                </select>
                <Button
                  variant="ghost"
                  size="sm"
                  title="Ajouter un artiste rapidement"
                  onClick={() => toastSuccess("Ajout rapide artiste - À implémenter")}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              {errors.artist_id && (
                <span className="text-sm text-red-600 dark:text-red-400">{errors.artist_id}</span>
              )}
            </div>

            {/* Contact Booking */}
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                Contact Booking
              </label>
              <div className="flex gap-2">
                <select
                  className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                  value={formData.agency_contact_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, agency_contact_id: e.target.value }))}
                >
                  <option value="">Sélectionner un booking agent</option>
                  {contacts.map(contact => (
                    <option key={contact.id} value={contact.id}>
                      {contact.display_name}
                      {contact.email_primary ? ` (${contact.email_primary})` : ""}
                      {contact.id === formData.agency_contact_id ? " [Assigné à l'artiste]" : ""}
                    </option>
                  ))}
                </select>
                <Button
                  variant="ghost"
                  size="sm"
                  title="Ajouter un contact rapidement"
                  onClick={() => toastSuccess("Ajout rapide contact - À implémenter")}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            {/* Date */}
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                className={getFieldClassName("date_time", "w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent")}
                value={formData.date_time}
                onChange={(e) => setFormData(prev => ({ ...prev, date_time: e.target.value }))}
              />
              {errors.date_time && (
                <span className="text-sm text-red-600 dark:text-red-400">{errors.date_time}</span>
              )}
            </div>

            {/* Heure avec bouton TBC */}
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                Heure <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="time"
                  disabled={isTBC}
                  className={getFieldClassName("performance_time", "flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent disabled:opacity-50")}
                  value={isTBC ? "00:00" : formData.performance_time}
                  onChange={(e) => setFormData(prev => ({ ...prev, performance_time: e.target.value }))}
                />
                <Button
                  variant={isTBC ? "primary" : "ghost"}
                  size="sm"
                  onClick={handleToggleTBC}
                  title="To Be Confirmed"
                >
                  <Clock className="w-4 h-4 mr-1" />
                  TBC
                </Button>
              </div>
              {errors.performance_time && (
                <span className="text-sm text-red-600 dark:text-red-400">{errors.performance_time}</span>
              )}
            </div>

            {/* Durée */}
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                Durée (min) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="5"
                step="5"
                className={getFieldClassName("duration", "w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent")}
                value={formData.duration}
                onChange={(e) => setFormData(prev => ({ ...prev, duration: parseInt(e.target.value) || 0 }))}
              />
              {errors.duration && (
                <span className="text-sm text-red-600 dark:text-red-400">{errors.duration}</span>
              )}
            </div>
          </div>

          {/* Scène */}
          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
              Scène <span className="text-red-500">*</span>
            </label>
            <select
              className={getFieldClassName("stage_id", "w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent")}
              value={formData.stage_id}
              onChange={(e) => setFormData(prev => ({ ...prev, stage_id: e.target.value }))}
            >
              <option value="">Sélectionner une scène</option>
              {stages.map(stage => (
                <option key={stage.id} value={stage.id}>
                  {stage.name} {stage.capacity ? `(${stage.capacity} cap.)` : ""}
                </option>
              ))}
            </select>
            {errors.stage_id && (
              <span className="text-sm text-red-600 dark:text-red-400">{errors.stage_id}</span>
            )}
          </div>

          {/* Deadline */}
          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
              Deadline (Date de validité) <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              className={getFieldClassName("validity_date", "w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent")}
              value={formData.validity_date}
              onChange={(e) => setFormData(prev => ({ ...prev, validity_date: e.target.value }))}
            />
            {errors.validity_date && (
              <span className="text-sm text-red-600 dark:text-red-400">{errors.validity_date}</span>
            )}
          </div>
        </div>
      ),
    },

    // =========================================================================
    // SECTION 2 : FINANCIER
    // =========================================================================
    {
      id: "financial",
      title: (
        <div className="flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-violet-400" />
          <span>Financier</span>
        </div>
      ),
      content: (
        <div className="pt-4 space-y-4">
          {/* Type de montant (XOR) */}
          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
              Type de montant <span className="text-red-500">*</span>
            </label>
            <div className="space-y-2">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.amount_is_net}
                  onChange={(e) => handleToggleAmountIsNet(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-violet-600 focus:ring-violet-500 mr-2"
                />
                <span className="text-sm text-gray-900 dark:text-gray-100">
                  Montant net de taxes (le montant saisi est net)
                </span>
              </label>
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.amount_gross_is_subject_to_withholding}
                  onChange={(e) => handleToggleGrossWithholding(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-violet-600 focus:ring-violet-500 mr-2"
                />
                <span className="text-sm text-gray-900 dark:text-gray-100">
                  Montant brut, soumis à l'impôt à la source
                </span>
              </label>
            </div>
            {errors.amount_type && (
              <span className="text-sm text-red-600 dark:text-red-400">{errors.amount_type}</span>
            )}
          </div>

          {/* Note si withholding */}
          {formData.amount_gross_is_subject_to_withholding && (
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                Note explicative (impôt à la source)
              </label>
              <textarea
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-violet-500"
                placeholder="Ex: Taux d'imposition applicable..."
                value={formData.withholding_note}
                onChange={(e) => setFormData(prev => ({ ...prev, withholding_note: e.target.value }))}
              />
            </div>
          )}

          <div className="grid grid-cols-3 gap-4">
            {/* Devise */}
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                Devise <span className="text-red-500">*</span>
              </label>
              <select
                className={getFieldClassName("currency", "w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent")}
                value={formData.currency}
                onChange={(e) => setFormData(prev => ({ ...prev, currency: e.target.value as CurrencyCode }))}
              >
                <option value="EUR">EUR</option>
                <option value="CHF">CHF</option>
                <option value="USD">USD</option>
                <option value="GBP">GBP</option>
              </select>
              {errors.currency && (
                <span className="text-sm text-red-600 dark:text-red-400">{errors.currency}</span>
              )}
            </div>

            {/* Montant net */}
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                Montant net
              </label>
              <input
                type="number"
                step="0.01"
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                value={formData.amount_net || ""}
                onChange={(e) => setFormData(prev => ({ ...prev, amount_net: parseFloat(e.target.value) || null }))}
                placeholder="0.00"
              />
            </div>

            {/* Montant brut */}
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                Montant brut
              </label>
              <input
                type="number"
                step="0.01"
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                value={formData.amount_gross || ""}
                onChange={(e) => setFormData(prev => ({ ...prev, amount_gross: parseFloat(e.target.value) || null }))}
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Commission */}
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                Commission Agence (%)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="100"
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                value={formData.agency_commission_pct || ""}
                onChange={(e) => setFormData(prev => ({ ...prev, agency_commission_pct: parseFloat(e.target.value) || null }))}
                placeholder="0.00"
              />
            </div>

            {/* Montant d'affichage */}
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                Montant d'affichage <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                className={getFieldClassName("amount_display", "w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent")}
                value={formData.amount_display || ""}
                onChange={(e) => setFormData(prev => ({ ...prev, amount_display: parseFloat(e.target.value) || null }))}
                placeholder="0.00"
              />
              {errors.amount_display && (
                <span className="text-sm text-red-600 dark:text-red-400">{errors.amount_display}</span>
              )}
            </div>
          </div>

          {/* FRAIS ADDITIONNELS (6 types) */}
          <div className="border-t pt-4 mt-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Frais additionnels (optionnels)
            </h3>
            
            <div className="grid grid-cols-3 gap-4">
              {/* PROD FEE */}
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  PROD FEE
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    step="0.01"
                    className="flex-1 px-2 py-1.5 text-sm rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    value={prodFeeAmount || ""}
                    onChange={(e) => setProdFeeAmount(parseFloat(e.target.value) || undefined)}
                    placeholder="Montant"
                  />
                  <select
                    className="px-2 py-1.5 text-sm rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
                    value={prodFeeCurrency}
                    onChange={(e) => setProdFeeCurrency(e.target.value as CurrencyCode)}
                  >
                    <option>EUR</option>
                    <option>CHF</option>
                    <option>USD</option>
                    <option>GBP</option>
                  </select>
                </div>
              </div>

              {/* BACKLINE FEE */}
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  BACKLINE FEE
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    step="0.01"
                    className="flex-1 px-2 py-1.5 text-sm rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    value={backlineFeeAmount || ""}
                    onChange={(e) => setBacklineFeeAmount(parseFloat(e.target.value) || undefined)}
                    placeholder="Montant"
                  />
                  <select
                    className="px-2 py-1.5 text-sm rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
                    value={backlineFeeCurrency}
                    onChange={(e) => setBacklineFeeCurrency(e.target.value as CurrencyCode)}
                  >
                    <option>EUR</option>
                    <option>CHF</option>
                    <option>USD</option>
                    <option>GBP</option>
                  </select>
                </div>
              </div>

              {/* BUY OUT HOTEL */}
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  BUY OUT HOTEL
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    step="0.01"
                    className="flex-1 px-2 py-1.5 text-sm rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    value={buyoutHotelAmount || ""}
                    onChange={(e) => setBuyoutHotelAmount(parseFloat(e.target.value) || undefined)}
                    placeholder="Montant"
                  />
                  <select
                    className="px-2 py-1.5 text-sm rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
                    value={buyoutHotelCurrency}
                    onChange={(e) => setBuyoutHotelCurrency(e.target.value as CurrencyCode)}
                  >
                    <option>EUR</option>
                    <option>CHF</option>
                    <option>USD</option>
                    <option>GBP</option>
                  </select>
                </div>
              </div>

              {/* BUY OUT MEAL */}
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  BUY OUT MEAL
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    step="0.01"
                    className="flex-1 px-2 py-1.5 text-sm rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    value={buyoutMealAmount || ""}
                    onChange={(e) => setBuyoutMealAmount(parseFloat(e.target.value) || undefined)}
                    placeholder="Montant"
                  />
                  <select
                    className="px-2 py-1.5 text-sm rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
                    value={buyoutMealCurrency}
                    onChange={(e) => setBuyoutMealCurrency(e.target.value as CurrencyCode)}
                  >
                    <option>EUR</option>
                    <option>CHF</option>
                    <option>USD</option>
                    <option>GBP</option>
                  </select>
                </div>
              </div>

              {/* FLIGHT CONTRIBUTION */}
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  FLIGHT CONTRIBUTION
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    step="0.01"
                    className="flex-1 px-2 py-1.5 text-sm rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    value={flightContributionAmount || ""}
                    onChange={(e) => setFlightContributionAmount(parseFloat(e.target.value) || undefined)}
                    placeholder="Montant"
                  />
                  <select
                    className="px-2 py-1.5 text-sm rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
                    value={flightContributionCurrency}
                    onChange={(e) => setFlightContributionCurrency(e.target.value as CurrencyCode)}
                  >
                    <option>EUR</option>
                    <option>CHF</option>
                    <option>USD</option>
                    <option>GBP</option>
                  </select>
                </div>
              </div>

              {/* TECHNICAL FEE */}
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  TECHNICAL FEE
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    step="0.01"
                    className="flex-1 px-2 py-1.5 text-sm rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    value={technicalFeeAmount || ""}
                    onChange={(e) => setTechnicalFeeAmount(parseFloat(e.target.value) || undefined)}
                    placeholder="Montant"
                  />
                  <select
                    className="px-2 py-1.5 text-sm rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
                    value={technicalFeeCurrency}
                    onChange={(e) => setTechnicalFeeCurrency(e.target.value as CurrencyCode)}
                  >
                    <option>EUR</option>
                    <option>CHF</option>
                    <option>USD</option>
                    <option>GBP</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>
      ),
    },

    // =========================================================================
    // SECTION 3 : EXTRAS ET CLAUSES
    // =========================================================================
    {
      id: "extras",
      title: (
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-violet-400" />
          <span>Extras et Clauses</span>
        </div>
      ),
      content: (
        <div className="pt-4 space-y-6">
          {/* EXTRAS */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
              Extras (qui paie ?)
            </h3>
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Extra
                    </th>
                    <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Artist
                    </th>
                    <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Festival
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {bookingExtras.map(extra => (
                    <tr key={extra.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-4 py-2 text-gray-900 dark:text-gray-100">
                        {extra.name}
                        {extra.description && (
                          <span className="block text-xs text-gray-500 dark:text-gray-400">
                            {extra.description}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2 text-center">
                        <input
                          type="checkbox"
                          checked={selectedExtras[extra.id] === "artist"}
                          onChange={(e) => 
                            handleExtraAssignment(extra.id, e.target.checked ? "artist" : null)
                          }
                          className="w-4 h-4 rounded border-gray-300 text-violet-600 focus:ring-violet-500"
                        />
                      </td>
                      <td className="px-4 py-2 text-center">
                        <input
                          type="checkbox"
                          checked={selectedExtras[extra.id] === "festival"}
                          onChange={(e) => 
                            handleExtraAssignment(extra.id, e.target.checked ? "festival" : null)
                          }
                          className="w-4 h-4 rounded border-gray-300 text-violet-600 focus:ring-violet-500"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* CLAUSES D'EXCLUSIVITÉ */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
              Clauses d'exclusivité
            </h3>
            <div className="space-y-2 max-h-64 overflow-y-auto p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
              {exclusivityClauses.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">Aucune clause disponible</p>
              ) : (
                exclusivityClauses.map(clause => (
                  <label key={clause.id} className="flex items-start gap-2 cursor-pointer hover:bg-white dark:hover:bg-gray-800 p-2 rounded">
                    <input
                      type="checkbox"
                      checked={exclusivityClausesSelected.includes(clause.id)}
                      onChange={(e) => handleExclusivityClauseToggle(clause.id, e.target.checked)}
                      className="mt-0.5 w-4 h-4 rounded border-gray-300 text-violet-600 focus:ring-violet-500"
                    />
                    <span className="text-sm text-gray-900 dark:text-gray-100">
                      {clause.text}
                      {clause.category && (
                        <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                          ({clause.category})
                        </span>
                      )}
                    </span>
                  </label>
                ))
              )}
            </div>
          </div>
        </div>
      ),
    },
  ];

  // =============================================================================
  // RENDER PRINCIPAL
  // =============================================================================
  return (
    <>
      <Modal open={open} onClose={onClose} title={modalTitle} widthClass="max-w-5xl">
        <Accordion items={accordionItems} defaultOpenId="general" className="space-y-4" />

        {/* Actions footer */}
        <div className="flex justify-between items-center pt-6 mt-6 border-t border-gray-200 dark:border-gray-700">
          <div className="flex gap-2">
            <Button
              variant="ghost"
              onClick={handleGeneratePdf}
              disabled={generatingPdf || saving}
            >
              <FileText className="w-4 h-4 mr-2" />
              {generatingPdf ? "Génération..." : "Générer PDF"}
            </Button>
            
            {pdfUrl && (
              <Button
                variant="ghost"
                onClick={() => setShowPdfPreview(true)}
              >
                <Eye className="w-4 h-4 mr-2" />
                Prévisualiser
              </Button>
            )}
          </div>
          
          <div className="flex gap-3">
            <Button variant="ghost" onClick={onClose} disabled={saving}>
              Annuler
            </Button>
            
            <Button
              variant="secondary"
              onClick={() => handleSave("draft")}
              disabled={saving}
            >
              {saving ? "Enregistrement..." : "Enregistrer brouillon"}
            </Button>
            
            {editingOffer && editingOffer.status === "draft" && (
              <Button
                variant="primary"
                onClick={handleReadyToSend}
                disabled={saving}
              >
                <Send className="w-4 h-4 mr-2" />
                Prêt à envoyer
              </Button>
            )}
            
            <Button
              variant="primary"
              onClick={() => handleSave("draft")}
              disabled={saving}
            >
              {editingOffer ? "Modifier" : "Créer l'offre"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* PDF Preview Modal */}
      <Modal open={showPdfPreview} onClose={() => setShowPdfPreview(false)} title="Prévisualisation PDF" widthClass="max-w-6xl">
        <div className="h-96">
          {pdfUrl ? (
            <iframe
              src={pdfUrl}
              className="w-full h-full border border-gray-300 dark:border-gray-600 rounded-lg"
              title="Prévisualisation PDF"
            />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
              Aucun PDF disponible
            </div>
          )}
        </div>
        <div className="flex justify-end gap-3 mt-4">
          <Button variant="ghost" onClick={() => setShowPdfPreview(false)}>
            Fermer
          </Button>
          {editingOffer && (
            <Button variant="primary" onClick={handleReadyToSend}>
              <Send className="w-4 h-4 mr-2" />
              Prêt à envoyer
            </Button>
          )}
        </div>
      </Modal>
    </>
  );
}
