import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Dimensions,
  BackHandler,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Heart,
  MapPin,
  Sparkles,
  Trash2,
  Calendar,
  Ticket,
} from 'lucide-react-native';
import RoomDatabase from '../services/roomDatabase';

const { width } = Dimensions.get('window');

export default function FavoritesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [favorites, setFavorites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFavorites();

    const onBackPress = () => {
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/(tabs)');
      }
      return true;
    };
    const backSub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => backSub.remove();
  }, []);

  const loadFavorites = async () => {
    try {
      const list = await RoomDatabase.getFavorites();
      setFavorites(list);
    } catch (e) {
      console.warn('loadFavorites error:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (item: any) => {
    await RoomDatabase.toggleFavorite(item);
    setFavorites((prev) => prev.filter((f) => f.id !== item.id));
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 14) }]}>
        <TouchableOpacity
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)'))}
          style={styles.backBtn}
          activeOpacity={0.7}
        >
          <ArrowLeft size={22} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Saved Favorites</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#e11d48" />
        </View>
      ) : favorites.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconCircle}>
            <Heart size={40} color="#e11d48" />
          </View>
          <Text style={styles.emptyTitle}>No Favorites Saved Yet</Text>
          <Text style={styles.emptySubtitle}>
            Tap the heart icon on any wedding package, birthday theme, or venue to save it here for quick access.
          </Text>
          <TouchableOpacity
            style={styles.exploreBtn}
            onPress={() => router.push('/(tabs)')}
            activeOpacity={0.88}
          >
            <Sparkles size={16} color="#ffffff" />
            <Text style={styles.exploreBtnText}>Explore Celebrations</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[
            styles.list,
            { paddingBottom: Math.max(insets.bottom, 24) + 40 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {favorites.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.card}
              activeOpacity={0.88}
              onPress={() =>
                router.push({
                  pathname: '/item-detail',
                  params: {
                    id: item.id,
                    title: item.title,
                    price: String(item.price || 1499),
                    image: item.image,
                    type: item.type,
                    cornerTag: item.cornerTag,
                    location: item.location,
                  },
                })
              }
            >
              <Image
                source={{
                  uri:
                    item.image ||
                    'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=400&q=80',
                }}
                style={styles.cardImage}
              />
              {item.cornerTag && (
                <View style={styles.cornerTagBadge}>
                  <Text style={styles.cornerTagText}>{item.cornerTag.toUpperCase()}</Text>
                </View>
              )}
              <View style={styles.cardInfo}>
                <Text style={styles.itemTitle} numberOfLines={1}>
                  {item.title}
                </Text>
                {item.location && (
                  <View style={styles.locationRow}>
                    <MapPin size={12} color="#94a3b8" />
                    <Text style={styles.locationText} numberOfLines={1}>
                      {item.location}
                    </Text>
                  </View>
                )}
                <Text style={styles.itemPrice}>
                  ₹{(typeof item.price === 'number' ? item.price : 1499).toLocaleString('en-IN')}
                </Text>
              </View>

              <TouchableOpacity
                style={styles.removeBtn}
                onPress={() => handleRemove(item)}
                activeOpacity={0.7}
              >
                <Trash2 size={16} color="#e11d48" />
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 14,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#ffe4e6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  exploreBtn: {
    marginTop: 24,
    backgroundColor: '#e11d48',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  exploreBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  list: {
    padding: 16,
    gap: 12,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    position: 'relative',
  },
  cardImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
  },
  cornerTagBadge: {
    position: 'absolute',
    top: 14,
    left: 14,
    backgroundColor: '#dc2626',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  cornerTagText: {
    color: '#ffffff',
    fontSize: 8,
    fontWeight: '800',
  },
  cardInfo: {
    flex: 1,
    marginLeft: 14,
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  locationText: {
    fontSize: 12,
    color: '#64748b',
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: '800',
    color: '#e11d48',
    marginTop: 6,
  },
  removeBtn: {
    padding: 10,
    borderRadius: 10,
    backgroundColor: '#fff1f2',
  },
});
