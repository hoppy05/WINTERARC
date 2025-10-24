import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../src/contexts/AuthContext';

export default function LoginScreen() {
  const { login, isLoading } = useAuth();

  const handleGoogleLogin = async () => {
    try {
      await login();
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>❄️ Winter Arc</Text>
          <Text style={styles.subtitle}>Where Discipline is Forged in Ice</Text>
        </View>

        {/* Logo/Visual */}
        <View style={styles.visualContainer}>
          <Text style={styles.snowflake}>❄️</Text>
          <Text style={styles.tagline}>
            Your Harsh Accountability Coach Awaits
          </Text>
        </View>

        {/* Features List */}
        <View style={styles.featuresContainer}>
          <View style={styles.featureItem}>
            <Ionicons name="chatbubble-ellipses" size={24} color="#00BFFF" />
            <Text style={styles.featureText}>AI Coach with Brutal Honesty</Text>
          </View>
          
          <View style={styles.featureItem}>
            <Ionicons name="fitness" size={24} color="#00BFFF" />
            <Text style={styles.featureText}>Habit & Progress Tracking</Text>
          </View>
          
          <View style={styles.featureItem}>
            <Ionicons name="alarm" size={24} color="#00BFFF" />
            <Text style={styles.featureText}>Roasting Alarm Clock</Text>
          </View>
          
          <View style={styles.featureItem}>
            <Ionicons name="trophy" size={24} color="#00BFFF" />
            <Text style={styles.featureText}>Global Leaderboard</Text>
          </View>
        </View>

        {/* Login Button */}
        <View style={styles.loginContainer}>
          <TouchableOpacity
            style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
            onPress={handleGoogleLogin}
            disabled={isLoading}
          >
            <Ionicons 
              name="logo-google" 
              size={20} 
              color="#ffffff" 
              style={styles.googleIcon}
            />
            <Text style={styles.loginButtonText}>
              {isLoading ? 'Connecting...' : 'Continue with Google'}
            </Text>
          </TouchableOpacity>
          
          <Text style={styles.loginNote}>
            Join the frozen warriors and start your discipline journey
          </Text>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            "The winter doesn't ask if you're ready.{'\n'}It demands you become ready."
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  header: {
    alignItems: 'center',
    marginTop: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#00BFFF',
    textAlign: 'center',
    fontWeight: '600',
  },
  visualContainer: {
    alignItems: 'center',
    marginVertical: 40,
  },
  snowflake: {
    fontSize: 80,
    marginBottom: 16,
  },
  tagline: {
    fontSize: 18,
    color: '#ffffff',
    textAlign: 'center',
    fontWeight: '500',
    maxWidth: 280,
    lineHeight: 24,
  },
  featuresContainer: {
    marginVertical: 32,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  featureText: {
    fontSize: 16,
    color: '#ffffff',
    marginLeft: 16,
    fontWeight: '500',
  },
  loginContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  loginButton: {
    backgroundColor: '#00BFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    width: '100%',
    marginBottom: 16,
  },
  loginButtonDisabled: {
    backgroundColor: '#333333',
  },
  googleIcon: {
    marginRight: 12,
  },
  loginButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  loginNote: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 20,
  },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 20,
  },
});