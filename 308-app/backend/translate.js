const mongoose = require('mongoose');
require('dotenv').config({path:'.env'});
mongoose.connect(process.env.MONGO_URI).then(async () => {
  const Product = require('./models/Product');
  const tMap = {
    'kadın': 'women', 'erkek': 'men', 'deri': 'leather', 'silikon': 'silicone', 'kumaş': 'fabric',
    'gümüş': 'silver', 'altın': 'gold', 'mavi': 'blue', 'yeşil': 'green', 'sarı': 'yellow',
    'kırmızı': 'red', 'turuncu': 'orange', 'mor': 'purple', 'kahverengi': 'brown', 'pembe': 'pink',
    'siyah': 'black', 'beyaz': 'white', 'krem': 'cream', 'köşeli': 'square', 'dijital': 'digital'
  };
  const products = await Product.collection.find({}).toArray();
  let count = 0;
  for (let p of products) {
    let changed = false;
    const update = { $set: {} };
    ['gender', 'strapMaterial', 'strapColor', 'dialColor', 'caseShape', 'displayType'].forEach(field => {
      if (p[field] && tMap[p[field]]) {
        update.$set[field] = tMap[p[field]];
        changed = true;
      }
    });
    if (changed) {
      await Product.collection.updateOne({_id: p._id}, update);
      count++;
    }
  }
  console.log(`Direct DB translation complete. Updated ${count} products.`);
  process.exit(0);
}).catch(console.error);
