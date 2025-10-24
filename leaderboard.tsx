import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useUserStore } from '../src/store/userStore';
import { apiService } from '../src/services/api';

interface LeaderboardEntry {
  user_id: string;
  name: string;
  picture?: string;
  total_score: number;
  streak_days: number;
  winter_title: string;
  rank: number;
}

const RANK_COLORS = {
  1: '#FFD700', // Gold
  2: '#C0C0C0', // Silver
  3: '#CD7F32', // Bronze
};

const getRankIcon = (rank: number) => {
  switch (rank) {
    case 1:
      return 'trophy';
    case 2:
      return 'medal';
    case 3:
      return 'medal';
    default:
      return 'chevron-forward';
  }
};

const getTitleEmoji = (title: string) => {
  switch (title) {
    case 'Ice Emperor':
      return '👑';
    case 'Frozen Warrior':
      return '⚔️';
    case 'Winter Guardian':
      return '🛡️';
    case 'Frost Walker':
      return '🥾';
    case 'Ice Apprentice':
      return '🧙‍♂️';
    default:
      return '❄️';
  }
};

export default function LeaderboardScreen() {
  const { user } = useUserStore();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
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
    }
    loadLeaderboard();
  }, []);

  const loadLeaderboard = async () => {
    setIsLoading(true);
    try {
      const data = await apiService.getLeaderboard();
      setLeaderboard(data);
    } catch (error) {
      console.error('Failed to load leaderboard:', error);
      // Add demo data for testing
      const demoData = [
        {
          user_id: 'demo-user',
          name: 'Winter Warrior',
          total_score: 0,
          streak_days: 0,
          winter_title: 'Frozen Recruit',
          rank: 1
        }
      ];
      setLeaderboard(demoData);
    } finally {
      setIsLoading(false);
    }
  };

  const renderLeaderboardItem = ({ item }: { item: LeaderboardEntry }) => {
    const isCurrentUser = user?.id === item.user_id;
    const rankColor = RANK_COLORS[item.rank as keyof typeof RANK_COLORS] || '#00BFFF';
    
    return (
      <View style={[styles.leaderboardItem, isCurrentUser && styles.currentUserItem]}>
        <View style={styles.rankContainer}>
          <Text style={[styles.rankText, { color: rankColor }]}>
            #{item.rank}
          </Text>
          <Ionicons
            name={getRankIcon(item.rank) as any}
            size={20}
            color={rankColor}
          />
        </View>

        <View style={styles.userInfo}>
          <View style={styles.userHeader}>
            <View style={styles.userNameContainer}>
              <Text style={[styles.userName, isCurrentUser && styles.currentUserText]}>
                {item.name}
              </Text>
              {isCurrentUser && (
                <Text style={styles.youBadge}>YOU</Text>
              )}
            </View>
            <Text style={styles.userTitle}>
              {getTitleEmoji(item.winter_title)} {item.winter_title}
            </Text>
          </View>

          <View style={styles.userStats}>
            <View style={styles.statItem}>
              <Ionicons name="star" size={16} color="#FFD700" />
              <Text style={styles.statText}>{item.total_score} pts</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="flame" size={16} color="#FF6B35" />
              <Text style={styles.statText}>{item.streak_days} days</Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>❄️ Frozen Warriors</Text>
        <Text style={styles.headerSubtitle}>Winter Arc Leaderboard</Text>
      </View>

      {/* Leaderboard List */}
      <FlatList
        data={leaderboard}
        renderItem={renderLeaderboardItem}
        keyExtractor={(item) => item.user_id}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>❄️ The Frozen Wasteland</Text>
            <Text style={styles.emptyText}>
              No warriors have emerged yet.{"\n"}Be the first to claim your place!
            </Text>
          </View>
        }
      />
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
  list: {
    flex: 1,
  },
  listContent: {
    padding: 16,
  },
  leaderboardItem: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  currentUserItem: {
    borderWidth: 2,
    borderColor: '#00BFFF',
    backgroundColor: '#001a33',
  },
  rankContainer: {
    alignItems: 'center',
    marginRight: 16,
    width: 40,
  },
  rankText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  userInfo: {
    flex: 1,
  },
  userHeader: {
    marginBottom: 8,
  },
  userNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
  currentUserText: {
    color: '#00BFFF',
  },
  youBadge: {
    backgroundColor: '#00BFFF',
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 8,
  },
  userTitle: {
    fontSize: 14,
    color: '#00BFFF',
    fontWeight: '500',
  },
  userStats: {
    flexDirection: 'row',
    gap: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    color: '#ffffff',
    fontSize: 14,
    marginLeft: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 24,
  },
});
