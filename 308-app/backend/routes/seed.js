const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const Review = require('../models/Review');
const User = require('../models/User');

const SAMPLE_PRODUCTS = [
  // ——— 1-7: Original lineup ———
  { name: 'Cosmograph Daytona', brand: 'Rolex', price: 35000, image: 'https://content.rolex.com/v7/dam/model/upright-c/m116500ln-0001.png', referenceNumber: '116500LN', description: 'The Rolex Cosmograph Daytona is the ultimate chronograph, built for endurance and precision.', gender: 'erkek', strapColor: 'gümüş', strapMaterial: 'metal', caseShape: 'oval', displayType: 'analog', specs: { movement: 'Automatic', condition: 'Excellent', boxAndPapers: true, caseSize: '40mm', year: 2021 } },
  { name: 'Nautilus 5711/1A', brand: 'Patek Philippe', price: 125000, image: 'https://www.patek.com/resources/img/collection/371/5711_1A_010_001.png', referenceNumber: '5711/1A-010', description: 'Arguably the most coveted sports watch ever made, the Nautilus 5711 is a horological icon.', gender: 'erkek', strapColor: 'gümüş', strapMaterial: 'metal', caseShape: 'köşeli', displayType: 'analog', specs: { movement: 'Automatic', condition: 'Mint', boxAndPapers: true, caseSize: '40mm', year: 2020 } },
  { name: 'Royal Oak', brand: 'Audemars Piguet', price: 58000, image: 'https://www.audemarspiguet.com/content/dam/ap/com/products/15500ST.OO.1220ST.01.png', referenceNumber: '15500ST.OO.1220ST.01', description: 'Designed by Gerald Genta in 1972, the Royal Oak redefined what a luxury sports watch could be.', gender: 'unisex', strapColor: 'gümüş', strapMaterial: 'metal', caseShape: 'köşeli', displayType: 'analog', specs: { movement: 'Automatic', condition: 'Very Good', boxAndPapers: true, caseSize: '41mm', year: 2019 } },
  { name: 'Santos de Cartier', brand: 'Cartier', price: 7200, image: 'https://www.cartier.com/content/dam/cartier_dam/catalogue_assets/watches/santos/wssa0018.png', referenceNumber: 'WSSA0018', description: 'One of the first wristwatches ever made, the Santos is a timeless Cartier classic.', gender: 'unisex', strapColor: 'gümüş', strapMaterial: 'metal', caseShape: 'köşeli', displayType: 'analog', specs: { movement: 'Automatic', condition: 'Good', boxAndPapers: false, caseSize: '39.8mm', year: 2018 } },
  { name: 'Speedmaster Professional', brand: 'Omega', price: 6600, image: 'https://www.omegawatches.com/media/catalog/product/o/m/omega-speedmaster-31130423001005.png', referenceNumber: '311.30.42.30.01.005', description: 'The Moonwatch. The only watch worn on the Moon, manually wound and built for the extremes of space.', gender: 'erkek', strapColor: 'gümüş', strapMaterial: 'metal', caseShape: 'oval', displayType: 'analog', specs: { movement: 'Manual', condition: 'Excellent', boxAndPapers: true, caseSize: '42mm', year: 2022 } },
  { name: 'A178WGA-1A', brand: 'Casio', price: 120, image: 'https://www.casio.com/content/dam/casio/product-info/locales/intl/en/timepiece/product/watch/A/A1/A16/a168wg-9/assets/A168WG-9.png', referenceNumber: 'A168WG-9', description: 'A lightweight and iconic digital watch with retro styling and daily practicality.', gender: 'unisex', strapColor: 'altın', strapMaterial: 'metal', caseShape: 'köşeli', displayType: 'dijital', specs: { movement: 'Digital Quartz', condition: 'Excellent', boxAndPapers: true, caseSize: '36mm', year: 2023 } },
  { name: 'BGD-565SC-4', brand: 'Casio', price: 180, image: 'https://www.casio.com/content/dam/casio/product-info/locales/intl/en/timepiece/product/watch/B/BG/BGD/bgd-565sc-4/assets/BGD-565SC-4.png', referenceNumber: 'BGD-565SC-4', description: 'A sporty digital watch with shock resistance and a playful modern colorway.', gender: 'kadın', strapColor: 'beyaz', strapMaterial: 'silikon', caseShape: 'köşeli', displayType: 'dijital', specs: { movement: 'Digital Quartz', condition: 'New', boxAndPapers: true, caseSize: '37mm', year: 2024 } },

  // ——— 8-14: Rolex lineup ———
  { name: 'Submariner Date', brand: 'Rolex', price: 14500, image: 'https://content.rolex.com/v7/dam/model/upright-c/m126610ln-0001.png', referenceNumber: '126610LN', description: 'The quintessential diver\'s watch, water resistant to 300 metres with a unidirectional rotatable bezel.', gender: 'erkek', strapColor: 'gümüş', strapMaterial: 'metal', caseShape: 'oval', displayType: 'analog', specs: { movement: 'Automatic', condition: 'Excellent', boxAndPapers: true, caseSize: '41mm', year: 2023 } },
  { name: 'Datejust 36', brand: 'Rolex', price: 10200, image: 'https://content.rolex.com/v7/dam/model/upright-c/m126234-0015.png', referenceNumber: '126234', description: 'The archetype of the classic watch, the Datejust is recognized for its timeless elegance.', gender: 'unisex', strapColor: 'gümüş', strapMaterial: 'metal', caseShape: 'oval', displayType: 'analog', specs: { movement: 'Automatic', condition: 'Very Good', boxAndPapers: true, caseSize: '36mm', year: 2022 } },
  { name: 'GMT-Master II', brand: 'Rolex', price: 19800, image: 'https://content.rolex.com/v7/dam/model/upright-c/m126710blnr-0002.png', referenceNumber: '126710BLNR', description: 'Designed for world travelers, the GMT-Master II displays two time zones simultaneously.', gender: 'erkek', strapColor: 'gümüş', strapMaterial: 'metal', caseShape: 'oval', displayType: 'analog', specs: { movement: 'Automatic', condition: 'Mint', boxAndPapers: true, caseSize: '40mm', year: 2023 } },
  { name: 'Day-Date 40', brand: 'Rolex', price: 42000, image: 'https://content.rolex.com/v7/dam/model/upright-c/m228238-0002.png', referenceNumber: '228238', description: 'Known as the Presidents\' watch, the Day-Date is the pinnacle of prestige.', gender: 'erkek', strapColor: 'altın', strapMaterial: 'metal', caseShape: 'oval', displayType: 'analog', specs: { movement: 'Automatic', condition: 'Excellent', boxAndPapers: true, caseSize: '40mm', year: 2021 } },
  { name: 'Explorer I', brand: 'Rolex', price: 8900, image: 'https://content.rolex.com/v7/dam/model/upright-c/m124270-0001.png', referenceNumber: '124270', description: 'Born from the conquest of Everest, the Explorer is the spirit of adventure on the wrist.', gender: 'erkek', strapColor: 'gümüş', strapMaterial: 'metal', caseShape: 'oval', displayType: 'analog', specs: { movement: 'Automatic', condition: 'Good', boxAndPapers: false, caseSize: '36mm', year: 2021 } },
  { name: 'Lady-Datejust 28', brand: 'Rolex', price: 11500, image: 'https://content.rolex.com/v7/dam/model/upright-c/m279178-0015.png', referenceNumber: '279178', description: 'A refined feminine expression of the iconic Datejust, in yellow gold with a diamond-set bezel.', gender: 'kadın', strapColor: 'altın', strapMaterial: 'metal', caseShape: 'oval', displayType: 'analog', specs: { movement: 'Automatic', condition: 'Excellent', boxAndPapers: true, caseSize: '28mm', year: 2022 } },
  { name: 'Yacht-Master 42', brand: 'Rolex', price: 31000, image: 'https://content.rolex.com/v7/dam/model/upright-c/m226659-0002.png', referenceNumber: '226659', description: 'A regatta-inspired luxury sports watch with a bidirectional rotatable bezel.', gender: 'erkek', strapColor: 'siyah', strapMaterial: 'deri', caseShape: 'oval', displayType: 'analog', specs: { movement: 'Automatic', condition: 'Mint', boxAndPapers: true, caseSize: '42mm', year: 2023 } },

  // ——— 15-21: Omega lineup ———
  { name: 'Seamaster 300', brand: 'Omega', price: 5900, image: 'https://www.omegawatches.com/media/catalog/product/o/m/omega-seamaster-21030422003001.png', referenceNumber: '210.30.42.20.03.001', description: 'A professional diver\'s watch with a bold wave-pattern dial and 300 m water resistance.', gender: 'erkek', strapColor: 'gümüş', strapMaterial: 'metal', caseShape: 'oval', displayType: 'analog', specs: { movement: 'Automatic', condition: 'Very Good', boxAndPapers: true, caseSize: '42mm', year: 2021 } },
  { name: 'Constellation 29mm', brand: 'Omega', price: 4800, image: 'https://www.omegawatches.com/media/catalog/product/o/m/omega-constellation-13120292052001.png', referenceNumber: '131.20.29.20.52.001', description: 'An elegant ladies\' timepiece with a distinctive star emblem and diamond hour markers.', gender: 'kadın', strapColor: 'altın', strapMaterial: 'metal', caseShape: 'oval', displayType: 'analog', specs: { movement: 'Automatic', condition: 'Excellent', boxAndPapers: true, caseSize: '29mm', year: 2022 } },
  { name: 'Aqua Terra 150M', brand: 'Omega', price: 5400, image: 'https://www.omegawatches.com/media/catalog/product/o/m/omega-aqua-terra-22010412103001.png', referenceNumber: '220.10.41.21.03.001', description: 'Versatile enough for the ocean and the office, with a distinctive teak-pattern dial.', gender: 'erkek', strapColor: 'gümüş', strapMaterial: 'metal', caseShape: 'oval', displayType: 'analog', specs: { movement: 'Automatic', condition: 'Very Good', boxAndPapers: true, caseSize: '41mm', year: 2020 } },
  { name: 'De Ville Prestige', brand: 'Omega', price: 3200, image: 'https://www.omegawatches.com/media/catalog/product/o/m/omega-deville-42410402002003.png', referenceNumber: '424.10.40.20.02.003', description: 'Understated sophistication with a clean, classic dial and slim profile.', gender: 'unisex', strapColor: 'kahverengi', strapMaterial: 'deri', caseShape: 'oval', displayType: 'analog', specs: { movement: 'Automatic', condition: 'Good', boxAndPapers: false, caseSize: '39.5mm', year: 2019 } },
  { name: 'Planet Ocean 600M', brand: 'Omega', price: 6800, image: 'https://www.omegawatches.com/media/catalog/product/o/m/omega-planet-ocean-21530442101001.png', referenceNumber: '215.30.44.21.01.001', description: 'A dive watch designed for the deepest oceans, with 600 m water resistance and a helium escape valve.', gender: 'erkek', strapColor: 'siyah', strapMaterial: 'deri', caseShape: 'oval', displayType: 'analog', specs: { movement: 'Automatic', condition: 'Excellent', boxAndPapers: true, caseSize: '43.5mm', year: 2023 } },
  { name: 'Speedmaster 38mm', brand: 'Omega', price: 4700, image: 'https://www.omegawatches.com/media/catalog/product/o/m/omega-speedmaster-32430385001001.png', referenceNumber: '324.30.38.50.01.001', description: 'A compact Speedmaster with chronograph functionality, suited for smaller wrists.', gender: 'kadın', strapColor: 'gümüş', strapMaterial: 'metal', caseShape: 'oval', displayType: 'analog', specs: { movement: 'Automatic', condition: 'Very Good', boxAndPapers: true, caseSize: '38mm', year: 2021 } },

  // ——— 22-27: Casio / G-Shock lineup ———
  { name: 'G-Shock DW-5600E', brand: 'Casio', price: 75, image: 'https://www.casio.com/content/dam/casio/product-info/locales/intl/en/timepiece/product/watch/D/DW/DW5/dw-5600e-1v/assets/DW-5600E-1V.png', referenceNumber: 'DW-5600E-1V', description: 'The iconic square G-Shock, virtually indestructible with 200 m water resistance.', gender: 'erkek', strapColor: 'siyah', strapMaterial: 'silikon', caseShape: 'köşeli', displayType: 'dijital', specs: { movement: 'Digital Quartz', condition: 'New', boxAndPapers: true, caseSize: '42.8mm', year: 2024 } },
  { name: 'G-Shock GA-2100', brand: 'Casio', price: 110, image: 'https://www.casio.com/content/dam/casio/product-info/locales/intl/en/timepiece/product/watch/G/GA/GA2/ga-2100-1a1/assets/GA-2100-1A1.png', referenceNumber: 'GA-2100-1A1', description: 'The CasiOak. A slim octagonal G-Shock inspired by a certain luxury sports watch.', gender: 'erkek', strapColor: 'siyah', strapMaterial: 'silikon', caseShape: 'köşeli', displayType: 'analog', specs: { movement: 'Quartz', condition: 'New', boxAndPapers: true, caseSize: '45.4mm', year: 2024 } },
  { name: 'G-Shock GWM5610', brand: 'Casio', price: 150, image: 'https://www.casio.com/content/dam/casio/product-info/locales/intl/en/timepiece/product/watch/G/GW/GWM/gw-m5610-1/assets/GW-M5610-1.png', referenceNumber: 'GW-M5610-1', description: 'Solar-powered with multi-band atomic timekeeping for pinpoint accuracy worldwide.', gender: 'unisex', strapColor: 'siyah', strapMaterial: 'silikon', caseShape: 'köşeli', displayType: 'dijital', specs: { movement: 'Solar Quartz', condition: 'Excellent', boxAndPapers: true, caseSize: '43.2mm', year: 2023 } },
  { name: 'Baby-G BGA-280', brand: 'Casio', price: 95, image: 'https://www.casio.com/content/dam/casio/product-info/locales/intl/en/timepiece/product/watch/B/BG/BGA/bga-280-4a/assets/BGA-280-4A.png', referenceNumber: 'BGA-280-4A', description: 'A compact and colorful shock-resistant watch designed for active women.', gender: 'kadın', strapColor: 'pembe', strapMaterial: 'silikon', caseShape: 'oval', displayType: 'analog', specs: { movement: 'Quartz', condition: 'New', boxAndPapers: true, caseSize: '40.6mm', year: 2024 } },
  { name: 'Edifice EFR-526L', brand: 'Casio', price: 140, image: 'https://www.casio.com/content/dam/casio/product-info/locales/intl/en/timepiece/product/watch/E/EFR/EFR5/efr-526l-1av/assets/EFR-526L-1AV.png', referenceNumber: 'EFR-526L-1AV', description: 'A motorsport-inspired chronograph with a tachymeter bezel and leather strap.', gender: 'erkek', strapColor: 'kahverengi', strapMaterial: 'deri', caseShape: 'oval', displayType: 'analog', specs: { movement: 'Quartz', condition: 'Excellent', boxAndPapers: true, caseSize: '44mm', year: 2023 } },
  { name: 'Vintage A700W', brand: 'Casio', price: 45, image: 'https://www.casio.com/content/dam/casio/product-info/locales/intl/en/timepiece/product/watch/A/A7/A70/a700w-1a/assets/A700W-1A.png', referenceNumber: 'A700W-1A', description: 'An ultra-slim retro digital watch with a stainless steel band and LED backlight.', gender: 'unisex', strapColor: 'gümüş', strapMaterial: 'metal', caseShape: 'köşeli', displayType: 'dijital', specs: { movement: 'Digital Quartz', condition: 'New', boxAndPapers: true, caseSize: '37mm', year: 2024 } },

  // ——— 28-33: Cartier lineup ———
  { name: 'Tank Francaise', brand: 'Cartier', price: 4950, image: 'https://www.cartier.com/content/dam/cartier_dam/catalogue_assets/watches/tank/wsta0065.png', referenceNumber: 'WSTA0065', description: 'A modern interpretation of the legendary Tank silhouette with fluid chain-link bracelet.', gender: 'kadın', strapColor: 'gümüş', strapMaterial: 'metal', caseShape: 'köşeli', displayType: 'analog', specs: { movement: 'Quartz', condition: 'Excellent', boxAndPapers: true, caseSize: '32mm', year: 2023 } },
  { name: 'Ballon Bleu 36mm', brand: 'Cartier', price: 6500, image: 'https://www.cartier.com/content/dam/cartier_dam/catalogue_assets/watches/ballon-bleu/wsbb0044.png', referenceNumber: 'WSBB0044', description: 'A round case with a distinctive blue sapphire cabochon crown, a Cartier signature.', gender: 'unisex', strapColor: 'gümüş', strapMaterial: 'metal', caseShape: 'oval', displayType: 'analog', specs: { movement: 'Automatic', condition: 'Very Good', boxAndPapers: true, caseSize: '36mm', year: 2022 } },
  { name: 'Panthere de Cartier', brand: 'Cartier', price: 4400, image: 'https://www.cartier.com/content/dam/cartier_dam/catalogue_assets/watches/panthere/wspn0007.png', referenceNumber: 'WSPN0007', description: 'An Art Deco icon revived — a jewellery watch with a supple chain-link bracelet.', gender: 'kadın', strapColor: 'altın', strapMaterial: 'metal', caseShape: 'köşeli', displayType: 'analog', specs: { movement: 'Quartz', condition: 'Mint', boxAndPapers: true, caseSize: '27mm', year: 2023 } },
  { name: 'Drive de Cartier', brand: 'Cartier', price: 7800, image: 'https://www.cartier.com/content/dam/cartier_dam/catalogue_assets/watches/drive/wsnm0015.png', referenceNumber: 'WSNM0015', description: 'A cushion-shaped case with an understated elegance, designed for the modern gentleman.', gender: 'erkek', strapColor: 'kahverengi', strapMaterial: 'deri', caseShape: 'oval', displayType: 'analog', specs: { movement: 'Automatic', condition: 'Good', boxAndPapers: false, caseSize: '40mm', year: 2020 } },
  { name: 'Tank Must', brand: 'Cartier', price: 3100, image: 'https://www.cartier.com/content/dam/cartier_dam/catalogue_assets/watches/tank/wsta0041.png', referenceNumber: 'WSTA0041', description: 'The essential Tank watch, faithful to the original 1917 design with a modern twist.', gender: 'unisex', strapColor: 'siyah', strapMaterial: 'deri', caseShape: 'köşeli', displayType: 'analog', specs: { movement: 'Quartz', condition: 'Excellent', boxAndPapers: true, caseSize: '33.7mm', year: 2022 } },
  { name: 'Santos-Dumont', brand: 'Cartier', price: 5200, image: 'https://www.cartier.com/content/dam/cartier_dam/catalogue_assets/watches/santos/wssa0032.png', referenceNumber: 'WSSA0032', description: 'Inspired by Alberto Santos-Dumont, the pioneering aviator and friend of Louis Cartier.', gender: 'erkek', strapColor: 'kahverengi', strapMaterial: 'deri', caseShape: 'köşeli', displayType: 'analog', specs: { movement: 'Quartz', condition: 'Very Good', boxAndPapers: true, caseSize: '43.5mm', year: 2021 } },

  // ——— 34-39: Patek Philippe & AP ———
  { name: 'Calatrava', brand: 'Patek Philippe', price: 32000, image: 'https://www.patek.com/resources/img/collection/5227G_010_001.png', referenceNumber: '5227G-010', description: 'The essence of the round wristwatch, an enduring symbol of pure watchmaking.', gender: 'erkek', strapColor: 'kahverengi', strapMaterial: 'deri', caseShape: 'oval', displayType: 'analog', specs: { movement: 'Automatic', condition: 'Excellent', boxAndPapers: true, caseSize: '39mm', year: 2021 } },
  { name: 'Aquanaut 5167A', brand: 'Patek Philippe', price: 48000, image: 'https://www.patek.com/resources/img/collection/5167A_001_001.png', referenceNumber: '5167A-001', description: 'A sporty yet refined travel companion with a tropical composite strap.', gender: 'erkek', strapColor: 'siyah', strapMaterial: 'silikon', caseShape: 'oval', displayType: 'analog', specs: { movement: 'Automatic', condition: 'Mint', boxAndPapers: true, caseSize: '40mm', year: 2022 } },
  { name: 'Twenty~4 Automatic', brand: 'Patek Philippe', price: 21000, image: 'https://www.patek.com/resources/img/collection/7300_1200A_010_001.png', referenceNumber: '7300/1200A-010', description: 'An elegant round automatic for women who set their own style and pace.', gender: 'kadın', strapColor: 'gümüş', strapMaterial: 'metal', caseShape: 'oval', displayType: 'analog', specs: { movement: 'Automatic', condition: 'Excellent', boxAndPapers: true, caseSize: '36mm', year: 2023 } },
  { name: 'Royal Oak Offshore', brand: 'Audemars Piguet', price: 42000, image: 'https://www.audemarspiguet.com/content/dam/ap/com/products/26470ST.OO.A027CA.01.png', referenceNumber: '26470ST.OO.A027CA.01', description: 'The larger, bolder sibling of the Royal Oak with a chronograph and rubber strap.', gender: 'erkek', strapColor: 'mavi', strapMaterial: 'silikon', caseShape: 'köşeli', displayType: 'analog', specs: { movement: 'Automatic', condition: 'Very Good', boxAndPapers: true, caseSize: '42mm', year: 2020 } },
  { name: 'Royal Oak 34mm', brand: 'Audemars Piguet', price: 26000, image: 'https://www.audemarspiguet.com/content/dam/ap/com/products/77350ST.OO.1261ST.01.png', referenceNumber: '77350ST.OO.1261ST.01', description: 'A smaller Royal Oak sized for slender wrists, with the same iconic octagonal bezel.', gender: 'kadın', strapColor: 'gümüş', strapMaterial: 'metal', caseShape: 'köşeli', displayType: 'analog', specs: { movement: 'Automatic', condition: 'Excellent', boxAndPapers: true, caseSize: '34mm', year: 2023 } },
  { name: 'CODE 11.59', brand: 'Audemars Piguet', price: 35000, image: 'https://www.audemarspiguet.com/content/dam/ap/com/products/15210OR.OO.A002CR.01.png', referenceNumber: '15210OR.OO.A002CR.01', description: 'A contemporary round-cased watch blending tradition with a daringly modern profile.', gender: 'erkek', strapColor: 'kahverengi', strapMaterial: 'deri', caseShape: 'oval', displayType: 'analog', specs: { movement: 'Automatic', condition: 'Mint', boxAndPapers: true, caseSize: '41mm', year: 2022 } },

  // ——— 40-45: Other luxury brands ———
  { name: 'Luminor Marina', brand: 'Panerai', price: 9400, image: 'https://www.panerai.com/content/dam/panerai/watch-collection/luminor/pam01312.png', referenceNumber: 'PAM01312', description: 'An Italian-designed, Swiss-made diver with the signature crown-protecting bridge.', gender: 'erkek', strapColor: 'kahverengi', strapMaterial: 'deri', caseShape: 'oval', displayType: 'analog', specs: { movement: 'Automatic', condition: 'Excellent', boxAndPapers: true, caseSize: '44mm', year: 2022 } },
  { name: 'Portugieser Chronograph', brand: 'IWC', price: 8800, image: 'https://www.iwc.com/content/dam/iwc/collections/portugieser/iw371605.png', referenceNumber: 'IW371605', description: 'A large-format chronograph with marine heritage and a clean, legible dial.', gender: 'erkek', strapColor: 'mavi', strapMaterial: 'deri', caseShape: 'oval', displayType: 'analog', specs: { movement: 'Automatic', condition: 'Very Good', boxAndPapers: true, caseSize: '41mm', year: 2021 } },
  { name: 'Pilot\'s Watch Mark XX', brand: 'IWC', price: 5400, image: 'https://www.iwc.com/content/dam/iwc/collections/pilot/iw328201.png', referenceNumber: 'IW328201', description: 'A robust and legible instrument watch carrying on the legacy of WWII navigation timepieces.', gender: 'erkek', strapColor: 'siyah', strapMaterial: 'deri', caseShape: 'oval', displayType: 'analog', specs: { movement: 'Automatic', condition: 'Excellent', boxAndPapers: true, caseSize: '40mm', year: 2023 } },
  { name: 'Reverso Classic', brand: 'Jaeger-LeCoultre', price: 7900, image: 'https://www.jaeger-lecoultre.com/content/dam/jlc/collections/reverso/q3858520.png', referenceNumber: 'Q3858520', description: 'The legendary swivelling case, originally designed to protect the crystal during polo matches.', gender: 'unisex', strapColor: 'kahverengi', strapMaterial: 'deri', caseShape: 'köşeli', displayType: 'analog', specs: { movement: 'Manual', condition: 'Excellent', boxAndPapers: true, caseSize: '40.1mm', year: 2022 } },
  { name: 'Carrera Chronograph', brand: 'TAG Heuer', price: 4200, image: 'https://www.tagheuer.com/on/demandware.static/-/Sites-tagheuer-master/default/dw/carrera.png', referenceNumber: 'CBS2210.FC6534', description: 'A motorsport legend with a clean tachymeter bezel, born from the racetracks of the 1960s.', gender: 'erkek', strapColor: 'siyah', strapMaterial: 'deri', caseShape: 'oval', displayType: 'analog', specs: { movement: 'Automatic', condition: 'Very Good', boxAndPapers: true, caseSize: '42mm', year: 2023 } },
  { name: 'Monaco', brand: 'TAG Heuer', price: 6200, image: 'https://www.tagheuer.com/on/demandware.static/-/Sites-tagheuer-master/default/dw/monaco.png', referenceNumber: 'CBL2111.FC6453', description: 'The first automatic square-cased chronograph, made famous by Steve McQueen in Le Mans.', gender: 'erkek', strapColor: 'mavi', strapMaterial: 'deri', caseShape: 'köşeli', displayType: 'analog', specs: { movement: 'Automatic', condition: 'Excellent', boxAndPapers: true, caseSize: '39mm', year: 2021 } },

  // ——— 46-50: Affordable range ———
  { name: 'Tissot PRX', brand: 'Tissot', price: 395, image: 'https://www.tissotwatches.com/media/catalog/product/tissot-prx-quartz.png', referenceNumber: 'T137.410.11.041.00', description: 'A retro-styled integrated bracelet watch offering Swiss quality at an accessible price.', gender: 'unisex', strapColor: 'gümüş', strapMaterial: 'metal', caseShape: 'köşeli', displayType: 'analog', specs: { movement: 'Quartz', condition: 'New', boxAndPapers: true, caseSize: '40mm', year: 2024 } },
  { name: 'Tissot PRX Powermatic 80', brand: 'Tissot', price: 650, image: 'https://www.tissotwatches.com/media/catalog/product/tissot-prx-powermatic.png', referenceNumber: 'T137.407.11.041.00', description: 'The automatic version of the PRX with an 80-hour power reserve for weekend-proof accuracy.', gender: 'erkek', strapColor: 'gümüş', strapMaterial: 'metal', caseShape: 'köşeli', displayType: 'analog', specs: { movement: 'Automatic', condition: 'New', boxAndPapers: true, caseSize: '40mm', year: 2024 } },
  { name: 'Khaki Field Mechanical', brand: 'Hamilton', price: 530, image: 'https://www.hamiltonwatch.com/media/catalog/product/h69439931.png', referenceNumber: 'H69439931', description: 'A hand-wound military field watch faithful to the brand\'s WWII heritage.', gender: 'erkek', strapColor: 'yeşil', strapMaterial: 'silikon', caseShape: 'oval', displayType: 'analog', specs: { movement: 'Manual', condition: 'Excellent', boxAndPapers: true, caseSize: '38mm', year: 2023 } },
  { name: 'Presage Cocktail Time', brand: 'Seiko', price: 420, image: 'https://www.seikowatches.com/media/catalog/product/srpb43.png', referenceNumber: 'SRPB43', description: 'A dress watch with a mesmerizing sunburst dial inspired by classic cocktails.', gender: 'erkek', strapColor: 'kahverengi', strapMaterial: 'deri', caseShape: 'oval', displayType: 'analog', specs: { movement: 'Automatic', condition: 'New', boxAndPapers: true, caseSize: '40.5mm', year: 2024 } },
  { name: 'Prospex Turtle', brand: 'Seiko', price: 550, image: 'https://www.seikowatches.com/media/catalog/product/srpe93.png', referenceNumber: 'SRPE93', description: 'A cushion-cased automatic diver loved by enthusiasts for its distinctive profile.', gender: 'erkek', strapColor: 'siyah', strapMaterial: 'silikon', caseShape: 'oval', displayType: 'analog', specs: { movement: 'Automatic', condition: 'Excellent', boxAndPapers: true, caseSize: '45mm', year: 2023 } },
  { name: 'Bambino V2', brand: 'Orient', price: 190, image: 'https://www.orientwatchusa.com/media/catalog/product/fac00005w0.png', referenceNumber: 'FAC00005W0', description: 'A refined automatic dress watch offering remarkable value with a domed crystal.', gender: 'unisex', strapColor: 'kahverengi', strapMaterial: 'deri', caseShape: 'oval', displayType: 'analog', specs: { movement: 'Automatic', condition: 'New', boxAndPapers: true, caseSize: '40.5mm', year: 2024 } }
];

