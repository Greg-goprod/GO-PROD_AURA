import React, { useState, useEffect, useCallback } from 'react';
import { Shield, Download, Upload, Key, Database, Eye, FileText, Calendar, DollarSign, Plus, Edit2, Trash2, Check } from 'lucide-react';
import { Card, CardHeader, CardBody } from '@/components/aura/Card';
import { Button } from '@/components/aura/Button';
import { Input } from '@/components/aura/Input';
import { Badge } from '@/components/aura/Badge';
import { useToast } from '@/components/aura/ToastProvider';
import { ConfirmDialog } from '@/components/aura/ConfirmDialog';
import { useEventContext } from '@/hooks/useEventContext';
import { getCurrentCompanyId } from '@/lib/tenant';
import { supabase } from '@/lib/supabaseClient';

import {
  listOfferClauses, createOfferClause, updateOfferClause, deleteOfferClause,
  listExclusivityPresets, createExclusivityPreset, updateExclusivityPreset, deleteExclusivityPreset,
  listPaymentSchedulePresets, createPaymentSchedulePreset, updatePaymentSchedulePreset, deletePaymentSchedulePreset,
  type OfferClause, type ExclusivityPreset, type PaymentSchedulePreset
} from "@/features/booking/advancedBookingApi";

import { ClauseFormModal } from "@/features/booking/modals/ClauseFormModal";
import { ExclusivityPresetFormModal } from "@/features/booking/modals/ExclusivityPresetFormModal";
import { PaymentScheduleFormModal } from "@/features/booking/modals/PaymentScheduleFormModal";

