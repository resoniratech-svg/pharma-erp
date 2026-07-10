const jwt = require('jsonwebtoken');
require('dotenv').config();

const token = jwt.sign(
    {
      id: 7,
      role: 'SUPER_ADMIN',
      email: 'superadmin@pharmaerp.com',
      companyId: null,
      deviceId: null,
    },
    process.env.JWT_SECRET || 'secret' // Assuming we don't have the env file, we will fetch it
  );
console.log(token);
