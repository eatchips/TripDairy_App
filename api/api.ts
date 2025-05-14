import { service } from "@/utils/request";
import { fetch as fetchAPI } from 'react-native-fetch-api';
// 获取首页游记列表
export const getTravelNotes = () => {
  return service.get("/getTravelNotes");
}

// 获取游记详情
export const getTravelNoteDetail = (id: string) => {
  return service.get("/getTravelNoteDetail", {
    params: { _id: id }
  });
}

// 发布游记
export const publishTravelNote = (data: {
  id?: string;
  title: string;
  content: string;
  imgList: string[];
  openid: string;
  videoUrl?: string;
}) => {
  return service.post("/publishTravelNote", data);
}

// 上传图片
export const uploadImg = (formData: FormData) => {
  return service.post("/uploadImg", formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
}

// 上传视频
export const uploadVideo = (formData: FormData) => {
  console.log('上传视频请求参数:', formData);
  return service.post("/uploadVideo", formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    },
    timeout: 300000 // 增加超时时间到5分钟
  });
}

// 获取我发布的游记
export const getMyPublish = (openid: string) => {
  return service.get("/getMyPublish", {
    params: { openid }
  });
}

// 用户登录
export const login = (username: string, password: string) => {
  console.log('登录请求参数:', { username, password });
  return service.post("/toLogin", { username, password })
    .then(response => {
      console.log('登录响应数据:', response);
      return response;
    })
    .catch(error => {
      console.error('登录请求失败:', error);
      throw error;
    });
}

// 用户注册
export const register = (data: {
  username: string;
  password: string;
  date: string;
  avatarUrl?: string;
  nickname?: string; // 添加昵称字段
}) => {
  console.log('注册请求参数:', data);
  return service.post("/register", data)
    .then(response => {
      console.log('注册响应数据:', response);
      return response;
    })
    .catch(error => {
      console.error('注册请求失败:', error);
      throw error;
    });
}

// 更新头像
export const updateAvatar = (openid: string, avatarUrl: string) => {
  return service.post("/updateAvatar", { openid, avatarUrl });
}

// 搜索游记
export const searchTravelNotes = (title: string) => {
  return service.get("/searchTravelNotes", {
    params: { title }
  });
}

// 删除游记（伪删除）
export const deleteTravelNote = (id: string) => {
  return service.post("/deleteTravelNote", { _id: id });
}

// 恢复已删除的游记
export const restoreTravelNote = (id: string) => {
  return service.post("/restoreTravelNote", { _id: id });
}

// 管理员登录
export const adminLogin = (username: string, password: string) => {
  return service.post("/admin/login", { username, password });
}

// 审核游记
export const reviewTravelNote = (id: string, state: number, rejectReason?: string) => {
  const data: any = { _id: id, state };
  if (state === 2 && rejectReason) {
    data.rejectReason = rejectReason;
  }
  return service.post("/reviewTravelNote", data);
}

// 获取后台游记列表（含搜索）
export const getAdminTravelNotes = (page: number, size: number, search?: string) => {
  return service.post("/admin/getTravelNotes", { page, size, search });
}

// 文本润色函数（流式输出）- 使用fetchApi发送POST请求
export const polishTextStream = (
  text: string,
  style = '旅游日记',
  callbacks: {
    onOriginal?: (text: string) => void;
    onChunk?: (chunk: string, fullText: string) => void;
    onComplete?: (fullText: string) => void;
    onError?: (error: string) => void;
  }
) => {
  
  const controller = new AbortController();
  let fullPolishedText = '';
  
  // 拼接完整请求地址
  const url = 'http://10.0.2.2:3001/polishText';

  // 使用 react-native-fetch-api 的 fetch 发送请求
  fetchAPI(url, {
    method: 'POST',
    headers: {
      'Accept': 'text/event-stream',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ text, style }),
    signal: controller.signal,
  })
  .then(async response => {
    if (!response.ok) {
      throw new Error(`HTTP 错误! 状态码: ${response.status}`);
    }

    // 获取可读流读取器 - react-native-fetch-api 支持标准的 ReadableStream API
    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('无法获取流读取器');
    }

    const decoder = new TextDecoder();
    let buffer = '';

    const processStream = async () => {
      try {
        while (true) {
          const { done, value } = await reader.read();
          console.log('value:', value, 'done:', done);
          if (done) {
            // 处理剩余buffer
            if (buffer.trim()) {
              handleSSEEvent(buffer.trim());
            }
            callbacks.onComplete?.(fullPolishedText);
            return;
          }
          
          const  value8 = new Uint8Array([value]);
          console.log('value8:', value8);
          buffer += decoder.decode(value8, { stream: !done });
         

          // 按SSE格式分割事件
          const events = buffer.split('\n\n');
          buffer = events.pop() || ''; // 保留未完成的事件

          for (const event of events) {
            handleSSEEvent(event.trim());
          }
        }
      } catch (error) {
        handleError(error);
      }
    };

    const handleSSEEvent = (event: string) => {
      if (!event.startsWith('data: ')) return;

      try {
        const jsonStr = event.slice(6).trim();
        const data = JSON.parse(jsonStr);

        switch (data.type) {
          case 'original':
            callbacks.onOriginal?.(data.content);
            break;
          case 'chunk':
            fullPolishedText += data.content;
            callbacks.onChunk?.(data.content, fullPolishedText);
            break;
          case 'done':
            callbacks.onComplete?.(fullPolishedText);
            break;
          case 'error':
            callbacks.onError?.(data.message);
            break;
        }
      } catch (e) {
        console.error('解析事件失败:', e);
        callbacks.onError?.('数据解析错误');
      }
    };

    const handleError = (error: any) => {
      if (error.name === 'AbortError') {
        console.log('请求已取消');
      } else {
        console.error('流处理错误:', error);
        callbacks.onError?.(error.message || '请求失败');
      }
    };

    await processStream();
  })
  .catch(error => {
    if (error.name === 'AbortError') {
      console.log('请求已取消');
    } else {
      console.error('请求错误:', error);
      callbacks.onError?.(error.message || '请求失败');
    }
  });

  // 返回取消方法
  return {
    cancel: () => controller.abort()
  };
};
