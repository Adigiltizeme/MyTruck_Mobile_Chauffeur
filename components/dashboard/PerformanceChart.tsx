/**
 * PerformanceChart - Graphique de performance (version simplifiée)
 * Affichage des données de performance sans graphique complexe
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

interface ChartDataPoint {
  date: string;
  totalLivraisons: number;
  enCours: number;
  enAttente: number;
  index?: number;
  rawDate?: number;
}

interface PerformanceChartProps {
  data: ChartDataPoint[];
  periodLabel?: string; // ✅ Label dynamique selon filtre
  historyLabel?: string; // ✅ Label historique dynamique
}

export const PerformanceChart: React.FC<PerformanceChartProps> = ({
  data,
  periodLabel = '7 derniers jours',
  historyLabel = 'Derniers éléments:'
}) => {
  if (!data || !Array.isArray(data) || data.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>Aucune donnée disponible</Text>
      </View>
    );
  }

  // Tri des données
  const sortedData = [...data].sort((a, b) => {
    if (a.rawDate && b.rawDate) {
      return a.rawDate - b.rawDate;
    }
    if (a.index !== undefined && b.index !== undefined) {
      return a.index - b.index;
    }
    return 0;
  });

  // Calculer les totaux
  const totals = sortedData.reduce(
    (acc, curr) => ({
      livraisons: acc.livraisons + curr.totalLivraisons,
      enCours: acc.enCours + curr.enCours,
      enAttente: acc.enAttente + curr.enAttente,
    }),
    { livraisons: 0, enCours: 0, enAttente: 0 }
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>📊 Performance - {periodLabel}</Text>

      {/* Stats résumées */}
      <View style={styles.statsContainer}>
        {/* Ligne Livrées */}
        <View style={styles.statRow}>
          <View style={[styles.colorDot, { backgroundColor: '#10B981' }]} />
          <Text style={styles.statLabel}>Livrées</Text>
          <Text style={[styles.statValue, { color: '#10B981' }]}>{totals.livraisons}</Text>
        </View>

        {/* Ligne En cours */}
        <View style={styles.statRow}>
          <View style={[styles.colorDot, { backgroundColor: '#F59E0B' }]} />
          <Text style={styles.statLabel}>En cours</Text>
          <Text style={[styles.statValue, { color: '#F59E0B' }]}>{totals.enCours}</Text>
        </View>

        {/* Ligne En attente */}
        <View style={styles.statRow}>
          <View style={[styles.colorDot, { backgroundColor: '#3B82F6' }]} />
          <Text style={styles.statLabel}>En attente</Text>
          <Text style={[styles.statValue, { color: '#3B82F6' }]}>{totals.enAttente}</Text>
        </View>
      </View>

      {/* Historique complet avec scroll horizontal */}
      <View style={styles.historyContainer}>
        <Text style={styles.historyTitle}>{historyLabel}</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={true}
          contentContainerStyle={styles.historyScrollContent}
        >
          {sortedData.map((item, index) => (
            <View key={index} style={styles.historyCard}>
              <Text style={styles.historyCardDate}>{item.date}</Text>
              <View style={styles.historyCardStats}>
                <View style={styles.historyCardStat}>
                  <Text style={styles.historyStatGreen}>{item.totalLivraisons}</Text>
                  <Text style={styles.historyStatLabel}>✓ Livrées</Text>
                </View>
                <View style={styles.historyCardStat}>
                  <Text style={styles.historyStatOrange}>{item.enCours}</Text>
                  <Text style={styles.historyStatLabel}>⏳ En cours</Text>
                </View>
                <View style={styles.historyCardStat}>
                  <Text style={styles.historyStatBlue}>{item.enAttente}</Text>
                  <Text style={styles.historyStatLabel}>⏸ En attente</Text>
                </View>
              </View>
            </View>
          ))}
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  emptyContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 32,
    marginHorizontal: 16,
    marginBottom: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: '#6B7280',
    fontSize: 14,
  },
  statsContainer: {
    marginBottom: 16,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  colorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  statLabel: {
    flex: 1,
    fontSize: 14,
    color: '#6B7280',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '600',
  },
  historyContainer: {
    marginTop: 8,
  },
  historyTitle: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: 8,
  },
  historyScrollContent: {
    paddingRight: 16,
    gap: 12,
  },
  historyCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    marginRight: 12,
    minWidth: 140,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  historyCardDate: {
    fontSize: 13,
    color: '#111827',
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  historyCardStats: {
    gap: 6,
  },
  historyCardStat: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  historyStatLabel: {
    fontSize: 10,
    color: '#6B7280',
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  historyDate: {
    fontSize: 12,
    color: '#111827',
    fontWeight: '500',
  },
  historyStats: {
    flexDirection: 'row',
    gap: 12,
  },
  historyStatGreen: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: '700',
  },
  historyStatOrange: {
    fontSize: 14,
    color: '#F59E0B',
    fontWeight: '700',
  },
  historyStatBlue: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '700',
  },
});

export default PerformanceChart;
