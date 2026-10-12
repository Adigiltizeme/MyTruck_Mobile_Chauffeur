/**
 * LiveTrackingMap - Position du chauffeur sur une commande (équivalent mobile de LiveTrackingMap web)
 * Dernière position connue au chargement, puis mises à jour temps réel (événement chauffeur-location).
 */

import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import io from 'socket.io-client';
import { format } from 'date-fns';
import { API_BASE_URL } from '../../constants/API';
import { StorageService } from '../../services/storage.service';
import commandesService from '../../services/commandes.service';
import { openMaps } from '../../utils/contact-links';

interface DriverPosition {
  latitude: number;
  longitude: number;
  timestamp?: string;
  chauffeurName?: string;
}

// Zoom ~ quartier
const MAP_DELTA = 0.02;

interface LiveTrackingMapProps {
  commandeId: string;
  /** true = livraison en cours : écoute des positions en direct */
  live: boolean;
}

export const LiveTrackingMap: React.FC<LiveTrackingMapProps> = ({ commandeId, live }) => {
  const [position, setPosition] = useState<DriverPosition | null>(null);
  const [loading, setLoading] = useState(true);
  const mapRef = useRef<MapView | null>(null);

  useEffect(() => {
    let cancelled = false;
    commandesService.getLastPosition(commandeId)
      .then((res) => {
        if (!cancelled && res.success && res.data?.latitude) {
          setPosition({ latitude: res.data.latitude, longitude: res.data.longitude, timestamp: res.data.timestamp });
        }
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [commandeId]);

  useEffect(() => {
    if (!live) return;
    let socket: any = null;
    let disposed = false;

    StorageService.getToken().then((token) => {
      if (!token || disposed) return;
      socket = io(API_BASE_URL, { auth: { token }, transports: ['polling', 'websocket'], reconnection: true });
      socket.on('chauffeur-location', (data: any) => {
        if (data?.commandeId !== commandeId || typeof data.latitude !== 'number') return;
        const next = {
          latitude: data.latitude,
          longitude: data.longitude,
          timestamp: data.timestamp,
          chauffeurName: data.chauffeurName,
        };
        setPosition(next);
        mapRef.current?.animateToRegion({ ...next, latitudeDelta: MAP_DELTA, longitudeDelta: MAP_DELTA }, 500);
      });
    });

    return () => {
      disposed = true;
      socket?.disconnect();
    };
  }, [commandeId, live]);

  if (loading) {
    return (
      <View style={styles.placeholder}>
        <ActivityIndicator color="#3B82F6" />
      </View>
    );
  }

  if (!position) {
    return (
      <View style={styles.placeholder}>
        <Ionicons name="time-outline" size={28} color="#9CA3AF" />
        <Text style={styles.placeholderTitle}>En attente de localisation</Text>
        <Text style={styles.placeholderText}>Le chauffeur doit avoir activé son suivi GPS.</Text>
      </View>
    );
  }

  return (
    <View>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={{ ...position, latitudeDelta: MAP_DELTA, longitudeDelta: MAP_DELTA }}
      >
        <Marker
          coordinate={{ latitude: position.latitude, longitude: position.longitude }}
          title={position.chauffeurName || 'Chauffeur'}
          pinColor="#E11D48"
        />
      </MapView>
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          {live ? '🟢 Position en direct' : '📍 Dernière position connue'}
          {position.timestamp ? ` · ${format(new Date(position.timestamp), 'HH:mm')}` : ''}
        </Text>
        <TouchableOpacity onPress={() => openMaps(`${position.latitude},${position.longitude}`)}>
          <Text style={styles.footerLink}>Ouvrir</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  map: {
    width: '100%',
    height: 260,
    borderRadius: 8,
  },
  placeholder: {
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    gap: 6,
    paddingHorizontal: 16,
  },
  placeholderTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4B5563',
  },
  placeholderText: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  footerText: {
    fontSize: 12,
    color: '#4B5563',
  },
  footerLink: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2563EB',
  },
});

export default LiveTrackingMap;
