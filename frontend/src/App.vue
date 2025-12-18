<template>
  <div id="app">
    <!-- 顶部导航栏 -->
    <div class="navbar" v-if="isAuthenticated">
      <div class="navbar-left">
        <h1 class="logo">WebReal 2.0</h1>
        <span class="subtitle">图形化编程平台</span>
      </div>
      <div class="navbar-right">
        <span class="username">
          <i class="el-icon-user"></i>
          {{ username }}
        </span>
        <el-button 
          type="text" 
          @click="handleLogout"
          style="color: white;"
        >
          <i class="el-icon-switch-button"></i>
          退出登录
        </el-button>
      </div>
    </div>

    <!-- 主要内容区域 -->
    <router-view/>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'

export default {
  name: 'App',
  computed: {
    ...mapGetters(['isAuthenticated', 'username'])
  },
  created() {
    // 初始化应用，恢复登录状态
    this.$store.dispatch('initApp');
  },
  methods: {
    handleLogout() {
      this.$confirm('确定要退出登录吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        this.$store.dispatch('logout');
        this.$message.success('已退出登录');
        this.$router.push('/login');
      }).catch(() => {
        // 取消退出
      });
    }
  }
}
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.navbar {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 0 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 60px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.navbar-left {
  display: flex;
  align-items: baseline;
}

.logo {
  font-size: 24px;
  font-weight: bold;
  margin: 0;
  margin-right: 10px;
}

.subtitle {
  font-size: 14px;
  opacity: 0.9;
}

.navbar-right {
  display: flex;
  align-items: center;
  gap: 20px;
}

.username {
  font-size: 14px;
}

.username i {
  margin-right: 5px;
}

/* 确保 router-view 占据剩余空间 */
.router-view-container {
  flex: 1;
  overflow: auto;
}
</style>
