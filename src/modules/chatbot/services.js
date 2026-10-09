const { GoogleGenerativeAI } = require("@google/generative-ai");
const { v4: uuidv4 } = require("uuid"); // or fallback uuid generator
const ChatSession = require("./sessionModel");
const { chatbotToolDeclarations, executeChatbotTool } = require("./tools");

// Helper for generating UUID if uuid package has issues
const generateSessionId = () => {
    try {
        const { v4 } = require("uuid");
        return v4();
    } catch {
        return `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    }
};

// System instruction prompt
const SYSTEM_INSTRUCTION = `أنت "المساعد الذكي الرسمي لمدينة الملاهي والمطعم أمريكان دريم" (American Dream Kids Area & Restaurant).
مهمتك تقديم تجربة راقية وودودة ومفيدة لزوار وعملاء أمريكان دريم.
تحدث بأسلوب مصري مهذب ومرح وواضح، أو بالإنجليزية إذا تحدث العميل بها.

أنت تمتلك صلاحيات وأدوات مباشرة للنظام (Tools):
1. [getTickets]: عرض وبحث أسعار تذاكر الملاهي والمناطق الترفيهية (funZone, kidsArea, challengeZone, adventureZone).
2. [getPackages]: استعراض باقات الألعاب والعروض التوفيرية مع نقاط المكافآت.
3. [getMenuItems]: تصفح قائمة طعام ومشروبات المطعم بأسعارها وتفاصيلها (برجر، بيتزا، مشويات، حلويات، كافيه).
4. [checkTableAvailability]: التحقق من توفر حجز طاولة بتاريخ ووقت محددين.
5. [bookTable]: حجز طاولة للعميل مباشرة في النظام، وتزويده برمز الحجز (TB-XXXXXX). اطلب من العميل اسمه، هاتفه، الموعد، والتاريخ وعدد الأفراد إذا لم يذكرهم.
6. [createFoodOrder]: طلب وجبات وتوصيلها دليفري أو تجهيزها للاستلام وتزويد العميل برمز الطلب (MN-XXXXXX).
7. [checkOrderStatus]: الاستعلام عن حالة أي حجز طاولة أو طلب شراء تذاكر أو طلب طعام باستخدام الكود الخاص به.
8. [getParkInfo]: تقديم معلومات مواعيد العمل، الموقع، القواعد، ووسائل التواصل.

قواعد هامة:
- عندما يسأل العميل عن أسعار أو ألعاب أو أطعمة أو يرغب بالحجز، استخدم الأدوات فوراً لجلب بيانات حقيقية ومحدثة من قاعدة البيانات.
- لا تخترع أسعاراً أو أطباقاً من عندك، اعتمد دائماً على نتائج الأدوات.
- رحب بالعميل بحفاوة واعرض عليه المساعدة.
- إذا طلب العميل حجز طاولة أو طلب طعام، تأكد من توفر التفاصيل اللازمة (الاسم ورقم الهاتف) ثم نفّذ الأداة واعرض له ملخصاً جذاباً مع رقم التأكيد.`;

// Available models ordered by preference
const CANDIDATE_MODELS = [
    process.env.GEMINI_MODEL || "gemini-3.5-flash",
    "gemini-3.5-flash"
];

// Initialize Gemini Client
const getGeminiClient = () => {
    const apiKey = process.env.GEMINAI_API || process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw new Error("GEMINAI_API is missing from environment variables (.env)");
    }
    return new GoogleGenerativeAI(apiKey);
};

// Run prompt through Gemini with tool calling loop
const runGeminiWithTools = async ({ messages, context = {} }) => {
    const genAI = getGeminiClient();
    let lastError = null;

    // Filter unique candidate models
    const modelsToTry = [...new Set(CANDIDATE_MODELS)];

    for (const modelName of modelsToTry) {
        try {
            const generativeModel = genAI.getGenerativeModel({
                model: modelName,
                systemInstruction: SYSTEM_INSTRUCTION,
                tools: [
                    {
                        functionDeclarations: chatbotToolDeclarations
                    }
                ]
            });

            // Start chat session with historical messages
            const chat = generativeModel.startChat({
                history: messages.slice(0, -1) // all previous messages
            });

            // Send current user message
            const currentMessage = messages[messages.length - 1];
            let response = await chat.sendMessage(currentMessage.parts);

            const executedTools = [];
            let loops = 0;
            const maxLoops = 6;

            // Handle function calls loop
            while (loops < maxLoops) {
                const functionCalls = response.response.functionCalls();
                if (!functionCalls || functionCalls.length === 0) {
                    break;
                }

                loops++;
                const toolResponses = [];

                for (const call of functionCalls) {
                    const result = await executeChatbotTool(call.name, call.args, context);
                    executedTools.push({
                        toolName: call.name,
                        args: call.args,
                        result
                    });

                    toolResponses.push({
                        functionResponse: {
                            name: call.name,
                            response: result
                        }
                    });
                }

                // Send tool execution results back to Gemini
                response = await chat.sendMessage(toolResponses);
            }

            const finalText = response.response.text();
            return {
                text: finalText,
                executedTools,
                modelUsed: modelName
            };
        } catch (error) {
            console.error(`Gemini model ${modelName} error:`, error.message);
            lastError = error;
            // continue to next candidate model
        }
    }

    throw lastError || new Error("Failed to get response from Gemini API");
};

// @desc Send a message to Chatbot
// @route POST /api/chatbot/message
// @access Public / Private
const sendMessage = async (req, res) => {
    try {
        const {
            message,
            sessionId: reqSessionId,
            guestName,
            guestPhone,
            clientHistory = []
        } = req.body;

        if (!message || typeof message !== "string" || !message.trim()) {
            return res.status(400).json({
                success: false,
                message: "حقل الرسالة (message) مطلوب ولا يمكن أن يكون فارغاً"
            });
        }

        // Determine session
        let sessionId = reqSessionId;
        let session = null;

        if (sessionId) {
            session = await ChatSession.findOne({ sessionId });
        }

        if (!session && !sessionId) {
            sessionId = generateSessionId();
        }

        // Context info (Logged-in guest or passed details)
        const guestId = req.guest ? req.guest._id : (session && session.guest ? session.guest : null);
        const resolvedName = (req.guest && req.guest.name) || guestName || (session && session.metadata && session.metadata.guestName) || "";
        const resolvedPhone = (req.guest && req.guest.phone) || guestPhone || (session && session.metadata && session.metadata.guestPhone) || "";

        const context = {
            guestId,
            guestName: resolvedName,
            guestPhone: resolvedPhone
        };

        // Prepare message history for Gemini
        const geminiHistory = [];

        if (session && session.messages && session.messages.length > 0) {
            // Load from DB session
            for (const msg of session.messages) {
                geminiHistory.push({
                    role: msg.role === "user" ? "user" : "model",
                    parts: [{ text: msg.content }]
                });
            }
        } else if (Array.isArray(clientHistory) && clientHistory.length > 0) {
            // Load from client supplied history
            for (const msg of clientHistory) {
                geminiHistory.push({
                    role: msg.role === "user" ? "user" : "model",
                    parts: [{ text: msg.text || msg.content || "" }]
                });
            }
        }

        // Append user's current message
        geminiHistory.push({
            role: "user",
            parts: [{ text: message.trim() }]
        });

        // Call Gemini
        const geminiResult = await runGeminiWithTools({
            messages: geminiHistory,
            context
        });

        // Save conversation to DB session
        if (!session) {
            session = new ChatSession({
                sessionId,
                guest: guestId,
                title: message.trim().substring(0, 40) + "...",
                messages: [],
                metadata: {
                    guestName: resolvedName,
                    guestPhone: resolvedPhone,
                    lastInteractionAt: new Date()
                }
            });
        }

        // Add user message
        session.messages.push({
            role: "user",
            content: message.trim(),
            createdAt: new Date()
        });

        // Add assistant reply with tools
        session.messages.push({
            role: "model",
            content: geminiResult.text,
            toolCalls: geminiResult.executedTools.map(t => ({ name: t.toolName, args: t.args })),
            toolResults: geminiResult.executedTools.map(t => t.result),
            createdAt: new Date()
        });

        if (resolvedName) session.metadata.guestName = resolvedName;
        if (resolvedPhone) session.metadata.guestPhone = resolvedPhone;
        session.metadata.lastInteractionAt = new Date();

        await session.save();

        return res.status(200).json({
            success: true,
            sessionId: session.sessionId,
            reply: geminiResult.text,
            executedTools: geminiResult.executedTools,
            modelUsed: geminiResult.modelUsed,
            timestamp: new Date()
        });
    } catch (error) {
        console.error("Chatbot sendMessage error:", error);
        return res.status(500).json({
            success: false,
            message: "حدث خطأ أثناء معالجة رسالة المساعد الذكي",
            error: error.message
        });
    }
};

// @desc Create a new chat session
// @route POST /api/chatbot/session
// @access Public / Private
const createSession = async (req, res) => {
    try {
        const { title, guestName, guestPhone } = req.body;
        const sessionId = generateSessionId();

        const guestId = req.guest ? req.guest._id : null;
        const name = (req.guest && req.guest.name) || guestName || "";
        const phone = (req.guest && req.guest.phone) || guestPhone || "";

        const session = await ChatSession.create({
            sessionId,
            guest: guestId,
            title: title || "محادثة جديدة مع المساعد الذكي",
            messages: [
                {
                    role: "model",
                    content: "أهلاً بك في أمريكان دريم! 🎉 أنا المساعد الذكي لمدينة الملاهي والمطعم. كيف أقدر أساعدك اليوم؟ حابب تستفسر عن تذاكر الألعاب، باقات التوفير، قائمة طعام المطعم، أو حابب تحجز طاولة؟",
                    createdAt: new Date()
                }
            ],
            metadata: {
                guestName: name,
                guestPhone: phone,
                lastInteractionAt: new Date()
            }
        });

        return res.status(201).json({
            success: true,
            sessionId: session.sessionId,
            initialMessage: session.messages[0].content,
            session
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "فشل في إنشاء جلسة المحادثة",
            error: error.message
        });
    }
};

// @desc Get chat history for a session
// @route GET /api/chatbot/session/:sessionId
// @access Public / Private
const getSessionHistory = async (req, res) => {
    try {
        const { sessionId } = req.params;
        const session = await ChatSession.findOne({ sessionId });

        if (!session) {
            return res.status(404).json({
                success: false,
                message: `جلسة المحادثة '${sessionId}' غير موجودة`
            });
        }

        return res.status(200).json({
            success: true,
            session: {
                sessionId: session.sessionId,
                title: session.title,
                messages: session.messages,
                metadata: session.metadata,
                createdAt: session.createdAt,
                updatedAt: session.updatedAt
            }
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "فشل في جلب سجل المحادثة",
            error: error.message
        });
    }
};

// @desc Clear / Delete chat session
// @route DELETE /api/chatbot/session/:sessionId
// @access Public / Private
const clearSession = async (req, res) => {
    try {
        const { sessionId } = req.params;
        const result = await ChatSession.findOneAndDelete({ sessionId });

        if (!result) {
            return res.status(404).json({
                success: false,
                message: `جلسة المحادثة '${sessionId}' غير موجودة`
            });
        }

        return res.status(200).json({
            success: true,
            message: "تم حذف جلسة المحادثة بنجاح"
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "فشل في حذف جلسة المحادثة",
            error: error.message
        });
    }
};

// @desc List all recent chat sessions
// @route GET /api/chatbot/sessions
// @access Public / Private
const listSessions = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        const query = {};
        if (req.guest) {
            query.guest = req.guest._id;
        }

        const sessions = await ChatSession.find(query)
            .select("sessionId title metadata createdAt updatedAt")
            .sort({ updatedAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();

        const total = await ChatSession.countDocuments(query);

        return res.status(200).json({
            success: true,
            count: sessions.length,
            total,
            page,
            totalPages: Math.ceil(total / limit),
            sessions
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "فشل في جلب قائمة الجلسات",
            error: error.message
        });
    }
};

// @desc Get available tools & capabilities
// @route GET /api/chatbot/tools
// @access Public
const getAvailableTools = async (req, res) => {
    try {
        const tools = chatbotToolDeclarations.map(t => ({
            name: t.name,
            description: t.description,
            parameters: t.parameters
        }));

        return res.status(200).json({
            success: true,
            totalTools: tools.length,
            tools
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// @desc Health check & test Gemini connectivity
// @route GET /api/chatbot/health
// @access Public
const healthCheck = async (req, res) => {
    try {
        const apiKey = process.env.GEMINAI_API || process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return res.status(500).json({
                success: false,
                status: "DEGRADED",
                message: "GEMINAI_API is missing from .env"
            });
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const testModel = genAI.getGenerativeModel({ model: CANDIDATE_MODELS[0] });
        const pingResult = await testModel.generateContent("ping");

        return res.status(200).json({
            success: true,
            status: "ONLINE",
            message: "Gemini API connected successfully",
            activeModel: CANDIDATE_MODELS[0],
            fallbackModels: CANDIDATE_MODELS.slice(1),
            testReply: pingResult.response.text().trim()
        });
    } catch (error) {
        return res.status(503).json({
            success: false,
            status: "ERROR",
            message: "فشل الاتصال بـ Gemini API",
            error: error.message
        });
    }
};

module.exports = {
    sendMessage,
    createSession,
    getSessionHistory,
    clearSession,
    listSessions,
    getAvailableTools,
    healthCheck
};
