import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface BottomTabsProps {
  activeTab: 'explore' | 'active';
  onTabChange: (tab: 'explore' | 'active') => void;
}

export function BottomTabs({ activeTab, onTabChange }: BottomTabsProps) {
  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'explore' && styles.activeTab]}
        onPress={() => onTabChange('explore')}
      >
        <View style={[styles.icon, activeTab === 'explore' && styles.activeIcon]}>
          <Text style={styles.iconText}>C</Text>
        </View>
        <Text style={[styles.label, activeTab === 'explore' && styles.activeLabel]}>
          Discover
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.tab, activeTab === 'active' && styles.activeTab]}
        onPress={() => onTabChange('active')}
      >
        <View style={[styles.icon, activeTab === 'active' && styles.activeIcon]}>
          <Text style={styles.iconText}>P</Text>
        </View>
        <Text style={[styles.label, activeTab === 'active' && styles.activeLabel]}>
          My Tours
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingBottom: 20,
    paddingTop: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  activeTab: {},
  icon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  activeIcon: {
    backgroundColor: '#7cb342',
  },
  iconText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  label: {
    fontSize: 12,
    color: '#888888',
  },
  activeLabel: {
    color: '#7cb342',
    fontWeight: '600',
  },
});
