import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  X,
  Check,
  Sparkles,
} from 'lucide-react-native';

const { width } = Dimensions.get('window');

interface CelebrationDatePickerModalProps {
  visible: boolean;
  selectedDate: string;
  onSelectDate: (dateStr: string) => void;
  onClose: () => void;
  minDate?: string;
  availableDates?: string[];
  title?: string;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const WEEK_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function CelebrationDatePickerModal({
  visible,
  selectedDate,
  onSelectDate,
  onClose,
  minDate,
  availableDates,
  title = 'Pick Celebration Date',
}: CelebrationDatePickerModalProps) {
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const effectiveMinDate = minDate || todayStr;

  const initialDate = selectedDate && selectedDate.includes('-')
    ? new Date(selectedDate)
    : new Date();

  const [viewYear, setViewYear] = useState(
    isNaN(initialDate.getFullYear()) ? today.getFullYear() : initialDate.getFullYear()
  );
  const [viewMonth, setViewMonth] = useState(
    isNaN(initialDate.getMonth()) ? today.getMonth() : initialDate.getMonth()
  );
  const [tempSelectedDate, setTempSelectedDate] = useState<string>(selectedDate || todayStr);

  useEffect(() => {
    if (visible) {
      const active = selectedDate && selectedDate.includes('-') ? new Date(selectedDate) : new Date();
      if (!isNaN(active.getTime())) {
        setViewYear(active.getFullYear());
        setViewMonth(active.getMonth());
        setTempSelectedDate(selectedDate || todayStr);
      }
    }
  }, [visible, selectedDate]);

  // Prev / Next month handlers
  const canGoPrev = () => {
    const minD = new Date(effectiveMinDate);
    const prevMonthDate = new Date(viewYear, viewMonth - 1, 1);
    const minMonthDate = new Date(minD.getFullYear(), minD.getMonth(), 1);
    return prevMonthDate >= minMonthDate;
  };

  const handlePrevMonth = () => {
    if (!canGoPrev()) return;
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  // Calendar Day Grid calculations
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay(); // 0 = Sun
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

  // Days list
  const calendarCells = [];
  // 1. Trailing days from prev month
  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    calendarCells.push({
      day: daysInPrevMonth - i,
      month: viewMonth - 1,
      year: viewYear,
      isCurrentMonth: false,
      dateStr: '',
      disabled: true,
    });
  }
  // 2. Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const isPast = dateStr < effectiveMinDate;
    const isRestricted = Array.isArray(availableDates) && availableDates.length > 0 && !availableDates.includes(dateStr);
    calendarCells.push({
      day: d,
      month: viewMonth,
      year: viewYear,
      isCurrentMonth: true,
      dateStr,
      disabled: isPast || isRestricted,
      isToday: dateStr === todayStr,
      isSelected: dateStr === tempSelectedDate,
    });
  }
  // 3. Trailing days to round to multiple of 7
  const remainder = calendarCells.length % 7;
  if (remainder > 0) {
    const needed = 7 - remainder;
    for (let i = 1; i <= needed; i++) {
      calendarCells.push({
        day: i,
        month: viewMonth + 1,
        year: viewYear,
        isCurrentMonth: false,
        dateStr: '',
        disabled: true,
      });
    }
  }

  // Quick preset dates
  const handlePresetSelect = (daysOffset: number) => {
    const target = new Date();
    target.setDate(target.getDate() + daysOffset);
    const iso = target.toISOString().split('T')[0];
    setTempSelectedDate(iso);
    setViewYear(target.getFullYear());
    setViewMonth(target.getMonth());
  };

  const handleNextWeekend = () => {
    const d = new Date();
    const day = d.getDay(); // 0 = Sun, 6 = Sat
    const daysUntilSaturday = (6 - day + 7) % 7 || 7;
    d.setDate(d.getDate() + daysUntilSaturday);
    const iso = d.toISOString().split('T')[0];
    setTempSelectedDate(iso);
    setViewYear(d.getFullYear());
    setViewMonth(d.getMonth());
  };

  const handleConfirm = () => {
    if (tempSelectedDate) {
      onSelectDate(tempSelectedDate);
    }
    onClose();
  };

