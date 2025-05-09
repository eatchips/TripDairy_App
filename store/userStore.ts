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

// 模拟已注册用户数据
const REGISTERED_USERS = [
  {
    id: '101',
    username: 'user1',
    nickname: '旅行者小明',
    password: 'password123',
    avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
  },
  {
    id: '102',
    username: 'user2',
    nickname: '摄影师小红',
    password: 'password123',
    avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
  },
];

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
          // 这里应该是实际的API调用
          // 暂时使用模拟数据
          const user = REGISTERED_USERS.find(
            user => user.username === username && user.password === password
          );
          
          if (user) {
            // 登录成功，存储用户信息
            const { password, ...userWithoutPassword } = user;
            set({ 
              user: userWithoutPassword, 
              isLoggedIn: true,
              token: userWithoutPassword.id // 使用用户ID作为token
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
      register: async (userData: RegisterUserData) => {
        try {
          // 这里应该是实际的API调用
          // 暂时返回成功
          return true;
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