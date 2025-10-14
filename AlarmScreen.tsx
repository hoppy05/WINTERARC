import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  TextInput,
  Switch,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import * as Speech from 'expo-speech';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useUserStore } from '../../src/store/userStore';

// Configure notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const ROAST_MESSAGES = [
  "Wake up, ice cube! The winter doesn't wait for weaklings.",
  "Still in bed? Pathetic. Champions rise while you dream.",
  "The frost is calling, but you're too comfortable being mediocre.",
  "Every second you waste is another step backwards in your Winter Arc.",
  "Real warriors don't need snooze buttons. Prove you're not fake.",
  "The cold doesn't care about your excuses. Neither do I.",
  "While you sleep, your goals are freezing to death.",
  "Discipline starts now, not in 5 more minutes.",
  "The winter arc begins with getting your lazy bones out of bed.",
  "Congratulations, you just failed your first test of the day.",
];

const SNOOZE_ROASTS = [
  "Snoozing again? You're weaker than I thought.",
  "This is exactly why you'll never reach your goals.",
  "The winter is laughing at your lack of discipline.",
  "Every snooze is proof you're not ready for greatness.",
  "Your future self is disgusted by your current weakness.",
];

interface AlarmSettings {
  enabled: boolean;
  time: Date;
  requireProof: boolean;
  proofType: 'text' | 'photo';
  customMessage?: string;
  voiceEnabled: boolean;
}

