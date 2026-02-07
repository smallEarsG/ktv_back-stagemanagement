Page({
  data: {
    product: {},
    count: 1,
    remark: '',
    cartTotalNum: 0
  },

  onShow() {
    this.updateCartTotal()
  },

  onLoad(options) {
    const id = options.id
    this.getProductDetail(id)
  },

  getProductDetail(id) {
    // Mock Data
    const products = {
      '101': { 
        id: 101, 
        name: '百威啤酒', 
        price: 15, 
        image: '/images/beer.png', 
        desc: '冰爽口感，畅饮无限', 
        sales: 2345,
        detail: '百威啤酒（Budweiser），诞生于1876年，现已行销遍布全球，是世界销量最好的啤酒品牌之一。百威啤酒引进了巴伐利亚的酿酒工艺，并使用了 beechwood aging 酿造工艺，使啤酒更加清爽。'
      },
      '102': { 
        id: 102, 
        name: '水果拼盘', 
        price: 68, 
        image: '/images/fruit.png', 
        desc: '精选时令水果',
        sales: 890,
        detail: '精选当季新鲜水果，现切现摆，色彩丰富，营养健康。包含西瓜、哈密瓜、圣女果、橙子等（具体以店内供应为准）。'
      },
      '201': { 
        id: 201, 
        name: '可乐', 
        price: 8, 
        image: '/images/coke.png', 
        desc: '快乐肥宅水',
        sales: 5600,
        detail: '经典可口可乐，加冰更爽。'
      },
      '202': { 
        id: 202, 
        name: '雪碧', 
        price: 8, 
        image: '/images/sprite.png', 
        desc: '透心凉，心飞扬',
        sales: 4200,
        detail: '柠檬味汽水，清爽解渴。'
      },
      '301': { 
        id: 301, 
        name: '炸薯条', 
        price: 25, 
        image: '/images/fries.png', 
        desc: '外酥里嫩',
        sales: 1200,
        detail: '精选优质土豆，现炸酥脆，搭配番茄酱。'
      },
      '302': { 
        id: 302, 
        name: '爆米花', 
        price: 18, 
        image: '/images/popcorn.png', 
        desc: '看剧唱歌必备',
        sales: 3400,
        detail: '奶油口味爆米花，香甜酥脆。'
      }
    }
    
    const product = products[id] || { 
      id: id, 
      name: '未知商品', 
      price: 0,
      desc: '暂无信息',
      detail: '暂无详细介绍'
    }
    this.setData({ product })
  },

  updateCartTotal() {
    const cart = wx.getStorageSync('cart') || {}
    let total = 0
    Object.values(cart).forEach(item => {
      total += (item.cartNum || 0)
    })
    this.setData({ cartTotalNum: total })
  },

  decreaseCount() {
    if (this.data.count > 1) {
      this.setData({ count: this.data.count - 1 })
    }
  },

  increaseCount() {
    this.setData({ count: this.data.count + 1 })
  },

  onRemarkInput(e) {
    this.setData({ remark: e.detail.value })
  },

  addToCart() {
    const product = this.data.product
    const count = this.data.count
    const remark = this.data.remark
    
    let cart = wx.getStorageSync('cart') || {}
    
    // Check if product exists in cart
    if (cart[product.id]) {
      cart[product.id].cartNum += count
    } else {
      cart[product.id] = {
        ...product,
        cartNum: count
      }
    }
    
    // If there is a remark, we might need to handle it differently 
    // (e.g., as a separate item or just append property).
    // For simplicity, we just update the last remark added to this item type,
    // or arguably remarks should make it a unique item. 
    // Given the current simple structure of 'cart' (keyed by ID), 
    // we'll just overwrite/append remark to the item.
    if (remark) {
      cart[product.id].remark = remark
    }

    wx.setStorageSync('cart', cart)
    
    // Update local state
    this.updateCartTotal()
    
    wx.showToast({
      title: '已加入购物车',
      icon: 'success'
    })
    
    // Reset count
    this.setData({ count: 1, remark: '' })
  },

  goToCart() {
    wx.navigateTo({
      url: '/pages/order/confirm'
    })
  }
})
