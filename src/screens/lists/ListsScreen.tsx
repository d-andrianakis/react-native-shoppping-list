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
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MainStackParamList, ShoppingList } from '../../types';
import { useAppDispatch, useAppSelector } from '../../store';
import {
  fetchListsStart,
  fetchListsSuccess,
  fetchListsFailure,
  createListSuccess,
  updateListSuccess,
  deleteListSuccess,
  refreshListsStart,
} from '../../store/slices/listsSlice';
import { listsApi, membersApi } from '../../services/api';

type Props = NativeStackScreenProps<MainStackParamList, 'Lists'>;

const ListsScreen: React.FC<Props> = ({ navigation }) => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const { lists, loading, refreshing } = useAppSelector((state) => state.lists);
  const user = useAppSelector((state) => state.auth.user);

  const [modalVisible, setModalVisible] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [creating, setCreating] = useState(false);
  const [showArchived, setShowArchived] = useState(false);

  // Edit modal state
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingList, setEditingList] = useState<ShoppingList | null>(null);
  const [editListName, setEditListName] = useState('');

  useEffect(() => {
    loadLists();
  }, []);

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={styles.headerButtons}>
          <TouchableOpacity onPress={() => setShowArchived(!showArchived)}>
            <Text style={styles.headerButtonText}>
              {showArchived ? t('lists.hideArchived') || 'Hide Archived' : t('lists.showArchived') || 'Show Archived'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('Settings')}>
            <Text style={styles.headerButton}>⚙️</Text>
          </TouchableOpacity>
        </View>
      ),
    });
  }, [navigation, showArchived]);

  // Real-time polling when screen is focused
  useFocusEffect(
    React.useCallback(() => {
      const interval = setInterval(() => {
        loadLists(); // Poll every 15 seconds
      }, 15000);

      return () => clearInterval(interval);
    }, [])
  );

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

  const handleLongPress = (list: ShoppingList) => {
    const isOwner = list.user_role === 'owner';

    if (isOwner) {
      Alert.alert(
        list.name,
        t('lists.selectAction') || 'Select an action',
        [
          { text: t('lists.editName') || 'Edit Name', onPress: () => openEditModal(list) },
          {
            text: list.is_archived ? (t('lists.unarchive') || 'Unarchive') : (t('lists.archive') || 'Archive'),
            onPress: () => handleArchiveList(list.id, !list.is_archived)
          },
          {
            text: t('lists.share') || 'Share',
            onPress: () => navigation.navigate('ShareList', { listId: list.id })
          },
          {
            text: t('lists.deleteList') || 'Delete List',
            style: 'destructive',
            onPress: () => handleDeleteList(list.id)
          },
          { text: t('common.cancel'), style: 'cancel' }
        ]
      );
    } else {
      Alert.alert(
        list.name,
        t('lists.selectAction') || 'Select an action',
        [
          {
            text: t('members.leaveList') || 'Leave List',
            style: 'destructive',
            onPress: () => handleLeaveList(list.id)
          },
          { text: t('common.cancel'), style: 'cancel' }
        ]
      );
    }
  };

  const openEditModal = (list: ShoppingList) => {
    setEditingList(list);
    setEditListName(list.name);
    setEditModalVisible(true);
  };

  const handleUpdateList = async () => {
    if (!editListName.trim()) {
      Alert.alert(t('common.error'), t('errors.requiredField'));
      return;
    }

    if (!editingList) return;

    try {
      const updatedList = await listsApi.updateList(editingList.id, { name: editListName.trim() });
      dispatch(updateListSuccess(updatedList));
      setEditModalVisible(false);
      setEditingList(null);
    } catch (err: any) {
      Alert.alert(t('common.error'), err.response?.data?.error || t('errors.genericError'));
    }
  };

  const handleDeleteList = (listId: string) => {
    Alert.alert(
      t('lists.deleteList') || 'Delete List',
      t('lists.confirmDelete') || 'Are you sure you want to delete this list? This action cannot be undone.',
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete') || 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await listsApi.deleteList(listId);
              dispatch(deleteListSuccess(listId));
            } catch (err: any) {
              Alert.alert(t('common.error'), err.response?.data?.error || t('errors.genericError'));
            }
          }
        }
      ]
    );
  };

  const handleArchiveList = async (listId: string, archive: boolean) => {
    try {
      const updatedList = await listsApi.archiveList(listId, archive);
      dispatch(updateListSuccess(updatedList));
    } catch (err: any) {
      Alert.alert(t('common.error'), err.response?.data?.error || t('errors.genericError'));
    }
  };

  const handleLeaveList = (listId: string) => {
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
              dispatch(deleteListSuccess(listId)); // Remove from local state
            } catch (err: any) {
              Alert.alert(t('common.error'), err.response?.data?.error || t('errors.genericError'));
            }
          }
        }
      ]
    );
  };

  const filteredLists = showArchived ? lists : lists.filter(list => !list.is_archived);

  const renderListItem = ({ item }: { item: ShoppingList }) => (
    <TouchableOpacity
      style={[styles.listCard, item.is_archived && styles.listCardArchived]}
      onPress={() => navigation.navigate('ListDetail', { listId: item.id, listName: item.name })}
      onLongPress={() => handleLongPress(item)}
      delayLongPress={500}
    >
      <View style={styles.listHeader}>
        <Text style={[styles.listName, item.is_archived && styles.listNameArchived]}>
          {item.name} {item.is_archived && '📦'}
        </Text>
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
        data={filteredLists}
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
        contentContainerStyle={filteredLists.length === 0 ? styles.emptyContainer : styles.listContent}
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => setModalVisible(true)}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      {/* Create list modal */}
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

      {/* Edit list modal */}
      <Modal visible={editModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t('lists.editName') || 'Edit List Name'}</Text>
            <TextInput
              style={styles.modalInput}
              placeholder={t('lists.enterListName')}
              value={editListName}
              onChangeText={setEditListName}
              autoFocus
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => {
                  setEditModalVisible(false);
                  setEditingList(null);
                }}
              >
                <Text style={styles.modalButtonTextCancel}>{t('common.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCreate]}
                onPress={handleUpdateList}
              >
                <Text style={styles.modalButtonText}>{t('common.save') || 'Save'}</Text>
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
  listCardArchived: { backgroundColor: '#f5f5f5', opacity: 0.7 },
  listHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  listName: { fontSize: 18, fontWeight: 'bold', color: '#333', flex: 1 },
  listNameArchived: { color: '#999' },
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
  headerButtons: { flexDirection: 'row', alignItems: 'center', gap: 12, marginRight: 16 },
  headerButton: { fontSize: 24 },
  headerButtonText: { fontSize: 14, color: '#4CAF50', fontWeight: 'bold' },
});

export default ListsScreen;
