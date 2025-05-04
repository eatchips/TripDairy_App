import { Image } from 'expo-image';
import { Link, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, FlatList, StyleSheet, TouchableOpacity, View } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

// 模拟我的游记数据
const MY_TRIPS = [
  {
    id: '1',
    title: '三亚海滩度假',
    coverImage: 'https://picsum.photos/id/1011/800/600',
    status: 'approved', // 已通过
    createdAt: '2023-10-15',
  },
  {
    id: '2',
    title: '重庆洪崖洞夜景',
    coverImage: 'https://picsum.photos/id/1015/800/600',
    status: 'pending', // 待审核
    createdAt: '2023-10-20',
  },
  {
    id: '3',
    title: '西安兵马俑一日游',
    coverImage: 'https://picsum.photos/id/1019/800/600',
    status: 'rejected', // 未通过
    rejectReason: '内容不符合社区规范，请修改后重新提交',
    createdAt: '2023-10-25',
  },
];

// 状态标签组件
function StatusBadge({ status }) {
  const colorScheme = useColorScheme();
  
  let backgroundColor, textColor, text;
  
  switch(status) {
    case 'approved':
      backgroundColor = '#e6f7e6';
      textColor = '#2e8b57';
      text = '已通过';
      break;
    case 'pending':
      backgroundColor = '#fff8e6';
      textColor = '#f5a623';
      text = '审核中';
      break;
    case 'rejected':
      backgroundColor = '#ffebee';
      textColor = '#d32f2f';
      text = '未通过';
      break;
    default:
      backgroundColor = '#e0e0e0';
      textColor = '#757575';
      text = '未知状态';
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
  const [myTrips, setMyTrips] = useState(MY_TRIPS);
  const [isLoggedIn, setIsLoggedIn] = useState(false); // 模拟登录状态
  
  // 检查登录状态
  useEffect(() => {
    // 这里应该是实际的登录状态检查逻辑
    // 暂时模拟为已登录
    setIsLoggedIn(true);
  }, []);
  
  // 处理编辑游记
  const handleEdit = (trip:any) => {
    if (trip.status === 'approved') {
      Alert.alert('提示', '已通过审核的游记不可编辑');
      return;
    }
    router.push(`/publish?id=${trip.id}`);
  };
  
  // 处理删除游记
  const handleDelete = (tripId:any) => {
    Alert.alert(
      '确认删除',
      '确定要删除这篇游记吗？此操作不可撤销。',
      [
        { text: '取消', style: 'cancel' },
        { 
          text: '删除', 
          style: 'destructive',
          onPress: () => {
            // 模拟删除操作
            setMyTrips(myTrips.filter(trip => trip.id !== tripId));
          }
        },
      ]
    );
  };
  
  // 渲染游记项
  const renderTripItem = ({ item }) => (
    <ThemedView style={styles.tripItem}>
      <Image source={{ uri: item.coverImage }} style={styles.tripImage} />
      <ThemedView style={styles.tripContent}>
        <View style={styles.tripHeader}>
          <ThemedText type="defaultSemiBold" style={styles.tripTitle}>{item.title}</ThemedText>
          <StatusBadge status={item.status} />
        </View>
        <ThemedText style={styles.tripDate}>创建于: {item.createdAt}</ThemedText>
        
        {item.status === 'rejected' && (
          <ThemedView style={styles.rejectReasonContainer}>
            <ThemedText style={styles.rejectReason}>拒绝原因: {item.rejectReason}</ThemedText>
          </ThemedView>
        )}
        
        <View style={styles.actionButtons}>
          {(item.status === 'pending' || item.status === 'rejected') && (
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
        <Link href="/publish" asChild>
          <TouchableOpacity style={styles.addButton}>
            <IconSymbol name="plus" size={20} color="#fff" />
            <ThemedText style={styles.addButtonText}>发布游记</ThemedText>
          </TouchableOpacity>
        </Link>
      </ThemedView>
      
      {myTrips.length > 0 ? (
        <FlatList
          data={myTrips}
          renderItem={renderTripItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContainer}
        />
      ) : (
        <ThemedView style={styles.emptyContainer}>
          <IconSymbol 
            name="doc.text.image" 
            size={60} 
            color={Colors[colorScheme ?? 'light'].tabIconDefault} 
          />
          <ThemedText style={styles.emptyText}>您还没有发布过游记</ThemedText>
          <Link href="/publish" asChild>
            <TouchableOpacity style={styles.createButton}>
              <ThemedText style={styles.createButtonText}>创建第一篇游记</ThemedText>
            </TouchableOpacity>
          </Link>
        </ThemedView>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 50,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addButtonText: {
    color: '#fff',
    marginLeft: 4,
  },
  listContainer: {
    padding: 16,
  },
  tripItem: {
    flexDirection: 'row',
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  tripImage: {
    width: 120,
    height: '100%',
  },
  tripContent: {
    flex: 1,
    padding: 12,
  },
  tripHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  tripTitle: {
    flex: 1,
    fontSize: 16,
  },
  tripDate: {
    fontSize: 12,
    color: '#757575',
    marginBottom: 8,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 8,
  },
  rejectReasonContainer: {
    backgroundColor: '#ffebee',
    padding: 8,
    borderRadius: 4,
    marginBottom: 8,
  },
  rejectReason: {
    fontSize: 12,
    color: '#d32f2f',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    marginLeft: 8,
  },
  editButton: {
    backgroundColor: '#2196F3',
  },
  deleteButton: {
    backgroundColor: '#F44336',
  },
  buttonText: {
    color: '#fff',
    fontSize: 12,
    marginLeft: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  emptyText: {
    marginTop: 16,
    marginBottom: 24,
    fontSize: 16,
    color: '#757575',
  },
  createButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  loginPrompt: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  loginText: {
    marginTop: 8,
    marginBottom: 24,
    textAlign: 'center',
    color: '#757575',
  },
  loginButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
  },
});