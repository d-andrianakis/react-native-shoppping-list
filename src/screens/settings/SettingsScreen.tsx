import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAppDispatch, useAppSelector } from '../../store';
import { logout } from '../../store/slices/authSlice';
import { setLanguage } from '../../store/slices/uiSlice';
import { changeLanguage } from '../../i18n';
import { clearStoredTokens } from '../../services/api/client';

const SettingsScreen: React.FC = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const currentLanguage = useAppSelector((state) => state.ui.language);

  const handleLanguageChange = async (lang: 'en' | 'el' | 'de') => {
    await changeLanguage(lang);
    dispatch(setLanguage(lang));
  };

  const handleLogout = () => {
    Alert.alert(
      t('settings.logout'),
      t('settings.confirmLogout'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('settings.logout'),
          style: 'destructive',
          onPress: async () => {
            await clearStoredTokens();
            dispatch(logout());
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('settings.profile')}</Text>
        <View style={styles.card}>
          <Text style={styles.label}>{t('auth.email')}</Text>
          <Text style={styles.value}>{user?.email}</Text>
          {user?.displayName && (
            <>
              <Text style={[styles.label, styles.labelMargin]}>{t('auth.displayName')}</Text>
              <Text style={styles.value}>{user.displayName}</Text>
            </>
          )}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('settings.language')}</Text>
        <View style={styles.card}>
          {[
            { code: 'en', label: t('settings.english') },
            { code: 'el', label: t('settings.greek') },
            { code: 'de', label: t('settings.german') },
          ].map((lang) => (
            <TouchableOpacity
              key={lang.code}
              style={styles.languageOption}
              onPress={() => handleLanguageChange(lang.code as 'en' | 'el' | 'de')}
            >
              <Text style={styles.languageText}>{lang.label}</Text>
              {currentLanguage === lang.code && <Text style={styles.checkmark}>✓</Text>}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>{t('settings.logout')}</Text>
      </TouchableOpacity>

      <Text style={styles.version}>{t('settings.version')}: 1.0.0</Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  section: { marginTop: 20, paddingHorizontal: 16 },
  sectionTitle: { fontSize: 14, fontWeight: 'bold', color: '#666', marginBottom: 8, textTransform: 'uppercase' },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16 },
  label: { fontSize: 12, color: '#666', marginBottom: 4 },
  labelMargin: { marginTop: 12 },
  value: { fontSize: 16, color: '#333' },
  languageOption: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  languageText: { fontSize: 16, color: '#333' },
  checkmark: { fontSize: 20, color: '#4CAF50', fontWeight: 'bold' },
  logoutButton: { marginTop: 30, marginHorizontal: 16, backgroundColor: '#f44336', borderRadius: 12, padding: 16, alignItems: 'center' },
  logoutText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  version: { textAlign: 'center', color: '#999', marginTop: 30, marginBottom: 20 },
});

export default SettingsScreen;
