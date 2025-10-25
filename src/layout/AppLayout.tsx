import { Link, Outlet, useLocation } from 'react-router-dom'
import { Icon } from '../components/ui/Icon'
import TopBar from '../components/topbar/TopBar'
import UserMenu from '../components/topbar/UserMenu'
import { useState, useEffect } from 'react'
import type { Profile } from '../types/user'
import { supabase } from '../lib/supabaseClient'
import { ChevronDown } from 'lucide-react'
import { useI18n } from '../lib/i18n'

// Utilisation de l'instance centralisée de Supabase

export default function AppLayout(){
  const location = useLocation()
  const { t } = useI18n()
  const [profile, setProfile] = useState<Profile | null>(null)
  
  // Initialiser les menus ouverts en fonction de l'URL actuelle
  const getInitialOpenMenus = () => {
    const path = location.pathname
    const menus = {
      artistes: false,
      production: false,
      ground: false,
      hospitality: false,
      administration: false,
      contacts: false,
      settings: false
    }
    
    if (path.startsWith('/app/artistes')) {
      menus.artistes = true
    } else if (path.startsWith('/app/production')) {
      menus.production = true
      if (path.includes('/ground')) menus.ground = true
      if (path.includes('/hospitality')) menus.hospitality = true
    } else if (path.startsWith('/app/administration')) {
      menus.administration = true
    } else if (path.startsWith('/app/contacts')) {
      menus.contacts = true
    } else if (path.startsWith('/app/settings')) {
      menus.settings = true
    }
    
    return menus
  }
  
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>(getInitialOpenMenus)

  // Auto-open menus based on current route
  useEffect(() => {
    const path = location.pathname
    
    // Réinitialiser tous les menus
    const newOpenMenus = {
      artistes: false,
      production: false,
      ground: false,
      hospitality: false,
      administration: false,
      contacts: false,
      settings: false
    }
    
    // Ouvrir les menus selon le chemin actuel
    if (path.startsWith('/app/artistes')) {
      newOpenMenus.artistes = true
    } else if (path.startsWith('/app/production')) {
      newOpenMenus.production = true
      if (path.includes('/ground')) newOpenMenus.ground = true
      if (path.includes('/hospitality')) newOpenMenus.hospitality = true
    } else if (path.startsWith('/app/administration')) {
      newOpenMenus.administration = true
    } else if (path.startsWith('/app/contacts')) {
      newOpenMenus.contacts = true
    } else if (path.startsWith('/app/settings')) {
      newOpenMenus.settings = true
    }
    
    setOpenMenus(newOpenMenus)
  }, [location.pathname])

  const toggleMenu = (menu: string) => {
    setOpenMenus(prev => {
      const isCurrentlyOpen = prev[menu]
      
      // Menus parents de premier niveau
      const parentMenus = ['artistes', 'administration', 'production', 'contacts', 'settings']
      
      // Si c'est un sous-menu (ground, hospitality), toggle simple
      if (!parentMenus.includes(menu)) {
        return { ...prev, [menu]: !prev[menu] }
      }
      
      // Si c'est un menu parent, fermer les autres parents
      if (!isCurrentlyOpen) {
        const newState = { ...prev }
        // Fermer tous les menus parents sauf celui-ci
        parentMenus.forEach(m => {
          if (m !== menu) newState[m] = false
        })
        newState[menu] = true
        return newState
      } else {
        return { ...prev, [menu]: false }
      }
    })
  }

  useEffect(() => {
    // Écouter les changements d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const uid = session?.user?.id;
      if (!uid) {
        setProfile(null);
        return;
      }
      
      // Charger le profil depuis la table profiles
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url, role, company_id')
        .eq('id', uid)
        .single();
      
      if (data && !error) {
        setProfile(data as Profile);
      }
    });

    // Charger le profil initial
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const uid = session?.user?.id;
      if (!uid) {
        // Mock profile pour dev si pas d'authentification
        setProfile({
          id: '1',
          full_name: 'Jean Dupont',
          avatar_url: null,
          role: 'admin',
          company_id: null
        });
        return;
      }
      
      const { data } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url, role, company_id')
        .eq('id', uid)
        .single();
      
      if (data) {
        setProfile(data as Profile);
      }
    })();

    return () => {
      subscription.unsubscribe();
    };
  }, [])

  return (
    <div className="h-screen flex overflow-hidden">
      {/* Sidebar */}
      <aside className="sidebar p-4 fixed h-screen flex flex-col overflow-y-auto">
        <div className="logo h2 mb-6">GO-PROD</div>
        
        {/* Navigation */}
        <nav className="flex-1 flex flex-col gap-0.5 overflow-y-auto pr-2">
          {/* Artistes */}
          <div>
            <button 
              onClick={() => toggleMenu('artistes')}
              className="sidebar-item w-full flex items-center justify-between"
            >
              <span className="flex items-center gap-2">
                <Icon name="Music" size={18}/> {t('artists').toUpperCase()}
              </span>
              <ChevronDown className={`w-4 h-4 transition-transform ${openMenus.artistes ? 'rotate-180' : ''}`} />
            </button>
            {openMenus.artistes && (
              <div className="ml-4 mt-0.5 space-y-0.5">
                <Link to="/app/artistes" className={`sidebar-item text-sm ${location.pathname === '/app/artistes' ? 'active' : ''}`}>
                  <Icon name="List" size={16}/> {t('list')}
                </Link>
                <Link to="/app/artistes/lineup" className={`sidebar-item text-sm ${location.pathname === '/app/artistes/lineup' ? 'active' : ''}`}>
                  <Icon name="ListMusic" size={16}/> {t('lineup')}
                </Link>
              </div>
            )}
          </div>

          {/* Administration */}
          <div>
            <button 
              onClick={() => toggleMenu('administration')}
              className="sidebar-item w-full flex items-center justify-between"
            >
              <span className="flex items-center gap-2">
                <Icon name="Briefcase" size={18}/> {t('administration').toUpperCase()}
              </span>
              <ChevronDown className={`w-4 h-4 transition-transform ${openMenus.administration ? 'rotate-180' : ''}`} />
            </button>
            {openMenus.administration && (
              <div className="ml-4 mt-0.5 space-y-0.5">
                <Link to="/app/administration/booking" className={`sidebar-item text-sm ${location.pathname === '/app/administration/booking' ? 'active' : ''}`}>
                  <Icon name="Calendar" size={16}/> {t('booking')}
                </Link>
                <Link to="/app/administration/budget-artistique" className={`sidebar-item text-sm ${location.pathname === '/app/administration/budget-artistique' ? 'active' : ''}`}>
                  <Icon name="DollarSign" size={16}/> {t('artistic_budget')}
                </Link>
                <Link to="/app/administration/contrats" className={`sidebar-item text-sm ${location.pathname === '/app/administration/contrats' ? 'active' : ''}`}>
                  <Icon name="FileText" size={16}/> {t('contracts')}
                </Link>
                <Link to="/app/administration/finances" className={`sidebar-item text-sm ${location.pathname === '/app/administration/finances' ? 'active' : ''}`}>
                  <Icon name="Wallet" size={16}/> {t('finances')}
                </Link>
                <Link to="/app/administration/ventes" className={`sidebar-item text-sm ${location.pathname === '/app/administration/ventes' ? 'active' : ''}`}>
                  <Icon name="ShoppingCart" size={16}/> {t('sales')}
                </Link>
              </div>
            )}
          </div>

          {/* Production */}
          <div>
            <button 
              onClick={() => toggleMenu('production')}
              className="sidebar-item w-full flex items-center justify-between"
            >
              <span className="flex items-center gap-2">
                <Icon name="Clapperboard" size={18}/> {t('production').toUpperCase()}
              </span>
              <ChevronDown className={`w-4 h-4 transition-transform ${openMenus.production ? 'rotate-180' : ''}`} />
            </button>
            {openMenus.production && (
              <div className="ml-4 mt-0.5 space-y-0.5">
                <Link to="/app/production/touring-party" className={`sidebar-item text-sm ${location.pathname === '/app/production/touring-party' ? 'active' : ''}`}>
                  <Icon name="Users2" size={16}/> {t('touring_party')}
                </Link>
                <Link to="/app/production/travel" className={`sidebar-item text-sm ${location.pathname === '/app/production/travel' ? 'active' : ''}`}>
                  <Icon name="Plane" size={16}/> {t('travel')}
                </Link>
                
                {/* Ground submenu */}
                <div>
                  <button 
                    onClick={() => toggleMenu('ground')}
                    className="sidebar-item w-full flex items-center justify-between text-sm"
                  >
                    <span className="flex items-center gap-2">
                      <Icon name="Truck" size={16}/> {t('ground')}
                    </span>
                    <ChevronDown className={`w-3 h-3 transition-transform ${openMenus.ground ? 'rotate-180' : ''}`} />
                  </button>
                      {openMenus.ground && (
                        <div className="ml-4 mt-0.5 space-y-0.5">
                          <Link to="/app/production/ground/missions" className={`sidebar-item text-xs ${location.pathname === '/app/production/ground/missions' ? 'active' : ''}`}>
                            <Icon name="MapPin" size={14}/> {t('missions')}
                          </Link>
                          <Link to="/app/production/ground/chauffeurs" className={`sidebar-item text-xs ${location.pathname === '/app/production/ground/chauffeurs' ? 'active' : ''}`}>
                            <Icon name="UserRound" size={14}/> {t('drivers')}
                          </Link>
                          <Link to="/app/production/ground/vehicules" className={`sidebar-item text-xs ${location.pathname === '/app/production/ground/vehicules' ? 'active' : ''}`}>
                            <Icon name="Bus" size={14}/> {t('vehicles')}
                          </Link>
                          <Link to="/app/production/ground/horaires" className={`sidebar-item text-xs ${location.pathname === '/app/production/ground/horaires' ? 'active' : ''}`}>
                            <Icon name="Clock" size={14}/> {t('schedules')}
                          </Link>
                        </div>
                      )}
                </div>

                {/* Hospitality submenu */}
                <div>
                  <button 
                    onClick={() => toggleMenu('hospitality')}
                    className="sidebar-item w-full flex items-center justify-between text-sm"
                  >
                    <span className="flex items-center gap-2">
                      <Icon name="Coffee" size={16}/> {t('hospitality')}
                    </span>
                    <ChevronDown className={`w-3 h-3 transition-transform ${openMenus.hospitality ? 'rotate-180' : ''}`} />
                  </button>
                      {openMenus.hospitality && (
                        <div className="ml-4 mt-0.5 space-y-0.5">
                          <Link to="/app/production/hospitality/backstage" className={`sidebar-item text-xs ${location.pathname === '/app/production/hospitality/backstage' ? 'active' : ''}`}>
                            <Icon name="DoorOpen" size={14}/> {t('backstage')}
                          </Link>
                          <Link to="/app/production/hospitality/catering" className={`sidebar-item text-xs ${location.pathname === '/app/production/hospitality/catering' ? 'active' : ''}`}>
                            <Icon name="UtensilsCrossed" size={14}/> {t('catering')}
                          </Link>
                          <Link to="/app/production/hospitality/hotels" className={`sidebar-item text-xs ${location.pathname === '/app/production/hospitality/hotels' ? 'active' : ''}`}>
                            <Icon name="Hotel" size={14}/> {t('hotels')}
                          </Link>
                        </div>
                      )}
                </div>

                <Link to="/app/production/technique" className={`sidebar-item text-sm ${location.pathname === '/app/production/technique' ? 'active' : ''}`}>
                  <Icon name="Wrench" size={16}/> {t('technique')}
                </Link>
                <Link to="/app/production/timetable" className={`sidebar-item text-sm ${location.pathname === '/app/production/timetable' ? 'active' : ''}`}>
                  <Icon name="Calendar" size={16}/> {t('timetable')}
                </Link>
                <Link to="/app/production/partycrew" className={`sidebar-item text-sm ${location.pathname === '/app/production/partycrew' ? 'active' : ''}`}>
                  <Icon name="Users" size={16}/> {t('party_crew')}
                </Link>
              </div>
            )}
          </div>

          {/* Presse */}
          <Link to="/app/presse" className={`sidebar-item ${location.pathname === '/app/presse' ? 'active' : ''}`}>
            <Icon name="Newspaper" size={18}/> {t('press').toUpperCase()}
          </Link>

          {/* Contacts */}
          <div>
            <button 
              onClick={() => toggleMenu('contacts')}
              className="sidebar-item w-full flex items-center justify-between"
            >
              <span className="flex items-center gap-2">
                <Icon name="Contact" size={18}/> {t('contacts').toUpperCase()}
              </span>
              <ChevronDown className={`w-4 h-4 transition-transform ${openMenus.contacts ? 'rotate-180' : ''}`} />
            </button>
            {openMenus.contacts && (
              <div className="ml-4 mt-0.5 space-y-0.5">
                <Link to="/app/contacts/personnes" className={`sidebar-item text-sm ${location.pathname === '/app/contacts/personnes' ? 'active' : ''}`}>
                  <Icon name="Users" size={16}/> {t('people')}
                </Link>
                <Link to="/app/contacts/entreprises" className={`sidebar-item text-sm ${location.pathname === '/app/contacts/entreprises' ? 'active' : ''}`}>
                  <Icon name="Building2" size={16}/> {t('companies')}
                </Link>
              </div>
            )}
          </div>

          {/* Staff */}
          <Link to="/app/staff" className={`sidebar-item ${location.pathname === '/app/staff' ? 'active' : ''}`}>
            <Icon name="Users" size={18}/> {t('staff').toUpperCase()}
          </Link>

          {/* Settings */}
          <div>
            <button 
              onClick={() => toggleMenu('settings')}
              className="sidebar-item w-full flex items-center justify-between"
            >
              <span className="flex items-center gap-2">
                <Icon name="Settings" size={18}/> {t('settings').toUpperCase()}
              </span>
              <ChevronDown className={`w-4 h-4 transition-transform ${openMenus.settings ? 'rotate-180' : ''}`} />
            </button>
            {openMenus.settings && (
              <div className="ml-4 mt-0.5 space-y-0.5">
                <Link to="/app/settings/profile" className={`sidebar-item text-sm ${location.pathname === '/app/settings/profile' ? 'active' : ''}`}>
                  <Icon name="UserRound" size={16}/> {t('profile')}
                </Link>
                <Link to="/app/settings/security" className={`sidebar-item text-sm ${location.pathname === '/app/settings/security' ? 'active' : ''}`}>
                  <Icon name="Lock" size={16}/> {t('security')}
                </Link>
                <Link to="/app/settings/permissions" className={`sidebar-item text-sm ${location.pathname === '/app/settings/permissions' ? 'active' : ''}`}>
                  <Icon name="Shield" size={16}/> {t('permissions')}
                </Link>
              </div>
            )}
          </div>
        </nav>

        {/* User Menu at bottom */}
        <div className="mt-auto pt-4 border-t border-gray-200 dark:border-white/10">
          {profile && <UserMenu profile={profile} />}
        </div>
      </aside>

      {/* Main content area */}
      <div className="flex-1 flex flex-col h-screen" style={{marginLeft: '280px'}}>
        {/* TopBar with Search and Notifications only */}
        <TopBar />
        
        {/* Page content - scrollable */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-6">
            <Outlet/>
          </div>
        </main>
      </div>
    </div>
  )
}
