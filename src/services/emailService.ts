import emailjs from '@emailjs/browser';

export interface EmailData {
  to: string;
  subject: string;
  message: string;
  pdfPath: string;
  offerData: {
    artist_name: string;
    stage_name: string;
    amount_display: number | null;
    currency: string | null;
  };
}

export async function sendOfferEmail({ to, subject, message, pdfPath, offerData }: EmailData): Promise<void> {
  // Vérifier que les variables d'environnement sont configurées
  const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;
  const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
  const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;

  if (!publicKey || !serviceId || !templateId) {
    throw new Error("Configuration EmailJS manquante. Vérifiez les variables d'environnement.");
  }

  // Initialiser EmailJS
  emailjs.init(publicKey);

  // Créer l'URL signée pour le PDF (à implémenter selon votre logique)
  const pdfUrl = await createSignedPdfUrl(pdfPath);

  // Paramètres du template
  const templateParams = {
    to_email: to,
    subject: subject,
    message: message,
    artist_name: offerData.artist_name,
    stage_name: offerData.stage_name,
    amount_display: offerData.amount_display ? `${offerData.amount_display} ${offerData.currency}` : "Non spécifié",
    pdf_url: pdfUrl,
    from_name: "Go-Prod",
  };

  try {
    const response = await emailjs.send(serviceId, templateId, templateParams);
    console.log("Email envoyé:", response);
  } catch (error) {
    console.error("Erreur envoi email:", error);
    throw new Error("Échec de l'envoi de l'email");
  }
}

// Fonction helper pour créer une URL signée (à adapter selon votre implémentation)
async function createSignedPdfUrl(pdfPath: string): Promise<string> {
  // TODO: Implémenter la création d'URL signée
  // Pour l'instant, on retourne une URL placeholder
  return `https://your-storage-url.com/${pdfPath}`;
}