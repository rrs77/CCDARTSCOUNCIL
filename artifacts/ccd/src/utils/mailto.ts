/** Default contact for prototype / funding queries. */
export const CCDESIGNER_CONTACT_EMAIL = 'rob@rhythmstix.co.uk';

/** Prefill subject for CCDesigner contact query mailto links. */
export const CCDESIGNER_QUERY_MAIL_SUBJECT = 'CCDesigner Query';

/**
 * Build a well-formed mailto URL with an encoded subject.
 * Only accepts string email + subject — never menu/event objects.
 */
export function buildQueryMailto(
  email: string = CCDESIGNER_CONTACT_EMAIL,
  subject: string = CCDESIGNER_QUERY_MAIL_SUBJECT,
): string {
  const to = typeof email === 'string' ? email.trim() : '';
  const safeTo =
    to && !to.includes('://') && !/\s/.test(to) ? to : CCDESIGNER_CONTACT_EMAIL;
  const safeSubject =
    typeof subject === 'string' && subject.trim()
      ? subject.trim()
      : CCDESIGNER_QUERY_MAIL_SUBJECT;
  return `mailto:${safeTo}?subject=${encodeURIComponent(safeSubject)}`;
}

export type EnquiryMailtoFields = {
  name: string;
  email: string;
  phone?: string;
  organisation?: string;
  /** Optional — omitted from body when empty. */
  role?: string;
  /** Optional — omitted from body when empty. */
  mobile?: string;
  /** Optional — omitted from body when empty. */
  preferredTimes?: string;
  message: string;
};

/**
 * Line-by-line enquiry body (OMTutoring-style).
 * Role, mobile and preferred times only appear when provided.
 */
export function buildEnquiryBody(fields: EnquiryMailtoFields): string {
  const lines: string[] = [
    `Name: ${fields.name.trim()}`,
    `Email: ${fields.email.trim()}`,
    `Phone: ${fields.phone?.trim() || 'Not provided'}`,
    `Organisation / school: ${fields.organisation?.trim() || 'Not provided'}`,
  ];

  const role = fields.role?.trim();
  if (role) lines.push(`Role: ${role}`);

  const mobile = fields.mobile?.trim();
  if (mobile) lines.push(`Mobile: ${mobile}`);

  const preferredTimes = fields.preferredTimes?.trim();
  if (preferredTimes) lines.push(`Preferred follow-up times: ${preferredTimes}`);

  lines.push('', fields.message.trim());
  return lines.join('\n');
}

/**
 * Build a mailto with subject + body (OMTutoring-style enquiry emails).
 * Pass `body` directly, or pass `fields` to build the body (optional fields
 * only included when provided).
 */
export function buildEnquiryMailto(options: {
  email?: string;
  subject?: string;
  body?: string;
  fields?: EnquiryMailtoFields;
}): string {
  const to =
    typeof options.email === 'string' && options.email.trim()
      ? options.email.trim()
      : CCDESIGNER_CONTACT_EMAIL;
  const safeTo =
    to && !to.includes('://') && !/\s/.test(to) ? to : CCDESIGNER_CONTACT_EMAIL;
  const subject =
    typeof options.subject === 'string' && options.subject.trim()
      ? options.subject.trim()
      : 'CCDesigner enquiry';
  const body =
    options.fields != null
      ? buildEnquiryBody(options.fields)
      : typeof options.body === 'string'
        ? options.body
        : '';
  return `mailto:${safeTo}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
