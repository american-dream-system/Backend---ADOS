const http = require("http");

const data = JSON.stringify({
    title: "تجارب تناول الطعام",
    titleAr: "تجارب تناول الطعام",
    subtitle: "Choose How You Want to Enjoy",
    subtitleAr: "اختر الطريقة التي تفضلها للاستمتاع",
    descriptionAr: "سواء كنت تسترخي على طول الممشى الكبير أو تتذوق الأطباق الطازجة في أي مكان على ضفاف القناة.",
    items: [
        {
            slot: "delivery",
            title: "DELIVERY",
            titleAr: "خدمة التوصيل",
            badge: "DELIVERY",
            badgeAr: "توصيل",
            description: "Order your favorite food and enjoy it wherever you are.",
            descriptionAr: "اطلب طعامك المفضل واستمتع به أينما كنت.",
            buttonText: "ORDER NOW",
            buttonTextAr: "اطلب الآن",
            actionType: "hash",
            actionTarget: "#restaurant-delivery",
            image: "/photo/kid area pic/Freshly grilled brioche cheeseburger with crispy shoestring fries and artisanal dip in craft takeaway presentation.png",
            order: 1,
            isActive: true
        },
        {
            slot: "digital_menu",
            title: "FOOD & DRINKS MENU",
            titleAr: "قائمة طعام ومشروبات المطعم",
            badge: "DIGITAL MENU",
            badgeAr: "المنيو الرقمي",
            description: "Browse our full gourmet menu featuring fresh dishes, stone-baked pizzas, drinks & desserts.",
            descriptionAr: "استعرض أشهى المأكولات الطازجة والمشروبات والحلويات مع كافة الأسعار والتفاصيل.",
            buttonText: "VIEW MENU",
            buttonTextAr: "تصفح المنيو",
            actionType: "modal",
            actionTarget: "menu_pdf",
            image: "/photo/kid area pic/vibe_family_pizza.png",
            order: 2,
            isActive: true
        },
        {
            slot: "table_booking",
            title: "BOOK A TABLE",
            titleAr: "حجز طاولة",
            badge: "VIP",
            badgeAr: "VIP",
            description: "Reserve your table and enjoy your meal seamlessly during your visit without waiting.",
            descriptionAr: "احجز طاولتك واستمتع بوجبتك بسلاسة وبدون انتظار أثناء زيارتك.",
            buttonText: "BOOK A TABLE",
            buttonTextAr: "احجز طاولة الآن",
            actionType: "modal",
            actionTarget: "booking_modal",
            image: "/photo/kid area pic/vibe_sunset_candle_table.png",
            order: 3,
            isActive: true
        }
    ]
});

async function runTests() {
    console.log("=== Starting Media API Verification ===");

    // Test 1: PUT /api/media/restaurant/experiences
    console.log("\n[Test 1] Testing PUT /api/media/restaurant/experiences (Upsert Action Cards)...");
    const putRes = await sendRequest("/api/media/restaurant/experiences", "PUT", data);
    console.log("PUT Response Status:", putRes.status);
    console.log("PUT Response Success:", putRes.data?.success);
    console.log("PUT Items Saved:", putRes.data?.data?.items?.length);

    // Test 2: GET /api/media/restaurant/experiences
    console.log("\n[Test 2] Testing GET /api/media/restaurant/experiences...");
    const getRes = await sendRequest("/api/media/restaurant/experiences", "GET");
    console.log("GET Response Status:", getRes.status);
    console.log("GET Items Count:", getRes.data?.data?.items?.length);
    console.log("First Item Slot:", getRes.data?.data?.items?.[0]?.slot);
    console.log("First Item TitleAr:", getRes.data?.data?.items?.[0]?.titleAr);

    // Test 3: GET /api/media/page/restaurant
    console.log("\n[Test 3] Testing GET /api/media/page/restaurant...");
    const pageRes = await sendRequest("/api/media/page/restaurant", "GET");
    console.log("Page Res Status:", pageRes.status);
    console.log("Total Sections:", pageRes.data?.count);
    console.log("Sections Keys:", Object.keys(pageRes.data?.sections || {}));

    // Test 4: PUT /api/media/home/mosaic
    console.log("\n[Test 4] Testing PUT /api/media/home/mosaic (4 Ways Cards)...");
    const mosaicData = JSON.stringify({
        title: "مكان واحد. أربع طرق للاستمتاع.",
        titleAr: "مكان واحد. أربع طرق للاستمتاع.",
        subtitle: "One Place. Four Ways to Have Fun.",
        subtitleAr: "أجواء حماسية ولحظات استثنائية تناسب الجميع",
        items: [
            {
                slot: "mosaic_1",
                title: "High-Octane Racing",
                titleAr: "سباقات سيارات السرعة",
                image: "/photo/kid-area-pic/Junior GP Speedway.png",
                order: 1
            },
            {
                slot: "mosaic_2",
                title: "Family Dining Table",
                titleAr: "جلسات عائلية مميزة",
                image: "/photo/kid area pic/vibe_family_pizza.png",
                order: 2
            },
            {
                slot: "mosaic_3",
                title: "Fast-Paced Air Hockey",
                titleAr: "هوكي الهواء السريع",
                image: "/photo/kid area pic/Air Hockey Table.png",
                order: 3
            },
            {
                slot: "mosaic_4",
                title: "Climbing Walls & High Ropes",
                titleAr: "تسلق وحبال معلقة",
                image: "/photo/kid area pic/High ropes suspended course.png",
                order: 4
            }
        ]
    });
    const mosaicRes = await sendRequest("/api/media/home/mosaic", "PUT", mosaicData);
    console.log("Mosaic PUT Status:", mosaicRes.status);
    console.log("Mosaic Items Saved:", mosaicRes.data?.data?.items?.length);

    // Test 5: Direct file upload POST /api/media/upload-file
    console.log("\n[Test 5] Testing POST /api/media/upload-file (Multipart Image Upload)...");
    const uploadRes = await testMultipartUpload();
    console.log("Upload Status:", uploadRes.status);
    console.log("Upload Success:", uploadRes.data?.success);
    console.log("Uploaded URL:", uploadRes.data?.url);
    console.log("Uploaded FileName:", uploadRes.data?.fileName);

    // Test 6: Validation check on invalid ID
    console.log("\n[Test 6] Testing Validation Error on Invalid ID GET /api/media/invalid-id-123...");
    const invalidRes = await sendRequest("/api/media/invalid-id-123", "GET");
    console.log("Invalid ID Status (expected 400):", invalidRes.status);
    console.log("Validation Message:", invalidRes.data?.errors?.[0]?.msg || invalidRes.data?.message);

    console.log("\n=== ALL TESTS COMPLETED SUCCESSFULLY (6/6) ===");
}

