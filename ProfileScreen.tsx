import React, { useState, useEffect } from 'react';
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
import { useUserStore } from '../../src/store/userStore';
import { apiService } from '../../src/services/api';

const WINTER_TITLES = [
  { title: 'Frozen Recruit', minScore: 0, minStreak: 0, description: 'Just started the journey' },
  { title: 'Ice Apprentice', minScore: 100, minStreak: 0, description: 'Learning the ways of winter' },
  { title: 'Frost Walker', minScore: 200, minStreak: 7, description: 'Walking the path of discipline' },
  { title: 'Winter Guardian', minScore: 500, minStreak: 14, description: 'Protecting the winter ways' },
  { title: 'Frozen Warrior', minScore: 700, minStreak: 21, description: 'Battle-tested in the ice' },
  { title: 'Ice Emperor', minScore: 1000, minStreak: 30, description: 'Master of the Winter Arc' },
];

const getProgressToNextTitle = (currentScore: number, currentStreak: number, currentTitle: string) => {
  const currentIndex = WINTER_TITLES.findIndex(t => t.title === currentTitle);
  if (currentIndex === -1 || currentIndex === WINTER_TITLES.length - 1) {
    return null; // Max title reached
  }
  
  const nextTitle = WINTER_TITLES[currentIndex + 1];
  const scoreNeeded = Math.max(0, nextTitle.minScore - currentScore);
  const streakNeeded = Math.max(0, nextTitle.minStreak - currentStreak);
  
  return {
    nextTitle: nextTitle.title,
    scoreNeeded,
    streakNeeded,
  };
};

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
  const { user, setUser, clearUser } = useUserStore();
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState({
    totalHabits: 0,
    totalLogs: 0,
    averageDaily: 0,
    bestStreak: 0,
  });

  useEffect(() => {
    loadUserStats();
  }, []);

  const loadUserStats = async () => {
    if (!user) return;
    
    try {
      // Refresh user data
      const userData = await apiService.getUser(user.id);
      setUser(userData);
      
      // Load habits and logs for stats
      const habits = await apiService.getUserHabits(user.id);
      const logs = await apiService.getHabitLogs(user.id, 1000);
      
      // Calculate stats
      const daysSinceStart = Math.max(1, 
        Math.floor((Date.now() - new Date(user.created_at).getTime()) / (1000 * 60 * 60 * 24))
      );
      
      setStats({
        totalHabits: habits.length,
        totalLogs: logs.length,
        averageDaily: Math.round((logs.length / daysSinceStart) * 10) / 10,
        bestStreak: userData.longest_streak,
      });
    } catch (error) {
      console.error('Failed to load user stats:', error);
    }
  };

  const refreshScore = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      await apiService.updateUserScore(user.id);
      await loadUserStats();
      Alert.alert('Updated', 'Your score and title have been refreshed!');
    } catch (error) {
      console.error('Failed to refresh score:', error);
      Alert.alert('Error', 'Failed to refresh score');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout? Your Winter Arc progress is saved.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: () => {
            clearUser();
            Alert.alert('Logged Out', 'Stay strong in your Winter Arc!');
          },
        },
      ]
    );
  };

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loginPrompt}>
          <Text style={styles.loginTitle}>❄️ Join the Winter Arc</Text>
          <Text style={styles.loginText}>
            Create an account to track your discipline journey and compete with other winter warriors.
          </Text>
          <TouchableOpacity style={styles.loginButton} onPress={() => {
            // In a real app, this would navigate to login/signup
            Alert.alert('Coming Soon', 'Authentication will be implemented soon!');
          }}>
            <Text style={styles.loginButtonText}>Get Started</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const progress = getProgressToNextTitle(user.total_score, user.streak_days, user.winter_title);

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
            <TouchableOpacity
              style={styles.refreshButton}
              onPress={refreshScore}
              disabled={isLoading}
            >
              <Ionicons
                name="refresh"
                size={20}
                color={isLoading ? '#666666' : '#00BFFF'}
              />
            </TouchableOpacity>
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

        {/* Progress to Next Title */}
        {progress && (
          <View style={styles.progressCard}>
            <Text style={styles.progressTitle}>🎯 Next Goal: {progress.nextTitle}</Text>
            
            {progress.scoreNeeded > 0 && (
              <View style={styles.progressItem}>
                <Text style={styles.progressLabel}>Score needed:</Text>
                <Text style={styles.progressValue}>{progress.scoreNeeded} more points</Text>
              </View>
            )}
            
            {progress.streakNeeded > 0 && (
              <View style={styles.progressItem}>
                <Text style={styles.progressLabel}>Streak needed:</Text>
                <Text style={styles.progressValue}>{progress.streakNeeded} more days</Text>
              </View>
            )}
            
            {progress.scoreNeeded === 0 && progress.streakNeeded === 0 && (
              <Text style={styles.progressReady}>🔥 Ready for promotion! Log habits to upgrade.</Text>
            )}
          </View>
        )}

        {/* Stats */}
        <View style={styles.statsCard}>
          <Text style={styles.statsTitle}>📊 Winter Arc Stats</Text>
          
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Ionicons name="checkmark-circle" size={24} color="#00BFFF" />
              <Text style={styles.statValue}>{stats.totalHabits}</Text>
              <Text style={styles.statLabel}>Active Habits</Text>
            </View>
            
            <View style={styles.statItem}>
              <Ionicons name="trending-up" size={24} color="#00BFFF" />
              <Text style={styles.statValue}>{stats.totalLogs}</Text>
              <Text style={styles.statLabel}>Total Logs</Text>
            </View>
            
            <View style={styles.statItem}>
              <Ionicons name="calendar" size={24} color="#00BFFF" />
              <Text style={styles.statValue}>{stats.averageDaily}</Text>
              <Text style={styles.statLabel}>Daily Average</Text>
            </View>
            
            <View style={styles.statItem}>
              <Ionicons name="flame" size={24} color="#FF6B35" />
              <Text style={styles.statValue}>{stats.bestStreak}</Text>
              <Text style={styles.statLabel}>Record Streak</Text>
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

        {/* Actions */}
        <View style={styles.actionsCard}>
          <TouchableOpacity style={styles.actionButton} onPress={refreshScore}>
            <Ionicons name="refresh" size={20} color="#00BFFF" />
            <Text style={styles.actionButtonText}>Refresh Score</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out" size={20} color="#ff4444" />
            <Text style={styles.logoutButtonText}>Logout</Text>
          </TouchableOpacity>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  refreshButton: {
    padding: 8,
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
  progressCard: {
    backgroundColor: '#1a1a1a',
    margin: 16,
    marginTop: 0,
    borderRadius: 12,
    padding: 16,
  },
  progressTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 12,
  },
  progressItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressLabel: {
    color: '#666666',
    fontSize: 14,
  },
  progressValue: {
    color: '#00BFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  progressReady: {
    color: '#00BFFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  statsCard: {
    backgroundColor: '#1a1a1a',
    margin: 16,
    marginTop: 0,
    borderRadius: 12,
    padding: 16,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statItem: {
    width: '48%',
    alignItems: 'center',
    marginBottom: 16,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
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
  actionsCard: {
    backgroundColor: '#1a1a1a',
    margin: 16,
    marginTop: 0,
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#333333',
    paddingVertical: 12,
    borderRadius: 8,
  },
  actionButtonText: {
    color: '#00BFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#333333',
    paddingVertical: 12,
    borderRadius: 8,
  },
  logoutButtonText: {
    color: '#ff4444',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
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