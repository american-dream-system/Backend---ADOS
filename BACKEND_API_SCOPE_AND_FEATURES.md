# American Dream Ismailia — Backend System Specification
## API Scope, Features Inventory & Architectural Blueprint

**Generated From:** Comprehensive Static & Behavioral Analysis of `Client/`  
**Target Platform:** American Dream Family Entertainment Center & Kids Park (ADOS Server)  
**Technology Stack:** Node.js, Express 5.x, MongoDB (Mongoose), Sharp, Multer, JWT, Swagger  
**Date:** October 2026  
**Document Status:** Approved Production Architecture  

---

## 1. Executive Summary & Client Architecture Analysis

The frontend (`Client/`) is a dual-shell (Desktop & Mobile PWA-ready) bilingual (Arabic RTL / English LTR) React application built for the **American Dream Family Entertainment Center** in Ismailia, Egypt.

### 1.1 Client Foundational Architecture
* **Frontend Core:** React 18 with Vite 6, Context API (`AuthContext`, `DataContext`, `LanguageContext`), dynamic CSS glassmorphism, and responsive dual layouts (`DesktopAppShell` / `MobileBottomNav`).
* **Data Layer & Fallback Strategy:** The client utilizes an `apiClient` (`src/api/apiClient.js`) with configured base URL, tunnel header bypass (`ngrok-skip-browser-warning`), timeout abort controllers, and local storage / mock fallback layers (`src/data/mock/*`).
* **Active API Consumers:**
  * `authService.js` (User identity, session token, wallet, children, loyalty points)
  * `ticketService.js` (Zone offers, timed passes, arcade game tickets, QR booking)
  * `packageService.js` (Multi-zone passes, birthday packages, party quotes)
  * `attractionService.js` (Zone attractions, park status, 360 virtual tour)
  * `menuService.js` (Dine-in menu, snacks, order placement)
  * `mediaService.js` & `imageApiService.js` (CMS image upload, page-wise/section-wise media routing, Sharp resizing)
  * `DesktopCartPage.jsx` (Multi-pass cart, loyalty point redemption, InstaPay/Vodafone Cash proof-of-payment upload)
  * `DesktopTripsPage.jsx` (School trips calculator, 1:15 supervisor ratio, official quote generation, WhatsApp dispatch)
  * `DesktopRestaurantPage.jsx` & `OrderForDeliveryPage.jsx` (Table reservation & food delivery with Ismailia district routing)
  * `DesktopDashboardPage.jsx` (Admin zone configuration, package & ticket assignment, media asset manager)
  * `DesktopProfilePage.jsx` (User profile, family children wristbands, active passes QR codes, transaction history)

---

## 2. Features Scope Inventory (Client-to-Backend Mapping)

```
+----------------------------------------------------------------------------------------------------+
|                                    AMERICAN DREAM BACKEND SCOPE                                    |
+----------------------------------------------------------------------------------------------------+
|                                                                                                    |
|  [1] IDENTITY & ACCESS (RBAC)         [2] TICKETING & PASSES         [3] PACKAGES & CELEBRATIONS   |
|  - Phone / Email Auth (JWT)           - 4 Themed Park Zones          - Multi-Zone Pass Bundles     |
|  - User Profile & Loyalty Wallet      - Individual Game Tokens       - Tiered Birthday Packages    |
|  - Family / Children Wristbands       - Dynamic QR Pass Generation   - Custom Event Quotations     |
|  - Role-Based Permissions (RBAC)      - Gate Check-in & Scanner      - Add-ons (Mascots, Decor)    |
|                                                                                                    |
|  [4] CHECKOUT & PAYMENTS              [5] SCHOOL & GROUP TRIPS       [6] RESTAURANT & DELIVERY     |
|  - Loyalty Points Redemption (Pts)    - Tier Rate Calculator         - Interactive Digital Menu    |
|  - InstaPay / Vodafone Cash Upload    - 1:15 Supervisor Formula      - Table Dine-in Reservations  |
|  - Receipt Verification Queue         - Official Quote Reference     - Food Delivery (6 Districts) |
|  - Cashier Approval Dashboard         - PDF/Screenshot Export Sync   - Order Tracking & Status     |
|                                                                                                    |
|  [7] MEDIA & CMS MANAGEMENT           [8] PARK OPERATIONS & STATUS   [9] ADMIN OPERATIONS & AUDIT  |
|  - Multi-page Image Pipeline          - Live Capacity & Wait Time    - Master Zone Data Config     |
|  - Section Tagging (Hero/Vibes)       - 360 Virtual Tour Assets      - Revenue & Financial Reports |
|  - Sharp 1024px Optimization          - Zone Maintenance Modes       - Activity Logs & Audit Trail |
+----------------------------------------------------------------------------------------------------+
```

