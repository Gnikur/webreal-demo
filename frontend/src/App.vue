<template>
  <div id="app">
    <!-- 顶部导航栏 -->
    <el-header class="app-header">
      <div class="header-logo">
        <i class="el-icon-menu"></i>
        <span>WebReal 图形化编程平台 Demo</span>
      </div>
      <el-menu 
        :default-active="activeMenu" 
        mode="horizontal"
        @select="handleMenuSelect"
        background-color="#409EFF"
        text-color="#fff"
        active-text-color="#ffd04b"
      >
        <el-menu-item index="/workflow">
          <i class="el-icon-s-data"></i>
          <span>工作流编辑器</span>
        </el-menu-item>
      </el-menu>
    </el-header>

    <!-- 主要内容区 -->
    <router-view />
  </div>
</template>

<script>
export default {
  name: 'App',
  data() {
    return {
      activeMenu: '/workflow'
    }
  },
  watch: {
    '$route.path': {
      handler(path) {
        this.activeMenu = path
      },
      immediate: true
    }
  },
  methods: {
    handleMenuSelect(index) {
      if (this.$route.path !== index) {
        this.$router.push(index)
      }
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

/* 顶部导航栏样式 */
.app-header {
  height: 60px !important;
  background: #409EFF;
  display: flex;
  align-items: center;
  padding: 0 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.header-logo {
  display: flex;
  align-items: center;
  color: white;
  font-size: 18px;
  font-weight: bold;
  margin-right: 30px;
}

.header-logo i {
  margin-right: 10px;
  font-size: 24px;
}

.el-menu--horizontal {
  border-bottom: none !important;
}

.el-menu--horizontal > .el-menu-item {
  border-bottom: 2px solid transparent;
}

.el-menu--horizontal > .el-menu-item.is-active {
  border-bottom: 2px solid #ffd04b;
}
</style>
