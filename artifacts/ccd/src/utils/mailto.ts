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

/**
 * Build a mailto with subject + body (OMTutoring-style enquiry emails).
 */
export function buildEnquiryMailto(options: {
  email?: string;
  subject?: string;
  body: string;
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
  const body = typeof options.body === 'string' ? options.body : '';
  return `mailto:${safeTo}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
