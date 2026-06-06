const request = require('supertest');
const { expect } = require('chai');
const { app } = require('../server');
const Product = require('../models/Product');
const User = require('../models/User');
const Order = require('../models/Order');

describe('4. Order Processing Tests', () => {
  let userId, userToken, productId;
  let orderId, itemId;

  before(async () => {
    const user = await User.create({
      firstName: 'Order', lastName: 'User', email: 'order@test.com', password: '123', authToken: 'order-token', walletBalance: 1000
    });
    userId = user._id;
    userToken = user.authToken;

    const p = await Product.create({
      name: 'Test Watch', brand: 'Test', price: 100, stock: 5, image: 'img.jpg'
    });
    productId = p._id;
  });

  describe('POST /api/orders', () => {
    it('should successfully create an order from valid items and secure pricing', async () => {
      // Fake price in frontend should be ignored
      const res = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          items: [{ productId, quantity: 2, price: 1 }], // trying to hack price to 1
          totalAmount: 2, // trying to hack total
          shippingAddress: { fullName: 'X', address: 'Y', city: 'Z', zipCode: '000' },
          paymentInfo: { cardNumber: '1111222233334444' }
        });
      
      expect(res.status).to.equal(201);
      expect(res.body.totalAmount).to.equal(200); // Server forces 2 * 100 = 200
      orderId = res.body._id;
      itemId = res.body.items[0]._id;
    });

    it('should automatically decrement product stock upon order creation', async () => {
      const p = await Product.findById(productId);
      expect(p.stock).to.equal(3); // 5 - 2 = 3
    });

    it('should fail to create order if requested quantity exceeds current stock', async () => {
      const res = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          items: [{ productId, quantity: 5 }], // Only 3 left
          shippingAddress: { fullName: 'X', address: 'Y', city: 'Z', zipCode: '000' },
          paymentInfo: { cardNumber: '1111222233334444' }
        });
      
      expect(res.status).to.equal(400);
      expect(res.body.error).to.include('Insufficient stock');
    });
  });

  describe('GET /api/users/:userId/orders', () => {
    it('should successfully retrieve a user\'s order history', async () => {
      const res = await request(app)
        .get(`/api/users/${userId}/orders`)
        .set('Authorization', `Bearer ${userToken}`);
      
      expect(res.status).to.equal(200);
      expect(res.body).to.be.an('array').with.lengthOf(1);
      expect(res.body[0]._id.toString()).to.equal(orderId.toString());
    });
  });

  describe('PUT /api/orders/:orderId/cancel', () => {
    let tempOrderId;
    before(async () => {
      const res = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          items: [{ productId, quantity: 1, price: 100, name: 'T' }],
          shippingAddress: { fullName: 'X', address: 'Y', city: 'Z', zipCode: '000' }
        });
      tempOrderId = res.body._id;
    });

    it('should successfully cancel an order and restore inventory stock', async () => {
      let p = await Product.findById(productId);
      expect(p.stock).to.equal(2); // Was 3, bought 1 = 2

      const res = await request(app)
        .put(`/api/orders/${tempOrderId}/cancel`)
        .set('Authorization', `Bearer ${userToken}`);
      
      expect(res.status).to.equal(200);
      expect(res.body.status).to.equal('Cancelled');

      p = await Product.findById(productId);
      expect(p.stock).to.equal(3); // Restored
    });
  });

  describe('POST /api/orders/:orderId/items/:itemId/return', () => {
    before(async () => {
      // Must be delivered to return
      await Order.findByIdAndUpdate(orderId, { status: 'Delivered', deliveredAt: new Date() });
    });

    it('should successfully request a selective item return', async () => {
      const res = await request(app)
        .post(`/api/orders/${orderId}/items/${itemId}/return`)
        .set('Authorization', `Bearer ${userToken}`);
      
      expect(res.status).to.equal(200);
      expect(res.body.message).to.include('Return request');
      
      const order = await Order.findById(orderId);
      const item = order.items.id(itemId);
      expect(item.returnStatus).to.equal('requested');
    });
  });
});
