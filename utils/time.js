/**
 * 高精度计时器工具
 */

/**
 * 获取高精度时间戳（毫秒）
 */
function getTimestamp() {
  return Date.now()
}

/**
 * 高精度计时器类
 */
class HighPrecisionTimer {
  /**
   * 根据分数获取等级评价
   * @param {number} score - 分数
   * @param {string} type - 测试类型 (reaction, cps, stroop, memory)
   * @returns {object} 等级信息 {grade: string, color: string, description: string}
   */
  static getGrade(score, type) {
    switch (type) {
      case 'reaction':
        return this.getReactionGrade(score)
      case 'cps':
        return this.getCpsGrade(score)
      case 'stroop':
        return this.getStroopGrade(score)
      case 'memory':
        return this.getMemoryGrade(score)
      default:
        return { grade: '未知', color: '#999999', description: '未知类型' }
    }
  }

  /**
   * 反应测试等级评价
   * @param {number} time - 反应时间（毫秒）
   */
  static getReactionGrade(time) {
    if (time < 200) {
      return { grade: 'S', color: '#FFD700', description: '超神反应' }
    } else if (time < 250) {
      return { grade: 'A+', color: '#FF6B6B', description: '极快反应' }
    } else if (time < 300) {
      return { grade: 'A', color: '#FF8E53', description: '很快反应' }
    } else if (time < 350) {
      return { grade: 'B+', color: '#4ECDC4', description: '快速反应' }
    } else if (time < 400) {
      return { grade: 'B', color: '#44A08D', description: '良好反应' }
    } else if (time < 500) {
      return { grade: 'C', color: '#A78BFA', description: '一般反应' }
    } else {
      return { grade: 'D', color: '#999999', description: '较慢反应' }
    }
  }

  /**
   * CPS测试等级评价
   * @param {number} cps - 每秒点击次数
   */
  static getCpsGrade(cps) {
    if (cps >= 10) {
      return { grade: 'S', color: '#FFD700', description: '超神手速' }
    } else if (cps >= 8) {
      return { grade: 'A+', color: '#FF6B6B', description: '极快手速' }
    } else if (cps >= 7) {
      return { grade: 'A', color: '#FF8E53', description: '很快手速' }
    } else if (cps >= 6) {
      return { grade: 'B+', color: '#4ECDC4', description: '快速手速' }
    } else if (cps >= 5) {
      return { grade: 'B', color: '#44A08D', description: '良好手速' }
    } else if (cps >= 4) {
      return { grade: 'C', color: '#A78BFA', description: '一般手速' }
    } else {
      return { grade: 'D', color: '#999999', description: '较慢手速' }
    }
  }

  /**
   * Stroop测试等级评价
   * @param {number} score - 得分
   */
  static getStroopGrade(score) {
    if (score >= 800) {
      return { grade: 'S', color: '#FFD700', description: '超强专注' }
    } else if (score >= 700) {
      return { grade: 'A+', color: '#FF6B6B', description: '极强专注' }
    } else if (score >= 600) {
      return { grade: 'A', color: '#FF8E53', description: '很强专注' }
    } else if (score >= 500) {
      return { grade: 'B+', color: '#4ECDC4', description: '良好专注' }
    } else if (score >= 400) {
      return { grade: 'B', color: '#44A08D', description: '一般专注' }
    } else if (score >= 300) {
      return { grade: 'C', color: '#A78BFA', description: '需要提升' }
    } else {
      return { grade: 'D', color: '#999999', description: '继续努力' }
    }
  }

  /**
   * 记忆测试等级评价
   * @param {number} level - 关卡数
   */
  static getMemoryGrade(level) {
    if (level >= 10) {
      return { grade: 'S', color: '#FFD700', description: '超强记忆' }
    } else if (level >= 8) {
      return { grade: 'A+', color: '#FF6B6B', description: '极强记忆' }
    } else if (level >= 6) {
      return { grade: 'A', color: '#FF8E53', description: '很强记忆' }
    } else if (level >= 5) {
      return { grade: 'B+', color: '#4ECDC4', description: '良好记忆' }
    } else if (level >= 4) {
      return { grade: 'B', color: '#44A08D', description: '一般记忆' }
    } else if (level >= 3) {
      return { grade: 'C', color: '#A78BFA', description: '需要提升' }
    } else {
      return { grade: 'D', color: '#999999', description: '继续努力' }
    }
  }
}

module.exports = {
  getTimestamp,
  HighPrecisionTimer
}
