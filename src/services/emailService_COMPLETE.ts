import emailjs from "@emailjs/browser";

type Sender = { name: string; email: string; label?: string };

export const AVAILABLE_SENDERS: Sender[] = [
  { name: "Go-Prod Artists", email: "artists@venogefestival.ch", label: "Artists Desk" },
];

let initialized = false;

export function initializeEmailJS(publicKey?: string) {
  const key = publicKey || import.meta.env.VITE_EMAILJS_PUBLIC_KEY;
  if (!key) throw new Error("EmailJS public key manquante (VITE_EMAILJS_PUBLIC_KEY).");
  if (!initialized) {
    emailjs.init(key);
    initialized = true;
  }
}

export async function sendOfferEmail(params: {
  toEmail: string;
  toName?: string;
  ccEmails?: string[];
  sender: Sender;
  subject: string;
  htmlContent: string;
  pdfUrl: string;              // lien signé (pas de pièce jointe)
  pdfFileName: string;
  artistName?: string;
  eventName?: string;
  validityDate?: string;
  customMessage?: string;
}) {
  if (!initialized) initializeEmailJS();

  const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
  const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
  if (!serviceId || !templateId) {
    throw new Error("EmailJS SERVICE_ID ou TEMPLATE_ID manquant.");
  }

  const templateParams: any = {
    to_email: params.toEmail,
    to_name: params.toName || "",
    cc: (params.ccEmails || []).join(","),
    from_name: params.sender.name,
    from_email: params.sender.email,
    subject: params.subject,
    html_content: params.htmlContent,
    pdf_url: params.pdfUrl,
    pdf_filename: params.pdfFileName,
    artist_name: params.artistName || "",
    event_name: params.eventName || "",
    validity_date: params.validityDate || "",
    custom_message: params.customMessage || "",
  };

  const res = await emailjs.send(serviceId, templateId, templateParams);
  return { success: true, message: `EmailJS OK: ${res.status}` };
}
