import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useUserStore } from '../src/store/userStore';

const WINTER_TITLES = [
  { title: 'Frozen Recruit', minScore: 0, minStreak: 0, description: 'Just started the journey' },
  { title: 'Ice Apprentice', minScore: 100, minStreak: 0, description: 'Learning the ways of winter' },
  { title: 'Frost Walker', minScore: 200, minStreak: 7, description: 'Walking the path of discipline' },
  { title: 'Winter Guardian', minScore: 500, minStreak: 14, description: 'Protecting the winter ways' },
  { title: 'Frozen Warrior', minScore: 700, minStreak: 21, description: 'Battle-tested in the ice' },
  { title: 'Ice Emperor', minScore: 1000, minStreak: 30, description: 'Master of the Winter Arc' },
];

const getTitleEmoji = (title: string) => {
  switch (title) {
    case 'Ice Emperor': return '👑';
    case 'Frozen Warrior': return '⚔️';
    case 'Winter Guardian': return '🛡️';
    case 'Frost Walker': return '🥾';
    case 'Ice Apprentice': return '🧙‍♂️';
    default: return '❄️';
  }
};

export default function ProfileScreen() {
  const { user, setUser } = useUserStore();

  React.useEffect(() => {
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
      setUser(demoUser);
    }
  }, []);

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loginPrompt}>
          <Text style={styles.loginTitle}>❄️ Join the Winter Arc</Text>
          <Text style={styles.loginText}>
            Create an account to track your discipline journey and compete with other winter warriors.
          </Text>
          <TouchableOpacity style={styles.loginButton} onPress={() => {
            Alert.alert('Coming Soon', 'Authentication will be implemented soon!');
          }}>
            <Text style={styles.loginButtonText}>Get Started</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>❄️ Winter Profile</Text>
          <Text style={styles.headerSubtitle}>Your Discipline Journey</Text>
        </View>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <View style={styles.titleContainer}>
              <Text style={styles.titleEmoji}>{getTitleEmoji(user.winter_title)}</Text>
              <View>
                <Text style={styles.userName}>{user.name}</Text>
                <Text style={styles.userTitle}>{user.winter_title}</Text>
              </View>
            </View>
          </View>

          <View style={styles.scoreContainer}>
            <View style={styles.scoreItem}>
              <Text style={styles.scoreValue}>{user.total_score}</Text>
              <Text style={styles.scoreLabel}>Total Score</Text>
            </View>
            <View style={styles.scoreItem}>
              <Text style={styles.scoreValue}>{user.streak_days}</Text>
              <Text style={styles.scoreLabel}>Current Streak</Text>
            </View>
            <View style={styles.scoreItem}>
              <Text style={styles.scoreValue}>{user.longest_streak}</Text>
              <Text style={styles.scoreLabel}>Best Streak</Text>
            </View>
          </View>
        </View>

        {/* Winter Titles Guide */}
        <View style={styles.titlesCard}>
          <Text style={styles.titlesTitle}>🏆 Winter Arc Titles</Text>
          
          {WINTER_TITLES.map((title, index) => {
            const isUnlocked = user.total_score >= title.minScore && user.streak_days >= title.minStreak;
            const isCurrent = user.winter_title === title.title;
            
            return (
              <View
                key={title.title}
                style={[
                  styles.titleItem,
                  isCurrent && styles.currentTitleItem,
                  !isUnlocked && styles.lockedTitleItem,
                ]}
              >
                <Text style={styles.titleEmoji}>{getTitleEmoji(title.title)}</Text>
                <View style={styles.titleInfo}>
                  <Text style={[styles.titleName, isCurrent && styles.currentTitleName]}>
                    {title.title}
                  </Text>
                  <Text style={styles.titleDescription}>{title.description}</Text>
                  <Text style={styles.titleRequirements}>
                    {title.minScore} pts • {title.minStreak} day streak
                  </Text>
                </View>
                <View style={styles.titleStatus}>
                  {isCurrent && <Text style={styles.currentBadge}>CURRENT</Text>}
                  {isUnlocked && !isCurrent && (
                    <Ionicons name="checkmark-circle" size={20} color="#00BFFF" />
                  )}
                  {!isUnlocked && (
                    <Ionicons name="lock-closed" size={20} color="#666666" />
                  )}
                </View>
              </View>
            );
          })}
        </View>
        
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            "In the winter of discipline, only the strong survive."
          </Text>
        </View>
      </ScrollView>
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
  profileCard: {
    backgroundColor: '#1a1a1a',
    margin: 16,
    borderRadius: 16,
    padding: 20,
  },
  profileHeader: {
    marginBottom: 20,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  titleEmoji: {
    fontSize: 40,
    marginRight: 16,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  userTitle: {
    fontSize: 16,
    color: '#00BFFF',
    fontWeight: '600',
    marginTop: 2,
  },
  scoreContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  scoreItem: {
    alignItems: 'center',
  },
  scoreValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#00BFFF',
  },
  scoreLabel: {
    fontSize: 14,
    color: '#666666',
    marginTop: 4,
  },
  titlesCard: {
    backgroundColor: '#1a1a1a',
    margin: 16,
    marginTop: 0,
    borderRadius: 12,
    padding: 16,
  },
  titlesTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 16,
  },
  titleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  currentTitleItem: {
    backgroundColor: '#001a33',
    borderRadius: 8,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: '#00BFFF',
  },
  lockedTitleItem: {
    opacity: 0.5,
  },
  titleInfo: {
    flex: 1,
    marginLeft: 12,
  },
  titleName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  currentTitleName: {
    color: '#00BFFF',
  },
  titleDescription: {
    fontSize: 14,
    color: '#666666',
    marginTop: 2,
  },
  titleRequirements: {
    fontSize: 12,
    color: '#999999',
    marginTop: 2,
  },
  titleStatus: {
    alignItems: 'center',
  },
  currentBadge: {
    backgroundColor: '#00BFFF',
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  footer: {
    padding: 16,
    marginBottom: 20,
  },
  footerText: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  loginPrompt: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loginTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 16,
  },
  loginText: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  loginButton: {
    backgroundColor: '#00BFFF',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
  },
  loginButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
