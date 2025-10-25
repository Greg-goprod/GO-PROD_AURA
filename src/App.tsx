// ============================================================
// 🚀 LANDING PAGE ONLY - Mode déploiement simplifié
// ============================================================
// Toutes les routes de l'app sont commentées pour déployer
// uniquement la landing page sans dépendances Supabase/API
// ============================================================

import { Routes, Route } from 'react-router-dom'
import { PublicLayout } from './layouts/PublicLayout'
import { LandingPage } from './pages/public/LandingPage'

export default function App(){
  return (
    <Routes>
      {/* Landing Page UNIQUEMENT */}
      <Route path="/" element={<PublicLayout />}>
        <Route index element={<LandingPage />} />
      </Route>
      
      {/* Toutes les autres routes redirigent vers la landing */}
      <Route path="*" element={<PublicLayout />}>
        <Route index element={<LandingPage />} />
      </Route>
    </Routes>
  )
}
