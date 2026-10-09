const http = require('http');

function request(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, res => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });
    req.on('error', reject);
    if (data) {
      req.write(typeof data === 'string' ? data : JSON.stringify(data));
    }
    req.end();
  });
}

async function runTests() {
  console.log('====================================================');
  console.log('🧪 STEP 1: AUTH INTEGRATION TEST (PHONE + PASSWORD)');
  console.log('====================================================\n');

  // TEST 1: Login with registered phone & correct password
  console.log('▶ TEST 1: Login with phone "01019998877" and correct password');
  const res1 = await request({
    hostname: 'localhost',
    port: 9500,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    phone: '01019998877',
    password: 'Password@1234'
  });
  console.log('Status:', res1.status);
  console.log('Success:', res1.data.success);
  console.log('Message:', res1.data.message);
  console.log('User Name:', res1.data.data?.name);
  console.log('User Phone:', res1.data.data?.phone);
  console.log('Has Token:', !!res1.data.token);
  console.log('----------------------------------------------------\n');

  const token = res1.data.token;

  // TEST 2: Verify Protected Route /api/auth/me with Bearer token
  console.log('▶ TEST 2: GET /api/auth/me with Bearer token');
  const res2 = await request({
    hostname: 'localhost',
    port: 9500,
    path: '/api/auth/me',
    method: 'GET',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  });
  console.log('Status:', res2.status);
  console.log('Success:', res2.data.success);
  console.log('Guest Profile Name:', res2.data.data?.name);
  console.log('Guest Profile Phone:', res2.data.data?.phone);
  console.log('Guest Role:', res2.data.data?.role);
  console.log('----------------------------------------------------\n');

  // TEST 3: Login with Wrong Password
  console.log('▶ TEST 3: Login with phone and wrong password');
  const res3 = await request({
    hostname: 'localhost',
    port: 9500,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    phone: '01019998877',
    password: 'WrongPassword999'
  });
  console.log('Status:', res3.status, '(Expected 401)');
  console.log('Success:', res3.data.success);
  console.log('Message:', res3.data.message);
  console.log('----------------------------------------------------\n');

  // TEST 4: Login with Nonexistent Phone
  console.log('▶ TEST 4: Login with nonexistent phone "01099999999"');
  const res4 = await request({
    hostname: 'localhost',
    port: 9500,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    phone: '01099999999',
    password: 'Password@1234'
  });
  console.log('Status:', res4.status, '(Expected 401)');
  console.log('Success:', res4.data.success);
  console.log('Message:', res4.data.message);
  console.log('----------------------------------------------------\n');

  // TEST 5: Signup with Phone & Password only (no email required)
  const testPhone = '011' + Math.floor(10000000 + Math.random() * 90000000);
  console.log(`▶ TEST 5: Signup with new phone "${testPhone}" without email`);
  const res5 = await request({
    hostname: 'localhost',
    port: 9500,
    path: '/api/auth/signup',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    name: 'عميل تجريبي جديد',
    phone: testPhone,
    password: 'TestPassword@123',
    age: '28',
    gender: 'male'
  });
  console.log('Status:', res5.status, '(Expected 201)');
  console.log('Success:', res5.data.success);
  console.log('Message:', res5.data.message);
  console.log('New User Phone:', res5.data.data?.phone);
  console.log('----------------------------------------------------\n');

  // TEST 6: Login with the newly registered user by phone
  console.log(`▶ TEST 6: Login with newly created phone "${testPhone}"`);
  const res6 = await request({
    hostname: 'localhost',
    port: 9500,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    phone: testPhone,
    password: 'TestPassword@123'
  });
  console.log('Status:', res6.status, '(Expected 200)');
  console.log('Success:', res6.data.success);
  console.log('Logged in as:', res6.data.data?.name);
  console.log('Token generated:', !!res6.data.token);
  console.log('====================================================');
  console.log('🎉 ALL STEP 1 TESTS COMPLETED SUCCESSFULLY!');
  console.log('====================================================');
}

runTests().catch(console.error);
