Page({
  data: {
    order: {}
  },

  onLoad(options) {
    const id = options.id
    this.getOrderDetail(id)
  },

  getOrderDetail(id) {
    // Mock Data
    const order = {
      id: id,
      status: 3, // 1: Pending, 2: Delivering, 3: Completed, 4: Refund
      statusText: '已完成',
      seatId: 'A888',
      createTime: '2023-10-27 19:30:00',
      totalPrice: '98.00',
      canRefund: true,
      products: [
        { id: 101, name: '百威啤酒', count: 6, price: 15 },
        { id: 201, name: '可乐', count: 1, price: 8 }
      ]
    }
    
    this.setData({ order })
  },

  applyRefund() {
    wx.navigateTo({
      url: '/pages/refund/apply?orderId=' + this.data.order.id
    })
  }
})
