# Khanani Innovations - Lead Sender & Discovery Console

An intelligent, premium outbox outreach automation console and local client discovery crawler. Search target leads in any industry, scrape emails concurrently, send customized cold campaigns with configurable throttling, and capture replies inside a webhook inbox with WhatsApp alerts.

---

## 🚀 Key Features

* **Smart Client Discovery**: Scrapes Google Local business listings via SerpApi and runs concurrent page crawlers to discover contact emails.
* **Email Composer**: Supports Single and Bulk outreach modes.
* **Dynamic Variable Interpolation**: Use tags like `{{name}}`, `{{city}}`, `{{niche}}`, `{{website}}`, and `{{phone}}` to personalize templates.
* **Throttle Sending**: Range slider (1 to 20 seconds) to pace API dispatches, avoiding spam flags.
* **Outbox Log Tracker**: Links contacted prospects back to history with **"Email Sent" badge** deep links.
* **Webhook Inbox**: Listens for Resend inbound reply webhooks and allows sandbox testing via simulators.
* **WhatsApp Alerts Hook**: Forwards inbound reply notifications to a configured WhatsApp webhook endpoint (Zapier, Twilio, Make.com).
* **Premium Responsive UI**: Styled with glassmorphism overlays, animated active navigation capsules, and glowing input rings optimized for mobile viewports.

---

## 🛠️ Environment Configuration

Create a `.env` file in the root of the project:

```env
# Resend API Credentials (Get from https://resend.com)
RESEND_API_KEY=re_your_resend_api_key
RESEND_FROM_EMAIL=hello@yourverifieddomain.com

# From Email Address (Must be verified in Resend, or use "onboarding@resend.dev" for testing)
RESEND_FROM_EMAIL=hello@khananiinnovations.com

# SerpApi Key for Google Local Listings (Get from https://serpapi.com)
SERPAPI_API_KEY=your_serpapi_api_key

# Optional: WhatsApp Webhook Alerts Forwarder (e.g., Twilio, Make.com, or Zapier)
# Receives a POST request with { "message": "string" } when a reply is received
WHATSAPP_WEBHOOK_URL=https://hook.us1.make.com/your_unique_webhook_id
```

---

## 🏃 Getting Started

### 1. Install Dependencies
```bash
npm install
# or
yarn install
```

### 2. Run Development Server
```bash
npm run dev
# or
yarn dev
```
Open [http://localhost:3000](http://localhost:3000) to access the console locally.

### 3. Build for Production
```bash
npm run build
```

---

## 🔗 Make.com & WhatsApp Alerts Setup

To receive incoming lead replies directly on your personal WhatsApp:
1. Create a scenario in [Make.com](https://www.make.com) with a **Custom Webhook** trigger.
2. Paste the generated Make webhook URL into your `.env` as `WHATSAPP_WEBHOOK_URL`.
3. In your app, go to `/inbox` and click **Simulate Reply** to send sample schema fields to Make.
4. Add a **Twilio (WhatsApp)** or **WhatsApp Business Cloud** module in Make, connect it to your phone, and map the trigger's `message` field.
5. Turn the scenario Scheduling to **ON**.

---

## 🌐 Production Deployment

Deploy the Next.js app to **Vercel** or another host:
1. Connect your repository to Vercel.
2. Input all environment variables (`RESEND_API_KEY`, `SERPAPI_API_KEY`, etc.).
3. Configure the **Inbound Webhook** in your Resend Dashboard to point to your live site:
   `https://yourdomain.com/api/webhooks/inbound`
4. Set up domain MX records in Resend so replies are routed to the webhook endpoint.
