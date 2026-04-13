const { HighPrecisionTimer, getTimestamp } = require('../../utils/time.js')
const { StorageManager } = require('../../utils/storage.js')

Page({
  data: {
    navBarHeight: 88,
    status: 'ready',
    countdown: 10,
    clickCount: 0,
    cps: 0,
    cpsDisplay: '0.0',
    result: null,
    settings: {}
  },

  timer: null,
  countdownTimer: null,
  startTime: 0,

  onLoad () {
    this.loadSettings()
    this.initNavigationBar()
  },

  onUnload () {
    this.clearAllTimers()
  },

  onShareAppMessage () {
    return {
      title: '��Ӧ��ʵ���� - ����������٣�',
      path: '/pages/index/index'
    }
  },

  onShareTimeline () {
    return {
      title: '��Ӧ��ʵ���� - �����������',
      query: ''
    }
  },

  loadSettings () {
    const settings = StorageManager.getUserSettings()
    var setDataObj = {}
    setDataObj.settings = settings
    this.setData(setDataObj)
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
    if (this.data.status !== 'ready') {
      this.resetTest()
    }
  },

  clearAllTimers () {
    if (this.timer) clearInterval(this.timer)
    if (this.countdownTimer) clearInterval(this.countdownTimer)
    this.timer = null
    this.countdownTimer = null
  },

  startTest () {
    this.clearAllTimers()

    var setDataObj = {}
    setDataObj.status = 'countdown'
    setDataObj.countdown = 3
    setDataObj.clickCount = 0
    setDataObj.cps = 0
    setDataObj.cpsDisplay = '0.0'
    setDataObj.result = null
    this.setData(setDataObj)

    let count = 3
    this.countdownTimer = setInterval(() => {
      count--
      if (count > 0) {
        var setDataObj = {}
        setDataObj.countdown = count
        this.setData(setDataObj)
        if (this.data.settings && this.data.settings.vibration) {
          wx.vibrateShort({ type: 'light' })
        }
      } else {
        clearInterval(this.countdownTimer)
        this.beginTest()
      }
    }, 1000)
  },

  beginTest () {
    this.startTime = getTimestamp()

    var setDataObj = {}
    setDataObj.status = 'testing'
    setDataObj.countdown = 10
    this.setData(setDataObj)

    if (this.data.settings && this.data.settings.vibration) {
      wx.vibrateShort({ type: 'medium' })
    }

    let remainingTime = 10
    this.timer = setInterval(() => {
      remainingTime--
      var setDataObj = {}
      setDataObj.countdown = remainingTime
      this.setData(setDataObj)

      if (remainingTime <= 0) {
        this.endTest()
      }
    }, 1000)
  },

  handleClick () {
    if (this.data.status === 'ready') {
      this.startTest()
      return
    }

    if (this.data.status === 'countdown') {
      return
    }

    if (this.data.status !== 'testing') return

    if (this.startTime === undefined || this.startTime === null) {
      console.warn('startTime δ��ȷ��ʼ��')
      return
    }

    const now = getTimestamp()
    const newCount = this.data.clickCount + 1
    const elapsed = (now - this.startTime) / 1000
    const currentCps = elapsed > 0 ? newCount / elapsed : 0

    var setDataObj = {}
    setDataObj.clickCount = newCount
    setDataObj.cps = currentCps
    setDataObj.cpsDisplay = currentCps > 0 ? currentCps.toFixed(1) : '0.0'
    this.setData(setDataObj)

    if (this.data.settings && this.data.settings.vibration) {
      wx.vibrateShort({ type: 'light' })
    }
  },

  endTest () {
    this.clearAllTimers()

    const totalTime = (getTimestamp() - this.startTime) / 1000
    const finalCps = totalTime > 0 ? this.data.clickCount / totalTime : 0
    const grade = HighPrecisionTimer.getGrade(finalCps, 'cps')

    const isNewBest = StorageManager.setBestScore('cps', finalCps)
    StorageManager.addRecentScore('cps', finalCps)

    var resultObj = {}
    resultObj.cps = finalCps
    resultObj.cpsDisplay = finalCps.toFixed(1)
    resultObj.clicks = this.data.clickCount
    resultObj.time = totalTime > 0 ? totalTime : 10
    resultObj.timeDisplay = (totalTime > 0 ? totalTime : 10).toFixed(1)
    resultObj.grade = grade

    var setDataObj = {}
    setDataObj.status = 'result'
    setDataObj.result = resultObj
    setDataObj.isNewBest = isNewBest
    this.setData(setDataObj)

    if (this.data.settings && this.data.settings.vibration) {
      wx.vibrateShort({ type: 'medium' })
    }
  },

  resetTest () {
    this.clearAllTimers()
    var setDataObj = {}
    setDataObj.status = 'ready'
    setDataObj.countdown = 10
    setDataObj.clickCount = 0
    setDataObj.cps = 0
    setDataObj.cpsDisplay = '0.0'
    setDataObj.result = null
    this.setData(setDataObj)
  },

  navigateToResult () {
    const result = this.data.result
    const isNewBest = this.data.isNewBest
    wx.navigateTo({
      url: '/pages/result/result?type=cps&score=' + result.cps.toFixed(1) + '&grade=' + encodeURIComponent(JSON.stringify(result.grade)) + '&clicks=' + result.clicks + '&isBest=' + isNewBest
    })
  },

  goBack () {
    wx.navigateBack()
  },

  onShareAppMessage () {
    const result = this.data.result
    return {
      title: '�ҵ�������' + (result ? result.cps.toFixed(1) : 0) + 'CPS��������ս�ɣ�',
      path: '/pages/index/index'
    }
  },

  onShareTimeline () {
    const result = this.data.result
    return {
      title: '�ҵ�������' + (result ? result.cps.toFixed(1) : 0) + 'CPS��������ս�ɣ�',
      query: ''
    }
  }
})
