const { StorageManager } = require('../../utils/storage.js')

Page({
  data: {
    navBarHeight: 88,
    settings: {
      vibration: true,
      sound: true
    },
    stats: null,
    bestScoresFormatted: {}
  },

  onLoad () {
    this.initNavigationBar()
    this.loadSettings()
    this.loadStats()
  },

  initNavigationBar() {
    const systemInfo = wx.getSystemInfoSync()
    const menuButton = wx.getMenuButtonBoundingClientRect()
    
    const statusBarHeight = systemInfo.statusBarHeight || 20
    const navHeight = menuButton.height + (menuButton.top - statusBarHeight) * 2
    const navBarHeight = statusBarHeight + navHeight
    
    this.setData({
      navBarHeight
    })
  },

  loadSettings () {
    const settings = StorageManager.getUserSettings()
    this.setData({ settings })
  },

  loadStats () {
    const stats = StorageManager.getAllStats()
    if (!stats || !stats.bestScores) {
      var setDataObj = {}
      setDataObj.stats = {}
      setDataObj.bestScoresFormatted = {}
      setDataObj.memoryLevel = 0
      this.setData(setDataObj)
      return
    }

    const bestScoresFormatted = {}
    const memoryLevel = StorageManager.getMemoryLevel() || 0

    Object.keys(stats.bestScores).forEach(key => {
      const scoreData = stats.bestScores[key]
      if (scoreData && typeof scoreData.score === 'number') {
        if (key === 'cps') {
          bestScoresFormatted[key] = scoreData.score.toFixed(1) + ' CPS'
        } else if (key === 'memory') {
          bestScoresFormatted[key] = 'Level ' + Math.round(scoreData.score)
        } else if (key === 'stroop') {
          bestScoresFormatted[key] = scoreData.score.toFixed(0) + '分'
        } else {
          bestScoresFormatted[key] = scoreData.score.toFixed(0) + 'ms'
        }
      }
    })

    var setDataObj = {}
    setDataObj.stats = stats
    setDataObj.bestScoresFormatted = bestScoresFormatted
    setDataObj.memoryLevel = memoryLevel
    this.setData(setDataObj)
  },

  toggleVibration () {
    const settings = Object.assign({}, this.data.settings)
    settings.vibration = !settings.vibration
    StorageManager.setUserSettings(settings)
    var setDataObj = {}
    setDataObj.settings = settings
    this.setData(setDataObj)

    if (settings.vibration) {
      wx.vibrateShort({ type: 'light' })
    }
  },

  toggleSound () {
    const settings = Object.assign({}, this.data.settings)
    settings.sound = !settings.sound
    StorageManager.setUserSettings(settings)
    var setDataObj = {}
    setDataObj.settings = settings
    this.setData(setDataObj)
  },

  openStats (e) {
    const type = e && e.currentTarget && e.currentTarget.dataset && e.currentTarget.dataset.type
    if (!type) return
    wx.navigateTo({
      url: `/pages/result/result?type=${type}`
    })
  },

  clearAllData () {
    wx.showModal({
      title: '确认清除',
      content: '这将清除所有历史记录和设置，确定要继续吗？',
      success: (res) => {
        if (res.confirm) {
          StorageManager.clearAllData()
          this.loadSettings()
          this.loadStats()
          wx.showToast({
            title: '已清除',
            icon: 'success'
          })
        }
      }
    })
  },

  goBack () {
    wx.navigateBack()
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
  }
})
