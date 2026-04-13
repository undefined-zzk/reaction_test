Component({
  properties: {
    title: {
      type: String,
      value: ''
    },
    showBack: {
      type: Boolean,
      value: true
    }
  },

  data: {
    statusBarHeight: 20,
    navHeight: 44,
    capsuleWidth: 87
  },

  lifetimes: {
    attached() {
      this.setNavigationBarInfo()
    }
  },

  methods: {
    setNavigationBarInfo() {
      const systemInfo = wx.getSystemInfoSync()
      const menuButton = wx.getMenuButtonBoundingClientRect()
      
      const statusBarHeight = systemInfo.statusBarHeight || 20
      const navHeight = menuButton.height + (menuButton.top - statusBarHeight) * 2
      const capsuleWidth = systemInfo.windowWidth - menuButton.left

      this.setData({
        statusBarHeight,
        navHeight,
        capsuleWidth
      })
    },

    onBack() {
      const pages = getCurrentPages()
      if (pages.length > 1) {
        wx.navigateBack()
      } else {
        wx.switchTab({
          url: '/pages/index/index'
        })
      }
    }
  }
})
