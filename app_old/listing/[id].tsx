import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { theme } from '../../src/constants/theme';

export default function ListingDetail() {
  const { id } = useLocalSearchParams();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.imageArea} />
        <View style={styles.content}>
          <Text style={styles.title}>Grand Palace Venue {id}</Text>
          <Text style={styles.location}>Kochi, Kerala</Text>
          <Text style={styles.price}>₹50,000 / day</Text>
          
          <View style={styles.divider} />
          
          <Text style={styles.sectionTitle}>About</Text>
          <Text style={styles.description}>
            Beautiful and spacious venue perfect for weddings, corporate events, and large gatherings. Features include ample parking, air conditioning, and catering services.
          </Text>

          <View style={styles.divider} />
          
          <Text style={styles.sectionTitle}>Amenities</Text>
          <View style={styles.amenities}>
            {['Parking', 'AC', 'Catering', 'Decor'].map((item, index) => (
              <View key={index} style={styles.amenityChip}>
                <Text style={styles.amenityText}>{item}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Sticky Bottom Bar */}
      <View style={styles.bottomBar}>
        <View>
          <Text style={styles.bottomBarPrice}>₹50,000</Text>
          <Text style={styles.bottomBarUnit}>per day</Text>
        </View>
        <TouchableOpacity style={styles.bookButton}>
          <Text style={styles.bookButtonText}>Book Now</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  imageArea: {
    width: '100%',
    height: 300,
    backgroundColor: theme.colors.surface,
  },
  content: {
    padding: theme.spacing.lg,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  location: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
  },
  price: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginVertical: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  description: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    lineHeight: 24,
  },
  amenities: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  amenityChip: {
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
    marginRight: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  amenityText: {
    color: theme.colors.text,
  },
  bottomBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.background,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  bottomBarPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  bottomBarUnit: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  bookButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
  },
  bookButtonText: {
    color: theme.colors.background,
    fontWeight: 'bold',
    fontSize: 16,
  }
});