---

## 3. Comprehensive REST API Endpoints Specification

### 3.1 Authentication & User Management Module (`/api/auth`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | Public | Register new user via Name, Phone, Email, Password. Returns JWT and user profile. |
| `POST` | `/api/auth/login` | Public | Login via Email or Egyptian Phone (`010/011/012/015`) + Password. |
| `POST` | `/api/auth/logout` | Private | Invalidate user session / refresh token. |
| `GET` | `/api/auth/me` | Private | Fetch authenticated user profile, points, and active passes. |
| `PUT` | `/api/auth/profile` | Private | Update profile fields (name, phone, address, gender, avatar). |
| `POST` | `/api/auth/wallet/pass` | Private | Add booked digital wristband pass directly to user's wallet. |
| `GET` | `/api/auth/children` | Private | List registered family children / wristband codes. |
| `POST` | `/api/auth/children` | Private | Add child record (`name`, `gender`, `age`, `wristband`). |
| `PUT` | `/api/auth/children/:id` | Private | Edit child information. |
| `DELETE` | `/api/auth/children/:id` | Private | Remove child record. |

#### Sample Request: `POST /api/auth/register`
```json
{
  "name": "Ahmed Hassan",
  "phone": "01012345678",
  "email": "ahmed.hassan@americandream.com",
  "password": "Password123"
}
```

#### Sample Response: `201 Created`
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "67041a94f923b123456789ab",
    "name": "Ahmed Hassan",
    "phone": "01012345678",
    "email": "ahmed.hassan@americandream.com",
    "role": "customer",
    "membership": "Club Member",
    "points": 100,
    "activePasses": []
  }
}
```

---

### 3.2 Park Attractions & Operations Module (`/api/attractions` & `/api/park`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/attractions` | Public | Query attractions by zone query param (`?zone=kids-area|fun-park|challenge|adventure`). |
| `GET` | `/api/attractions/:id` | Public | Get single attraction details and safety guidelines. |
| `POST` | `/api/attractions` | Admin | Create a new attraction. |
| `PUT` | `/api/attractions/:id` | Admin | Update attraction details, capacity, or age constraints. |
| `DELETE` | `/api/attractions/:id` | Admin | Delete attraction. |
| `GET` | `/api/park/status` | Public | Live park capacity monitor, crowd level, wait time, and open status. |
| `PUT` | `/api/park/status` | Admin | Update live park capacity, current count, and operational notice. |
| `GET` | `/api/park/virtual-tour` | Public | Retrieve 360 degree virtual tour hotspots and panorama imagery. |

---

### 3.3 Ticketing, Passes & Wristband Booking (`/api/tickets`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/tickets` | Public | List all tickets with pagination (`?page=1&limit=10`). |
| `GET` | `/api/tickets/offers` | Public | Get zone-specific bundled passes (`?zone=kids-area|fun-park`). |
| `GET` | `/api/tickets/fun-park` | Public | Get Fun Park tickets filtered by timing (`?timing=weekend|midweek`). |
| `GET` | `/api/tickets/games` | Public | Get single arcade/attraction game tokens (`?zone=challenge|adventure`). |
| `POST` | `/api/tickets/book` | Public/Auth | Create digital ticket booking, generate QR serial `PZ-XXXXXX`, and sync to wallet. |
| `GET` | `/api/tickets/bookings` | Private | Get user booking history or all bookings for cashier. |
| `GET` | `/api/tickets/bookings/:code` | Staff | Gatekeeper scan endpoint to verify ticket validity and status. |
| `PATCH` | `/api/tickets/bookings/:code/redeem` | Staff | Mark pass as `Redeemed` upon entrance through the turnstile. |

