import MasonryList from "@react-native-seoul/masonry-list"; // 更换瀑布流组件
import { Image } from "expo-image";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  RefreshControl,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { getTravelNotes, searchTravelNotes } from "@/api/api";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";

// 获取屏幕宽度
const { width } = Dimensions.get("window");
const COLUMN_WIDTH = width / 2 - 15; // 两列布局，减去边距

export default function HomeScreen() {
  const [travelNotes, setTravelNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const colorScheme = useColorScheme();

  // 分页相关状态
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const pageSize = 10;

  // 获取游记列表
  const fetchTravelNotes = async (refresh = false) => {
    if (refresh) {
      setRefreshing(true);
      setPage(1);
    } else if (!loadingMore) {
      setLoading(true);
    }
    setError("");

    try {
      const response = await getTravelNotes(refresh ? 1 : page, pageSize);

      if (response) {
        console.log(response);
        // 处理分页信息
        const { data, pagination } = response;

        // 判断是否还有更多数据
        setHasMore(pagination.currentPage < pagination.totalPages);

        // 更新数据
        if (refresh || page === 1) {
          setTravelNotes(data);
        } else {
          setTravelNotes((prev) => [...prev, ...data]);
        }
      }
    } catch (err) {
      console.error("获取游记列表失败:", err);
      setError("获取游记列表失败，请稍后重试");
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  // 加载更多数据
  const handleLoadMore = () => {
    if (!loadingMore && hasMore && !loading && !refreshing) {
      setLoadingMore(true);
      setPage((prev) => prev + 1);

      // 如果有搜索查询，则加载更多搜索结果，否则加载普通游记
      if (searchQuery.trim()) {
        // 直接在这里处理搜索结果的加载更多
        searchTravelNotes(searchQuery, page + 1, pageSize)
          .then((response) => {
            if (response) {
              const { data, pagination } = response;

              // 判断是否还有更多数据
              setHasMore(pagination.currentPage < pagination.totalPages);

              // 追加数据
              setTravelNotes((prev) => [...prev, ...data]);
            }
          })
          .catch((err) => {
            console.error("加载更多搜索结果失败:", err);
            setError("加载更多搜索结果失败，请稍后重试");
          })
          .finally(() => {
            setLoadingMore(false);
          });
      } else {
        fetchTravelNotes(false);
      }
    }
  };

  // 下拉刷新
  const handleRefresh = () => {
    fetchTravelNotes(true);
  };

  // 搜索游记
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      fetchTravelNotes(true);
      return;
    }

    setLoading(true);
    setError("");
    setPage(1); // 重置页码

    try {
      const response = await searchTravelNotes(searchQuery, 1, pageSize);
      if (response) {
        console.log(response);
        const { data, pagination } = response;

        // 判断是否还有更多数据
        setHasMore(pagination.currentPage < pagination.totalPages);

        // 更新数据
        setTravelNotes(data);
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

  // 将游记数据转换为瀑布流需要的格式
  const masonryData = travelNotes.map((item) => {
    // 根据标题长度动态计算高度
    const titleLength = item.title ? item.title.length : 0;
    // 基础高度 + 标题每10个字符增加20高度
    const dynamicHeight = 250 + Math.min(80, Math.floor(titleLength / 10) * 20);

    return {
      id: item._id,
      data: item,
      uri:
        item.imgList && item.imgList.length > 0
          ? item.imgList[0].replace("localhost", "10.0.2.2")
          : "https://via.placeholder.com/300",
      dimensions: { width: COLUMN_WIDTH, height: dynamicHeight },
    };
  });

  // 渲染瀑布流项目
  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.cardContainer}
      onPress={() => router.push(`/trip/${item.data._id}`)}
    >
      <View style={styles.card}>
        <Image
          source={{ uri: item.uri }}
          style={[styles.cardImage, { height: item.dimensions.height * 0.6 }]}
          contentFit="cover"
        />
        <View style={styles.cardContent}>
          <ThemedText
            type="defaultSemiBold"
            numberOfLines={2}
            style={styles.cardTitle}
          >
            {item.data.title}
          </ThemedText>
          <View style={styles.authorContainer}>
            <Image
              source={{
                uri: item.data.userInfo?.avatar
                  ? item.data.userInfo.avatar.replace("localhost", "10.0.2.2")
                  : "https://via.placeholder.com/40",
              }}
              style={styles.avatar}
            />
            <ThemedText style={styles.authorName}>
              {item.data.userInfo?.username || "游客"}
            </ThemedText>
          </View>
        </View>
      </View>
    </TouchableOpacity>
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
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => {
                setSearchQuery("");
                fetchTravelNotes(true);
              }}
              style={styles.clearButton}
            >
              <IconSymbol
                name="xmark.circle.fill"
                size={18}
                color={Colors[colorScheme ?? "light"].tabIconDefault}
              />
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={handleSearch} style={styles.searchButton}>
            <ThemedText style={styles.searchButtonText}>搜索</ThemedText>
          </TouchableOpacity>
        </View>
      </ThemedView>

      {loading && !loadingMore && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator
            size="large"
            color={Colors[colorScheme ?? "light"].tint}
          />
          <ThemedText style={styles.loadingText}>加载中...</ThemedText>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <IconSymbol
            name="exclamationmark.triangle"
            size={60}
            color="#ff4d4f"
          />
          <ThemedText style={styles.errorText}>{error}</ThemedText>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => fetchTravelNotes(true)}
          >
            <ThemedText style={styles.retryButtonText}>重试</ThemedText>
          </TouchableOpacity>
        </View>
      ) : (
        <MasonryList
          data={masonryData}
          keyExtractor={(item: { id: any }) => item.id}
          numColumns={2}
          renderItem={renderItem}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[Colors[colorScheme ?? "light"].tint]}
            />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
          ListFooterComponent={
            loadingMore ? (
              <View style={styles.loadingMore}>
                <ActivityIndicator size="small" color="#999" />
                <ThemedText style={styles.loadingMoreText}>
                  加载更多...
                </ThemedText>
              </View>
            ) : !hasMore && masonryData.length > 0 ? (
              <ThemedText style={styles.noMoreText}>没有更多游记了</ThemedText>
            ) : null
          }
          ListEmptyComponent={
            !loading ? (
              <View style={styles.emptyContainer}>
                <IconSymbol
                  name="photo.on.rectangle.angled"
                  size={60}
                  color="#ccc"
                />
                <ThemedText style={styles.emptyText}>暂无游记</ThemedText>
              </View>
            ) : null
          }
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    marginBottom: 16,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
  },
  clearButton: {
    padding: 5,
  },
  searchButton: {
    backgroundColor: Colors.light.tint,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginLeft: 8,
  },
  searchButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
  listContainer: {
    paddingHorizontal: 8,
    paddingBottom: 20,
  },
  cardContainer: {
    padding: 6,
  },
  card: {
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardImage: {
    width: "100%",
    minHeight: 150,
  },
  cardContent: {
    padding: 12,
  },
  cardTitle: {
    fontSize: 16,
    marginBottom: 8,
  },
  authorContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  avatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 8,
  },
  authorName: {
    fontSize: 14,
    color: "#666",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    marginTop: 10,
    marginBottom: 20,
    fontSize: 16,
    color: "#ff4d4f",
    textAlign: "center",
  },
  retryButton: {
    backgroundColor: Colors.light.tint,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
  },
  retryButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
  loadingMore: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  loadingMoreText: {
    marginLeft: 10,
    fontSize: 14,
    color: "#999",
  },
  noMoreText: {
    textAlign: "center",
    padding: 16,
    fontSize: 14,
    color: "#999",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
    height: 300,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: "#999",
  },
});
