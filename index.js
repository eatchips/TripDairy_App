// 所有接口
const express = require("express");
const multer = require("multer");
const { v4 } = require("uuid");
const axios = require("axios");
const cors = require('cors');
const sharp = require('sharp')
const mongoose = require('mongoose');
const { User, Admin, TravelNote } = require("./db");
const app = express();

app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(__dirname));


// 视频上传 前置操作 => 中间件
const videoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, './videos'); // 视频文件的保存路径
  },
  filename: (req, file, cb) => {
    const fileExt = file.originalname.split('.').pop(); // 获取文件扩展名
    cb(null, `${v4()}.${fileExt}`); // 使用uuid生成唯一文件名
  }
});
const videoUpload = multer({ storage: videoStorage });

// 图片上传 前置操作 => 中间件
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "./file")
  },
  filename: (req, file, cb) => {
    let type = file.originalname.replace(/.+\./, ".");
    console.log(type);
    cb(null, `${v4()}${type}`)
  }
})
const upload = multer({ storage });

// 获取首页的游记数据
app.get("/getTravelNotes", async (req, res) => {
  try {
    const result = await TravelNote.aggregate([
      {
        $match: {
          state: 1, // 筛选已通过审核的游记
          isDeleted: false // 确保游记未被伪删除
        }
      },
      {
        $lookup: {
          from: "users", // 这应该是User集合在数据库中的实际名称
          localField: "openid", // TravelNote集合中用于匹配的字段
          foreignField: "_id", // User集合中用于匹配的字段
          as: "userInfo" // 添加到游记文档中的用户信息数组
        }
      },
      {
        $unwind: "$userInfo" // 将userInfo数组展开成单个文档
      },
      {
        $sort: { publishTime: -1 } // 根据发布时间降序排序
      }
    ]);
    res.send(result);
  } catch (error) {
    console.error("获取游记数据失败", error);
    res.status(500).send("Server Error");
  }
});

// 获取游记详情(从查询参数中获取游记ID)
app.get("/getTravelNoteDetail", async (req, res) => {
  const { _id } = req.query; // 从查询参数中获取游记ID
  console.log(_id);
  try {
    // 使用聚合管道查询游记详情，并连表查询用户信息
    const result = await TravelNote.aggregate([
      {
        $match: { _id: new mongoose.Types.ObjectId(_id) } // 将_id字符串转换为ObjectId
      },
      {
        $lookup: {
          from: "users", // 连接到用户集合
          localField: "openid", // 游记集合中用于匹配的字段
          foreignField: "_id", // 用户集合中用于匹配的字段
          as: "userInfo" // 查询结果的字段名
        }
      },
      {
        $unwind: "$userInfo" // 展开userInfo，使其从数组变为单个对象
      }
    ]);

    if (result.length === 0) { // 检查是否查询到了游记
      return res.status(404).send({ message: "TravelNote not found" });
    }

    // 直接返回查询结果
    res.status(200).send(result[0]); // 由于_id唯一，关心第一个元素即可
  } catch (error) {
    console.error("Error getting travel note detail:", error);
    res.status(500).send({ message: "Internal Server Error", error });
  }
});

