<template>
  <div class="workflow-editor">
    <!-- 顶部工具栏 -->
    <div class="toolbar">
      <el-button type="primary" icon="el-icon-document" @click="saveWorkflow">
        保存工作流
      </el-button>
      <el-button type="success" icon="el-icon-video-play" @click="executeWorkflow">
        执行工作流
      </el-button>
      <el-button type="danger" icon="el-icon-delete" @click="clearCanvas">
        清空画布
      </el-button>
      <el-divider direction="vertical"></el-divider>
      <span class="info-text">节点数: {{ nodes.length }}</span>
      <span class="info-text">连接数: {{ connections.length }}</span>
    </div>

    <!-- 主要内容区 -->
    <div class="main-content">
      <!-- 左侧组件库 -->
      <div class="component-library">
        <div class="library-header">
          <i class="el-icon-collection"></i>
          <span>组件库</span>
        </div>
        <div class="library-content">
          <div
            v-for="component in componentLibrary"
            :key="component.type"
            class="component-item"
            :draggable="true"
            @dragstart="handleDragStart($event, component)"
          >
            <i :class="component.icon"></i>
            <span>{{ component.name }}</span>
          </div>
        </div>
      </div>

      <!-- 中间画布区域 -->
      <div class="canvas-area" @drop="handleDrop" @dragover.prevent>
        <div 
          id="canvas" 
          class="canvas"
          @click="handleCanvasClick"
        >
          <!-- 节点渲染 -->
          <div
            v-for="node in nodes"
            :key="node.id"
            :id="'node-' + node.id"
            class="node"
            :class="{ 'node-selected': node.id === selectedNodeId }"
            :style="{ left: node.x + 'px', top: node.y + 'px' }"
            @click.stop="selectNode(node.id)"
          >
            <div class="node-header" :style="{ backgroundColor: node.color }">
              <i :class="node.icon"></i>
              <span>{{ node.name }}</span>
              <i class="el-icon-close node-delete" @click.stop="deleteNode(node.id)"></i>
            </div>
            <div class="node-body">
              <div class="node-description">{{ node.description }}</div>
            </div>
            <!-- 连接点 -->
            <div class="node-endpoint node-endpoint-input" :id="'input-' + node.id"></div>
            <div class="node-endpoint node-endpoint-output" :id="'output-' + node.id"></div>
          </div>
        </div>
      </div>

      <!-- 右侧属性面板 -->
      <div class="property-panel">
        <div class="panel-header">
          <i class="el-icon-setting"></i>
          <span>属性配置</span>
        </div>
        <div class="panel-content">
          <div v-if="selectedNode">
            <el-form label-width="80px" size="small">
              <el-form-item label="节点名称">
                <el-input v-model="selectedNode.name" placeholder="输入节点名称"></el-input>
              </el-form-item>
              <el-form-item label="节点类型">
                <el-tag>{{ selectedNode.type }}</el-tag>
              </el-form-item>
              <el-form-item label="描述">
                <el-input
                  type="textarea"
                  v-model="selectedNode.description"
                  placeholder="输入节点描述"
                  :rows="3"
                ></el-input>
              </el-form-item>
              <el-form-item label="位置">
                <el-col :span="11">
                  <el-input-number v-model="selectedNode.x" :min="0" size="small"></el-input-number>
                </el-col>
                <el-col :span="2" style="text-align: center">×</el-col>
                <el-col :span="11">
                  <el-input-number v-model="selectedNode.y" :min="0" size="small"></el-input-number>
                </el-col>
              </el-form-item>
            </el-form>
          </div>
          <div v-else class="no-selection">
            <i class="el-icon-warning-outline"></i>
            <p>请选择一个节点</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { jsPlumb } from 'jsplumb'

