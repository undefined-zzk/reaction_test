App({
  onLaunch () {
    const logs = wx.getStorageSync('logs') || []
    logs.unshift(Date.now())
    wx.setStorageSync('logs', logs)
    
    this.checkForUpdate()
  },

  checkForUpdate () {
    const updateManager = wx.getUpdateManager()

    updateManager.onCheckForUpdate((res) => {
      console.log('检查更新结果:', res.hasUpdate)
    })

    updateManager.onUpdateReady(() => {
      wx.showModal({
        title: '更新提示',
        content: '新版本已经准备好，是否重启应用？',
        success: (res) => {
          if (res.confirm) {
            updateManager.applyUpdate()
          }
        }
      })
    })

    updateManager.onUpdateFailed(() => {
      wx.showModal({
        title: '更新提示',
        content: '新版本下载失败，请检查网络后重试',
        showCancel: false
      })
    })
  },

  globalData: {
    userInfo: null,
    testResults: {}
  }
})
