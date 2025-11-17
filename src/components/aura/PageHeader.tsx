import React from "react";

export interface PageHeaderProps {
  /** Titre principal de la page */
  title: string;
  
  /** Sous-titre ou description (optionnel) */
  subtitle?: React.ReactNode;
  
  /** Actions à afficher à droite (boutons, etc.) */
  actions?: React.ReactNode;
  
  /** Afficher un badge avec le nom de l'événement actuel */
  showEventBadge?: boolean;
  
  /** Classe CSS personnalisée pour le conteneur */
  className?: string;
}

/**
 * PageHeader - Composant AURA standardisé pour les headers de page
 * 
 * @example
 * ```tsx
 * <PageHeader
 *   title="Timeline Booking"
 *   subtitle="Mode production • 15 performances"
 *   actions={
 *     <div className="flex gap-2">
 *       <Button onClick={handleDemo}>Mode démo</Button>
 *       <Button onClick={handleAdd}>+ Performance</Button>
 *     </div>
 *   }
 * />
 * ```
 */
export function PageHeader({
  title,
  subtitle,
  actions,
  showEventBadge = false,
  className = "",
}: PageHeaderProps) {
  return (
    <div className={`flex items-center justify-between ${className}`}>
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
          {title}
        </h1>
        {subtitle && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {subtitle}
          </p>
        )}
      </div>
      
      {actions && (
        <div className="flex items-center gap-3">
          {actions}
        </div>
      )}
    </div>
  );
}

