import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet, Alert, Modal } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useFocusEffect } from '@react-navigation/native';
import Animated, { FadeOut } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MainStackParamList, ListItem } from '../../types';
import { useAppDispatch, useAppSelector } from '../../store';
import {
  fetchItemsStart,
  fetchItemsSuccess,
  addItemSuccess,
  updateItemSuccess,
  deleteItemSuccess,
  toggleItemCheckSuccess,
  clearCheckedItemsSuccess,
  fetchSuggestionsStart,
  fetchSuggestionsSuccess,
  clearSuggestions
} from '../../store/slices/itemsSlice';
import { toggleShowCheckedItems } from '../../store/slices/uiSlice';
import { itemsApi, suggestionsApi } from '../../services/api';

type Props = NativeStackScreenProps<MainStackParamList, 'ListDetail'>;

const ListDetailScreen: React.FC<Props> = ({ route, navigation }) => {
  const { listId } = route.params;
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const items = useAppSelector((state) => state.items.itemsByListId[listId] || []);
  const suggestions = useAppSelector((state) => state.items.suggestions);
  const showChecked = useAppSelector((state) => state.ui.showCheckedItems);
  const list = useAppSelector((state) => state.lists.lists.find(l => l.id === listId));

  const isReadOnly = list?.user_role === 'viewer';
  const checkedItemsCount = items.filter(item => item.is_checked).length;

  // State for add item
  const [newItemName, setNewItemName] = useState('');
  const [adding, setAdding] = useState(false);

  // State for full form modal (with quantity and notes)
  const [showFullForm, setShowFullForm] = useState(false);
  const [itemQuantity, setItemQuantity] = useState('');
  const [itemNotes, setItemNotes] = useState('');

  // State for edit modal
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<ListItem | null>(null);
  const [editName, setEditName] = useState('');
  const [editQuantity, setEditQuantity] = useState('');
  const [editNotes, setEditNotes] = useState('');

  useEffect(() => {
    loadItems();
    navigation.setOptions({
      headerRight: () => (
        <View style={styles.headerButtons}>
          {/* Toggle show/hide completed */}
          <TouchableOpacity onPress={() => dispatch(toggleShowCheckedItems())}>
            <Text style={styles.headerButton}>{showChecked ? '👁️' : '🙈'}</Text>
          </TouchableOpacity>

          {/* Clear completed button */}
          {checkedItemsCount > 0 && !isReadOnly && (
            <TouchableOpacity onPress={handleClearCompleted}>
              <Text style={styles.headerButtonText}>🗑️ {checkedItemsCount}</Text>
            </TouchableOpacity>
          )}

          {/* Share button */}
          <TouchableOpacity onPress={() => navigation.navigate('ShareList', { listId })}>
            <Text style={styles.headerButton}>👥</Text>
          </TouchableOpacity>
        </View>
      ),
    });
  }, [listId, checkedItemsCount, showChecked, isReadOnly]);

  // Real-time polling when screen is focused
  useFocusEffect(
    React.useCallback(() => {
      const interval = setInterval(() => {
        loadItems(); // Poll every 10 seconds
      }, 10000);

      return () => clearInterval(interval);
    }, [listId])
  );

  const loadItems = async () => {
    dispatch(fetchItemsStart());
    try {
      const data = await itemsApi.getItems(listId);
      dispatch(fetchItemsSuccess({ listId, items: data }));
    } catch (err) {
      Alert.alert(t('common.error'), t('errors.genericError'));
    }
  };

  const handleAddItem = async () => {
    if (!newItemName.trim()) return;
    setAdding(true);
    try {
      const item = await itemsApi.addItem(listId, { name: newItemName.trim() });
      dispatch(addItemSuccess({ listId, item }));
      setNewItemName('');
      dispatch(clearSuggestions());
    } catch (err) {
      Alert.alert(t('common.error'), t('errors.genericError'));
    } finally {
      setAdding(false);
    }
  };

  const handleToggleCheck = async (itemId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const updatedItem = await itemsApi.toggleItemCheck(listId, itemId);
      dispatch(toggleItemCheckSuccess({ listId, item: updatedItem }));
    } catch (err) {
      Alert.alert(t('common.error'), t('errors.genericError'));
    }
  };

  const handleTextChange = async (text: string) => {
    setNewItemName(text);
    if (text.length >= 2) {
      dispatch(fetchSuggestionsStart());
      try {
        const results = await suggestionsApi.getSuggestions(text);
        dispatch(fetchSuggestionsSuccess(results));
      } catch (err) {
        dispatch(fetchSuggestionsSuccess([]));
      }
    } else {
      dispatch(clearSuggestions());
    }
  };

  const handleAddItemWithDetails = async () => {
    if (!newItemName.trim()) {
      Alert.alert(t('common.error'), t('errors.requiredField'));
      return;
    }

    setAdding(true);
    try {
      const item = await itemsApi.addItem(listId, {
        name: newItemName.trim(),
        quantity: itemQuantity.trim() || undefined,
        notes: itemNotes.trim() || undefined,
      });
      dispatch(addItemSuccess({ listId, item }));
      setNewItemName('');
      setItemQuantity('');
      setItemNotes('');
      setShowFullForm(false);
      dispatch(clearSuggestions());
    } catch (err) {
      Alert.alert(t('common.error'), t('errors.genericError'));
    } finally {
      setAdding(false);
    }
  };

  const handleLongPress = (item: ListItem) => {
    if (isReadOnly) return;

    Alert.alert(
      item.name,
      t('items.selectAction') || 'Select an action',
      [
        { text: t('items.edit') || 'Edit', onPress: () => openEditModal(item) },
        {
          text: t('items.delete') || 'Delete',
          style: 'destructive',
          onPress: () => handleDeleteItem(item.id)
        },
        { text: t('common.cancel'), style: 'cancel' }
      ]
    );
  };

  const openEditModal = (item: ListItem) => {
    setEditingItem(item);
    setEditName(item.name);
    setEditQuantity(item.quantity || '');
    setEditNotes(item.notes || '');
    setEditModalVisible(true);
  };

  const handleUpdateItem = async () => {
    if (!editName.trim()) {
      Alert.alert(t('common.error'), t('errors.requiredField'));
      return;
    }

    if (!editingItem) return;

    try {
      const updatedItem = await itemsApi.updateItem(listId, editingItem.id, {
        name: editName.trim(),
        quantity: editQuantity.trim() || undefined,
        notes: editNotes.trim() || undefined,
      });
      dispatch(updateItemSuccess({ listId, item: updatedItem }));
      setEditModalVisible(false);
      setEditingItem(null);
    } catch (err) {
      Alert.alert(t('common.error'), t('errors.genericError'));
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    Alert.alert(
      t('items.deleteItem') || 'Delete Item',
      t('items.confirmDelete') || 'Are you sure you want to delete this item?',
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete') || 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await itemsApi.deleteItem(listId, itemId);
              dispatch(deleteItemSuccess({ listId, itemId }));
            } catch (err) {
              Alert.alert(t('common.error'), t('errors.genericError'));
            }
          }
        }
      ]
    );
  };

  const handleClearCompleted = () => {
    Alert.alert(
      t('items.clearCompleted') || 'Clear Completed',
      t('items.confirmClearCompleted') || `Are you sure you want to clear ${checkedItemsCount} completed items?`,
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.clear') || 'Clear',
          onPress: async () => {
            try {
              await itemsApi.clearCheckedItems(listId);
              dispatch(clearCheckedItemsSuccess(listId));
            } catch (err) {
              Alert.alert(t('common.error'), t('errors.genericError'));
            }
          }
        }
      ]
    );
  };

  const visibleItems = showChecked ? items : items.filter(item => !item.is_checked);

  const renderItem = ({ item }: { item: ListItem }) => (
    <Animated.View exiting={FadeOut.duration(300)}>
      <TouchableOpacity
        onPress={() => handleToggleCheck(item.id)}
        onLongPress={() => handleLongPress(item)}
        style={styles.itemRow}
        delayLongPress={500}
      >
        <View style={styles.checkbox}>
          <Text style={styles.checkboxIcon}>{item.is_checked ? '✓' : '○'}</Text>
        </View>
        <View style={styles.itemContent}>
          <Text style={[styles.itemName, item.is_checked && styles.itemChecked]}>
            {item.name}
          </Text>
          {item.quantity && (
            <Text style={styles.itemQuantity}>{item.quantity}</Text>
          )}
          {item.notes && (
            <Text style={styles.itemNotes}>{item.notes}</Text>
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      {/* Read-only banner for viewers */}
      {isReadOnly && (
        <View style={styles.readOnlyBanner}>
          <Text style={styles.readOnlyText}>
            👁️ {t('lists.viewOnly') || 'You have view-only access'}
          </Text>
        </View>
      )}

      {/* Input container with quick add and details button */}
      <View style={styles.inputContainer}>
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder={t('items.addItem')}
            value={newItemName}
            onChangeText={handleTextChange}
            onSubmitEditing={handleAddItem}
            editable={!adding && !isReadOnly}
          />
          {!isReadOnly && (
            <TouchableOpacity
              style={styles.detailsButton}
              onPress={() => setShowFullForm(true)}
            >
              <Text style={styles.detailsButtonText}>+</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Autocomplete suggestions */}
      {suggestions.length > 0 && (
        <View style={styles.suggestions}>
          {suggestions.map((suggestion, idx) => (
            <TouchableOpacity
              key={idx}
              style={styles.suggestionItem}
              onPress={() => { setNewItemName(suggestion); dispatch(clearSuggestions()); }}
            >
              <Text>{suggestion}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Items list */}
      <FlatList
        data={visibleItems}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>{t('items.noItems')}</Text>
          </View>
        }
      />

      {/* Full form modal for adding item with details */}
      <Modal visible={showFullForm} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t('items.addItem')}</Text>

            <TextInput
              style={styles.modalInput}
              placeholder={t('items.name')}
              value={newItemName}
              onChangeText={setNewItemName}
              autoFocus
            />

            <TextInput
              style={styles.modalInput}
              placeholder={`${t('items.quantity')} (${t('items.optional')})`}
              value={itemQuantity}
              onChangeText={setItemQuantity}
            />

            <TextInput
              style={[styles.modalInput, styles.modalInputMultiline]}
              placeholder={`${t('items.notes')} (${t('items.optional')})`}
              value={itemNotes}
              onChangeText={setItemNotes}
              multiline
              numberOfLines={3}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => {
                  setShowFullForm(false);
                  setItemQuantity('');
                  setItemNotes('');
                }}
              >
                <Text style={styles.modalButtonTextCancel}>{t('common.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCreate]}
                onPress={handleAddItemWithDetails}
                disabled={adding}
              >
                <Text style={styles.modalButtonText}>
                  {adding ? t('common.loading') : t('common.add')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit item modal */}
      <Modal visible={editModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t('items.editItem') || 'Edit Item'}</Text>

            <TextInput
              style={styles.modalInput}
              placeholder={t('items.name')}
              value={editName}
              onChangeText={setEditName}
            />

            <TextInput
              style={styles.modalInput}
              placeholder={`${t('items.quantity')} (${t('items.optional')})`}
              value={editQuantity}
              onChangeText={setEditQuantity}
            />

            <TextInput
              style={[styles.modalInput, styles.modalInputMultiline]}
              placeholder={`${t('items.notes')} (${t('items.optional')})`}
              value={editNotes}
              onChangeText={setEditNotes}
              multiline
              numberOfLines={3}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => {
                  setEditModalVisible(false);
                  setEditingItem(null);
                }}
              >
                <Text style={styles.modalButtonTextCancel}>{t('common.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCreate]}
                onPress={handleUpdateItem}
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
  container: { flex: 1, backgroundColor: '#fff' },
  readOnlyBanner: {
    backgroundColor: '#FFF3CD',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#FFE69C',
    alignItems: 'center',
  },
  readOnlyText: { color: '#856404', fontSize: 14, fontWeight: '600' },
  inputContainer: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#eee' },
  inputRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  input: { flex: 1, backgroundColor: '#f5f5f5', borderRadius: 8, padding: 12, fontSize: 16 },
  detailsButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailsButtonText: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  suggestions: { backgroundColor: '#f9f9f9', borderBottomWidth: 1, borderBottomColor: '#eee' },
  suggestionItem: { padding: 12, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  itemRow: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  checkbox: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#4CAF50', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  checkboxIcon: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  itemContent: { flex: 1 },
  itemName: { fontSize: 16, color: '#333' },
  itemChecked: { textDecorationLine: 'line-through', color: '#999' },
  itemQuantity: { fontSize: 14, color: '#666', marginTop: 2 },
  itemNotes: { fontSize: 13, color: '#999', marginTop: 2, fontStyle: 'italic' },
  empty: { padding: 40, alignItems: 'center' },
  emptyText: { fontSize: 16, color: '#999' },
  headerButtons: { flexDirection: 'row', alignItems: 'center', gap: 12, marginRight: 16 },
  headerButton: { fontSize: 24 },
  headerButtonText: { fontSize: 14, color: '#4CAF50', fontWeight: 'bold' },
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
  modalInputMultiline: { height: 80, textAlignVertical: 'top' },
  modalButtons: { flexDirection: 'row', gap: 12, marginTop: 8 },
  modalButton: { flex: 1, padding: 12, borderRadius: 8, alignItems: 'center' },
  modalButtonCancel: { backgroundColor: '#f0f0f0' },
  modalButtonCreate: { backgroundColor: '#4CAF50' },
  modalButtonText: { color: '#fff', fontWeight: 'bold' },
  modalButtonTextCancel: { color: '#333', fontWeight: 'bold' },
});

export default ListDetailScreen;
