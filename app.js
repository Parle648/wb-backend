const express = require('express');
const { Pool } = require('pg');
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true}))

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

const pool = new Pool({
  user: 'moral503',
  password: 'hG0rwDrm5KbOVGgM2yZyPagsPb3IQTQX',
  host: 'dpg-cmduaa6d3nmc73dn5bqg-a.oregon-postgres.render.com',
  port: '5432',
  database: 'lover_flower',
  ssl: {
    rejectUnauthorized: false,
  },
});

pool.connect()
  .then(() => {
    console.log('Connected to the database');
    
  })
  .catch((err) => {
    console.error('Error connecting to the database', err);
  });

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

app.get('/', async (req, res) => {
  res.status(200).json({ result: 'all ok' });
});

// products get

app.get('/api/products/pages/:page', async (req, res) => {
  const {page} = req.params;

  try {
    const result = await pool.query('SELECT * FROM world_bike_product');

    res.json(result.rows.filter((prod) => prod.id >= (page[1]*10-10) && prod.id <= (page[1]*10-2)));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/products/:id', async (req, res) => {
  try {
    const {id} = req.params;
    const result = await pool.query(`SELECT * FROM world_bike_product WHERE id = ${id.slice(1)}`);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/product-properties/:productid', async (req, res) => {
  try {
    const {productid} = req.params;
    const result = await pool.query(`SELECT * FROM world_bike_properties WHERE prodct_id = ${productid.slice(1)}`);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// filters

app.get('/api/products/from-little', async (req, res) => {
  try {
    const result = await (await pool.query('SELECT * FROM world_bike_product')).rows;
    res.json(result.sort((a, b) => a.cost - b.cost));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/products/from-biggest', async (req, res) => {
  try {
    const result = await (await pool.query('SELECT * FROM world_bike_product')).rows;
    res.json(result.sort((a, b) => b.cost - a.cost));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/getproducts/filters', async (req, res) => {
  try {
    const {filters} = req.query;
    const {has, categories, cost, brands, frame_materials} = JSON.parse(filters);

    const categoriesString = categories.length > 0 ? categories.map(str => `'${str}'`).join(', ') : "'triatlon', 'twise_suspension', 'bmx', 'single_suspension', 'single_speed', 'gravy', 'mountain', 'city', 'road_bike'"
    const brandsString = brands.length > 0 ? brands.map(str => `'${str}'`).join(', ') : "'look', 'trek', 'orbea', 'black','scott'"
    const frameMaterialsString = frame_materials.length > 0 ? frame_materials.map(str => `'${str}'`).join(', ') : "'Aluminium', 'Carbon Fiber', 'Steel', 'Titanium'"
    const hasString = has ? `AND world_bike_product.in_stock=${!has}` : ''

    const result = await (await pool.query(`
      SELECT * FROM world_bike_product
      JOIN world_bike_type ON world_bike_product.id = world_bike_type.prodct_id
      JOIN world_bike_brand ON world_bike_product.id = world_bike_brand.prodct_id
      JOIN world_bike_properties ON world_bike_product.id = world_bike_properties.prodct_id
      WHERE world_bike_type.byke_type IN (${categoriesString})
      ${hasString}
      AND world_bike_product.cost >= ${cost.from}
      AND world_bike_product.cost <= ${cost.to}
      AND world_bike_brand.brand_name IN(${brandsString})
      AND world_bike_properties.frame_material IN(${frameMaterialsString})
      `)).rows;

    res.status(201).json({ data: JSON.stringify(result) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// post requests

app.post('/api/mail', async (req, res) => {
  try {
    const {mail, agree} = req.body;

    const query = {
      text: 'INSERT INTO Products (mail, treatment_data) VALUES ($1, $2)',
      values: [mail, agree],
    };
    await pool.query(`INSERT INTO world_bike_mail_letters (email, agree) VALUES ('${mail}', ${agree})`);
    res.status(201).json({ message: 'Product created successfully' });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/order', async (req, res) => {
  try {
    const { name,	surname,	city,	street,	house,	appartment,	phone_number,	email,	order_comment,	delivery_type,	payment_type,	choosed_products} = req.body;

    await pool.query(`INSERT INTO world_bike_orders ( name,	surname,	city,	street,	house,	appartment,	phone_number,	email,	order_comment,	delivery_type,	payment_type,	choosed_products) VALUES ('${name}',	'${surname}',	'${city}',	'${street}',	'${house}',	'${appartment}',	'${phone_number}',	'${email}',	'${order_comment}',	'${delivery_type}',	'${payment_type}',	'${choosed_products}')`);
    res.status(201).json({ message: 'Product created successfully' });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// fetch('http://localhost:3001/api/order', {
// 	method: 'POST',
// 	headers: {
// 		'Content-Type': 'application/json',
// 	},
// 	body: JSON.stringify({
// 		name: 'sad',	surname: 'asd',	city: 'asd',	street: 'asd',	house: 'asd',	appartment: 'asd',	phone_number: 'asd',	email: 'asd',	order_comment: 'asd',	delivery_type: 'asd',	payment_type: 'asd',	choosed_products: 'asd'
// 	}),
// })

app.post('/api/mail', async (req, res) => {
  try {
    const {mail, agree} = req.body;

    console.log(`INSERT INTO world_bike_mail_letters (email, agree) VALUES ('${mail}', ${agree})`);
    const query = {
      text: 'INSERT INTO Products (mail, treatment_data) VALUES ($1, $2)',
      values: [mail, agree],
    };
    await pool.query(`INSERT INTO world_bike_mail_letters (email, agree) VALUES ('${mail}', ${agree})`);
    res.status(201).json({ message: 'Product created successfully' });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});