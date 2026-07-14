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
    defaultSubject: "{{name}}, you're losing customers to competitors with a website",
    defaultBody: `Hi {{name}} team,

While researching businesses in {{city}}, I noticed you don't have a website yet — which likely means potential customers searching Google right now are landing on your competitors instead of you.

That's a real, ongoing cost: roughly 80% of consumers research a business online before calling or visiting. A website is no longer a "nice to have" — it's your 24/7 storefront, your credibility signal, and often the deciding factor between you and the business one search result down.

I'm Khanani Innovations (https://khananiinnovations.com) — we design and build fast, mobile-first websites for local businesses like yours, complete with contact forms, click-to-call, and Google Maps integration so new customers can reach you in seconds. Most projects go from kickoff to live site in about a week.

I'd like to offer you a free, no-obligation mockup of what your website could look like — no cost, no commitment, just so you can see the opportunity firsthand. Would you be open to a quick 10-minute call this week to discuss?

Looking forward to helping {{name}} get found online.`
  },
  {
    id: "website-enhancement",
    name: "Website Enhancement Proposal",
    description: "Pitch for improving an existing client's website design and performance.",
    defaultSubject: "A few quick wins I spotted on {{name}}'s website",
    defaultBody: `Hi {{name}} team,

I took a look at your website today and wanted to reach out directly — there are a few clear opportunities to improve load speed, mobile experience, and overall design that could be costing you leads without you realizing it. Studies show over half of visitors leave a site that takes more than 3 seconds to load, and first impressions form in the first 50 milliseconds.

At Khanani Innovations (https://khananiinnovations.com), we specialize in modernizing existing sites — sharper design, faster performance, and clearer calls-to-action that turn more of your visitors into paying customers, without you having to start from scratch.

I'd be glad to send over a free, no-obligation audit of your site with specific, actionable recommendations — genuinely useful whether or not we end up working together. Do you have 10 minutes this week for a quick call?`
  },
  {
    id: "lead-generation-system",
    name: "Lead Generation & Automation System",
    description: "Offer to build a modern lead generation and email workflow app.",
    defaultSubject: "Stop losing leads to slow follow-up, {{name}}",
    defaultBody: `Hi {{name}} team,

Here's a statistic worth thinking about: businesses that follow up with a new lead within 5 minutes are 21x more likely to convert it, yet most teams take hours (or days) because follow-up is still manual. That gap is where revenue quietly disappears.

At Khanani Innovations (https://khananiinnovations.com), we build custom lead management and outreach systems — clean dashboards that capture, track, and automatically follow up with every lead the moment it comes in, integrated with tools like Resend, Twilio, and Stripe so nothing falls through the cracks.

I'd love to walk you through a live demo tailored to how {{name}} currently handles leads, and show you exactly where automation could save time and win more business. Would this week or next work for a brief call?`
  },
  {
    id: "general-outreach",
    name: "General Digital Partnership",
    description: "General introduction to Khanani Innovations' digital development services.",
    defaultSubject: "Partnering with {{name}} on your next digital project",
    defaultBody: `Hi {{name}} team,

I'm reaching out from Khanani Innovations (https://khananiinnovations.com). We partner with growing businesses to design, build, and scale premium web applications, custom CRM platforms, and automated workflow systems — the kind of digital foundation that lets you compete with, and outpace, much larger competitors.

Every project we take on is built around three things: premium design, genuinely fast performance, and interfaces your customers actually enjoy using. We keep our client roster intentionally small so every project gets senior-level attention from start to finish.

If {{name}} is planning to build something new or modernize an existing system this year, I'd welcome the chance to hear about it on a brief, no-pressure call — even just to compare notes on what's possible.`
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
export function generateEmailHtml(
  subject: string,
  bodyText: string,
  hasLogo = false,
  logoUrl?: string,
  screenshotCid?: string
): string {
  const formattedBody = bodyText.replace(/\n/g, "<br />");
  const screenshotBlock = screenshotCid
    ? `<div style="margin: 28px 0; border-radius: 10px; overflow: hidden; border: 1px solid #e5e7eb; box-shadow: 0 4px 10px rgba(0,0,0,0.06);">
        <img src="${screenshotCid}" alt="Website preview" style="display: block; width: 100%; height: auto;" />
      </div>`
    : "";

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
            border-radius: 14px;
            overflow: hidden;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
            border: 1px solid #f3f4f6;
          }
          .accent-bar {
            height: 4px;
            background: linear-gradient(90deg, #0F172A 0%, #0369A1 100%);
          }
          .header {
            background-color: #ffffff;
            padding: 28px 24px 24px;
            text-align: center;
            border-bottom: 1px solid #f3f4f6;
          }
          .logo-text {
            font-size: 24px;
            font-weight: 800;
            letter-spacing: -0.025em;
            color: #111827;
            margin: 0;
          }
          .logo-text span {
            color: #0369A1;
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
            color: #0369A1;
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
          <div class="accent-bar"></div>
          <div class="header">
            ${
              hasLogo && logoUrl
                ? `<img src="${logoUrl}" alt="Khanani Innovations" class="logo-img" />`
                : `<img src="https://khananiinnovations.com/khanani-logo.png" alt="Khanani Innovations" class="logo-img" style="max-height: 80px; object-fit: contain;" />`
            }
          </div>
          <div class="content">
            ${formattedBody}
            ${screenshotBlock}
            <div class="divider"></div>
            <p style="margin: 0; font-size: 13px; font-weight: 500; color: #6b7280;">Best regards,</p>
            <p style="margin: 6px 0 2px 0; font-size: 15px; font-weight: 800; color: #0F172A;">Khanani Innovations Team</p>
            <p style="margin: 0; font-size: 10px; font-weight: 700; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.05em;">Web Development & Automation Solutions</p>
            <p style="margin: 6px 0 0 0; font-size: 12px; font-weight: 600;"><a href="https://khananiinnovations.com" target="_blank" style="color: #0369A1; text-decoration: none;">khananiinnovations.com</a></p>
          </div>
          <div class="footer">
            <p style="margin: 0 0 8px 0;">&copy; ${new Date().getFullYear()} <a href="https://khananiinnovations.com" target="_blank" style="color: #0369A1; text-decoration: none;">Khanani Innovations</a>. All rights reserved.</p>
            <p style="margin: 0;">You are receiving this email as business outreach. If you prefer not to receive further emails, please reply with "Unsubscribe".</p>
          </div>
        </div>
      </body>
    </html>
  `;
}
