const request = require('supertest');
const { expect } = require('chai');
const { app } = require('../server');
const Product = require('../models/Product');
const User = require('../models/User');
const Order = require('../models/Order');

describe('5. Admin & Manager Tests', () => {
  let userId, userToken, productId;
  let smToken;
  let orderId, itemId;

  before(async () => {
    // Setup regular user
    const user = await User.create({
      firstName: 'Normal', lastName: 'User', email: 'normal@test.com', password: '123', authToken: 'normal-token', walletBalance: 0
    });
    userId = user._id;
    userToken = user.authToken;

    // Setup Sales Manager
    const sm = await User.create({
      firstName: 'Sales', lastName: 'Manager', email: 'sm@test.com', password: '123', role: 'sales_manager', authToken: 'sm-token'
    });
    smToken = sm.authToken;

    const p = await Product.create({
      name: 'Return Watch', brand: 'Test', price: 500, stock: 10, image: 'img.jpg'
    });
    productId = p._id;

    // Setup Order
    const order = await Order.create({
      userId,
      items: [{ productId, name: 'Return Watch', price: 500, quantity: 1, returnStatus: 'requested', returnRequestedAt: new Date() }],
      totalAmount: 500,
      status: 'Delivered',
      deliveredAt: new Date()
    });
    orderId = order._id;
    itemId = order.items[0]._id;
  });

  describe('GET /api/admin/returns', () => {
    it('should prevent standard users from viewing return requests (403 Forbidden)', async () => {
      const res = await request(app)
        .get('/api/admin/returns')
        .set('Authorization', `Bearer ${userToken}`);
      
      expect(res.body.message).to.equal('Sales manager only');
    });

    it('should allow Sales Manager to view pending return requests', async () => {
      const res = await request(app)
        .get('/api/admin/returns')
        .set('Authorization', `Bearer ${smToken}`);
      
      expect(res.status).to.equal(200);
      expect(res.body).to.be.an('array').with.lengthOf(1);
      expect(res.body[0]._id.toString()).to.equal(orderId.toString());
    });
  });

  describe('PUT /api/admin/orders/:orderId/items/:itemId/return', () => {
    it('should allow Sales Manager to approve a return', async () => {
      const res = await request(app)
        .put(`/api/admin/orders/${orderId}/items/${itemId}/return`)
        .set('Authorization', `Bearer ${smToken}`)
        .send({ action: 'approve' });
      
      expect(res.status).to.equal(200);
      const item = res.body.items.find(i => i._id.toString() === itemId.toString());
      expect(item.returnStatus).to.equal('approved');
      expect(item.refundAmount).to.equal(500); // 1 * 500
    });

    it('should successfully refund the user\'s wallet', async () => {
      const user = await User.findById(userId);
      expect(user.walletBalance).to.equal(500); // 0 + 500 refund
    });
  });
});
