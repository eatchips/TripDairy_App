import { login as loginApi, register as registerApi } from '@/api/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

// 用户信息类型定义
type User = {
  id: string;
  username: string;
  nickname: string;
  avatar: string;
};

// 注册用户数据类型
type RegisterUserData = {
  username: string;
  password: string;
  nickname: string;
  avatar?: string;
  date?: string; // 添加日期字段，与API匹配
};

// 用户状态类型定义
interface UserState {
  // 状态
  user: User | null;
  isLoggedIn: boolean;
  token: string | null;
  
  // 操作方法
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  register: (userData: RegisterUserData) => Promise<boolean>;
}

// 创建用户状态管理store
export const useUserStore = create<UserState>(
  persist(
    (set, get) => ({
      // 初始状态
      user: null,
      isLoggedIn: false,
      token: null,
      
      // 登录方法
      login: async (username: string, password: string) => {
        try {
          // 调用登录API
          const response:any = await loginApi(username, password);
          
          // 检查登录结果
          if (response && response._id) {
            // 登录成功，存储用户信息
            const userData = {
              id: response._id,
              username: response.username,
              nickname: response.username, // 如果后端返回nickname则使用，否则用username
              avatar: response.avatar || 'https://randomuser.me/api/portraits/lego/1.jpg'
            };
            
            set({ 
              user: userData, 
              isLoggedIn: true,
              token: response._id // 使用用户ID作为token
            });
            return true;
          }
          return false;
        } catch (error) {
          console.error('登录失败:', error);
          return false;
        }
      },
      
      // 注销方法
      logout: () => {
        set({ user: null, isLoggedIn: false, token: null });
      },
      
      // 注册方法
      // 注册方法
      register: async (userData: RegisterUserData) => {
        try {
          // 准备注册数据
          const registerData = {
            username: userData.username,
            password: userData.password,
            nickname: userData.nickname, // 添加昵称字段
            date: new Date().toISOString(), // 当前日期
            avatarUrl: userData.avatar // 使用avatarUrl字段，与API匹配
          };
          
          // 调用注册API
          const response:any = await registerApi(registerData);
          
          // 检查注册结果
          return response === "success";
        } catch (error) {
          console.error('注册失败:', error);
          return false;
        }
      },
    }),
    {
      name: 'user-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  ) as any
);