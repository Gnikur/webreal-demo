import Vue from 'vue'
import VueRouter from 'vue-router'
import store from '../store'

Vue.use(VueRouter)

const routes = [
  {
    path: '/',
    redirect: '/login'
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/LoginView.vue'),
    meta: { requiresGuest: true } // 只有未登录用户可以访问
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('../views/RegisterView.vue'),
    meta: { requiresGuest: true } // 只有未登录用户可以访问
  },
  {
    path: '/editor',
    name: 'WorkflowEditor',
    component: () => import('../views/WorkflowEditor.vue'),
    meta: { requiresAuth: true } // 需要登录才能访问
  }
]

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes
})

// 路由守卫
router.beforeEach((to, from, next) => {
  const isAuthenticated = store.getters.isAuthenticated;
  
  // 需要登录的页面
  if (to.matched.some(record => record.meta.requiresAuth)) {
    if (!isAuthenticated) {
      // 未登录，跳转到登录页
      next({
        path: '/login',
        query: { redirect: to.fullPath } // 保存要跳转的路径，登录后可以回到这里
      });
    } else {
      next();
    }
  }
  // 只允许未登录用户访问的页面（如登录、注册页）
  else if (to.matched.some(record => record.meta.requiresGuest)) {
    if (isAuthenticated) {
      // 已登录，跳转到编辑器
      next('/editor');
    } else {
      next();
    }
  }
  // 其他页面
  else {
    next();
  }
});

export default router
