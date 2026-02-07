/**
 * MetricCard - Carte de métrique (KPI)
 * Duplication exacte du MetricCard web (sans graphique pour compatibilité mobile)
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Dimensions } from 'react-native';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  chartData?: Array<{ date: string; value: number }>;
  color?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  color = '#10B981',
}) => {
  const screenWidth = Dimensions.get('window').width;
  const cardWidth = (screenWidth - 48) / 2; // 2 colonnes avec margins

  return (
    <View style={[styles.card, { width: cardWidth, borderLeftColor: color, borderLeftWidth: 4 }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
      </View>

      {/* Value */}
      <Text style={[styles.value, { color }]}>
        {typeof value === 'number' ? value.toLocaleString() : value}
      </Text>

      {/* Subtitle */}
      <Text style={styles.subtitle}>{subtitle}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  title: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
  },
  value: {
    fontSize: 28,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 12,
  },
  chartContainer: {
    height: 50,
    marginTop: 8,
    marginLeft: -16,
  },
  chart: {
    marginVertical: 0,
    borderRadius: 0,
  },
});

export default MetricCard;
