import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MainStackParamList } from '../../types';
import { useAppDispatch, useAppSelector } from '../../store';
import {
  fetchListsStart,
  fetchListsSuccess,
  fetchListsFailure,
  createListSuccess,
  refreshListsStart,
} from '../../store/slices/listsSlice';
import { listsApi } from '../../services/api';

type Props = NativeStackScreenProps<MainStackParamList, 'Lists'>;

const ListsScreen: React.FC<Props> = ({ navigation }) => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const { lists, loading, refreshing } = useAppSelector((state) => state.lists);
  const user = useAppSelector((state) => state.auth.user);

  const [modalVisible, setModalVisible] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadLists();
  }, []);

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity onPress={() => navigation.navigate('Settings')}>
          <Text style={styles.headerButton}>⚙️</Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  const loadLists = async () => {
    dispatch(fetchListsStart());
    try {
      const data = await listsApi.getLists();
      dispatch(fetchListsSuccess(data));
    } catch (err: any) {
      dispatch(fetchListsFailure(err.response?.data?.error || t('errors.genericError')));
    }
  };

  const handleRefresh = () => {
    dispatch(refreshListsStart());
    loadLists();
  };

  const handleCreateList = async () => {
    if (!newListName.trim()) {
      Alert.alert(t('common.error'), t('errors.requiredField'));
      return;
    }

    setCreating(true);
    try {
      const list = await listsApi.createList(newListName.trim());
      dispatch(createListSuccess(list));
      setModalVisible(false);
      setNewListName('');
    } catch (err: any) {
      Alert.alert(t('common.error'), err.response?.data?.error || t('errors.genericError'));
    } finally {
      setCreating(false);
    }
  };

  const renderListItem = ({ item }: any) => (
    <TouchableOpacity
      style={styles.listCard}
      onPress={() => navigation.navigate('ListDetail', { listId: item.id, listName: item.name })}
    >
      <View style={styles.listHeader}>
        <Text style={styles.listName}>{item.name}</Text>
        <Text style={styles.listRole}>
          {item.user_role === 'owner' ? '👑' : '👤'} {t(`lists.${item.user_role}`)}
        </Text>
      </View>
      <View style={styles.listStats}>
        <Text style={styles.listStat}>
          {t('lists.activeItems', { count: item.active_items_count })}
        </Text>
        {item.member_count > 1 && (
          <Text style={styles.listStat}>👥 {item.member_count}</Text>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={lists}
        renderItem={renderListItem}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={['#4CAF50']} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📝</Text>
            <Text style={styles.emptyText}>{t('lists.emptyState')}</Text>
            <Text style={styles.emptySubtext}>{t('lists.emptyStateDesc')}</Text>
          </View>
        }
        contentContainerStyle={lists.length === 0 ? styles.emptyContainer : styles.listContent}
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => setModalVisible(true)}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t('lists.createList')}</Text>
            <TextInput
              style={styles.modalInput}
              placeholder={t('lists.enterListName')}
              value={newListName}
              onChangeText={setNewListName}
              autoFocus
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => {
                  setModalVisible(false);
                  setNewListName('');
                }}
              >
                <Text style={styles.modalButtonTextCancel}>{t('common.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCreate]}
                onPress={handleCreateList}
                disabled={creating}
              >
                <Text style={styles.modalButtonText}>
                  {creating ? t('common.loading') : t('lists.create')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  listContent: { padding: 16 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyState: { alignItems: 'center', padding: 40 },
  emptyIcon: { fontSize: 64, marginBottom: 16 },
  emptyText: { fontSize: 20, fontWeight: 'bold', color: '#333', marginBottom: 8 },
  emptySubtext: { fontSize: 14, color: '#666', textAlign: 'center' },
  listCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
  listHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  listName: { fontSize: 18, fontWeight: 'bold', color: '#333', flex: 1 },
  listRole: { fontSize: 12, color: '#666', backgroundColor: '#f0f0f0', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  listStats: { flexDirection: 'row', gap: 16 },
  listStat: { fontSize: 14, color: '#666' },
  fab: { position: 'absolute', right: 20, bottom: 20, width: 60, height: 60, borderRadius: 30, backgroundColor: '#4CAF50', justifyContent: 'center', alignItems: 'center', elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4 },
  fabText: { fontSize: 32, color: '#fff', fontWeight: 'bold' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '85%', backgroundColor: '#fff', borderRadius: 12, padding: 20 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' },
  modalInput: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, fontSize: 16, marginBottom: 16 },
  modalButtons: { flexDirection: 'row', gap: 12 },
  modalButton: { flex: 1, padding: 12, borderRadius: 8, alignItems: 'center' },
  modalButtonCancel: { backgroundColor: '#f0f0f0' },
  modalButtonCreate: { backgroundColor: '#4CAF50' },
  modalButtonText: { color: '#fff', fontWeight: 'bold' },
  modalButtonTextCancel: { color: '#333', fontWeight: 'bold' },
  headerButton: { fontSize: 24, marginRight: 16 },
});

export default ListsScreen;
