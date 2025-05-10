import { Image } from "expo-image";
import { useRouter } from "expo-router";
import React from "react";
import { Alert, StyleSheet, TouchableOpacity, View } from "react-native";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useUserStore } from "@/store/userStore";

export default function ProfileScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const { user, isLoggedIn, logout } = useUserStore();

  // 处理登出
  const handleLogout = () => {
    Alert.alert("确认登出", "确定要退出登录吗？", [
      { text: "取消", style: "cancel" },
      {
        text: "登出",
        onPress: () => {
          logout();
          // 可选：登出后导航到首页
          router.replace("/");
        },
      },
    ]);
  };

  // 如果未登录，显示登录提示
  if (!isLoggedIn) {
    return (
      <ThemedView style={styles.container}>
        <ThemedView style={styles.loginPrompt}>
          <ThemedText type="subtitle">请先登录</ThemedText>
          <ThemedText style={styles.loginText}>
            登录后才能查看您的个人信息
          </ThemedText>
          <TouchableOpacity
            style={styles.loginButton}
            onPress={() => router.push("/login")}
          >
            <ThemedText style={styles.loginButtonText}>去登录</ThemedText>
          </TouchableOpacity>
        </ThemedView>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.header}>
        <ThemedText type="title">个人信息</ThemedText>
      </ThemedView>

      <ThemedView style={styles.profileContainer}>
        {/* 用户头像 */}
        <View style={styles.avatarContainer}>
          <Image
            source={{ uri: user?.avatar || "https://picsum.photos/200" }}
            style={styles.avatar}
            contentFit="cover"
          />
        </View>

        {/* 用户信息 */}
        <ThemedView style={styles.infoContainer}>
          <ThemedView style={styles.infoItem}>
            <ThemedText type="defaultSemiBold" style={styles.infoLabel}>
              昵称
            </ThemedText>
            <ThemedText style={styles.infoValue}>
              {user?.nickname || "未设置"}
            </ThemedText>
          </ThemedView>

          <ThemedView style={styles.infoItem}>
            <ThemedText type="defaultSemiBold" style={styles.infoLabel}>
              用户名
            </ThemedText>
            <ThemedText style={styles.infoValue}>
              {user?.username || "未设置"}
            </ThemedText>
          </ThemedView>

          <ThemedView style={styles.infoItem}>
            <ThemedText type="defaultSemiBold" style={styles.infoLabel}>
              用户ID
            </ThemedText>
            <ThemedText style={styles.infoValue}>
              {user?.id || "未设置"}
            </ThemedText>
          </ThemedView>
        </ThemedView>

        {/* 登出按钮 */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <IconSymbol
            name="rectangle.portrait.and.arrow.right"
            size={20}
            color="#fff"
          />
          <ThemedText style={styles.logoutButtonText}>退出登录</ThemedText>
        </TouchableOpacity>
      </ThemedView>
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
    marginBottom: 20,
  },
  profileContainer: {
    alignItems: "center",
    padding: 16,
  },
  avatarContainer: {
    marginBottom: 24,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#e0e0e0",
  },
  infoContainer: {
    width: "100%",
    marginBottom: 30,
  },
  infoItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  infoLabel: {
    fontSize: 16,
  },
  infoValue: {
    fontSize: 16,
    color: "#757575",
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F44336", // 红色登出按钮
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    marginTop: 20,
  },
  logoutButtonText: {
    color: "#fff",
    fontSize: 16,
    marginLeft: 8,
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
});
