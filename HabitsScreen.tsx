import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useUserStore, Habit, HabitLog } from '../../src/store/userStore';
import { apiService } from '../../src/services/api';

const HABIT_CATEGORIES = [
  { key: 'fitness', label: '💪 Fitness', icon: 'fitness' },
  { key: 'diet', label: '🥗 Nutrition', icon: 'restaurant' },
  { key: 'discipline', label: '🧠 Discipline', icon: 'library' },
  { key: 'sleep', label: '😴 Sleep', icon: 'moon' },
];

export default function HabitsScreen() {
  const { user, habits, setHabits, addHabit, removeHabit } = useUserStore();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showLogModal, setShowLogModal] = useState(false);
  const [selectedHabit, setSelectedHabit] = useState<Habit | null>(null);
  const [habitLogs, setHabitLogs] = useState<HabitLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Add habit form state
  const [habitName, setHabitName] = useState('');
  const [habitCategory, setHabitCategory] = useState('fitness');
  const [targetValue, setTargetValue] = useState('');
  const [unit, setUnit] = useState('');

  // Log habit form state
  const [logValue, setLogValue] = useState('');
  const [logNotes, setLogNotes] = useState('');

  useEffect(() => {
    loadHabits();
    loadHabitLogs();
  }, []);

  const loadHabits = async () => {
    if (!user) return;
    
    try {
      const userHabits = await apiService.getUserHabits(user.id);
      setHabits(userHabits);
    } catch (error) {
      console.error('Failed to load habits:', error);
    }
  };

  const loadHabitLogs = async () => {
    if (!user) return;
    
    try {
      const logs = await apiService.getHabitLogs(user.id);
      setHabitLogs(logs);
    } catch (error) {
      console.error('Failed to load habit logs:', error);
    }
  };

  const handleAddHabit = async () => {
    if (!habitName.trim() || !user) return;

    setIsLoading(true);
    try {
      const newHabit = await apiService.createHabit(user.id, {
        name: habitName.trim(),
        category: habitCategory,
        target_value: targetValue.trim() || undefined,
        unit: unit.trim() || undefined,
      });
      
      addHabit(newHabit);
      
      // Reset form
      setHabitName('');
      setTargetValue('');
      setUnit('');
      setShowAddModal(false);
      
      Alert.alert('Success', 'Habit added to your Winter Arc!');
    } catch (error) {
      console.error('Failed to add habit:', error);
      Alert.alert('Error', 'Failed to add habit. Try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteHabit = async (habit: Habit) => {
    Alert.alert(
      'Delete Habit',
      `Are you sure you want to delete "${habit.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiService.deleteHabit(habit.id);
              removeHabit(habit.id);
              Alert.alert('Success', 'Habit deleted');
            } catch (error) {
              console.error('Failed to delete habit:', error);
              Alert.alert('Error', 'Failed to delete habit');
            }
          },
        },
      ]
    );
  };

  const handleLogHabit = async () => {
    if (!logValue.trim() || !selectedHabit || !user) return;

    setIsLoading(true);
    try {
      const log = await apiService.logHabit(user.id, {
        habit_id: selectedHabit.id,
        value: logValue.trim(),
        notes: logNotes.trim() || undefined,
      });
      
      // Reset form
      setLogValue('');
      setLogNotes('');
      setSelectedHabit(null);
      setShowLogModal(false);
      
      // Show AI response
      if (log.ai_response) {
        Alert.alert('Winter Coach Says', log.ai_response);
      }
      
      // Reload logs
      loadHabitLogs();
      
    } catch (error) {
      console.error('Failed to log habit:', error);
      Alert.alert('Error', 'Failed to log habit. Try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getCategoryIcon = (category: string) => {
    const cat = HABIT_CATEGORIES.find(c => c.key === category);
    return cat?.icon || 'checkmark-circle';
  };

  const getCategoryLabel = (category: string) => {
    const cat = HABIT_CATEGORIES.find(c => c.key === category);
    return cat?.label || category;
  };

  const getTodaysLogs = () => {
    const today = new Date().toDateString();
    return habitLogs.filter(log => 
      new Date(log.logged_at).toDateString() === today
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>❄️ Discipline Tracker</Text>
        <Text style={styles.headerSubtitle}>Build Your Winter Arc</Text>
        {user && (
          <View style={styles.statsContainer}>
            <Text style={styles.statText}>🔥 {user.streak_days} day streak</Text>
            <Text style={styles.statText}>⭐ {user.total_score} points</Text>
          </View>
        )}
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Today's Progress */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Today's Discipline</Text>
          {getTodaysLogs().length > 0 ? (
            getTodaysLogs().map((log) => {
              const habit = habits.find(h => h.id === log.habit_id);
              return (
                <View key={log.id} style={styles.logCard}>
                  <Text style={styles.logHabitName}>{habit?.name}</Text>
                  <Text style={styles.logValue}>{log.value}</Text>
                  {log.notes && <Text style={styles.logNotes}>{log.notes}</Text>}
                </View>
              );
            })
          ) : (
            <Text style={styles.noDataText}>No discipline logged today. The winter is waiting...</Text>
          )}
        </View>

        {/* Habits List */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>My Habits</Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setShowAddModal(true)}
            >
              <Ionicons name="add" size={24} color="#ffffff" />
            </TouchableOpacity>
          </View>

          {habits.length > 0 ? (
            habits.map((habit) => (
              <View key={habit.id} style={styles.habitCard}>
                <View style={styles.habitInfo}>
                  <Ionicons
                    name={getCategoryIcon(habit.category) as any}
                    size={24}
                    color="#00BFFF"
                    style={styles.habitIcon}
                  />
                  <View style={styles.habitDetails}>
                    <Text style={styles.habitName}>{habit.name}</Text>
                    <Text style={styles.habitCategory}>{getCategoryLabel(habit.category)}</Text>
                    {habit.target_value && (
                      <Text style={styles.habitTarget}>
                        Target: {habit.target_value} {habit.unit}
                      </Text>
                    )}
                  </View>
                </View>
                <View style={styles.habitActions}>
                  <TouchableOpacity
                    style={styles.logButton}
                    onPress={() => {
                      setSelectedHabit(habit);
                      setShowLogModal(true);
                    }}
                  >
                    <Ionicons name="add-circle" size={20} color="#00BFFF" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDeleteHabit(habit)}
                  >
                    <Ionicons name="trash" size={16} color="#ff4444" />
                  </TouchableOpacity>
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.noDataText}>
              No habits yet. Add some to start your Winter Arc discipline journey!
            </Text>
          )}
        </View>
      </ScrollView>

      {/* Add Habit Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add New Habit</Text>
            <TouchableOpacity onPress={() => setShowAddModal(false)}>
              <Ionicons name="close" size={24} color="#ffffff" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Habit Name</Text>
              <TextInput
                style={styles.input}
                value={habitName}
                onChangeText={setHabitName}
                placeholder="e.g., Morning Workout"
                placeholderTextColor="#666666"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Category</Text>
              <View style={styles.categoryGrid}>
                {HABIT_CATEGORIES.map((category) => (
                  <TouchableOpacity
                    key={category.key}
                    style={[
                      styles.categoryButton,
                      habitCategory === category.key && styles.categoryButtonSelected,
                    ]}
                    onPress={() => setHabitCategory(category.key)}
                  >
                    <Text style={styles.categoryButtonText}>{category.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputRow}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Target Value (Optional)</Text>
                <TextInput
                  style={styles.input}
                  value={targetValue}
                  onChangeText={setTargetValue}
                  placeholder="e.g., 30"
                  placeholderTextColor="#666666"
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Unit (Optional)</Text>
                <TextInput
                  style={styles.input}
                  value={unit}
                  onChangeText={setUnit}
                  placeholder="e.g., minutes"
                  placeholderTextColor="#666666"
                />
              </View>
            </View>

            <TouchableOpacity
              style={[styles.submitButton, !habitName.trim() && styles.submitButtonDisabled]}
              onPress={handleAddHabit}
              disabled={!habitName.trim() || isLoading}
            >
              <Text style={styles.submitButtonText}>
                {isLoading ? 'Adding...' : 'Add Habit'}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      {/* Log Habit Modal */}
      <Modal
        visible={showLogModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowLogModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Log: {selectedHabit?.name}</Text>
            <TouchableOpacity onPress={() => setShowLogModal(false)}>
              <Ionicons name="close" size={24} color="#ffffff" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Value</Text>
              <TextInput
                style={styles.input}
                value={logValue}
                onChangeText={setLogValue}
                placeholder="How much did you do?"
                placeholderTextColor="#666666"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Notes (Optional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={logNotes}
                onChangeText={setLogNotes}
                placeholder="Any additional notes..."
                placeholderTextColor="#666666"
                multiline
                numberOfLines={3}
              />
            </View>

            <TouchableOpacity
              style={[styles.submitButton, !logValue.trim() && styles.submitButtonDisabled]}
              onPress={handleLogHabit}
              disabled={!logValue.trim() || isLoading}
            >
              <Text style={styles.submitButtonText}>
                {isLoading ? 'Logging...' : 'Log Habit'}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#00BFFF',
    textAlign: 'center',
    marginTop: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
  },
  statText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  addButton: {
    backgroundColor: '#00BFFF',
    padding: 8,
    borderRadius: 20,
  },
  habitCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  habitInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  habitIcon: {
    marginRight: 12,
  },
  habitDetails: {
    flex: 1,
  },
  habitName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
  habitCategory: {
    fontSize: 14,
    color: '#00BFFF',
    marginTop: 2,
  },
  habitTarget: {
    fontSize: 12,
    color: '#666666',
    marginTop: 2,
  },
  habitActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logButton: {
    marginRight: 8,
    padding: 4,
  },
  deleteButton: {
    padding: 4,
  },
  logCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#00BFFF',
  },
  logHabitName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  logValue: {
    fontSize: 14,
    color: '#00BFFF',
    marginTop: 2,
  },
  logNotes: {
    fontSize: 12,
    color: '#666666',
    marginTop: 4,
  },
  noDataText: {
    color: '#666666',
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 16,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 16,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#1a1a1a',
    color: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#333333',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryButton: {
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#333333',
  },
  categoryButtonSelected: {
    backgroundColor: '#00BFFF',
    borderColor: '#00BFFF',
  },
  categoryButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: '#00BFFF',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  submitButtonDisabled: {
    backgroundColor: '#333333',
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});