import Vue from 'vue'
import VueRouter from 'vue-router'
import WorkflowEditor from '../views/WorkflowEditor.vue'

Vue.use(VueRouter)

const routes = [
  {
    path: '/',
    name: 'Home',
    redirect: '/workflow'
  },
  {
    path: '/workflow',
    name: 'WorkflowEditor',
    component: WorkflowEditor,
    meta: {
      title: '工作流编辑器'
    }
  }
]

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes
})

// 路由守卫 - 设置页面标题
router.beforeEach((to, from, next) => {
  if (to.meta.title) {
    document.title = to.meta.title
  }
  next()
})

export default router
