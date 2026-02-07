Page({
  data: {
    userInfo: null
  },

  onShow() {
    const userInfo = wx.getStorageSync('userInfo')
    this.setData({ userInfo })
  },

  goToLogin() {
    wx.navigateTo({
      url: '/pages/login/index'
    })
  },

  goToOrders(e) {
    const type = e.currentTarget.dataset.type
    // If we wanted to filter, we would store 'type' in globalData or storage here
    // getApp().globalData.orderTab = type; 
    
    wx.switchTab({
      url: '/pages/order/list'
    })
  },

  logout() {
    wx.showModal({
      title: '提示',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          wx.clearStorageSync()
          this.setData({ userInfo: null })
          wx.reLaunch({
            url: '/pages/login/index'
          })
        }
      }
    })
  }
})
