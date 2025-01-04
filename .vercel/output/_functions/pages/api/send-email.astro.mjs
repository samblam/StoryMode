import nodemailer from 'nodemailer';
import { r as rateLimitMiddleware } from '../../chunks/rateLimit_FwDC2vWM.mjs';
import { v as validateBody } from '../../chunks/validationMiddleware_-_YZoV9A.mjs';
export { renderers } from '../../renderers.mjs';

const POST = async ({ request }) => {
  const headers = {
    "Content-Type": "application/json"
  };
  try {
    const rateLimitResponse = await rateLimitMiddleware("CONTACT")(request);
    if (rateLimitResponse instanceof Response) {
      return rateLimitResponse;
    }
    Object.assign(headers, rateLimitResponse.headers);
    const validation = await validateBody({
      name: "name",
      email: "email",
      message: "description"
    })(request);
    if (validation instanceof Response) {
      return validation;
    }
    const { body } = validation;
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
      text: body.message,
      html: `
        <h2>New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${body.name}</p>
        <p><strong>Email:</strong> ${body.email}</p>
        <p><strong>Message:</strong></p>
        <p>${body.message.replace(/\n/g, "<br>")}</p>
      `,
      replyTo: body.email
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