#### Sample Request: `POST /api/tickets/book`
```json
{
  "name": "Mariam Mahmoud",
  "phone": "01123456789",
  "passName": "Tactical Arena Pass",
  "zone": "challenge",
  "quantity": 2,
  "date": "today",
  "priceNum": 100,
  "price": "100 EGP",
  "details": "VR Headset Battle + Air Hockey Arena"
}
```

#### Sample Response: `201 Created`
```json
{
  "success": true,
  "message": "Ticket pass created successfully",
  "booking": {
    "id": "67042000f923b123456789ac",
    "code": "PZ-849201",
    "name": "Mariam Mahmoud",
    "phone": "01123456789",
    "passName": "Tactical Arena Pass",
    "zone": "challenge",
    "quantity": 2,
    "date": "Valid Today",
    "totalAmount": 200,
    "status": "Active",
    "createdAt": "2026-10-08T02:00:00.000Z"
  }
}
```

---

### 3.4 Packages, Birthdays & Event Parties (`/api/packages`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/packages` | Public | List multi-zone pass packages (Adventure, Challenge, Midweek, Weekend). |
| `GET` | `/api/packages/:category` | Public | Get single pass package details by category key. |
| `POST` | `/api/packages` | Admin | Create new package (supports multipart image upload). |
| `PUT` | `/api/packages/:id` | Admin | Update package details and pricing. |
| `DELETE` | `/api/packages/:id` | Admin | Remove package. |
| `GET` | `/api/packages/birthdays` | Public | List birthday tiers (Silver Sparkle, Gold Super Star, Diamond VIP). |
| `POST` | `/api/packages/custom-quote` | Public | Submit private celebration / birthday party quote inquiry. |

#### Sample Request: `POST /api/packages/custom-quote`
```json
{
  "partyType": "birthday",
  "tier": "gold",
  "childName": "Youssef",
  "childAge": 8,
  "eventDate": "2026-10-25",
  "guestCount": 20,
  "contactName": "Ahmed",
  "contactPhone": "01012345678",
  "addOns": ["mascot-appearance", "face-painting"],
  "notes": "Superhero theme requested"
}
```

---

### 3.5 School & Group Trips Quotation Engine (`/api/trips`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/trips/offers` | Public | Fetch available group trip packages (`full-dream` @ 380 EGP, `play-dine` @ 290 EGP). |
| `POST` | `/api/trips/calculate` | Public | Calculate group cost with automated 1:15 supervisor compliment rule. |
| `POST` | `/api/trips/quote` | Public | Generate and save official trip quotation record (`AD-TRIP-XXXX`). |
| `GET` | `/api/trips/quotes/:ref` | Public | Retrieve official quotation by reference number. |

#### Calculation Rules & Logic:
$$\text{Complimentary Supervisors} = \max\left(1, \left\lfloor \frac{\text{Students}}{15} \right\rfloor\right)$$
$$\text{Total Cost} = \text{Students} \times \text{Package Price}$$

---

### 3.6 Restaurant, Dine-In & Food Delivery (`/api/menu` & `/api/restaurant`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/menu` | Public | Query menu items (`?category=food|drinks|desserts|cafe|all`). |
| `GET` | `/api/menu/:id` | Public | Get dish details, allergens, chef specials. |
| `POST` | `/api/menu` | Admin | Add new menu item with photo upload. |
| `PUT` | `/api/menu/:id` | Admin | Update dish pricing, availability, or tags. |
| `DELETE` | `/api/menu/:id` | Admin | Delete menu item. |
| `POST` | `/api/restaurant/reservations` | Public | Dine-in table reservation (guests, date, timeslot, zone). |
| `GET` | `/api/restaurant/reservations` | Staff | View table reservations ledger. |
| `POST` | `/api/restaurant/delivery-orders` | Public | Submit food delivery order with Ismailia delivery zones. |
| `GET` | `/api/restaurant/delivery-orders/:code` | Public | Track order status (`DEL-XXXX`). |

