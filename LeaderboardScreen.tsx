import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  RefreshControl,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useUserStore } from '../../src/store/userStore';
import { apiService } from '../../src/services/api';

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
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const loadLeaderboard = async () => {
    setIsLoading(true);
    try {
      const data = await apiService.getLeaderboard();
      setLeaderboard(data);
    } catch (error) {
      console.error('Failed to load leaderboard:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadLeaderboard();
    setRefreshing(false);
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

        {item.picture && (
          <Image source={{ uri: item.picture }} style={styles.userAvatar} />
        )}
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

      {/* Current User Rank */}
      {user && leaderboard.length > 0 && (
        <View style={styles.currentRankContainer}>
          {(() => {
            const userEntry = leaderboard.find(entry => entry.user_id === user.id);
            if (userEntry) {
              return (
                <View style={styles.currentRankCard}>
                  <Text style={styles.currentRankTitle}>Your Rank</Text>
                  <View style={styles.currentRankInfo}>
                    <Text style={styles.currentRankNumber}>#{userEntry.rank}</Text>
                    <View style={styles.currentRankStats}>
                      <Text style={styles.currentRankStat}>
                        🏆 {userEntry.total_score} points
                      </Text>
                      <Text style={styles.currentRankStat}>
                        🔥 {userEntry.streak_days} day streak
                      </Text>
                    </View>
                  </View>
                </View>
              );
            } else {
              return (
                <View style={styles.currentRankCard}>
                  <Text style={styles.currentRankTitle}>Build Your Rank</Text>
                  <Text style={styles.noRankText}>
                    Start logging habits to join the leaderboard!
                  </Text>
                </View>
              );
            }
          })()}
        </View>
      )}

      {/* Leaderboard List */}
      <FlatList
        data={leaderboard}
        renderItem={renderLeaderboardItem}
        keyExtractor={(item) => item.user_id}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#00BFFF']}
            tintColor="#00BFFF"
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>❄️ The Frozen Wasteland</Text>
            <Text style={styles.emptyText}>
              No warriors have emerged yet.\nBe the first to claim your place!
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
  currentRankContainer: {
    padding: 16,
  },
  currentRankCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#00BFFF',
  },
  currentRankTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#00BFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  currentRankInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  currentRankNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginRight: 16,
  },
  currentRankStats: {
    flex: 1,
  },
  currentRankStat: {
    color: '#ffffff',
    fontSize: 14,
    marginVertical: 2,
  },
  noRankText: {
    color: '#666666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: 16,
    paddingTop: 0,
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
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginLeft: 12,
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