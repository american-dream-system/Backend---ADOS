const { google } = require("googleapis");
const nodemailer = require("nodemailer");
const asyncHandler = require("express-async-handler");

const sendEmail = asyncHandler(async (options) => {
    // If OAuth2 credentials are not set in .env, log in development mode gracefully
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET || !process.env.GOOGLE_REFRESH_TOKEN) {
        console.warn("⚠️ Google OAuth2 credentials not set in .env. Logging email in dev mode:");
        console.log(`📧 [EMAIL TO]: ${options.to}`);
        console.log(`📧 [SUBJECT]: ${options.subject}`);
        return true;
    }

    // Create OAuth2 client
    const oAuth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        "https://developers.google.com/oauthplayground",
    );

    oAuth2Client.setCredentials({
        refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
    });

    // Get fresh access token
    const accessToken = await oAuth2Client.getAccessToken();

    const senderEmail = (process.env.USER_NAME && process.env.USER_NAME.includes("@"))
        ? process.env.USER_NAME
        : (process.env.EMAIL_USER || "jar.academy1@gmail.com");

    // Create transporter
    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            type: "OAuth2",
            user: senderEmail,
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            refreshToken: process.env.GOOGLE_REFRESH_TOKEN,
            accessToken: accessToken ? accessToken.token : undefined,
        },
    });

    const emailOptions = {
        from: `American Dream <${senderEmail}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
    };

    // Send mail
    const result = await transporter.sendMail(emailOptions);
    if (!result) {
        throw new Error(`Failed to send email to ${options.to}`);
    }
    console.log("mail is sent 💌");
    return result;
});

module.exports = sendEmail;
