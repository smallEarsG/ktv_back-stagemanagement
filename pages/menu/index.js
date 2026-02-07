const app = getApp()

Page({
  data: {
    storeInfo: {
      seatId:"A001"
    },
    categories: [],
    currentCategoryIndex: 0,
    toView: '',
    totalNum: 0,
    totalPrice: 0,
    cart: {} // Map: productId -> quantity
  },

  onShow() {
    // Refresh store info
    const storeInfo = wx.getStorageSync('storeInfo') || {}
    this.setData({ storeInfo })
    
    // Load menu if not loaded
    if (this.data.categories.length === 0) {
      this.loadMenu()
    } else {
        // refresh cart if coming back from confirm page?
        // for now just keep state
    }
  },

  loadMenu() {
    // Mock Data
    const categories = [
      {
        id: 1,
        name: '热销推荐',
        products: [
          { id: 101, name: '百威啤酒', price: 15, image: '/images/beer.png', cartNum: 0 },
          { id: 102, name: '水果拼盘', price: 68, image: '/images/fruit.png', cartNum: 0 }
        ]
      },
      {
        id: 2,
        name: '酒水饮料',
        products: [
          { id: 201, name: '可乐', price: 8, image: '/images/coke.png', cartNum: 0 },
          { id: 202, name: '雪碧', price: 8, image: '/images/sprite.png', cartNum: 0 }
        ]
      },
      {
        id: 3,
        name: '特色小吃',
        products: [
          { id: 301, name: '炸薯条', price: 25, image: '/images/fries.png', cartNum: 0 },
          { id: 302, name: '爆米花', price: 18, image: '/images/popcorn.png', cartNum: 0 }
        ]
      }
    ]

    this.setData({ categories })
  },

  switchCategory(e) {
    const index = e.currentTarget.dataset.index
    this.setData({
      currentCategoryIndex: index,
      toView: 'cat_' + index
    })
  },

  onProductScroll(e) {
    // Optional: Update current category based on scroll position
    // This requires calculating heights, skipping for simplicity
  },

  increaseCart(e) {
    const product = e.currentTarget.dataset.item
    this.updateCart(product, 1)
  },

  decreaseCart(e) {
    const product = e.currentTarget.dataset.item
    this.updateCart(product, -1)
  },

  updateCart(product, change) {
    const categories = this.data.categories
    let cart = this.data.cart
    
    // Find product in categories and update cartNum
    // Optimization: In real app, might want a better data structure
    for (let cat of categories) {
      const p = cat.products.find(i => i.id === product.id)
      if (p) {
        p.cartNum = (p.cartNum || 0) + change
        if (p.cartNum < 0) p.cartNum = 0
        
        // Update cart map
        if (p.cartNum > 0) {
          cart[p.id] = p
        } else {
          delete cart[p.id]
        }
        break
      }
    }

    this.calculateTotal(categories, cart)
  },

  calculateTotal(categories, cart) {
    let totalNum = 0
    let totalPrice = 0
    
    Object.values(cart).forEach(item => {
      totalNum += item.cartNum
      totalPrice += item.cartNum * item.price
    })

    this.setData({
      categories,
      cart,
      totalNum,
      totalPrice: totalPrice.toFixed(2)
    })
  },

  goToDetail(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/product/detail?id=${id}`
    })
  },

  goToConfirm() {
    if (this.data.totalNum === 0) return
    
    // Save cart to storage to pass to confirm page
    wx.setStorageSync('cart', this.data.cart)
    
    wx.navigateTo({
      url: '/pages/order/confirm'
    })
  }
})
