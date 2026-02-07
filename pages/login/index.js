const app = getApp()

Page({
  data: {
    hasUserInfo: false,
    userInfo: null
  },

  onLoad() {
    // Check if token exists
    const token = wx.getStorageSync('token')
    if (token) {
      // Validate token or just redirect
      // wx.switchTab({ url: '/pages/menu/index' })
    }
  },

  handleLogin() {
    // Use wx.getUserProfile to get avatar and nickname
    wx.getUserProfile({
      desc: '用于完善会员资料',
      success: (res) => {
        console.log('getUserProfile', res)
        const userInfo = res.userInfo
        this.setData({
          userInfo: userInfo,
          hasUserInfo: true
        })

        // Login to get code
        wx.login({
          success: (loginRes) => {
            if (loginRes.code) {
              // Call backend
              this.doLogin(loginRes.code, userInfo)
            }
          }
        })
      },
      fail: (err) => {
        console.error(err)
        wx.showToast({
          title: '请授权登录',
          icon: 'none'
        })
      }
    })
  },

  doLogin(code, userInfo) {
    wx.showLoading({
      title: '登录中...',
    })
    
    // Mock request
    // wx.request({
    //   url: app.globalData.baseUrl + '/auth/login',
    //   method: 'POST',
    //   data: {
    //     code: code,
    //     userInfo: userInfo
    //   },
    //   success: (res) => { ... }
    // })

    // Simulation
    setTimeout(() => {
      wx.hideLoading()
      const token = 'mock_token_' + Date.now()
      wx.setStorageSync('token', token)
      wx.setStorageSync('userInfo', userInfo)
      
      wx.showToast({
        title: '登录成功',
        icon: 'success'
      })
      
      setTimeout(() => {
        wx.switchTab({
          url: '/pages/menu/index'
        })
      }, 1500)
    }, 1000)
  }
})
