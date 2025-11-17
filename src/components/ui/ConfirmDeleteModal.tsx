import { AlertTriangle } from "lucide-react";
import Modal, { ModalFooter, ModalButton } from "./Modal";

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  itemName?: string;
  loading?: boolean;
}

export function ConfirmDeleteModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  itemName,
  loading = false
}: ConfirmDeleteModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      draggable={true}
      footer={
        <ModalFooter>
          <ModalButton variant="secondary" onClick={onClose} disabled={loading}>
            Annuler
          </ModalButton>
          <ModalButton 
            variant="danger" 
            onClick={onConfirm} 
            loading={loading}
          >
            Supprimer
          </ModalButton>
        </ModalFooter>
      }
    >
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0">
          <div className="w-10 h-10 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
          </div>
        </div>
        <div className="flex-1">
          <p className="text-sm text-gray-700 dark:text-gray-200 mb-3">
            {message}
          </p>
          {itemName && itemName.toLowerCase() !== 'à définir' && itemName.trim() !== '' && (
            <div className="my-4 p-3 rounded-lg bg-gray-100 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
              <p className="text-base font-bold text-gray-900 dark:text-white">
                {itemName}
              </p>
            </div>
          )}
          <p className="text-sm font-bold text-red-600 dark:text-red-400 uppercase tracking-wider mt-4">
            Cette action est irréversible
          </p>
        </div>
      </div>
    </Modal>
  );
}

export default ConfirmDeleteModal;
