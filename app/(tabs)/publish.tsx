import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as VideoThumbnails from 'expo-video-thumbnails';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

// 模拟游记数据
const MY_TRIPS = [
  {
    id: '1',
    title: '三亚海滩度假',
    content: '这是一次美妙的三亚之旅...',
    images: ['https://picsum.photos/id/1011/800/600'],
    video: null,
    status: 'approved',
    createdAt: '2023-10-15',
  },
  {
    id: '2',
    title: '重庆洪崖洞夜景',
    content: '重庆的夜景真的很美...',
    images: ['https://picsum.photos/id/1015/800/600'],
    video: null,
    status: 'pending',
    createdAt: '2023-10-20',
  },
  {
    id: '3',
    title: '西安兵马俑一日游',
    content: '兵马俑真是令人震撼...',
    images: ['https://picsum.photos/id/1019/800/600'],
    video: null,
    status: 'rejected',
    rejectReason: '内容不符合社区规范，请修改后重新提交',
    createdAt: '2023-10-25',
  },
];

export default function PublishScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const tripId = params.id as string;
  const colorScheme = useColorScheme();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  // 表单状态
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [video, setVideo] = useState<string | null>(null);
  const [videoThumbnail, setVideoThumbnail] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  
  // 检查登录状态
  useEffect(() => {
    // 这里应该是实际的登录状态检查逻辑
    // 暂时模拟为已登录
    setIsLoggedIn(true);
  }, []);
  
  // 如果是编辑模式，加载现有游记数据
  useEffect(() => {
    if (tripId) {
      const trip = MY_TRIPS.find(t => t.id === tripId);
      if (trip) {
        setTitle(trip.title);
        setContent(trip.content);
        setImages(trip.images);
        setVideo(trip.video);
        if (trip.video) {
          generateThumbnail(trip.video);
        }
        setIsEditing(true);
      }
    }
  }, [tripId]);
  
  // 生成视频缩略图
  const generateThumbnail = async (videoUri: string) => {
    try {
      const { uri } = await VideoThumbnails.getThumbnailAsync(
        videoUri,
        { time: 1000 }
      );
      setVideoThumbnail(uri);
    } catch (e) {
      console.warn('无法生成视频缩略图:', e);
    }
  };
  
  // 选择图片
  const pickImage = async () => {
    if (images.length >= 9) {
      Alert.alert('提示', '最多只能上传9张图片');
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
    if (video) {
      Alert.alert('提示', '只能上传一个视频，请先删除现有视频');
      return;
    }
    
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });
    
    if (!result.canceled) {
      const videoUri = result.assets[0].uri;
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
      Alert.alert('错误', '请输入游记标题');
      return false;
    }
    
    if (!content.trim()) {
      Alert.alert('错误', '请输入游记内容');
      return false;
    }
    
    if (images.length === 0) {
      Alert.alert('错误', '请至少上传一张图片');
      return false;
    }
    
    return true;
  };
  
  // 提交表单
  const handleSubmit = () => {
    if (!validateForm()) return;
    
    // 这里应该是实际的提交逻辑，包括上传图片和视频
    // 暂时只是模拟成功
    Alert.alert(
      '成功',
      isEditing ? '游记更新成功' : '游记发布成功',
      [
        { 
          text: '确定', 
          onPress: () => router.push('/mytrips')
        }
      ]
    );
  };
  
  // 如果未登录，显示登录提示
  if (!isLoggedIn) {
    return (
      <ThemedView style={styles.container}>
        <ThemedView style={styles.loginPrompt}>
          <ThemedText type="subtitle">请先登录</ThemedText>
          <ThemedText style={styles.loginText}>
            登录后才能发布游记
          </ThemedText>
          <TouchableOpacity 
            style={styles.loginButton}
            onPress={() => router.push('/login')}
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
        <ThemedText type="title">{isEditing ? '编辑游记' : '发布游记'}</ThemedText>
      </ThemedView>
      
      <ScrollView style={styles.formContainer}>
        {/* 标题输入 */}
        <ThemedView style={styles.inputContainer}>
          <ThemedText type="defaultSemiBold">标题</ThemedText>
          <TextInput
            style={styles.titleInput}
            placeholder="请输入游记标题"
            placeholderTextColor={Colors[colorScheme ?? 'light'].tabIconDefault}
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
            placeholderTextColor={Colors[colorScheme ?? 'light'].tabIconDefault}
            value={content}
            onChangeText={setContent}
            multiline
            textAlignVertical="top"
          />
        </ThemedView>
        
        {/* 图片上传 */}
        <ThemedView style={styles.inputContainer}>
          <ThemedText type="defaultSemiBold">图片</ThemedText>
          <ThemedText style={styles.tip}>请至少上传一张图片（最多9张）</ThemedText>
          
          <View style={styles.imageGrid}>
            {images.map((uri, index) => (
              <View key={index} style={styles.imageContainer}>
                <Image source={{ uri }} style={styles.image} />
                <TouchableOpacity 
                  style={styles.removeButton}
                  onPress={() => removeImage(index)}
                >
                  <IconSymbol name="xmark.circle.fill" size={24} color="#ff4d4f" />
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
                  color={Colors[colorScheme ?? 'light'].tabIconDefault} 
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
                <Image source={{ uri: videoThumbnail }} style={styles.videoThumbnail} />
              ) : (
                <View style={styles.videoPlaceholder}>
                  <IconSymbol 
                    name="video.fill" 
                    size={40} 
                    color={Colors[colorScheme ?? 'light'].tabIconDefault} 
                  />
                </View>
              )}
              <TouchableOpacity 
                style={styles.removeButton}
                onPress={removeVideo}
              >
                <IconSymbol name="xmark.circle.fill" size={24} color="#ff4d4f" />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.playButton}
                onPress={() => {
                  // 这里应该是播放视频的逻辑
                  Alert.alert('提示', '视频播放功能尚未实现');
                }}
              >
                <IconSymbol name="play.fill" size={30} color="#fff" />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity 
              style={styles.addVideoButton}
              onPress={pickVideo}
            >
              <IconSymbol 
                name="video.badge.plus" 
                size={40} 
                color={Colors[colorScheme ?? 'light'].tabIconDefault} 
              />
              <ThemedText>添加视频</ThemedText>
            </TouchableOpacity>
          )}
        </ThemedView>
        
        {/* 提交按钮 */}
        <TouchableOpacity 
          style={styles.submitButton}
          onPress={handleSubmit}
        >
          <ThemedText style={styles.submitButtonText}>
            {isEditing ? '更新游记' : '发布游记'}
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
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginTop: 8,
  },
  contentInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginTop: 8,
    height: 150,
  },
  tip: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
    marginBottom: 8,
  },
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  imageContainer: {
    width: '30%',
    aspectRatio: 1,
    margin: '1.5%',
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  removeButton: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 12,
  },
  addImageButton: {
    width: '30%',
    aspectRatio: 1,
    margin: '1.5%',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoContainer: {
    width: '100%',
    aspectRatio: 16/9,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
    marginTop: 8,
  },
  videoThumbnail: {
    width: '100%',
    height: '100%',
  },
  videoPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButton: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -15 }, { translateY: -15 }],
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addVideoButton: {
    width: '100%',
    aspectRatio: 16/9,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  submitButton: {
    backgroundColor: '#0a7ea4',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  loginPrompt: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loginText: {
    marginTop: 10,
    marginBottom: 20,
    textAlign: 'center',
  },
  loginButton: {
    backgroundColor: '#0a7ea4',
    borderRadius: 8,
    padding: 16,
    width: '80%',
    alignItems: 'center',
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});