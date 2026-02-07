/**
 * DateFilterSelector - Sélecteur de période (Aujourd'hui, Cette semaine, Ce mois, Cette année)
 * Duplication exacte du filtrage web
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';

export type PeriodType = 'day' | 'week' | 'month' | 'year';

interface DateFilterSelectorProps {
  value: PeriodType;
  onChange: (period: PeriodType) => void;
}

export const DateFilterSelector: React.FC<DateFilterSelectorProps> = ({ value, onChange }) => {
  const periods: { label: string; value: PeriodType }[] = [
    { label: "Aujourd'hui", value: 'day' },
    { label: 'Cette semaine', value: 'week' },
    { label: 'Ce mois', value: 'month' },
    { label: 'Cette année', value: 'year' },
  ];

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {periods.map((period) => (
        <TouchableOpacity
          key={period.value}
          onPress={() => onChange(period.value)}
          style={[
            styles.button,
            value === period.value && styles.buttonActive,
          ]}
        >
          <Text
            style={[
              styles.buttonText,
              value === period.value && styles.buttonTextActive,
            ]}
          >
            {period.label}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  button: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  buttonActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  buttonTextActive: {
    color: '#FFFFFF',
  },
});

export default DateFilterSelector;