export default {
  name: 'WorkflowEditor',
  data() {
    return {
      // jsPlumb实例
      jsPlumbInstance: null,
      
      // 组件库数据
      componentLibrary: [
        {
          type: 'start',
          name: '开始',
          icon: 'el-icon-video-play',
          color: '#67C23A',
          description: '工作流起点'
        },
        {
          type: 'process',
          name: '处理',
          icon: 'el-icon-setting',
          color: '#409EFF',
          description: '数据处理节点'
        },
        {
          type: 'condition',
          name: '条件',
          icon: 'el-icon-question',
          color: '#E6A23C',
          description: '条件判断节点'
        },
        {
          type: 'end',
          name: '结束',
          icon: 'el-icon-circle-check',
          color: '#F56C6C',
          description: '工作流终点'
        }
      ],
      
      // 画布上的节点
      nodes: [],
      
      // 连接关系
      connections: [],
      
      // 选中的节点ID
      selectedNodeId: null,
      
      // 节点ID计数器
      nodeIdCounter: 1
    }
  },
  computed: {
    // 当前选中的节点对象
    selectedNode() {
      return this.nodes.find(node => node.id === this.selectedNodeId)
    }
  },
  mounted() {
    this.initJsPlumb()
  },
  beforeDestroy() {
    // 清理jsPlumb实例
    if (this.jsPlumbInstance) {
      this.jsPlumbInstance.reset()
    }
  },
  methods: {
    // 初始化jsPlumb
    initJsPlumb() {
      this.jsPlumbInstance = jsPlumb.getInstance({
        Container: 'canvas',
        Connector: ['Bezier', { curviness: 50 }],
        PaintStyle: { stroke: '#409EFF', strokeWidth: 2 },
        HoverPaintStyle: { stroke: '#67C23A', strokeWidth: 3 },
        Endpoint: ['Dot', { radius: 5 }],
        EndpointStyle: { fill: '#409EFF' },
        EndpointHoverStyle: { fill: '#67C23A' }
      })

      // 监听连接建立事件
      this.jsPlumbInstance.bind('connection', (info) => {
        this.connections.push({
          sourceId: info.sourceId.replace('output-', ''),
          targetId: info.targetId.replace('input-', '')
        })
      })

      // 监听连接删除事件
      this.jsPlumbInstance.bind('connectionDetached', (info) => {
        const index = this.connections.findIndex(conn => 
          conn.sourceId === info.sourceId.replace('output-', '') &&
          conn.targetId === info.targetId.replace('input-', '')
        )
        if (index > -1) {
          this.connections.splice(index, 1)
        }
      })
    },

    // 拖拽开始
    handleDragStart(event, component) {
      event.dataTransfer.setData('component', JSON.stringify(component))
    },

    // 放置到画布
    handleDrop(event) {
      event.preventDefault()
      const componentData = JSON.parse(event.dataTransfer.getData('component'))
      
      // 获取画布相对位置
      const canvas = document.getElementById('canvas')
      const rect = canvas.getBoundingClientRect()
      const x = event.clientX - rect.left - 75 // 减去节点宽度的一半
      const y = event.clientY - rect.top - 40  // 减去节点高度的一半

      this.addNode(componentData, x, y)
    },

    // 添加节点到画布
    addNode(componentData, x, y) {
      const node = {
        id: this.nodeIdCounter++,
        ...componentData,
        x,
        y
      }
      
      this.nodes.push(node)

      // 使用nextTick确保DOM更新后再添加端点
      this.$nextTick(() => {
        this.addEndpoints(node.id)
      })

      this.$message.success(`已添加节点: ${node.name}`)
    },

    // 为节点添加连接端点
    // 为节点添加连接端点
    addEndpoints(nodeId) {
      this.jsPlumbInstance.addEndpoint(
        'input-' + nodeId,
        {
          anchor: 'Left',
          isTarget: true,
          maxConnections: -1
        }
      )

      this.jsPlumbInstance.addEndpoint(
        'output-' + nodeId,
        {
          anchor: 'Right',
          isSource: true,
          maxConnections: -1
        }
      )

      // 使节点可拖拽
      this.jsPlumbInstance.draggable('node-' + nodeId, {
        containment: 'parent',
        stop: (event) => {
          const node = this.nodes.find(n => n.id === nodeId)
          if (node) {
            node.x = event.pos[0]
            node.y = event.pos[1]
          }
        }
      })
    },

    // 选中节点
    selectNode(nodeId) {
      this.selectedNodeId = nodeId
    },

    // 点击画布取消选中
    handleCanvasClick() {
      this.selectedNodeId = null
    },

    // 删除节点
    deleteNode(nodeId) {
      this.$confirm('确定删除该节点吗?', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        // 删除节点相关的所有连接
        this.jsPlumbInstance.remove('node-' + nodeId)
        
        // 从数组中移除节点
        const index = this.nodes.findIndex(n => n.id === nodeId)
        if (index > -1) {
          this.nodes.splice(index, 1)
        }

        // 如果删除的是选中节点，清空选中状态
        if (this.selectedNodeId === nodeId) {
          this.selectedNodeId = null
        }

        // 过滤掉相关连接
        this.connections = this.connections.filter(conn => 
          conn.sourceId !== nodeId && conn.targetId !== nodeId
        )

        this.$message.success('节点已删除')
      }).catch(() => {})
    },

    // 清空画布
    clearCanvas() {
      this.$confirm('确定清空所有节点吗?', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        this.jsPlumbInstance.reset()
        this.nodes = []
        this.connections = []
        this.selectedNodeId = null
        this.nodeIdCounter = 1
        this.$message.success('画布已清空')
      }).catch(() => {})
    },

    // 保存工作流
    async saveWorkflow() {
      if (this.nodes.length === 0) {
        this.$message.warning('画布为空，无需保存')
        return
      }

      try {
        const response = await fetch('/api/workflow/save', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            nodes: this.nodes,
            connections: this.connections
          })
        })

        const data = await response.json()
        
        if (data.success) {
          this.$message.success('工作流保存成功')
        } else {
          this.$message.error('保存失败')
        }
      } catch (error) {
        console.error('保存出错:', error)
        this.$message.error('保存失败: ' + error.message)
      }
    },

    // 执行工作流
    async executeWorkflow() {
      if (this.nodes.length === 0) {
        this.$message.warning('画布为空，无法执行')
        return
      }

      try {
        const response = await fetch('/api/workflow/execute', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            nodes: this.nodes,
            connections: this.connections
          })
        })

        const data = await response.json()
        
        if (data.success) {
          this.$message.success('工作流执行成功')
          console.log('执行结果:', data)
        } else {
          this.$message.error('执行失败')
        }
      } catch (error) {
        console.error('执行出错:', error)
        this.$message.error('执行失败: ' + error.message)
      }
    }
  }
}
</script>

