Page({
  data: {
    orderList: []
  },

  onShow() {
    this.getOrderList()
  },

  onPullDownRefresh() {
    this.getOrderList(() => {
      wx.stopPullDownRefresh()
    })
  },

  getOrderList(cb) {
    // Mock Data
    setTimeout(() => {
      const list = [
        {
          id: '123',
          orderNo: 'ORD202310270001',
          seatId: 'A888',
          status: 3, // 3: Completed
          statusText: '已完成',
          firstImage: '/images/beer.png',
          createTime: '2023-10-27 19:30',
          totalCount: 7,
          totalPrice: '98.00'
        },
        {
          id: '124',
          orderNo: 'ORD202310270002',
          seatId: 'A888',
          status: 2, // 2: Delivering
          statusText: '配送中',
          firstImage: '/images/fruit.png',
          createTime: '2023-10-27 20:15',
          totalCount: 1,
          totalPrice: '68.00'
        }
      ]
      
      this.setData({ orderList: list })
      if (cb) cb()
    }, 500)
  },

  goToDetail(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({
      url: '/pages/order/detail?id=' + id
    })
  }
})
