import { useState, useEffect } from "react";
import { Modal } from "@/components/aura/Modal";
import { Button } from "@/components/aura/Button";
import { Input } from "@/components/aura/Input";
import { Plus, Trash2 } from "lucide-react";
import type { PaymentSchedulePreset, PaymentScheduleItem } from "@/features/booking/advancedBookingApi";

interface PaymentScheduleFormModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
  editingPreset: PaymentSchedulePreset | null;
}

export function PaymentScheduleFormModal({ open, onClose, onSave, editingPreset }: PaymentScheduleFormModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    items: [] as PaymentScheduleItem[],
  });
  
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editingPreset) {
      setFormData({
        name: editingPreset.name,
        description: editingPreset.description || "",
        items: editingPreset.items,
      });
    } else {
      setFormData({
        name: "",
        description: "",
        items: [
          { label: "Acompte", percentage: 30, due_offset_days: 0, is_milestone: true },
          { label: "Solde", percentage: 70, due_offset_days: 30, is_milestone: true },
        ],
      });
    }
  }, [editingPreset, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation : la somme des pourcentages doit faire 100%
    const totalPercentage = formData.items.reduce((sum, item) => sum + (item.percentage || 0), 0);
    if (totalPercentage !== 100) {
      alert(`La somme des pourcentages doit faire 100% (actuellement : ${totalPercentage}%)`);
      return;
    }
    
    setSaving(true);
    try {
      await onSave(formData);
    } finally {
      setSaving(false);
    }
  };

  const addItem = () => {
    setFormData({
      ...formData,
      items: [
        ...formData.items,
        { label: "Nouveau paiement", percentage: 0, due_offset_days: 0, is_milestone: true },
      ],
    });
  };

  const removeItem = (index: number) => {
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index),
    });
  };

  const updateItem = (index: number, field: keyof PaymentScheduleItem, value: any) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setFormData({ ...formData, items: newItems });
  };

  const totalPercentage = formData.items.reduce((sum, item) => sum + (item.percentage || 0), 0);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editingPreset ? "Modifier l'échéancier de paiement" : "Ajouter un échéancier de paiement"}
      widthClass="max-w-3xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
              Nom de l'échéancier <span className="text-red-500">*</span>
            </label>
            <Input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: Standard (30% - 70%)"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
              Description
            </label>
            <Input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Ex: Acompte à la signature, solde après"
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-gray-900 dark:text-gray-100">
              Échéances de paiement
            </label>
            <Button type="button" variant="ghost" onClick={addItem} className="text-sm">
              <Plus className="w-4 h-4 mr-1" />
              Ajouter une échéance
            </Button>
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {formData.items.map((item, index) => (
              <div key={index} className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex-1 grid grid-cols-3 gap-2">
                  <Input
                    type="text"
                    value={item.label}
                    onChange={(e) => updateItem(index, 'label', e.target.value)}
                    placeholder="Label"
                    required
                  />
                  
                  <div className="relative">
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={item.percentage || 0}
                      onChange={(e) => updateItem(index, 'percentage', parseFloat(e.target.value) || 0)}
                      placeholder="0"
                      required
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">%</span>
                  </div>
                  
                  <div className="relative">
                    <Input
                      type="number"
                      value={item.due_offset_days}
                      onChange={(e) => updateItem(index, 'due_offset_days', parseInt(e.target.value) || 0)}
                      placeholder="0"
                      required
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs">jours</span>
                  </div>
                </div>
                
                <button
                  type="button"
                  onClick={() => removeItem(index)}
                  className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                  title="Supprimer"
                  disabled={formData.items.length <= 1}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">
              <strong>Offset jours :</strong> Nombre de jours avant (-) ou après (+) la date de prestation
            </span>
            <span className={`font-semibold ${totalPercentage === 100 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              Total : {totalPercentage}%
            </span>
          </div>
        </div>

        {totalPercentage !== 100 && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
            <p className="text-sm text-red-800 dark:text-red-200">
              ⚠️ La somme des pourcentages doit faire exactement 100% (actuellement : {totalPercentage}%)
            </p>
          </div>
        )}

        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            <strong>💡 Exemple :</strong> Pour un acompte de 30% à la signature (offset 0) et un solde de 70% à 30 jours après la prestation (offset +30).
          </p>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button type="button" variant="ghost" onClick={onClose} disabled={saving}>
            Annuler
          </Button>
          <Button type="submit" variant="primary" disabled={saving || totalPercentage !== 100}>
            {saving ? "Enregistrement..." : editingPreset ? "Mettre à jour" : "Créer"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}


