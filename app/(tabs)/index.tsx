import { Image } from "expo-image";
import React from "react";
import {
  FlatList,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { Colors } from "@/constants/Colors";

// 在文件顶部导入API
import { getTravelNotes, searchTravelNotes } from "@/api/api";
import { router } from "expo-router";
import { useEffect, useState } from "react";

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
    _id: string;
    title: string;
    imgList: string[];
    userInfo: {
      _id: string;
      username: string;
      avatar: string;
    };
  };
  onPress: () => void;
}

function TripCard({ trip, onPress }: TripCardProps) {
  const [imageReady, setImageReady] = useState(false);
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null);

  useEffect(() => {
    // 检查imgList是否存在且有元素
    if (trip.imgList && trip.imgList.length > 0) {
      try {
        console.log("处理图片URL");
        const imageUrl = trip.imgList[0].replace("localhost", "192.168.1.108");
        setCoverImageUrl(imageUrl);
      } catch (error) {
        console.error("处理图片URL时出错:", error);
        setCoverImageUrl(null);
      }
    }
  }, [trip.imgList]);

  const handleImageLoad = () => {
    setImageReady(true);
  };

  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      {coverImageUrl ? (
        <Image
          source={{ uri: coverImageUrl }}
          style={styles.cardImage}
          onLoad={handleImageLoad}
        />
      ) : null}
      <ThemedText type="defaultSemiBold" style={styles.cardTitle}>
        {trip.title}
      </ThemedText>
      <View style={styles.authorContainer}>
        <Image source={{ uri: trip.userInfo.avatar }} style={styles.avatar} />
        <ThemedText>{trip.userInfo.username}</ThemedText>
      </View>
    </TouchableOpacity>
  );
}

// 在组件内部添加状态和API调用
export default function TabOneScreen() {
  const [travelNotes, setTravelNotes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const colorScheme = useColorScheme();
  const [searchQuery, setSearchQuery] = useState("");

  // 获取游记列表
  const fetchTravelNotes = async () => {
    console.log("获取游记");
    setLoading(true);
    setError("");

    try {
      const response = await getTravelNotes();
      if (response) {
        console.log("获取游记成功", response);
        setTravelNotes(response as any);
      }
    } catch (err) {
      console.error("获取游记列表失败:", err);
      setError("获取游记列表失败，请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  // 搜索游记
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      fetchTravelNotes();
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await searchTravelNotes(searchQuery);
      if (response && response.data) {
        setTravelNotes(response.data);
      }
    } catch (err) {
      console.error("搜索游记失败:", err);
      setError("搜索游记失败，请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  // 组件挂载时获取数据
  useEffect(() => {
    fetchTravelNotes();
  }, []);

  // 在组件中添加搜索框和加载状态
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
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <TouchableOpacity onPress={handleSearch} style={styles.searchButton}>
            <ThemedText style={styles.searchButtonText}>搜索</ThemedText>
          </TouchableOpacity>
        </View>
      </ThemedView>

      <FlatList
        data={travelNotes}
        renderItem={({ item }) => (
          <TripCard
            trip={item}
            onPress={() => {
              console.log("跳转到游记详情，ID:", item._id); // 添加日志
              router.push(`/trip/${item._id}`);
            }}
          />
        )}
        keyExtractor={(item) => item._id}
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
    paddingHorizontal: 4, // 减小水平内边距，让两个卡片之间的间距更合理
  },
  card: {
    flex: 1, // 让卡片平均分配空间
    margin: 4, // 设置卡片间距
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
    height: 120, // 调整图片高度，使其在小尺寸下更合适
    backgroundColor: "#f0f0f0", // 添加背景色，在图片加载前显示
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
  searchButton: {
    backgroundColor: "#0a7ea4",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginLeft: 8,
  },
  searchButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
});