// 发布游记
app.post("/publishTravelNote", async (req, res) => {
  const { id, title, content, imgList, openid, videoUrl } = req.body;

  try {
    let result;
    if (id) {
      // 如果请求中包含ID，则更新已存在的游记
      result = await TravelNote.findByIdAndUpdate(
        id,
        { title, content, imgList, openid, state: 0, video: videoUrl },
        { new: true, runValidators: true, upsert: true }
      );
    } else {
      // 如果请求中不包含ID，则创建新的游记
      result = await TravelNote.create({ title, content, imgList, openid, state: 0, video: videoUrl }); // 假设state: 0 表示待审核状态
    }

    // 根据操作结果返回相应的响应
    if (result) {
      res.status(200).send({ message: "Success", data: result });
    } else {
      res.status(404).send({ message: "Not found" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: "Error", detail: error.message });
  }
});

// 上传图片(不压缩)
// app.post("/uploadImg", upload.array("file", 6), (req, res) => {
//   // 假设您的服务器地址是 http://localhost:3001 ，在生产环境中，您应该使用实际的服务器地址
//   const serverUrl = "http://localhost:3001";
//   // 转换req.files中的每个文件路径，拼接成完整的URL
//   const filesWithFullPath = req.files.map(file => {
//     return `${serverUrl}/${file.path}`;
//   });
//   console.log(filesWithFullPath);

//   res.send(filesWithFullPath);
// });


// 上传图片（压缩）
app.post("/uploadImg", upload.array("file", 6), async (req, res) => {
  try {
    const processedFiles = await Promise.all(req.files.map(async (file) => {
      const serverUrl = "http://localhost:3001";
      const outputPath = `./optimized/${file.filename}.webp`;
      // 使用sharp进行图片处理，转换为WebP格式
      await sharp(file.path)
        .resize(400) // 假设最大宽度为800px
        .webp({ quality: 70 }) // 转换为WebP格式，设置质量为80%，保留透明度
        .toFile(outputPath);
      return `${serverUrl}/${outputPath}`;
    }));
    res.send(processedFiles);
  } catch (error) {
    console.error("Error processing files", error);
    res.status(500).send("Server Error");
  }
});

// 上传视频的接口 输入一个视频流文件 => 存储的本机地址
app.post('/uploadVideo', videoUpload.single('video'), (req, res) => {
  const serverUrl = "http://localhost:3001/";
  if (req.file) {
    console.log(req.file.path); // 打印上传文件的保存路径
    res.send({ message: 'Video uploaded successfully', path: serverUrl + req.file.path });
  } else {
    res.status(400).send({ message: 'Video upload failed' });
  }
});

// 获取我的发布的数据
app.get("/getMyPublish", async (req, res) => {
  const { openid } = req.query;
  const result = await TravelNote.find({
    openid: openid,
    isDeleted: false // 确保只返回未被伪删除的记录
  });
  res.send(result);
})

// 登录
app.post("/toLogin", async (req, res) => {
  const { username, password } = req.body;
  const result = await User.findOne({
    username
  });
  if (result) {
    if (result.password === password) {
      res.send(result);
    } else {
      res.send("pwdError")
    }
  } else {
    res.send("error");
  }
})

// 注册
app.post('/register', async (req, res) => {
  const { username, password, date, avatarUrl } = req.body;
  const result = await User.findOne({
    username
  });
  if (result) {
    res.send("用户名不能重复");
  } else {
    await User.create({
      username,
      password,
      date,
      avatar: avatarUrl,
    });
    res.send("success");
  }
})

// 更换头像
app.post('/updateAvatar', async (req, res) => {
  const { openid, avatarUrl } = req.body; // 假设你会在请求体中传递用户的openid和新的头像URL

  try {
    // 在数据库中找到对应的用户并更新他们的avatar字段
    const updatedUser = await User.findOneAndUpdate({ _id: openid }, { avatar: avatarUrl }, { new: true });

    if (updatedUser) {
      // 如果找到并成功更新了用户信息，返回成功消息
      res.status(200).send({ message: 'Avatar updated successfully', data: updatedUser });
    } else {
      // 如果没有找到对应的用户，返回404错误
      res.status(404).send({ message: 'User not found' });
    }
  } catch (error) {
    // 如果在更新过程中发生了错误，返回500错误和错误信息
    console.error(error);
    res.status(500).send({ message: 'Error updating avatar', detail: error.message });
  }
});

// 微信小程序中的搜索
app.get("/searchTravelNotes", async (req, res) => {
  const { title } = req.query;
  const regexTitle = new RegExp(title, 'i'); // 创建正则表达式，'i' 代表不区分大小写

  try {
    const results = await TravelNote.aggregate([
      {
        // 将游记数据与用户数据进行联表查询
        $lookup: {
          from: "users", // 这应该是User集合在数据库中的实际名称
          localField: "openid", // TravelNote集合中用于匹配的字段
          foreignField: "_id", // User集合中用于匹配的字段
          as: "userInfo" // 添加到游记文档中的用户信息数组
        }
      },
      {
        // 展开userInfo数组，使其变成对象
        $unwind: "$userInfo"
      },
      {
        // 根据游记标题或用户昵称进行搜索
        $match: {
          $or: [
            { "title": regexTitle }, // 匹配游记标题
            { "userInfo.username": regexTitle } // 匹配用户昵称
          ]
        }
      }
    ]);

    res.status(200).send(results);
  } catch (error) {
    console.error("Search Error:", error);
    res.status(500).send("Internal Server Error");
  }
});

// 删除用户信息 真删除
// app.post("/admin/deleteUser", async (req, res) => {
//   const { _id } = req.body;
//   try {
//     await User.findByIdAndRemove(_id);
//     res.send("success");
//   } catch (error) {
//     res.send("error");
//   }
// })

// 伪删除游记(PC、小程序)
app.post("/deleteTravelNote", async (req, res) => {
  const { _id } = req.body;
  try {
    // 更新isDeleted字段为true而不是实际删除记录
    const updated = await TravelNote.findByIdAndUpdate(
      _id,
      { isDeleted: true },
      { new: true }
    );
    if (updated) {
      res.send("success");
    } else {
      // 如果没有找到对应的游记来更新
      res.status(404).send("Not found");
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("error");
  }
});

// PC 恢复被伪删除的游记
app.post("/restoreTravelNote", async (req, res) => {
  const { _id } = req.body;
  try {
    const restored = await TravelNote.findByIdAndUpdate(
      _id,
      { isDeleted: false },
      { new: true }
    );
    if (restored) {
      res.send("success");
    } else {
      // 如果没有找到对应的游记来更新
      res.status(404).send("Not found");
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("error");
  }
});

// PC 登录
app.post("/admin/login", async (req, res) => {
  const { username, password } = req.body;
  console.log(username, password);
  const result = await Admin.findOne({
    username
  })
  if (result && result.password === password) {
    console.log(123);
    // 登录成功
    res.send(result);
  } else {
    res.send("error");
  }
})

// PC 审核游记，包括通过和驳回
app.post('/reviewTravelNote', async (req, res) => {
  const { _id, state, rejectReason } = req.body; // 接收驳回原因
  try {
    const updateData = { state };
    if (state === 2 && rejectReason) { // 如果是驳回状态，并且有驳回原因
      updateData.rejectReason = rejectReason;
    }
    await TravelNote.findByIdAndUpdate(_id, updateData);
    res.send("success");
  } catch (error) {
    console.error(error);
    res.status(500).send("error");
  }
});

// PC 获取后台游记列表（含搜索）
app.post("/admin/getTravelNotes", async (req, res) => {
  const { page, size, search } = req.body; // 接收一个额外的search参数
  const skipAmount = (page - 1) * size;
  let regexSearch = search
  let searchQuery = []
  const emumObj = {
    "待审核": 0,
    "已通过": 1,
    "已驳回": 2,
  }
  console.log(emumObj[search]);
  if (emumObj[search] || emumObj[search] === 0) {
    searchQuery = [{ "state": emumObj[search] }]
  } else {
    regexSearch = new RegExp(search, 'i'); // 创建正则表达式，'i' 代表不区分大小写
    searchQuery = [{ "title": regexSearch }, { "userInfo.username": regexSearch }] // 根据游记标题进行模糊搜索
  }

  try {
    // 在聚合管道开始处添加一个条件匹配步骤
    const pipeline = [
      {
        $lookup: {
          from: "users",
          localField: "openid",
          foreignField: "_id",
          as: "userInfo"
        }
      },
      {
        $unwind: {
          path: "$userInfo",
          preserveNullAndEmptyArrays: true
        }
      },
      // 添加搜索条件
      {
        $match: {
          $or: [
            ...searchQuery
          ]
        }
      },
      {
        $sort: { publishTime: -1 }
      },
      {
        $skip: skipAmount
      },
      {
        $limit: size
      }
    ];

    // 执行聚合查询
    const result = await TravelNote.aggregate(pipeline);

    // 单独查询满足条件的文档总数，用于分页逻辑
    // 注意：这里需要重用匹配条件
    const total = await TravelNote.aggregate([
      {
        $lookup: {
          from: "users",
          localField: "openid",
          foreignField: "_id",
          as: "userInfo"
        }
      },
      {
        $unwind: {
          path: "$userInfo",
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $match: {
          $or: [
            { "title": regexSearch },
            { "userInfo.username": regexSearch }
          ]
        }
      },
      {
        $count: "total"
      }
    ]);

    // 如果没有匹配的文档，total将是空数组
    const totalCount = total.length ? total[0].total : 0;

    res.send({
      result,
      total: totalCount
    });
  } catch (error) {
    console.error("Error getting travel notes with user info:", error);
    res.status(500).send("Server Error");
  }
});

app.listen(3001, () => {
  console.log('server running!');
})