const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '.env' });

const Product = require('./models/Product');
const User = require('./models/User');
const Order = require('./models/Order');

async function runDemoSeed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to DB...');

    const CUSTOMER_EMAIL = 'taha.yusa.bayraktar@gmail.com';
    const PM_EMAIL = 'pm@demo.com';
    const SM_EMAIL = 'sm@demo.com';
    const DEMO_PASSWORD = 'demo123';
    const DEMO_PRODUCT_REGEX = /^Demo Product [A-H]$/;

    // 1. Clean up any prior demo data so this is idempotent.
    const existingDemoUsers = await User.find({ email: { $in: [CUSTOMER_EMAIL, PM_EMAIL, SM_EMAIL] } }).select('_id');
    const demoUserIds = existingDemoUsers.map(u => u._id);
    if (demoUserIds.length > 0) {
      await Order.deleteMany({ userId: { $in: demoUserIds } });
    }
    await User.deleteMany({ email: { $in: [CUSTOMER_EMAIL, PM_EMAIL, SM_EMAIL] } });
    await Product.deleteMany({ name: { $regex: DEMO_PRODUCT_REGEX } });

    // 2. Create demo products.
    const demoImage = 'https://content.rolex.com/v7/dam/model/upright-c/m116500ln-0001.png';
    const productSpecs = [
      { name: 'Demo Product A', stock: 0,  price: 800,  status: 'out_of_stock' },
      { name: 'Demo Product B', stock: 1,  price: 1200 },
      { name: 'Demo Product C', stock: 20, price: 500 },
      { name: 'Demo Product E', stock: 10, price: 900 },
      { name: 'Demo Product F', stock: 10, price: 700 },
      { name: 'Demo Product G', stock: 10, price: 600 },
      { name: 'Demo Product H', stock: 10, price: 1100 }
    ];
    const productDocs = productSpecs.map(p => ({
      name: p.name,
      brand: 'Saatinden Demo',
      model: 'Demo Model',
      price: p.price,
      image: demoImage,
      description: 'Demo product for final demo scenario.',
      referenceNumber: `DEMO-${p.name.slice(-1)}`,
      serialNumber: `SN-${p.name.slice(-1)}-001`,
      warrantyStatus: '2 years',
      distributorInfo: 'Saatinden Demo Distribution',
      stock: p.stock,
      status: p.status || 'available',
      gender: 'unisex', strapColor: 'siyah', strapMaterial: 'metal',
      caseShape: 'oval', displayType: 'analog'
    }));
    const createdProducts = await Product.insertMany(productDocs);
    const productByName = Object.fromEntries(createdProducts.map(p => [p.name, p]));

    // 3. Create demo accounts.
    const hashedPassword = await bcrypt.hash(DEMO_PASSWORD, 10);
    const customer = await User.create({
      firstName: 'Taha', lastName: 'Bayraktar',
      email: CUSTOMER_EMAIL,
      password: hashedPassword,
      taxId: '12345678901',
      homeAddress: 'Tuzla Mahallesi, Sabanci Universitesi',
      city: 'Istanbul', zipCode: '34956',
      role: 'user',
      walletBalance: 1000
    });
    const pm = await User.create({
      firstName: 'Product', lastName: 'Manager',
      email: PM_EMAIL, password: hashedPassword, role: 'product_manager'
    });
    const sm = await User.create({
      firstName: 'Sales', lastName: 'Manager',
      email: SM_EMAIL, password: hashedPassword, role: 'sales_manager'
    });

    // 4. Create orders with backdated timestamps. Use direct collection insert
    // to bypass Mongoose's automatic createdAt overwrite.
    const now = Date.now();
    const daysAgo = d => new Date(now - d * 24 * 60 * 60 * 1000);
    const shippingAddress = {
      fullName: 'Taha Bayraktar',
      address: 'Tuzla Mahallesi, Sabanci Universitesi',
      city: 'Istanbul', zipCode: '34956'
    };
    const buildOrder = (productName, opts) => {
      const product = productByName[productName];
      return {
        _id: new mongoose.Types.ObjectId(),
        userId: customer._id,
        items: [{
          _id: new mongoose.Types.ObjectId(),
          productId: product._id,
          name: product.name,
          brand: product.brand,
          price: product.price,
          quantity: 1,
          returnStatus: 'none',
          refundAmount: 0
        }],
        totalAmount: product.price,
        shippingAddress,
        status: opts.status,
        deliveredAt: opts.deliveredAt,
        createdAt: opts.createdAt,
        updatedAt: opts.createdAt
      };
    };
    const orderDocs = [
      buildOrder('Demo Product E', { status: 'Delivered',  createdAt: daysAgo(45), deliveredAt: daysAgo(45) }),
      buildOrder('Demo Product F', { status: 'Delivered',  createdAt: daysAgo(10), deliveredAt: daysAgo(10) }),
      buildOrder('Demo Product G', { status: 'Processing', createdAt: daysAgo(2) }),
      buildOrder('Demo Product H', { status: 'In-Transit', createdAt: daysAgo(3) })
    ];
    await Order.collection.insertMany(orderDocs);

    console.log('=================================');
    console.log('✅ FINAL DEMO SEEDED SUCCESSFULLY');
    console.log('=================================');
    console.log('ACCOUNTS CREATED:');
    console.log('Customer:       taha.yusa.bayraktar@gmail.com / demo123');
    console.log('Prod. Manager:  pm@demo.com / demo123');
    console.log('Sales Manager:  sm@demo.com / demo123');
    console.log('');
    console.log('PRODUCTS CREATED:');
    console.log('Demo Product A (Stock: 0)');
    console.log('Demo Product B (Stock: 1)');
    console.log('Demo Product C (Stock: 20)');
    console.log('Demo Product E (Delivered 45 days ago - No Return Allowed)');
    console.log('Demo Product F (Delivered 10 days ago - Returnable)');
    console.log('Demo Product G (Processing - Cancellable)');
    console.log('Demo Product H (In-Transit)');
    console.log('=================================');

    process.exit(0);
  } catch (err) {
    console.error('ERROR SEEDING DEMO:', err);
    process.exit(1);
  }
}

runDemoSeed();
