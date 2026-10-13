// Phase 3 Integration Verification Script
const http = require("http");

function sendRequest(path, method, body = null) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: "localhost",
            port: 9500,
            path: path,
            method: method,
            headers: {
                "Content-Type": "application/json"
            }
        };

        if (body) {
            const bodyStr = typeof body === "string" ? body : JSON.stringify(body);
            options.headers["Content-Length"] = Buffer.byteLength(bodyStr);
        }

        const req = http.request(options, (res) => {
            let responseData = "";
            res.on("data", (chunk) => { responseData += chunk; });
            res.on("end", () => {
                try {
                    const parsed = JSON.parse(responseData);
                    resolve({ status: res.statusCode, data: parsed });
                } catch (e) {
                    resolve({ status: res.statusCode, raw: responseData });
                }
            });
        });

        req.on("error", (e) => reject(e));
        if (body) {
            const bodyStr = typeof body === "string" ? body : JSON.stringify(body);
            req.write(bodyStr);
        }
        req.end();
    });
}

async function runTests() {
    console.log("====================================================");
    console.log("🧪 TESTING PHASE 3 (Public Client & API Integration)");
    console.log("====================================================\n");

    let passed = 0;
    let total = 0;

    // 1. Verify GET /api/media/restaurant/experiences
    total++;
    try {
        const res = await sendRequest("/api/media/restaurant/experiences", "GET");
        console.log(`[Test 1] GET /api/media/restaurant/experiences -> Status: ${res.status}`);
        if (res.status === 200 && res.data?.success && Array.isArray(res.data?.data?.items)) {
            console.log(`   ✓ Found ${res.data.data.items.length} experience card slots`);
            res.data.data.items.forEach(it => {
                console.log(`     • [Slot: ${it.slot}] ${it.title} | ${it.titleAr} (Action: ${it.actionType || it.slot})`);
            });
            passed++;
        } else {
            console.log("   ❌ Unexpected response:", res.data);
        }
    } catch (err) {
        console.log("   ❌ Error:", err.message);
    }

    // 2. Verify GET /api/media/page/restaurant (Sections dictionary)
    total++;
    try {
        const res = await sendRequest("/api/media/page/restaurant", "GET");
        console.log(`\n[Test 2] GET /api/media/page/restaurant -> Status: ${res.status}`);
        if (res.status === 200 && res.data?.success && res.data?.sections) {
            console.log("   ✓ Sections available:", Object.keys(res.data.sections));
            passed++;
        } else {
            console.log("   ❌ Unexpected response:", res.data);
        }
    } catch (err) {
        console.log("   ❌ Error:", err.message);
    }

    // 3. Test dynamic edit of restaurant experiences
    total++;
    try {
        const updatedCards = [
            {
                slot: "delivery",
                title: "Super Fast Delivery",
                titleAr: "خدمة التوصيل السريع",
                description: "Hot gourmet meals delivered straight to your door.",
                descriptionAr: "اطلب طعامك المفضل واستمتع به أينما كنت بأعلى سرعة.",
                badge: "FAST DELIVERY",
                badgeAr: "توصيل فوري",
                buttonText: "ORDER ONLINE →",
                buttonTextAr: "اطلب أونلاين ←",
                image: "/photo/kid area pic/Freshly grilled brioche cheeseburger with crispy shoestring fries and artisanal dip in craft takeaway presentation.png",
                actionType: "delivery",
                order: 1
            },
            {
                slot: "digital_menu",
                title: "Full Gourmet Menu",
                titleAr: "قائمة طعام ومشروبات المطعم",
                description: "Explore all our stone-baked pizza, craft burgers and smoothies.",
                descriptionAr: "استعرض أشهى المأكولات الطازجة والمشروبات والحلويات مع كافة الأسعار.",
                badge: "DIGITAL MENU",
                badgeAr: "المنيو الرقمي",
                buttonText: "BROWSE MENU",
                buttonTextAr: "تصفح المنيو",
                image: "/photo/kid area pic/vibe_family_pizza.png",
                actionType: "digital_menu",
                order: 2
            },
            {
                slot: "table_booking",
                title: "VIP Terrace Reservation",
                titleAr: "حجز طاولة VIP على القناة",
                description: "Book your exclusive table for special moments with prime views.",
                descriptionAr: "احجز طاولتك واستمتع بوجبتك بسلاسة وبدون انتظار أثناء زيارتك.",
                badge: "VIP SEATING",
                badgeAr: "جلسات VIP",
                buttonText: "RESERVE NOW",
                buttonTextAr: "احجز الآن",
                image: "/photo/kid area pic/vibe_sunset_candle_table.png",
                actionType: "table_booking",
                order: 3
            }
        ];

        const putRes = await sendRequest("/api/media/restaurant/experiences", "PUT", {
            title: "Dining Experiences",
            titleAr: "تجارب تناول الطعام",
            items: updatedCards
        });

        console.log(`\n[Test 3] PUT /api/media/restaurant/experiences -> Status: ${putRes.status}`);
        if (putRes.status === 200 && putRes.data?.success) {
            console.log("   ✓ Successfully updated all 3 card slots on the backend");
            passed++;
        } else {
            console.log("   ❌ Update failed:", putRes.data);
        }
    } catch (err) {
        console.log("   ❌ Error:", err.message);
    }

    // 4. Verify that public GET now immediately reflects the edited cards
    total++;
    try {
        const res = await sendRequest("/api/media/restaurant/experiences", "GET");
        console.log(`\n[Test 4] GET /api/media/restaurant/experiences (Re-fetch) -> Status: ${res.status}`);
        const items = res.data?.data?.items || [];
        const delivery = items.find(i => i.slot === "delivery");
        const booking = items.find(i => i.slot === "table_booking");

        if (delivery?.title === "Super Fast Delivery" && booking?.titleAr === "حجز طاولة VIP على القناة") {
            console.log("   ✓ Verified! Edits immediately reflected on public API query.");
            console.log(`     • Delivery title: "${delivery.title}" | Badge: "${delivery.badge}"`);
            console.log(`     • Booking titleAr: "${booking.titleAr}" | BadgeAr: "${booking.badgeAr}"`);
            passed++;
        } else {
            console.log("   ❌ Data did not match expected updates:", items);
        }
    } catch (err) {
        console.log("   ❌ Error:", err.message);
    }

    // 5. Verify Kids Area explore & hero endpoints
    total++;
    try {
        const res = await sendRequest("/api/media/page/kids-area", "GET");
        console.log(`\n[Test 5] GET /api/media/page/kids-area -> Status: ${res.status}`);
        if (res.status === 200 && res.data?.success) {
            console.log("   ✓ Found sections for kids-area:", Object.keys(res.data.sections || {}));
            passed++;
        } else {
            console.log("   ❌ Error loading kids-area media");
        }
    } catch (err) {
        console.log("   ❌ Error:", err.message);
    }

    console.log("\n====================================================");
    console.log(`🏁 TEST RESULTS: ${passed}/${total} TESTS PASSED (${Math.round((passed/total)*100)}%)`);
    console.log("====================================================");
}

runTests();
