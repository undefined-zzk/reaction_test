const { StorageManager } = require('../../utils/storage.js')

Page({
  data: {
    navBarHeight: 88,
    gridSize: 4,
    level: 1,
    status: 'ready',
    grid: [],
    sequence: [],
    userSequence: [],
    showSequence: false,
    currentHighlight: -1,
    message: '',
    score: 0,
    isCorrect: false
  },

  timers: [],

  onLoad () {
    this.loadSettings()
    this.initGrid()
    this.initNavigationBar()
  },

  onUnload () {
    this.clearAllTimers()
  },

  onShareAppMessage () {
    return {
      title: '反应力测试助手 - 测试你的记忆力！',
      path: '/pages/index/index'
    }
  },

  onShareTimeline () {
    return {
      title: '反应力测试助手 - 测试你的记忆力',
      query: ''
    }
  },

  clearAllTimers () {
    this.timers.forEach(timerId => clearTimeout(timerId))
    this.timers = []
  },

  onShow () {
    this.setData({
      level: 1,
      status: 'ready',
      message: '',
      score: 0,
      userSequence: [],
      sequence: []
    })
    this.initGrid()
  },

  loadSettings () {
    const settings = StorageManager.getUserSettings()
    this.setData({
      settings
    })
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

  initGrid () {
    const grid = []
    for (let i = 0; i < 16; i++) {
      grid.push({
        id: i,
        active: false,
        wrong: false,
        clicked: false,
        clickOrder: 0
      })
    }
    this.setData({ grid })
  },

  startGame () {
    if (this.data.status === 'input') {
      this.setData({
        status: 'showing',
        message: '记住顺序...',
        userSequence: [],
        score: this.data.score
      })

      this.initGrid()
      this.generateSequence()
      this.showSequence()
      return
    }

    if (this.data.status === 'ready') {
      this.setData({
        status: 'showing',
        message: '记住顺序...',
        userSequence: [],
        score: 0
      })

      this.initGrid()
      this.generateSequence()
      this.showSequence()
      return
    }

    if (this.data.status === 'success') {
      this.nextLevel()
      return
    }

    if (this.data.status === 'result') {
      this.resetGame()
      return
    }
  },

  generateSequence () {
    const sequenceLength = Math.min(3 + this.data.level, 10)
    const sequence = []

    while (sequence.length < sequenceLength) {
      const randomIndex = Math.floor(Math.random() * 16)
      if (!sequence.includes(randomIndex)) {
        sequence.push(randomIndex)
      }
    }

    this.setData({ sequence })
  },

  showSequence () {
    const sequence = this.data.sequence
    let index = 0

    const showNext = () => {
      if (index >= sequence.length) {
        const timer = setTimeout(() => {
          this.setData({
            status: 'input',
            message: '按顺序点击方块',
            showSequence: false,
            currentHighlight: -1
          })
          this.initGrid()
        }, 500)
        this.timers.push(timer)
        return
      }

      const highlightIndex = sequence[index]
      const grid = this.data.grid.map((item, i) => Object.assign({}, item, { active: i === highlightIndex }))

      this.setData({
        grid,
        showSequence: true,
        currentHighlight: highlightIndex
      })

      if (this.data.settings && this.data.settings.vibration) {
        wx.vibrateShort({ type: 'light' })
      }

      const timer1 = setTimeout(() => {
        const grid = this.data.grid.map((item) => Object.assign({}, item, { active: false }))

        this.setData({
          grid,
          showSequence: false,
          currentHighlight: -1
        })

        const timer2 = setTimeout(() => {
          index++
          showNext()
        }, 300)
        this.timers.push(timer2)
      }, 600)
      this.timers.push(timer1)
    }

    showNext()
  },

  handleGridClick (e) {
    if (this.data.status !== 'input') return

    const index = e.currentTarget.dataset.index
    const sequence = this.data.sequence
    const userSequence = this.data.userSequence
    const settings = this.data.settings

    const expectedIndex = sequence[userSequence.length]
    const clickOrder = userSequence.length + 1

    if (settings.vibration) {
      wx.vibrateShort({ type: 'light' })
    }

    if (expectedIndex !== index) {
      const grid = this.data.grid.map((item, i) => Object.assign({}, item, { wrong: i === index }))
      this.setData({ grid, status: 'failed' })
      this.gameOver(false)
      return
    }

    const grid = this.data.grid.map((item, i) => Object.assign({}, item, { clicked: i === index ? true : item.clicked, clickOrder: i === index ? clickOrder : item.clickOrder }))
    this.setData({ grid })

    const newUserSequence = userSequence.slice()
    newUserSequence.push(index)
    this.setData({ userSequence: newUserSequence })

    if (newUserSequence.length === sequence.length) {
      this.levelComplete()
    }
  },

  levelComplete () {
    const passedLevel = this.data.level
    const currentBest = StorageManager.getMemoryLevel()
    if (passedLevel > currentBest) {
      StorageManager.setMemoryLevel(passedLevel)
    }

    this.setData({
      status: 'success',
      message: `第${this.data.level}关完成！`,
      isCorrect: true
    })

    if (this.data.settings && this.data.settings.vibration) {
      wx.vibrateShort({ type: 'medium' })
    }
  },

  nextLevel () {
    const newLevel = this.data.level + 1
    const newScore = this.data.score + this.data.sequence.length * 100

    this.setData({
      level: newLevel,
      score: newScore,
      userSequence: [],
      isCorrect: false,
      status: 'showing',
      message: '记住顺序...'
    })

    this.initGrid()
    this.generateSequence()
    this.showSequence()
  },

  gameOver (success) {
    const finalScore = this.data.score
    const bestLevel = this.data.level

    const isNewBest = StorageManager.setBestScore('memory', bestLevel)
    StorageManager.addRecentScore('memory', bestLevel, { totalScore: finalScore })

    this.setData({
      status: 'result',
      message: success ? '恭喜通关！' : '游戏结束',
      isNewBest
    })

    if (this.data.settings && this.data.settings.vibration) {
      wx.vibrateLong()
    }
  },

  resetGame () {
    this.setData({
      level: 1,
      status: 'showing',
      message: '记住顺序...',
      score: 0,
      userSequence: [],
      sequence: []
    })
    this.initGrid()
    this.generateSequence()
    this.showSequence()
  },

  navigateToResult () {
    const level = this.data.level
    const score = this.data.score
    const isNewBest = this.data.isNewBest
    const url = '/pages/result/result?type=memory&score=' + (level - 1) + '&totalScore=' + score + '&isBest=' + isNewBest
    wx.navigateTo({
      url: url
    })
  },

  shareResult() {
    this.generateShareImage()
  },

  generateShareImage() {
    const ctx = wx.createCanvasContext('shareCanvas', this)
    const canvasWidth = 540
    const canvasHeight = 720

    const level = this.data.level - 1
    const score = this.data.score
    const isNewBest = this.data.isNewBest

    // 背景色 - 深桃花心木
    ctx.fillStyle = '#1C1714'
    ctx.fillRect(0, 0, canvasWidth, canvasHeight)

    // 添加古橡木色装饰边框
    ctx.fillStyle = '#251E19'
    ctx.fillRect(20, 20, canvasWidth - 40, canvasHeight - 40)

    // 黄铜色边框
    ctx.strokeStyle = '#C9A962'
    ctx.lineWidth = 2
    ctx.strokeRect(20, 20, canvasWidth - 40, canvasHeight - 40)

    // 标题 - 羊皮纸色
    ctx.fillStyle = '#E8DFD4'
    ctx.font = 'bold 32px Arial'
    ctx.textAlign = 'center'
    ctx.fillText('反应力测试助手', canvasWidth / 2, 100)

    // 测试类型
    ctx.font = '24px Arial'
    ctx.fillStyle = '#9C8B7A'
    ctx.fillText('方块记忆测试', canvasWidth / 2, 150)

    // 关卡 - 黄铜色
    ctx.font = 'bold 56px Arial'
    ctx.fillStyle = '#C9A962'
    ctx.fillText('Level ' + level, canvasWidth / 2, 280)

    // 新记录标记 - 图书馆深红
    if (isNewBest) {
      ctx.fillStyle = '#8B2635'
      ctx.fillRect(canvasWidth / 2 - 100, 310, 200, 50)
      ctx.fillStyle = '#C9A962'
      ctx.font = 'bold 24px Arial'
      ctx.fillText('🎉 新记录', canvasWidth / 2, 345)
    }

    // 得分信息
    ctx.fillStyle = '#9C8B7A'
    ctx.font = '18px Arial'
    const yOffset = isNewBest ? 400 : 350
    ctx.fillText('总得分: ' + score, canvasWidth / 2, yOffset)

    // 分享文案 - 羊皮纸色
    ctx.fillStyle = '#E8DFD4'
    ctx.font = '20px Arial'
    ctx.fillText('我通过了 Level ' + level + ' 记忆测试', canvasWidth / 2, yOffset + 60)
    ctx.fillText('快来挑战我吧！', canvasWidth / 2, yOffset + 100)

    // 底部提示
    ctx.font = '16px Arial'
    ctx.fillStyle = '#9C8B7A'
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

  goBack () {
    wx.navigateBack()
  },

  onShareAppMessage () {
    const level = this.data.level
    const title = '我通过了' + (level - 1) + '关记忆测试！快来挑战吧！'
    return {
      title: title,
      path: '/pages/index/index'
    }
  }
})