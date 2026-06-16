// src/components/crm/contact-links.tsx
import { Phone, MessageCircle, Mail } from "lucide-react";

const cleanTel = (s: string | null) => (s ? s.replace(/[^\d+]/g, "") : "");

export function ContactLinks({
  phone,
  whatsapp,
  email,
}: {
  phone?: string | null;
  whatsapp?: string | null;
  email?: string | null;
}) {
  return (
    <div className="flex gap-2.5">
      {phone && (
        <a href={`tel:${cleanTel(phone)}`} className="text-st-new" title={phone}>
          <Phone className="h-4 w-4" />
        </a>
      )}
      {whatsapp && (
        <a
          href={`https://wa.me/${cleanTel(whatsapp)}`}
          target="_blank"
          rel="noreferrer"
          className="text-st-converted"
          title={whatsapp}
        >
          <MessageCircle className="h-4 w-4" />
        </a>
      )}
      {email && (
        <a href={`mailto:${email}`} className="text-muted" title={email}>
          <Mail className="h-4 w-4" />
        </a>
      )}
    </div>
  );
}