# Email Sending Fix Plan

## Issue Analysis

After investigating the email sending issue, we've discovered why emails work from the contact page but not during survey publishing:

### Root Causes

1. **Environment Variable Access Method**
   - The contact page uses `import.meta.env.SMTP_HOST` (Astro's recommended way)
   - Our survey publish code uses `process.env.SMTP_HOST`

2. **SMTP Connection Verification**
   - The contact page explicitly verifies the SMTP connection before sending
   - It has robust error handling for connection failures

3. **Lack of Error Handling**
   - Survey publishing code lacks the same level of error isolation

### Contact Page Implementation (Working)

In `src/pages/api/send-email.ts`:
```javascript
// Environment variable access
const transporter = nodemailer.createTransport({
  host: import.meta.env.SMTP_HOST,
  port: parseInt(import.meta.env.SMTP_PORT),
  secure: false,
  auth: {
    user: import.meta.env.SMTP_USER,
    pass: import.meta.env.SMTP_PASS,
  },
});

// Connection verification
try {
  await transporter.verify();
  console.log("SMTP Connection Verified Successfully");
} catch (verificationError) {
  console.error("SMTP Verification Error:", verificationError);
  // Handle error...
}
```

## Recommended Fix

1. **Update Environment Variable Access**
   - Modify `emailUtils.ts` to use `import.meta.env` instead of `process.env`
   - Example:
   ```javascript
   const createTransporter = () => {
     return nodemailer.createTransport({
       host: import.meta.env.SMTP_HOST,
       port: parseInt(import.meta.env.SMTP_PORT || '587'),
       secure: import.meta.env.SMTP_SECURE === 'true',
       auth: {
         user: import.meta.env.SMTP_USER,
         pass: import.meta.env.SMTP_PASS,
       },
     });
   };
   ```

2. **Implement Proper Connection Verification**
   - Add explicit connection verification before sending emails:
   ```javascript
   export async function sendEmail(options: EmailOptions): Promise<void> {
     try {
       // Create transporter
       const transporter = createTransporter();
       
       // Verify connection
       try {
         await transporter.verify();
         console.log("SMTP Connection Verified Successfully");
       } catch (verificationError) {
         console.error("SMTP Verification Error:", verificationError);
         throw new Error(`SMTP verification failed: ${verificationError instanceof Error ? verificationError.message : 'Unknown error'}`);
       }
       
       // Send mail
       // ...existing code...
     } catch (error) {
       // ...existing error handling...
     }
   }
   ```

3. **Enhanced Error Handling**
   - Improve error handling to better isolate and report specific email issues

## Implementation Steps

1. Create a new branch for email fixes
2. Update `emailUtils.ts` with the above changes
3. Update any modules that depend on these functions
4. Test email sending through the survey publishing workflow
5. Merge changes once verified

## Fallback Options

If the above solution doesn't resolve the issue, consider:

1. Using a different email service provider
2. Implementing a queue system for email sending that retries failed emails
3. Using a third-party email API instead of direct SMTP

## Testing Strategy

1. Test with valid SMTP credentials
2. Test with invalid credentials to verify error handling
3. Test with missing credentials to verify graceful fallback
4. Test real email delivery to samuel.ellis.barefoot@gmail.com