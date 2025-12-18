<template>
  <div class="login-container">
    <el-card class="login-card">
      <div slot="header" class="card-header">
        <h2>WebReal 登录</h2>
        <p>图形化编程平台</p>
      </div>

      <el-form :model="loginForm" :rules="rules" ref="loginForm" label-width="80px">
        <el-form-item label="用户名" prop="username">
          <el-input 
            v-model="loginForm.username" 
            placeholder="请输入用户名"
            prefix-icon="el-icon-user"
          ></el-input>
        </el-form-item>

        <el-form-item label="密码" prop="password">
          <el-input 
            v-model="loginForm.password" 
            type="password"
            placeholder="请输入密码"
            prefix-icon="el-icon-lock"
            @keyup.enter.native="handleLogin"
          ></el-input>
        </el-form-item>

        <el-form-item>
          <el-button 
            type="primary" 
            @click="handleLogin" 
            :loading="loading"
            style="width: 100%"
          >
            登录
          </el-button>
        </el-form-item>

        <el-form-item>
          <div class="footer-links">
            <span>还没有账号？</span>
            <el-button type="text" @click="goToRegister">立即注册</el-button>
          </div>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script>
export default {
  name: 'LoginView',
  data() {
    return {
      loginForm: {
        username: '',
        password: ''
      },
      rules: {
        username: [
          { required: true, message: '请输入用户名', trigger: 'blur' },
          { min: 3, max: 20, message: '长度在 3 到 20 个字符', trigger: 'blur' }
        ],
        password: [
          { required: true, message: '请输入密码', trigger: 'blur' },
          { min: 6, max: 20, message: '长度在 6 到 20 个字符', trigger: 'blur' }
        ]
      },
      loading: false
    }
  },
  methods: {
    // 获取 API 基础 URL
    getApiUrl() {
      // 生产环境使用环境变量，开发环境使用代理
      return process.env.VUE_APP_API_URL || '';
    },
    
    handleLogin() {
      this.$refs.loginForm.validate(async (valid) => {
        if (!valid) {
          return false;
        }

        this.loading = true;
        
        try {
          // 使用完整的 API URL
          const apiUrl = this.getApiUrl();
          const response = await fetch(`${apiUrl}/api/auth/login`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(this.loginForm)
          });

          const data = await response.json();

          if (response.ok && data.success) {
            // 保存 token 和用户信息
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            
            // 更新 Vuex 状态
            this.$store.commit('setUser', data.user);
            this.$store.commit('setToken', data.token);

            this.$message.success('登录成功！');
            
            // 跳转到工作流编辑器
            this.$router.push('/editor');
          } else {
            this.$message.error(data.error || '登录失败，请检查用户名和密码');
          }
        } catch (error) {
          console.error('Login error:', error);
          this.$message.error('登录失败，请检查网络连接或后端服务是否正常');
        } finally {
          this.loading = false;
        }
      });
    },
    goToRegister() {
      this.$router.push('/register');
    }
  }
}
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.login-card {
  width: 400px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.card-header {
  text-align: center;
}

.card-header h2 {
  margin: 0 0 10px 0;
  color: #409EFF;
}

.card-header p {
  margin: 0;
  color: #909399;
  font-size: 14px;
}

.footer-links {
  text-align: center;
  color: #909399;
}

.footer-links span {
  margin-right: 5px;
}
</style>
