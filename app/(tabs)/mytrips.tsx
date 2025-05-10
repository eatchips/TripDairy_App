import { Image } from "expo-image";
import { Link, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useUserStore } from "@/store/userStore";
// 导入API
import { deleteTravelNote, getMyPublish } from "@/api/api";

// 状态标签组件
function StatusBadge(props: { status: string }) {
  const { status } = props;
  const colorScheme = useColorScheme();

  let backgroundColor, textColor, text;

  switch (status) {
    case "approved":
    case "1": // 后端可能返回数字状态码
      backgroundColor = "#e6f7e6";
      textColor = "#2e8b57";
      text = "已通过";
      break;
    case "pending":
    case "0": // 待审核
      backgroundColor = "#fff8e6";
      textColor = "#f5a623";
      text = "审核中";
      break;
    case "rejected":
    case "2": // 未通过
      backgroundColor = "#ffebee";
      textColor = "#d32f2f";
      text = "未通过";
      break;
    default:
      backgroundColor = "#e0e0e0";
      textColor = "#757575";
      text = "未知状态";
  }

  return (
    <View style={[styles.badge, { backgroundColor }]}>
      <ThemedText style={{ color: textColor, fontSize: 12 }}>{text}</ThemedText>
    </View>
  );
}

export default function MyTripsScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const [myTrips, setMyTrips] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // 使用zustand store获取登录状态
  const { isLoggedIn, user, logout } = useUserStore();

  // 获取我的游记列表
  const fetchMyTrips = async () => {
    if (!isLoggedIn || !user || !user.id) return;

    setLoading(true);
    setError("");

    try {
      const response = await getMyPublish(user.id);
      if (response) {
        // 根据API返回的数据结构进行适配
        const formattedTrips = response.map((item) => ({
          id: item._id || item.id,
          title: item.title,
          coverImage:
            item.imgList && item.imgList.length > 0
              ? item.imgList[0][0].replace("localhost", "192.168.1.108")
              : "https://picsum.photos/id/1011/800/600",
          status: item.state !== undefined ? String(item.state) : "pending", // 转换状态为字符串
          createdAt: item.date || new Date().toISOString().split("T")[0],
          rejectReason: item.rejectReason,
        }));
        setMyTrips(formattedTrips);
      } else {
        setMyTrips([]);
      }
    } catch (err) {
      console.error("获取游记列表失败:", err);
      setError("获取游记列表失败，请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  // 组件挂载和用户登录状态变化时获取数据
  useEffect(() => {
    if (isLoggedIn && user) {
      fetchMyTrips();
    }
  }, [isLoggedIn, user]);

  // 处理编辑游记
  const handleEdit = (trip: any) => {
    if (trip.status === "approved" || trip.status === "1") {
      Alert.alert("提示", "已通过审核的游记不可编辑");
      return;
    }
    router.push(`/publish?id=${trip.id}`);
  };

  // 处理删除游记
  const handleDelete = (tripId: string) => {
    Alert.alert("确认删除", "确定要删除这篇游记吗？此操作不可撤销。", [
      { text: "取消", style: "cancel" },
      {
        text: "删除",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteTravelNote(tripId);
            // 删除成功后刷新列表
            fetchMyTrips();
            Alert.alert("成功", "游记已删除");
          } catch (err) {
            console.error("删除游记失败:", err);
            Alert.alert("错误", "删除游记失败，请稍后重试");
          }
        },
      },
    ]);
  };

  // 渲染游记项
  const renderTripItem = ({ item }) => (
    <ThemedView style={styles.tripItem}>
      <Image source={{ uri: item.coverImage }} style={styles.tripImage} />
      <ThemedView style={styles.tripContent}>
        <View style={styles.tripHeader}>
          <ThemedText type="defaultSemiBold" style={styles.tripTitle}>
            {item.title}
          </ThemedText>
          <StatusBadge status={item.status} />
        </View>
        <ThemedText style={styles.tripDate}>
          创建于: {item.createdAt}
        </ThemedText>

        {(item.status === "rejected" || item.status === "2") &&
          item.rejectReason && (
            <ThemedView style={styles.rejectReasonContainer}>
              <ThemedText style={styles.rejectReason}>
                拒绝原因: {item.rejectReason}
              </ThemedText>
            </ThemedView>
          )}

        <View style={styles.actionButtons}>
          {(item.status === "pending" ||
            item.status === "rejected" ||
            item.status === "0" ||
            item.status === "2") && (
            <TouchableOpacity
              style={[styles.actionButton, styles.editButton]}
              onPress={() => handleEdit(item)}
            >
              <IconSymbol name="pencil" size={16} color="#fff" />
              <ThemedText style={styles.buttonText}>编辑</ThemedText>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={() => handleDelete(item.id)}
          >
            <IconSymbol name="trash" size={16} color="#fff" />
            <ThemedText style={styles.buttonText}>删除</ThemedText>
          </TouchableOpacity>
        </View>
      </ThemedView>
    </ThemedView>
  );

  // 如果未登录，显示登录提示
  if (!isLoggedIn) {
    return (
      <ThemedView style={styles.container}>
        <ThemedView style={styles.loginPrompt}>
          <ThemedText type="subtitle">请先登录</ThemedText>
          <ThemedText style={styles.loginText}>
            登录后才能查看和管理您的游记
          </ThemedText>
          <Link href="/login" asChild>
            <TouchableOpacity style={styles.loginButton}>
              <ThemedText style={styles.loginButtonText}>去登录</ThemedText>
            </TouchableOpacity>
          </Link>
        </ThemedView>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.header}>
        <ThemedText type="title">我的游记</ThemedText>
        <View style={styles.headerButtons}>
          <Link href="/publish" asChild>
            <TouchableOpacity style={styles.addButton}>
              <IconSymbol name="plus" size={20} color="#fff" />
              <ThemedText style={styles.addButtonText}>发布游记</ThemedText>
            </TouchableOpacity>
          </Link>
        </View>
      </ThemedView>

      {loading ? (
        <ThemedView style={styles.loadingContainer}>
          <ActivityIndicator
            size="large"
            color={Colors[colorScheme ?? "light"].tint}
          />
          <ThemedText style={styles.loadingText}>加载中...</ThemedText>
        </ThemedView>
      ) : error ? (
        <ThemedView style={styles.errorContainer}>
          <IconSymbol
            name="exclamationmark.triangle"
            size={60}
            color={Colors[colorScheme ?? "light"].tabIconDefault}
          />
          <ThemedText style={styles.errorText}>{error}</ThemedText>
          <TouchableOpacity style={styles.retryButton} onPress={fetchMyTrips}>
            <ThemedText style={styles.retryButtonText}>重试</ThemedText>
          </TouchableOpacity>
        </ThemedView>
      ) : myTrips.length > 0 ? (
        <FlatList
          data={myTrips}
          renderItem={({ item }) => (
            <ThemedView style={styles.tripItem}>
              <Image
                source={{ uri: item.coverImage }}
                style={styles.tripImage}
              />
              <ThemedView style={styles.tripContent}>
                <View style={styles.tripHeader}>
                  <ThemedText type="defaultSemiBold" style={styles.tripTitle}>
                    {item.title}
                  </ThemedText>
                  <StatusBadge status={item.status} />
                </View>
                <ThemedText style={styles.tripDate}>
                  创建于: {item.createdAt}
                </ThemedText>

                {(item.status === "rejected" || item.status === "2") &&
                  item.rejectReason && (
                    <ThemedView style={styles.rejectReasonContainer}>
                      <ThemedText style={styles.rejectReason}>
                        拒绝原因: {item.rejectReason}
                      </ThemedText>
                    </ThemedView>
                  )}

                <View style={styles.actionButtons}>
                  {(item.status === "pending" ||
                    item.status === "rejected" ||
                    item.status === "0" ||
                    item.status === "2") && (
                    <TouchableOpacity
                      style={[styles.actionButton, styles.editButton]}
                      onPress={() => handleEdit(item)}
                    >
                      <IconSymbol name="pencil" size={16} color="#fff" />
                      <ThemedText style={styles.buttonText}>编辑</ThemedText>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity
                    style={[styles.actionButton, styles.deleteButton]}
                    onPress={() => handleDelete(item.id)}
                  >
                    <IconSymbol name="trash" size={16} color="#fff" />
                    <ThemedText style={styles.buttonText}>删除</ThemedText>
                  </TouchableOpacity>
                </View>
              </ThemedView>
            </ThemedView>
          )}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
        />
      ) : (
        <ThemedView style={styles.emptyContainer}>
          <IconSymbol
            name="doc.text.image"
            size={60}
            color={Colors[colorScheme ?? "light"].tabIconDefault}
          />
          <ThemedText style={styles.emptyText}>您还没有发布过游记</ThemedText>
          <Link href="/publish" asChild>
            <TouchableOpacity style={styles.createButton}>
              <ThemedText style={styles.createButtonText}>
                创建第一篇游记
              </ThemedText>
            </TouchableOpacity>
          </Link>
        </ThemedView>
      )}
    </ThemedView>
  );
}

// 在样式中添加新的样式
const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 50,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#4CAF50",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addButtonText: {
    color: "#fff",
    marginLeft: 4,
  },
  listContainer: {
    padding: 16,
  },
  tripItem: {
    flexDirection: "row",
    marginBottom: 16,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  tripImage: {
    width: 120,
    height: "100%",
  },
  tripContent: {
    flex: 1,
    padding: 12,
  },
  tripHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  tripTitle: {
    flex: 1,
    fontSize: 16,
  },
  tripDate: {
    fontSize: 12,
    color: "#757575",
    marginBottom: 8,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 8,
  },
  rejectReasonContainer: {
    backgroundColor: "#ffebee",
    padding: 8,
    borderRadius: 4,
    marginBottom: 8,
  },
  rejectReason: {
    fontSize: 12,
    color: "#d32f2f",
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    marginLeft: 8,
  },
  editButton: {
    backgroundColor: "#2196F3",
  },
  deleteButton: {
    backgroundColor: "#F44336",
  },
  buttonText: {
    color: "#fff",
    fontSize: 12,
    marginLeft: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  emptyText: {
    marginTop: 16,
    marginBottom: 24,
    fontSize: 16,
    color: "#757575",
  },
  createButton: {
    backgroundColor: "#4CAF50",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  createButtonText: {
    color: "#fff",
    fontSize: 16,
  },
  loginPrompt: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  loginText: {
    marginTop: 8,
    marginBottom: 24,
    textAlign: "center",
    color: "#757575",
  },
  loginButton: {
    backgroundColor: "#2196F3",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  loginButtonText: {
    color: "#fff",
    fontSize: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#757575",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  errorText: {
    marginTop: 16,
    marginBottom: 24,
    fontSize: 16,
    color: "#d32f2f",
    textAlign: "center",
  },
  retryButton: {
    backgroundColor: "#2196F3",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  retryButtonText: {
    color: "#fff",
    fontSize: 16,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F44336",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginLeft: 8,
  },
  logoutButtonText: {
    color: "#fff",
    marginLeft: 4,
  },
  headerButtons: {
    flexDirection: "row",
  },
});
