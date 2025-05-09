import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
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
import { useUserStore } from "@/store/userStore";

// 模拟已注册用户数据
const REGISTERED_USERS = [
  {
    username: "user1",
    nickname: "旅行者小明",
    password: "password123",
    avatar: "https://randomuser.me/api/portraits/men/32.jpg",
  },
  {
    username: "user2",
    nickname: "摄影师小红",
    password: "password123",
    avatar: "https://randomuser.me/api/portraits/women/44.jpg",
  },
];

export default function LoginScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const [isLogin, setIsLogin] = useState(true); // true为登录，false为注册
  
  // 使用zustand store
  const { login, register } = useUserStore();

  // 登录表单状态
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // 注册表单状态
  const [registerUsername, setRegisterUsername] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [nickname, setNickname] = useState("");
  const [avatar, setAvatar] = useState(null);

  // 选择头像
  const pickAvatar = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setAvatar(result.assets[0].uri);
    }
  };

  // 检查昵称是否已存在
  const isNicknameExists = (name) => {
    return REGISTERED_USERS.some((user) => user.nickname === name);
  };

  // 检查用户名是否已存在
  const isUsernameExists = (username) => {
    return REGISTERED_USERS.some((user) => user.username === username);
  };

  // 处理登录
  const handleLogin = async () => {
    if (!loginUsername.trim() || !loginPassword.trim()) {
      Alert.alert("错误", "请输入用户名和密码");
      return;
    }

    const success = await login(loginUsername, loginPassword);
    
    if (success) {
      // 登录成功
      Alert.alert("成功", "登录成功", [
        { text: "确定", onPress: () => router.back() },
      ]);
    } else {
      Alert.alert("错误", "用户名或密码错误");
    }
  };

  // 处理注册
  const handleRegister = async () => {
    // 表单验证
    if (
      !registerUsername.trim() ||
      !registerPassword.trim() ||
      !nickname.trim()
    ) {
      Alert.alert("错误", "请填写所有必填字段");
      return;
    }

    if (registerPassword !== confirmPassword) {
      Alert.alert("错误", "两次输入的密码不一致");
      return;
    }

    if (isUsernameExists(registerUsername)) {
      Alert.alert("错误", "用户名已存在");
      return;
    }

    if (isNicknameExists(nickname)) {
      Alert.alert("错误", "昵称已存在");
      return;
    }

    // 注册成功，这里应该将用户信息保存到数据库
    // 模拟注册成功
    const userData = {
      username: registerUsername,
      password: registerPassword,
      nickname: nickname,
      avatar: avatar || 'https://randomuser.me/api/portraits/lego/1.jpg' // 默认头像
    };
    
    const success = await register(userData);
    
    if (success) {
      Alert.alert("成功", "注册成功，请登录", [
        {
          text: "确定",
          onPress: () => {
            setIsLogin(true);
            setLoginUsername(registerUsername);
            setLoginPassword("");
          },
        },
      ]);
    } else {
      Alert.alert("错误", "注册失败，请稍后再试");
    }
  };

  return (
    <ThemedView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* 顶部导航栏 */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <IconSymbol
                name="chevron.left"
                size={28}
                color={Colors[colorScheme ?? "light"].text}
              />
            </TouchableOpacity>
            <ThemedText type="title">{isLogin ? "登录" : "注册"}</ThemedText>
            <View style={{ width: 28 }} />
          </View>

          {/* 切换登录/注册 */}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tab, isLogin && styles.activeTab]}
              onPress={() => setIsLogin(true)}
            >
              <ThemedText
                style={[styles.tabText, isLogin && styles.activeTabText]}
              >
                登录
              </ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, !isLogin && styles.activeTab]}
              onPress={() => setIsLogin(false)}
            >
              <ThemedText
                style={[styles.tabText, !isLogin && styles.activeTabText]}
              >
                注册
              </ThemedText>
            </TouchableOpacity>
          </View>

          {isLogin ? (
            // 登录表单
            <View style={styles.formContainer}>
              <View style={styles.inputContainer}>
                <ThemedText style={styles.inputLabel}>用户名</ThemedText>
                <TextInput
                  style={styles.input}
                  placeholder="请输入用户名"
                  placeholderTextColor={
                    Colors[colorScheme ?? "light"].tabIconDefault
                  }
                  value={loginUsername}
                  onChangeText={setLoginUsername}
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputContainer}>
                <ThemedText style={styles.inputLabel}>密码</ThemedText>
                <TextInput
                  style={styles.input}
                  placeholder="请输入密码"
                  placeholderTextColor={
                    Colors[colorScheme ?? "light"].tabIconDefault
                  }
                  value={loginPassword}
                  onChangeText={setLoginPassword}
                  secureTextEntry
                />
              </View>

              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleLogin}
              >
                <ThemedText style={styles.submitButtonText}>登录</ThemedText>
              </TouchableOpacity>
            </View>
          ) : (
            // 注册表单
            <View style={styles.formContainer}>
              <View style={styles.avatarContainer}>
                <TouchableOpacity onPress={pickAvatar}>
                  {avatar ? (
                    <Image source={{ uri: avatar }} style={styles.avatar} />
                  ) : (
                    <View style={styles.avatarPlaceholder}>
                      <IconSymbol
                        name="person.fill"
                        size={40}
                        color={Colors[colorScheme ?? "light"].tabIconDefault}
                      />
                    </View>
                  )}
                  <ThemedText style={styles.avatarText}>
                    点击上传头像
                  </ThemedText>
                </TouchableOpacity>
              </View>

              <View style={styles.inputContainer}>
                <ThemedText style={styles.inputLabel}>用户名</ThemedText>
                <TextInput
                  style={styles.input}
                  placeholder="请输入用户名"
                  placeholderTextColor={
                    Colors[colorScheme ?? "light"].tabIconDefault
                  }
                  value={registerUsername}
                  onChangeText={setRegisterUsername}
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputContainer}>
                <ThemedText style={styles.inputLabel}>昵称</ThemedText>
                <TextInput
                  style={styles.input}
                  placeholder="请输入昵称"
                  placeholderTextColor={
                    Colors[colorScheme ?? "light"].tabIconDefault
                  }
                  value={nickname}
                  onChangeText={setNickname}
                />
              </View>

              <View style={styles.inputContainer}>
                <ThemedText style={styles.inputLabel}>密码</ThemedText>
                <TextInput
                  style={styles.input}
                  placeholder="请输入密码"
                  placeholderTextColor={
                    Colors[colorScheme ?? "light"].tabIconDefault
                  }
                  value={registerPassword}
                  onChangeText={setRegisterPassword}
                  secureTextEntry
                />
              </View>

              <View style={styles.inputContainer}>
                <ThemedText style={styles.inputLabel}>确认密码</ThemedText>
                <TextInput
                  style={styles.input}
                  placeholder="请再次输入密码"
                  placeholderTextColor={
                    Colors[colorScheme ?? "light"].tabIconDefault
                  }
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                />
              </View>

              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleRegister}
              >
                <ThemedText style={styles.submitButtonText}>注册</ThemedText>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 30,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
  },
  backButton: {
    padding: 8,
  },
  tabContainer: {
    flexDirection: "row",
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 8,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#ddd",
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
  },
  activeTab: {
    backgroundColor: Colors.light.tint,
  },
  tabText: {
    fontSize: 16,
  },
  activeTabText: {
    color: "#fff",
    fontWeight: "600",
  },
  formContainer: {
    padding: 20,
  },
  avatarContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    marginTop: 8,
    fontSize: 14,
    color: Colors.light.tint,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    marginBottom: 8,
    fontSize: 16,
    fontWeight: "600",
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  submitButton: {
    backgroundColor: Colors.light.tint,
    height: 50,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
