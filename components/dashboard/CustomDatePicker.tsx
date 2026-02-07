/**
 * CustomDatePicker - Sélecteur de dates personnalisées (Période ou Date unique)
 * Duplication exacte du DateSelector web
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

export interface DateRange {
  start: string | null;
  end: string | null;
  mode: 'range' | 'single';
  singleDate: string | null;
}

interface CustomDatePickerProps {
  value: DateRange;
  onChange: (dateRange: DateRange) => void;
}

export const CustomDatePicker: React.FC<CustomDatePickerProps> = ({ value, onChange }) => {
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [showSinglePicker, setShowSinglePicker] = useState(false);

  const handleModeChange = (mode: 'range' | 'single') => {
    onChange({
      ...value,
      mode,
      start: null,
      end: null,
      singleDate: null,
    });
  };

  const handleStartDateChange = (event: any, selectedDate?: Date) => {
    setShowStartPicker(Platform.OS === 'ios');
    if (selectedDate) {
      const dateString = selectedDate.toISOString().split('T')[0];
      onChange({ ...value, start: dateString });
    }
  };

  const handleEndDateChange = (event: any, selectedDate?: Date) => {
    setShowEndPicker(Platform.OS === 'ios');
    if (selectedDate) {
      const dateString = selectedDate.toISOString().split('T')[0];
      onChange({ ...value, end: dateString });
    }
  };

  const handleSingleDateChange = (event: any, selectedDate?: Date) => {
    setShowSinglePicker(Platform.OS === 'ios');
    if (selectedDate) {
      const dateString = selectedDate.toISOString().split('T')[0];
      onChange({
        ...value,
        singleDate: dateString,
        start: dateString,
        end: dateString,
      });
    }
  };

  const handleReset = () => {
    onChange({
      start: null,
      end: null,
      mode: value.mode,
      singleDate: null,
    });
  };

  const formatDateDisplay = (dateString: string | null) => {
    if (!dateString) return 'Sélectionner';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const hasActiveDate =
    (value.mode === 'single' && value.singleDate) ||
    (value.mode === 'range' && (value.start || value.end));

  return (
    <View style={styles.container}>
      {/* Titre */}
      <Text style={styles.label}>Date personnalisée:</Text>

      {/* Sélecteur de mode */}
      <View style={styles.modeSelector}>
        <TouchableOpacity
          style={[styles.modeButton, value.mode === 'range' && styles.modeButtonActive]}
          onPress={() => handleModeChange('range')}
        >
          <Text style={[styles.modeButtonText, value.mode === 'range' && styles.modeButtonTextActive]}>
            Période
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.modeButton, value.mode === 'single' && styles.modeButtonActive]}
          onPress={() => handleModeChange('single')}
        >
          <Text style={[styles.modeButtonText, value.mode === 'single' && styles.modeButtonTextActive]}>
            Date unique
          </Text>
        </TouchableOpacity>
      </View>

      {/* Date pickers */}
      {value.mode === 'single' ? (
        <View style={styles.datePickerContainer}>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowSinglePicker(true)}
          >
            <Text style={styles.dateButtonText}>{formatDateDisplay(value.singleDate)}</Text>
          </TouchableOpacity>
          {showSinglePicker && (
            <DateTimePicker
              value={value.singleDate ? new Date(value.singleDate) : new Date()}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleSingleDateChange}
            />
          )}
        </View>
      ) : (
        <View style={styles.dateRangeContainer}>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowStartPicker(true)}
          >
            <Text style={styles.dateButtonText}>{formatDateDisplay(value.start)}</Text>
          </TouchableOpacity>
          {showStartPicker && (
            <DateTimePicker
              value={value.start ? new Date(value.start) : new Date()}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleStartDateChange}
            />
          )}

          <Text style={styles.separator}>à</Text>

          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowEndPicker(true)}
          >
            <Text style={styles.dateButtonText}>{formatDateDisplay(value.end)}</Text>
          </TouchableOpacity>
          {showEndPicker && (
            <DateTimePicker
              value={value.end ? new Date(value.end) : new Date()}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleEndDateChange}
            />
          )}
        </View>
      )}

      {/* Bouton Réinitialiser */}
      {hasActiveDate && (
        <TouchableOpacity onPress={handleReset} style={styles.resetButton}>
          <Text style={styles.resetButtonText}>Réinitialiser</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 12,
  },
  modeSelector: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 8,
  },
  modeButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  modeButtonActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  modeButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  modeButtonTextActive: {
    color: '#FFFFFF',
  },
  datePickerContainer: {
    marginBottom: 12,
  },
  dateRangeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  dateButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  dateButtonText: {
    fontSize: 14,
    color: '#111827',
    textAlign: 'center',
  },
  separator: {
    fontSize: 14,
    color: '#6B7280',
  },
  resetButton: {
    paddingVertical: 8,
    alignItems: 'center',
  },
  resetButtonText: {
    fontSize: 14,
    color: '#6B7280',
    textDecorationLine: 'underline',
  },
});

export default CustomDatePicker;
