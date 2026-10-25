import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Image,
  ScrollView,
  Platform,
} from 'react-native';
import {
  X,
  Home,
  LayoutGrid,
  Compass,
  Heart,
  CreditCard,
  Settings,
  Phone,
  Info,
  LogOut,
  Gift,
  Cake,
  Crown,
  Tag,
  Package,
  Palette,
  Flame,
  Utensils,
  Wallet,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  Bell,
  Ticket,
  Calendar,
  User,
} from 'lucide-react-native';
import { router } from 'expo-router';
import RoomDatabase from '../services/roomDatabase';
import {
  getAdminCustomSections,
  getAdminCustomCategories,
  AdminCustomSection,
  AdminCustomCategory,
} from '../services/adminSections';

interface SidebarDrawerProps {
  visible: boolean;
  onClose: () => void;
  onOpenWallet?: () => void;
  user?: { name: string; email: string };
}

export default function SidebarDrawer({ visible, onClose, onOpenWallet, user }: SidebarDrawerProps) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState('Welcome Guest');
  const [walletBalance, setWalletBalance] = useState(0);
  const [customSections, setCustomSections] = useState<AdminCustomSection[]>([]);
  const [customCategories, setCustomCategories] = useState<AdminCustomCategory[]>([]);

  useEffect(() => {
    if (visible) {
      RoomDatabase.getUserSession().then((session) => {
        if (session && session.name) {
          setIsLoggedIn(true);
          setUserName(session.name);
          if (typeof session.walletBalance === 'number') {
            setWalletBalance(session.walletBalance);
          }
        } else if (user?.name) {
          setIsLoggedIn(true);
          setUserName(user.name);
        } else {
          setIsLoggedIn(false);
          setUserName('Welcome Guest');
        }
      });

      RoomDatabase.getWalletBalance().then((bal) => {
        setWalletBalance(bal || 0);
      });

      getAdminCustomSections().then((secs) => {
        setCustomSections(secs || []);
      }).catch(() => {});

      getAdminCustomCategories().then((cats) => {
        setCustomCategories(cats || []);
      }).catch(() => {});
    }
  }, [visible, user]);

  const handleLogout = async () => {
    await RoomDatabase.clearUserSession();
    onClose();
    router.replace('/login');
  };

  const navItems = [
    { icon: Home, label: 'Home Feed', action: () => { onClose(); router.push('/(tabs)'); } },
    { icon: LayoutGrid, label: 'Explore & Search', action: () => { onClose(); router.push('/(tabs)/explore'); } },
    { icon: Compass, label: 'LokSafari Experience', action: () => { onClose(); router.push('/(tabs)/loksafari'); } },
    { icon: Heart, label: 'Saved Favorites', action: () => { onClose(); router.push('/favorites'); } },
    { icon: Ticket, label: 'My Bookings & Passes', action: () => { onClose(); router.push('/(tabs)/bookings'); } },
    { icon: Bell, label: 'Notifications & Broadcasts', action: () => { onClose(); router.push('/notifications'); } },
  ];

  // User-requested Celebration Categories
  const celebrationThemes = [
    {
      icon: Crown,
      label: 'Wedding Themes & Mandaps',
      sub: 'Royal palaces, varmala stages & destination packages',
      tag: 'WEDDING',
      action: () => { onClose(); router.push('/(tabs)/explore?category=Weddings'); },
    },
    {
      icon: Tag,
      label: 'Wedding Offers & VIP Deals',
      sub: 'Instant cashback, early bird & promo discounts',
      tag: 'OFFERS',
      action: () => { onClose(); router.push('/notifications'); },
    },
    {
      icon: Cake,
      label: 'Birthday Themes & Fiesta',
      sub: 'Neon backdrops, DJ parties, magicians & cake',
      tag: 'BIRTHDAY',
      action: () => { onClose(); router.push('/(tabs)/explore?category=Birthdays'); },
    },
    {
      icon: Utensils,
      label: 'Catering & 56-Bhog Feasts',
      sub: 'Pure Desi Ghee banquets, live chaat & mocktails',
      tag: 'CATERING',
      action: () => { onClose(); router.push('/(tabs)/explore?category=Catering'); },
    },
    {
      icon: Gift,
      label: 'Baby Shower & Mom-to-Be',
      sub: 'Pastel balloon arches, high tea & cradle setups',
      tag: 'BABY',
      action: () => { onClose(); router.push('/(tabs)/explore?category=Baby Shower'); },
    },
    {
      icon: Sparkles,
      label: 'Engagements & Roka Setups',
      sub: 'Ring ceremony stages, acoustic music & fairy lights',
      tag: 'ROKA',
      action: () => { onClose(); router.push('/(tabs)/explore?category=Engagements'); },
    },
    {
      icon: Package,
      label: 'Office & Corporate Events',
      sub: 'Annual summits, award galas & corporate banquets',
      tag: 'OFFICE',
      action: () => { onClose(); router.push('/(tabs)/explore?category=Office Events'); },
    },
    {
      icon: Palette,
      label: 'Mandap & Haldi Decor',
      sub: 'Haldi bohemian, fairy forest lights & fresh florals',
      tag: 'DECOR',
      action: () => { onClose(); router.push('/(tabs)/explore?category=Decor'); },
    },
    {
      icon: Flame,
      label: 'Vedic Pandit & Sacred Rituals',
      sub: 'Vedic Vivah, Griha Pravesh & Hawan Vidhi',
      tag: 'PANDIT',
      action: () => { onClose(); router.push('/(tabs)/explore?category=Pandit'); },
    },
    {
      icon: Compass,
      label: 'LokSafari Expeditions',
      sub: 'Eco trails, village cultural tours & gate passes',
      tag: 'SAFARI',
      action: () => { onClose(); router.push('/(tabs)/loksafari'); },
    },
  ];

  const secondaryItems = [
    { icon: Settings, label: 'Account & Settings', action: () => { onClose(); router.push('/settings'); } },
    { icon: Phone, label: 'Help & Support Desk', action: () => { onClose(); router.push('/help-support'); } },
    { icon: ShieldCheck, label: 'Privacy & Security', action: () => { onClose(); router.push('/privacy-security'); } },
  ];

  return (
    <Modal visible={visible} animationType="fade" transparent={true} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} onPress={onClose} activeOpacity={1} />

        <View style={styles.drawer}>
          {/* Header */}
          <View style={styles.drawerHeader}>
            <View>
              <Text style={styles.brandTitle}>happylokam</Text>
              <Text style={styles.brandTagline}>Celebrations & Pass Booking</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <X size={20} color="#64748b" />
            </TouchableOpacity>
          </View>

          {/* Profile Brief in Sidebar */}
          <View style={styles.profileBrief}>
            <View style={styles.avatarBorder}>
              <View style={{ width: '100%', height: '100%', backgroundColor: '#ffe4e6', alignItems: 'center', justifyContent: 'center', borderRadius: 20 }}>
                <User size={20} color="#e11d48" />
              </View>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.profileName} numberOfLines={1}>{userName}</Text>
              <View style={styles.memberTag}>
                <Sparkles size={10} color="#e11d48" />
                <Text style={styles.memberTagText}>Verified Member</Text>
              </View>
            </View>
          </View>

          {/* Wallet Balance Highlight Bar with TAG */}
          <TouchableOpacity
            style={styles.walletBar}
            onPress={() => {
              onClose();
              if (onOpenWallet) onOpenWallet();
            }}
            activeOpacity={0.85}
          >
            <View style={styles.walletIconCircle}>
              <Wallet size={18} color="#059669" />
            </View>
            <View style={{ flex: 1, marginLeft: 10 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={styles.walletLabel}>HappyWallet Cash</Text>
                <View style={styles.walletTagBadge}>
                  <Text style={styles.walletTagText}>TAG: CASHBACK</Text>
                </View>
              </View>
              <Text style={styles.walletBalanceText}>₹{walletBalance.toLocaleString('en-IN')}</Text>
            </View>
            <ChevronRight size={16} color="#059669" />
          </TouchableOpacity>

          {/* Scrollable Menu Items */}
          <ScrollView
            contentContainerStyle={styles.menuScroll}
            showsVerticalScrollIndicator={false}
          >
            {/* Quick Tabs Navigation */}
            <Text style={styles.sectionHeading}>MAIN MENU</Text>
            {navItems.map((item) => (
              <TouchableOpacity
                key={item.label}
                style={styles.menuItem}
                onPress={item.action}
                activeOpacity={0.75}
              >
                <item.icon size={19} color="#64748b" />
                <Text style={styles.menuItemText}>{item.label}</Text>
              </TouchableOpacity>
            ))}

            <View style={styles.divider} />

            {/* User-Requested Themes & Booking Packages */}
            <View style={styles.sectionTitleRow}>
              <Text style={styles.sectionHeading}>THEMES & SERVICES</Text>
              <View style={styles.redBadge}>
                <Text style={styles.redBadgeText}>HOT</Text>
              </View>
            </View>

            {celebrationThemes.map((theme) => (
              <TouchableOpacity
                key={theme.label}
                style={styles.themeItem}
                onPress={theme.action}
                activeOpacity={0.8}
              >
                <View style={styles.themeIconBox}>
                  <theme.icon size={18} color="#e11d48" />
                </View>
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Text style={styles.themeTitle} numberOfLines={1}>{theme.label}</Text>
                    <View style={styles.cornerTagBadge}>
                      <Text style={styles.cornerTagText}>{theme.tag}</Text>
                    </View>
                  </View>
                  <Text style={styles.themeSub} numberOfLines={1}>{theme.sub}</Text>
                </View>
              </TouchableOpacity>
            ))}

            <View style={styles.divider} />

            {/* Admin Custom Sections & Items */}
            {customSections.length > 0 && (
              <>
                <View style={styles.sectionTitleRow}>
                  <Text style={styles.sectionHeading}>FEATURED SECTIONS</Text>
                  <View style={styles.adminBadge}>
                    <Text style={styles.adminBadgeText}>LIVE SECTIONS</Text>
                  </View>
                </View>

                {customSections.map((sec) => (
                  <View key={sec.id} style={styles.customSectionBox}>
                    <TouchableOpacity
                      style={styles.customSectionHeader}
                      onPress={() => {
                        onClose();
                        router.push('/(tabs)');
                      }}
                      activeOpacity={0.75}
                    >
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Text style={styles.customSectionTitle} numberOfLines={1}>{sec.title}</Text>
                          {sec.tag && (
                            <View style={styles.secTagPill}>
                              <Text style={styles.secTagPillText}>{sec.tag}</Text>
                            </View>
                          )}
                        </View>
                        <Text style={styles.customSectionSub} numberOfLines={1}>{sec.subtitle}</Text>
                      </View>
                      <ChevronRight size={14} color="#94a3b8" />
                    </TouchableOpacity>

                    {/* Section Items Preview */}
                    {sec.items && sec.items.slice(0, 2).map((it) => (
                      <TouchableOpacity
                        key={it.id}
                        style={styles.secItemRow}
                        onPress={() => {
                          onClose();
                          router.push({
                            pathname: '/item-detail',
                            params: {
                              id: it.id,
                              title: it.title,
                              subtitle: it.subtitle,
                              price: String(it.price),
                              image: it.image,
                              type: it.itemType || it.type,
                              cornerTag: it.cornerTag,
                              location: it.location,
                            },
                          });
                        }}
                        activeOpacity={0.8}
                      >
                        <Image source={{ uri: it.image }} style={styles.secItemThumb} />
                        <View style={{ flex: 1, marginLeft: 8 }}>
                          <Text style={styles.secItemTitle} numberOfLines={1}>{it.title}</Text>
                          <Text style={styles.secItemPrice}>₹{typeof it.price === 'number' ? it.price.toLocaleString('en-IN') : it.price}</Text>
                        </View>
                        {it.cornerTag ? (
                          <View style={styles.itemSmallCornerTag}>
                            <Text style={styles.itemSmallCornerTagText}>{it.cornerTag}</Text>
                          </View>
                        ) : null}
                      </TouchableOpacity>
                    ))}
                  </View>
                ))}

                <View style={styles.divider} />
              </>
            )}

            {/* Admin Custom Categories */}
            {customCategories.length > 0 && (
              <>
                <View style={styles.sectionTitleRow}>
                  <Text style={styles.sectionHeading}>CURATED THEMES</Text>
                  <View style={styles.adminBadge}>
                    <Text style={styles.adminBadgeText}>LIVE THEMES</Text>
                  </View>
                </View>

                {customCategories.map((cat) => (
                  <TouchableOpacity
                    key={cat.id}
                    style={styles.themeItem}
                    onPress={() => {
                      onClose();
                      router.push({
                        pathname: '/(tabs)/explore',
                        params: { category: cat.name },
                      });
                    }}
                    activeOpacity={0.8}
                  >
                    <Image source={{ uri: cat.image }} style={styles.customCatDrawerImg} />
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text style={styles.themeTitle} numberOfLines={1}>{cat.name}</Text>
                      <Text style={styles.themeSub} numberOfLines={1}>{cat.tag || 'Celebration Category'}</Text>
                    </View>
                    <ChevronRight size={14} color="#94a3b8" />
                  </TouchableOpacity>
                ))}

                <View style={styles.divider} />
              </>
            )}

            {/* Secondary Settings & Support */}
            <Text style={styles.sectionHeading}>PREFERENCES & HELP</Text>
            {secondaryItems.map((item) => (
              <TouchableOpacity
                key={item.label}
                style={styles.secondaryItem}
                onPress={item.action}
                activeOpacity={0.75}
              >
                <item.icon size={17} color="#64748b" />
                <Text style={styles.secondaryItemText}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Log Out / Sign In Footer */}
          <View style={styles.drawerFooter}>
            {isLoggedIn ? (
              <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.85}>
                <LogOut size={18} color="#e11d48" />
                <Text style={styles.logoutText}>Log Out Account</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.logoutBtn, { borderColor: '#e11d48', backgroundColor: '#fff1f2' }]}
                onPress={() => {
                  onClose();
                  router.push('/login');
                }}
                activeOpacity={0.85}
              >
                <LogOut size={18} color="#e11d48" />
                <Text style={[styles.logoutText, { color: '#e11d48' }]}>Sign In / Register</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    flexDirection: 'row',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
  },
  drawer: {
    width: '84%',
    maxWidth: 340,
    backgroundColor: '#ffffff',
    borderTopRightRadius: 28,
    borderBottomRightRadius: 28,
    paddingTop: Platform.OS === 'ios' ? 44 : 20,
    shadowColor: '#000000',
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 24,
    overflow: 'hidden',
  },
  drawerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  brandTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#e11d48',
    letterSpacing: -0.6,
  },
  brandTagline: {
    fontSize: 10,
    fontWeight: '600',
    color: '#94a3b8',
    marginTop: -1,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileBrief: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  avatarBorder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#ffe4e6',
    overflow: 'hidden',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  profileName: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0f172a',
    marginBottom: 2,
  },
  memberTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#fff1f2',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  memberTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#e11d48',
  },
  walletBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
    borderRadius: 16,
  },
  walletIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#6ee7b7',
  },
  walletLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#065f46',
  },
  walletTagBadge: {
    backgroundColor: '#059669',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  walletTagText: {
    fontSize: 8,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 0.3,
  },
  walletBalanceText: {
    fontSize: 15,
    fontWeight: '900',
    color: '#047857',
    marginTop: 1,
  },
  menuScroll: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 20,
  },
  sectionHeading: {
    fontSize: 10,
    fontWeight: '900',
    color: '#94a3b8',
    letterSpacing: 0.8,
    marginBottom: 8,
    marginTop: 6,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    marginTop: 6,
  },
  redBadge: {
    backgroundColor: '#e11d48',
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  redBadgeText: {
    fontSize: 8,
    fontWeight: '900',
    color: '#ffffff',
  },
  adminBadge: {
    backgroundColor: '#0284c7',
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  adminBadgeText: {
    fontSize: 8,
    fontWeight: '900',
    color: '#ffffff',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  menuItemText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
  },
  themeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: '#fdf2f4',
    borderWidth: 1,
    borderColor: '#fce7ea',
    marginBottom: 6,
  },
  themeIconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#fecdd3',
  },
  themeTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a',
    flex: 1,
  },
  themeSub: {
    fontSize: 10,
    fontWeight: '500',
    color: '#64748b',
    marginTop: 1,
  },
  cornerTagBadge: {
    backgroundColor: '#e11d48',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
    marginLeft: 6,
  },
  cornerTagText: {
    fontSize: 8,
    fontWeight: '900',
    color: '#ffffff',
  },
  customSectionBox: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 14,
    padding: 10,
    marginBottom: 8,
  },
  customSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 6,
  },
  customSectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0f172a',
  },
  secTagPill: {
    backgroundColor: '#e0e7ff',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  secTagPillText: {
    fontSize: 8,
    fontWeight: '800',
    color: '#4338ca',
  },
  customSectionSub: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 1,
  },
  secItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  secItemThumb: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#e2e8f0',
  },
  secItemTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1e293b',
  },
  secItemPrice: {
    fontSize: 10,
    fontWeight: '800',
    color: '#059669',
  },
  itemSmallCornerTag: {
    backgroundColor: '#e11d48',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
  },
  itemSmallCornerTagText: {
    fontSize: 7,
    fontWeight: '900',
    color: '#ffffff',
  },
  divider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginVertical: 10,
  },
  secondaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  secondaryItemText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
  },
  drawerFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    backgroundColor: '#f8fafc',
    borderBottomRightRadius: 28,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 14,
    paddingVertical: 12,
  },
  logoutText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#e11d48',
  },
  customCatDrawerImg: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
  },
});
