import { service } from "@/utils/request";

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
  return service.post("/uploadVideo", formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
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