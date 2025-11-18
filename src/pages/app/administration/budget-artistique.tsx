import { useEffect, useState, useMemo } from "react";
import { DollarSign, Users, TrendingUp, AlertCircle, Edit2, Trash2, RefreshCw } from "lucide-react";
import { useI18n } from "../../../lib/i18n";
import { useCurrentEvent } from "../../../hooks/useCurrentEvent";
import { Card, CardHeader, CardBody } from "../../../components/aura/Card";
import { Badge } from "../../../components/aura/Badge";
import { EmptyState } from "../../../components/aura/EmptyState";
import { Button } from "../../../components/aura/Button";
import { ConfirmDialog } from "../../../components/aura/ConfirmDialog";
import { useToast } from "../../../components/aura/ToastProvider";
import { DailySummaryCards } from "../../../features/timeline/components/DailySummaryCards";
import { PerformanceModal } from "../../../features/booking/modals/PerformanceModal";
import { getCurrentCompanyId } from "../../../lib/tenant";
import { supabase } from "../../../lib/supabaseClient";
import {
  fetchEventDays,
  fetchEventStages,
  fetchPerformances,
  deletePerformance,
  type EventDay,
  type EventStage,
  type Performance,
} from "../../../features/timeline/timelineApi";
import {
  calculateArtistWithholdingTax,
  countUniqueDays,
  type ArtistTaxResult,
} from "../../../utils/artistWithholdingTax";

interface ArtistBudget {
  artist_id: string;
  artist_name: string;
  performances_count: number;
  total_fees_by_currency: Record<string, number>; // Cachets seuls
  total_commission_by_currency: Record<string, number>; // Commissions seules
  total_duration: number;
  performances: Performance[];
  // Totaux des frais additionnels par devise
  total_prod_fee: Record<string, number>;
  total_backline_fee: Record<string, number>;
  total_buyout_hotel: Record<string, number>;
  total_buyout_meal: Record<string, number>;
  total_flight_contribution: Record<string, number>;
  total_technical_fee: Record<string, number>;
  total_all_fees: Record<string, number>; // Total incluant tout (cachet + commission + frais)
  total_in_chf: number; // Total converti en CHF
  withholding_tax_results: ArtistTaxResult[]; // Résultats du calcul d'impôt à la source par performance
  total_withholding_tax_chf: number; // Total de l'impôt à la source en CHF
}

interface CurrencyRates {
  EUR: number;
  USD: number;
  GBP: number;
  CHF: number;
  [key: string]: number;
}

interface ExchangeRateAPIResponse {
  rates: CurrencyRates;
  time_last_update_utc?: string;
  date?: string;
  time_last_updated?: number;
}

// Fonctions utilitaires (hors composant pour éviter recréation)
const formatCurrency = (amount: number, currency: string) => {
  return `${amount.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} ${currency}`;
};

const calculateCommissionAmount = (feeAmount: number | null, commissionPercentage: number | null): number => {
  if (!feeAmount || !commissionPercentage) return 0;
  return feeAmount * (commissionPercentage / 100);
};

