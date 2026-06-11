const request = require('supertest');
const { expect } = require('chai');
const { app } = require('../server');
const User = require('../models/User');
const Product = require('../models/Product');

describe('7. Wishlist Tests', () => {
  let userId, token;
  let p1Id, p2Id;

  before(async () => {
    const user = await User.create({
      firstName: 'Wish', lastName: 'Lister',
      email: 'wish@test.com', password: 'x', authToken: 'wish-list-token'
    });
    userId = user._id.toString();
    token = user.authToken;

    const p1 = await Product.create({
      name: 'Tudor Black Bay 58', brand: 'Tudor', price: 3200, stock: 3, image: 'tudor.jpg'
    });
    p1Id = p1._id.toString();

    const p2 = await Product.create({
      name: 'Seiko Presage SARX', brand: 'Seiko', price: 450, stock: 10, image: 'seiko.jpg'
    });
    p2Id = p2._id.toString();
  });

  describe('fetching wishlist', () => {
    it('empty to start', async () => {
      const res = await request(app)
        .get(`/api/users/${userId}/wishlist`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).to.equal(200);
      expect(res.body).to.be.an('array').that.is.empty;
    });

    it('should block other users', async () => {
      await User.create({
        firstName: 'Snooper', lastName: 'User',
        email: 'snooper@test.com', password: 'x', authToken: 'snooper-token'
      });

      const res = await request(app)
        .get(`/api/users/${userId}/wishlist`)
        .set('Authorization', 'Bearer snooper-token');

      expect(res.status).to.equal(403);
    });

    it('401 without token', async () => {
      const res = await request(app).get(`/api/users/${userId}/wishlist`);
      expect(res.status).to.equal(401);
    });
  });

  describe('adding items', () => {
    it('adds the item and returns the populated list', async () => {
      const res = await request(app)
        .post(`/api/users/${userId}/wishlist`)
        .set('Authorization', `Bearer ${token}`)
        .send({ productId: p1Id });

      expect(res.status).to.equal(200);
      expect(res.body).to.be.an('array').with.lengthOf(1);
      expect(res.body[0]._id.toString()).to.equal(p1Id);
    });

    it('duplicate add is idempotent', async () => {
      // adding the same product twice should not create a second entry
      await request(app)
        .post(`/api/users/${userId}/wishlist`)
        .set('Authorization', `Bearer ${token}`)
        .send({ productId: p1Id });

      const res = await request(app)
        .get(`/api/users/${userId}/wishlist`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.body).to.have.lengthOf(1);
    });

    it('nonexistent product returns 404', async () => {
      const res = await request(app)
        .post(`/api/users/${userId}/wishlist`)
        .set('Authorization', `Bearer ${token}`)
        .send({ productId: '5f8d0d55b54764421b7156ee' });

      expect(res.status).to.equal(404);
    });

    it('productId is required', async () => {
      const res = await request(app)
        .post(`/api/users/${userId}/wishlist`)
        .set('Authorization', `Bearer ${token}`)
        .send({});

      expect(res.status).to.equal(400);
    });

    it('can add multiple different items', async () => {
      const res = await request(app)
        .post(`/api/users/${userId}/wishlist`)
        .set('Authorization', `Bearer ${token}`)
        .send({ productId: p2Id });

      expect(res.status).to.equal(200);
      expect(res.body).to.have.lengthOf(2);
    });
  });

  describe('removing items', () => {
    it('removes one item and leaves the other', async () => {
      const res = await request(app)
        .delete(`/api/users/${userId}/wishlist/${p1Id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).to.equal(200);
      const ids = res.body.map(p => p._id.toString());
      expect(ids).to.not.include(p1Id);
      expect(ids).to.include(p2Id);
    });

    it("removing something that's not there doesn't blow up", async () => {
      // p1Id was already removed above
      const res = await request(app)
        .delete(`/api/users/${userId}/wishlist/${p1Id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).to.equal(200);
    });

    it('403 for wrong user', async () => {
      await User.create({
        firstName: 'Intruder', lastName: 'User',
        email: 'intruder@test.com', password: 'x', authToken: 'intruder-token'
      });

      const res = await request(app)
        .delete(`/api/users/${userId}/wishlist/${p2Id}`)
        .set('Authorization', 'Bearer intruder-token');

      expect(res.status).to.equal(403);
    });
  });
});
