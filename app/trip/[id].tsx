import { getTravelNoteDetail } from "@/api/api";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useVideoPlayer, VideoView } from "expo-video";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Dimensions,
  Platform,
  Share,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import ImageView from "react-native-image-viewing";
import Carousel from "react-native-reanimated-carousel";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { Colors } from "@/constants/Colors";
import formatDateTime from "@/utils/formatDateTime";
// 移除暗色主题判断导入
// import { useColorScheme } from "@/hooks/useColorScheme";

// 模拟游记详情数据
const TRIP_DETAILS = {
  "1": {
    id: "1",
    title: "美丽的杭州西湖之旅",
    content:
      '杭州西湖，简称西湖，是位于浙江省杭州市西湖区龙井路1号的淡水湖，杭州市区西部，景区总面积49平方公里，汇水面积为21.22平方公里，湖面面积为6.38平方公里。\n\n西湖南、西、北三面环山，东邻城区，南部和钱塘江隔山相望，风景秀丽，享有"人间天堂"的美誉。\n\n早在南宋时期，西湖就被划分为十个景区，取名为"西湖十景"，宋代诗人苏轼赞其"欲把西湖比西子，淡妆浓抹总相宜"。',
    images: [
      "https://picsum.photos/id/1018/800/600",
      "https://picsum.photos/id/1015/800/600",
      "https://picsum.photos/id/1019/800/600",
      "https://picsum.photos/id/1016/800/600",
    ],
    video: "https://d23dyxeqlo5psv.cloudfront.net/big_buck_bunny.mp4",
    createdAt: "2023-10-15",
    author: {
      id: "101",
      name: "旅行者小明",
      avatar: "https://randomuser.me/api/portraits/men/32.jpg",
    },
  },
  "2": {
    id: "2",
    title: "北京故宫一日游",
    content:
      "故宫又名紫禁城，是中国明清两代的皇家宫殿，位于北京中轴线的中心，是中国古代宫廷建筑之精华。\n\n故宫以三大殿为中心，占地面积72万平方米，建筑面积约15万平方米，有大小宫殿七十多座，房屋九千余间。是世界上现存规模最大、保存最为完整的木质结构古建筑之一。\n\n故宫于明成祖永乐四年（1406年）开始建设，以南京故宫为蓝本营建，到永乐十八年（1420年）建成。",
    images: [
      "https://picsum.photos/id/1015/800/600",
      "https://picsum.photos/id/1018/800/600",
      "https://picsum.photos/id/1019/800/600",
    ],
    video: null,
    createdAt: "2023-10-20",
    author: {
      id: "102",
      name: "摄影师小红",
      avatar: "https://randomuser.me/api/portraits/women/44.jpg",
    },
  },
};

interface Trip {
  id: string;
  title: string;
  content: string;
  imgList: string[];
  video: string | null;
  publishTime: string;
  userInfo: {
    _id: string;
    username: string;
    avatar: string;
  };
}

// 导入API

