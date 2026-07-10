const axios = require('axios');

const api = axios.create({
  baseURL: 'https://pharma-erp-pharma-backend.rrh5yv.easypanel.host/api',
});

async function main() {
  const credentialsList = [
    { username: 'admin', password: 'newpassword123' },
    { username: 'admin', password: 'admin123' },
    { username: 'priya', password: 'password123' },
  ];

  let token = null;
  let mrId = null;

  for (const cred of credentialsList) {
    try {
      console.log(`Trying login with: ${cred.username}`);
      const loginRes = await api.post('/auth/login', {
        email: cred.username === 'admin' ? 'admin@pharma.com' : cred.username,
        password: cred.password,
      });
      console.log('Login successful!');
      token = loginRes.data.token;
      mrId = loginRes.data.mr ? loginRes.data.mr.id : null;
      console.log('Token:', token);
      console.log('mrId:', mrId);
      break;
    } catch (e) {
      console.log(`Failed for ${cred.username}:`, e.message);
    }
  }

  if (!token) {
    console.log('Could not log in.');
    return;
  }

  console.log('Fetching tour plans...');
  try {
    const plansRes = await api.get(`/tour-plans/mr/${mrId || 1}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('Tour plans:', JSON.stringify(plansRes.data, null, 2));
  } catch (e) {
    console.log('Failed fetching tour plans:', e.message);
  }

  console.log('Fetching doctors...');
  try {
    const docsRes = await api.get('/doctors', {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('Doctors count:', docsRes.data.length || docsRes.data.data?.length);
    console.log('First doctor:', JSON.stringify(docsRes.data[0] || docsRes.data.data?.[0], null, 2));
  } catch (e) {
    console.log('Failed fetching doctors:', e.message);
  }
}

main();