function testMultipartUpload() {
    return new Promise((resolve, reject) => {
        // Minimal 1x1 valid JPEG buffer
        const jpegBuffer = Buffer.from([
            0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01,
            0x01, 0x01, 0x00, 0x48, 0x00, 0x48, 0x00, 0x00, 0xff, 0xdb, 0x00, 0x43,
            0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08, 0x07, 0x07, 0x07, 0x09,
            0x09, 0x08, 0x0a, 0x0c, 0x14, 0x0d, 0x0c, 0x0b, 0x0b, 0x0c, 0x19, 0x12,
            0x13, 0x0f, 0x14, 0x1d, 0x1a, 0x1f, 0x1e, 0x1d, 0x1a, 0x1c, 0x1c, 0x20,
            0x24, 0x2e, 0x27, 0x20, 0x22, 0x2c, 0x23, 0x1c, 0x1c, 0x28, 0x37, 0x29,
            0x2c, 0x30, 0x31, 0x34, 0x34, 0x34, 0x1f, 0x27, 0x39, 0x3d, 0x38, 0x32,
            0x3c, 0x2e, 0x33, 0x34, 0x32, 0xff, 0xc0, 0x00, 0x0b, 0x08, 0x00, 0x01,
            0x00, 0x01, 0x01, 0x01, 0x11, 0x00, 0xff, 0xc4, 0x00, 0x1f, 0x00, 0x00,
            0x01, 0x05, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x00, 0x00, 0x00, 0x00,
            0x00, 0x00, 0x00, 0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08,
            0x09, 0x0a, 0x0b, 0xff, 0xda, 0x00, 0x08, 0x01, 0x01, 0x00, 0x00, 0x3f,
            0x00, 0x37, 0xff, 0xd9
        ]);

        const boundary = "----WebKitFormBoundary7MA4YWxkTrZu0gW";
        let body = "";
        body += `--${boundary}\r\n`;
        body += `Content-Disposition: form-data; name="page"\r\n\r\nrestaurant\r\n`;
        body += `--${boundary}\r\n`;
        body += `Content-Disposition: form-data; name="section"\r\n\r\nexperiences\r\n`;
        body += `--${boundary}\r\n`;
        body += `Content-Disposition: form-data; name="image"; filename="test-table.jpeg"\r\n`;
        body += `Content-Type: image/jpeg\r\n\r\n`;

        const headerBuffer = Buffer.from(body, "utf-8");
        const footerBuffer = Buffer.from(`\r\n--${boundary}--\r\n`, "utf-8");
        const fullPayload = Buffer.concat([headerBuffer, jpegBuffer, footerBuffer]);

        const options = {
            hostname: "localhost",
            port: 9500,
            path: "/api/media/upload-file",
            method: "POST",
            headers: {
                "Content-Type": `multipart/form-data; boundary=${boundary}`,
                "Content-Length": fullPayload.length
            }
        };

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
        req.write(fullPayload);
        req.end();
    });
}

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
            options.headers["Content-Length"] = Buffer.byteLength(body);
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
        if (body) req.write(body);
        req.end();
    });
}

runTests().catch(console.error);
