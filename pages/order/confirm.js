Page({
  data: {
    storeInfo: {},
    cartList: [],
    totalPrice: 0
  },

  onShow() {
    const storeInfo = wx.getStorageSync('storeInfo') || {}
    const cart = wx.getStorageSync('cart') || {}
    
    // Convert cart map to list
    const cartList = Object.values(cart)
    
    this.setData({ storeInfo, cartList })
    this.calculateTotal()
  },

  calculateTotal() {
    let total = 0
    this.data.cartList.forEach(item => {
      total += item.price * item.cartNum
    })
    this.setData({ totalPrice: total.toFixed(2) })
  },

  increaseCart(e) {
    const index = e.currentTarget.dataset.index
    const list = this.data.cartList
    list[index].cartNum++
    this.setData({ cartList: list })
    this.calculateTotal()
    this.updateStorage()
  },

  decreaseCart(e) {
    const index = e.currentTarget.dataset.index
    const list = this.data.cartList
    if (list[index].cartNum > 1) {
      list[index].cartNum--
    } else {
      // Remove item?
      list.splice(index, 1)
    }
    this.setData({ cartList: list })
    this.calculateTotal()
    this.updateStorage()
  },

  updateStorage() {
    const cart = {}
    this.data.cartList.forEach(item => {
      cart[item.id] = item
    })
    wx.setStorageSync('cart', cart)
  },

  submitOrder() {
    if (this.data.cartList.length === 0) {
      wx.showToast({ title: '购物车为空', icon: 'none' })
      return
    }

    wx.showLoading({ title: '创建订单中...' })

    // Mock API Call
    setTimeout(() => {
      wx.hideLoading()
      
      // Simulate Payment
      this.requestPayment('order_id_123')
    }, 1000)
  },

  requestPayment(orderId) {
    wx.showLoading({ title: '支付中...' })
    
    // Mock Payment
    setTimeout(() => {
      wx.hideLoading()
      wx.showToast({ title: '支付成功' })
      
      // Clear cart
      wx.removeStorageSync('cart')
      
      // Go to Order Detail
      wx.redirectTo({
        url: '/pages/order/detail?id=' + orderId
      })
    }, 1000)
  }
})
