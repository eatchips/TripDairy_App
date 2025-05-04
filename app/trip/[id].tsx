import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState, useRef, useEffect } from 'react';
import { 
  StyleSheet, 
  TouchableOpacity, 
  View, 
  Dimensions, 
  Share,
  Platform,
  Alert
} from 'react-native';
import { Image } from 'expo-image';
import { Video, ResizeMode } from 'expo-av';
import Carousel from 'react-native-reanimated-carousel';
import ImageView from 'react-native-image-viewing';
import { StatusBar } from 'expo-status-bar';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

// 模拟游记详情数据
const TRIP_DETAILS = {
  '1': {
    id: '1',
    title: '美丽的杭州西湖之旅',
    content: '杭州西湖，简称西湖，是位于浙江省杭州市西湖区龙井路1号的淡水湖，杭州市区西部，景区总面积49平方公里，汇水面积为21.22平方公里，湖面面积为6.38平方公里。\n\n西湖南、西、北三面环山，东邻城区，南部和钱塘江隔山相望，风景秀丽，享有"人间天堂"的美誉。\n\n早在南宋时期，西湖就被划分为十个景区，取名为"西湖十景"，宋代诗人苏轼赞其"欲把西湖比西子，淡妆浓抹总相宜"。',
    images: [
      'https://picsum.photos/id/1018/800/600',
      'https://picsum.photos/id/1015/800/600',
      'https://picsum.photos/id/1019/800/600',
      'https://picsum.photos/id/1016/800/600',
    ],
    video: 'https://d23dyxeqlo5psv.cloudfront.net/big_buck_bunny.mp4',
    createdAt: '2023-10-15',
    author: {
      id: '101',
      name: '旅行者小明',
      avatar: 'https://randomuser.me/api/portraits/men/32.jpg'
    }
  },
  '2': {
    id: '2',
    title: '北京故宫一日游',
    content: '故宫又名紫禁城，是中国明清两代的皇家宫殿，位于北京中轴线的中心，是中国古代宫廷建筑之精华。\n\n故宫以三大殿为中心，占地面积72万平方米，建筑面积约15万平方米，有大小宫殿七十多座，房屋九千余间。是世界上现存规模最大、保存最为完整的木质结构古建筑之一。\n\n故宫于明成祖永乐四年（1406年）开始建设，以南京故宫为蓝本营建，到永乐十八年（1420年）建成。',
    images: [
      'https://picsum.photos/id/1015/800/600',
      'https://picsum.photos/id/1018/800/600',
      'https://picsum.photos/id/1019/800/600',
    ],
    video: null,
    createdAt: '2023-10-20',
    author: {
      id: '102',
      name: '摄影师小红',
      avatar: 'https://randomuser.me/api/portraits/women/44.jpg'
    }
  },
};

