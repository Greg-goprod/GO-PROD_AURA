// ============================================================
// 🚀 GO-PROD LANDING PAGE - Nouvelle version
// ============================================================
// Landing page complète de gestion événementielle
// Design system AURA (dark-mode-first)
// ============================================================

import { Routes, Route } from 'react-router-dom'
import LandingPage from './pages/landing/LandingPage'

export default function App(){
  return (
    <Routes>
      {/* Landing Page Go-Prod v2.0 */}
      <Route path="/" element={<LandingPage />} />
      
      {/* Toutes les autres routes redirigent vers la landing */}
      <Route path="*" element={<LandingPage />} />
    </Routes>
  )
}
