import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Alert,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import { useUserStore, ChatMessage } from '../src/store/userStore';
import { apiService } from '../src/services/api';

const { width, height } = Dimensions.get('window');

export default function ChatScreen() {
  const { user, chatMessages, addChatMessage, setChatMessages } = useUserStore();
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    if (user) {
      loadChatHistory();
    }
  }, [user]);

  const loadChatHistory = async () => {
    if (!user) {
      // Create demo user for testing
      const demoUser = {
        id: 'demo-user-' + Date.now(),
        email: 'demo@winterarc.com',
        name: 'Winter Warrior',
        winter_title: 'Frozen Recruit',
        total_score: 0,
        streak_days: 0,
        longest_streak: 0,
        created_at: new Date().toISOString(),
        last_active: new Date().toISOString(),
      };
      useUserStore.getState().setUser(demoUser);
      return;
    }

    try {
      const messages = await apiService.getChatHistory(user.id);
      setChatMessages(messages);
    } catch (error) {
      console.error('Failed to load chat history:', error);
    }
  };

  const sendMessage = async () => {
    if (!message.trim() || isLoading || !user) return;

    const messageText = message.trim();
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      user_id: user.id,
      message: messageText,
      is_user: true,
      timestamp: new Date().toISOString(),
    };

    // Immediately clear input and add user message
    setMessage('');
    addChatMessage(userMessage);
    setIsLoading(true);

    // Scroll to bottom immediately
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 50);

    try {
      const aiResponse = await apiService.sendChatMessage(user.id, messageText);
      addChatMessage(aiResponse);
      
      // Scroll to bottom after AI response
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      console.error('Failed to send message:', error);
      const errorMessage: ChatMessage = {
        id: Date.now().toString() + '_error',
        user_id: user.id,
        message: 'The winter has frozen my words. Try again, if you dare.',
        is_user: false,
        timestamp: new Date().toISOString(),
      };
      addChatMessage(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const speakMessage = async (text: string) => {
    if (isSpeaking) {
      Speech.stop();
      setIsSpeaking(false);
      return;
    }

    try {
      setIsSpeaking(true);
      await Speech.speak(text, {
        voice: 'com.apple.ttsbundle.Daniel-compact', // Try to use a deeper voice
        rate: 0.8,
        pitch: 0.7,
        onDone: () => setIsSpeaking(false),
        onError: () => setIsSpeaking(false),
      });
    } catch (error) {
      setIsSpeaking(false);
      Alert.alert('Speech Error', 'Could not play speech');
    }
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => (
    <View style={[styles.messageContainer, item.is_user ? styles.userMessage : styles.aiMessage]}>
      <View style={styles.messageContent}>
        <Text style={[styles.messageText, item.is_user ? styles.userMessageText : styles.aiMessageText]}>
          {item.message}
        </Text>
        {!item.is_user && (
          <TouchableOpacity
            style={styles.speakButton}
            onPress={() => speakMessage(item.message)}
          >
            <Ionicons 
              name={isSpeaking ? "volume-high" : "volume-medium-outline"} 
              size={16} 
              color="#00BFFF" 
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Gradient Background */}
      <LinearGradient
        colors={['#1a0b3d', '#2d1b69', '#1a365d', '#0f2027']}
        locations={[0, 0.3, 0.7, 1]}
        style={styles.gradientBackground}
      >
        <KeyboardAvoidingView 
          style={styles.container}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          {/* Modern Header */}
          <View style={styles.modernHeader}>
            <View style={styles.headerContent}>
              <Text style={styles.modernTitle}>Winter Arc</Text>
              <Text style={styles.modernSubtitle}>Your AI Accountability Coach</Text>
            </View>
          </View>

          {/* Messages */}
          <FlatList
            ref={flatListRef}
            data={chatMessages}
            renderItem={renderMessage}
            keyExtractor={(item) => item.id}
            style={styles.messagesList}
            contentContainerStyle={styles.messagesContainer}
            showsVerticalScrollIndicator={false}
          />

          {/* Loading indicator */}
          {isLoading && (
            <View style={styles.loadingContainer}>
              <View style={styles.loadingCard}>
                <Text style={styles.loadingText}>❄️ Winter Coach is thinking...</Text>
              </View>
            </View>
          )}

          {/* Modern Input Card */}
          <View style={styles.modernInputContainer}>
            <View style={styles.inputCard}>
              <TextInput
                style={styles.modernInput}
                value={message}
                onChangeText={setMessage}
                placeholder="Ask Winter Arc to help with discipline..."
                placeholderTextColor="#8892b0"
                multiline
                maxLength={500}
              />
            </View>
            
            {/* MEGA SEND BUTTON - Outside the card */}
            <TouchableOpacity 
              style={styles.megaSendButton}
              onPress={sendMessage}
              disabled={isLoading}
            >
              <Text style={styles.megaSendText}>
                {isLoading ? "SENDING..." : "SEND MESSAGE ❄️"}
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradientBackground: {
    flex: 1,
  },
  modernHeader: {
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  headerContent: {
    alignItems: 'center',
  },
  modernTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 8,
  },
  modernSubtitle: {
    fontSize: 18,
    color: '#94a3b8',
    textAlign: 'center',
    fontWeight: '500',
  },
  messagesList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  messagesContainer: {
    paddingVertical: 16,
  },
  messageContainer: {
    marginVertical: 8,
  },
  userMessage: {
    alignItems: 'flex-end',
  },
  aiMessage: {
    alignItems: 'flex-start',
  },
  messageContent: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    maxWidth: '85%',
  },
  messageText: {
    fontSize: 16,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 24,
    flex: 1,
    lineHeight: 22,
  },
  userMessageText: {
    backgroundColor: 'rgba(59, 130, 246, 0.9)',
    color: '#ffffff',
    borderBottomRightRadius: 8,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  aiMessageText: {
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    color: '#e2e8f0',
    borderBottomLeftRadius: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  speakButton: {
    marginLeft: 12,
    padding: 8,
    borderRadius: 16,
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
  },
  loadingContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    alignItems: 'center',
  },
  loadingCard: {
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  loadingText: {
    color: '#94a3b8',
    fontSize: 16,
    fontWeight: '500',
  },
  modernInputContainer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingBottom: 32,
  },
  inputCard: {
    backgroundColor: 'rgba(30, 41, 59, 0.9)',
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
  },
  modernInput: {
    color: '#e2e8f0',
    fontSize: 16,
    fontWeight: '400',
    marginBottom: 16,
    minHeight: 24,
    maxHeight: 120,
    lineHeight: 24,
  },
  inputActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(51, 65, 85, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(51, 65, 85, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonActive: {
    backgroundColor: '#3b82f6',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
  },
  bigSendButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    minHeight: 50,
    flex: 1,
  },
  sendButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
    letterSpacing: 1,
  },
  megaSendButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    width: '100%',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 8,
  },
  megaSendText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
});
