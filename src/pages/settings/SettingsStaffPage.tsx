import { useState } from 'react';
import { Users, Plus, Edit2, Trash2, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { useToast } from '@/components/aura/ToastProvider';
import { useStaffLookups } from '@/hooks/useStaffLookups';
import type {
  StaffVolunteerStatus,
  StaffVolunteerGroup,
  StaffVolunteerSkill,
} from '@/types/staff';

type LookupType = 'status' | 'group' | 'skill';

export default function SettingsStaffPage() {
  const { success, error: toastError } = useToast();
  const {
    statuses,
    groups,
    skills,
    loading,
    createStatus,
    updateStatus,
    deleteStatus,
    createGroup,
    updateGroup,
    deleteGroup,
    createSkill,
    updateSkill,
    deleteSkill,
  } = useStaffLookups();

  const [activeTab, setActiveTab] = useState<LookupType>('status');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  // Form states
  const [statusForm, setStatusForm] = useState({ name: '', color: '#10b981' });
  const [groupForm, setGroupForm] = useState({ name: '', description: '' });
  const [skillForm, setSkillForm] = useState({ name: '', description: '' });

  const resetForms = () => {
    setStatusForm({ name: '', color: '#10b981' });
    setGroupForm({ name: '', description: '' });
    setSkillForm({ name: '', description: '' });
    setEditingId(null);
    setIsAdding(false);
  };

  // ───────────────────────────────────────────────────────────────────────────
  // Statuts
  // ───────────────────────────────────────────────────────────────────────────

  const handleAddStatus = () => {
    setIsAdding(true);
    setStatusForm({ name: '', color: '#10b981' });
  };

  const handleEditStatus = (status: StaffVolunteerStatus) => {
    setEditingId(status.id);
    setStatusForm({ name: status.name, color: status.color });
  };

  const handleSaveStatus = async () => {
    if (!statusForm.name.trim()) {
      toastError('Le nom est requis');
      return;
    }

    try {
      if (editingId) {
        await updateStatus(editingId, {
          name: statusForm.name,
          color: statusForm.color,
        });
        success('Statut mis à jour');
      } else {
        await createStatus(statusForm.name, statusForm.color);
        success('Statut créé');
      }
      resetForms();
    } catch (err: any) {
      toastError(err.message || 'Erreur lors de la sauvegarde');
    }
  };

  const handleDeleteStatus = async (id: string) => {
    if (!confirm('Supprimer ce statut ?')) return;
    try {
      await deleteStatus(id);
      success('Statut supprimé');
    } catch (err: any) {
      toastError(err.message || 'Erreur lors de la suppression');
    }
  };

  // ───────────────────────────────────────────────────────────────────────────
  // Groupes
  // ───────────────────────────────────────────────────────────────────────────

  const handleAddGroup = () => {
    setIsAdding(true);
    setGroupForm({ name: '', description: '' });
  };

  const handleEditGroup = (group: StaffVolunteerGroup) => {
    setEditingId(group.id);
    setGroupForm({ name: group.name, description: group.description || '' });
  };

  const handleSaveGroup = async () => {
    if (!groupForm.name.trim()) {
      toastError('Le nom est requis');
      return;
    }

    try {
      if (editingId) {
        await updateGroup(editingId, {
          name: groupForm.name,
          description: groupForm.description || null,
        });
        success('Groupe mis à jour');
      } else {
        await createGroup(groupForm.name, groupForm.description);
        success('Groupe créé');
      }
      resetForms();
    } catch (err: any) {
      toastError(err.message || 'Erreur lors de la sauvegarde');
    }
  };

  const handleDeleteGroup = async (id: string) => {
    if (!confirm('Supprimer ce groupe ?')) return;
    try {
      await deleteGroup(id);
      success('Groupe supprimé');
    } catch (err: any) {
      toastError(err.message || 'Erreur lors de la suppression');
    }
  };

  // ───────────────────────────────────────────────────────────────────────────
  // Compétences
  // ───────────────────────────────────────────────────────────────────────────

  const handleAddSkill = () => {
    setIsAdding(true);
    setSkillForm({ name: '', description: '' });
  };

  const handleEditSkill = (skill: StaffVolunteerSkill) => {
    setEditingId(skill.id);
    setSkillForm({ name: skill.name, description: skill.description || '' });
  };

  const handleSaveSkill = async () => {
    if (!skillForm.name.trim()) {
      toastError('Le nom est requis');
      return;
    }

    try {
      if (editingId) {
        await updateSkill(editingId, {
          name: skillForm.name,
          description: skillForm.description || null,
        });
        success('Compétence mise à jour');
      } else {
        await createSkill(skillForm.name, skillForm.description);
        success('Compétence créée');
      }
      resetForms();
    } catch (err: any) {
      toastError(err.message || 'Erreur lors de la sauvegarde');
    }
  };

  const handleDeleteSkill = async (id: string) => {
    if (!confirm('Supprimer cette compétence ?')) return;
    try {
      await deleteSkill(id);
      success('Compétence supprimée');
    } catch (err: any) {
      toastError(err.message || 'Erreur lors de la suppression');
    }
  };

  return (
    <div className="p-6">
      <header className="flex items-center gap-2 mb-6">
        <Users className="w-5 h-5 text-violet-400" />
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
          PARAMÈTRES STAFF
        </h1>
      </header>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => {
            setActiveTab('status');
            resetForms();
          }}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'status'
              ? 'text-violet-600 dark:text-violet-400 border-b-2 border-violet-600 dark:border-violet-400'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          Statuts
        </button>
        <button
          onClick={() => {
            setActiveTab('group');
            resetForms();
          }}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'group'
              ? 'text-violet-600 dark:text-violet-400 border-b-2 border-violet-600 dark:border-violet-400'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          Groupes
        </button>
        <button
          onClick={() => {
            setActiveTab('skill');
            resetForms();
          }}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'skill'
              ? 'text-violet-600 dark:text-violet-400 border-b-2 border-violet-600 dark:border-violet-400'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          Compétences
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">Chargement...</p>
        </div>
      ) : (
        <>
          {/* STATUTS */}
          {activeTab === 'status' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                  Statuts des bénévoles
                </h2>
                {!isAdding && !editingId && (
                  <Button onClick={handleAddStatus}>
                    <Plus className="w-4 h-4 mr-2" />
                    Ajouter
                  </Button>
                )}
              </div>

              {(isAdding || editingId) && (
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 mb-4">
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <Input
                      label="Nom du statut"
                      value={statusForm.name}
                      onChange={(e) =>
                        setStatusForm({ ...statusForm, name: e.target.value })
                      }
                      placeholder="Ex: Actif, Inactif, En attente..."
                    />
                    <div>
                      <label className="block text-sm text-gray-600 dark:text-gray-400 mb-2">
                        Couleur
                      </label>
                      <input
                        type="color"
                        value={statusForm.color}
                        onChange={(e) =>
                          setStatusForm({ ...statusForm, color: e.target.value })
                        }
                        className="w-full h-10 rounded-lg border border-gray-300 dark:border-gray-600 cursor-pointer"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="secondary" onClick={resetForms}>
                      <X className="w-4 h-4 mr-2" />
                      Annuler
                    </Button>
                    <Button onClick={handleSaveStatus}>
                      <Save className="w-4 h-4 mr-2" />
                      {editingId ? 'Modifier' : 'Créer'}
                    </Button>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                {statuses.map((status) => (
                  <div
                    key={status.id}
                    className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: status.color }}
                      />
                      <span className="font-medium text-gray-900 dark:text-white">
                        {status.name}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditStatus(status)}
                        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        title="Modifier"
                      >
                        <Edit2 className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                      </button>
                      <button
                        onClick={() => handleDeleteStatus(status.id)}
                        className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors"
                        title="Supprimer"
                      >
                        <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* GROUPES */}
          {activeTab === 'group' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                  Groupes de bénévoles
                </h2>
                {!isAdding && !editingId && (
                  <Button onClick={handleAddGroup}>
                    <Plus className="w-4 h-4 mr-2" />
                    Ajouter
                  </Button>
                )}
              </div>

              {(isAdding || editingId) && (
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 mb-4">
                  <div className="space-y-4 mb-4">
                    <Input
                      label="Nom du groupe"
                      value={groupForm.name}
                      onChange={(e) =>
                        setGroupForm({ ...groupForm, name: e.target.value })
                      }
                      placeholder="Ex: Équipe A, Accueil, Logistique..."
                    />
                    <Textarea
                      label="Description (optionnelle)"
                      value={groupForm.description}
                      onChange={(e) =>
                        setGroupForm({ ...groupForm, description: e.target.value })
                      }
                      placeholder="Description du groupe..."
                      rows={2}
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="secondary" onClick={resetForms}>
                      <X className="w-4 h-4 mr-2" />
                      Annuler
                    </Button>
                    <Button onClick={handleSaveGroup}>
                      <Save className="w-4 h-4 mr-2" />
                      {editingId ? 'Modifier' : 'Créer'}
                    </Button>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                {groups.map((group) => (
                  <div
                    key={group.id}
                    className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-white mb-1">
                          {group.name}
                        </h3>
                        {group.description && (
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {group.description}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditGroup(group)}
                          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                          title="Modifier"
                        >
                          <Edit2 className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                        </button>
                        <button
                          onClick={() => handleDeleteGroup(group.id)}
                          className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors"
                          title="Supprimer"
                        >
                          <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* COMPÉTENCES */}
          {activeTab === 'skill' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                  Compétences des bénévoles
                </h2>
                {!isAdding && !editingId && (
                  <Button onClick={handleAddSkill}>
                    <Plus className="w-4 h-4 mr-2" />
                    Ajouter
                  </Button>
                )}
              </div>

              {(isAdding || editingId) && (
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 mb-4">
                  <div className="space-y-4 mb-4">
                    <Input
                      label="Nom de la compétence"
                      value={skillForm.name}
                      onChange={(e) =>
                        setSkillForm({ ...skillForm, name: e.target.value })
                      }
                      placeholder="Ex: Secourisme, Technique son, Langue anglaise..."
                    />
                    <Textarea
                      label="Description (optionnelle)"
                      value={skillForm.description}
                      onChange={(e) =>
                        setSkillForm({ ...skillForm, description: e.target.value })
                      }
                      placeholder="Description de la compétence..."
                      rows={2}
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="secondary" onClick={resetForms}>
                      <X className="w-4 h-4 mr-2" />
                      Annuler
                    </Button>
                    <Button onClick={handleSaveSkill}>
                      <Save className="w-4 h-4 mr-2" />
                      {editingId ? 'Modifier' : 'Créer'}
                    </Button>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                {skills.map((skill) => (
                  <div
                    key={skill.id}
                    className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-white mb-1">
                          {skill.name}
                        </h3>
                        {skill.description && (
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {skill.description}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditSkill(skill)}
                          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                          title="Modifier"
                        >
                          <Edit2 className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                        </button>
                        <button
                          onClick={() => handleDeleteSkill(skill.id)}
                          className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors"
                          title="Supprimer"
                        >
                          <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}










