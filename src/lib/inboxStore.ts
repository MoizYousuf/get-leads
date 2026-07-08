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

// Ensure data folder and inbox file exist
const initStore = () => {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(INBOX_FILE)) {
    fs.writeFileSync(INBOX_FILE, JSON.stringify([], null, 2), "utf-8");
  }
};

export const getInbox = (): InboundEmail[] => {
  try {
    initStore();
    const content = fs.readFileSync(INBOX_FILE, "utf-8");
    return JSON.parse(content) as InboundEmail[];
  } catch (error) {
    console.error("Failed to read inbox file:", error);
    return [];
  }
};

export const addEmailToInbox = (email: Omit<InboundEmail, "id" | "date">): InboundEmail => {
  initStore();
  const emails = getInbox();
  
  const newEmail: InboundEmail = {
    ...email,
    id: `in_msg_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
    date: new Date().toISOString()
  };

  emails.unshift(newEmail); // Add to the top
  fs.writeFileSync(INBOX_FILE, JSON.stringify(emails, null, 2), "utf-8");
  return newEmail;
};

export const deleteEmailFromInbox = (id: string): boolean => {
  initStore();
  const emails = getInbox();
  const filtered = emails.filter(e => e.id !== id);
  
  if (filtered.length === emails.length) {
    return false;
  }
  
  fs.writeFileSync(INBOX_FILE, JSON.stringify(filtered, null, 2), "utf-8");
  return true;
};

export const clearInbox = (): void => {
  initStore();
  fs.writeFileSync(INBOX_FILE, JSON.stringify([], null, 2), "utf-8");
};