export default function TripDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const tripId = params.id as string;
  // 移除暗色主题判断
  // const colorScheme = useColorScheme();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [isFullscreenVideo, setIsFullscreenVideo] = useState(false);
  const [isImageViewVisible, setIsImageViewVisible] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [currentCarouselIndex, setCurrentCarouselIndex] = useState(0);
  const videoRef = useRef(null);
  const width = Dimensions.get("window").width;

  // 加载游记详情
  useEffect(() => {
    if (tripId) {
      fetchTripDetails(tripId);
    } else {
      Alert.alert("错误", "未找到游记详情");
      router.back();
    }
  }, [tripId]);

  const fetchTripDetails = async (id: any) => {
    try {
      const response: any = await getTravelNoteDetail(id);
      console.log("游记:", response);
      setTrip(response);
    } catch (error) {
      console.error("获取游记详情失败:", error);
      Alert.alert("错误", "获取游记详情失败");
      router.back();
    }
  };

  // 创建视频播放器 - 无条件调用Hook
  // 即使trip.video为null，也要调用Hook，只是传入空字符串
  const carouselVideoPlayer = useVideoPlayer(trip?.video || "");
  const fullscreenVideoPlayer = useVideoPlayer(trip?.video || "");

  // 处理全屏视频播放
  useEffect(() => {
    if (isFullscreenVideo && fullscreenVideoPlayer && trip?.video) {
      fullscreenVideoPlayer.play();
    }
  }, [isFullscreenVideo, fullscreenVideoPlayer, trip]);

  if (!trip) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ThemedText>加载中...</ThemedText>
      </ThemedView>
    );
  }

  // 准备轮播图数据
  const carouselItems = [];
  console.log("轮播图处理前的", trip.imgList);
  if (trip.video) {
    carouselItems.push({ type: "video", uri: trip.video });
  }
  if (trip.imgList) {
    trip.imgList.forEach((image) => {
      carouselItems.push({
        type: "image",
        uri: image.replace("localhost", "192.168.1.108"),
      });
    });
  }
  const imageViewImages = trip.imgList
    ? trip.imgList.map((uri) => ({ uri }))
    : [];

  // 调试输出
  console.log("图片数据:", imageViewImages);
  console.log("轮播图处理后的数据:", carouselItems);

  // 处理分享
  const handleShare = async () => {
    try {
      const result = await Share.share({
        title: trip.title,
        message: `查看我发现的精彩游记：${trip.title}`,
        url: `https://tripdiary.example.com/trip/${trip.id}`,
      });
    } catch (error: any) {
      Alert.alert("分享失败", error.message);
    }
  };

  // 渲染轮播图项 - 修改为使用顶层创建的播放器
  const renderCarouselItem = ({ item, index }) => {
    if (item.type === "video") {
      // 不再在这里调用useVideoPlayer，而是使用顶层创建的播放器
      videoRef.current = carouselVideoPlayer;

      return (
        <TouchableOpacity
          style={styles.carouselItem}
          onPress={() => setIsFullscreenVideo(true)}
        >
          <VideoView
            player={carouselVideoPlayer}
            style={styles.carouselVideo}
            videoStyle={{ resizeMode: "cover" }}
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
            // 确保索引不会为负数
            const imageIndex = trip.video ? Math.max(0, index - 1) : index;
            console.log("点击图片，索引:", imageIndex); // 添加调试日志
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
      <View
        style={[
          styles.header,
          // 使用固定的亮色主题
          { backgroundColor: Colors["light"].background },
        ]}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <IconSymbol
            name="chevron.left"
            size={28}
            // 使用固定的亮色主题
            color={Colors["light"].text}
          />
        </TouchableOpacity>
        <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
          <IconSymbol
            name="square.and.arrow.up"
            size={24}
            // 使用固定的亮色主题
            color={Colors["light"].text}
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
            onSnapToItem={(index) => {
              setCurrentCarouselIndex(index);
            }}
          />
          <View style={styles.carouselIndicator}>
            <ThemedText style={styles.indicatorText}>
              {`${currentCarouselIndex + 1}/${carouselItems.length}`}
            </ThemedText>
          </View>
        </View>

        {/* 游记信息 */}
        <ThemedView style={styles.tripInfo}>
          <ThemedText type="title" style={styles.tripTitle}>
            {trip.title}
          </ThemedText>

          <View style={styles.authorInfo}>
            <Image
              source={{ uri: trip.userInfo?.avatar }}
              style={styles.authorAvatar}
            />
            <ThemedText style={styles.authorName}>
              {trip.userInfo?.username}
            </ThemedText>
            <ThemedText style={styles.tripDate}>
              {formatDateTime(trip.publishTime)}
            </ThemedText>
          </View>

          <ThemedText style={styles.tripContent}>{trip.content}</ThemedText>
        </ThemedView>
      </ThemedView>

      {/* 全屏视频播放 - 修改为使用顶层创建的播放器 */}
      {isFullscreenVideo && trip?.video && (
        <View style={styles.fullscreenVideo}>
          <StatusBar hidden />
          <VideoView
            player={fullscreenVideoPlayer}
            style={styles.fullscreenVideoPlayer}
            videoStyle={{ resizeMode: "contain" }}
            allowsFullscreen
            allowsPictureInPicture
            useNativeControls
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
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 8,
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
    position: "relative",
  },
  carouselItem: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  carouselImage: {
    width: "100%",
    height: "100%",
  },
  carouselVideo: {
    width: "100%",
    height: "100%",
  },
  videoPlayButton: {
    position: "absolute",
    backgroundColor: "rgba(0,0,0,0.3)",
    borderRadius: 40,
    padding: 15,
  },
  carouselIndicator: {
    position: "absolute",
    bottom: 16,
    right: 16,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  indicatorText: {
    color: "#fff",
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
    flexDirection: "row",
    alignItems: "center",
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
    fontWeight: "600",
    marginRight: 12,
  },
  tripDate: {
    fontSize: 14,
    color: "#888",
  },
  tripContent: {
    fontSize: 16,
    lineHeight: 24,
  },
  fullscreenVideo: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#000",
    zIndex: 100,
  },
  fullscreenVideoPlayer: {
    flex: 1,
  },
  closeVideoButton: {
    position: "absolute",
    top: Platform.OS === "ios" ? 50 : 16,
    right: 16,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 20,
    padding: 8,
  },
});
