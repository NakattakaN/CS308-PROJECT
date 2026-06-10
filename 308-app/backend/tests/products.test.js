const request = require('supertest');
const { expect } = require('chai');
const { app } = require('../server');
const Product = require('../models/Product');
const User = require('../models/User');

describe('2. Product & Inventory Tests', () => {
  let productId1, productId2;
  let pmToken;

  before(async () => {
    await Product.deleteMany({});
    
    const p1 = await Product.create({
      name: 'Luxury Watch A',
      brand: 'Rolex',
      model: 'Submariner',
      price: 10000,
      stock: 5,
      category: 'mens',
      image: 'img.jpg'
    });
    productId1 = p1._id;

    const p2 = await Product.create({
      name: 'Cheap Watch B',
      brand: 'Casio',
      model: 'F91W',
      price: 20,
      stock: 100,
      category: 'unisex',
      image: 'img2.jpg'
    });
    productId2 = p2._id;

    // Create Product Manager for update test
    const pm = await User.create({
      firstName: 'PM', lastName: 'User', email: 'pm@test.com', password: '123', role: 'product_manager', authToken: 'pm-token'
    });
    pmToken = pm.authToken;
  });

  describe('GET /api/products', () => {
    it('should retrieve a list of available products', async () => {
      const res = await request(app).get('/api/products');
      expect(res.status).to.equal(200);
      expect(res.body).to.be.an('array');
      expect(res.body.length).to.equal(2);
    });

    it('should attach averageRating to products', async () => {
      const res = await request(app).get('/api/products');
      expect(res.status).to.equal(200);
      expect(res.body[0]).to.have.property('averageRating');
    });

    it('should attach reviewCount to products', async () => {
      const res = await request(app).get('/api/products');
      expect(res.status).to.equal(200);
      expect(res.body[0]).to.have.property('reviewCount');
    });
  });

  describe('GET /api/products/:id', () => {
    it('should retrieve a single product by ID', async () => {
      const res = await request(app).get(`/api/products/${productId1}`);
      expect(res.status).to.equal(200);
      expect(res.body.name).to.equal('Luxury Watch A');
    });

    it('should return 404 for a non-existent product ID', async () => {
      const fakeId = '5f8d0d55b54764421b7156d9';
      const res = await request(app).get(`/api/products/${fakeId}`);
      expect(res.status).to.equal(404);
      expect(res.body.message).to.equal('Product not found!');
    });
  });


});
