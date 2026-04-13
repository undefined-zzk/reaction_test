const { HighPrecisionTimer, getTimestamp } = require('../../utils/time.js')
const { StorageManager } = require('../../utils/storage.js')

Page({
  data: {
    navBarHeight: 88,
    status: 'ready',
    currentWord: null,
    score: 0,
    totalQuestions: 0,
    correctCount: 0,
    avgTime: 0,
    times: [],
    showFeedback: false,
    feedbackType: '',
    round: 1,
    maxRounds: 10,
    colors: [
      { name: '红色', value: '#ff6b6b', code: 'red' },
      { name: '蓝色', value: '#4a90e2', code: 'blue' },
      { name: '绿色', value: '#4ecdc4', code: 'green' },
      { name: '黄色', value: '#f59e0b', code: 'yellow' },
      { name: '紫色', value: '#a78bfa', code: 'purple' },
      { name: '橙色', value: '#f97316', code: 'orange' }
    ]
  },

  colors: [
    { name: '红色', value: '#FF6B6B', code: 'red' },
    { name: '蓝色', value: '#4A90E2', code: 'blue' },
    { name: '绿色', value: '#4ECDC4', code: 'green' },
    { name: '黄色', value: '#F59E0B', code: 'yellow' },
    { name: '紫色', value: '#A78BFA', code: 'purple' },
    { name: '橙色', value: '#F97316', code: 'orange' }
  ],

  words: ['红', '蓝', '绿', '黄', '紫', '橙'],

  startTime: 0,
  feedbackTimer: null,

  onLoad () {
    this.loadSettings()
    this.initNavigationBar()
  },

  onUnload () {
    if (this.feedbackTimer) {
      clearTimeout(this.feedbackTimer)
      this.feedbackTimer = null
    }
  },

  loadSettings () {
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

  onShow () {
    if (this.data.status === 'testing') {
      if (this.feedbackTimer) {
        clearTimeout(this.feedbackTimer)
        this.feedbackTimer = null
      }
      this.resetTest()
    }
  },

  startTest () {
    this.setData({
      status: 'testing',
      score: 0,
      totalQuestions: 0,
      correctCount: 0,
      avgTime: 0,
      times: [],
      round: 0
    })

    this.nextQuestion()
  },

  nextQuestion () {
    if (this.data.round >= this.data.maxRounds) {
      this.endTest()
      return
    }

    const textColor = this.colors[Math.floor(Math.random() * this.colors.length)]
    const textColorCode = textColor.code.charAt(0)
    const colorIndex = this.colors.findIndex(c => c.code.charAt(0) === textColorCode)
    let wordText = this.words[Math.floor(Math.random() * this.words.length)]

    while (colorIndex >= 0 && wordText === this.words[colorIndex]) {
      wordText = this.words[Math.floor(Math.random() * this.words.length)]
    }

    const word = {
      text: wordText,
      color: textColor.value,
      colorName: textColor.name,
      colorCode: textColor.code
    }

    this.startTime = getTimestamp()

    this.setData({
      currentWord: word,
      round: this.data.round + 1,
      showFeedback: false
    })
  },

  handleColorSelect (e) {
    if (this.data.status !== 'testing' || this.data.showFeedback) return

    const { color } = e.currentTarget.dataset
    const { currentWord } = this.data
    const endTime = getTimestamp()
    const reactionTime = endTime - this.startTime

    const isCorrect = color === currentWord.colorCode
    const times = this.data.times.slice()
    times.push(reactionTime)
    const avgTime = times.reduce((a, b) => a + b, 0) / times.length

    this.setData({
      showFeedback: true,
      feedbackType: isCorrect ? 'correct' : 'wrong',
      totalQuestions: this.data.totalQuestions + 1,
      correctCount: isCorrect ? this.data.correctCount + 1 : this.data.correctCount,
      score: isCorrect ? this.data.score + Math.max(100 - Math.floor(reactionTime / 10), 10) : this.data.score,
      times,
      avgTime
    })

    if (this.data.settings && this.data.settings.vibration) {
      wx.vibrateShort({ type: isCorrect ? 'light' : 'medium' })
    }

    this.feedbackTimer = setTimeout(() => {
      this.nextQuestion()
    }, 800)
  },

  endTest () {
    const accuracy = (this.data.correctCount / this.data.totalQuestions * 100).toFixed(1)
    const avgTimeNum = this.data.avgTime
    const avgTime = Math.round(avgTimeNum)
    const avgTimeFixed = avgTimeNum.toFixed(0)

    const isNewBest = StorageManager.setBestScore('stroop', this.data.score)
    StorageManager.addRecentScore('stroop', this.data.score, { accuracy: parseFloat(accuracy) })

    this.setData({
      status: 'result',
      isNewBest,
      avgTime: avgTimeFixed
    })

    if (this.data.settings && this.data.settings.vibration) {
      wx.vibrateShort({ type: 'medium' })
    }
  },

  resetTest () {
    this.setData({
      status: 'ready',
      currentWord: null,
      score: 0,
      totalQuestions: 0,
      correctCount: 0,
      avgTime: 0,
      times: [],
      showFeedback: false,
      round: 0
    })
  },

  navigateToResult () {
    const { score, correctCount, totalQuestions, avgTime, isNewBest } = this.data
    const accuracy = (correctCount / totalQuestions * 100).toFixed(1)

    wx.navigateTo({
      url: `/pages/result/result?type=stroop&score=${score}&accuracy=${accuracy}&avgTime=${avgTime}&isBest=${isNewBest}`
    })
  },

  goBack () {
    wx.navigateBack()
  },

  onShareAppMessage () {
    const { score } = this.data
    return {
      title: `我在Stroop测试中得了${score}分！快来挑战吧！`,
      path: '/pages/index/index'
    }
  },

  onShareTimeline () {
    const { score } = this.data
    return {
      title: `我在Stroop测试中得了${score}分！快来挑战吧！`,
      query: ''
    }
  }
})
