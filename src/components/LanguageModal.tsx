import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors, fonts, radius } from '../theme';
import { LanguageCode } from '../i18n';

export default function LanguageModal({
  visible,
  currentLanguage,
  onSelect,
  onClose,
}: {
  visible: boolean;
  currentLanguage: LanguageCode;
  onSelect: (lang: LanguageCode) => void;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const options: { code: LanguageCode; label: string }[] = [
    { code: 'en', label: t('profile.languageEnglish') },
    { code: 'ar', label: t('profile.languageArabic') },
  ];

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} style={styles.card} onPress={() => {}}>
          <Text style={styles.title}>{t('profile.chooseLanguage')}</Text>
          <View style={{ gap: 9, marginTop: 18 }}>
            {options.map((opt) => {
              const isSel = opt.code === currentLanguage;
              return (
                <TouchableOpacity
                  key={opt.code}
                  style={[styles.row, isSel && styles.rowActive]}
                  onPress={() => onSelect(opt.code)}
                >
                  <View style={[styles.radio, isSel && styles.radioActive]}>
                    {isSel && <View style={styles.radioDot} />}
                  </View>
                  <Text style={styles.rowLabel}>{opt.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
            <Text style={styles.cancelText}>{t('profile.cancel')}</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center', padding: 28 },
  card: {
    width: '100%', maxWidth: 340, backgroundColor: colors.surfaceAlt, borderWidth: 1, borderColor: colors.borderSoft,
    borderRadius: radius.xl, padding: 20,
  },
  title: { fontFamily: fonts.bold, fontSize: 17, color: colors.text },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 14,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md,
  },
  rowActive: { borderColor: colors.borderGold, backgroundColor: colors.surfaceGoldTint },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: 'rgba(255,255,255,0.2)' },
  radioActive: { borderColor: colors.gold, alignItems: 'center', justifyContent: 'center' },
  radioDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: '#e0c674' },
  rowLabel: { fontFamily: fonts.semibold, fontSize: 15, color: colors.text },
  cancelBtn: { marginTop: 16, alignItems: 'center', paddingVertical: 10 },
  cancelText: { fontFamily: fonts.semibold, fontSize: 14, color: colors.textFaint },
});