#### Supported Ismailia Delivery Zones:
1. `ferdan`: Ferdan District / Ismailia City (35-45 mins)
2. `promenade-1`: Dream Promenade / Canal Walk Gate 1 (15-25 mins)
3. `promenade-2`: Dream Promenade / Waterfront Gate 2 (15-25 mins)
4. `university`: Suez Canal University District / Ring Rd (30-40 mins)
5. `sheikh-zayed`: El Sheikh Zayed / District 24 (35-45 mins)
6. `sultan-hussein`: Sultan Hussein / Downtown Ismailia (40-50 mins)

---

### 3.7 Cart Checkout & Payment Proof Verification (`/api/orders`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/orders/checkout` | Auth | Multi-item cart checkout. Deducts loyalty points or sets offline cash status. |
| `POST` | `/api/orders/payment-proof` | Auth | Upload screenshot of InstaPay / Vodafone Cash payment receipt. |
| `GET` | `/api/orders/pending` | Staff | View pending offline transfer receipts for review. |
| `PATCH` | `/api/orders/:id/verify` | Staff | Approve or reject payment receipt, updating passes to `Active`. |

#### Financial & Points Rules:
* Points Conversion: $1 \text{ EGP} \approx 3 \text{ to } 3.33 \text{ Points}$.
* Loyalty Cash-back Reward: $10\%$ of cash spend earned back in points:
  $$\text{Bonus Points} = \text{round}(\text{Cash Spent in EGP} \times 0.10)$$

---

### 3.8 Media, Banner & CMS Management (`/api/media`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/media` | Admin | Upload images via Multer; Sharp resizes to 1024x1024 JPEG at 90% quality. |
| `GET` | `/api/media/page/:page` | Public | Get media for page (`home`, `kids-area`, `fun-park`, `challenge`, `adventure`, `events`, `trips`). |
| `GET` | `/api/media/section/:section`| Public | Get media for section (`hero`, `explore`, `vibes`, `general`). |
| `PUT` | `/api/media/:page/:section` | Admin | Update media assigned to a specific page section. |
| `DELETE` | `/api/media/:id` | Admin | Delete media by MongoDB ID. |

---

## 4. Database Schemas (Mongoose Data Models)

### 4.1 User Schema (`User`)
```javascript
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true, unique: true },
  email: { type: String, sparse: true, lowercase: true },
  password: { type: String, required: true, select: false },
  role: { 
    type: String, 
    enum: ['guest', 'customer', 'cashier', 'content_manager', 'admin'], 
    default: 'customer' 
  },
  membership: { type: String, default: 'Explorer Member' },
  points: { type: Number, default: 100 },
  storeCredit: { type: Number, default: 0 },
  avatar: { type: String, default: '/photo/kid-area-pic/icon/user-icon.png' },
  address: { type: String, default: '' },
  gender: { type: String, enum: ['male', 'female'], default: 'male' },
  children: [{
    name: { type: String, required: true },
    gender: { type: String, enum: ['male', 'female'] },
    age: { type: Number },
    wristband: { type: String }
  }],
  activePasses: [{
    code: { type: String, required: true },
    zone: { type: String },
    name: { type: String },
    quantity: { type: Number, default: 1 },
    date: { type: String },
    price: { type: String },
    status: { type: String, enum: ['Active', 'Redeemed', 'Expired'], default: 'Active' },
    createdAt: { type: Date, default: Date.now }
  }]
}, { timestamps: true });
```

### 4.2 Ticket / Pass Schema (`Ticket`)
```javascript
const ticketSchema = new mongoose.Schema({
  titleEn: { type: String, required: true },
  titleAr: { type: String, required: true },
  zone: { 
    type: String, 
    enum: ['kids-area', 'fun-park', 'challenge', 'adventure'], 
    required: true 
  },
  type: { type: String, enum: ['pass', 'game_token'], default: 'pass' },
  timing: { type: String, enum: ['all', 'weekend', 'midweek'], default: 'all' },
  price: { type: Number, required: true },
  originalPrice: { type: Number },
  saveBadge: { type: String },
  age: { type: String },
  features: [{ type: String }],
  image: { type: String, required: true },
  active: { type: Boolean, default: true }
}, { timestamps: true });
```