export default function AlarmScreen() {
  const { user } = useUserStore();
  const [alarmSettings, setAlarmSettings] = useState<AlarmSettings>({
    enabled: false,
    time: new Date(),
    requireProof: false,
    proofType: 'text',
    voiceEnabled: true,
  });
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [proofText, setProofText] = useState('');
  const [customMessage, setCustomMessage] = useState('');
  const [snoozeCount, setSnoozeCount] = useState(0);
  const [isAlarmActive, setIsAlarmActive] = useState(false);
  const [requiredPhrase] = useState('I am disciplined and ready');

  useEffect(() => {
    requestPermissions();
    loadAlarmSettings();
  }, []);

  const requestPermissions = async () => {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission needed',
        'Please enable notifications to use the roasting alarm feature.',
        [{ text: 'OK' }]
      );
    }
  };

  const loadAlarmSettings = () => {
    // In a real app, this would load from AsyncStorage
    // For now, using default settings
  };

  const saveAlarmSettings = () => {
    // In a real app, this would save to AsyncStorage
    console.log('Alarm settings saved:', alarmSettings);
  };

  const scheduleAlarm = async () => {
    if (!alarmSettings.enabled) return;

    try {
      // Cancel any existing notifications
      await Notifications.cancelAllScheduledNotificationsAsync();

      // Calculate trigger time
      const now = new Date();
      const alarmTime = new Date(alarmSettings.time);
      
      // If alarm time is in the past, schedule for tomorrow
      if (alarmTime <= now) {
        alarmTime.setDate(alarmTime.getDate() + 1);
      }

      const trigger = alarmTime;

      await Notifications.scheduleNotificationAsync({
        content: {
          title: '❄️ WINTER ARC ALARM ❄️',
          body: alarmSettings.customMessage || getRandomRoast(),
          sound: true,
        },
        trigger,
      });

      Alert.alert(
        'Alarm Set',
        `Your roasting alarm is set for ${alarmTime.toLocaleTimeString()}`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Failed to schedule alarm:', error);
      Alert.alert('Error', 'Failed to set alarm');
    }
  };

  const getRandomRoast = () => {
    return ROAST_MESSAGES[Math.floor(Math.random() * ROAST_MESSAGES.length)];
  };

  const getSnoozeRoast = () => {
    return SNOOZE_ROASTS[Math.floor(Math.random() * SNOOZE_ROASTS.length)];
  };

  const handleAlarmDismiss = () => {
    if (alarmSettings.requireProof && alarmSettings.proofType === 'text') {
      if (proofText.toLowerCase().trim() !== requiredPhrase.toLowerCase().trim()) {
        Alert.alert(
          'Nice try, weakling!',
          `You must type exactly: "${requiredPhrase}" to prove you're awake.`,
          [{ text: 'Try Again' }]
        );
        return;
      }
    }

    setIsAlarmActive(false);
    setSnoozeCount(0);
    setProofText('');
    
    // Speak congratulations
    if (alarmSettings.voiceEnabled) {
      const message = snoozeCount === 0 
        ? "Finally awake. Now prove you're worth something today."
        : `${snoozeCount + 1} attempts to wake up. Pathetic, but you're up now.`;
      
      Speech.speak(message, {
        rate: 0.8,
        pitch: 0.7,
      });
    }

    Alert.alert(
      'Alarm Dismissed',
      'Time to start your Winter Arc discipline. No excuses.',
      [{ text: 'Let\'s Go!' }]
    );
  };

  const handleSnooze = () => {
    const newSnoozeCount = snoozeCount + 1;
    setSnoozeCount(newSnoozeCount);
    
    const roast = getSnoozeRoast();
    
    if (alarmSettings.voiceEnabled) {
      Speech.speak(`Snooze number ${newSnoozeCount}. ${roast}`, {
        rate: 0.9,
        pitch: 0.6,
      });
    }

    Alert.alert(
      `Snooze #${newSnoozeCount}`,
      roast,
      [
        { text: 'Fine, 5 more minutes', style: 'cancel' },
        { text: 'Actually, wake me up now', onPress: () => setIsAlarmActive(true) },
      ]
    );

    // Schedule another notification in 5 minutes
    setTimeout(() => {
      setIsAlarmActive(true);
    }, 5 * 60 * 1000); // 5 minutes
  };

  const testAlarm = () => {
    setIsAlarmActive(true);
    if (alarmSettings.voiceEnabled) {
      Speech.speak(getRandomRoast(), {
        rate: 0.8,
        pitch: 0.7,
      });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>⏰ Roast Alarm</Text>
          <Text style={styles.headerSubtitle}>Wake up with harsh accountability</Text>
        </View>

        {/* Alarm Active Modal */}
        {isAlarmActive && (
          <View style={styles.alarmActiveContainer}>
            <View style={styles.alarmModal}>
              <Text style={styles.alarmTitle}>❄️ WAKE UP! ❄️</Text>
              <Text style={styles.alarmMessage}>
                {alarmSettings.customMessage || getRandomRoast()}
              </Text>
              
              {snoozeCount > 0 && (
                <Text style={styles.snoozeCounter}>
                  Snoozes: {snoozeCount} (Pathetic)
                </Text>
              )}

              {alarmSettings.requireProof && alarmSettings.proofType === 'text' && (
                <View style={styles.proofContainer}>
                  <Text style={styles.proofLabel}>
                    Type this to prove you're awake:
                  </Text>
                  <Text style={styles.requiredPhrase}>"{requiredPhrase}"</Text>
                  <TextInput
                    style={styles.proofInput}
                    value={proofText}
                    onChangeText={setProofText}
                    placeholder="Type the phrase exactly..."
                    placeholderTextColor="#666666"
                  />
                </View>
              )}

              <View style={styles.alarmActions}>
                <TouchableOpacity
                  style={styles.snoozeButton}
                  onPress={handleSnooze}
                >
                  <Text style={styles.snoozeButtonText}>😴 Snooze (Weak)</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.dismissButton}
                  onPress={handleAlarmDismiss}
                >
                  <Text style={styles.dismissButtonText}>💪 I'm Up!</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Alarm Settings</Text>

          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Enable Roast Alarm</Text>
            <Switch
              value={alarmSettings.enabled}
              onValueChange={(value) => {
                setAlarmSettings(prev => ({ ...prev, enabled: value }));
                if (value) {
                  scheduleAlarm();
                } else {
                  Notifications.cancelAllScheduledNotificationsAsync();
                }
              }}
              trackColor={{ false: '#333333', true: '#00BFFF' }}
              thumbColor={alarmSettings.enabled ? '#ffffff' : '#666666'}
            />
          </View>

          <TouchableOpacity
            style={styles.settingRow}
            onPress={() => setShowTimePicker(true)}
          >
            <Text style={styles.settingLabel}>Alarm Time</Text>
            <Text style={styles.timeText}>
              {alarmSettings.time.toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </Text>
          </TouchableOpacity>

          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Voice Roasts</Text>
            <Switch
              value={alarmSettings.voiceEnabled}
              onValueChange={(value) => 
                setAlarmSettings(prev => ({ ...prev, voiceEnabled: value }))
              }
              trackColor={{ false: '#333333', true: '#00BFFF' }}
              thumbColor={alarmSettings.voiceEnabled ? '#ffffff' : '#666666'}
            />
          </View>

          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Require Proof to Dismiss</Text>
            <Switch
              value={alarmSettings.requireProof}
              onValueChange={(value) => 
                setAlarmSettings(prev => ({ ...prev, requireProof: value }))
              }
              trackColor={{ false: '#333333', true: '#00BFFF' }}
              thumbColor={alarmSettings.requireProof ? '#ffffff' : '#666666'}
            />
          </View>
        </View>

        {/* Custom Message */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Custom Wake-Up Message</Text>
          <TextInput
            style={styles.customMessageInput}
            value={customMessage}
            onChangeText={setCustomMessage}
            placeholder="Enter your own harsh wake-up message..."
            placeholderTextColor="#666666"
            multiline
            numberOfLines={3}
          />
          <TouchableOpacity
            style={styles.saveButton}
            onPress={() => {
              setAlarmSettings(prev => ({ ...prev, customMessage }));
              Alert.alert('Saved', 'Custom message updated');
            }}
          >
            <Text style={styles.saveButtonText}>Save Message</Text>
          </TouchableOpacity>
        </View>

        {/* Test Button */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.testButton} onPress={testAlarm}>
            <Ionicons name="play" size={20} color="#ffffff" />
            <Text style={styles.testButtonText}>Test Alarm</Text>
          </TouchableOpacity>
        </View>

        {/* Info */}
        <View style={styles.section}>
          <Text style={styles.infoTitle}>❄️ How It Works</Text>
          <Text style={styles.infoText}>
            • Set your wake-up time and enable the alarm{"\n"}
            • Get roasted with harsh but motivational messages{"\n"}
            • Voice roasts speak your failures out loud{"\n"}
            • Snoozing triggers even harsher roasts{"\n"}
            • Proof requirement forces you to prove you're awake{"\n"}
            • Build discipline from the moment you wake up
          </Text>
        </View>
      </ScrollView>

      {/* Time Picker */}
      {showTimePicker && (
        <DateTimePicker
          value={alarmSettings.time}
          mode="time"
          display="default"
          onChange={(event, selectedTime) => {
            setShowTimePicker(false);
            if (selectedTime) {
              setAlarmSettings(prev => ({ ...prev, time: selectedTime }));
              if (alarmSettings.enabled) {
                scheduleAlarm();
              }
            }
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  scrollView: {
    flex: 1,
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
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 16,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
  },
  settingLabel: {
    fontSize: 16,
    color: '#ffffff',
    flex: 1,
  },
  timeText: {
    fontSize: 16,
    color: '#00BFFF',
    fontWeight: '600',
  },
  customMessageInput: {
    backgroundColor: '#1a1a1a',
    color: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#333333',
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  saveButton: {
    backgroundColor: '#00BFFF',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  testButton: {
    backgroundColor: '#1a1a1a',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333333',
  },
  testButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#00BFFF',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
  },
  alarmActiveContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    zIndex: 1000,
    justifyContent: 'center',
    alignItems: 'center',
  },
  alarmModal: {
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    padding: 24,
    margin: 20,
    borderWidth: 2,
    borderColor: '#00BFFF',
  },
  alarmTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#00BFFF',
    textAlign: 'center',
    marginBottom: 16,
  },
  alarmMessage: {
    fontSize: 18,
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 24,
  },
  snoozeCounter: {
    fontSize: 14,
    color: '#ff4444',
    textAlign: 'center',
    marginBottom: 16,
    fontWeight: '600',
  },
  proofContainer: {
    marginBottom: 20,
  },
  proofLabel: {
    fontSize: 14,
    color: '#00BFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  requiredPhrase: {
    fontSize: 16,
    color: '#ffffff',
    textAlign: 'center',
    fontWeight: 'bold',
    marginBottom: 12,
    fontStyle: 'italic',
  },
  proofInput: {
    backgroundColor: '#000000',
    color: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#00BFFF',
    textAlign: 'center',
  },
  alarmActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  snoozeButton: {
    backgroundColor: '#333333',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    flex: 1,
  },
  snoozeButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  dismissButton: {
    backgroundColor: '#00BFFF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    flex: 1,
  },
  dismissButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});