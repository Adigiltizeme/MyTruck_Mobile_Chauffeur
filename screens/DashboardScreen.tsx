/**
 * DashboardScreen - Dashboard chauffeur (Duplication exacte UnifiedDashboard web)
 * Avec filtres de dates, métriques dynamiques, et performances
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import commandesService from '../services/commandes.service';
import { MetricCard } from '../components/dashboard/MetricCard';
import { PerformanceChart } from '../components/dashboard/PerformanceChart';
import { DeliveriesTable } from '../components/dashboard/DeliveriesTable';
import DateFilterSelector, { PeriodType } from '../components/dashboard/DateFilterSelector';
import CustomDatePicker, { DateRange } from '../components/dashboard/CustomDatePicker';
import type { Commande } from '../constants/Types';
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, isWithinInterval, parseISO } from 'date-fns';

export default function DashboardScreen() {
  const { user } = useAuth();

  // ✅ États filtres (même que UnifiedDashboard web)
  const [commandes, setCommandes] = useState<Commande[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dateRange, setDateRange] = useState<PeriodType>('day');
  const [customDateRange, setCustomDateRange] = useState<DateRange>({
    start: null,
    end: null,
    mode: 'range',
    singleDate: null,
  });

  // ✅ Charger commandes au démarrage
  useEffect(() => {
    loadCommandes();
  }, []);

  const loadCommandes = async () => {
    const chauffeurId = user?.chauffeurId || user?.id;

    if (!chauffeurId) {
      console.warn('⚠️ Aucun chauffeurId trouvé');
      setLoading(false);
      return;
    }

    try {
      console.log('📦 Chargement commandes pour chauffeur:', chauffeurId);

      const response = await commandesService.getCommandesByChauffeur(chauffeurId);

      if (response.success && response.data) {
        const commandesList = Array.isArray(response.data) ? response.data : [];
        setCommandes(commandesList);
        console.log(`✅ ${commandesList.length} commandes chargées`);
      } else {
        console.error('❌ Erreur chargement commandes:', response.error);
        setCommandes([]);
      }
    } catch (error) {
      console.error('❌ Erreur:', error);
      setCommandes([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadCommandes();
  }, [user?.id]);

  // ✅ Filtrage des commandes selon période/dates personnalisées (logique exacte web)
  const filteredCommandes = useMemo(() => {
    if (commandes.length === 0) return [];

    let filtered = [...commandes];
    const now = new Date();

    // Dates personnalisées prioritaires
    if (customDateRange.singleDate || (customDateRange.start && customDateRange.end)) {
      const startDate = customDateRange.singleDate
        ? parseISO(customDateRange.singleDate)
        : customDateRange.start
        ? parseISO(customDateRange.start)
        : null;

      const endDate = customDateRange.singleDate
        ? parseISO(customDateRange.singleDate)
        : customDateRange.end
        ? parseISO(customDateRange.end)
        : null;

      if (startDate && endDate) {
        filtered = filtered.filter((c) => {
          const dateLivraison = c.dateLivraison ? parseISO(c.dateLivraison) : null;
          if (!dateLivraison) return false;
          return isWithinInterval(dateLivraison, {
            start: startOfDay(startDate),
            end: endOfDay(endDate),
          });
        });
      }
    } else {
      // Filtrage par période
      switch (dateRange) {
        case 'day':
          filtered = filtered.filter((c) => {
            const dateLivraison = c.dateLivraison ? parseISO(c.dateLivraison) : null;
            if (!dateLivraison) return false;
            return isWithinInterval(dateLivraison, {
              start: startOfDay(now),
              end: endOfDay(now),
            });
          });
          break;
        case 'week':
          filtered = filtered.filter((c) => {
            const dateLivraison = c.dateLivraison ? parseISO(c.dateLivraison) : null;
            if (!dateLivraison) return false;
            return isWithinInterval(dateLivraison, {
              start: startOfWeek(now, { weekStartsOn: 1 }),
              end: endOfWeek(now, { weekStartsOn: 1 }),
            });
          });
          break;
        case 'month':
          filtered = filtered.filter((c) => {
            const dateLivraison = c.dateLivraison ? parseISO(c.dateLivraison) : null;
            if (!dateLivraison) return false;
            return isWithinInterval(dateLivraison, {
              start: startOfMonth(now),
              end: endOfMonth(now),
            });
          });
          break;
        case 'year':
          filtered = filtered.filter((c) => {
            const dateLivraison = c.dateLivraison ? parseISO(c.dateLivraison) : null;
            if (!dateLivraison) return false;
            return isWithinInterval(dateLivraison, {
              start: startOfYear(now),
              end: endOfYear(now),
            });
          });
          break;
      }
    }

    return filtered;
  }, [commandes, dateRange, customDateRange]);

  // ✅ Calcul métriques (logique exacte web)
  const metrics = useMemo(() => {
    const total = filteredCommandes.length;
    const livrees = filteredCommandes.filter((c) => c.statutLivraison === 'LIVREE').length;
    const enCours = filteredCommandes.filter((c) => c.statutLivraison === 'EN_COURS').length;
    const enAttente = filteredCommandes.filter((c) => c.statutLivraison === 'EN_ATTENTE').length;
    const performance = total > 0 ? Math.round((livrees / total) * 100) : 0;

    // ✅ Historique DYNAMIQUE selon filtre actif
    let historique: Array<{
      date: string;
      totalLivraisons: number;
      enCours: number;
      enAttente: number;
      rawDate: number;
    }> = [];

    const now = new Date();

    // Si dates personnalisées
    if (customDateRange.singleDate || (customDateRange.start && customDateRange.end)) {
      const startDate = customDateRange.singleDate
        ? parseISO(customDateRange.singleDate)
        : customDateRange.start
        ? parseISO(customDateRange.start)
        : now;

      const endDate = customDateRange.singleDate
        ? parseISO(customDateRange.singleDate)
        : customDateRange.end
        ? parseISO(customDateRange.end)
        : now;

      // Générer historique par jour dans la plage
      const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      const days = Math.min(daysDiff + 1, 30); // Max 30 jours pour performances

      for (let i = 0; i < days; i++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + i);
        const dateStr = date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });

        const commandesJour = filteredCommandes.filter((c) => {
          if (!c.dateLivraison) return false;
          const cmdDate = parseISO(c.dateLivraison);
          return cmdDate.toDateString() === date.toDateString();
        });

        historique.push({
          date: dateStr,
          totalLivraisons: commandesJour.filter((c) => c.statutLivraison === 'LIVREE').length,
          enCours: commandesJour.filter((c) => c.statutLivraison === 'EN_COURS').length,
          enAttente: commandesJour.filter((c) => c.statutLivraison === 'EN_ATTENTE').length,
          rawDate: date.getTime(),
        });
      }
    } else {
      // Historique selon période
      switch (dateRange) {
        case 'day':
          // ✅ Par créneaux horaires format web: "07h-09h", "09h-11h"... (7h-20h)
          for (let h = 7; h < 20; h++) {
            const heureDebut = h.toString().padStart(2, '0');
            const heureFin = (h + 2).toString().padStart(2, '0');
            const creneau = `${heureDebut}h-${heureFin}h`;

            // Filtrer commandes par créneau (extraire heure de début du créneau de livraison)
            const commandesCreneau = filteredCommandes.filter((c) => {
              if (!c.dateLivraison || !c.livraison?.creneau) return false;

              // Extraire l'heure de début du créneau de la commande (ex: "12h-14h" → 12)
              const match = c.livraison.creneau.match(/(\d+)h/);
              if (match) {
                const creneauHeureCommande = parseInt(match[1]);
                return creneauHeureCommande === h; // Correspondance exacte
              }
              return false;
            });

            historique.push({
              date: creneau,
              totalLivraisons: commandesCreneau.filter((c) => c.statutLivraison === 'LIVREE').length,
              enCours: commandesCreneau.filter((c) => c.statutLivraison === 'EN_COURS').length,
              enAttente: commandesCreneau.filter((c) => c.statutLivraison === 'EN_ATTENTE').length,
              rawDate: h,
            });
          }
          break;

        case 'week':
          // 7 derniers jours
          for (let i = 0; i < 7; i++) {
            const date = new Date(now);
            date.setDate(date.getDate() - (6 - i));
            const dateStr = date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });

            const commandesJour = filteredCommandes.filter((c) => {
              if (!c.dateLivraison) return false;
              const cmdDate = parseISO(c.dateLivraison);
              return cmdDate.toDateString() === date.toDateString();
            });

            historique.push({
              date: dateStr,
              totalLivraisons: commandesJour.filter((c) => c.statutLivraison === 'LIVREE').length,
              enCours: commandesJour.filter((c) => c.statutLivraison === 'EN_COURS').length,
              enAttente: commandesJour.filter((c) => c.statutLivraison === 'EN_ATTENTE').length,
              rawDate: date.getTime(),
            });
          }
          break;

        case 'month':
          // 30 derniers jours
          for (let i = 0; i < 30; i++) {
            const date = new Date(now);
            date.setDate(date.getDate() - (29 - i));
            const dateStr = date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });

            const commandesJour = filteredCommandes.filter((c) => {
              if (!c.dateLivraison) return false;
              const cmdDate = parseISO(c.dateLivraison);
              return cmdDate.toDateString() === date.toDateString();
            });

            historique.push({
              date: dateStr,
              totalLivraisons: commandesJour.filter((c) => c.statutLivraison === 'LIVREE').length,
              enCours: commandesJour.filter((c) => c.statutLivraison === 'EN_COURS').length,
              enAttente: commandesJour.filter((c) => c.statutLivraison === 'EN_ATTENTE').length,
              rawDate: date.getTime(),
            });
          }
          break;

        case 'year':
          // ✅ 12 mois de l'année courante (Jan, Fév, Mar... Déc) comme le web
          const moisNoms = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
          const currentYear = now.getFullYear();

          for (let moisIndex = 0; moisIndex < 12; moisIndex++) {
            const commandesMois = filteredCommandes.filter((c) => {
              if (!c.dateLivraison) return false;
              const cmdDate = parseISO(c.dateLivraison);
              return cmdDate.getMonth() === moisIndex && cmdDate.getFullYear() === currentYear;
            });

            historique.push({
              date: moisNoms[moisIndex],
              totalLivraisons: commandesMois.filter((c) => c.statutLivraison === 'LIVREE').length,
              enCours: commandesMois.filter((c) => c.statutLivraison === 'EN_COURS').length,
              enAttente: commandesMois.filter((c) => c.statutLivraison === 'EN_ATTENTE').length,
              rawDate: moisIndex,
            });
          }
          break;
      }
    }

    return {
      totalLivraisons: livrees,
      totalCommandes: total,
      enCours,
      enAttente,
      performance,
      historique,
    };
  }, [filteredCommandes, dateRange, customDateRange]);

  // ✅ Labels dynamiques selon filtre actif
  const getPerformanceLabels = () => {
    if (customDateRange.singleDate) {
      return {
        periodLabel: customDateRange.singleDate,
        historyLabel: 'Dernières heures:'
      };
    }
    if (customDateRange.start && customDateRange.end) {
      return {
        periodLabel: `${customDateRange.start} - ${customDateRange.end}`,
        historyLabel: 'Derniers jours:'
      };
    }

    switch (dateRange) {
      case 'day':
        return {
          periodLabel: "Aujourd'hui",
          historyLabel: 'Dernières heures:'
        };
      case 'week':
        return {
          periodLabel: 'Cette semaine',
          historyLabel: 'Derniers jours:'
        };
      case 'month':
        return {
          periodLabel: 'Ce mois',
          historyLabel: 'Derniers jours:'
        };
      case 'year':
        return {
          periodLabel: 'Cette année',
          historyLabel: 'Derniers mois:'
        };
      default:
        return {
          periodLabel: '7 derniers jours',
          historyLabel: 'Derniers jours:'
        };
    }
  };

  const { periodLabel, historyLabel } = getPerformanceLabels();

  // ✅ Gestionnaire navigation vers détails
  const handleCommandePress = (commandeId: string) => {
    console.log('📦 Navigation vers commande:', commandeId);
    // TODO: Navigation vers CommandeDetailsScreen
  };

  // ✅ Loading state
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Chargement des livraisons...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Tableau de bord</Text>
        <Text style={styles.subtitle}>
          {user?.prenom} {user?.nom}
        </Text>
      </View>

      {/* Filtres de période */}
      <DateFilterSelector value={dateRange} onChange={setDateRange} />

      {/* Dates personnalisées */}
      <CustomDatePicker value={customDateRange} onChange={setCustomDateRange} />

      {/* Métriques principales (4 cartes) */}
      <View style={styles.metricsGrid}>
        <MetricCard
          title="Livraisons réussies"
          value={metrics.totalLivraisons}
          subtitle={`${metrics.totalLivraisons} sur ${metrics.totalCommandes} livraisons`}
          color="#10B981"
        />
        <MetricCard
          title="En cours"
          value={metrics.enCours}
          subtitle="Mes livraisons actives"
          color="#F59E0B"
        />
        <MetricCard
          title="En attente"
          value={metrics.enAttente}
          subtitle="À traiter"
          color="#3B82F6"
        />
        <MetricCard
          title="Performance"
          value={`${metrics.performance}%`}
          subtitle="Taux de réussite"
          color="#8B5CF6"
        />
      </View>

      {/* Graphique Performance */}
      <PerformanceChart
        data={metrics.historique}
        periodLabel={periodLabel}
        historyLabel={historyLabel}
      />

      {/* Tableau Livraisons Récentes (10 max) */}
      <DeliveriesTable commandes={filteredCommandes} onCommandePress={handleCommandePress} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: '#6B7280',
  },
  header: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 16,
    marginBottom: 16,
  },
});
