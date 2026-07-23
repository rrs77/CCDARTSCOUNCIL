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