export default function TripDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const tripId = params.id as string;
  const colorScheme = useColorScheme();
  const [trip, setTrip] = useState(null);
  const [isFullscreenVideo, setIsFullscreenVideo] = useState(false);
  const [isImageViewVisible, setIsImageViewVisible] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const videoRef = useRef(null);
  const width = Dimensions.get('window').width;
  
  // 加载游记详情
  useEffect(() => {
    if (tripId && TRIP_DETAILS[tripId]) {
      setTrip(TRIP_DETAILS[tripId]);
    } else {
      Alert.alert('错误', '未找到游记详情');
      router.back();
    }
  }, [tripId]);
  
  if (!trip) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ThemedText>加载中...</ThemedText>
      </ThemedView>
    );
  }
  
  // 准备轮播图数据
  const carouselItems = [];
  if (trip.video) {
    carouselItems.push({ type: 'video', uri: trip.video });
  }
  trip.images.forEach(image => {
    carouselItems.push({ type: 'image', uri: image });
  });
  
  // 准备图片查看器数据
  const imageViewImages = trip.images.map(uri => ({ uri }));
  
  // 处理分享
  const handleShare = async () => {
    try {
      const result = await Share.share({
        title: trip.title,
        message: `查看我发现的精彩游记：${trip.title}`,
        url: `https://tripdiary.example.com/trip/${trip.id}`,
      });
    } catch (error) {
      Alert.alert('分享失败', error.message);
    }
  };
  
  // 渲染轮播图项
  const renderCarouselItem = ({ item, index }) => {
    if (item.type === 'video') {
      return (
        <TouchableOpacity 
          style={styles.carouselItem}
          onPress={() => setIsFullscreenVideo(true)}
        >
          <Video
            ref={videoRef}
            source={{ uri: item.uri }}
            style={styles.carouselVideo}
            useNativeControls={false}
            resizeMode={ResizeMode.COVER}
            isLooping
            shouldPlay={false}
          />
          <View style={styles.videoPlayButton}>
            <IconSymbol name="play.fill" size={40} color="#fff" />
          </View>
        </TouchableOpacity>
      );
    } else {
      return (
        <TouchableOpacity 
          style={styles.carouselItem}
          onPress={() => {
            const imageIndex = trip.video ? index - 1 : index;
            setCurrentImageIndex(imageIndex);
            setIsImageViewVisible(true);
          }}
        >
          <Image
            source={{ uri: item.uri }}
            style={styles.carouselImage}
            contentFit="cover"
          />
        </TouchableOpacity>
      );
    }
  };
  
  return (
    <ThemedView style={styles.container}>
      {/* 顶部导航栏 */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <IconSymbol 
            name="chevron.left" 
            size={28} 
            color={Colors[colorScheme ?? 'light'].text} 
          />
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.shareButton}
          onPress={handleShare}
        >
          <IconSymbol 
            name="square.and.arrow.up" 
            size={24} 
            color={Colors[colorScheme ?? 'light'].text} 
          />
        </TouchableOpacity>
      </View>
      
      {/* 内容区域 */}
      <ThemedView style={styles.content}>
        {/* 图片/视频轮播 */}
        <View style={styles.carouselContainer}>
          <Carousel
            width={width}
            height={width * 0.75}
            data={carouselItems}
            renderItem={renderCarouselItem}
            loop={false}
            pagingEnabled={true}
            snapEnabled={true}
          />
          <View style={styles.carouselIndicator}>
            <ThemedText style={styles.indicatorText}>
              {`1/${carouselItems.length}`}
            </ThemedText>
          </View>
        </View>
        
        {/* 游记信息 */}
        <ThemedView style={styles.tripInfo}>
          <ThemedText type="title" style={styles.tripTitle}>{trip.title}</ThemedText>
          
          <View style={styles.authorInfo}>
            <Image source={{ uri: trip.author.avatar }} style={styles.authorAvatar} />
            <ThemedText style={styles.authorName}>{trip.author.name}</ThemedText>
            <ThemedText style={styles.tripDate}>{trip.createdAt}</ThemedText>
          </View>
          
          <ThemedText style={styles.tripContent}>{trip.content}</ThemedText>
        </ThemedView>
      </ThemedView>
      
      {/* 全屏视频播放 */}
      {isFullscreenVideo && (
        <View style={styles.fullscreenVideo}>
          <StatusBar hidden />
          <Video
            source={{ uri: trip.video }}
            style={styles.fullscreenVideoPlayer}
            useNativeControls
            resizeMode={ResizeMode.CONTAIN}
            isLooping
            shouldPlay
          />
          <TouchableOpacity 
            style={styles.closeVideoButton}
            onPress={() => setIsFullscreenVideo(false)}
          >
            <IconSymbol name="xmark" size={30} color="#fff" />
          </TouchableOpacity>
        </View>
      )}
      
      {/* 图片查看器 */}
      <ImageView
        images={imageViewImages}
        imageIndex={currentImageIndex}
        visible={isImageViewVisible}
        onRequestClose={() => setIsImageViewVisible(false)}
        swipeToCloseEnabled
        doubleTapToZoomEnabled
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 50 : 16,
    paddingBottom: 16,
    zIndex: 10,
  },
  backButton: {
    padding: 8,
  },
  shareButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  carouselContainer: {
    position: 'relative',
  },
  carouselItem: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  carouselImage: {
    width: '100%',
    height: '100%',
  },
  carouselVideo: {
    width: '100%',
    height: '100%',
  },
  videoPlayButton: {
    position: 'absolute',
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 40,
    padding: 15,
  },
  carouselIndicator: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  indicatorText: {
    color: '#fff',
    fontSize: 12,
  },
  tripInfo: {
    padding: 16,
  },
  tripTitle: {
    fontSize: 24,
    marginBottom: 16,
  },
  authorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  authorAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  authorName: {
    fontSize: 16,
    fontWeight: '600',
    marginRight: 12,
  },
  tripDate: {
    fontSize: 14,
    color: '#888',
  },
  tripContent: {
    fontSize: 16,
    lineHeight: 24,
  },
  fullscreenVideo: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
    zIndex: 100,
  },
  fullscreenVideoPlayer: {
    flex: 1,
  },
  closeVideoButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 16,
    right: 16,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    padding: 8,
  },
});