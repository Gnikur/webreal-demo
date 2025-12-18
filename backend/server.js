// backend/server.js - 支持生产环境部署的服务器

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
require('dotenv').config(); // 加载环境变量

const app = express();
const PORT = process.env.PORT || 3000;

// ============= 数据库连接 =============
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/webreal')
  .then(() => {
    console.log('✅ MongoDB connected successfully');
  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

// ============= 中间件配置 =============
// CORS配置 - 允许前端跨域访问
const corsOptions = {
  origin: process.env.FRONTEND_URL || [
    'http://localhost:8080',
    'https://your-project.vercel.app'  // 替换为你的Vercel域名
  ],
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// 请求日志中间件
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// ============= 数据模型 =============
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true }, // 注意：生产环境应该用bcrypt加密
  email: String,
  createdAt: { type: Date, default: Date.now }
});

const workflowSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  nodes: { type: Array, default: [] },
  connections: { type: Array, default: [] },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);
const Workflow = mongoose.model('Workflow', workflowSchema);

// ============= 简易JWT认证 =============
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

function generateToken(userId) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
}

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.userId = decoded.userId;
    next();
  });
}

// ============= 公开路由（不需要登录）=============

// 健康检查接口
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Backend is running!',
    timestamp: new Date().toISOString()
  });
});

// 测试接口（保持向后兼容）
app.get('/api/test', (req, res) => {
  res.json({ message: 'Backend is running!' });
});

// 用户注册
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, password, email } = req.body;

    // 验证输入
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    // 检查用户是否已存在
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(409).json({ error: 'Username already exists' });
    }

    // 创建新用户（注意：生产环境应该用bcrypt加密密码）
    const user = new User({ username, password, email });
    await user.save();

    const token = generateToken(user._id);

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// 用户登录
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // 查找用户
    const user = await User.findOne({ username });
    if (!user || user.password !== password) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const token = generateToken(user._id);

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// ============= 受保护路由（需要登录）=============

// 获取当前用户信息
app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
});

// 保存工作流
app.post('/api/workflow/save', authenticateToken, async (req, res) => {
  try {
    const { name, nodes, connections, workflowId } = req.body;

    if (workflowId) {
      // 更新现有工作流
      const workflow = await Workflow.findOneAndUpdate(
        { _id: workflowId, userId: req.userId },
        { name, nodes, connections, updatedAt: new Date() },
        { new: true }
      );

      if (!workflow) {
        return res.status(404).json({ error: 'Workflow not found' });
      }

      res.json({ success: true, workflow });
    } else {
      // 创建新工作流
      const workflow = new Workflow({
        userId: req.userId,
        name,
        nodes,
        connections
      });

      await workflow.save();
      res.json({ success: true, workflow });
    }
  } catch (error) {
    console.error('Save workflow error:', error);
    res.status(500).json({ error: 'Failed to save workflow' });
  }
});

// 获取用户的所有工作流
app.get('/api/workflow/list', authenticateToken, async (req, res) => {
  try {
    const workflows = await Workflow.find({ userId: req.userId })
      .sort({ updatedAt: -1 });
    
    res.json({ success: true, workflows });
  } catch (error) {
    console.error('List workflows error:', error);
    res.status(500).json({ error: 'Failed to list workflows' });
  }
});

// 获取单个工作流
app.get('/api/workflow/:id', authenticateToken, async (req, res) => {
  try {
    const workflow = await Workflow.findOne({
      _id: req.params.id,
      userId: req.userId
    });

    if (!workflow) {
      return res.status(404).json({ error: 'Workflow not found' });
    }

    res.json({ success: true, workflow });
  } catch (error) {
    console.error('Get workflow error:', error);
    res.status(500).json({ error: 'Failed to get workflow' });
  }
});

// 删除工作流
app.delete('/api/workflow/:id', authenticateToken, async (req, res) => {
  try {
    const workflow = await Workflow.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId
    });

    if (!workflow) {
      return res.status(404).json({ error: 'Workflow not found' });
    }

    res.json({ success: true, message: 'Workflow deleted' });
  } catch (error) {
    console.error('Delete workflow error:', error);
    res.status(500).json({ error: 'Failed to delete workflow' });
  }
});

// 执行工作流
app.post('/api/workflow/execute', authenticateToken, async (req, res) => {
  try {
    const { nodes, connections } = req.body;
    
    // 简单的执行逻辑（后续可以扩展）
    console.log(`User ${req.userId} executing workflow with ${nodes.length} nodes`);
    
    res.json({
      success: true,
      result: 'Workflow executed successfully',
      data: { nodeCount: nodes.length, connectionCount: connections.length }
    });
  } catch (error) {
    console.error('Execute workflow error:', error);
    res.status(500).json({ error: 'Failed to execute workflow' });
  }
});

// ============= 开发调试接口（生产环境应该删除）=============

if (process.env.NODE_ENV !== 'production') {
  // 查看所有用户（仅用于开发测试）
  app.get('/api/debug/users', async (req, res) => {
    try {
      const users = await User.find().select('-password');
      res.json({ users });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch users' });
    }
  });

  // 查看所有工作流（仅用于开发测试）
  app.get('/api/debug/workflows', async (req, res) => {
    try {
      const workflows = await Workflow.find().populate('userId', 'username');
      res.json({ workflows });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch workflows' });
    }
  });
}

// ============= 错误处理 =============

// 404 处理
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// 全局错误处理
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// ============= 启动服务器 =============

app.listen(PORT, () => {
  console.log(`\n${'='.repeat(50)}`);
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`${'='.repeat(50)}`);
  console.log(`📝 API Endpoints:`);
  console.log(`   GET    /api/health              - 健康检查`);
  console.log(`   POST   /api/auth/register       - 用户注册`);
  console.log(`   POST   /api/auth/login          - 用户登录`);
  console.log(`   GET    /api/auth/me             - 获取当前用户`);
  console.log(`   POST   /api/workflow/save       - 保存工作流`);
  console.log(`   GET    /api/workflow/list       - 获取工作流列表`);
  console.log(`   GET    /api/workflow/:id        - 获取单个工作流`);
  console.log(`   DELETE /api/workflow/:id        - 删除工作流`);
  console.log(`   POST   /api/workflow/execute    - 执行工作流`);
  console.log(`${'='.repeat(50)}\n`);
});

// 优雅关闭
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    mongoose.connection.close(false, () => {
      console.log('MongoDB connection closed');
      process.exit(0);
    });
  });
});
