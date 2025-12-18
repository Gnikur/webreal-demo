<template>
  <div class="register-container">
    <el-card class="register-card">
      <div slot="header" class="card-header">
        <h2>WebReal 注册</h2>
        <p>创建你的账号开始使用</p>
      </div>

      <el-form :model="registerForm" :rules="rules" ref="registerForm" label-width="80px">
        <el-form-item label="用户名" prop="username">
          <el-input 
            v-model="registerForm.username" 
            placeholder="请输入用户名"
            prefix-icon="el-icon-user"
          ></el-input>
        </el-form-item>

        <el-form-item label="邮箱" prop="email">
          <el-input 
            v-model="registerForm.email" 
            placeholder="请输入邮箱（可选）"
            prefix-icon="el-icon-message"
          ></el-input>
        </el-form-item>

        <el-form-item label="密码" prop="password">
          <el-input 
            v-model="registerForm.password" 
            type="password"
            placeholder="请输入密码"
            prefix-icon="el-icon-lock"
          ></el-input>
        </el-form-item>

        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input 
            v-model="registerForm.confirmPassword" 
            type="password"
            placeholder="请再次输入密码"
            prefix-icon="el-icon-lock"
            @keyup.enter.native="handleRegister"
          ></el-input>
        </el-form-item>

        <el-form-item>
          <el-button 
            type="primary" 
            @click="handleRegister" 
            :loading="loading"
            style="width: 100%"
          >
            注册
          </el-button>
        </el-form-item>

        <el-form-item>
          <div class="footer-links">
            <span>已有账号？</span>
            <el-button type="text" @click="goToLogin">立即登录</el-button>
          </div>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script>
export default {
  name: 'RegisterView',
  data() {
    // 自定义验证规则：确认密码
    const validateConfirmPassword = (rule, value, callback) => {
      if (value === '') {
        callback(new Error('请再次输入密码'));
      } else if (value !== this.registerForm.password) {
        callback(new Error('两次输入密码不一致'));
      } else {
        callback();
      }
    };

    return {
      registerForm: {
        username: '',
        email: '',
        password: '',
        confirmPassword: ''
      },
      rules: {
        username: [
          { required: true, message: '请输入用户名', trigger: 'blur' },
          { min: 3, max: 20, message: '长度在 3 到 20 个字符', trigger: 'blur' }
        ],
        email: [
          { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
        ],
        password: [
          { required: true, message: '请输入密码', trigger: 'blur' },
          { min: 6, max: 20, message: '长度在 6 到 20 个字符', trigger: 'blur' }
        ],
        confirmPassword: [
          { required: true, validator: validateConfirmPassword, trigger: 'blur' }
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
    
    handleRegister() {
      this.$refs.registerForm.validate(async (valid) => {
        if (!valid) {
          return false;
        }

        this.loading = true;
        
        try {
          // 使用完整的 API URL
          const apiUrl = this.getApiUrl();
          const response = await fetch(`${apiUrl}/api/auth/register`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              username: this.registerForm.username,
              email: this.registerForm.email,
              password: this.registerForm.password
            })
          });

          const data = await response.json();

          if (response.ok && data.success) {
            // 保存 token 和用户信息
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            
            // 更新 Vuex 状态
            this.$store.commit('setUser', data.user);
            this.$store.commit('setToken', data.token);

            this.$message.success('注册成功！');
            
            // 跳转到工作流编辑器
            this.$router.push('/editor');
          } else {
            this.$message.error(data.error || '注册失败');
          }
        } catch (error) {
          console.error('Register error:', error);
          this.$message.error('注册失败，请检查网络连接或后端服务是否正常');
        } finally {
          this.loading = false;
        }
      });
    },
    goToLogin() {
      this.$router.push('/login');
    }
  }
}
</script>

<style scoped>
.register-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.register-card {
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
