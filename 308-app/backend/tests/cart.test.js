const request = require('supertest');
const { expect } = require('chai');
const { app } = require('../server');
const Product = require('../models/Product');
const User = require('../models/User');

describe('3. Cart Management Tests', () => {
  let userId, userToken, productId;

  before(async () => {
    const user = await User.create({
      firstName: 'Cart', lastName: 'User', email: 'cart@test.com', password: '123', authToken: 'cart-token'
    });
    userId = user._id;
    userToken = user.authToken;

    const p = await Product.create({
      name: 'Test Watch', brand: 'Test', price: 100, stock: 5, image: 'img.jpg'
    });
    productId = p._id;
  });

  describe('GET /api/users/:userId/cart', () => {
    it('should retrieve an empty cart for a new user', async () => {
      const res = await request(app)
        .get(`/api/users/${userId}/cart`)
        .set('Authorization', `Bearer ${userToken}`);
      
      expect(res.status).to.equal(200);
      expect(res.body).to.be.an('array').that.is.empty;
    });
  });

  describe('POST /api/users/:userId/cart', () => {
    it('should successfully add a valid product to the cart', async () => {
      const res = await request(app)
        .post(`/api/users/${userId}/cart`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ productId, quantity: 2 });
      
      expect(res.status).to.equal(200);
      expect(res.body.cart).to.be.an('array').with.lengthOf(1);
      expect(res.body.cart[0].quantity).to.equal(2);
    });

    it('should fail to add a product if requested quantity exceeds stock', async () => {
      const res = await request(app)
        .post(`/api/users/${userId}/cart`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ productId, quantity: 10 }); // Stock is 5
      
      expect(res.status).to.equal(400);
      expect(res.body.message).to.include('Insufficient stock');
    });
  });

  describe('PUT /api/users/:userId/cart/:itemId', () => {
    let cartItemId;
    before(async () => {
      // Get the cart to find the itemId
      const res = await request(app)
        .get(`/api/users/${userId}/cart`)
        .set('Authorization', `Bearer ${userToken}`);
      cartItemId = res.body[0]._id;
    });

    it('should successfully update quantity of a cart item', async () => {
      const res = await request(app)
        .put(`/api/users/${userId}/cart/${cartItemId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ quantity: 3 });
      
      expect(res.status).to.equal(200);
      const updatedItem = res.body.cart.find(i => i.product._id.toString() === productId.toString());
      expect(updatedItem.quantity).to.equal(3);
    });

    it('should fail to increase quantity beyond available stock', async () => {
      const res = await request(app)
        .put(`/api/users/${userId}/cart/${cartItemId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ quantity: 6 });
      
      expect(res.status).to.equal(200);
      const updatedItem = res.body.cart.find(i => i.product._id.toString() === productId.toString());
      expect(updatedItem.quantity).to.equal(5); // Capped at stock (5)
    });
  });

  describe('DELETE /api/users/:userId/cart/:itemId', () => {
    it('should successfully remove an item from the cart', async () => {
      const getRes = await request(app).get(`/api/users/${userId}/cart`).set('Authorization', `Bearer ${userToken}`);
      const cartItemId = getRes.body[0]._id;

      const res = await request(app)
        .delete(`/api/users/${userId}/cart/${cartItemId}`)
        .set('Authorization', `Bearer ${userToken}`);
      
      expect(res.status).to.equal(200);
      expect(res.body.cart).to.be.empty;
    });
  });
});