### 4.3 Booking & Pass Ledger Schema (`Booking`)
```javascript
const bookingSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true }, // e.g. PZ-849201
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  customerName: { type: String, required: true },
  customerPhone: { type: String, required: true },
  passName: { type: String, required: true },
  zone: { type: String, required: true },
  quantity: { type: Number, default: 1 },
  date: { type: String, required: true },
  priceNum: { type: Number, required: true },
  totalAmount: { type: Number, required: true },
  paymentMethod: { type: String, enum: ['points', 'cash', 'instapay', 'vodafone_cash'], default: 'cash' },
  paymentStatus: { type: String, enum: ['pending', 'verified', 'rejected'], default: 'verified' },
  status: { type: String, enum: ['Active', 'Redeemed', 'Expired', 'Cancelled'], default: 'Active' },
  redeemedAt: { type: Date },
  redeemedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });
```

### 4.4 MenuItem Schema (`MenuItem`)
```javascript
const menuItemSchema = new mongoose.Schema({
  nameEn: { type: String, required: true },
  nameAr: { type: String, required: true },
  descEn: { type: String },
  descAr: { type: String },
  price: { type: Number, required: true },
  category: { 
    type: String, 
    enum: ['food', 'burgers', 'pizza', 'drinks', 'desserts', 'cafe', 'meals', 'sweets'], 
    required: true 
  },
  image: { type: String, required: true },
  rating: { type: Number, default: 5.0 },
  isChefSpecial: { type: Boolean, default: false },
  available: { type: Boolean, default: true }
}, { timestamps: true });
```

### 4.5 Restaurant Reservation Schema (`Reservation`)
```javascript
const reservationSchema = new mongoose.Schema({
  bookingRef: { type: String, required: true, unique: true }, // RES-XXXX
  guestName: { type: String, required: true },
  guestPhone: { type: String, required: true },
  bookingDate: { type: Date, required: true },
  timeSlot: { type: String, required: true },
  guestCount: { type: Number, required: true },
  selectedZone: { type: String, enum: ['terrace', 'hall', 'garden'], default: 'terrace' },
  occasion: { type: String, default: 'casual' },
  status: { type: String, enum: ['Confirmed', 'Seated', 'Completed', 'Cancelled'], default: 'Confirmed' }
}, { timestamps: true });
```

### 4.6 Delivery Order Schema (`DeliveryOrder`)
```javascript
const deliveryOrderSchema = new mongoose.Schema({
  trackingCode: { type: String, required: true, unique: true }, // DEL-XXXX
  customerName: { type: String, required: true },
  customerPhone: { type: String, required: true },
  deliveryZone: { type: String, required: true },
  customAddress: { type: String, required: true },
  deliveryNotes: { type: String },
  items: [{
    menuItemId: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem' },
    nameEn: { type: String },
    nameAr: { type: String },
    price: { type: Number },
    qty: { type: Number, default: 1 }
  }],
  subtotal: { type: Number, required: true },
  deliveryFee: { type: Number, default: 0 },
  vatAmount: { type: Number, default: 0 },
  grandTotal: { type: Number, required: true },
  paymentMethod: { type: String, enum: ['cod', 'card', 'wallet'], default: 'cod' },
  status: { 
    type: String, 
    enum: ['Placed', 'Preparing', 'OutForDelivery', 'Delivered', 'Cancelled'], 
    default: 'Placed' 
  }
}, { timestamps: true });
```

### 4.7 Trip Quotation Schema (`TripQuote`)
```javascript
const tripQuoteSchema = new mongoose.Schema({
  quoteRef: { type: String, required: true, unique: true }, // AD-TRIP-XXXX
  orgName: { type: String, required: true },
  orgType: { type: String, enum: ['School', 'Nursery', 'Academy', 'Corporate', 'Other'], default: 'School' },
  contactName: { type: String, required: true },
  phone: { type: String, required: true },
  students: { type: Number, required: true },
  supervisors: { type: Number, required: true },
  ageGroups: [{ type: String }],
  tripDate: { type: Date, required: true },
  shift: { type: String, enum: ['morning', 'evening'], default: 'morning' },
  arrivalTime: { type: String, default: '09:30 AM' },
  packageId: { type: String, required: true },
  packageTitle: { type: String, required: true },
  pricePerStudent: { type: Number, required: true },
  totalCost: { type: Number, required: true },
  status: { type: String, enum: ['Quoted', 'DepositPaid', 'Confirmed', 'Archived'], default: 'Quoted' }
}, { timestamps: true });
```

