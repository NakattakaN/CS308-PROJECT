const request = require('supertest');
const { expect } = require('chai');
const { app } = require('../server');
const User = require('../models/User');
const Product = require('../models/Product');
const Category = require('../models/Category');

describe('9. Categories & Admin Product Management Tests', () => {
  let pmToken;
  let userToken, userId;
  let categoryId;
  let productId;

  before(async () => {
    const pm = await User.create({
      firstName: 'Dave', lastName: 'Manager',
      email: 'dave@pm.test.com', password: 'x',
      role: 'product_manager', authToken: 'dave-pm-token'
    });
    pmToken = pm.authToken;

    const user = await User.create({
      firstName: 'Regular', lastName: 'Joe',
      email: 'joe@pm.test.com', password: 'x', authToken: 'joe-user-token'
    });
    userToken = user.authToken;
    userId = user._id;
  });

  describe('categories', () => {
    it('returns a list without auth', async () => {
      const res = await request(app).get('/api/categories');
      expect(res.status).to.equal(200);
      expect(res.body).to.be.an('array');
    });

    it('PM can create a category', async () => {
      const res = await request(app)
        .post('/api/admin/categories')
        .set('Authorization', `Bearer ${pmToken}`)
        .send({ name: 'Luxury' });

      expect(res.status).to.equal(201);
      expect(res.body.name).to.equal('Luxury');
      categoryId = res.body._id;
    });

    it('duplicate names are blocked', async () => {
      const res = await request(app)
        .post('/api/admin/categories')
        .set('Authorization', `Bearer ${pmToken}`)
        .send({ name: 'Luxury' });

      expect(res.status).to.equal(409);
    });

    it('whitespace-only name fails', async () => {
      const res = await request(app)
        .post('/api/admin/categories')
        .set('Authorization', `Bearer ${pmToken}`)
        .send({ name: '   ' });

      expect(res.status).to.equal(400);
    });

    it('403 for regular users trying to create', async () => {
      const res = await request(app)
        .post('/api/admin/categories')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ name: 'Budget' });

      expect(res.status).to.equal(403);
    });

    it('shows up in the public list after adding', async () => {
      const res = await request(app).get('/api/categories');
      const names = res.body.map(c => c.name);
      expect(names).to.include('Luxury');
    });

    it('PM can delete a category', async () => {
      const res = await request(app)
        .delete(`/api/admin/categories/${categoryId}`)
        .set('Authorization', `Bearer ${pmToken}`);

      expect(res.status).to.equal(200);
      expect(await Category.findById(categoryId)).to.be.null;
    });

    it('404 for non-existent category', async () => {
      const res = await request(app)
        .delete('/api/admin/categories/5f8d0d55b54764421b7156d9')
        .set('Authorization', `Bearer ${pmToken}`);

      expect(res.status).to.equal(404);
    });

    it('regular users cannot delete categories either', async () => {
      const temp = await Category.create({ name: 'Temp' });

      const res = await request(app)
        .delete(`/api/admin/categories/${temp._id}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).to.equal(403);
    });
  });

  describe('admin product management', () => {
    it('PM can add a product', async () => {
      const res = await request(app)
        .post('/api/admin/products')
        .set('Authorization', `Bearer ${pmToken}`)
        .send({
          name: 'Panerai Luminor Due',
          brand: 'Panerai',
          price: 7800,
          stock: 2,
          image: 'panerai.jpg'
        });

      expect(res.status).to.equal(201);
      expect(res.body.name).to.equal('Panerai Luminor Due');
      productId = res.body._id;
    });

    it('regular users get 403', async () => {
      const res = await request(app)
        .post('/api/admin/products')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ name: 'Knock-Off', brand: 'Nobody', price: 5, stock: 1, image: 'x.jpg' });

      expect(res.status).to.equal(403);
    });

    it('can update stock and price', async () => {
      const res = await request(app)
        .put(`/api/admin/products/${productId}`)
        .set('Authorization', `Bearer ${pmToken}`)
        .send({ stock: 5, price: 8200 });

      expect(res.status).to.equal(200);
      expect(res.body.stock).to.equal(5);
      expect(res.body.price).to.equal(8200);
    });

    it('shows up in the staff product list', async () => {
      const res = await request(app)
        .get('/api/admin/products')
        .set('Authorization', `Bearer ${pmToken}`);

      expect(res.status).to.equal(200);
      const ids = res.body.map(p => p._id.toString());
      expect(ids).to.include(productId.toString());
    });

    it('regular users cannot see admin product list', async () => {
      const res = await request(app)
        .get('/api/admin/products')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).to.equal(403);
    });

    it('404 when updating something that does not exist', async () => {
      const res = await request(app)
        .put('/api/admin/products/5f8d0d55b54764421b7156d9')
        .set('Authorization', `Bearer ${pmToken}`)
        .send({ price: 1000 });

      expect(res.status).to.equal(404);
    });

    it('deleting a product removes it from wishlists too', async () => {
      // put the product on the user's wishlist first
      await User.findByIdAndUpdate(userId, { $addToSet: { wishlist: productId } });

      await request(app)
        .delete(`/api/admin/products/${productId}`)
        .set('Authorization', `Bearer ${pmToken}`);

      const getRes = await request(app).get(`/api/products/${productId}`);
      expect(getRes.status).to.equal(404);

      const updatedUser = await User.findById(userId);
      expect(updatedUser.wishlist.map(id => id.toString())).to.not.include(productId.toString());
    });
  });
});
