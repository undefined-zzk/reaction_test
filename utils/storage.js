const StorageManager = {
  KEYS: {
    BEST_SCORES: 'best_scores',
    RECENT_SCORES: 'recent_scores',
    USER_SETTINGS: 'user_settings',
    MEMORY_LEVEL: 'memory_level'
  },

  getBestScore: function (testType) {
    try {
      var scores = wx.getStorageSync(this.KEYS.BEST_SCORES) || {}
      var obj = scores
      switch (testType) {
        case 'reaction':
          return obj.reaction || null
        case 'cps':
          return obj.cps || null
        case 'memory':
          return obj.memory || null
        case 'stroop':
          return obj.stroop || null
        default:
          return null
      }
    } catch (e) {
      console.error('获取最高分失败:', e)
      return null
    }
  },

  setBestScore: function (testType, score) {
    try {
      var scores = wx.getStorageSync(this.KEYS.BEST_SCORES) || {}
      var currentBest
      switch (testType) {
        case 'reaction':
          currentBest = scores.reaction
          break
        case 'cps':
          currentBest = scores.cps
          break
        case 'memory':
          currentBest = scores.memory
          break
        case 'stroop':
          currentBest = scores.stroop
          break
      }

      if (!currentBest || this.isBetterScore(testType, score, currentBest)) {
        var newScore = {}
        newScore.score = score
        newScore.timestamp = Date.now()

        switch (testType) {
          case 'reaction':
            scores.reaction = newScore
            break
          case 'cps':
            scores.cps = newScore
            break
          case 'memory':
            scores.memory = newScore
            break
          case 'stroop':
            scores.stroop = newScore
            break
        }

        wx.setStorageSync(this.KEYS.BEST_SCORES, scores)
        return true
      }
      return false
    } catch (e) {
      console.error('保存最高分失败:', e)
      return false
    }
  },

  isBetterScore: function (testType, newScore, oldScore) {
    if (testType === 'cps' || testType === 'memory' || testType === 'stroop') {
      return newScore > oldScore.score
    }
    return newScore < oldScore.score
  },

  getRecentScores: function (testType, limit) {
    if (typeof limit === 'undefined') {
      limit = 10
    }
    try {
      var allScores = wx.getStorageSync(this.KEYS.RECENT_SCORES) || {}
      switch (testType) {
        case 'reaction':
          return allScores.reaction || []
        case 'cps':
          return allScores.cps || []
        case 'memory':
          return allScores.memory || []
        case 'stroop':
          return allScores.stroop || []
        default:
          return []
      }
    } catch (e) {
      console.error('获取最近成绩失败:', e)
      return []
    }
  },

  addRecentScore: function (testType, score, extra) {
    if (typeof extra === 'undefined') {
      extra = {}
    }
    try {
      var allScores = wx.getStorageSync(this.KEYS.RECENT_SCORES) || {}
      var recordList
      switch (testType) {
        case 'reaction':
          if (!allScores.reaction) allScores.reaction = []
          recordList = allScores.reaction
          break
        case 'cps':
          if (!allScores.cps) allScores.cps = []
          recordList = allScores.cps
          break
        case 'memory':
          if (!allScores.memory) allScores.memory = []
          recordList = allScores.memory
          break
        case 'stroop':
          if (!allScores.stroop) allScores.stroop = []
          recordList = allScores.stroop
          break
      }

      var record = Object.assign({
        score: score,
        timestamp: Date.now()
      }, extra)

      recordList.unshift(record)

      if (recordList.length > 10) {
        recordList = recordList.slice(0, 10)
        switch (testType) {
          case 'reaction':
            allScores.reaction = recordList
            break
          case 'cps':
            allScores.cps = recordList
            break
          case 'memory':
            allScores.memory = recordList
            break
          case 'stroop':
            allScores.stroop = recordList
            break
        }
      }

      wx.setStorageSync(this.KEYS.RECENT_SCORES, allScores)
      return true
    } catch (e) {
      console.error('保存最近成绩失败:', e)
      return false
    }
  },

  getUserSettings: function () {
    try {
      var stored = wx.getStorageSync(this.KEYS.USER_SETTINGS)
      if (stored) return stored
      var defaults = {}
      defaults.vibration = true
      defaults.darkMode = false
      defaults.sound = true
      return defaults
    } catch (e) {
      console.error('获取用户设置失败:', e)
      var defaults = {}
      defaults.vibration = true
      defaults.darkMode = false
      defaults.sound = true
      return defaults
    }
  },

  setUserSettings: function (settings) {
    try {
      var currentSettings = this.getUserSettings()
      var newSettings = Object.assign({}, currentSettings, settings)
      wx.setStorageSync(this.KEYS.USER_SETTINGS, newSettings)
      return true
    } catch (e) {
      console.error('保存用户设置失败:', e)
      return false
    }
  },

  getMemoryLevel: function () {
    try {
      return wx.getStorageSync(this.KEYS.MEMORY_LEVEL) || 0
    } catch (e) {
      console.error('获取记忆等级失败:', e)
      return 0
    }
  },

  setMemoryLevel: function (level) {
    try {
      wx.setStorageSync(this.KEYS.MEMORY_LEVEL, level)
      return true
    } catch (e) {
      console.error('保存记忆等级失败:', e)
      return false
    }
  },

  clearAllData: function () {
    try {
      wx.removeStorageSync(this.KEYS.BEST_SCORES)
      wx.removeStorageSync(this.KEYS.RECENT_SCORES)
      wx.removeStorageSync(this.KEYS.USER_SETTINGS)
      wx.removeStorageSync(this.KEYS.MEMORY_LEVEL)
      return true
    } catch (e) {
      console.error('清除数据失败:', e)
      return false
    }
  },

  getAllStats: function () {
    var recentScores = wx.getStorageSync(this.KEYS.RECENT_SCORES) || {}
    var bestScores = this.calculateBestScores(recentScores)

    return {
      bestScores: bestScores,
      recentScores: recentScores,
      settings: this.getUserSettings(),
      memoryLevel: this.getMemoryLevel()
    }
  },

  calculateBestScores: function (recentScores) {
    var bestScores = {}
    var types = ['reaction', 'cps', 'memory', 'stroop']

    for (var i = 0; i < types.length; i++) {
      var type = types[i]
      var scores
      switch (type) {
        case 'reaction':
          scores = recentScores.reaction
          break
        case 'cps':
          scores = recentScores.cps
          break
        case 'memory':
          scores = recentScores.memory
          break
        case 'stroop':
          scores = recentScores.stroop
          break
      }

      if (!scores || !Array.isArray(scores) || scores.length === 0) continue

      var best = scores[0]
      if (type === 'reaction') {
        for (var j = 0; j < scores.length; j++) {
          if (scores[j].score < best.score) {
            best = scores[j]
          }
        }
      } else if (type === 'memory') {
        for (var j = 0; j < scores.length; j++) {
          var itemTotal = scores[j].totalScore || 0
          var bestTotal = best.totalScore || 0
          if (itemTotal > bestTotal) {
            best = scores[j]
          }
        }
      } else if (type === 'stroop') {
        for (var j = 0; j < scores.length; j++) {
          var accA = scores[j].accuracy || 0
          var accB = best.accuracy || 0
          if (accA !== accB) {
            if (accA > accB) best = scores[j]
          } else {
            var scoreA = scores[j].score || 0
            var scoreB = best.score || 0
            if (scoreA > scoreB) best = scores[j]
          }
        }
      } else {
        for (var j = 0; j < scores.length; j++) {
          if (scores[j].score > best.score) {
            best = scores[j]
          }
        }
      }

      if (best && typeof best.score === 'number') {
        var resultObj = {}
        resultObj.score = best.score
        resultObj.timestamp = best.timestamp || Date.now()
        resultObj.accuracy = best.accuracy || null
        resultObj.totalScore = best.totalScore || null

        switch (type) {
          case 'reaction':
            bestScores.reaction = resultObj
            break
          case 'cps':
            bestScores.cps = resultObj
            break
          case 'memory':
            bestScores.memory = resultObj
            break
          case 'stroop':
            bestScores.stroop = resultObj
            break
        }
      }
    }

    return bestScores
  }
}

module.exports = {
  StorageManager: StorageManager
}
