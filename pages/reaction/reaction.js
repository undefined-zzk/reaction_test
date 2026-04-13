const { HighPrecisionTimer, getTimestamp } = require('../../utils/time.js')
const { StorageManager } = require('../../utils/storage.js')

const TOTAL_TESTS = 5
const COLORS = {
  RED: '#3D332B',      // 深棕色（等待状态）
  GREEN: '#4A5D3F'     // 深绿色（点击状态）
}

Page({
  data: {
    navBarHeight: 88,
    status: 'ready',
    backgroundColor: COLORS.RED,
    instruction: '点击屏幕开始',
    result: null,
    penalty: false,
    currentTest: 0,
    times: [],
    stats: null,
    settings: null
  },

  timer: null,
  startTime: 0,
  clickTimer: null,
  isProcessing: false, // 防止重复点击

  onLoad() {
    this.loadSettings()
    this.resetNavBar()
    this.initNavigationBar()

    // 获取系统信息，针对不同平台优化
    wx.getSystemInfo({
      success: (res) => {
        this.systemInfo = {
          platform: res.platform, // ios, android, devtools
          system: res.system,
          pixelRatio: res.pixelRatio
        }
      }
    })
  },

  onUnload() {
    this.clearTimer()
  },

  onShareAppMessage() {
    return {
      title: '反应力测试助手 - 测试你的视觉反应速度！',
      path: '/pages/index/index'
    }
  },

  onShareTimeline() {
    return {
      title: '反应力测试助手 - 测试你的极限反应速度',
      query: ''
    }
  },

  onShow() {
    this.resetNavBar()
  },

  clearTimer() {
    if (this.timer) {
      clearTimeout(this.timer)
      this.timer = null
    }
    if (this.clickTimer) {
      clearTimeout(this.clickTimer)
      this.clickTimer = null
    }
  },

  resetNavBar() {
    wx.setNavigationBarColor({
      frontColor: '#ffffff',
      backgroundColor: COLORS.RED
    })
  },

  loadSettings() {
    const settings = StorageManager.getUserSettings()
    this.setData({ settings })
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

  handleTap() {
    const status = this.data.status

    if (status === 'ready' || status === 'result') {
      this.startTest()
    } else if (status === 'waiting') {
      this.handleEarlyClick()
    }
  },

  startTest() {
    this.clearTimer()

    this.setData({
      status: 'waiting',
      backgroundColor: COLORS.RED,
      instruction: '等待变色...',
      penalty: false
    })

    wx.setNavigationBarColor({
      frontColor: '#ffffff',
      backgroundColor: COLORS.RED
    })

    const delay = 2000 + Math.random() * 3000

    this.timer = setTimeout(() => {
      this.showGreen()
    }, delay)
  },

  showGreen() {
    // 使用 setData 回调确保渲染完成后再记录时间
    this.setData({
      status: 'clickable',
      backgroundColor: COLORS.GREEN,
      instruction: '点击！'
    }, () => {
      // 在渲染完成后立即记录开始时间，减少延迟
      this.startTime = getTimestamp()
      this.isProcessing = false
    })

    wx.setNavigationBarColor({
      frontColor: '#ffffff',
      backgroundColor: COLORS.GREEN
    })

    if (this.data.settings && this.data.settings.vibration) {
      wx.vibrateShort({ type: 'medium' })
    }

    // 设置3秒超时机制
    this.clickTimer = setTimeout(() => {
      if (this.data.status === 'clickable' && !this.isProcessing) {
        this.isProcessing = true
        // 3秒内未点击，记录为3000ms
        const reactionTime = 3000
        const times = this.data.times.slice()
        times.push(reactionTime)
        const currentTest = this.data.currentTest + 1

        if (currentTest < TOTAL_TESTS) {
          this.showIntermediateResult(reactionTime, currentTest, times)
        } else {
          this.showFinalResult(times, currentTest)
        }
      }
    }, 3000)
  },

  handleEarlyClick() {
    this.clearTimer()
    this.isProcessing = true

    if (this.data.settings && this.data.settings.vibration) {
      wx.vibrateLong()
    }

    this.setData({
      status: 'result',
      backgroundColor: COLORS.RED,
      instruction: '太早了！罚时',
      penalty: true
    })

    wx.setNavigationBarColor({
      frontColor: '#ffffff',
      backgroundColor: COLORS.RED
    })

    setTimeout(() => {
      this.isProcessing = false
      this.startTest()
    }, 1500)
  },

  handleValidClick() {
    // 防止重复处理
    if (this.isProcessing) {
      return
    }
    this.isProcessing = true

    // 立即记录结束时间，减少延迟
    const endTime = getTimestamp()

    // 清理3秒超时定时器
    if (this.clickTimer) {
      clearTimeout(this.clickTimer)
      this.clickTimer = null
    }

    const reactionTime = endTime - this.startTime

    const times = this.data.times.slice()
    times.push(reactionTime)
    const currentTest = this.data.currentTest + 1

    if (currentTest < TOTAL_TESTS) {
      this.showIntermediateResult(reactionTime, currentTest, times)
    } else {
      this.showFinalResult(times, currentTest)
    }
  },

  showIntermediateResult(reactionTime, currentTest, times) {
    this.setData({
      status: 'ready',
      backgroundColor: COLORS.RED,
      instruction: `${currentTest}/${TOTAL_TESTS} - 点击继续`,
      result: {
        time: reactionTime.toFixed(0),
        grade: HighPrecisionTimer.getGrade(reactionTime, 'reaction')
      },
      currentTest,
      times
    }, () => {
      // 重置处理标志
      this.isProcessing = false
    })

    wx.setNavigationBarColor({
      frontColor: '#ffffff',
      backgroundColor: COLORS.RED
    })

    setTimeout(() => {
      if (this.data.status === 'ready') {
        this.setData({
          result: null,
          instruction: '点击屏幕开始'
        })
      }
    }, 1000)
  },

  showFinalResult(times, currentTest) {
    const avgTime = times.reduce((a, b) => a + b, 0) / times.length
    const maxTime = times.length > 0 ? Math.max.apply(null, times) : 0
    const minTime = times.length > 0 ? Math.min.apply(null, times) : 0

    const isNewBest = StorageManager.setBestScore('reaction', avgTime)
    StorageManager.addRecentScore('reaction', avgTime)

    this.setData({
      status: 'final',
      backgroundColor: COLORS.RED,
      instruction: '测试完成',
      result: {
        time: avgTime.toFixed(0),
        grade: HighPrecisionTimer.getGrade(avgTime, 'reaction')
      },
      currentTest,
      times,
      stats: {
        avg: avgTime.toFixed(0),
        max: maxTime.toFixed(0),
        min: minTime.toFixed(0),
        times
      },
      isNewBest
    })

    wx.setNavigationBarColor({
      frontColor: '#ffffff',
      backgroundColor: COLORS.RED
    })
  },

  onContainerTap(e) {
    const status = this.data.status

    // 在绿色状态下，优先处理点击
    if (status === 'clickable') {
      // 立即记录时间
      const eventTime = getTimestamp()
      this.handleValidClickWithTime(eventTime)
    } else {
      this.handleTap()
    }
  },

  handleValidClickWithTime(eventTime) {
    // 防止重复处理
    if (this.isProcessing) {
      return
    }
    this.isProcessing = true

    // 清理3秒超时定时器
    if (this.clickTimer) {
      clearTimeout(this.clickTimer)
      this.clickTimer = null
    }

    const reactionTime = eventTime - this.startTime

    const times = this.data.times.slice()
    times.push(reactionTime)
    const currentTest = this.data.currentTest + 1

    if (currentTest < TOTAL_TESTS) {
      this.showIntermediateResult(reactionTime, currentTest, times)
    } else {
      this.showFinalResult(times, currentTest)
    }
  },

  navigateToResult() {
    const result = this.data.result
    const stats = this.data.stats
    const isNewBest = this.data.isNewBest
    const gradeStr = encodeURIComponent(JSON.stringify(result.grade))
    const statsStr = encodeURIComponent(JSON.stringify(stats))
    const url = '/pages/result/result?type=reaction&score=' + result.time + '&grade=' + gradeStr + '&stats=' + statsStr + '&isBest=' + isNewBest
    wx.navigateTo({
      url: url
    })
  },

  shareResult() {
    this.showShareImageMenu()
  },

  showShareImageMenu() {
    this.generateShareImage()
  },

  generateShareImage() {
    const ctx = wx.createCanvasContext('shareCanvas', this)
    const canvasWidth = 540
    const canvasHeight = 720

    const stats = this.data.stats
    const result = this.data.result
    const isNewBest = this.data.isNewBest
    const avgTime = stats ? stats.avg : 0

    ctx.fillStyle = '#667eea'
    ctx.fillRect(0, 0, canvasWidth, canvasHeight)

    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 32px Arial'
    ctx.textAlign = 'center'
    ctx.fillText('反应力测试助手', canvasWidth / 2, 80)

    ctx.font = '24px Arial'
    ctx.fillText('视觉反应测试', canvasWidth / 2, 140)

    ctx.font = 'bold 48px Arial'
    ctx.fillStyle = '#ffd700'
    ctx.fillText(avgTime + 'ms', canvasWidth / 2, 260)

    if (isNewBest) {
      ctx.fillStyle = '#ff6b6b'
      ctx.font = 'bold 28px Arial'
      ctx.fillText('新记录！', canvasWidth / 2, 320)
    }

    const maxTime = stats ? stats.max : 0
    const minTime = stats ? stats.min : 0

    ctx.fillStyle = '#ffffff'
    ctx.font = '16px Arial'
    ctx.fillText('最高: ' + maxTime + 'ms  |  最低: ' + minTime + 'ms', canvasWidth / 2, 370)

    ctx.font = '18px Arial'
    ctx.fillText('我的平均反应速度是' + avgTime + 'ms', canvasWidth / 2, 440)
    ctx.fillText('快来挑战我吧！', canvasWidth / 2, 480)

    ctx.font = '16px Arial'
    ctx.fillStyle = 'rgba(255,255,255,0.7)'
    ctx.fillText('反应力测试助手', canvasWidth / 2, 680)

    ctx.draw(false, () => {
      setTimeout(() => {
        wx.canvasToTempFilePath({
          canvasId: 'shareCanvas',
          success: (res) => {
            this.shareImage(res.tempFilePath)
          },
          fail: (err) => {
            console.error('转换为图片失败:', err)
            wx.showToast({
              title: '生成分享图失败',
              icon: 'error'
            })
          }
        }, this)
      }, 100)
    })
  },

  shareImage(imagePath) {
    wx.showShareImageMenu({
      path: imagePath,
      entrancePath: '/pages/index/index',
      success(res) {
        console.log('分享成功', res)
      },
      fail(err) {
        console.error('分享失败', err)
      }
    })
  },

  resetAll() {
    this.clearTimer()
    this.isProcessing = false

    this.setData({
      status: 'ready',
      backgroundColor: COLORS.RED,
      instruction: '点击屏幕开始',
      result: null,
      penalty: false,
      currentTest: 0,
      times: [],
      stats: null,
      isNewBest: false
    })
  },

  goBack() {
    wx.navigateBack()
  },

  onShareAppMessage() {
    const stats = this.data.stats
    const avgTime = stats ? stats.avg : 0
    const title = '我的平均反应速度是' + avgTime + 'ms！快来挑战吧！'
    return {
      title: title,
      path: '/pages/index/index'
    }
  }
})