export default function BudgetArtistiquePage() {
  const { t } = useI18n();
  const { currentEvent } = useCurrentEvent();
  const eventId = currentEvent?.id || "";
  const hasEvent = Boolean(eventId);
  const { success: toastSuccess, error: toastError } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [demoMode, setDemoMode] = useState(!hasEvent);
  const [companyId, setCompanyId] = useState<string | null>(null);
  
  // Données
  const [days, setDays] = useState<EventDay[]>([]);
  const [stages, setStages] = useState<EventStage[]>([]);
  const [performances, setPerformances] = useState<Performance[]>([]);
  
  // Modal et suppression
  const [showPerformanceModal, setShowPerformanceModal] = useState(false);
  const [selectedPerformance, setSelectedPerformance] = useState<Performance | null>(null);
  const [deletingPerformance, setDeletingPerformance] = useState<Performance | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Taux de change
  const [currencyRates, setCurrencyRates] = useState<CurrencyRates | null>(null);
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);
  const [loadingRates, setLoadingRates] = useState(true);

  // Récupération du company_id
  useEffect(() => {
    (async () => {
      try {
        const cid = await getCurrentCompanyId(supabase);
        setCompanyId(cid);
      } catch (error) {
        console.error("Erreur récupération company_id:", error);
      }
    })();
  }, []);

  // Charger les taux de change avec cache LocalStorage (actualisation quotidienne)
  useEffect(() => {
    const fetchExchangeRates = async () => {
      try {
        setLoadingRates(true);
        
        // Vérifier le cache LocalStorage
        const cachedRates = localStorage.getItem('exchangeRates_budget');
        const cachedTime = localStorage.getItem('exchangeRatesTime_budget');
        const cachedUpdate = localStorage.getItem('exchangeRatesUpdate_budget');
        
        if (cachedRates && cachedTime) {
          const cacheAge = Date.now() - parseInt(cachedTime);
          const oneDay = 24 * 60 * 60 * 1000; // 24 heures en millisecondes
          
          if (cacheAge < oneDay) {
            // Cache valide (< 24h) - Utiliser les données en cache
            console.log('✅ Utilisation du cache des taux de change (< 24h)');
            setCurrencyRates(JSON.parse(cachedRates));
            setLastUpdate(cachedUpdate);
            setLoadingRates(false);
            return;
          }
        }
        
        // Cache invalide ou absent → Appel API
        console.log('🔄 Actualisation des taux de change depuis l\'API...');
        const response = await fetch('https://api.exchangerate-api.com/v4/latest/EUR');
        const data: ExchangeRateAPIResponse = await response.json();
        setCurrencyRates(data.rates);
        
        // Extraire la date de mise à jour
        let updateDate = null;
        if (data.time_last_update_utc) {
          updateDate = data.time_last_update_utc;
        } else if (data.time_last_updated) {
          updateDate = new Date(data.time_last_updated * 1000).toUTCString();
        } else if (data.date) {
          updateDate = new Date(data.date).toUTCString();
        }
        
        setLastUpdate(updateDate);
        
        // Sauvegarder dans le cache
        localStorage.setItem('exchangeRates_budget', JSON.stringify(data.rates));
        localStorage.setItem('exchangeRatesTime_budget', Date.now().toString());
        if (updateDate) {
          localStorage.setItem('exchangeRatesUpdate_budget', updateDate);
        }
        console.log('✅ Taux de change mis en cache pour 24h');
        
      } catch (error) {
        console.error('❌ Erreur chargement taux de change:', error);
        // Fallback : taux fixes
        setCurrencyRates({
          EUR: 1,
          CHF: 0.940,
          USD: 1.241,
          GBP: 0.926
        });
        console.log('⚠️ Utilisation des taux fixes (fallback)');
      } finally {
        setLoadingRates(false);
      }
    };

    fetchExchangeRates();
  }, []);

  // Charger les données
  const loadData = async () => {
    if (!hasEvent || demoMode) {
      setDays([]);
      setStages([]);
      setPerformances([]);
      return;
    }

    setLoading(true);
    try {
      const [daysData, stagesData, performancesData] = await Promise.all([
        fetchEventDays(eventId),
        fetchEventStages(eventId),
        fetchPerformances(eventId),
      ]);

      setDays(daysData);
      setStages(stagesData);
      setPerformances(performancesData);
    } catch (error) {
      console.error("Erreur chargement données budget:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [eventId, hasEvent, demoMode]);

  // Rafraîchir les données quand la page redevient visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && hasEvent && !demoMode) {
        console.log('📊 Page Budget visible - Rafraîchissement des données...');
        loadData();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [hasEvent, demoMode]);

  // Gérer l'édition d'une performance (finances uniquement)
  const handleEditFinances = (performance: Performance) => {
    if (!companyId) {
      toastError("Company ID manquant");
      return;
    }
    setSelectedPerformance(performance);
    setShowPerformanceModal(true);
  };

  // Gérer la suppression d'une performance
  const handleDeletePerformance = async () => {
    if (!deletingPerformance) return;
    
    setDeleting(true);
    try {
      await deletePerformance(deletingPerformance.id);
      toastSuccess("Performance supprimée");
      setDeletingPerformance(null);
      loadData(); // Recharger les données
    } catch (error: any) {
      console.error("Erreur suppression performance:", error);
      toastError(error?.message || "Erreur lors de la suppression");
    } finally {
      setDeleting(false);
    }
  };

  // Fonctions de conversion avec taux dynamiques
  const convertToCHF = (amount: number, currency: string): number => {
    if (!currencyRates) return amount; // Si pas de taux, retourner le montant tel quel
    
    if (currency === 'CHF') return amount;
    
    // L'API donne les taux depuis EUR
    // Pour convertir vers CHF : montant * taux_de_la_devise_vers_EUR * taux_EUR_vers_CHF
    const rateCHF = currencyRates.CHF || 1;
    
    if (currency === 'EUR') {
      return amount * rateCHF;
    }
    
    // Pour USD, GBP, etc. : convertir d'abord en EUR puis en CHF
    const rateFromEUR = currencyRates[currency];
    if (!rateFromEUR) return amount;
    
    // Convertir en EUR puis en CHF
    const amountInEUR = amount / rateFromEUR;
    return amountInEUR * rateCHF;
  };

  const convertAllToCHF = (amountsByCurrency: Record<string, number>): number => {
    let totalCHF = 0;
    Object.entries(amountsByCurrency).forEach(([currency, amount]) => {
      totalCHF += convertToCHF(amount, currency);
    });
    return totalCHF;
  };

  // Calculer les budgets par artiste
  const artistsBudgets = useMemo(() => {
    const budgetsMap: Record<string, ArtistBudget> = {};

    performances.forEach((perf) => {
      const currency = perf.fee_currency || 'EUR';
      
      if (!budgetsMap[perf.artist_id]) {
        budgetsMap[perf.artist_id] = {
          artist_id: perf.artist_id,
          artist_name: perf.artist_name,
          performances_count: 0,
          total_fees_by_currency: {},
          total_commission_by_currency: {},
          total_duration: 0,
          performances: [],
          total_prod_fee: {},
          total_backline_fee: {},
          total_buyout_hotel: {},
          total_buyout_meal: {},
          total_flight_contribution: {},
          total_technical_fee: {},
          total_all_fees: {},
          total_in_chf: 0,
          withholding_tax_results: [],
          total_withholding_tax_chf: 0,
        };
      }

      const budget = budgetsMap[perf.artist_id];
      budget.performances_count++;
      budget.total_duration += perf.duration || 0;
      budget.performances.push(perf);

      // Cachet principal
      if (perf.fee_amount && perf.fee_currency) {
        budget.total_fees_by_currency[perf.fee_currency] =
          (budget.total_fees_by_currency[perf.fee_currency] || 0) + perf.fee_amount;
        budget.total_all_fees[perf.fee_currency] =
          (budget.total_all_fees[perf.fee_currency] || 0) + perf.fee_amount;
        
        // Commission
        const commissionAmount = calculateCommissionAmount(perf.fee_amount, perf.commission_percentage);
        if (commissionAmount > 0) {
          budget.total_commission_by_currency[perf.fee_currency] =
            (budget.total_commission_by_currency[perf.fee_currency] || 0) + commissionAmount;
          budget.total_all_fees[perf.fee_currency] =
            (budget.total_all_fees[perf.fee_currency] || 0) + commissionAmount;
        }
      }

      // Frais additionnels
      if (perf.prod_fee_amount) {
        budget.total_prod_fee[currency] = (budget.total_prod_fee[currency] || 0) + perf.prod_fee_amount;
        budget.total_all_fees[currency] = (budget.total_all_fees[currency] || 0) + perf.prod_fee_amount;
      }
      if (perf.backline_fee_amount) {
        budget.total_backline_fee[currency] = (budget.total_backline_fee[currency] || 0) + perf.backline_fee_amount;
        budget.total_all_fees[currency] = (budget.total_all_fees[currency] || 0) + perf.backline_fee_amount;
      }
      if (perf.buyout_hotel_amount) {
        budget.total_buyout_hotel[currency] = (budget.total_buyout_hotel[currency] || 0) + perf.buyout_hotel_amount;
        budget.total_all_fees[currency] = (budget.total_all_fees[currency] || 0) + perf.buyout_hotel_amount;
      }
      if (perf.buyout_meal_amount) {
        budget.total_buyout_meal[currency] = (budget.total_buyout_meal[currency] || 0) + perf.buyout_meal_amount;
        budget.total_all_fees[currency] = (budget.total_all_fees[currency] || 0) + perf.buyout_meal_amount;
      }
      if (perf.flight_contribution_amount) {
        budget.total_flight_contribution[currency] = (budget.total_flight_contribution[currency] || 0) + perf.flight_contribution_amount;
        budget.total_all_fees[currency] = (budget.total_all_fees[currency] || 0) + perf.flight_contribution_amount;
      }
      if (perf.technical_fee_amount) {
        budget.total_technical_fee[currency] = (budget.total_technical_fee[currency] || 0) + perf.technical_fee_amount;
        budget.total_all_fees[currency] = (budget.total_all_fees[currency] || 0) + perf.technical_fee_amount;
      }
    });

    // Calculer le total en CHF et l'impôt à la source pour chaque artiste
    Object.values(budgetsMap).forEach((budget) => {
      budget.total_in_chf = convertAllToCHF(budget.total_all_fees);
      
      // Calcul de l'impôt à la source pour chaque performance
      budget.withholding_tax_results = [];
      let totalTaxInCHF = 0;
      
      budget.performances.forEach((perf) => {
        // On ne calcule l'impôt que si un cachet est renseigné
        if (perf.fee_amount && perf.fee_amount > 0 && perf.fee_currency) {
          // Convertir le montant en CHF pour le calcul
          const feeInCHF = convertToCHF(perf.fee_amount, perf.fee_currency);
          
          // Nombre de jours pour cet artiste (on compte les jours uniques)
          const nbDays = countUniqueDays(budget.performances);
          
          const isAmountNet = perf.fee_is_net ?? false;
          
          if (isAmountNet) {
            // Si offre NETTE : le montant offert est ce que l'artiste touche
            // L'impôt est payé EN PLUS par l'organisateur
            
            // Calculer l'impôt à la source (payé en plus)
            const taxResult = calculateArtistWithholdingTax({
              amountOffered: feeInCHF,
              isAmountNet: true,
              nbArtists: 1,
              nbDays: nbDays,
            });
            
            // On stocke le résultat avec le montant net = montant offert
            budget.withholding_tax_results.push({
              ...taxResult,
              netAmount: feeInCHF, // Forcer le montant net = montant offert
            });
            totalTaxInCHF += taxResult.taxAmount;
            
          } else {
            // Si offre BRUTE : l'impôt est déduit du montant brut
            const taxResult = calculateArtistWithholdingTax({
              amountOffered: feeInCHF,
              isAmountNet: false,
              nbArtists: 1,
              nbDays: nbDays,
            });
            
            budget.withholding_tax_results.push(taxResult);
            totalTaxInCHF += taxResult.taxAmount;
          }
        }
      });
      
      budget.total_withholding_tax_chf = Math.round(totalTaxInCHF * 100) / 100;
    });

    return Object.values(budgetsMap).sort((a, b) => a.artist_name.localeCompare(b.artist_name));
  }, [performances, currencyRates]);

  // Calculer les statistiques globales
  const globalStats = useMemo(() => {
    const totalArtists = artistsBudgets.length;
    const totalPerformances = performances.length;
    const totalDuration = performances.reduce((sum, p) => sum + (p.duration || 0), 0);
    
    const totalFeesByCurrency: Record<string, number> = {};
    const totalCommissionByCurrency: Record<string, number> = {};
    const totalAllFeesByCurrency: Record<string, number> = {};
    
    performances.forEach(perf => {
      const currency = perf.fee_currency || 'EUR';
      
      // Cachet principal
      if (perf.fee_amount && perf.fee_currency) {
        totalFeesByCurrency[perf.fee_currency] = (totalFeesByCurrency[perf.fee_currency] || 0) + perf.fee_amount;
        totalAllFeesByCurrency[perf.fee_currency] = (totalAllFeesByCurrency[perf.fee_currency] || 0) + perf.fee_amount;
        
        // Commission
        const commissionAmount = calculateCommissionAmount(perf.fee_amount, perf.commission_percentage);
        if (commissionAmount > 0) {
          totalCommissionByCurrency[perf.fee_currency] = (totalCommissionByCurrency[perf.fee_currency] || 0) + commissionAmount;
          totalAllFeesByCurrency[perf.fee_currency] = (totalAllFeesByCurrency[perf.fee_currency] || 0) + commissionAmount;
        }
      }
      
      // Frais additionnels
      if (perf.prod_fee_amount) {
        totalAllFeesByCurrency[currency] = (totalAllFeesByCurrency[currency] || 0) + perf.prod_fee_amount;
      }
      if (perf.backline_fee_amount) {
        totalAllFeesByCurrency[currency] = (totalAllFeesByCurrency[currency] || 0) + perf.backline_fee_amount;
      }
      if (perf.buyout_hotel_amount) {
        totalAllFeesByCurrency[currency] = (totalAllFeesByCurrency[currency] || 0) + perf.buyout_hotel_amount;
      }
      if (perf.buyout_meal_amount) {
        totalAllFeesByCurrency[currency] = (totalAllFeesByCurrency[currency] || 0) + perf.buyout_meal_amount;
      }
      if (perf.flight_contribution_amount) {
        totalAllFeesByCurrency[currency] = (totalAllFeesByCurrency[currency] || 0) + perf.flight_contribution_amount;
      }
      if (perf.technical_fee_amount) {
        totalAllFeesByCurrency[currency] = (totalAllFeesByCurrency[currency] || 0) + perf.technical_fee_amount;
      }
    });

    const totalInCHF = convertAllToCHF(totalAllFeesByCurrency);
    
    // Total de l'impôt à la source en CHF
    const totalWithholdingTaxCHF = artistsBudgets.reduce(
      (sum, budget) => sum + budget.total_withholding_tax_chf,
      0
    );
    
    // Total des cachets NETS versés aux artistes (après impôts) en CHF
    const totalNetFeesCHF = artistsBudgets.reduce(
      (sum, budget) => {
        const netFeesForArtist = budget.withholding_tax_results.reduce(
          (netSum, taxResult) => netSum + taxResult.netAmount,
          0
        );
        return sum + netFeesForArtist;
      },
      0
    );

    return {
      totalArtists,
      totalPerformances,
      totalDuration,
      totalFeesByCurrency,
      totalCommissionByCurrency,
      totalAllFeesByCurrency,
      totalInCHF,
      totalWithholdingTaxCHF,
      totalNetFeesCHF,
    };
  }, [artistsBudgets, performances]);

  if (!hasEvent && !demoMode) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
        <div className="flex-1 flex items-center justify-center p-6">
          <EmptyState
            title="Aucun événement sélectionné"
            description="Sélectionnez un événement pour accéder au budget artistique."
            action={
              <Button onClick={() => setDemoMode(true)}>
                Activer le mode démo
              </Button>
            }
          />
        </div>
      </div>
    );
  }
  
  return (
    <div className="p-6">
      <header className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-violet-400" />
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">{t('artistic_budget').toUpperCase()}</h1>
        </div>
        <Button
          variant="secondary"
          onClick={() => {
            toastSuccess("Actualisation des données...");
            loadData();
          }}
          disabled={loading}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Actualiser
        </Button>
      </header>

      {/* Dashboard avec les 9 containers */}
      <DailySummaryCards 
        days={days} 
        performances={performances}
        totalFeesByCurrency={globalStats.totalFeesByCurrency}
        totalCommissionByCurrency={globalStats.totalCommissionByCurrency}
        totalAllFeesByCurrency={globalStats.totalAllFeesByCurrency}
        totalNetFeesCHF={globalStats.totalNetFeesCHF}
        totalWithholdingTaxCHF={globalStats.totalWithholdingTaxCHF}
        currencyRates={currencyRates}
      />

      {/* Taux de change */}
      {hasEvent && !demoMode && currencyRates && (
        <Card className="mb-6">
          <CardBody>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                  <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">Taux de change en temps réel :</span>
                </div>
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 dark:text-gray-400">1 EUR =</span>
                    <span className="text-sm font-bold text-amber-600 dark:text-amber-400">
                      {currencyRates.CHF.toFixed(3)} CHF
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 dark:text-gray-400">1 USD =</span>
                    <span className="text-sm font-bold text-amber-600 dark:text-amber-400">
                      {(currencyRates.CHF / currencyRates.USD).toFixed(3)} CHF
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 dark:text-gray-400">1 GBP =</span>
                    <span className="text-sm font-bold text-amber-600 dark:text-amber-400">
                      {(currencyRates.CHF / currencyRates.GBP).toFixed(3)} CHF
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 dark:text-gray-400">1 CHF =</span>
                    <span className="text-sm font-bold text-amber-600 dark:text-amber-400">
                      1.000 CHF
                    </span>
                  </div>
                </div>
              </div>
              {lastUpdate && (
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Mis à jour: {new Date(lastUpdate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </div>
              )}
            </div>
          </CardBody>
        </Card>
      )}

      {/* Statistiques globales */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <Card>
          <CardBody>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-violet-100 dark:bg-violet-900/30 rounded-lg">
                <Users className="w-5 h-5 text-violet-600 dark:text-violet-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Artistes</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{globalStats.totalArtists}</p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Performances</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{globalStats.totalPerformances}</p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <DollarSign className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Durée totale</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {Math.floor(globalStats.totalDuration / 60)}h {globalStats.totalDuration % 60}min
                </p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Budget total</p>
                <div className="space-y-0.5">
                  {Object.entries(globalStats.totalAllFeesByCurrency).map(([currency, amount]) => (
                    <p key={currency} className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      {formatCurrency(amount, currency)}
                    </p>
                  ))}
                  {Object.keys(globalStats.totalAllFeesByCurrency).length === 0 && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">-</p>
                  )}
                </div>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <DollarSign className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Budget en CHF</p>
                <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                  {formatCurrency(globalStats.totalInCHF, 'CHF')}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Liste des artistes avec leurs budgets */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-900 dark:text-gray-100">Budget par artiste</span>
            <Badge color="blue">{artistsBudgets.length}</Badge>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Détail des cachets et performances par artiste
            </p>
            {loadingRates ? (
              <p className="text-xs text-gray-400 dark:text-gray-500">
                Chargement des taux de change...
              </p>
            ) : currencyRates ? (
              <p className="text-xs text-gray-400 dark:text-gray-500">
                Taux de change en temps réel : 1 EUR = {currencyRates.CHF.toFixed(3)} CHF • 1 USD = {(currencyRates.CHF / currencyRates.USD).toFixed(3)} CHF • 1 GBP = {(currencyRates.CHF / currencyRates.GBP).toFixed(3)} CHF
                {lastUpdate && ` • Mis à jour: ${new Date(lastUpdate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}`}
              </p>
            ) : (
              <p className="text-xs text-yellow-600 dark:text-yellow-400">
                Utilisation des taux de change fixes (API indisponible)
              </p>
            )}
          </div>
        </CardHeader>
        <CardBody>
          {loading ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              Chargement...
            </div>
          ) : artistsBudgets.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              Aucune performance programmée pour le moment
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-x-auto border border-gray-200 dark:border-gray-700">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider sticky left-0 bg-gray-50 dark:bg-gray-900 z-10">
                      ARTISTE
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      CACHET
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-[150px]">
                      COMMISSION
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider border-l border-gray-300 dark:border-gray-600">
                      PROD
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      BACKLINE
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      HOTEL
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      MEAL
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      VOL
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      TECH
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      IMPÔTS SOURCE
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider bg-violet-50 dark:bg-violet-900/20">
                      TOTAL
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider bg-green-50 dark:bg-green-900/20">
                      TOTAL CHF
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider sticky right-0 bg-gray-50 dark:bg-gray-900 z-10">
                      ACTIONS
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {artistsBudgets.map((budget) => (
                    <tr 
                      key={budget.artist_id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                    >
                      <td className="px-4 py-3 sticky left-0 bg-white dark:bg-gray-800 z-10">
                        <div className="font-medium text-gray-900 dark:text-gray-100">
                          {budget.artist_name}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {budget.performances_count} perf • {Math.floor(budget.total_duration / 60)}h{budget.total_duration % 60 > 0 ? ` ${budget.total_duration % 60}min` : ''}
                        </div>
                      </td>
                      
                      {/* Colonne CACHET */}
                      <td className="px-4 py-3 text-right">
                        <div className="space-y-1">
                          {budget.performances.map((perf) => {
                            if (!perf.fee_amount || !perf.fee_currency) return null;
                            const feeType = perf.fee_is_net ? 'net' : 'brut';
                            
                            return (
                              <div key={perf.id} className="text-xs font-semibold text-gray-900 dark:text-gray-100">
                                {formatCurrency(perf.fee_amount, perf.fee_currency)} <span className="text-[10px] text-gray-500 dark:text-gray-400">({feeType})</span>
                              </div>
                            );
                          })}
                          {budget.performances.every(p => !p.fee_amount) && (
                            <span className="text-sm text-gray-500 dark:text-gray-400">-</span>
                          )}
                        </div>
                      </td>
                      
                      {/* Colonne COMMISSION */}
                      <td className="px-4 py-3 text-right">
                        <div className="space-y-1">
                          {budget.performances.map((perf) => {
                            if (!perf.fee_amount || !perf.fee_currency || !perf.commission_percentage || perf.commission_percentage === 0) return null;
                            const commissionAmount = calculateCommissionAmount(perf.fee_amount, perf.commission_percentage);
                            
                            return (
                              <div key={perf.id} className="text-xs font-semibold text-violet-900 dark:text-violet-100">
                                {perf.commission_percentage}% • {formatCurrency(commissionAmount, perf.fee_currency)}
                              </div>
                            );
                          })}
                          {budget.performances.every(p => !p.commission_percentage || p.commission_percentage === 0) && (
                            <span className="text-sm text-gray-500 dark:text-gray-400">-</span>
                          )}
                        </div>
                      </td>
                      
                      <td className="px-4 py-3 text-right border-l border-gray-300 dark:border-gray-600">
                        <div className="space-y-1">
                          {Object.entries(budget.total_prod_fee).map(([currency, amount]) => (
                            <div key={currency} className="text-sm text-gray-900 dark:text-gray-100">
                              {formatCurrency(amount, currency)}
                            </div>
                          ))}
                          {Object.keys(budget.total_prod_fee).length === 0 && (
                            <span className="text-sm text-gray-500 dark:text-gray-400">-</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="space-y-1">
                          {Object.entries(budget.total_backline_fee).map(([currency, amount]) => (
                            <div key={currency} className="text-sm text-gray-900 dark:text-gray-100">
                              {formatCurrency(amount, currency)}
                            </div>
                          ))}
                          {Object.keys(budget.total_backline_fee).length === 0 && (
                            <span className="text-sm text-gray-500 dark:text-gray-400">-</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="space-y-1">
                          {Object.entries(budget.total_buyout_hotel).map(([currency, amount]) => (
                            <div key={currency} className="text-sm text-gray-900 dark:text-gray-100">
                              {formatCurrency(amount, currency)}
                            </div>
                          ))}
                          {Object.keys(budget.total_buyout_hotel).length === 0 && (
                            <span className="text-sm text-gray-500 dark:text-gray-400">-</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="space-y-1">
                          {Object.entries(budget.total_buyout_meal).map(([currency, amount]) => (
                            <div key={currency} className="text-sm text-gray-900 dark:text-gray-100">
                              {formatCurrency(amount, currency)}
                            </div>
                          ))}
                          {Object.keys(budget.total_buyout_meal).length === 0 && (
                            <span className="text-sm text-gray-500 dark:text-gray-400">-</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="space-y-1">
                          {Object.entries(budget.total_flight_contribution).map(([currency, amount]) => (
                            <div key={currency} className="text-sm text-gray-900 dark:text-gray-100">
                              {formatCurrency(amount, currency)}
                            </div>
                          ))}
                          {Object.keys(budget.total_flight_contribution).length === 0 && (
                            <span className="text-sm text-gray-500 dark:text-gray-400">-</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="space-y-1">
                          {Object.entries(budget.total_technical_fee).map(([currency, amount]) => (
                            <div key={currency} className="text-sm text-gray-900 dark:text-gray-100">
                              {formatCurrency(amount, currency)}
                            </div>
                          ))}
                          {Object.keys(budget.total_technical_fee).length === 0 && (
                            <span className="text-sm text-gray-500 dark:text-gray-400">-</span>
                          )}
                        </div>
                      </td>
                      
                      {/* Colonne IMPÔTS SOURCE */}
                      <td className="px-4 py-3 text-right">
                        {budget.withholding_tax_results.length > 0 ? (
                          <div className="space-y-1">
                            {budget.withholding_tax_results.map((taxResult, idx) => (
                              <div key={idx} className="text-xs text-gray-900 dark:text-gray-100" title={`Taux: ${(taxResult.taxRate * 100).toFixed(0)}% • Revenu journalier: ${formatCurrency(taxResult.dailyRevenue, 'CHF')}`}>
                                {formatCurrency(taxResult.taxAmount, 'CHF')}
                              </div>
                            ))}
                            {budget.withholding_tax_results.length > 1 && (
                              <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 pt-1 border-t border-gray-200 dark:border-gray-600">
                                {formatCurrency(budget.total_withholding_tax_chf, 'CHF')}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-500 dark:text-gray-400">-</span>
                        )}
                      </td>
                      
                      <td className="px-4 py-3 text-right bg-violet-50 dark:bg-violet-900/20">
                        <div className="space-y-1">
                          {Object.entries(budget.total_all_fees).map(([currency, amount]) => (
                            <div key={currency} className="text-sm font-bold text-violet-900 dark:text-violet-100">
                              {formatCurrency(amount, currency)}
                            </div>
                          ))}
                          {Object.keys(budget.total_all_fees).length === 0 && (
                            <span className="text-sm text-gray-500 dark:text-gray-400">-</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right bg-green-50 dark:bg-green-900/20">
                        <div className="text-sm font-bold text-green-900 dark:text-green-100">
                          {formatCurrency(budget.total_in_chf, 'CHF')}
                        </div>
                      </td>
                      
                      <td className="px-4 py-3 sticky right-0 bg-white dark:bg-gray-800 z-10">
                        <div className="flex flex-col gap-1">
                          {budget.performances.map((perf) => (
                            <div key={perf.id} className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => handleEditFinances(perf)}
                                className="p-1 text-gray-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors"
                                title="Modifier finances"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setDeletingPerformance(perf)}
                                className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                                title="Supprimer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Modal de modification des finances */}
      {showPerformanceModal && selectedPerformance && companyId && eventId && (
        <PerformanceModal
          open={showPerformanceModal}
          onClose={() => {
            setShowPerformanceModal(false);
            setSelectedPerformance(null);
          }}
          initialData={{
            eventId: eventId,
            companyId: companyId,
            performanceId: selectedPerformance.id,
            artist_id: selectedPerformance.artist_id,
            event_day_id: selectedPerformance.event_day_id,
            event_stage_id: selectedPerformance.stage_id,
            performance_time: selectedPerformance.performance_time,
            duration: selectedPerformance.duration,
            fee_amount: selectedPerformance.fee_amount,
            fee_currency: selectedPerformance.fee_currency ?? undefined,
            commission_percentage: selectedPerformance.commission_percentage,
            fee_is_net: selectedPerformance.fee_is_net ?? undefined,
            booking_status: selectedPerformance.booking_status,
            notes: selectedPerformance.notes ?? undefined,
            prod_fee_amount: selectedPerformance.prod_fee_amount,
            backline_fee_amount: selectedPerformance.backline_fee_amount,
            buyout_hotel_amount: selectedPerformance.buyout_hotel_amount,
            buyout_meal_amount: selectedPerformance.buyout_meal_amount,
            flight_contribution_amount: selectedPerformance.flight_contribution_amount,
            technical_fee_amount: selectedPerformance.technical_fee_amount,
          }}
          onSuccess={() => {
            setShowPerformanceModal(false);
            setSelectedPerformance(null);
            loadData();
          }}
          financesOnly={true}
        />
      )}

      {/* Confirmation de suppression */}
      <ConfirmDialog
        open={!!deletingPerformance}
        onClose={() => setDeletingPerformance(null)}
        onConfirm={handleDeletePerformance}
        title="Supprimer la performance"
        message={`Êtes-vous sûr de vouloir supprimer cette performance ?${deletingPerformance ? `\n\nArtiste : ${deletingPerformance.artist_name}\nScène : ${deletingPerformance.stage_name}\nDate : ${new Date(deletingPerformance.event_day_date).toLocaleDateString('fr-FR')} à ${deletingPerformance.performance_time?.slice(0, 5)}` : ''}`}
        confirmText="Supprimer"
        variant="danger"
        loading={deleting}
      />
    </div>
  );
}
