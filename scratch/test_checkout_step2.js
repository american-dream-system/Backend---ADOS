const fs = require('fs');
const path = require('path');

async function runStep2CheckoutTests() {
  console.log('================================================================');
  console.log('🧪 RUNNING STEP 2: CART & PASSES CHECKOUT INTEGRATION TEST SUITE');
  console.log('================================================================\n');

  const BASE_URL = 'http://localhost:9500';

  // 1. GET Payment Accounts
  console.log('1️⃣ Testing GET /api/buying/payment-accounts...');
  const accountsRes = await fetch(`${BASE_URL}/api/buying/payment-accounts`);
  const accountsData = await accountsRes.json();
  console.log('Status:', accountsRes.status);
  console.log('InstaPay Account:', accountsData.data?.instapay?.accountAddress);
  console.log('Vodafone Cash Number:', accountsData.data?.vodafone_cash?.walletNumber);
  console.log('Cash Rules:', accountsData.data?.cash?.titleAr);

  if (!accountsRes.ok || !accountsData.data?.instapay) {
    throw new Error('Failed to retrieve payment accounts');
  }
  console.log('✅ Payment accounts fetched successfully.\n');

  // 2. Login Guest to get Token & ID
  console.log('2️⃣ Logging in guest (01019998877)...');
  const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone: '01019998877', password: 'Password@1234' })
  });
  const loginData = await loginRes.json();
  if (!loginRes.ok) {
    throw new Error(`Guest login failed: ${JSON.stringify(loginData)}`);
  }
  const token = loginData.token;
  const guestId = loginData.data?._id || loginData.user?._id;
  const guestName = loginData.data?.name || loginData.user?.name;
  console.log(`✅ Logged in as: ${guestName} (ID: ${guestId})\n`);

  // 3. Test Cash On Arrival Purchase
  console.log('3️⃣ Testing Cash on Arrival (paymentMethod: "cash")...');
  const cashPayload = {
    guest: guestId,
    guestName,
    guestPhone: '01019998877',
    paymentMethod: 'cash',
    paymentStatus: 'pending',
    tickets: [
      { ticket: 'pass-kids-area', title: 'Super Explorer Pass', quantity: 2, priceEgp: 100 },
      { ticket: 'pass-fun-park', title: 'All-Day Thrill Pass', quantity: 1, priceEgp: 150 }
    ],
    notes: 'حجز تجريبي نقداً عند الوصول'
  };

  const cashRes = await fetch(`${BASE_URL}/api/buying`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(cashPayload)
  });
  const cashData = await cashRes.json();
  console.log('Status:', cashRes.status);
  console.log('Order Code:', cashData.data?.orderCode);
  console.log('Payment Status:', cashData.data?.paymentStatus);
  console.log('Total Price:', cashData.data?.totalPrice, 'EGP');
  console.log('Message:', cashData.message);

  if (!cashRes.ok || !cashData.data?.orderCode?.startsWith('PZ-')) {
    throw new Error(`Cash checkout failed: ${JSON.stringify(cashData)}`);
  }
  if (cashData.data?.paymentStatus !== 'pending') {
    throw new Error(`Expected paymentStatus 'pending', got '${cashData.data?.paymentStatus}'`);
  }
  console.log('✅ Cash on Arrival checkout verified successfully.\n');

  // 4. Test InstaPay Checkout with Image Upload
  console.log('4️⃣ Testing InstaPay Checkout with Image Upload (paymentMethod: "instapay")...');
  // Find a sample image
  const sampleImagePath = path.join(__dirname, '..', '..', 'Client', 'public', 'photo', 'kid area pic', 'payment logo', 'instapay logo.png');
  const imageBuffer = fs.readFileSync(sampleImagePath);

  const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);
  const formData = new FormData();
  formData.append('paymentProof', new Blob([imageBuffer], { type: 'image/png' }), 'instapay_receipt.png');
  formData.append('guest', guestId);
  formData.append('guestName', guestName);
  formData.append('guestPhone', '01019998877');
  formData.append('senderAccount', 'ahmed@instapay');
  formData.append('paymentMethod', 'instapay');
  formData.append('paymentStatus', 'pending_verification');
  formData.append('tickets', JSON.stringify([
    { ticket: 'pass-challenge', title: 'Tactical Arena Pass', quantity: 1, priceEgp: 100 }
  ]));
  formData.append('notes', 'تحويل عبر إنستاباي - حساب المحول: ahmed@instapay');

  const instapayRes = await fetch(`${BASE_URL}/api/buying`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData
  });
  const instapayData = await instapayRes.json();
  console.log('Status:', instapayRes.status);
  console.log('Order Code:', instapayData.data?.orderCode);
  console.log('Payment Status:', instapayData.data?.paymentStatus);
  console.log('Payment Proof Path:', instapayData.data?.paymentProof);
  console.log('Sender Account:', instapayData.data?.senderAccount);
  console.log('Message:', instapayData.message);

  if (!instapayRes.ok || !instapayData.data?.orderCode?.startsWith('PZ-')) {
    throw new Error(`InstaPay checkout failed: ${JSON.stringify(instapayData)}`);
  }
  if (instapayData.data?.paymentStatus !== 'pending_verification') {
    throw new Error(`Expected paymentStatus 'pending_verification', got '${instapayData.data?.paymentStatus}'`);
  }
  if (!instapayData.data?.paymentProof?.startsWith('/payments/receipt-')) {
    throw new Error(`Invalid paymentProof path: ${instapayData.data?.paymentProof}`);
  }
  console.log('✅ InstaPay checkout with image upload verified successfully.\n');

  // 5. Test Vodafone Cash Checkout with Image Upload
  console.log('5️⃣ Testing Vodafone Cash Checkout with Image Upload (paymentMethod: "vodafone_cash")...');
  const vfFormData = new FormData();
  vfFormData.append('paymentProof', new Blob([imageBuffer], { type: 'image/png' }), 'vodafone_receipt.png');
  vfFormData.append('guest', guestId);
  vfFormData.append('guestName', guestName);
  vfFormData.append('guestPhone', '01019998877');
  vfFormData.append('senderAccount', '01019998877');
  vfFormData.append('paymentMethod', 'vodafone_cash');
  vfFormData.append('paymentStatus', 'pending_verification');
  vfFormData.append('tickets', JSON.stringify([
    { ticket: 'pass-adventure', title: 'High Ropes Suspension Pass', quantity: 1, priceEgp: 100 }
  ]));

  const vfRes = await fetch(`${BASE_URL}/api/buying`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: vfFormData
  });
  const vfData = await vfRes.json();
  console.log('Status:', vfRes.status);
  console.log('Order Code:', vfData.data?.orderCode);
  console.log('Payment Status:', vfData.data?.paymentStatus);
  console.log('Payment Proof Path:', vfData.data?.paymentProof);
  console.log('Sender Account:', vfData.data?.senderAccount);

  if (!vfRes.ok || !vfData.data?.orderCode?.startsWith('PZ-')) {
    throw new Error(`Vodafone Cash checkout failed: ${JSON.stringify(vfData)}`);
  }
  console.log('✅ Vodafone Cash checkout with image upload verified successfully.\n');

  // 6. Test Order Lookup by Code (QR Code check)
  console.log('6️⃣ Testing Turnstile QR Code lookup for InstaPay order...');
  const lookupRes = await fetch(`${BASE_URL}/api/buying/code/${instapayData.data.orderCode}`);
  const lookupData = await lookupRes.json();
  console.log('Lookup Status:', lookupRes.status);
  console.log('Retrieved Order Code:', lookupData.data?.orderCode);
  console.log('Order Status:', lookupData.data?.status);
  console.log('Used status:', lookupData.data?.used);

  if (!lookupRes.ok || lookupData.data?.orderCode !== instapayData.data.orderCode) {
    throw new Error('Order lookup by code failed');
  }
  console.log('✅ Order lookup by QR code verified successfully.\n');

  console.log('================================================================');
  console.log('🎉 ALL STEP 2 CHECKOUT TESTS PASSED WITH 100% SUCCESS!');
  console.log('================================================================');
}

runStep2CheckoutTests().catch(err => {
  console.error('\n❌ TEST FAILED:', err.message);
  process.exit(1);
});
