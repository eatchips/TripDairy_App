import * as ImagePicker from "expo-image-picker";
import { Link, useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import * as VideoThumbnails from "expo-video-thumbnails";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { getTravelNoteDetail, publishTravelNote, uploadImg, uploadVideo } from "@/api/api";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useUserStore } from "@/store/userStore";

// 模拟游记数据
const MY_TRIPS = [
  {
    id: "1",
    title: "三亚海滩度假",
    content: "这是一次美妙的三亚之旅...",
    images: ["https://picsum.photos/id/1011/800/600"],
    video: null,
    status: "approved",
    createdAt: "2023-10-15",
  },
  {
    id: "2",
    title: "重庆洪崖洞夜景",
    content: "重庆的夜景真的很美...",
    images: ["https://picsum.photos/id/1015/800/600"],
    video: null,
    status: "pending",
    createdAt: "2023-10-20",
  },
  {
    id: "3",
    title: "西安兵马俑一日游",
    content: "兵马俑真是令人震撼...",
    images: ["https://picsum.photos/id/1019/800/600"],
    video: null,
    status: "rejected",
    rejectReason: "内容不符合社区规范，请修改后重新提交",
    createdAt: "2023-10-25",
  },
];

// 在组件内部添加状态和API调用
export default function PublishScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const params = useLocalSearchParams();
  const tripId = params.id as string;
  const { id } = params;
  const colorScheme = useColorScheme();
  
  // 添加一个标记，用于跟踪组件是否已卸载
  const isMounted = useRef(true);
  // 添加一个标记，用于跟踪是否已经加载过数据
  const dataLoaded = useRef(false);

  // 使用zustand store获取登录状态
  const { isLoggedIn, user } = useUserStore();

  // 表单状态
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [video, setVideo] = useState<string | null>(null);
  const [videoThumbnail, setVideoThumbnail] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [uploading, setUploading] = useState(false);

  // 清空所有表单数据的函数
  const clearFormData = () => {
    if (isMounted.current) {
      setTitle("");
      setContent("");
      setImages([]);
      setVideo(null);
      setVideoThumbnail(null);
      setIsEditing(false);
      // 重置数据加载标记
      dataLoaded.current = false;
    }
  };

  // 监听页面焦点变化
  useEffect(() => {
    // 设置组件挂载标记
    isMounted.current = true;
    
    // 添加焦点监听器
    const unsubscribeFocus = navigation.addListener('focus', () => {
      console.log('发布页面获得焦点，tripId:', tripId);
      // 重置数据加载标记，允许重新加载数据
      dataLoaded.current = false;
    });
    
    // 组件卸载时清理
    return () => {
      isMounted.current = false;
      unsubscribeFocus();
    };
  }, [navigation]);

  // 如果是编辑模式，加载现有游记数据
  useEffect(() => {
    // 只有当组件挂载且数据未加载过时才加载数据
    if (tripId && !dataLoaded.current && isMounted.current) {
      console.log("准备加载游记数据，tripId:", tripId);
      
      // 使用API获取游记详情
      const fetchTripDetail = async () => {
        try {
          setUploading(true); // 显示加载状态
          const response = await getTravelNoteDetail(tripId);
          console.log("获取游记详情成功:", response);
          
          if (response && isMounted.current) {
            setTitle(response.title || "");
            setContent(response.content || "");
            
            // 处理图片列表
            if (response.imgList && response.imgList.length > 0) {
              // 替换localhost为10.0.2.2以在模拟器中正确显示
              const formattedImages = response.imgList.map((img: string) => 
                img.replace("localhost", "10.0.2.2")
              );
              setImages(formattedImages);
            } else {
              setImages([]);
            }
            
            // 处理视频
            if (response.video) {
              const videoUrl = response.video.replace("localhost", "10.0.2.2");
              setVideo(videoUrl);
              generateThumbnail(videoUrl);
            } else {
              setVideo(null);
              setVideoThumbnail(null);
            }
            
            setIsEditing(true);
            // 标记数据已加载
            dataLoaded.current = true;
          }
        } catch (error) {
          console.error("获取游记详情失败:", error);
          Alert.alert("错误", "获取游记详情失败，请稍后重试");
        } finally {
          if (isMounted.current) {
            setUploading(false);
          }
        }
      };
      
      fetchTripDetail();
    } else if (!tripId && isMounted.current) {
      // 如果没有tripId，清空表单
      clearFormData();
    }
  }, [tripId]);

  // 生成视频缩略图
  const generateThumbnail = async (videoUri: string) => {
    try {
      const { uri } = await VideoThumbnails.getThumbnailAsync(videoUri, {
        time: 1000,
      });
      setVideoThumbnail(uri);
    } catch (e) {
      console.warn("无法生成视频缩略图:", e);
    }
  };

  // 上传图片
  const handleImageUpload = async (imageUri: string) => {
    if (!imageUri) return null;

    const formData = new FormData();
    const filename = imageUri.split("/").pop();
    const match = /\.(\w+)$/.exec(filename as string);
    const type = match ? `image/${match[1]}` : "image";

    formData.append("file", {
      uri: imageUri,
      name: filename,
      type,
    } as any);

    try {
      console.log("上传图片数据: ", formData);
      const response = await uploadImg(formData);
      console.log("上传图片成功:", response);
      return response; // 返回上传后的图片URL
    } catch (error) {
      console.error("上传图片失败:", error);
      throw error;
    }
  };

  // 上传视频
  const handleVideoUpload = async (videoUri: string) => {
    console.log("开始上传视频:", videoUri);
    if (!videoUri) return null;

    const formData = new FormData();
    const filename = videoUri.split("/").pop();
    const match = /\.(\w+)$/.exec(filename as string);
    const type = match ? `video/${match[1]}` : "video/mp4";

    formData.append("video", {
      uri: videoUri,
      name: filename,
      type,
    } as any);

    try {
      // 增加超时时间，视频上传需要更长时间
      console.log("上传视频数据: ", formData);
      const response = await uploadVideo(formData);
      console.log("上传视频成功，完整响应:", JSON.stringify(response));
      return response.path; // 使用response.path
    } catch (error) {
      console.error("上传视频失败，详细错误:", error);
      throw error;
    }
  };

  // 选择图片
  const pickImage = async () => {
    if (images.length >= 9) {
      Alert.alert("提示", "最多只能上传9张图片");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setImages([...images, result.assets[0].uri]);
    }
  };

  // 选择视频
  const pickVideo = async () => {
    console.log("开始选择视频");
    if (video) {
      Alert.alert("提示", "只能上传一个视频，请先删除现有视频");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });
    console.log("选择视频结果:", result);
    if (!result.canceled) {
      const videoUri = result.assets[0].uri;
      console.log("选择的视频URI:", videoUri);
      setVideo(videoUri);
      generateThumbnail(videoUri);
    }
  };

  // 删除图片
  const removeImage = (index: number) => {
    const newImages = [...images];
    newImages.splice(index, 1);
    setImages(newImages);
  };

  // 删除视频
  const removeVideo = () => {
    setVideo(null);
    setVideoThumbnail(null);
  };

  // 表单验证
  const validateForm = () => {
    if (!title.trim()) {
      Alert.alert("错误", "请输入游记标题");
      return false;
    }

    if (!content.trim()) {
      Alert.alert("错误", "请输入游记内容");
      return false;
    }

    if (images.length === 0) {
      Alert.alert("错误", "请至少上传一张图片");
      return false;
    }

    return true;
  };

  // 发布游记
  const handlePublish = async () => {
    if (!isLoggedIn || !user) {
      Alert.alert("提示", "请先登录");
      return;
    }

    if (!validateForm()) return;

    setUploading(true);

    try {
      // 上传图片
      const uploadedImages = await Promise.all(
        images.map((img) => handleImageUpload(img))
      );

      // 上传视频（如果有）
      let videoUrl = null;
      if (video) {
        videoUrl = await handleVideoUpload(video);
      }

      // 发布游记
      const travelNoteData = {
        id: id, // 如果是编辑模式，会有id
        title,
        content,
        imgList: uploadedImages.filter(Boolean),
        openid: user.id,
        videoUrl,
      };

      await publishTravelNote(travelNoteData as any);

      // 清空所有表单内容
      setTitle("");
      setContent("");
      setImages([]);
      setVideo(null);
      setVideoThumbnail(null);
      setIsEditing(false);

      Alert.alert("成功", "游记发布成功，等待审核", [
        { text: "确定", onPress: () => router.back() },
      ]);
    } catch (error) {
      console.error("发布游记失败:", error);
      Alert.alert("错误", "发布失败，请稍后重试");
    } finally {
      setUploading(false);
    }
  };

  // 提交表单 - 整合了模拟提交和实际API提交
  const handleSubmit = () => {
    // 使用实际API提交
    handlePublish();
  };

  // 如果未登录，显示登录提示
  if (!isLoggedIn) {
    return (
      <ThemedView style={styles.container}>
        <ThemedView style={styles.loginPrompt}>
          <ThemedText type="subtitle">请先登录</ThemedText>
          <ThemedText style={styles.loginText}>登录后才能发布游记</ThemedText>
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
        <ThemedText type="title">
          {isEditing ? "编辑游记" : "发布游记"}
        </ThemedText>
      </ThemedView>

      <ScrollView style={styles.formContainer}>
        {/* 标题输入 */}
        <ThemedView style={styles.inputContainer}>
          <ThemedText type="defaultSemiBold">标题</ThemedText>
          <TextInput
            style={styles.titleInput}
            placeholder="请输入游记标题"
            placeholderTextColor={Colors[colorScheme ?? "light"].tabIconDefault}
            value={title}
            onChangeText={setTitle}
            maxLength={50}
          />
        </ThemedView>

        {/* 内容输入 */}
        <ThemedView style={styles.inputContainer}>
          <ThemedText type="defaultSemiBold">内容</ThemedText>
          <TextInput
            style={styles.contentInput}
            placeholder="请输入游记内容"
            placeholderTextColor={Colors[colorScheme ?? "light"].tabIconDefault}
            value={content}
            onChangeText={setContent}
            multiline
            textAlignVertical="top"
          />
        </ThemedView>

        {/* 图片上传 */}
        <ThemedView style={styles.inputContainer}>
          <ThemedText type="defaultSemiBold">图片</ThemedText>
          <ThemedText style={styles.tip}>
            请至少上传一张图片（最多9张）
          </ThemedText>

          <View style={styles.imageGrid}>
            {images.map((uri, index) => (
              <View key={index} style={styles.imageContainer}>
                <Image source={{ uri }} style={styles.image} />
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => removeImage(index)}
                >
                  <IconSymbol
                    name="xmark.circle.fill"
                    size={24}
                    color="#ff4d4f"
                  />
                </TouchableOpacity>
              </View>
            ))}

            {images.length < 9 && (
              <TouchableOpacity
                style={styles.addImageButton}
                onPress={pickImage}
              >
                <IconSymbol
                  name="plus"
                  size={40}
                  color={Colors[colorScheme ?? "light"].tabIconDefault}
                />
              </TouchableOpacity>
            )}
          </View>
        </ThemedView>

        {/* 视频上传 */}
        <ThemedView style={styles.inputContainer}>
          <ThemedText type="defaultSemiBold">视频</ThemedText>
          <ThemedText style={styles.tip}>可选，最多上传一个视频</ThemedText>

          {video ? (
            <View style={styles.videoContainer}>
              {videoThumbnail ? (
                <Image
                  source={{ uri: videoThumbnail }}
                  style={styles.videoThumbnail}
                />
              ) : (
                <View style={styles.videoPlaceholder}>
                  <IconSymbol
                    name="video.fill"
                    size={40}
                    color={Colors[colorScheme ?? "light"].tabIconDefault}
                  />
                </View>
              )}
              <TouchableOpacity
                style={styles.removeButton}
                onPress={removeVideo}
              >
                <IconSymbol
                  name="xmark.circle.fill"
                  size={24}
                  color="#ff4d4f"
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.playButton}
                onPress={() => {
                  // 这里应该是播放视频的逻辑
                  Alert.alert("提示", "视频播放功能尚未实现");
                }}
              >
                <IconSymbol name="play.fill" size={30} color="#fff" />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.addVideoButton} onPress={pickVideo}>
              <IconSymbol
                name="video.badge.plus"
                size={40}
                color={Colors[colorScheme ?? "light"].tabIconDefault}
              />
              <ThemedText>添加视频</ThemedText>
            </TouchableOpacity>
          )}
        </ThemedView>

        {/* 提交按钮 */}
        <TouchableOpacity
          style={styles.submitButton}
          onPress={handleSubmit}
          disabled={uploading}
        >
          <ThemedText style={styles.submitButtonText}>
            {uploading ? "上传中..." : isEditing ? "更新游记" : "发布游记"}
          </ThemedText>
        </TouchableOpacity>
      </ScrollView>
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
  formContainer: {
    flex: 1,
    padding: 16,
  },
  inputContainer: {
    marginBottom: 20,
  },
  titleInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginTop: 8,
  },
  contentInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginTop: 8,
    height: 150,
  },
  tip: {
    fontSize: 14,
    color: "#999",
    marginTop: 4,
    marginBottom: 8,
  },
  imageGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 8,
  },
  imageContainer: {
    width: "30%",
    aspectRatio: 1,
    margin: "1.5%",
    borderRadius: 8,
    overflow: "hidden",
    position: "relative",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  removeButton: {
    position: "absolute",
    top: 5,
    right: 5,
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    borderRadius: 12,
  },
  addImageButton: {
    width: "30%",
    aspectRatio: 1,
    margin: "1.5%",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
  },
  videoContainer: {
    width: "100%",
    aspectRatio: 16 / 9,
    borderRadius: 8,
    overflow: "hidden",
    position: "relative",
    marginTop: 8,
  },
  videoThumbnail: {
    width: "100%",
    height: "100%",
  },
  videoPlaceholder: {
    width: "100%",
    height: "100%",
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
  },
  playButton: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: [{ translateX: -15 }, { translateY: -15 }],
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  addVideoButton: {
    width: "100%",
    aspectRatio: 16 / 9,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
  },
  submitButton: {
    backgroundColor: "#0a7ea4",
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
    marginTop: 20,
    marginBottom: 40,
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  loginPrompt: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loginText: {
    marginTop: 10,
    marginBottom: 20,
    textAlign: "center",
  },
  loginButton: {
    backgroundColor: "#0a7ea4",
    borderRadius: 8,
    padding: 16,
    width: "80%",
    alignItems: "center",
  },
  loginButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
});
