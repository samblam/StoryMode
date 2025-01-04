import type { APIRoute } from 'astro';
import nodemailer from 'nodemailer';
import { RateLimiter, RATE_LIMITS, rateLimitMiddleware } from '../../utils/rateLimit';
import { validateBody } from '../../utils/validationMiddleware';

export const POST: APIRoute = async ({ request }) => {
  const headers = {
    'Content-Type': 'application/json'
  };

  try {
    // Apply rate limiting middleware
    const rateLimitResponse = await rateLimitMiddleware('CONTACT')(request);
    if (rateLimitResponse instanceof Response) {
      return rateLimitResponse;
    }
    Object.assign(headers, rateLimitResponse.headers);

    const validation = await validateBody({
      name: 'name',
      email: 'email',
      message: 'description'
    })(request);

    if (validation instanceof Response) {
      return validation;
    }

    const { body } = validation;

    // Check if SMTP credentials are configured
    if (!import.meta.env.SMTP_USER || !import.meta.env.SMTP_PASS) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Email service not configured'
      }), {
        status: 500,
        headers
      });
    }

    // Create transporter
    const transporter = nodemailer.createTransport({
      host: import.meta.env.SMTP_HOST,
      port: parseInt(import.meta.env.SMTP_PORT),
      secure: false, // true for 465, false for other ports
      auth: {
        user: import.meta.env.SMTP_USER,
        pass: import.meta.env.SMTP_PASS,
      },
    });

    // Verify SMTP connection
    try {
        await transporter.verify();
        console.log("SMTP Connection Verified Successfully");
      } catch (verificationError) {
        console.error("SMTP Verification Error:", verificationError);
        return new Response(JSON.stringify({
          success: false,
          error: `SMTP verification failed: ${verificationError instanceof Error ? verificationError.message : 'Unknown error'}`
        }), {
          status: 500,
          headers
        });
      }

    // Get CC recipients
    const ccRecipients = import.meta.env.SMTP_CC?.split(',').filter(Boolean) || [];

    // Send mail
    const info = await transporter.sendMail({
      from: `"Story Mode Contact Form" <${import.meta.env.SMTP_USER}>`, // Use your authorized address here
      to: import.meta.env.SMTP_TO,
      cc: ccRecipients,
      subject: "New Contact Form Submission - Story Mode",
      text: body.message,
      html: `
        <h2>New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${body.name}</p>
        <p><strong>Email:</strong> ${body.email}</p>
        <p><strong>Message:</strong></p>
        <p>${body.message.replace(/\n/g, '<br>')}</p>
      `,
      replyTo: body.email, // Set the user's email as the reply-to address
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
    console.error('Email error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to send email';
    return new Response(JSON.stringify({
      success: false,
      error: errorMessage
    }), {
      status: 500,
      headers
    });
  }
};