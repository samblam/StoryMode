import nodemailer from 'nodemailer';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

interface EmailError extends Error {
  code?: string;
  command?: string;
}

// Create reusable transporter object using environment variables
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

/**
 * Sends an email using the configured SMTP transport
 * @param options Email options including recipient, subject, and HTML content
 */
export async function sendEmail(options: EmailOptions): Promise<void> {
  const {
    to,
    subject,
    html,
    from = process.env.SMTP_FROM || 'noreply@example.com',
  } = options;

  try {
    // Validate email address format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(to)) {
      throw new Error(`Invalid recipient email address: ${to}`);
    }

    // Create transporter
    const transporter = createTransporter();

    // Send mail
    await transporter.sendMail({
      from,
      to,
      subject,
      html,
    });
  } catch (error: unknown) {
    console.error('Error sending email:', error);
    
    // Handle different types of errors
    if (error instanceof Error) {
      const emailError = error as EmailError;
      throw new Error(
        `Failed to send email to ${to}: ${emailError.message}${
          emailError.code ? ` (${emailError.code})` : ''
        }`
      );
    } else {
      throw new Error(`Failed to send email to ${to}: Unknown error occurred`);
    }
  }
}

/**
 * Sends emails in batches to avoid overwhelming the SMTP server
 * @param emails Array of email options to send
 * @param batchSize Number of emails to send in each batch
 */
export async function sendEmailBatch(
  emails: EmailOptions[],
  batchSize: number = 50
): Promise<{ success: string[]; failed: string[] }> {
  const results = {
    success: [] as string[],
    failed: [] as string[],
  };

  // Process emails in batches
  for (let i = 0; i < emails.length; i += batchSize) {
    const batch = emails.slice(i, i + batchSize);
    
    // Send emails in parallel within each batch
    const promises = batch.map(async (email) => {
      try {
        await sendEmail(email);
        results.success.push(email.to);
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        console.error(`Failed to send email to ${email.to}:`, errorMessage);
        results.failed.push(email.to);
      }
    });

    // Wait for all emails in the batch to complete
    await Promise.all(promises);

    // Add a small delay between batches to avoid rate limiting
    if (i + batchSize < emails.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  return results;
}