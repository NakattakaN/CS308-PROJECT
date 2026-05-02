require('dotenv').config();
require('./db');
const mongoose = require('mongoose');
const Product = require('./models/Product');
const readline = require('readline');

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = (q) => new Promise(res => rl.question(q, res));

setTimeout(async () => {
  const products = await Product.find({}, '_id name brand image').lean();

  console.log('\n--- ÜRÜN LİSTESİ ---');
  products.forEach((p, i) => {
    console.log(`[${i + 1}] ${p.brand} - ${p.name}`);
    console.log(`    ID: ${p._id}`);
    console.log(`    Mevcut resim: ${p.image || '(yok)'}\n`);
  });

  const numStr = await ask('Güncellemek istediğin ürünün numarasını gir (1-' + products.length + '): ');
  const num = parseInt(numStr) - 1;

  if (isNaN(num) || num < 0 || num >= products.length) {
    console.log('Geçersiz numara.');
    rl.close();
    process.exit(1);
  }

  const selected = products[num];
  console.log(`\nSeçilen: ${selected.brand} - ${selected.name}`);
  console.log(`Mevcut URL: ${selected.image || '(yok)'}`);

  const newUrl = await ask('Yeni resim URL\'sini gir: ');

  if (!newUrl.trim()) {
    console.log('URL boş olamaz.');
    rl.close();
    process.exit(1);
  }

  await Product.findByIdAndUpdate(selected._id, { image: newUrl.trim() });
  console.log('✅ Resim güncellendi!');

  const again = await ask('\nBaşka bir ürün güncellemek ister misin? (e/h): ');
  if (again.trim().toLowerCase() === 'e') {
    rl.close();
    // Tekrar çalıştır
    require('child_process').spawn(process.execPath, [__filename], { stdio: 'inherit' });
  } else {
    rl.close();
    await mongoose.connection.close();
    process.exit(0);
  }
}, 2000);
