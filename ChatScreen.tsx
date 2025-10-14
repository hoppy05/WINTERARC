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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import { useUserStore, ChatMessage } from '../../src/store/userStore';
import { apiService } from '../../src/services/api';

export default function ChatScreen() {
  const { user, chatMessages, addChatMessage, setChatMessages } = useUserStore();
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    loadChatHistory();
  }, []);

  const loadChatHistory = async () => {
    if (!user) {
      // Create demo user for testing
      const demoUser = {
        id: 'demo-user',
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
    if (!message.trim() || !user) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      user_id: user.id,
      message: message.trim(),
      is_user: true,
      timestamp: new Date().toISOString(),
    };

    addChatMessage(userMessage);
    setMessage('');
    setIsLoading(true);

    try {
      const aiResponse = await apiService.sendChatMessage(user.id, userMessage.message);
      addChatMessage(aiResponse);
      
      // Scroll to bottom
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
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>❄️ Winter Arc Coach</Text>
          <Text style={styles.headerSubtitle}>Your Harsh Accountability Partner</Text>
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
            <Text style={styles.loadingText}>The Winter Coach is thinking...</Text>
          </View>
        )}

        {/* Input */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            value={message}
            onChangeText={setMessage}
            placeholder="Ask your winter coach..."
            placeholderTextColor="#666666"
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[styles.sendButton, !message.trim() && styles.sendButtonDisabled]}
            onPress={sendMessage}
            disabled={!message.trim() || isLoading}
          >
            <Ionicons name="send" size={20} color={message.trim() ? "#ffffff" : "#666666"} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
  messagesList: {
    flex: 1,
  },
  messagesContainer: {
    padding: 16,
    paddingBottom: 8,
  },
  messageContainer: {
    marginVertical: 4,
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    flex: 1,
  },
  userMessageText: {
    backgroundColor: '#00BFFF',
    color: '#ffffff',
  },
  aiMessageText: {
    backgroundColor: '#1a1a1a',
    color: '#ffffff',
  },
  speakButton: {
    marginLeft: 8,
    padding: 8,
  },
  loadingContainer: {
    padding: 16,
    alignItems: 'center',
  },
  loadingText: {
    color: '#666666',
    fontStyle: 'italic',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#1a1a1a',
    alignItems: 'flex-end',
  },
  textInput: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    color: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    fontSize: 16,
    maxHeight: 100,
    marginRight: 8,
  },
  sendButton: {
    backgroundColor: '#00BFFF',
    padding: 12,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#1a1a1a',
  },
});
