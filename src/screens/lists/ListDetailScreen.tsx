import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import Animated, { FadeOut } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MainStackParamList } from '../../types';
import { useAppDispatch, useAppSelector } from '../../store';
import { fetchItemsStart, fetchItemsSuccess, addItemSuccess, toggleItemCheckSuccess, fetchSuggestionsStart, fetchSuggestionsSuccess, clearSuggestions } from '../../store/slices/itemsSlice';
import { itemsApi, suggestionsApi } from '../../services/api';

type Props = NativeStackScreenProps<MainStackParamList, 'ListDetail'>;

const ListDetailScreen: React.FC<Props> = ({ route, navigation }) => {
  const { listId } = route.params;
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const items = useAppSelector((state) => state.items.itemsByListId[listId] || []);
  const suggestions = useAppSelector((state) => state.items.suggestions);
  const showChecked = useAppSelector((state) => state.ui.showCheckedItems);

  const [newItemName, setNewItemName] = useState('');
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    loadItems();
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity onPress={() => navigation.navigate('ShareList', { listId })}>
          <Text style={styles.headerButton}>👥</Text>
        </TouchableOpacity>
      ),
    });
  }, [listId]);

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

  const visibleItems = showChecked ? items : items.filter(item => !item.is_checked);

  const renderItem = ({ item }: any) => (
    <Animated.View exiting={FadeOut.duration(300)} style={styles.itemRow}>
      <TouchableOpacity onPress={() => handleToggleCheck(item.id)} style={styles.checkbox}>
        <Text style={styles.checkboxIcon}>{item.is_checked ? '✓' : '○'}</Text>
      </TouchableOpacity>
      <Text style={[styles.itemName, item.is_checked && styles.itemChecked]}>{item.name}</Text>
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder={t('items.addItem')}
          value={newItemName}
          onChangeText={handleTextChange}
          onSubmitEditing={handleAddItem}
          editable={!adding}
        />
      </View>
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  inputContainer: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#eee' },
  input: { backgroundColor: '#f5f5f5', borderRadius: 8, padding: 12, fontSize: 16 },
  suggestions: { backgroundColor: '#f9f9f9', borderBottomWidth: 1, borderBottomColor: '#eee' },
  suggestionItem: { padding: 12, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  itemRow: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  checkbox: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#4CAF50', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  checkboxIcon: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  itemName: { fontSize: 16, flex: 1 },
  itemChecked: { textDecorationLine: 'line-through', color: '#999' },
  empty: { padding: 40, alignItems: 'center' },
  emptyText: { fontSize: 16, color: '#999' },
  headerButton: { fontSize: 24, marginRight: 16 },
});

export default ListDetailScreen;
