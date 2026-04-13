const { StorageManager } = require('../../utils/storage.js')

Page({
  data: {
    navBarHeight: 88,
    type: '',
    score: 0,
    displayScore: 0,
    scoreUnit: '',
    grade: null,
    isNewBest: false,
    recentScores: [],
    bestScore: null,
    testInfo: {},
    hasExtraStats: false,
    isHistoryView: false
  },

  onLoad (options) {
    this.initNavigationBar()
    
    const { type, score, grade, isBest, clicks, count, avg, accuracy, avgTime, totalScore } = options || {}

    // 如果只传了 type（例如从设置页跳转），展示历史列表与最佳成绩（历史视图）
    if (type && score === undefined) {
      this.setData({
        type,
        score: 0,
        displayScore: 0,
        scoreUnit: '',
        grade: null,
        isNewBest: false,
        testInfo: {},
        hasExtraStats: false,
        isHistoryView: true
      })
      this.loadHistory()
      return
    }

    // 兼容原有的单次结果展示（带 score 等参数）
    if (!type || score === undefined) {
      wx.showToast({
        title: '参数错误',
        icon: 'error'
      })
      setTimeout(() => wx.navigateBack(), 1500)
      return
    }

    const testInfo = {
      clicks: clicks ? parseInt(clicks) : null,
      count: count ? parseInt(count) : null,
      avg: avg ? parseFloat(avg) : null,
      accuracy: accuracy ? parseFloat(accuracy) : null,
      avgTime: avgTime ? Math.round(parseFloat(avgTime)) : null,
      totalScore: totalScore ? parseInt(totalScore) : null
    }

    const parsedScore = parseFloat(score)
    if (isNaN(parsedScore)) {
      console.warn('Score 转换失败:', score)
      this.setData({ score: 0 })
      return
    }

    const { displayScore, scoreUnit } = this.formatDisplayScore(type, parsedScore, testInfo)

    const hasExtraStats = !!(testInfo.clicks || testInfo.accuracy || testInfo.avgTime || (type === 'memory' && testInfo.totalScore))

    this.setData({
      type,
      score: parsedScore,
      displayScore,
      scoreUnit,
      grade: grade ? JSON.parse(decodeURIComponent(grade)) : null,
      isNewBest: isBest === 'true',
      testInfo,
      hasExtraStats
    })

    this.loadHistory()
  },

  onUnload () {
    // 预防性添加，如果后续添加定时器会需要清理
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

  formatDisplayScore (type, score, testInfo) {
    switch (type) {
      case 'reaction':
        return {
          displayScore: Math.round(score),
          scoreUnit: 'ms'
        }
      case 'cps':
        return {
          displayScore: score.toFixed(1),
          scoreUnit: 'CPS'
        }
      case 'memory':
        return {
          displayScore: Math.round(score),
          scoreUnit: '关'
        }
      case 'stroop':
        return {
          displayScore: Math.round(score),
          scoreUnit: '分'
        }
      default:
        return {
          displayScore: Math.round(score),
          scoreUnit: ''
        }
    }
  },

  formatTime (timestamp) {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now - date

    if (diff < 60000) {
      return '刚刚'
    } else if (diff < 3600000) {
      return Math.floor(diff / 60000) + '分钟前'
    } else if (diff < 86400000) {
      return Math.floor(diff / 3600000) + '小时前'
    } else if (diff < 604800000) {
      return Math.floor(diff / 86400000) + '天前'
    } else {
      return `${date.getMonth() + 1}-${date.getDate()}`
    }
  },

  loadHistory () {
    const recentScores = StorageManager.getRecentScores(this.data.type)

    const filteredScores = this.data.type === 'memory'
      ? recentScores.filter(item => item.score > 0)
      : recentScores

    const formattedRecentScores = filteredScores.slice(0, 10).map(item => {
      const { displayScore, scoreUnit } = this.formatDisplayScore(this.data.type, item.score, {})
      return Object.assign({}, item, {
        displayScore,
        unit: scoreUnit,
        formattedTime: this.formatTime(item.timestamp),
        accuracy: item.accuracy || null
      })
    })

    // 计算最佳成绩
    let formattedBestScore = null
    const bestScore = this.calculateBestScore(recentScores)
    if (bestScore) {
      const { displayScore, scoreUnit } = this.formatDisplayScore(this.data.type, bestScore.score, {})
      formattedBestScore = Object.assign({}, bestScore, {
        displayScore,
        unit: scoreUnit,
        formattedTime: this.formatTime(bestScore.timestamp)
      })
    }

    this.setData({
      recentScores: formattedRecentScores,
      bestScore: formattedBestScore
      // 保持 isNewBest 为从 onLoad 参数获取的值，不在这里覆盖
    })
  },

  calculateBestScore (scores) {
    if (!scores || !Array.isArray(scores) || scores.length === 0) return null

    const type = this.data.type
    let best = scores[0]

    if (type === 'reaction') {
      best = scores.reduce((min, item) => (item.score < min.score ? item : min), scores[0])
    } else if (type === 'memory') {
      best = scores.reduce((max, item) => (item.totalScore > (max.totalScore || 0) ? item : max), scores[0])
    } else if (type === 'stroop') {
      best = scores.reduce((max, item) => {
        const accA = item.accuracy || 0
        const accB = max.accuracy || 0
        if (accA !== accB) return accA > accB ? item : max
        return item.score > max.score ? item : max
      }, scores[0])
    } else {
      best = scores.reduce((max, item) => (item.score > max.score ? item : max), scores[0])
    }

    return best
  },

  getSortedByScore (scores, type) {
    const sorted = scores.slice().sort((a, b) => {
      if (type === 'reaction') {
        return a.score - b.score
      }
      if (type === 'memory') {
        return b.totalScore - a.totalScore
      }
      if (type === 'stroop') {
        const accuracyA = a.accuracy || 0
        const accuracyB = b.accuracy || 0
        if (accuracyA !== accuracyB) {
          return accuracyB - accuracyA
        }
        return b.score - a.score
      }
      return b.score - a.score
    })
    return sorted
  },

  getTestTitle (type) {
    const titles = {
      reaction: '视觉反应测试',
      cps: '手速测试',
      memory: '方块记忆',
      stroop: '文字干扰测试'
    }
    return titles[type] || '测试结果'
  },

  getScoreUnit (type) {
    const units = {
      reaction: 'ms',
      cps: 'CPS',
      memory: '关',
      stroop: '分'
    }
    return units[type] || ''
  },

  formatScore (type, score) {
    if (type === 'cps') {
      return score.toFixed(1)
    }
    return score.toFixed(0)
  },

  shareResult () {
    this.showShareImageMenu()
  },

  showShareImageMenu () {
    this.generateShareImage()
  },

  generateShareImage () {
    const ctx = wx.createCanvasContext('shareCanvas', this)
    const canvasWidth = 540
    const canvasHeight = 720

    // 背景色
    ctx.fillStyle = '#667eea'
    ctx.fillRect(0, 0, canvasWidth, canvasHeight)

    // 标题
    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 32px Arial'
    ctx.textAlign = 'center'
    ctx.fillText('反应力测试助手', canvasWidth / 2, 80)

    // 测试类型
    const testTitle = this.getTestTitle(this.data.type)
    ctx.font = '24px Arial'
    ctx.fillText(testTitle, canvasWidth / 2, 140)

    // 得分
    ctx.font = 'bold 48px Arial'
    ctx.fillStyle = '#ffd700'
    ctx.fillText(this.data.displayScore + this.data.scoreUnit, canvasWidth / 2, 280)

    // 新记录标记
    if (this.data.isNewBest) {
      ctx.fillStyle = '#ff6b6b'
      ctx.font = 'bold 28px Arial'
      ctx.fillText('🎉 新记录！', canvasWidth / 2, 350)
    }

    // 分享文案
    ctx.fillStyle = '#ffffff'
    ctx.font = '18px Arial'
    ctx.fillText('我在' + testTitle + '中得了', canvasWidth / 2, 450)
    ctx.fillText(this.data.displayScore + this.data.scoreUnit, canvasWidth / 2, 490)
    ctx.fillText('快来挑战我吧！', canvasWidth / 2, 530)

    // 底部提示
    ctx.font = '16px Arial'
    ctx.fillStyle = 'rgba(255,255,255,0.7)'
    ctx.fillText('反应力测试助手', canvasWidth / 2, 680)

    ctx.draw(false, () => {
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
    })
  },

  shareImage (imagePath) {
    wx.showShareImageMenu({
      path: imagePath,
      entrancePath: "/pages/index/index",
      success (res) {
        console.log('分享成功', res)
      },
      fail (err) {
        console.error('分享失败', err)
      }
    })
  },

  saveImage () {
    wx.showToast({
      title: '功能开发中',
      icon: 'none'
    })
  },

  retryTest () {
    wx.navigateBack()
  },

  goHome () {
    wx.switchTab({
      url: '/pages/index/index'
    })
  },

  onShareAppMessage () {
    const { type, score } = this.data
    const title = this.getTestTitle(type)
    const unit = this.getScoreUnit(type)
    const formattedScore = this.formatScore(type, score)

    return {
      title: `我在${title}中获得了${formattedScore}${unit}！快来挑战吧！`,
      path: '/pages/index/index'
    }
  },

  onShareTimeline () {
    const { type, score } = this.data
    const title = this.getTestTitle(type)
    const unit = this.getScoreUnit(type)
    const formattedScore = this.formatScore(type, score)

    return {
      title: `我在${title}中获得了${formattedScore}${unit}！快来挑战吧！`,
      query: ''
    }
  }
})
