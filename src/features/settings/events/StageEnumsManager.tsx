import { useState, useEffect } from 'react';
import { Plus, Trash2, Save, X, Edit2, Check } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ConfirmDeleteModal } from '@/components/ui/ConfirmDeleteModal';
import { useToast } from '@/components/aura/ToastProvider';
import {
  fetchStageTypes,
  fetchStageSpecificities,
  createStageType,
  createStageSpecificity,
  updateStageType,
  updateStageSpecificity,
  deleteStageType,
  deleteStageSpecificity,
  initializeStageEnumsForCompany,
  type StageType,
  type StageSpecificity,
} from '@/api/stageEnumsApi';

interface StageEnumsManagerProps {
  companyId: string;
}

export function StageEnumsManager({ companyId }: StageEnumsManagerProps) {
  const { success: toastSuccess, error: toastError } = useToast();

  const [stageTypes, setStageTypes] = useState<StageType[]>([]);
  const [stageSpecificities, setStageSpecificities] = useState<StageSpecificity[]>([]);
  const [loading, setLoading] = useState(false);

  // Formulaire type
  const [showTypeForm, setShowTypeForm] = useState(false);
  const [newTypeLabel, setNewTypeLabel] = useState('');
  const [savingType, setSavingType] = useState(false);

  // Formulaire spécificité
  const [showSpecForm, setShowSpecForm] = useState(false);
  const [newSpecLabel, setNewSpecLabel] = useState('');
  const [savingSpec, setSavingSpec] = useState(false);

  // Édition en ligne
  const [editingTypeId, setEditingTypeId] = useState<string | null>(null);
  const [editingTypeLabel, setEditingTypeLabel] = useState('');
  const [editingSpecId, setEditingSpecId] = useState<string | null>(null);
  const [editingSpecLabel, setEditingSpecLabel] = useState('');

  // Modals de confirmation de suppression
  const [deletingType, setDeletingType] = useState<{ id: string; label: string } | null>(null);
  const [deletingSpec, setDeletingSpec] = useState<{ id: string; label: string } | null>(null);
  const [deleting, setDeleting] = useState(false);
  
  // Modal de confirmation d'initialisation
  const [showInitModal, setShowInitModal] = useState(false);
  const [initializing, setInitializing] = useState(false);

  // Charger les données
  const loadData = async () => {
    console.log('🔍 StageEnumsManager - Chargement des enums pour company:', companyId);
    setLoading(true);
    try {
      const [types, specs] = await Promise.all([
        fetchStageTypes(companyId),
        fetchStageSpecificities(companyId),
      ]);
      console.log('✅ Types récupérés:', types);
      console.log('✅ Spécificités récupérées:', specs);
      setStageTypes(types);
      setStageSpecificities(specs);
    } catch (err: any) {
      console.error('❌ Erreur chargement enums:', err);
      toastError(`Erreur: ${err.message || 'Impossible de charger les types de scènes'}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (companyId) {
      loadData();
    }
  }, [companyId]);

  // Initialiser les valeurs par défaut
  const handleInitialize = () => {
    setShowInitModal(true);
  };

  const handleConfirmInitialize = async () => {
    setInitializing(true);
    try {
      await initializeStageEnumsForCompany(companyId);
      toastSuccess('Valeurs par défaut initialisées');
      loadData();
      setShowInitModal(false);
    } catch (err: any) {
      console.error('Erreur initialisation:', err);
      toastError(err.message || 'Erreur lors de l\'initialisation');
    } finally {
      setInitializing(false);
    }
  };

  // Ajouter un type
  const handleAddType = async () => {
    if (!newTypeLabel.trim()) {
      toastError('Le label est obligatoire');
      return;
    }
    setSavingType(true);
    try {
      await createStageType(companyId, newTypeLabel.trim(), newTypeLabel.trim());
      toastSuccess(`Type "${newTypeLabel}" ajouté`);
      setNewTypeLabel('');
      setShowTypeForm(false);
      loadData();
    } catch (err: any) {
      console.error('Erreur ajout type:', err);
      toastError(err.message || 'Erreur lors de l\'ajout du type');
    } finally {
      setSavingType(false);
    }
  };

  // Éditer un type
  const handleEditType = (type: StageType) => {
    setEditingTypeId(type.id);
    setEditingTypeLabel(type.label);
  };

  // Sauvegarder l'édition d'un type
  const handleSaveType = async (id: string) => {
    if (!editingTypeLabel.trim()) {
      toastError('Le label est obligatoire');
      return;
    }
    try {
      await updateStageType(id, editingTypeLabel.trim());
      toastSuccess('Type modifié');
      setEditingTypeId(null);
      setEditingTypeLabel('');
      loadData();
    } catch (err: any) {
      console.error('Erreur modification type:', err);
      toastError(err.message || 'Erreur lors de la modification du type');
    }
  };

  // Annuler l'édition d'un type
  const handleCancelEditType = () => {
    setEditingTypeId(null);
    setEditingTypeLabel('');
  };

  // Ouvrir le modal de confirmation de suppression d'un type
  const handleDeleteType = (id: string, label: string) => {
    setDeletingType({ id, label });
  };

  // Confirmer la suppression d'un type
  const handleConfirmDeleteType = async () => {
    if (!deletingType) return;
    
    setDeleting(true);
    try {
      await deleteStageType(deletingType.id);
      toastSuccess(`Type "${deletingType.label}" supprimé`);
      setDeletingType(null);
      loadData();
    } catch (err: any) {
      console.error('Erreur suppression type:', err);
      toastError(err.message || 'Erreur lors de la suppression du type');
    } finally {
      setDeleting(false);
    }
  };

  // Ajouter une spécificité
  const handleAddSpec = async () => {
    if (!newSpecLabel.trim()) {
      toastError('Le label est obligatoire');
      return;
    }
    setSavingSpec(true);
    try {
      await createStageSpecificity(companyId, newSpecLabel.trim(), newSpecLabel.trim());
      toastSuccess(`Spécificité "${newSpecLabel}" ajoutée`);
      setNewSpecLabel('');
      setShowSpecForm(false);
      loadData();
    } catch (err: any) {
      console.error('Erreur ajout spécificité:', err);
      toastError(err.message || 'Erreur lors de l\'ajout de la spécificité');
    } finally {
      setSavingSpec(false);
    }
  };

  // Éditer une spécificité
  const handleEditSpec = (spec: StageSpecificity) => {
    setEditingSpecId(spec.id);
    setEditingSpecLabel(spec.label);
  };

  // Sauvegarder l'édition d'une spécificité
  const handleSaveSpec = async (id: string) => {
    if (!editingSpecLabel.trim()) {
      toastError('Le label est obligatoire');
      return;
    }
    try {
      await updateStageSpecificity(id, editingSpecLabel.trim());
      toastSuccess('Spécificité modifiée');
      setEditingSpecId(null);
      setEditingSpecLabel('');
      loadData();
    } catch (err: any) {
      console.error('Erreur modification spécificité:', err);
      toastError(err.message || 'Erreur lors de la modification de la spécificité');
    }
  };

  // Annuler l'édition d'une spécificité
  const handleCancelEditSpec = () => {
    setEditingSpecId(null);
    setEditingSpecLabel('');
  };

  // Ouvrir le modal de confirmation de suppression d'une spécificité
  const handleDeleteSpec = (id: string, label: string) => {
    setDeletingSpec({ id, label });
  };

  // Confirmer la suppression d'une spécificité
  const handleConfirmDeleteSpec = async () => {
    if (!deletingSpec) return;
    
    setDeleting(true);
    try {
      await deleteStageSpecificity(deletingSpec.id);
      toastSuccess(`Spécificité "${deletingSpec.label}" supprimée`);
      setDeletingSpec(null);
      loadData();
    } catch (err: any) {
      console.error('Erreur suppression spécificité:', err);
      toastError(err.message || 'Erreur lors de la suppression de la spécificité');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return <div className="text-sm text-gray-500">Chargement...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Bouton initialisation si vide */}
      {stageTypes.length === 0 && stageSpecificities.length === 0 && (
        <Card className="p-4 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-blue-900 dark:text-blue-100">Aucune valeur trouvée</h4>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Initialisez les valeurs par défaut pour commencer
              </p>
            </div>
            <Button variant="primary" onClick={handleInitialize}>
              Initialiser les valeurs par défaut
            </Button>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-6">
        {/* Container Types de scènes */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Types de scènes</h3>
            <Button
              variant="primary"
              onClick={() => setShowTypeForm(!showTypeForm)}
              disabled={savingType}
              className="w-8 h-8 p-1"
            >
              {showTypeForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            </Button>
          </div>

          {/* Formulaire ajout */}
          {showTypeForm && (
            <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg space-y-3">
              <Input
                label="Nom du type"
                value={newTypeLabel}
                onChange={(e) => setNewTypeLabel(e.target.value)}
                placeholder="Ex: Principale, Club..."
                disabled={savingType}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddType();
                  }
                }}
              />
              <div className="flex gap-2">
                <Button
                  variant="primary"
                  onClick={handleAddType}
                  disabled={savingType || !newTypeLabel.trim()}
                >
                  <Save className="w-4 h-4 mr-1" />
                  Ajouter
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setShowTypeForm(false);
                    setNewTypeLabel('');
                  }}
                  disabled={savingType}
                >
                  Annuler
                </Button>
              </div>
            </div>
          )}

          {/* Liste des types */}
          {stageTypes.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">Aucun type de scène</p>
          ) : (
            <div className="space-y-2">
              {stageTypes.map((type) => (
                <div
                  key={type.id}
                  className="flex items-center justify-between p-3 rounded-lg"
                  style={{
                    background: 'var(--color-bg-elevated)',
                    transition: 'background 0.15s ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-hover-row)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'var(--color-bg-elevated)'}
                >
                  {editingTypeId === type.id ? (
                    // Mode édition
                    <>
                      <Input
                        value={editingTypeLabel}
                        onChange={(e) => setEditingTypeLabel(e.target.value)}
                        className="flex-1 mr-2"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleSaveType(type.id);
                          } else if (e.key === 'Escape') {
                            handleCancelEditType();
                          }
                        }}
                      />
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleSaveType(type.id)}
                          className="p-1 text-green-500 hover:text-green-700 hover:bg-green-100 dark:hover:bg-green-900/30 rounded transition-colors"
                          title="Valider"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={handleCancelEditType}
                          className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
                          title="Annuler"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </>
                  ) : (
                    // Mode affichage
                    <>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {type.label}
                      </span>
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleEditType(type)}
                          className="p-1 text-blue-500 hover:text-blue-700 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded transition-colors"
                          title="Modifier"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteType(type.id, type.label)}
                          className="p-1 text-red-500 hover:text-red-700 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors"
                          title="Supprimer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Container Spécificités de scènes */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Spécificités de scènes</h3>
            <Button
              variant="primary"
              onClick={() => setShowSpecForm(!showSpecForm)}
              disabled={savingSpec}
              className="w-8 h-8 p-1"
            >
              {showSpecForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            </Button>
          </div>

          {/* Formulaire ajout */}
          {showSpecForm && (
            <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg space-y-3">
              <Input
                label="Nom de la spécificité"
                value={newSpecLabel}
                onChange={(e) => setNewSpecLabel(e.target.value)}
                placeholder="Ex: Couvert, Plein air..."
                disabled={savingSpec}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSpec();
                  }
                }}
              />
              <div className="flex gap-2">
                <Button
                  variant="primary"
                  onClick={handleAddSpec}
                  disabled={savingSpec || !newSpecLabel.trim()}
                >
                  <Save className="w-4 h-4 mr-1" />
                  Ajouter
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setShowSpecForm(false);
                    setNewSpecLabel('');
                  }}
                  disabled={savingSpec}
                >
                  Annuler
                </Button>
              </div>
            </div>
          )}

          {/* Liste des spécificités */}
          {stageSpecificities.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">Aucune spécificité de scène</p>
          ) : (
            <div className="space-y-2">
              {stageSpecificities.map((spec) => (
                <div
                  key={spec.id}
                  className="flex items-center justify-between p-3 rounded-lg"
                  style={{
                    background: 'var(--color-bg-elevated)',
                    transition: 'background 0.15s ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-hover-row)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'var(--color-bg-elevated)'}
                >
                  {editingSpecId === spec.id ? (
                    // Mode édition
                    <>
                      <Input
                        value={editingSpecLabel}
                        onChange={(e) => setEditingSpecLabel(e.target.value)}
                        className="flex-1 mr-2"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleSaveSpec(spec.id);
                          } else if (e.key === 'Escape') {
                            handleCancelEditSpec();
                          }
                        }}
                      />
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleSaveSpec(spec.id)}
                          className="p-1 text-green-500 hover:text-green-700 hover:bg-green-100 dark:hover:bg-green-900/30 rounded transition-colors"
                          title="Valider"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={handleCancelEditSpec}
                          className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
                          title="Annuler"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </>
                  ) : (
                    // Mode affichage
                    <>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {spec.label}
                      </span>
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleEditSpec(spec)}
                          className="p-1 text-blue-500 hover:text-blue-700 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded transition-colors"
                          title="Modifier"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteSpec(spec.id, spec.label)}
                          className="p-1 text-red-500 hover:text-red-700 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors"
                          title="Supprimer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Modal de confirmation de suppression d'un type */}
      {deletingType && (
        <ConfirmDeleteModal
          isOpen={true}
          onClose={() => setDeletingType(null)}
          onConfirm={handleConfirmDeleteType}
          title="Supprimer le type de scène"
          message="Êtes-vous sûr de vouloir supprimer ce type de scène ? Les scènes existantes utilisant ce type ne seront pas affectées."
          itemName={deletingType.label}
          loading={deleting}
        />
      )}

      {/* Modal de confirmation de suppression d'une spécificité */}
      {deletingSpec && (
        <ConfirmDeleteModal
          isOpen={true}
          onClose={() => setDeletingSpec(null)}
          onConfirm={handleConfirmDeleteSpec}
          title="Supprimer la spécificité de scène"
          message="Êtes-vous sûr de vouloir supprimer cette spécificité ? Les scènes existantes utilisant cette spécificité ne seront pas affectées."
          itemName={deletingSpec.label}
          loading={deleting}
        />
      )}

      {/* Modal de confirmation d'initialisation */}
      <ConfirmDeleteModal
        isOpen={showInitModal}
        onClose={() => setShowInitModal(false)}
        onConfirm={handleConfirmInitialize}
        title="Initialiser les valeurs par défaut"
        message="Voulez-vous initialiser les valeurs par défaut ? Cela ne créera pas de doublons."
        itemName=""
        loading={initializing}
      />
    </div>
  );
}

