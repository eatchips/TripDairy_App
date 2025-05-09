import axios, { AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios';

// 定义响应数据的接口
interface ResponseData<T = any> {
  data?: T;
  message?: string;
  code?: number;
  [key: string]: any;
}

// 创建axios实例
export const service: AxiosInstance = axios.create({
  baseURL: 'http://192.168.1.108:3001', // 使用您电脑的实际IP地址，而不是localhost
  timeout: 10000, // 请求超时时间
});

// 请求拦截器
service.interceptors.request.use(
  (config: InternalAxiosRequestConfig<any>): InternalAxiosRequestConfig<any> => {
    // 在发送请求之前做些什么，例如添加token
    // const token = localStorage.getItem('token');
    // if (token) {
    //   config.headers = config.headers || {};
    //   config.headers['Authorization'] = `Bearer ${token}`;
    // }
    return config;
  },
  (error: any) => {
    // 对请求错误做些什么
    console.error('请求错误:', error);
    return Promise.reject(error);
  }
);

// 响应拦截器
service.interceptors.response.use(
  (response: AxiosResponse): any => {
    // 对响应数据做点什么
    const res = response.data;
    return res;
  },
  (error: any) => {
    // 对响应错误做点什么
    console.error('响应错误:', error);
    return Promise.reject(error);
  }
);



