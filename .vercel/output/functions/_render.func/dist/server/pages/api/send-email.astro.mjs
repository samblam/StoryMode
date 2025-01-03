import nodemailer from 'nodemailer';
import { R as RateLimiter, a as RATE_LIMITS } from '../../chunks/rateLimit_D-TMYXgA.mjs';
export { renderers } from '../../renderers.mjs';

const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};
const sanitizeInput = (input) => {
  return input.trim().replace(/[<>]/g, "").slice(0, 1e3);
};
const POST = async ({ request }) => {
  const headers = {
    "Content-Type": "application/json"
  };
  try {
    const clientIp = request.headers.get("x-forwarded-for")?.split(",")[0] || request.headers.get("x-real-ip") || "unknown";
    const rateLimitKey = RateLimiter.getKey(clientIp, "send-email");
    const rateLimitResult = RateLimiter.check(rateLimitKey, RATE_LIMITS.CONTACT);
    Object.assign(headers, RateLimiter.getHeaders(rateLimitResult));
    if (!rateLimitResult.success) {
      return new Response(JSON.stringify({
        success: false,
        error: "Too many email attempts. Please try again later."
      }), {
        status: 429,
        headers
      });
    }
    const data = await request.json();
    const { name, email, message } = data;
    const sanitizedName = sanitizeInput(name);
    const sanitizedMessage = sanitizeInput(message);
    if (!sanitizedName || !email || !sanitizedMessage) {
      return new Response(JSON.stringify({
        success: false,
        error: "All fields are required"
      }), {
        status: 400,
        headers
      });
    }
    if (!validateEmail(email)) {
      return new Response(JSON.stringify({
        success: false,
        error: "Invalid email format"
      }), {
        status: 400,
        headers
      });
    }
    if (false) ;
    const transporter = nodemailer.createTransport({
      host: "smtp.purelymail.com",
      port: parseInt("587"),
      secure: false,
      // true for 465, false for other ports
      auth: {
        user: "info@storymode.ca",
        pass: "StoryModeNickBenSam"
      }
    });
    try {
      await transporter.verify();
      console.log("SMTP Connection Verified Successfully");
    } catch (verificationError) {
      console.error("SMTP Verification Error:", verificationError);
      return new Response(JSON.stringify({
        success: false,
        error: `SMTP verification failed: ${verificationError instanceof Error ? verificationError.message : "Unknown error"}`
      }), {
        status: 500,
        headers
      });
    }
    const ccRecipients = "sam@storymode.ca,nick@storymode.ca,ben@storymode.ca"?.split(",").filter(Boolean) || [];
    const info = await transporter.sendMail({
      from: `"Story Mode Contact Form" <${"info@storymode.ca"}>`,
      // Use your authorized address here
      to: "info@storymode.ca",
      cc: ccRecipients,
      subject: "New Contact Form Submission - Story Mode",
      text: sanitizedMessage,
      html: `
        <h2>New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${sanitizedName}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Message:</strong></p>
        <p>${sanitizedMessage.replace(/\n/g, "<br>")}</p>
      `,
      replyTo: email
      // Set the user's email as the reply-to address
    });
    console.log("Email Sent Info:", info);
    return new Response(JSON.stringify({
      success: true,
      messageId: info.messageId
    }), {
      status: 200,
      headers
    });
  } catch (error) {
    console.error("Email error:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to send email";
    return new Response(JSON.stringify({
      success: false,
      error: errorMessage
    }), {
      status: 500,
      headers
    });
  }
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  POST
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