  // Formatted human readable date
  const getFormattedSelected = () => {
    if (!tempSelectedDate) return 'No Date Selected';
    try {
      const [y, m, d] = tempSelectedDate.split('-').map(Number);
      const dateObj = new Date(y, m - 1, d);
      return dateObj.toLocaleDateString('en-IN', {
        weekday: 'long',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return tempSelectedDate;
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.headerRow}>
            <View style={styles.headerLeft}>
              <View style={styles.calendarIconCircle}>
                <CalendarIcon size={18} color="#e11d48" />
              </View>
              <View>
                <Text style={styles.headerTitle}>{title}</Text>
                <Text style={styles.headerSub}>Select event date for venue & catering</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <X size={20} color="#64748b" />
            </TouchableOpacity>
          </View>

          {/* Quick Preset Chips */}
          <View style={styles.presetsWrapper}>
            <Text style={styles.presetsLabel}>QUICK PICKS</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.presetsScroll}>
              <TouchableOpacity
                style={styles.presetChip}
                onPress={() => handlePresetSelect(1)}
                activeOpacity={0.7}
              >
                <Text style={styles.presetChipText}>Tomorrow</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.presetChip}
                onPress={handleNextWeekend}
                activeOpacity={0.7}
              >
                <Text style={styles.presetChipText}>This Weekend 🌟</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.presetChip}
                onPress={() => handlePresetSelect(7)}
                activeOpacity={0.7}
              >
                <Text style={styles.presetChipText}>In 1 Week</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.presetChip}
                onPress={() => handlePresetSelect(30)}
                activeOpacity={0.7}
              >
                <Text style={styles.presetChipText}>In 1 Month</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.presetChip}
                onPress={() => handlePresetSelect(60)}
                activeOpacity={0.7}
              >
                <Text style={styles.presetChipText}>In 2 Months</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>

          {/* Month / Year Navigator */}
          <View style={styles.monthNavRow}>
            <TouchableOpacity
              onPress={handlePrevMonth}
              disabled={!canGoPrev()}
              style={[styles.navBtn, !canGoPrev() && styles.navBtnDisabled]}
              activeOpacity={0.7}
            >
              <ChevronLeft size={20} color={canGoPrev() ? '#0f172a' : '#cbd5e1'} />
            </TouchableOpacity>

            <View style={styles.monthTitleWrap}>
              <Text style={styles.monthTitle}>
                {MONTH_NAMES[viewMonth]} <Text style={styles.yearText}>{viewYear}</Text>
              </Text>
            </View>

            <TouchableOpacity onPress={handleNextMonth} style={styles.navBtn} activeOpacity={0.7}>
              <ChevronRight size={20} color="#0f172a" />
            </TouchableOpacity>
          </View>

          {/* Weekday Row */}
          <View style={styles.weekdaysRow}>
            {WEEK_DAYS.map((w, idx) => (
              <Text
                key={w}
                style={[
                  styles.weekdayLabel,
                  (idx === 0 || idx === 6) && styles.weekendLabel,
                ]}
              >
                {w}
              </Text>
            ))}
          </View>

          {/* Calendar Grid */}
          <View style={styles.daysGrid}>
            {calendarCells.map((cell, idx) => {
              if (!cell.isCurrentMonth) {
                return (
                  <View key={idx} style={styles.dayCellEmpty}>
                    <Text style={styles.dayCellEmptyText}>{cell.day}</Text>
                  </View>
                );
              }

              return (
                <TouchableOpacity
                  key={idx}
                  style={[
                    styles.dayCell,
                    cell.isSelected && styles.dayCellSelected,
                    cell.isToday && !cell.isSelected && styles.dayCellToday,
                    cell.disabled && styles.dayCellDisabled,
                  ]}
                  disabled={cell.disabled}
                  onPress={() => setTempSelectedDate(cell.dateStr)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.dayText,
                      cell.isSelected && styles.dayTextSelected,
                      cell.isToday && !cell.isSelected && styles.dayTextToday,
                      cell.disabled && styles.dayTextDisabled,
                    ]}
                  >
                    {cell.day}
                  </Text>
                  {cell.isToday && !cell.isSelected && (
                    <View style={styles.todayDot} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Selected Date Summary Card */}
          <View style={styles.selectionSummaryCard}>
            <View style={{ flex: 1 }}>
              <Text style={styles.selectionSummaryLabel}>CHOSEN CELEBRATION DATE</Text>
              <Text style={styles.selectionSummaryDate}>{getFormattedSelected()}</Text>
            </View>
            <View style={styles.verifiedCheckBadge}>
              <Check size={14} color="#ffffff" strokeWidth={3} />
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtonsRow}>
            <TouchableOpacity onPress={onClose} style={styles.cancelBtn} activeOpacity={0.7}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleConfirm} style={styles.confirmBtn} activeOpacity={0.9}>
              <Sparkles size={16} color="#ffffff" />
              <Text style={styles.confirmBtnText}>Confirm Date</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContainer: {
    width: Math.min(width - 32, 420),
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  calendarIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#ffe4e6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  headerSub: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  presetsWrapper: {
    marginBottom: 14,
  },
  presetsLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94a3b8',
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  presetsScroll: {
    flexDirection: 'row',
    gap: 8,
  },
  presetChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  presetChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },
  monthNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#f1f5f9',
    marginBottom: 10,
  },
  navBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navBtnDisabled: {
    opacity: 0.35,
  },
  monthTitleWrap: {
    alignItems: 'center',
  },
  monthTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
  },
  yearText: {
    color: '#e11d48',
    fontWeight: '900',
  },
  weekdaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    marginBottom: 4,
  },
  weekdayLabel: {
    width: `${100 / 7}%`,
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
  },
  weekendLabel: {
    color: '#e11d48',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  dayCell: {
    width: `${100 / 7}%`,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 2,
    borderRadius: 12,
  },
  dayCellEmpty: {
    width: `${100 / 7}%`,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 2,
    opacity: 0.2,
  },
  dayCellEmptyText: {
    fontSize: 12,
    color: '#94a3b8',
  },
  dayCellToday: {
    borderWidth: 1.5,
    borderColor: '#e11d48',
  },
  dayCellSelected: {
    backgroundColor: '#e11d48',
    shadowColor: '#e11d48',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  dayCellDisabled: {
    opacity: 0.25,
  },
  dayText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1e293b',
  },
  dayTextToday: {
    color: '#e11d48',
    fontWeight: '800',
  },
  dayTextSelected: {
    color: '#ffffff',
    fontWeight: '900',
  },
  dayTextDisabled: {
    color: '#94a3b8',
  },
  todayDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#e11d48',
    position: 'absolute',
    bottom: 3,
  },
  selectionSummaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff1f2',
    borderWidth: 1,
    borderColor: '#fecdd3',
    borderRadius: 14,
    padding: 12,
    marginTop: 12,
    marginBottom: 16,
  },
  selectionSummaryLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#be123c',
    letterSpacing: 0.5,
  },
  selectionSummaryDate: {
    fontSize: 13,
    fontWeight: '800',
    color: '#881337',
    marginTop: 2,
  },
  verifiedCheckBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#e11d48',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
  confirmBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: '#e11d48',
    shadowColor: '#e11d48',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  confirmBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#ffffff',
  },
});

