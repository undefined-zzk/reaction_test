const { StorageManager } = require('../../utils/storage.js')

Page({
  data: {
    navBarHeight: 88,
    statusBarHeight: 20,
    capsuleTop: 0,
    capsuleHeight: 32,
    headerRight: 180,
    testModes: [
      {
        id: 'reaction',
        title: '视觉反应',
        subtitle: '测试你的反应速度',
        icon: '⚡',
        color: '#FF6B6B',
        gradient: 'linear-gradient(135deg, #FF6B6B 0%, #FF8E53 100%)'
      },
      {
        id: 'cps',
        title: '手速测试',
        subtitle: '测试点击速度',
        icon: '👆',
        color: '#4ECDC4',
        gradient: 'linear-gradient(135deg, #4ECDC4 0%, #44A08D 100%)'
      },
      {
        id: 'memory',
        title: '方块记忆',
        subtitle: '测试记忆力',
        icon: '🧠',
        color: '#A78BFA',
        gradient: 'linear-gradient(135deg, #A78BFA 0%, #7C3AED 100%)'
      },
      {
        id: 'stroop',
        title: '文字干扰',
        subtitle: '测试抗干扰能力',
        icon: '🎨',
        color: '#F59E0B',
        gradient: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)'
      }
    ],
    bestScores: {},
    showStats: false
  },

  onLoad () {
    this.loadBestScores()
    this.initNavigationBar()
    this.initCapsule()
  },

  onShow () {
    this.loadBestScores()
  },

  initNavigationBar () {
    const systemInfo = wx.getSystemInfoSync()
    const menuButton = wx.getMenuButtonBoundingClientRect()
    
    const statusBarHeight = systemInfo.statusBarHeight || 20
    const navHeight = menuButton.height + (menuButton.top - statusBarHeight) * 2
    const navBarHeight = statusBarHeight + navHeight
    const capsuleTop = menuButton.top
    const capsuleHeight = menuButton.height
    
    this.setData({
      statusBarHeight,
      navBarHeight,
      capsuleTop,
      capsuleHeight
    })
  },

  initCapsule () {
    const menuButton = wx.getMenuButtonBoundingClientRect()
    const systemInfo = wx.getSystemInfoSync()
    const headerRight = systemInfo.windowWidth - menuButton.left + 10
    this.setData({
      headerRight: headerRight
    })
  },

  loadBestScores () {
    const stats = StorageManager.getAllStats()
    if (!stats || !stats.bestScores) {
      console.warn('获取最佳成绩失败')
      this.setData({ bestScores: {} })
      return
    }

    const memoryLevel = StorageManager.getMemoryLevel() || 0

    const bestScores = {}

    if (memoryLevel > 0) {
      bestScores.memory = `Level ${memoryLevel}`
    }

    Object.keys(stats.bestScores).forEach(key => {
      if (key === 'memory') return
      const scoreData = stats.bestScores[key]
      if (scoreData && typeof scoreData.score === 'number') {
        if (key === 'cps') {
          bestScores[key] = `${scoreData.score.toFixed(1)} CPS`
        } else if (key === 'stroop') {
          bestScores[key] = `${scoreData.score.toFixed(0)}分`
        } else {
          bestScores[key] = `${scoreData.score.toFixed(0)}ms`
        }
      }
    })

    this.setData({ bestScores })
  },

  navigateToTest (e) {
    const { id } = e.currentTarget.dataset
    wx.vibrateShort({ type: 'light' })

    wx.navigateTo({
      url: `/pages/${id}/${id}`
    })
  },

  navigateToSettings () {
    wx.vibrateShort({ type: 'light' })
    wx.navigateTo({
      url: '/pages/settings/settings'
    })
  },

  navigateToMiniProgram () {
    wx.vibrateShort({ type: 'light' })
    wx.navigateToMiniProgram({
      appId: 'wx3104a8a7e1ed35cb',
      path: '',
      success: () => {
        console.log('跳转成功')
      },
      fail: (err) => {
        console.error('跳转失败', err)
        wx.showToast({
          title: '跳转失败，请稍后重试',
          icon: 'none'
        })
      }
    })
  },

  navigateToWoodenFish () {
    wx.vibrateShort({ type: 'light' })
    wx.navigateToMiniProgram({
      appId: 'wxe9fb7faea46c25ec',
      path: '',
      success: () => {
        console.log('跳转木鱼福签成功')
      },
      fail: (err) => {
        console.error('跳转失败', err)
        wx.showToast({
          title: '跳转失败，请稍后重试',
          icon: 'none'
        })
      }
    })
  },

  onShareAppMessage () {
    return {
      title: '反应力测试助手 - 测试你的极限反应速度！',
      path: '/pages/index/index'
    }
  },

  onShareTimeline () {
    return {
      title: '反应力测试助手 - 测试你的极限反应速度',
      query: ''
    }
  },
})
