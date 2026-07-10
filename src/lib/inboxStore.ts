import fs from "fs";
import path from "path";

export interface InboundEmail {
  id: string;
  from: string;
  fromName?: string;
  to: string[];
  subject: string;
  text?: string;
  html?: string;
  date: string;
  replyTo?: string;
}

const DATA_DIR = path.join(process.cwd(), "data");
const INBOX_FILE = path.join(DATA_DIR, "inbox.json");

// In-memory fallback for read-only filesystems (like Vercel)
const globalInbox = global as unknown as { __inboxStore?: InboundEmail[] };
if (!globalInbox.__inboxStore) {
  globalInbox.__inboxStore = [];
}

const getWorkerUrl = () => {
  return process.env.CLOUDFLARE_WORKER_URL || "";
};

const initStore = (): boolean => {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(INBOX_FILE)) {
      fs.writeFileSync(INBOX_FILE, JSON.stringify([], null, 2), "utf-8");
    }
    return true;
  } catch (error) {
    console.warn("Failed to initialize file store (likely read-only environment like Vercel).");
    return false;
  }
};

export const getInbox = async (): Promise<InboundEmail[]> => {
  const workerUrl = getWorkerUrl();
  if (workerUrl) {
    try {
      const res = await fetch(`${workerUrl}/api/inbox`, { cache: "no-store" });
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        return json.data;
      }
    } catch (e) {
      console.error("Failed to fetch inbox from Cloudflare Worker KV:", e);
    }
  }

  if (initStore()) {
    try {
      const content = fs.readFileSync(INBOX_FILE, "utf-8");
      const fileEmails = JSON.parse(content) as InboundEmail[];
      
      // Combine with in-memory emails to ensure we don't lose emails written in memory
      const combined = [...globalInbox.__inboxStore!, ...fileEmails];
      // Deduplicate by ID
      const seen = new Set();
      return combined.filter(email => {
        if (seen.has(email.id)) return false;
        seen.add(email.id);
        return true;
      });
    } catch (error) {
      console.error("Failed to read inbox file:", error);
    }
  }
  return globalInbox.__inboxStore || [];
};

export const addEmailToInbox = async (email: Omit<InboundEmail, "id" | "date">): Promise<InboundEmail> => {
  const newEmail: InboundEmail = {
    ...email,
    id: `in_msg_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
    date: new Date().toISOString()
  };

  const workerUrl = getWorkerUrl();
  if (workerUrl) {
    try {
      const res = await fetch(`${workerUrl}/api/inbox`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newEmail)
      });
      const json = await res.json();
      if (json.success) return newEmail;
    } catch (e) {
      console.error("Failed to write email to Cloudflare Worker KV:", e);
    }
  }

  const fileStoreAvailable = initStore();
  if (fileStoreAvailable) {
    try {
      const emails = await getInbox();
      emails.unshift(newEmail);
      fs.writeFileSync(INBOX_FILE, JSON.stringify(emails, null, 2), "utf-8");
      return newEmail;
    } catch (error) {
      console.error("Failed to write to file inbox store:", error);
    }
  }

  // Fallback to in-memory store
  globalInbox.__inboxStore!.unshift(newEmail);
  return newEmail;
};

export const deleteEmailFromInbox = async (id: string): Promise<boolean> => {
  const workerUrl = getWorkerUrl();
  if (workerUrl) {
    try {
      const res = await fetch(`${workerUrl}/api/inbox?id=${id}`, {
        method: "DELETE"
      });
      const json = await res.json();
      if (json.success) return true;
    } catch (e) {
      console.error("Failed to delete email from Cloudflare Worker KV:", e);
    }
  }

  const fileStoreAvailable = initStore();
  let deleted = false;

  if (fileStoreAvailable) {
    try {
      const emails = await getInbox();
      const filtered = emails.filter(e => e.id !== id);
      if (filtered.length !== emails.length) {
        fs.writeFileSync(INBOX_FILE, JSON.stringify(filtered, null, 2), "utf-8");
        deleted = true;
      }
    } catch (error) {
      console.error("Failed to delete from file inbox store:", error);
    }
  }

  // Also remove from memory store
  const initialLength = globalInbox.__inboxStore!.length;
  globalInbox.__inboxStore = globalInbox.__inboxStore!.filter(e => e.id !== id);
  if (globalInbox.__inboxStore.length !== initialLength) {
    deleted = true;
  }

  return deleted;
};

export const clearInbox = async (): Promise<void> => {
  const workerUrl = getWorkerUrl();
  if (workerUrl) {
    try {
      await fetch(`${workerUrl}/api/inbox?all=true`, {
        method: "DELETE"
      });
    } catch (e) {
      console.error("Failed to clear inbox from Cloudflare Worker KV:", e);
    }
  }

  const fileStoreAvailable = initStore();
  if (fileStoreAvailable) {
    try {
      fs.writeFileSync(INBOX_FILE, JSON.stringify([], null, 2), "utf-8");
    } catch (error) {
      console.error("Failed to clear file inbox store:", error);
    }
  }
  globalInbox.__inboxStore = [];
};