export function SettingsAdminPage() {
  const [formData, setFormData] = useState({
    emailjsPublicKey: '',
    emailjsServiceId: '',
    emailjsTemplateId: '',
  });
  const { success: toastSuccess, error: toastError } = useToast();
  const { companyId: contextCompanyId } = useEventContext();
  
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  // États pour les clauses
  const [clauses, setClauses] = useState<OfferClause[]>([]);
  const [showClauseModal, setShowClauseModal] = useState(false);
  const [editingClause, setEditingClause] = useState<OfferClause | null>(null);
  
  // États pour les presets d'exclusivité
  const [exclPresets, setExclPresets] = useState<ExclusivityPreset[]>([]);
  const [showExclModal, setShowExclModal] = useState(false);
  const [editingExcl, setEditingExcl] = useState<ExclusivityPreset | null>(null);
  
  // États pour les presets de paiement
  const [payPresets, setPayPresets] = useState<PaymentSchedulePreset[]>([]);
  const [showPayModal, setShowPayModal] = useState(false);
  const [editingPay, setEditingPay] = useState<PaymentSchedulePreset | null>(null);
  
  // États pour la confirmation de suppression
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: string; id: string; name: string } | null>(null);

  // Récupération du company_id
  useEffect(() => {
    (async () => {
      try {
        const cid = await getCurrentCompanyId(supabase);
        setCompanyId(cid);
      } catch (e) {
        console.error('❌ Erreur récupération company_id:', e);
        toastError("Impossible de récupérer l'ID de l'entreprise");
      }
    })();
  }, [toastError]);

  // Chargement des données booking
  const loadBookingData = useCallback(async () => {
    if (!companyId) return;
    
    setLoading(true);
    try {
      const [clausesData, exclData, payData] = await Promise.all([
        listOfferClauses(companyId),
        listExclusivityPresets(companyId),
        listPaymentSchedulePresets(companyId),
      ]);
      
      setClauses(clausesData);
      setExclPresets(exclData);
      setPayPresets(payData);
    } catch (e: any) {
      console.error("Erreur chargement:", e);
      toastError(e?.message || "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }, [companyId, toastError]);

  useEffect(() => {
    loadBookingData();
  }, [loadBookingData]);

  // Handlers pour les clauses
  const handleSaveClause = async (data: any) => {
    if (!companyId) return;
    
    try {
      if (editingClause) {
        await updateOfferClause(editingClause.id, data);
        toastSuccess("Clause mise à jour");
      } else {
        await createOfferClause(companyId, data);
        toastSuccess("Clause créée");
      }
      
      setShowClauseModal(false);
      setEditingClause(null);
      loadBookingData();
    } catch (e: any) {
      console.error("Erreur sauvegarde clause:", e);
      toastError(e?.message || "Erreur sauvegarde");
    }
  };

  // Handlers pour les presets d'exclusivité
  const handleSaveExclPreset = async (data: any) => {
    if (!companyId) return;
    
    try {
      if (editingExcl) {
        await updateExclusivityPreset(editingExcl.id, data);
        toastSuccess("Preset d'exclusivité mis à jour");
      } else {
        await createExclusivityPreset(companyId, data);
        toastSuccess("Preset d'exclusivité créé");
      }
      
      setShowExclModal(false);
      setEditingExcl(null);
      loadBookingData();
    } catch (e: any) {
      console.error("Erreur sauvegarde preset exclusivité:", e);
      toastError(e?.message || "Erreur sauvegarde");
    }
  };

  // Handlers pour les presets de paiement
  const handleSavePayPreset = async (data: any) => {
    if (!companyId) return;
    
    try {
      if (editingPay) {
        await updatePaymentSchedulePreset(editingPay.id, data);
        toastSuccess("Échéancier mis à jour");
      } else {
        await createPaymentSchedulePreset(companyId, data);
        toastSuccess("Échéancier créé");
      }
      
      setShowPayModal(false);
      setEditingPay(null);
      loadBookingData();
    } catch (e: any) {
      console.error("Erreur sauvegarde échéancier:", e);
      toastError(e?.message || "Erreur sauvegarde");
    }
  };

  const handleSave = () => {
    localStorage.setItem('admin_settings', JSON.stringify(formData));
    toastSuccess('Paramètres administratifs sauvegardés');
  };

  const handleExport = () => {
    const data = {
      settings: {
        general: localStorage.getItem('app_lang'),
        theme: localStorage.getItem('theme'),
        artist: localStorage.getItem('artist_settings'),
        contact: localStorage.getItem('contact_settings'),
        ground: localStorage.getItem('ground_settings'),
        hospitality: localStorage.getItem('hospitality_settings'),
        admin: localStorage.getItem('admin_settings'),
      },
      timestamp: new Date().toISOString(),
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `settings-export-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    toastSuccess('Configuration exportée');
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        
        if (data.settings) {
          Object.entries(data.settings).forEach(([key, value]) => {
            if (value) {
              localStorage.setItem(key, value as string);
            }
          });
        }
        
        toastSuccess('Configuration importée avec succès');
        window.location.reload();
      } catch (error) {
        console.error('Erreur import:', error);
        toastError('Erreur lors de l\'import de la configuration');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      {/* SECTION BOOKING */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Paramètres Booking
        </h2>
        
        {loading ? (
          <div className="text-gray-600 dark:text-gray-300">Chargement...</div>
        ) : (
          <div className="space-y-4">
            {/* Clauses personnalisées */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-violet-400" />
                    <span className="font-semibold text-gray-900 dark:text-gray-100">Clauses personnalisées</span>
                    <Badge color="blue">{clauses.length}</Badge>
                  </div>
                  <Button variant="primary" onClick={() => { setEditingClause(null); setShowClauseModal(true); }}>
                    <Plus className="w-4 h-4 mr-1" />
                    Ajouter une clause
                  </Button>
                </div>
              </CardHeader>
              <CardBody>
                <div className="space-y-2">
                  {clauses.length === 0 ? (
                    <p className="text-gray-500 dark:text-gray-400 text-sm">Aucune clause personnalisée</p>
                  ) : (
                    clauses.map((clause) => (
                      <div key={clause.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium text-gray-900 dark:text-gray-100">{clause.title}</h3>
                            {clause.default_enabled && <Check className="w-4 h-4 text-green-500" title="Activée par défaut" />}
                            {clause.category && (
                              <Badge color="gray" className="text-xs">{clause.category}</Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{clause.body.substring(0, 100)}...</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => { setEditingClause(clause); setShowClauseModal(true); }}
                            className="p-2 text-gray-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors"
                            title="Modifier"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirm({ type: 'clause', id: clause.id, name: clause.title })}
                            className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                            title="Supprimer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardBody>
            </Card>

            {/* Presets d'exclusivité */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-violet-400" />
                    <span className="font-semibold text-gray-900 dark:text-gray-100">Presets d'exclusivité</span>
                    <Badge color="blue">{exclPresets.length}</Badge>
                  </div>
                  <Button variant="primary" onClick={() => { setEditingExcl(null); setShowExclModal(true); }}>
                    <Plus className="w-4 h-4 mr-1" />
                    Ajouter un preset
                  </Button>
                </div>
              </CardHeader>
              <CardBody>
                <div className="space-y-2">
                  {exclPresets.length === 0 ? (
                    <p className="text-gray-500 dark:text-gray-400 text-sm">Aucun preset d'exclusivité</p>
                  ) : (
                    exclPresets.map((preset) => (
                      <div key={preset.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900 dark:text-gray-100">{preset.name}</h3>
                          <div className="flex items-center gap-4 mt-1 text-sm text-gray-600 dark:text-gray-400">
                            {preset.perimeter_km && <span>Rayon: {preset.perimeter_km}km</span>}
                            {preset.days_before && <span>Avant: {preset.days_before}j</span>}
                            {preset.days_after && <span>Après: {preset.days_after}j</span>}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => { setEditingExcl(preset); setShowExclModal(true); }}
                            className="p-2 text-gray-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors"
                            title="Modifier"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirm({ type: 'excl', id: preset.id, name: preset.name })}
                            className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                            title="Supprimer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardBody>
            </Card>

            {/* Échéanciers de paiement */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-violet-400" />
                    <span className="font-semibold text-gray-900 dark:text-gray-100">Échéanciers de paiement</span>
                    <Badge color="blue">{payPresets.length}</Badge>
                  </div>
                  <Button variant="primary" onClick={() => { setEditingPay(null); setShowPayModal(true); }}>
                    <Plus className="w-4 h-4 mr-1" />
                    Ajouter un échéancier
                  </Button>
                </div>
              </CardHeader>
              <CardBody>
                <div className="space-y-2">
                  {payPresets.length === 0 ? (
                    <p className="text-gray-500 dark:text-gray-400 text-sm">Aucun échéancier de paiement</p>
                  ) : (
                    payPresets.map((preset) => (
                      <div key={preset.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900 dark:text-gray-100">{preset.name}</h3>
                          {preset.description && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{preset.description}</p>
                          )}
                          <div className="flex items-center gap-2 mt-2">
                            {preset.items.map((item, idx) => (
                              <Badge key={idx} color="violet" className="text-xs">
                                {item.percentage ? `${item.percentage}%` : `${item.amount}€`} - {item.label}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => { setEditingPay(preset); setShowPayModal(true); }}
                            className="p-2 text-gray-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors"
                            title="Modifier"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirm({ type: 'pay', id: preset.id, name: preset.name })}
                            className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                            title="Supprimer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardBody>
            </Card>
          </div>
        )}
      </div>

      {/* SECTION EXPORT/IMPORT */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Download className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Export/Import
            </h2>
          </div>
        </CardHeader>
        <CardBody>
          <div className="flex gap-4">
            <Button
              variant="secondary"
              onClick={handleExport}
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Exporter la configuration
            </Button>
            
            <label className="cursor-pointer">
              <input
                type="file"
                accept=".json"
                onChange={handleImport}
                className="hidden"
              />
              <Button
                variant="secondary"
                className="flex items-center gap-2"
              >
                <Upload className="w-4 h-4" />
                Importer la configuration
              </Button>
            </label>
          </div>
        </CardBody>
      </Card>

      {/* Clés d'API */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Key className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Clés d'API
            </h2>
          </div>
        </CardHeader>
        <CardBody>
          <div className="space-y-4">
            <div>
              <Input
                label="EmailJS Public Key"
                type="password"
                value={formData.emailjsPublicKey}
                onChange={(e) => setFormData(prev => ({ ...prev, emailjsPublicKey: e.target.value }))}
                placeholder="user_xxxxxxxxxxxxxxxx"
              />
            </div>
            
            <div>
              <Input
                label="EmailJS Service ID"
                value={formData.emailjsServiceId}
                onChange={(e) => setFormData(prev => ({ ...prev, emailjsServiceId: e.target.value }))}
                placeholder="service_xxxxxxxxx"
              />
            </div>
            
            <div>
              <Input
                label="EmailJS Template ID"
                value={formData.emailjsTemplateId}
                onChange={(e) => setFormData(prev => ({ ...prev, emailjsTemplateId: e.target.value }))}
                placeholder="template_xxxxxxxxx"
              />
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Contrôles multi-tenant */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Contrôles multi-tenant
            </h2>
          </div>
        </CardHeader>
        <CardBody>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white">Company ID</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Identifiant de l'organisation</p>
              </div>
              <Badge color="blue">{companyId || contextCompanyId || 'Non défini'}</Badge>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white">Statut RLS</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Row Level Security activé</p>
              </div>
              <Badge color="green">Actif</Badge>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white">Buckets Storage</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Accès aux fichiers</p>
              </div>
              <Badge color="green">Configuré</Badge>
            </div>
          </div>
        </CardBody>
      </Card>

      <div className="flex justify-end">
        <Button variant="primary" onClick={handleSave}>
          Enregistrer les paramètres
        </Button>
      </div>
      
      {/* Modaux de formulaires complets */}
      <ClauseFormModal
        open={showClauseModal}
        onClose={() => { setShowClauseModal(false); setEditingClause(null); }}
        onSave={handleSaveClause}
        editingClause={editingClause}
      />

      <ExclusivityPresetFormModal
        open={showExclModal}
        onClose={() => { setShowExclModal(false); setEditingExcl(null); }}
        onSave={handleSaveExclPreset}
        editingPreset={editingExcl}
      />

      <PaymentScheduleFormModal
        open={showPayModal}
        onClose={() => { setShowPayModal(false); setEditingPay(null); }}
        onSave={handleSavePayPreset}
        editingPreset={editingPay}
      />

      {/* Confirmation de suppression */}
      <ConfirmDialog
        open={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={async () => {
          if (!deleteConfirm) return;
          
          try {
            if (deleteConfirm.type === 'clause') {
              await deleteOfferClause(deleteConfirm.id);
              toastSuccess("Clause supprimée");
            } else if (deleteConfirm.type === 'excl') {
              await deleteExclusivityPreset(deleteConfirm.id);
              toastSuccess("Preset d'exclusivité supprimé");
            } else if (deleteConfirm.type === 'pay') {
              await deletePaymentSchedulePreset(deleteConfirm.id);
              toastSuccess("Échéancier supprimé");
            }
            
            setDeleteConfirm(null);
            loadBookingData();
          } catch (e: any) {
            console.error("Erreur suppression:", e);
            toastError(e?.message || "Erreur suppression");
          }
        }}
        title="Confirmer la suppression"
        message={`Êtes-vous sûr de vouloir supprimer "${deleteConfirm?.name}" ?`}
        confirmText="Supprimer"
        variant="danger"
      />
    </div>
  );
}

export default SettingsAdminPage;