import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MainStackParamList, ListMember } from '../../types';
import { membersApi } from '../../services/api';

type Props = NativeStackScreenProps<MainStackParamList, 'ShareList'>;

const ShareListScreen: React.FC<Props> = ({ route }) => {
  const { listId } = route.params;
  const { t } = useTranslation();
  const [members, setMembers] = useState<ListMember[]>([]);
  const [email, setEmail] = useState('');
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
      await membersApi.addMember(listId, email.trim().toLowerCase());
      setEmail('');
      loadMembers();
      Alert.alert(t('common.success'), t('members.inviteMember'));
    } catch (err: any) {
      Alert.alert(t('common.error'), err.response?.data?.error || t('errors.genericError'));
    } finally {
      setAdding(false);
    }
  };

  const renderMember = ({ item }: { item: ListMember }) => (
    <View style={styles.memberRow}>
      <View style={styles.memberInfo}>
        <Text style={styles.memberEmail}>{item.email}</Text>
        {item.display_name && <Text style={styles.memberName}>{item.display_name}</Text>}
      </View>
      <Text style={styles.memberRole}>{t(`members.${item.role}`)}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.addSection}>
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
          <Text style={styles.addButtonText}>{t('members.add')}</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={members}
        renderItem={renderMember}
        keyExtractor={(item) => item.user_id}
        ListHeaderComponent={<Text style={styles.listHeader}>{t('members.members')}</Text>}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  addSection: { flexDirection: 'row', padding: 16, gap: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
  input: { flex: 1, backgroundColor: '#f5f5f5', borderRadius: 8, padding: 12, fontSize: 16 },
  addButton: { backgroundColor: '#4CAF50', borderRadius: 8, paddingHorizontal: 20, justifyContent: 'center' },
  addButtonDisabled: { opacity: 0.6 },
  addButtonText: { color: '#fff', fontWeight: 'bold' },
  listHeader: { fontSize: 14, fontWeight: 'bold', color: '#666', padding: 16, textTransform: 'uppercase' },
  memberRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  memberInfo: { flex: 1 },
  memberEmail: { fontSize: 16, color: '#333', marginBottom: 4 },
  memberName: { fontSize: 14, color: '#666' },
  memberRole: { fontSize: 12, color: '#666', backgroundColor: '#f0f0f0', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
});

export default ShareListScreen;