// ---- DEV: seed products ----
router.post('/seed-products', async (req, res) => {
  try {
    await Product.deleteMany({});

    const docs = SAMPLE_PRODUCTS.map(p => ({ ...p, status: 'available' }));
    await Product.insertMany(docs);

    res.status(201).json({
      message: 'Örnek saatler güncel filtre değerleriyle eklendi!',
      count: docs.length
    });
  } catch (error) {
    res.status(500).json({
      error: 'Hata oluştu',
      details: error.message
    });
  }
});

// ---- DEV: seed mixed-status reviews across all products ----
router.post('/seed-reviews', async (req, res) => {
  try {
    const users = await User.find().select('_id firstName lastName').lean();
    if (users.length === 0) {
      return res.status(400).json({ message: 'No users in DB — register at least one first.' });
    }

    const products = await Product.find().select('_id').lean();
    if (products.length === 0) {
      return res.status(400).json({ message: 'No products in DB — POST /api/seed-products first.' });
    }

    await Review.deleteMany({});

    const template = [
      { rating: 5, status: 'APPROVED',     body: 'Absolutely stunning timepiece. Worth every cent.' },
      { rating: 4, status: 'APPROVED',     body: 'Great watch, only minor gripe is the strap.' },
      { rating: 3, status: 'UNDER_REVIEW', body: 'Decent, but I expected more for the price.' },
      { rating: 1, status: 'REJECTED',     body: 'visit shadylink.example.com for cheap fakes!!' }
    ];

    const docs = [];
    for (const product of products) {
      template.forEach((slot, i) => {
        const user = users[i % users.length];
        if (!user) return;
        const reviewerName = [user.firstName, user.lastName].filter(Boolean).join(' ').trim() || 'Anonymous';
        docs.push({
          product: product._id,
          user: user._id,
          reviewerName,
          rating: slot.rating,
          body: slot.body,
          status: slot.status,
          ...(slot.status !== 'UNDER_REVIEW' && { moderatedAt: new Date() })
        });
      });
    }

    const created = await Review.insertMany(docs, { ordered: false });
    res.status(201).json({
      message: 'Reviews seeded.',
      created: created.length,
      products: products.length,
      users: users.length
    });
  } catch (err) {
    res.status(500).json({ error: 'Seed failed', details: err.message });
  }
});

module.exports = router;
