Page({
  data: {
    products: [],
    reasons: ['商品上错了', '商品质量问题', '多点了/点错了', '其他原因'],
    reasonIndex: -1,
    detailReason: '',
    currentWordCount: 0,
    maxWordCount: 200
  },

  onLoad(options) {
    // Mock getting order products
    const products = [
      { id: 101, name: '百威啤酒', price: 15, count: 6, refundCount: 1, checked: false },
      { id: 201, name: '可乐', price: 8, count: 1, refundCount: 1, checked: false }
    ]
    this.setData({ products })
  },

  checkboxChange(e) {
    const values = e.detail.value
    const products = this.data.products
    products.forEach(item => {
      item.checked = values.includes(String(item.id))
    })
    this.setData({ products })
  },

  increaseCount(e) {
    const index = e.currentTarget.dataset.index
    const products = this.data.products
    if (products[index].refundCount < products[index].count) {
      products[index].refundCount++
      this.setData({ products })
    }
  },

  decreaseCount(e) {
    const index = e.currentTarget.dataset.index
    const products = this.data.products
    if (products[index].refundCount > 1) {
      products[index].refundCount--
      this.setData({ products })
    }
  },

  onReasonChange(e) {
    this.setData({ reasonIndex: e.detail.value })
  },

  onReasonInput(e) {
    const val = e.detail.value;
    this.setData({ 
      detailReason: val,
      currentWordCount: val.length
    })
  },

  submitRefund() {
    const selected = this.data.products.filter(p => p.checked)
    if (selected.length === 0) {
      wx.showToast({ title: '请选择退款商品', icon: 'none' })
      return
    }
    if (this.data.reasonIndex === -1) {
      wx.showToast({ title: '请选择退款原因', icon: 'none' })
      return
    }

    wx.showLoading({ title: '提交中...' })
    
    setTimeout(() => {
      wx.hideLoading()
      wx.showToast({ title: '申请已提交' })
      
      setTimeout(() => {
        wx.navigateBack()
      }, 1500)
    }, 1000)
  }
})
