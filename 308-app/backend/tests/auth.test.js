const request = require('supertest');
const { expect } = require('chai');
const { app } = require('../server');
const User = require('../models/User');

describe('1. Authentication Tests', () => {
  let validToken;

  before(async () => {
    // Clear users before testing
    await User.deleteMany({});
  });

  describe('POST /api/register', () => {
    it('should successfully register a new user', async () => {
      const res = await request(app)
        .post('/api/register')
        .send({
          fullName: 'Test User',
          email: 'test@example.com',
          password: 'password123'
        });
      
      expect(res.status).to.equal(201);
      expect(res.body.success).to.be.true;

      // Log in to get the token for future tests
      const loginRes = await request(app)
        .post('/api/login')
        .send({ email: 'test@example.com', password: 'password123' });
      validToken = loginRes.body.token;
    });

    it('should fail to register with an already existing email', async () => {
      const res = await request(app)
        .post('/api/register')
        .send({
          fullName: 'Another User',
          email: 'test@example.com', // Duplicate
          password: 'password123'
        });
      
      expect(res.status).to.equal(400);
      expect(res.body.success).to.be.false;
      expect(res.body.message).to.include('in use');
    });

    it('should fail to register without required fields', async () => {
      const res = await request(app)
        .post('/api/register')
        .send({ email: 'nofields@example.com' }); // Missing password, etc
      
      expect(res.status).to.equal(400);
      expect(res.body.success).to.be.false;
    });
  });

  describe('POST /api/login', () => {
    it('should successfully log in with correct credentials', async () => {
      const res = await request(app)
        .post('/api/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        });
      
      expect(res.status).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.token).to.equal(validToken); // Token should be returned
    });

    it('should fail to log in with incorrect password', async () => {
      const res = await request(app)
        .post('/api/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword'
        });
      
      expect(res.status).to.equal(401);
      expect(res.body.success).to.be.false;
      expect(res.body.message).to.include('Incorrect');
    });
  });

  describe('GET /api/profile', () => {
    it('should successfully retrieve profile with valid token', async () => {
      const res = await request(app)
        .get('/api/profile')
        .set('Authorization', `Bearer ${validToken}`);

      expect(res.status).to.equal(200);
      expect(res.body.email).to.equal('test@example.com');
      expect(res.body.firstName).to.equal('Test');
    });

    it('should fail to retrieve profile without a token (401 Unauthorized)', async () => {
      const res = await request(app)
        .get('/api/profile');

      expect(res.status).to.equal(401);
      expect(res.body.message).to.equal('Missing auth token');
    });

    it('should not expose password, cart or wishlist', async () => {
      const res = await request(app)
        .get('/api/profile')
        .set('Authorization', `Bearer ${validToken}`);

      expect(res.status).to.equal(200);
      expect(res.body).to.not.have.property('password');
      expect(res.body).to.not.have.property('cart');
      expect(res.body).to.not.have.property('wishlist');
    });
  });

  describe('PUT /api/profile', () => {
    it('should update address fields', async () => {
      const res = await request(app)
        .put('/api/profile')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          homeAddress: '42 Baker Street',
          city: 'London',
          zipCode: 'NW1 6XE',
          taxId: 'UK123456'
        });

      expect(res.status).to.equal(200);
      expect(res.body.message).to.include('updated');
      expect(res.body.user.city).to.equal('London');
      expect(res.body.user.homeAddress).to.equal('42 Baker Street');
    });

    it('should update name fields', async () => {
      const res = await request(app)
        .put('/api/profile')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ firstName: 'Updated', lastName: 'Name' });

      expect(res.status).to.equal(200);
      expect(res.body.user.firstName).to.equal('Updated');
      expect(res.body.user.lastName).to.equal('Name');
    });

    it('should only touch fields that are sent', async () => {
      // set city to something known, then update something else
      await request(app)
        .put('/api/profile')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ city: 'Berlin' });

      const res = await request(app)
        .put('/api/profile')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ taxId: 'DE987' });

      expect(res.status).to.equal(200);
      expect(res.body.user.city).to.equal('Berlin');
      expect(res.body.user.taxId).to.equal('DE987');
    });

    it('should require auth', async () => {
      const res = await request(app)
        .put('/api/profile')
        .send({ city: 'Paris' });

      expect(res.status).to.equal(401);
    });
  });
});
