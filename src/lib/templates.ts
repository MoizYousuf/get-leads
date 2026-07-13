export interface EmailTemplate {
  id: string;
  name: string;
  description: string;
  defaultSubject: string;
  defaultBody: string;
}

export const KHANANI_TEMPLATES: EmailTemplate[] = [
  {
    id: "website-creation",
    name: "Website Creation Proposal",
    description: "Cold pitch for businesses listed without an active website.",
    defaultSubject: "Building a professional website for {{name}} - Khanani Innovations",
    defaultBody: `I was looking up local services in {{city}} and came across {{name}}. I noticed that your business is currently operating without an active website.

In today's digital landscape, having a professional online presence is critical—it serves as your 24/7 storefront, establishes trust with prospective clients, and helps you stand out in search engines.

At Khanani Innovations (https://khananiinnovations.com), we build clean, modern, and mobile-friendly websites designed to attract local clients. We can set up a beautiful landing page, contact forms, and lead collection workflows for {{name}} in just a few days.

Would you be open to a quick, complimentary discussion about how we can establish your online presence?`
  },
  {
    id: "website-enhancement",
    name: "Website Enhancement Proposal",
    description: "Pitch for improving an existing client's website design and performance.",
    defaultSubject: "Proposal: Enhancing your business website - Khanani Innovations",
    defaultBody: `I was recently looking at your website and noticed some great opportunities to enhance its speed, visual design, and user experience to help drive more leads and conversions.

At Khanani Innovations (https://khananiinnovations.com), we specialize in building modern, high-performance web applications that not only look premium but are fully optimized to turn visitors into paying customers. 

We would love to do a quick, complimentary audit of your site and share some concrete ideas on how we can take it to the next level. Let me know if you have 10 minutes to connect this week.`
  },
  {
    id: "lead-generation-system",
    name: "Lead Generation Solution",
    description: "Offer to build a modern lead generation and email workflow app.",
    defaultSubject: "Automate your lead generation & client outreach - Khanani Innovations",
    defaultBody: `Many businesses lose potential leads due to slow follow-ups or lack of automated outreach. We help companies solve this by building custom, minimal, and premium lead management dashboards at Khanani Innovations (https://khananiinnovations.com).

We can build a tailored application for your team that integrates directly with APIs like Resend, Twilio, and Stripe to automate your entire workflow.

Would you be open to a brief call to see a demo of our custom solutions?`
  },
  {
    id: "general-outreach",
    name: "General Digital Partnership",
    description: "General introduction to Khanani Innovations' digital development services.",
    defaultSubject: "Collaboration Opportunity with Khanani Innovations",
    defaultBody: `I'm reaching out from Khanani Innovations (https://khananiinnovations.com). We partner with businesses to design, develop, and scale state-of-the-art web applications, custom CRM platforms, and automated workflow systems.

Our focus is on premium aesthetics, top-tier performance, and highly intuitive user interfaces that set your business apart from competitors.

If you are looking to build new digital products or modernise your existing systems this year, we would love to schedule a brief introductory call to discuss how we can support you.`
  },
  {
    id: "custom",
    name: "Custom / Blank Template",
    description: "A blank template to write your own custom subject and body from scratch.",
    defaultSubject: "",
    defaultBody: ""
  }
];

/**
 * Wraps the email content in a premium HTML frame with the Khanani Innovations branding.
 */
export function generateEmailHtml(subject: string, bodyText: string, hasLogo = false, logoUrl?: string): string {
  const formattedBody = bodyText.replace(/\n/g, "<br />");
  
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>${subject}</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            background-color: #f9fafb;
            color: #1f2937;
            margin: 0;
            padding: 0;
          }
          .container {
            max-width: 600px;
            margin: 40px auto;
            background-color: #ffffff;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
            border: 1px solid #f3f4f6;
          }
          .header {
            background-color: #ffffff;
            padding: 32px 24px;
            text-align: center;
            border-b: 1px solid #f3f4f6;
          }
          .logo-text {
            font-size: 24px;
            font-weight: 800;
            letter-spacing: -0.025em;
            color: #111827;
            margin: 0;
          }
          .logo-text span {
            color: #4f46e5;
          }
          .logo-img {
            max-height: 80px;
            width: auto;
            display: inline-block;
          }
          .content {
            padding: 40px;
            font-size: 15px;
            line-height: 1.7;
            color: #374151;
          }
          .footer {
            background-color: #f9fafb;
            padding: 24px 40px;
            text-align: center;
            border-top: 1px solid #f3f4f6;
            font-size: 12px;
            color: #6b7280;
          }
          .footer a {
            color: #4f46e5;
            text-decoration: none;
          }
          .divider {
            height: 1px;
            background-color: #f3f4f6;
            margin: 28px 0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            ${
              hasLogo && logoUrl
                ? `<img src="${logoUrl}" alt="Khanani Innovations" class="logo-img" />`
                : `<img src="https://khananiinnovations.com/khanani-logo.png" alt="Khanani Innovations" class="logo-img" style="max-height: 80px; object-fit: contain;" />`
            }
          </div>
          <div class="content">
            ${formattedBody}
            <div style="text-align: center; margin: 36px 0 28px 0;">
              <a href="https://khananiinnovations.com" target="_blank" style="background: linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%); color: #ffffff !important; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-size: 11px; font-weight: bold; letter-spacing: 0.05em; text-transform: uppercase; display: inline-block; box-shadow: 0 4px 10px rgba(79, 70, 229, 0.2);">
                Schedule a Complimentary Strategy Call
              </a>
            </div>
            <div class="divider"></div>
            <p style="margin: 0; font-size: 13px; font-weight: 500; color: #6b7280;">Best regards,</p>
            <p style="margin: 6px 0 2px 0; font-size: 14px; font-weight: 800; color: #4f46e5;">Khanani Innovations Team</p>
            <p style="margin: 0; font-size: 10px; font-weight: 700; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.05em;">Web Development & Automation Solutions</p>
            <p style="margin: 6px 0 0 0; font-size: 12px; font-weight: 600; color: #0284c7;"><a href="https://khananiinnovations.com" target="_blank" style="color: #0284c7; text-decoration: none;">khananiinnovations.com</a></p>
          </div>
          <div class="footer">
            <p style="margin: 0 0 8px 0;">&copy; ${new Date().getFullYear()} <a href="https://khananiinnovations.com" target="_blank" style="color: #4f46e5; text-decoration: none;">Khanani Innovations</a>. All rights reserved.</p>
            <p style="margin: 0;">You are receiving this email as business outreach. If you prefer not to receive further emails, please reply with "Unsubscribe".</p>
          </div>
        </div>
      </body>
    </html>
  `;
}
