const jwt = require('jsonwebtoken');
require('dotenv').config();

async function testCreateProduct() {
  const token = jwt.sign(
    {
      id: 7,
      role: 'SUPER_ADMIN',
      email: 'superadmin@pharmaerp.com',
      companyId: null,
      deviceId: null,
    },
    process.env.JWT_SECRET
  );

  try {
    const res = await fetch('http://localhost:5000/api/products', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        name: "Test Product",
        code: "TST-001",
        category: "Tablet",
      })
    });
    
    const data = await res.json();
    console.log("Status:", res.status);
    console.log("Response:", data);
  } catch (err) {
    console.error(err);
  }
}

testCreateProduct();
