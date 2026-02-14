import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  Modal,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAppDispatch, useAppSelector } from '../../store';
import { logout, updateUser } from '../../store/slices/authSlice';
import { setLanguage } from '../../store/slices/uiSlice';
import { changeLanguage } from '../../i18n';
import { clearStoredTokens } from '../../services/api/client';
import { authApi } from '../../services/api';

const SettingsScreen: React.FC = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const currentLanguage = useAppSelector((state) => state.ui.language);

  // Profile editing state
  const [editProfileVisible, setEditProfileVisible] = useState(false);
  const [newDisplayName, setNewDisplayName] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  // Password change state
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

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

  const openEditProfile = () => {
    setNewDisplayName(user?.displayName || '');
    setEditProfileVisible(true);
  };

  const handleUpdateProfile = async () => {
    setSavingProfile(true);
    try {
      const updatedUser = await authApi.updateProfile({
        displayName: newDisplayName.trim() || undefined,
      });
      dispatch(updateUser(updatedUser));
      setEditProfileVisible(false);
      Alert.alert(t('common.success'), t('settings.profileUpdated') || 'Profile updated successfully');
    } catch (err: any) {
      Alert.alert(t('common.error'), err.response?.data?.error || t('errors.genericError'));
    } finally {
      setSavingProfile(false);
    }
  };

  const openChangePassword = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setPasswordModalVisible(true);
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert(t('common.error'), t('errors.requiredField'));
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert(t('common.error'), t('errors.passwordsDoNotMatch'));
      return;
    }

    if (newPassword.length < 8) {
      Alert.alert(t('common.error'), t('errors.passwordTooShort'));
      return;
    }

    setSavingPassword(true);
    try {
      await authApi.changePassword(currentPassword, newPassword);
      setPasswordModalVisible(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      Alert.alert(t('common.success'), t('settings.passwordChanged') || 'Password changed successfully');
    } catch (err: any) {
      Alert.alert(
        t('common.error'),
        err.response?.data?.error || t('errors.genericError')
      );
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* Profile Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('settings.profile')}</Text>
        <View style={styles.card}>
          <Text style={styles.label}>{t('auth.email')}</Text>
          <Text style={styles.value}>{user?.email}</Text>

          <Text style={[styles.label, styles.labelMargin]}>{t('auth.displayName')}</Text>
          <Text style={styles.value}>{user?.displayName || '—'}</Text>

          <TouchableOpacity style={styles.editButton} onPress={openEditProfile}>
            <Text style={styles.editButtonText}>{t('common.edit')} {t('settings.profile')}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Security Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('settings.security') || 'Security'}</Text>
        <View style={styles.card}>
          <TouchableOpacity style={styles.settingsRow} onPress={openChangePassword}>
            <Text style={styles.settingsRowText}>{t('settings.changePassword')}</Text>
            <Text style={styles.settingsRowArrow}>›</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Language Section */}
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

      {/* Edit Profile Modal */}
      <Modal visible={editProfileVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t('common.edit')} {t('settings.profile')}</Text>

            <TextInput
              style={styles.modalInput}
              placeholder={t('auth.displayName')}
              value={newDisplayName}
              onChangeText={setNewDisplayName}
              autoCapitalize="words"
              autoFocus
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => setEditProfileVisible(false)}
              >
                <Text style={styles.modalButtonTextCancel}>{t('common.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSave]}
                onPress={handleUpdateProfile}
                disabled={savingProfile}
              >
                {savingProfile ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.modalButtonText}>{t('common.save')}</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Change Password Modal */}
      <Modal visible={passwordModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t('settings.changePassword')}</Text>

            <TextInput
              style={styles.modalInput}
              placeholder={t('settings.currentPassword')}
              value={currentPassword}
              onChangeText={setCurrentPassword}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
            />

            <TextInput
              style={styles.modalInput}
              placeholder={t('settings.newPassword')}
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
            />

            <TextInput
              style={styles.modalInput}
              placeholder={t('settings.confirmNewPassword')}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => setPasswordModalVisible(false)}
              >
                <Text style={styles.modalButtonTextCancel}>{t('common.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSave]}
                onPress={handleChangePassword}
                disabled={savingPassword}
              >
                {savingPassword ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.modalButtonText}>{t('settings.updatePassword')}</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  editButton: {
    marginTop: 16,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    alignItems: 'center',
  },
  editButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  settingsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  settingsRowText: { fontSize: 16, color: '#333' },
  settingsRowArrow: { fontSize: 24, color: '#ccc' },
  languageOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  languageText: { fontSize: 16, color: '#333' },
  checkmark: { fontSize: 20, color: '#4CAF50', fontWeight: 'bold' },
  logoutButton: {
    marginTop: 30,
    marginHorizontal: 16,
    backgroundColor: '#f44336',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  logoutText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  version: { textAlign: 'center', color: '#999', marginTop: 30, marginBottom: 20 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: { width: '85%', backgroundColor: '#fff', borderRadius: 12, padding: 20 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' },
  modalInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
  },
  modalButtons: { flexDirection: 'row', gap: 12, marginTop: 8 },
  modalButton: { flex: 1, padding: 12, borderRadius: 8, alignItems: 'center' },
  modalButtonCancel: { backgroundColor: '#f0f0f0' },
  modalButtonSave: { backgroundColor: '#4CAF50' },
  modalButtonText: { color: '#fff', fontWeight: 'bold' },
  modalButtonTextCancel: { color: '#333', fontWeight: 'bold' },
});

export default SettingsScreen;
