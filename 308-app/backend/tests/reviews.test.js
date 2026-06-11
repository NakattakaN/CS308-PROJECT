const request = require('supertest');
const { expect } = require('chai');
const { app } = require('../server');
const Product = require('../models/Product');
const User = require('../models/User');
const Order = require('../models/Order');
const Review = require('../models/Review');

describe('6. Reviews & Moderation Tests', () => {
  let reviewerId, reviewerToken;
  let pmId, pmToken;
  let productId;

  before(async () => {
    const reviewer = await User.create({
      firstName: 'Alex', lastName: 'Turner',
      email: 'alex@reviews.test.com', password: 'x', authToken: 'alex-review-token'
    });
    reviewerId = reviewer._id;
    reviewerToken = reviewer.authToken;

    const pm = await User.create({
      firstName: 'PM', lastName: 'Mod',
      email: 'pm@reviews.test.com', password: 'x',
      role: 'product_manager', authToken: 'pm-reviews-token'
    });
    pmId = pm._id;
    pmToken = pm.authToken;

    const product = await Product.create({
      name: 'Omega Seamaster 300', brand: 'Omega', price: 5500, stock: 2, image: 'omega.jpg'
    });
    productId = product._id;

    // reviewer needs a delivered order to pass the purchase gate
    await Order.create({
      userId: reviewerId,
      items: [{ productId, name: 'Omega Seamaster 300', brand: 'Omega', price: 5500, quantity: 1 }],
      totalAmount: 5500,
      status: 'Delivered',
      deliveredAt: new Date()
    });
  });

  describe('listing reviews', () => {
    it('starts empty for a new product', async () => {
      const res = await request(app).get(`/api/products/${productId}/reviews`);
      expect(res.status).to.equal(200);
      expect(res.body).to.be.an('array').that.is.empty;
    });

    it('bad product id → 400', async () => {
      const res = await request(app).get('/api/products/not-valid/reviews');
      expect(res.status).to.equal(400);
    });
  });

  describe('submitting a review', () => {
    it("can't review without a completed purchase", async () => {
      await User.create({
        firstName: 'No', lastName: 'Purchase',
        email: 'nopurchase@reviews.test.com', password: 'x', authToken: 'nopurchase-token'
      });

      const res = await request(app)
        .post(`/api/products/${productId}/reviews`)
        .set('Authorization', 'Bearer nopurchase-token')
        .send({ rating: 5 });

      expect(res.status).to.equal(403);
      expect(res.body.message).to.include('delivered');
    });

    it('empty body with no rating is rejected', async () => {
      const res = await request(app)
        .post(`/api/products/${productId}/reviews`)
        .set('Authorization', `Bearer ${reviewerToken}`)
        .send({});

      expect(res.status).to.equal(400);
    });

    it('rating only skips the moderation queue', async () => {
      const res = await request(app)
        .post(`/api/products/${productId}/reviews`)
        .set('Authorization', `Bearer ${reviewerToken}`)
        .send({ rating: 4 });

      expect(res.status).to.equal(201);
      expect(res.body.status).to.equal('APPROVED');
      expect(res.body.rating).to.equal(4);
    });

    it('any body text goes to moderation', async () => {
      const res = await request(app)
        .post(`/api/products/${productId}/reviews`)
        .set('Authorization', `Bearer ${reviewerToken}`)
        .send({ rating: 4, body: 'Solid build, bracelet fits perfectly.' });

      expect(res.status).to.equal(201);
      expect(res.body.status).to.equal('UNDER_REVIEW');
    });

    it('rating must be 1-5', async () => {
      const res = await request(app)
        .post(`/api/products/${productId}/reviews`)
        .set('Authorization', `Bearer ${reviewerToken}`)
        .send({ rating: 6 });

      expect(res.status).to.equal(400);
      expect(res.body.message).to.include('1 and 5');
    });

    it('re-reviewing the same product updates in place, no second document', async () => {
      await request(app)
        .post(`/api/products/${productId}/reviews`)
        .set('Authorization', `Bearer ${reviewerToken}`)
        .send({ rating: 5, body: 'Changed my mind — even better than I thought.' });

      const all = await Review.find({ product: productId, user: reviewerId });
      expect(all).to.have.lengthOf(1);
    });

    it('needs a login', async () => {
      const res = await request(app)
        .post(`/api/products/${productId}/reviews`)
        .send({ rating: 3 });

      expect(res.status).to.equal(401);
    });
  });

  describe('latest reviews', () => {
    it('capped at 6', async () => {
      const res = await request(app).get('/api/reviews/latest');
      expect(res.status).to.equal(200);
      expect(res.body.length).to.be.at.most(6);
    });

    it('no pending reviews leak through', async () => {
      const res = await request(app).get('/api/reviews/latest');
      const statuses = res.body.map(r => r.status);
      expect(statuses.every(s => s === 'APPROVED')).to.be.true;
    });
  });

  describe('moderation queue', () => {
    it('should be staff only — 403 for regular users', async () => {
      const res = await request(app)
        .get('/api/admin/reviews')
        .set('Authorization', `Bearer ${reviewerToken}`);

      expect(res.status).to.equal(403);
    });

    it('PM sees UNDER_REVIEW items by default', async () => {
      const res = await request(app)
        .get('/api/admin/reviews')
        .set('Authorization', `Bearer ${pmToken}`);

      expect(res.status).to.equal(200);
      expect(res.body.every(r => r.status === 'UNDER_REVIEW')).to.be.true;
    });

    it('can filter by a different status', async () => {
      const res = await request(app)
        .get('/api/admin/reviews?status=APPROVED')
        .set('Authorization', `Bearer ${pmToken}`);

      expect(res.status).to.equal(200);
      expect(res.body.every(r => r.status === 'APPROVED')).to.be.true;
    });
  });

  describe('approve / reject', () => {
    let targetId;

    before(async () => {
      const pending = await Review.findOne({ status: 'UNDER_REVIEW' });
      targetId = pending._id;
    });

    it('PM can approve', async () => {
      const res = await request(app)
        .patch(`/api/admin/reviews/${targetId}`)
        .set('Authorization', `Bearer ${pmToken}`)
        .send({ status: 'APPROVED' });

      expect(res.status).to.equal(200);
      expect(res.body.status).to.equal('APPROVED');
      expect(res.body.moderatedBy.toString()).to.equal(pmId.toString());
    });

    it('regular users get 403', async () => {
      const res = await request(app)
        .patch(`/api/admin/reviews/${targetId}`)
        .set('Authorization', `Bearer ${reviewerToken}`)
        .send({ status: 'APPROVED' });

      expect(res.status).to.equal(403);
    });

    it('invalid status → 400', async () => {
      const res = await request(app)
        .patch(`/api/admin/reviews/${targetId}`)
        .set('Authorization', `Bearer ${pmToken}`)
        .send({ status: 'PENDING' });

      expect(res.status).to.equal(400);
    });

    it('PM can reject too', async () => {
      const toReject = await Review.create({
        product: productId,
        user: pmId,
        reviewerName: 'PM Mod',
        body: 'Should be rejected.',
        status: 'UNDER_REVIEW'
      });

      const res = await request(app)
        .patch(`/api/admin/reviews/${toReject._id}`)
        .set('Authorization', `Bearer ${pmToken}`)
        .send({ status: 'REJECTED' });

      expect(res.status).to.equal(200);
      expect(res.body.status).to.equal('REJECTED');
    });

    it('404 on a bad id', async () => {
      const res = await request(app)
        .patch('/api/admin/reviews/5f8d0d55b54764421b7156d9')
        .set('Authorization', `Bearer ${pmToken}`)
        .send({ status: 'APPROVED' });

      expect(res.status).to.equal(404);
    });
  });
});
