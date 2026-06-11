const request = require('supertest');
const { expect } = require('chai');
const { app } = require('../server');
const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');

describe('10. Staff — Order Management, Pricing & Revenue', () => {
  let pmToken;
  let smToken;
  let adminToken;
  let customerId, customerToken;
  let productId;
  let orderId;

  before(async () => {
    const pm = await User.create({
      firstName: 'Kim', lastName: 'PM',
      email: 'kim@staff.test.com', password: 'x',
      role: 'product_manager', authToken: 'kim-pm-staff-token'
    });
    pmToken = pm.authToken;

    const sm = await User.create({
      firstName: 'Sam', lastName: 'SM',
      email: 'sam@staff.test.com', password: 'x',
      role: 'sales_manager', authToken: 'sam-sm-staff-token'
    });
    smToken = sm.authToken;

    const admin = await User.create({
      firstName: 'Root', lastName: 'Admin',
      email: 'root@staff.test.com', password: 'x',
      role: 'admin', authToken: 'root-admin-staff-token'
    });
    adminToken = admin.authToken;

    const customer = await User.create({
      firstName: 'Jane', lastName: 'Customer',
      email: 'jane@staff.test.com', password: 'x',
      authToken: 'jane-customer-token',
      walletBalance: 0
    });
    customerId = customer._id.toString();
    customerToken = customer.authToken;

    const p = await Product.create({
      name: 'Longines HydroConquest', brand: 'Longines', price: 900, stock: 10, image: 'longines.jpg'
    });
    productId = p._id;

    const order = await Order.create({
      userId: customerId,
      items: [{ productId, name: 'Longines HydroConquest', brand: 'Longines', price: 900, quantity: 1 }],
      totalAmount: 900,
      status: 'Processing',
      shippingAddress: { fullName: 'Jane Customer', address: '5 High St', city: 'Istanbul', zipCode: '34000' }
    });
    orderId = order._id;
  });

  describe('wallet', () => {
    it('returns balance for authenticated user', async () => {
      const res = await request(app)
        .get(`/api/users/${customerId}/wallet`)
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).to.equal(200);
      expect(res.body.walletBalance).to.equal(0);
    });

    it('403 for wrong user', async () => {
      await User.create({
        firstName: 'Nosy', lastName: 'Parker',
        email: 'nosy@staff.test.com', password: 'x', authToken: 'nosy-token'
      });

      const res = await request(app)
        .get(`/api/users/${customerId}/wallet`)
        .set('Authorization', 'Bearer nosy-token');

      expect(res.status).to.equal(403);
    });
  });

  describe('admin order list', () => {
    it('product manager can view all orders', async () => {
      const res = await request(app)
        .get('/api/admin/orders')
        .set('Authorization', `Bearer ${pmToken}`);

      expect(res.status).to.equal(200);
      expect(res.body).to.be.an('array');
    });

    it('sales manager too', async () => {
      const res = await request(app)
        .get('/api/admin/orders')
        .set('Authorization', `Bearer ${smToken}`);

      expect(res.status).to.equal(200);
    });

    it('regular customers are blocked', async () => {
      const res = await request(app)
        .get('/api/admin/orders')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).to.equal(403);
    });

    it('date range filter includes orders from today', async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const res = await request(app)
        .get(`/api/admin/orders?from=${yesterday.toISOString().split('T')[0]}&to=${tomorrow.toISOString().split('T')[0]}`)
        .set('Authorization', `Bearer ${pmToken}`);

      expect(res.status).to.equal(200);
      const ids = res.body.map(o => o._id.toString());
      expect(ids).to.include(orderId.toString());
    });
  });

  describe('updating order status', () => {
    it('processing → in-transit', async () => {
      const res = await request(app)
        .put(`/api/admin/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${pmToken}`)
        .send({ status: 'In-Transit' });

      expect(res.status).to.equal(200);
      expect(res.body.status).to.equal('In-Transit');
    });

    it('delivered status sets the timestamp', async () => {
      const res = await request(app)
        .put(`/api/admin/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${pmToken}`)
        .send({ status: 'Delivered' });

      expect(res.status).to.equal(200);
      expect(res.body.deliveredAt).to.not.be.null;
    });

    it("'Cancelled' isn't allowed here — use the cancel endpoint instead", async () => {
      const res = await request(app)
        .put(`/api/admin/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${pmToken}`)
        .send({ status: 'Cancelled' });

      expect(res.status).to.equal(400);
    });

    it('404 on bad order id', async () => {
      const res = await request(app)
        .put('/api/admin/orders/5f8d0d55b54764421b7156d9/status')
        .set('Authorization', `Bearer ${pmToken}`)
        .send({ status: 'In-Transit' });

      expect(res.status).to.equal(404);
    });
  });

  describe('user management', () => {
    it('product managers cannot see the user list', async () => {
      const res = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${pmToken}`);

      expect(res.status).to.equal(403);
    });

    it('admin gets all users, no passwords or tokens exposed', async () => {
      const res = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).to.equal(200);
      expect(res.body).to.be.an('array');
      expect(res.body[0]).to.not.have.property('password');
      expect(res.body[0]).to.not.have.property('authToken');
    });
  });

  describe('discounts', () => {
    it('SM applies a 20% discount', async () => {
      const res = await request(app)
        .patch(`/api/products/${productId}/discount`)
        .set('Authorization', `Bearer ${smToken}`)
        .send({ discountRate: 20 });

      expect(res.status).to.equal(200);
      expect(res.body.discountRate).to.equal(20);
      expect(res.body.price).to.equal(720); // 900 * 0.80
      expect(res.body.originalPrice).to.equal(900);
    });

    it('campaignEnd date gets stored', async () => {
      const future = new Date();
      future.setDate(future.getDate() + 7);

      const res = await request(app)
        .patch(`/api/products/${productId}/discount`)
        .set('Authorization', `Bearer ${smToken}`)
        .send({ discountRate: 10, campaignEnd: future.toISOString() });

      expect(res.body.campaignEnd).to.not.be.null;
    });

    it('rate 0 removes the campaign and restores the original price', async () => {
      const res = await request(app)
        .patch(`/api/products/${productId}/discount`)
        .set('Authorization', `Bearer ${smToken}`)
        .send({ discountRate: 0 });

      expect(res.status).to.equal(200);
      expect(res.body.price).to.equal(900);
      expect(res.body.originalPrice).to.be.null;
    });

    it('rate above 100 is rejected', async () => {
      const res = await request(app)
        .patch(`/api/products/${productId}/discount`)
        .set('Authorization', `Bearer ${smToken}`)
        .send({ discountRate: 101 });

      expect(res.status).to.equal(400);
    });

    it('negative rate is also rejected', async () => {
      const res = await request(app)
        .patch(`/api/products/${productId}/discount`)
        .set('Authorization', `Bearer ${smToken}`)
        .send({ discountRate: -1 });

      expect(res.status).to.equal(400);
    });

    it('403 for customers', async () => {
      const res = await request(app)
        .patch(`/api/products/${productId}/discount`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ discountRate: 10 });

      expect(res.status).to.equal(403);
    });

    it('404 on unknown product', async () => {
      const res = await request(app)
        .patch('/api/products/5f8d0d55b54764421b7156d9/discount')
        .set('Authorization', `Bearer ${smToken}`)
        .send({ discountRate: 10 });

      expect(res.status).to.equal(404);
    });
  });

  describe('pricing', () => {
    it('SM can change the base price', async () => {
      const res = await request(app)
        .patch(`/api/products/${productId}/price`)
        .set('Authorization', `Bearer ${smToken}`)
        .send({ price: 950 });

      expect(res.status).to.equal(200);
      expect(res.body.price).to.equal(950);
    });

    it('changing price while a discount is active recalculates the discounted price', async () => {
      // set up a 10% campaign first
      await request(app)
        .patch(`/api/products/${productId}/discount`)
        .set('Authorization', `Bearer ${smToken}`)
        .send({ discountRate: 10 });

      const res = await request(app)
        .patch(`/api/products/${productId}/price`)
        .set('Authorization', `Bearer ${smToken}`)
        .send({ price: 1000 });

      expect(res.body.originalPrice).to.equal(1000);
      expect(res.body.price).to.equal(900); // 1000 * 0.90
    });

    it('negative price rejected', async () => {
      const res = await request(app)
        .patch(`/api/products/${productId}/price`)
        .set('Authorization', `Bearer ${smToken}`)
        .send({ price: -50 });

      expect(res.status).to.equal(400);
    });

    it('403 for customers', async () => {
      const res = await request(app)
        .patch(`/api/products/${productId}/price`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ price: 1 });

      expect(res.status).to.equal(403);
    });
  });

  describe('revenue report', () => {
    it('403 for regular users', async () => {
      const res = await request(app)
        .get('/api/admin/revenue')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).to.equal(403);
    });

    it('SM gets back data, totalRevenue, totalRefunds, netProfit', async () => {
      const res = await request(app)
        .get('/api/admin/revenue')
        .set('Authorization', `Bearer ${smToken}`);

      expect(res.status).to.equal(200);
      expect(res.body).to.include.keys(['data', 'totalRevenue', 'totalRefunds', 'netProfit']);
    });

    it('totalRevenue is the sum of daily revenue entries', async () => {
      const res = await request(app)
        .get('/api/admin/revenue')
        .set('Authorization', `Bearer ${smToken}`);

      const sum = res.body.data.reduce((acc, d) => acc + d.revenue, 0);
      expect(res.body.totalRevenue).to.equal(sum);
    });

    it('netProfit = totalRevenue - totalRefunds', async () => {
      const res = await request(app)
        .get('/api/admin/revenue')
        .set('Authorization', `Bearer ${smToken}`);

      expect(res.body.netProfit).to.equal(res.body.totalRevenue - res.body.totalRefunds);
    });

    it('January 2024 should have 31 data points', async () => {
      const res = await request(app)
        .get('/api/admin/revenue?from=2024-01-01&to=2024-01-31')
        .set('Authorization', `Bearer ${smToken}`);

      expect(res.body.data).to.have.lengthOf(31);
    });

    it('each entry has the expected shape', async () => {
      const res = await request(app)
        .get('/api/admin/revenue?from=2024-06-01&to=2024-06-01')
        .set('Authorization', `Bearer ${smToken}`);

      expect(res.body.data[0]).to.include.keys(['date', 'revenue', 'refunds', 'net']);
    });
  });
});
