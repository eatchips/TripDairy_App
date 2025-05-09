import { Image } from "expo-image";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  FlatList,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";

// 模拟游记数据
const MOCK_TRIPS = [
  {
    id: "1",
    title: "美丽的杭州西湖之旅",
    coverImage: "https://picsum.photos/id/1018/800/600",
    author: {
      id: "101",
      name: "旅行者小明",
      avatar: "https://randomuser.me/api/portraits/men/32.jpg",
    },
  },
  {
    id: "2",
    title: "北京故宫一日游",
    coverImage: "https://picsum.photos/id/1015/800/600",
    author: {
      id: "102",
      name: "摄影师小红",
      avatar: "https://randomuser.me/api/portraits/women/44.jpg",
    },
  },
];

// 游记卡片组件
interface TripCardProps {
  trip: {
    id: string;
    title: string;
    coverImage: string;
    author: {
      id: string;
      name: string;
      avatar: string;
    };
  };
  onPress: () => void;
}

function TripCard({ trip, onPress }: TripCardProps) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <Image source={{ uri: trip.coverImage }} style={styles.cardImage} />
      <ThemedText type="defaultSemiBold" style={styles.cardTitle}>
        {trip.title}
      </ThemedText>
      <View style={styles.authorContainer}>
        <Image source={{ uri: trip.author.avatar }} style={styles.avatar} />
        <ThemedText>{trip.author.name}</ThemedText>
      </View>
    </TouchableOpacity>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const [trips, setTrips] = useState(MOCK_TRIPS);
  const [searchText, setSearchText] = useState("");

  // 处理搜索功能
  const handleSearch = (text: any) => {
    setSearchText(text);
    if (text) {
      const filtered = MOCK_TRIPS.filter(
        (trip) =>
          trip.title.toLowerCase().includes(text.toLowerCase()) ||
          trip.author.name.toLowerCase().includes(text.toLowerCase())
      );
      setTrips(filtered);
    } else {
      setTrips(MOCK_TRIPS);
    }
  };

  // 处理游记卡片点击
  const handleTripPress = (tripId: any) => {
    router.push(`/trip/${tripId}`);
  };

  // 瀑布流布局的实现
  const renderItem = ({ item, index }) => (
    <View
      style={[
        styles.column,
        index % 2 === 0 ? { paddingRight: 8 } : { paddingLeft: 8 },
      ]}
    >
      <TripCard trip={item} onPress={() => handleTripPress(item.id)} />
    </View>
  );

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.header}>
        <ThemedText type="title" style={styles.headerTitle}>
          旅游日记
        </ThemedText>
        <View style={styles.searchContainer}>
          <IconSymbol
            name="magnifyingglass"
            size={20}
            color={Colors[colorScheme ?? "light"].text}
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="搜索游记标题或作者"
            placeholderTextColor={Colors[colorScheme ?? "light"].tabIconDefault}
            value={searchText}
            onChangeText={handleSearch}
          />
        </View>
      </ThemedView>

      <FlatList
        data={trips}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 50,
  },
  header: {
    padding: 16,
    paddingBottom: 8,
  },
  headerTitle: {
    marginBottom: 16,
    fontSize: 24,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 16,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
  },
  listContainer: {
    padding: 8,
  },
  column: {
    flex: 1,
    marginBottom: 16,
  },
  card: {
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardImage: {
    width: "100%",
    height: 150,
  },
  cardTitle: {
    padding: 8,
    fontSize: 16,
  },
  authorContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
    paddingTop: 0,
  },
  avatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 8,
  },
});
