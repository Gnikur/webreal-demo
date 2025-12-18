module.exports = {
  // 开发服务器配置
  devServer: {
    port: 8080,
    open: true, // 自动打开浏览器
    
    // 配置代理，解决跨域问题
    proxy: {
      '/api': {
        target: process.env.VUE_APP_API_URL || 'http://localhost:3000',
        changeOrigin: true,
        ws: true, // 支持websocket
        pathRewrite: {
          // 如果后端没有/api前缀，可以去掉
          // '^/api': ''
        }
      }
    }
  },

  // 生产环境配置
  publicPath: process.env.NODE_ENV === 'production' 
    ? '/'  // 生产环境路径
    : '/',  // 开发环境路径

  // 输出目录
  outputDir: 'dist',

  // 静态资源目录
  assetsDir: 'static',

  // 生产环境是否生成 sourceMap
  productionSourceMap: false,

  // Webpack 配置
  configureWebpack: {
    resolve: {
      alias: {
        '@': require('path').resolve(__dirname, 'src')
      }
    }
  },

  // CSS 相关配置
  css: {
    extract: process.env.NODE_ENV === 'production',
    sourceMap: false
  }
}
