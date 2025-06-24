# Vercel Deployment Guide for StoryMode

This guide provides comprehensive instructions for deploying the StoryMode application to Vercel.

### **Prerequisites**

1.  **Vercel Account**: You need a Vercel account. You can sign up for free at [vercel.com](https://vercel.com).
2.  **Git Repository**: Your project's code must be in a GitHub, GitLab, or Bitbucket repository.
3.  **Supabase Project**: You must have a live Supabase project created. This will serve as your production database, authentication, and storage provider.
4.  **SMTP Provider**: You need an account with a production-grade email service (e.g., SendGrid, Mailgun, Resend, AWS SES) to handle sending survey invitations and other emails.

---

### **Step 1: Import Your Project into Vercel**

1.  Log in to your Vercel dashboard.
2.  Click the "**Add New...**" button and select "**Project**".
3.  In the "**Import Git Repository**" section, find your project's repository and click the "**Import**" button next to it. If you haven't connected your Git provider yet, Vercel will guide you through that process.

---

### **Step 2: Configure Your Vercel Project**

Vercel is excellent at auto-detecting Astro projects. The default settings should be correct, but you can verify them:

*   **Framework Preset**: Should be automatically set to **Astro**.
*   **Build Command**: Should be `astro build`.
*   **Output Directory**: Should be `.vercel/output`.
*   **Install Command**: Should be `npm install`.

The most critical part of the configuration is setting up the environment variables.

---

### **Step 3: Configure Environment Variables**

Before you deploy, you must add your project's secrets and configuration keys to Vercel.

1.  In the "**Configure Project**" screen, expand the "**Environment Variables**" section.
2.  Add each of the variables from the table below. For sensitive keys like `SUPABASE_SERVICE_ROLE_KEY` and `SMTP_PASS`, Vercel encrypts them securely.

| Variable Name                 | Description / Where to Find It                                                                                                                                                                                 - **`PUBLIC_SUPABASE_URL`**: Your Supabase Project URL.
    - Go to your Supabase project dashboard.
    - Navigate to **Settings** (the gear icon) -> **API**.
    - Copy the **Project URL**.
- **`PUBLIC_SUPABASE_ANON_KEY`**: Your Supabase public API key.
    - On the same **API** settings page in Supabase.
    - Copy the **Project API Key** (the `anon` `public` key).
- **`SUPABASE_SERVICE_ROLE_KEY`**: Your Supabase secret service role key.
    - On the same **API** settings page in Supabase.
    - Click "**Show**" in the **Project API Keys** section and copy the `service_role` secret key.
- **`PUBLIC_BASE_URL`**: **This is critical.** The public URL of your Vercel deployment.
    - After your first deployment, Vercel will assign you a URL (e.g., `https://your-project-name.vercel.app`). You must add this URL here so that links generated in emails point to your live site.
- **`SMTP_HOST`**: The hostname of your email provider's SMTP server.
    - Find this in your email provider's documentation or account settings (e.g., `smtp.sendgrid.net`).
- **`SMTP_PORT`**: The port for your SMTP server.
    - Usually `587` (for TLS) or `465` (for SSL). Check your provider's documentation.
- **`SMTP_SECURE`**: Set to `true` or `false`.
    - Typically `true` if using port 465, `false` if using port 587.
- **`SMTP_USER`**: Your username for the SMTP service.
    - Often an API key name (like `apikey` for SendGrid) or a full username.
- **`SMTP_PASS`**: Your password or API key for the SMTP service.
    - This is a secret key provided by your email service.

---

### **Step 4: Deploy**

1.  After adding all the environment variables, click the "**Deploy**" button.
2.  Vercel will now start the build process, install dependencies, and deploy your application. You can monitor the progress in the "Deployments" tab.

---

### **Step 5: Post-Deployment**

1.  **Verify Domain**: Once the deployment is complete, visit the URL provided by Vercel to ensure your site is live.
2.  **Update `PUBLIC_BASE_URL`**: If you didn't set the `PUBLIC_BASE_URL` before the first deployment, go to your project's **Settings -> Environment Variables** on Vercel, add it now with your live URL, and then trigger a new deployment from the "Deployments" tab.
3.  **Test End-to-End Workflow**:
    *   Create a new survey.
    *   Add participants.
    *   Publish the survey and check if the participants receive the email invitations with the correct links.
    *   Complete the survey as a participant.
    *   Verify that the responses are saved correctly in your Supabase database.
    *   Check the "Thank You" page to ensure no inappropriate navigation links are present.

By following this guide, you will have a fully functional deployment of your application on Vercel, ready for end-to-end testing.