<style scoped>
.workflow-editor {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #f5f7fa;
}

/* 顶部工具栏 */
.toolbar {
  height: 60px;
  background: white;
  border-bottom: 1px solid #e4e7ed;
  display: flex;
  align-items: center;
  padding: 0 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.toolbar .el-button {
  margin-right: 10px;
}

.info-text {
  margin: 0 15px;
  color: #606266;
  font-size: 14px;
}

/* 主要内容区 */
.main-content {
  flex: 1;
  display: flex;
  overflow: hidden;
}

/* 左侧组件库 */
.component-library {
  width: 200px;
  background: white;
  border-right: 1px solid #e4e7ed;
  display: flex;
  flex-direction: column;
}

.library-header {
  height: 50px;
  padding: 0 15px;
  display: flex;
  align-items: center;
  border-bottom: 1px solid #e4e7ed;
  font-weight: bold;
  color: #303133;
}

.library-header i {
  margin-right: 8px;
  font-size: 18px;
}

.library-content {
  flex: 1;
  padding: 15px;
  overflow-y: auto;
}

.component-item {
  padding: 12px;
  margin-bottom: 10px;
  background: #f9fafc;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  cursor: move;
  display: flex;
  align-items: center;
  transition: all 0.3s;
}

.component-item:hover {
  background: #ecf5ff;
  border-color: #409EFF;
  transform: translateX(3px);
}

.component-item i {
  margin-right: 8px;
  font-size: 16px;
  color: #409EFF;
}

/* 中间画布区域 */
.canvas-area {
  flex: 1;
  padding: 20px;
  overflow: auto;
}

.canvas {
  width: 100%;
  min-height: 100%;
  background: white;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  position: relative;
  background-image: 
    linear-gradient(#e4e7ed 1px, transparent 1px),
    linear-gradient(90deg, #e4e7ed 1px, transparent 1px);
  background-size: 20px 20px;
}

/* 节点样式 */
.node {
  position: absolute;
  width: 150px;
  background: white;
  border: 2px solid #e4e7ed;
  border-radius: 6px;
  cursor: move;
  transition: all 0.3s;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.node:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.node-selected {
  border-color: #409EFF;
  box-shadow: 0 0 0 3px rgba(64, 158, 255, 0.2);
}

.node-header {
  padding: 10px;
  color: white;
  border-radius: 4px 4px 0 0;
  display: flex;
  align-items: center;
  font-weight: bold;
  position: relative;
}

.node-header i:first-child {
  margin-right: 5px;
}

.node-delete {
  position: absolute;
  right: 8px;
  cursor: pointer;
  opacity: 0.7;
}

.node-delete:hover {
  opacity: 1;
  transform: scale(1.2);
}

.node-body {
  padding: 10px;
}

.node-description {
  font-size: 12px;
  color: #909399;
}

/* 连接端点 */
.node-endpoint {
  width: 10px;
  height: 10px;
  background: #409EFF;
  border-radius: 50%;
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  cursor: crosshair;
}

.node-endpoint-input {
  left: -5px;
}

.node-endpoint-output {
  right: -5px;
}

/* 右侧属性面板 */
.property-panel {
  width: 280px;
  background: white;
  border-left: 1px solid #e4e7ed;
  display: flex;
  flex-direction: column;
}

.panel-header {
  height: 50px;
  padding: 0 15px;
  display: flex;
  align-items: center;
  border-bottom: 1px solid #e4e7ed;
  font-weight: bold;
  color: #303133;
}

.panel-header i {
  margin-right: 8px;
  font-size: 18px;
}

.panel-content {
  flex: 1;
  padding: 15px;
  overflow-y: auto;
}

.no-selection {
  text-align: center;
  padding: 50px 20px;
  color: #909399;
}

.no-selection i {
  font-size: 48px;
  margin-bottom: 10px;
  display: block;
}
</style>