### 4.8 Media Schema (`Media`)
*(Currently active in `Server/src/modules/media/model.js`)*
```javascript
const mediaSchema = new mongoose.Schema({
  images: [{ type: String, required: true }],
  name: { type: String, required: true },
  section: { type: String, required: true },
  page: { type: String, required: true }
}, { timestamps: true });
```

---

## 5. Security, Authentication & Role Matrix (RBAC)

### 5.1 RBAC Privilege Matrix

| Capability / Resource | Guest | Customer | Cashier / Gate | Content Admin | Super Admin |
|:---|:---:|:---:|:---:|:---:|:---:|
| Browse Attractions, Menus & Passes |  |  |  |  |  |
| Calculate School Trips Quote |  |  |  |  |  |
| Book Ticket Passes & Checkout | ❌ |  |  |  |  |
| Redeem Loyalty Points Balance | ❌ |  | ❌ | ❌ |  |
| View Personal Order & Pass Wallet | ❌ |  | ❌ | ❌ |  |
| Manage Family Children Wristbands | ❌ |  | ❌ | ❌ |  |
| Gate QR Validation (`/redeem`) | ❌ | ❌ |  | ❌ |  |
| Verify Offline Payment Receipts | ❌ | ❌ |  | ❌ |  |
| CMS Media Upload & Sharp Processing | ❌ | ❌ | ❌ |  |  |
| Update Park Live Capacity Status | ❌ | ❌ |  |  |  |
| Modify Master Pricing & Users | ❌ | ❌ | ❌ | ❌ |  |

---

## 6. Implementation Status & Gap Analysis

| Module / Scope | Current Server Status | Missing / Required Actions |
|---|---|---|
| **Media (`/api/media`)** |  Active (`model`, `routes`, `services`) | Add page aliases handler (`fun-park` vs `funzone`). |
| **Packages (`/api/packages`)** |  Active (`model`, `routes`, `services`) | Add `/birthdays` tier endpoint and `/custom-quote` handler. |
| **Tickets (`/api/tickets`)** |  Partial (`model`, `route`, `service`) | Add `/offers`, `/games`, `/fun-park` filters, and QR gate scan/redeem. |
| **Guests (`/api/guests`)** |  Active (`model`, `route`, `services`) | Integrate into User/Customer auth model. |
| **Auth (`/api/auth`)** | ❌ Missing | Create `User` model, JWT token generation, `/login`, `/register`, `/me`, `/profile`. |
| **Trips (`/api/trips`)** | ❌ Missing | Implement quotation calculation & persistence (`AD-TRIP-XXXX`). |
| **Restaurant & Menu (`/api/menu`)**| ❌ Missing | Create `MenuItem` model, `/reservations`, and `/delivery-orders`. |
| **Orders & Checkout (`/api/orders`)**| ❌ Missing | Implement checkout, point deductions, and receipt verification queue. |
| **Park Status (`/api/park`)** | ❌ Missing | Live capacity & wait-time status endpoint. |

---

## 7. Recommended Modular Backend Directory Structure

To fulfill this entire scope cleanly, the server directory should expand following the existing modular structure:

```
Server/
├── src/
│   ├── config/
│   │   ├── database.js
│   │   └── swagger.js
│   ├── middlewares/
│   │   ├── auth.js            # [NEW] JWT verification & role guard
│   │   ├── error.js
│   │   └── uploadImages.js
│   ├── modules/
│   │   ├── auth/              # [NEW] User register, login, profile, children
│   │   ├── media/             # [ACTIVE] CMS media upload & page queries
│   │   ├── packges/           # [ACTIVE] Multi-zone & birthday packages
│   │   ├── tickets/           # [ACTIVE] Passes, game tokens & QR check-in
│   │   ├── trips/             # [NEW] School trips quote engine
│   │   ├── restaurant/        # [NEW] Menu, dine-in reservations & delivery
│   │   ├── orders/            # [NEW] Cart checkout, points & payment proofs
│   │   └── park/              # [NEW] Live capacity, wait-time & virtual tour
│   └── utils/
│       ├── ApiError.js
│       └── generateCode.js    # [NEW] QR & Reference formatters
├── server.js
└── package.json
```
