import React, { useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  TouchableWithoutFeedback,
} from 'react-native';
import {
  AlertTriangle,
  LogOut,
  XCircle,
  CheckCircle2,
  Sparkles,
  Info,
  ShieldAlert,
  ArrowRight,
  RotateCcw,
} from 'lucide-react-native';

const { width } = Dimensions.get('window');

export type DialogType = 'exit' | 'logout' | 'danger' | 'success' | 'confirm' | 'info' | 'cancelled' | 'error' | 'warning';

interface CelebrationDialogProps {
  visible: boolean;
  type?: DialogType;
  badgeText?: string;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmButtonColor?: string;
  onConfirm: () => void;
  onCancel?: () => void;
}

// Ensure no ugly JSON or raw error objects ever reach the user interface
function sanitizeDisplayMessage(rawMessage: string): string {
  if (!rawMessage) {
    return 'Your transaction could not be completed. Please try again.';
  }
  const str = String(rawMessage).trim();
  if (
    str.startsWith('{') ||
    str.startsWith('[') ||
    str.includes('BAD_REQUEST_ERROR') ||
    str.includes('payment_error') ||
    str.includes('payment_authentication') ||
    str.includes('"code":') ||
    str === 'undefined'
  ) {
    return 'The payment was cancelled or could not be completed. No money was deducted from your account. You can complete your celebration pass whenever you are ready.';
  }
  return str;
}

export default function CelebrationDialog({
  visible,
  type = 'confirm',
  badgeText,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmButtonColor,
  onConfirm,
  onCancel,
}: CelebrationDialogProps) {
  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 6,
          tension: 65,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      scaleAnim.setValue(0.85);
      fadeAnim.setValue(0);
    }
  }, [visible]);

  if (!visible) return null;

  // Icon & theme selection
  const getTheme = () => {
    switch (type) {
      case 'cancelled':
        return {
          icon: XCircle,
          iconColor: '#f43f5e',
          bgCircle: '#fff1f2',
          badgeText: 'PAYMENT CANCELLED',
          defaultConfirmColor: '#0f172a',
        };
      case 'error':
        return {
          icon: AlertTriangle,
          iconColor: '#e11d48',
          bgCircle: '#fff1f2',
          badgeText: 'PAYMENT NOTICE',
          defaultConfirmColor: '#e11d48',
        };
      case 'exit':
        return {
          icon: ShieldAlert,
          iconColor: '#e11d48',
          bgCircle: '#fff1f2',
          badgeText: 'EXIT APPLICATION',
          defaultConfirmColor: '#e11d48',
        };
      case 'logout':
        return {
          icon: LogOut,
          iconColor: '#e11d48',
          bgCircle: '#fff1f2',
          badgeText: 'SIGN OUT',
          defaultConfirmColor: '#e11d48',
        };
      case 'danger':
        return {
          icon: AlertTriangle,
          iconColor: '#dc2626',
          bgCircle: '#fef2f2',
          badgeText: 'WARNING',
          defaultConfirmColor: '#dc2626',
        };
      case 'success':
        return {
          icon: CheckCircle2,
          iconColor: '#10b981',
          bgCircle: '#ecfdf5',
          badgeText: 'SUCCESS',
          defaultConfirmColor: '#10b981',
        };
      case 'warning':
        return {
          icon: AlertTriangle,
          iconColor: '#f59e0b',
          bgCircle: '#fffbeb',
          badgeText: 'ATTENTION',
          defaultConfirmColor: '#f59e0b',
        };
      case 'info':
        return {
          icon: Info,
          iconColor: '#3b82f6',
          bgCircle: '#eff6ff',
          badgeText: 'NOTICE',
          defaultConfirmColor: '#3b82f6',
        };
      default:
        return {
          icon: Sparkles,
          iconColor: '#e11d48',
          bgCircle: '#fff1f2',
          badgeText: 'CELEBRATION OS',
          defaultConfirmColor: '#e11d48',
        };
    }
  };

  const theme = getTheme();
  const IconComp = theme.icon;
  const buttonColor = confirmButtonColor || theme.defaultConfirmColor;
  const activeBadgeText = badgeText || theme.badgeText;
  const cleanMessage = sanitizeDisplayMessage(message);

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onCancel}>
      <TouchableWithoutFeedback onPress={onCancel}>
        <View style={styles.backdrop}>
          <TouchableWithoutFeedback>
            <Animated.View
              style={[
                styles.dialogCard,
                {
                  opacity: fadeAnim,
                  transform: [{ scale: scaleAnim }],
                },
              ]}
            >
              {/* Header Badge with glowing dot */}
              <View style={styles.topBadgeContainer}>
                <View style={[styles.badgePill, { backgroundColor: theme.bgCircle, borderColor: theme.iconColor + '25' }]}>
                  <View style={[styles.dotIndicator, { backgroundColor: theme.iconColor }]} />
                  <Text style={[styles.badgeText, { color: theme.iconColor }]}>
                    {activeBadgeText}
                  </Text>
                </View>
              </View>

              {/* Icon Container with glowing aura & layered rings */}
              <View style={styles.iconCenter}>
                <View style={[styles.iconOuterRing, { borderColor: theme.iconColor + '20', backgroundColor: theme.bgCircle + '40' }]}>
                  <View style={[styles.iconInner, { backgroundColor: theme.bgCircle }]}>
                    <IconComp size={32} color={theme.iconColor} strokeWidth={2.4} />
                  </View>
                </View>
              </View>

              {/* Title & Message */}
              <Text style={styles.title}>{title}</Text>
              <Text style={styles.message}>{cleanMessage}</Text>

              {/* Action Buttons Row */}
              <View style={styles.actionsRow}>
                {cancelText ? (
                  <TouchableOpacity
                    style={styles.cancelBtn}
                    onPress={onCancel}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.cancelText}>{cancelText}</Text>
                  </TouchableOpacity>
                ) : null}

                <TouchableOpacity
                  style={[styles.confirmBtn, { backgroundColor: buttonColor }]}
                  onPress={onConfirm}
                  activeOpacity={0.88}
                >
                  <Text style={styles.confirmText}>{confirmText}</Text>
                  <ArrowRight size={16} color="#ffffff" style={{ marginLeft: 6 }} />
                </TouchableOpacity>
              </View>
            </Animated.View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(7, 10, 19, 0.78)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  dialogCard: {
    width: width * 0.88,
    maxWidth: 390,
    backgroundColor: '#ffffff',
    borderRadius: 32,
    padding: 24,
    paddingTop: 22,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.28,
    shadowRadius: 36,
    elevation: 28,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  topBadgeContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 6,
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 24,
    borderWidth: 1,
    gap: 6,
  },
  dotIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  badgeText: {
    fontSize: 10.5,
    fontWeight: '900',
    letterSpacing: 1.1,
  },
  iconCenter: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 14,
  },
  iconOuterRing: {
    width: 82,
    height: 82,
    borderRadius: 41,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0f172a',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.4,
  },
  message: {
    fontSize: 13.5,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 8,
    marginBottom: 24,
  },
  actionsRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 10,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 18,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#475569',
  },
  confirmBtn: {
    flex: 1.3,
    paddingVertical: 14,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 10,
    elevation: 5,
  },
  confirmText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 0.2,
  },
});
