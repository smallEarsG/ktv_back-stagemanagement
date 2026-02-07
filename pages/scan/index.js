const app = getApp()

Page({
  data: {
    
  },

  onLoad(options) {
    let storeCode = ''
    let seatId = ''

    // Handle QR code scan (q parameter)
    if (options.q) {
      const q = decodeURIComponent(options.q)
      // Example parsing: https://ktv.com/scan?storeCode=123&seatId=456
      // Use regex or URL parsing
      storeCode = this.getQueryVariable(q, 'storeCode')
      seatId = this.getQueryVariable(q, 'seatId')
    } else {
      storeCode = options.storeCode
      seatId = options.seatId
    }

    if (storeCode) {
      this.getStoreConfig(storeCode, seatId)
    } else {
      wx.showToast({
        title: '参数错误',
        icon: 'error'
      })
      // Fallback to home after delay
      setTimeout(() => {
        wx.switchTab({ url: '/pages/menu/index' })
      }, 2000)
    }
  },

  getQueryVariable(url, variable) {
    const query = url.split('?')[1]
    if (!query) return null
    const vars = query.split('&')
    for (let i = 0; i < vars.length; i++) {
      const pair = vars[i].split('=')
      if (pair[0] == variable) { return pair[1] }
    }
    return null
  },

  getStoreConfig(storeCode, seatId) {
    // Mock API
    console.log('Fetching config for', storeCode, seatId)
    
    // wx.request({ ... })

    setTimeout(() => {
      const storeInfo = {
        storeCode: storeCode,
        seatId: seatId,
        storeName: 'KTV旗舰店',
        config: {
          theme: 'default'
        }
      }
      
      wx.setStorageSync('storeInfo', storeInfo)
      
      wx.switchTab({
        url: '/pages/menu/index'
      })
    }, 1000)
  }
})
