import nodemailer from 'nodemailer';
import type { Survey } from '../types/database';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
  replyTo?: string;
  attachments?: Array<{
    filename: string;
    content: string | Buffer;
    contentType?: string;
  }>;
}

interface EmailError extends Error {
  code?: string;
  command?: string;
}

interface EmailTemplate {
  subject: string;
  html: string;
}

// Create reusable transporter object using environment variables
const createTransporter = () => {
  // Get environment variables using Astro's approach
  const host = import.meta.env.SMTP_HOST;
  const port = parseInt(import.meta.env.SMTP_PORT || '587');
  const secure = import.meta.env.SMTP_SECURE === 'true';
  const user = import.meta.env.SMTP_USER;
  const pass = import.meta.env.SMTP_PASS;
  
  // Log SMTP configuration (without sensitive information)
  console.log('Creating email transporter with:', {
    host,
    port,
    secure,
    // Do not log credentials
    auth: user ? 'configured' : 'missing',
  });
  
  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user,
      pass,
    },
    // Add connection timeout options
    connectionTimeout: 5000, // 5 seconds
    greetingTimeout: 5000,   // 5 seconds
    socketTimeout: 10000,    // 10 seconds
    tls: {
      rejectUnauthorized: false
    }
  });
};

// Verify SMTP connection
const verifyTransporter = async (transporter: any): Promise<boolean> => {
  try {
    await transporter.verify();
    console.log('SMTP connection verified successfully');
    return true;
  } catch (error) {
    console.error('SMTP connection verification failed:', error);
    return false;
  }
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
    from = `"Story Mode" <${import.meta.env.SMTP_USER}>`,
    replyTo,
    attachments = [],
  } = options;

  try {
    // Validate email address format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(to)) {
      throw new Error(`Invalid recipient email address: ${to}`);
    }

    // Log special handling for test email
    const isTestEmail = to === 'samuel.ellis.barefoot@gmail.com';
    if (isTestEmail) {
      console.log(`Preparing to send email to test address: ${to}`);
    }

    // Create transporter
    const transporter = createTransporter();
    
    // Verify SMTP connection for test emails or when SMTP host is not localhost
    const smtpHost = import.meta.env.SMTP_HOST;
    const smtpPort = import.meta.env.SMTP_PORT;
    
    if (isTestEmail || smtpHost !== '127.0.0.1') {
      const isVerified = await verifyTransporter(transporter);
      if (!isVerified) {
        // For test emails, log the error but continue attempting to send
        if (isTestEmail) {
          console.warn(`Failed to verify SMTP connection, but attempting to send to test email ${to} anyway`);
        } else {
          throw new Error(`Failed to verify SMTP connection to ${smtpHost}:${smtpPort}`);
        }
      }
    }

    // Send mail with enhanced options
    console.log(`Sending email to ${to} with subject: ${subject}`);
    await transporter.sendMail({
      from,
      to,
      subject,
      html,
      replyTo,
      attachments,
      headers: {
        'X-Priority': '1', // High priority
        'X-MSMail-Priority': 'High',
        'Importance': 'High'
      }
    });
    
    console.log(`Successfully sent email to ${to}`);
  } catch (error: unknown) {
    console.error('Error sending email:', error);
    
    // Enhanced error details
    let errorDetails = '';
    if (error instanceof Error) {
      const emailError = error as EmailError;
      
      // Add specific diagnostics based on error code
      if (emailError.code === 'ECONNREFUSED') {
        errorDetails = `Connection refused to SMTP server ${import.meta.env.SMTP_HOST}:${import.meta.env.SMTP_PORT}. Check if the server is running and accessible.`;
      } else if (emailError.code === 'ETIMEDOUT') {
        errorDetails = `Connection to SMTP server timed out. Check network connectivity and server status.`;
      } else if (emailError.code === 'EAUTH') {
        errorDetails = `Authentication failed. Check SMTP_USER and SMTP_PASS credentials.`;
      } else {
        errorDetails = `${emailError.message}${emailError.code ? ` (${emailError.code})` : ''}`;
      }
      
      throw new Error(`Failed to send email to ${to}: ${errorDetails}`);
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

/**
 * Creates a survey invitation email template
 * @param survey The survey object
 * @param participantName The name of the participant
 * @param surveyUrl The unique URL for the participant to access the survey
 * @returns Email template with subject and HTML content
 */
export function createSurveyInvitationEmail(
  survey: Survey,
  participantName: string,
  surveyUrl: string
): EmailTemplate {
  const subject = `Survey Invitation: ${survey.title}`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h2 style="color: #4a5568; margin-bottom: 10px;">You're invited to participate in a survey</h2>
        <div style="height: 3px; background-color: #4299e1; width: 100px; margin: 0 auto;"></div>
      </div>
      
      <p style="color: #4a5568; font-size: 16px;">Hello ${participantName || 'Participant'},</p>
      
      <p style="color: #4a5568; font-size: 16px;">You have been invited to participate in the survey: <strong>${survey.title}</strong></p>
      
      ${survey.description ? `<p style="color: #4a5568; font-size: 16px;">${survey.description}</p>` : ''}
      
      <p style="color: #4a5568; font-size: 16px;">This survey involves listening to various sounds and providing your feedback. Your participation is valuable and will help us gather important insights.</p>
      
      <p style="color: #4a5568; font-size: 16px;">Please click the button below to access your unique survey:</p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${surveyUrl}" style="background-color: #4299e1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">
          Start Survey
        </a>
      </div>
      
      <p style="color: #4a5568; font-size: 16px;">If the button above doesn't work, you can copy and paste the following link into your browser:</p>
      <p style="text-align: center;">
        <a href="${surveyUrl}" style="color: #4299e1; word-break: break-all;">${surveyUrl}</a>
      </p>
      
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
        <p style="color: #718096; font-size: 14px;">This link is unique to you and should not be shared with others.</p>
        <p style="color: #718096; font-size: 14px;">If you have any questions, please contact us by replying to this email.</p>
      </div>
    </div>
  `;
  
  return { subject, html };
}

/**
 * Creates a survey reminder email template
 * @param survey The survey object
 * @param participantName The name of the participant
 * @param surveyUrl The unique URL for the participant to access the survey
 * @returns Email template with subject and HTML content
 */
export function createSurveyReminderEmail(
  survey: Survey,
  participantName: string,
  surveyUrl: string
): EmailTemplate {
  const subject = `Reminder: Your Survey "${survey.title}" is Waiting`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h2 style="color: #4a5568; margin-bottom: 10px;">Reminder: Your Survey is Waiting</h2>
        <div style="height: 3px; background-color: #ed8936; width: 100px; margin: 0 auto;"></div>
      </div>
      
      <p style="color: #4a5568; font-size: 16px;">Hello ${participantName || 'Participant'},</p>
      
      <p style="color: #4a5568; font-size: 16px;">This is a friendly reminder that you were invited to participate in the survey: <strong>${survey.title}</strong></p>
      
      <p style="color: #4a5568; font-size: 16px;">We noticed you haven't completed the survey yet. Your feedback is important to us, and we would greatly appreciate your participation.</p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${surveyUrl}" style="background-color: #ed8936; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">
          Complete Survey Now
        </a>
      </div>
      
      <p style="color: #4a5568; font-size: 16px;">If the button above doesn't work, you can copy and paste the following link into your browser:</p>
      <p style="text-align: center;">
        <a href="${surveyUrl}" style="color: #ed8936; word-break: break-all;">${surveyUrl}</a>
      </p>
      
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
        <p style="color: #718096; font-size: 14px;">This link is unique to you and should not be shared with others.</p>
        <p style="color: #718096; font-size: 14px;">If you have any questions or if you believe you've received this email in error, please contact us by replying to this email.</p>
      </div>
    </div>
  `;
  
  return { subject, html };
}

/**
 * Creates a survey completion confirmation email template
 * @param survey The survey object
 * @param participantName The name of the participant
 * @returns Email template with subject and HTML content
 */
export function createSurveyCompletionEmail(
  survey: Survey,
  participantName: string
): EmailTemplate {
  const subject = `Thank You for Completing the Survey: ${survey.title}`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h2 style="color: #4a5568; margin-bottom: 10px;">Thank You for Your Participation</h2>
        <div style="height: 3px; background-color: #48bb78; width: 100px; margin: 0 auto;"></div>
      </div>
      
      <p style="color: #4a5568; font-size: 16px;">Hello ${participantName || 'Participant'},</p>
      
      <p style="color: #4a5568; font-size: 16px;">Thank you for completing the survey: <strong>${survey.title}</strong></p>
      
      <p style="color: #4a5568; font-size: 16px;">Your feedback is extremely valuable and will help us in our research and development efforts.</p>
      
      <div style="text-align: center; margin: 30px 0;">
        <div style="background-color: #f0fff4; border: 1px solid #c6f6d5; border-radius: 4px; padding: 15px; display: inline-block;">
          <span style="color: #48bb78; font-size: 24px;">✓</span>
          <span style="color: #4a5568; font-size: 16px; margin-left: 10px;">Survey Successfully Completed</span>
        </div>
      </div>
      
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
        <p style="color: #718096; font-size: 14px;">If you have any questions or additional feedback, please feel free to contact us by replying to this email.</p>
        <p style="color: #718096; font-size: 14px;">Thank you again for your participation!</p>
      </div>
    </div>
  `;
  
  return { subject, html };
}