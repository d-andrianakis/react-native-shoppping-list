import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, Alert, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MainStackParamList, ListMember } from '../../types';
import { membersApi } from '../../services/api';
import { useAppSelector } from '../../store';

type Props = NativeStackScreenProps<MainStackParamList, 'ShareList'>;

const ShareListScreen: React.FC<Props> = ({ route, navigation }) => {
  const { listId } = route.params;
  const { t } = useTranslation();
  const currentUser = useAppSelector((state) => state.auth.user);
  const list = useAppSelector((state) => state.lists.lists.find(l => l.id === listId));

  const isOwner = list?.user_role === 'owner';

  const [members, setMembers] = useState<ListMember[]>([]);
  const [email, setEmail] = useState('');
  const [selectedRole, setSelectedRole] = useState<'editor' | 'viewer'>('editor');
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    loadMembers();
  }, []);

  const loadMembers = async () => {
    try {
      const data = await membersApi.getMembers(listId);
      setMembers(data);
    } catch (err) {
      Alert.alert(t('common.error'), t('errors.genericError'));
    }
  };

  const handleAddMember = async () => {
    if (!email.trim()) return;
    setAdding(true);
    try {
      await membersApi.addMember(listId, email.trim().toLowerCase(), selectedRole);
      setEmail('');
      setSelectedRole('editor');
      loadMembers();
      Alert.alert(t('common.success'), t('members.inviteMember') || 'Member added successfully');
    } catch (err: any) {
      Alert.alert(t('common.error'), err.response?.data?.error || t('errors.genericError'));
    } finally {
      setAdding(false);
    }
  };

  const handleRemoveMember = (userId: string, memberName: string) => {
    Alert.alert(
      t('members.removeMember') || 'Remove Member',
      t('members.confirmRemove') || `Remove ${memberName} from this list?`,
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.remove') || 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await membersApi.removeMember(listId, userId);
              loadMembers();
            } catch (err: any) {
              Alert.alert(t('common.error'), err.response?.data?.error || t('errors.genericError'));
            }
          }
        }
      ]
    );
  };

  const handleChangeRole = (userId: string, currentRole: string, memberName: string) => {
    const newRole: 'owner' | 'editor' | 'viewer' = currentRole === 'editor' ? 'viewer' : 'editor';

    Alert.alert(
      t('members.changeRole') || 'Change Role',
      `Change ${memberName}'s role to ${newRole}?`,
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.change') || 'Change',
          onPress: async () => {
            try {
              await membersApi.updateMemberRole(listId, userId, newRole);
              loadMembers();
            } catch (err: any) {
              Alert.alert(t('common.error'), err.response?.data?.error || t('errors.genericError'));
            }
          }
        }
      ]
    );
  };

  const handleLeaveList = () => {
    Alert.alert(
      t('members.leaveList') || 'Leave List',
      t('members.confirmLeave') || 'Are you sure you want to leave this list?',
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('members.leave') || 'Leave',
          style: 'destructive',
          onPress: async () => {
            try {
              await membersApi.leaveList(listId);
              navigation.goBack();
              navigation.goBack(); // Go back to lists screen
            } catch (err: any) {
              Alert.alert(t('common.error'), err.response?.data?.error || t('errors.genericError'));
            }
          }
        }
      ]
    );
  };

  const renderMember = ({ item }: { item: ListMember }) => {
    const isCurrentUser = item.user_id === currentUser?.id;
    const canManage = isOwner && !isCurrentUser && item.role !== 'owner';

    return (
      <View style={styles.memberRow}>
        <View style={styles.memberInfo}>
          <Text style={styles.memberEmail}>
            {item.email} {isCurrentUser && '(You)'}
          </Text>
          {item.display_name && <Text style={styles.memberName}>{item.display_name}</Text>}
        </View>

        {canManage && (
          <View style={styles.memberActions}>
            {/* Role Change Button */}
            <TouchableOpacity
              style={styles.roleButton}
              onPress={() => handleChangeRole(item.user_id, item.role, item.email)}
            >
              <Text style={styles.memberRole}>{t(`members.${item.role}`)}</Text>
            </TouchableOpacity>

            {/* Remove Button */}
            <TouchableOpacity
              style={styles.removeButton}
              onPress={() => handleRemoveMember(item.user_id, item.email)}
            >
              <Text style={styles.removeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>
        )}

        {!canManage && (
          <Text style={styles.memberRole}>
            {t(`members.${item.role}`)} {item.role === 'owner' && '👑'}
          </Text>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Add member section - only for owners */}
      {isOwner && (
        <View style={styles.addSection}>
          {/* Role selector */}
          <View style={styles.roleSelector}>
            <Text style={styles.roleSelectorLabel}>{t('members.role') || 'Role'}:</Text>
            <TouchableOpacity
              style={[styles.roleOption, selectedRole === 'editor' && styles.roleOptionActive]}
              onPress={() => setSelectedRole('editor')}
            >
              <Text style={[styles.roleOptionText, selectedRole === 'editor' && styles.roleOptionTextActive]}>
                {t('members.editor') || 'Editor'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.roleOption, selectedRole === 'viewer' && styles.roleOptionActive]}
              onPress={() => setSelectedRole('viewer')}
            >
              <Text style={[styles.roleOptionText, selectedRole === 'viewer' && styles.roleOptionTextActive]}>
                {t('members.viewer') || 'Viewer'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Email input and add button */}
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              placeholder={t('members.enterEmail')}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity
              style={[styles.addButton, adding && styles.addButtonDisabled]}
              onPress={handleAddMember}
              disabled={adding}
            >
              <Text style={styles.addButtonText}>{t('members.add') || 'Add'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Members list */}
      <FlatList
        data={members}
        renderItem={renderMember}
        keyExtractor={(item) => item.user_id}
        ListHeaderComponent={
          <Text style={styles.listHeader}>{t('members.members') || 'Members'}</Text>
        }
      />

      {/* Leave list button for non-owners */}
      {!isOwner && (
        <TouchableOpacity style={styles.leaveButton} onPress={handleLeaveList}>
          <Text style={styles.leaveButtonText}>
            {t('members.leaveList') || 'Leave List'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  addSection: { padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee', gap: 12 },
  roleSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  roleSelectorLabel: { fontSize: 14, fontWeight: 'bold', color: '#333' },
  roleOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
  },
  roleOptionActive: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  roleOptionText: { fontSize: 14, color: '#666' },
  roleOptionTextActive: { color: '#fff', fontWeight: 'bold' },
  inputRow: { flexDirection: 'row', gap: 12 },
  input: { flex: 1, backgroundColor: '#f5f5f5', borderRadius: 8, padding: 12, fontSize: 16 },
  addButton: { backgroundColor: '#4CAF50', borderRadius: 8, paddingHorizontal: 20, justifyContent: 'center' },
  addButtonDisabled: { opacity: 0.6 },
  addButtonText: { color: '#fff', fontWeight: 'bold' },
  listHeader: { fontSize: 14, fontWeight: 'bold', color: '#666', padding: 16, textTransform: 'uppercase' },
  memberRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  memberInfo: { flex: 1 },
  memberEmail: { fontSize: 16, color: '#333', marginBottom: 4 },
  memberName: { fontSize: 14, color: '#666' },
  memberActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  roleButton: { },
  memberRole: {
    fontSize: 12,
    color: '#666',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  removeButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#f44336',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  leaveButton: {
    margin: 16,
    backgroundColor: '#f44336',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  leaveButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});

export default ShareListScreen;
