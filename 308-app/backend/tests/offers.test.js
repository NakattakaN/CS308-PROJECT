const request = require('supertest');
const { expect } = require('chai');
const { app } = require('../server');
const User = require('../models/User');
const Product = require('../models/Product');

describe('8. Offers Tests', () => {
  let buyerToken;
  let smToken;
  let productId;
  let offerId;

  before(async () => {
    const buyer = await User.create({
      firstName: 'Max', lastName: 'Bidder',
      email: 'max@offers.test.com', password: 'x', authToken: 'max-offers-token'
    });
    buyerToken = buyer.authToken;

    await User.create({
      firstName: 'Susan', lastName: 'Sales',
      email: 'susan@offers.test.com', password: 'x',
      role: 'sales_manager', authToken: 'susan-sm-token'
    });
    smToken = 'susan-sm-token';

    const p = await Product.create({
      name: 'IWC Pilot Mark XX', brand: 'IWC', price: 4200, stock: 1, image: 'iwc.jpg'
    });
    productId = p._id;
  });

  describe('submitting offers', () => {
    it('saves the offer with pending status', async () => {
      const res = await request(app)
        .post(`/api/products/${productId}/offers`)
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({ offerPrice: 3800, message: 'Happy to buy today', userName: 'Max Bidder' });

      expect(res.status).to.equal(201);
      expect(res.body.offer.offerPrice).to.equal(3800);
      expect(res.body.offer.status).to.equal('pending');
      offerId = res.body.offer._id;
    });

    it('price must be > 0', async () => {
      const res = await request(app)
        .post(`/api/products/${productId}/offers`)
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({ offerPrice: 0 });

      expect(res.status).to.equal(400);
    });

    it('negative price fails too', async () => {
      const res = await request(app)
        .post(`/api/products/${productId}/offers`)
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({ offerPrice: -200 });

      expect(res.status).to.equal(400);
    });

    it('needs auth', async () => {
      const res = await request(app)
        .post(`/api/products/${productId}/offers`)
        .send({ offerPrice: 3500 });

      expect(res.status).to.equal(401);
    });

    it('no userName defaults to Anonymous', async () => {
      const res = await request(app)
        .post(`/api/products/${productId}/offers`)
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({ offerPrice: 3700 });

      expect(res.body.offer.userName).to.equal('Anonymous');
    });
  });

  describe('viewing offers per product', () => {
    it('anyone can see offers for a product', async () => {
      const res = await request(app).get(`/api/products/${productId}/offers`);
      expect(res.status).to.equal(200);
      expect(res.body.length).to.be.at.least(1);
    });

    it('sorted newest first', async () => {
      const res = await request(app).get(`/api/products/${productId}/offers`);
      if (res.body.length > 1) {
        const dates = res.body.map(o => new Date(o.createdAt).getTime());
        expect(dates[0]).to.be.at.least(dates[1]);
      }
    });
  });

  describe('admin offer list', () => {
    it('should require sales_manager', async () => {
      const res = await request(app)
        .get('/api/offers')
        .set('Authorization', `Bearer ${buyerToken}`);

      expect(res.status).to.equal(403);
    });

    it('SM sees all offers with product info included', async () => {
      const res = await request(app)
        .get('/api/offers')
        .set('Authorization', `Bearer ${smToken}`);

      expect(res.status).to.equal(200);
      expect(res.body[0]).to.have.nested.property('productId.name');
    });
  });

  describe('accepting / rejecting', () => {
    it('SM can accept an offer', async () => {
      const res = await request(app)
        .put(`/api/offers/${offerId}`)
        .set('Authorization', `Bearer ${smToken}`)
        .send({ status: 'accepted' });

      expect(res.status).to.equal(200);
      expect(res.body.status).to.equal('accepted');
    });

    it('SM can reject an offer', async () => {
      const offerRes = await request(app)
        .post(`/api/products/${productId}/offers`)
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({ offerPrice: 3600 });

      const res = await request(app)
        .put(`/api/offers/${offerRes.body.offer._id}`)
        .set('Authorization', `Bearer ${smToken}`)
        .send({ status: 'rejected' });

      expect(res.status).to.equal(200);
      expect(res.body.status).to.equal('rejected');
    });

    it('garbage status → 400', async () => {
      const res = await request(app)
        .put(`/api/offers/${offerId}`)
        .set('Authorization', `Bearer ${smToken}`)
        .send({ status: 'maybe' });

      expect(res.status).to.equal(400);
    });

    it('403 for regular users', async () => {
      const res = await request(app)
        .put(`/api/offers/${offerId}`)
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({ status: 'accepted' });

      expect(res.status).to.equal(403);
    });

    it('404 on missing offer', async () => {
      const res = await request(app)
        .put('/api/offers/5f8d0d55b54764421b7156d9')
        .set('Authorization', `Bearer ${smToken}`)
        .send({ status: 'rejected' });

      expect(res.status).to.equal(404);
    });
  });
});
