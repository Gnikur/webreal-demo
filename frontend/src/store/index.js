import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    // 用户信息
    user: null,
    // 认证token
    token: null
  },

  getters: {
    // 判断是否已登录
    isAuthenticated: state => {
      return !!state.token && !!state.user
    },
    
    // 获取用户名
    username: state => {
      return state.user ? state.user.username : ''
    },
    
    // 获取用户完整信息
    userInfo: state => {
      return state.user
    },
    
    // 获取token
    token: state => {
      return state.token
    }
  },

  mutations: {
    // 设置用户信息
    setUser(state, user) {
      state.user = user
    },
    
    // 设置token
    setToken(state, token) {
      state.token = token
    },
    
    // 清除认证信息
    clearAuth(state) {
      state.user = null
      state.token = null
    }
  },

  actions: {
    // 初始化应用 - 从localStorage恢复登录状态
    initApp({ commit }) {
      try {
        const token = localStorage.getItem('token')
        const userStr = localStorage.getItem('user')
        
        if (token && userStr) {
          const user = JSON.parse(userStr)
          commit('setToken', token)
          commit('setUser', user)
        }
      } catch (error) {
        console.error('初始化应用失败:', error)
        // 如果解析失败，清除可能损坏的数据
        localStorage.removeItem('token')
        localStorage.removeItem('user')
      }
    },
    
    // 登出
    logout({ commit }) {
      // 清除localStorage
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      
      // 清除vuex状态
      commit('clearAuth')
    },
    
    // 登录（可选：如果想在store中统一处理登录逻辑）
    async login({ commit }, { username, password }) {
      try {
        const apiUrl = process.env.VUE_APP_API_URL || ''
        const response = await fetch(`${apiUrl}/api/auth/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ username, password })
        })

        const data = await response.json()

        if (response.ok && data.success) {
          // 保存到localStorage
          localStorage.setItem('token', data.token)
          localStorage.setItem('user', JSON.stringify(data.user))
          
          // 更新vuex状态
          commit('setToken', data.token)
          commit('setUser', data.user)
          
          return { success: true, data }
        } else {
          return { success: false, error: data.error || '登录失败' }
        }
      } catch (error) {
        console.error('Login error:', error)
        return { success: false, error: '网络连接失败' }
      }
    },
    
    // 注册（可选：如果想在store中统一处理注册逻辑）
    async register({ commit }, { username, email, password }) {
      try {
        const apiUrl = process.env.VUE_APP_API_URL || ''
        const response = await fetch(`${apiUrl}/api/auth/register`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ username, email, password })
        })

        const data = await response.json()

        if (response.ok && data.success) {
          // 保存到localStorage
          localStorage.setItem('token', data.token)
          localStorage.setItem('user', JSON.stringify(data.user))
          
          // 更新vuex状态
          commit('setToken', data.token)
          commit('setUser', data.user)
          
          return { success: true, data }
        } else {
          return { success: false, error: data.error || '注册失败' }
        }
      } catch (error) {
        console.error('Register error:', error)
        return { success: false, error: '网络连接失败' }
      }
    }
  },

  modules: {
    // 可以在这里添加其他模块
  }
})
