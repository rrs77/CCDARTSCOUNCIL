import { type FormEvent, type ReactNode, useState } from 'react';
import { CheckCircle2, Mail } from 'lucide-react';
import {
  CCDESIGNER_CONTACT_EMAIL,
  buildEnquiryMailto,
} from '../utils/mailto';

type FormState = {
  name: string;
  email: string;
  phone: string;
  organisation: string;
  message: string;
};

const INITIAL: FormState = {
  name: '',
  email: '',
  phone: '',
  organisation: '',
  message: '',
};

/**
 * Contact form matching the OMTutoring / Isaac enquiry pattern:
 * mailto with details separated line-by-line. No dropdowns — free text only.
 * Sends to rob@rhythmstix.co.uk
 */
export function ContactUsPanel() {
  const [form, setForm] = useState<FormState>(INITIAL);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');

    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      setError('Please add your name, email and a short message.');
      return;
    }

    const body = [
      `Name: ${form.name.trim()}`,
      `Email: ${form.email.trim()}`,
      `Phone: ${form.phone.trim() || 'Not provided'}`,
      `Organisation / school: ${form.organisation.trim() || 'Not provided'}`,
      '',
      form.message.trim(),
    ].join('\n');

    window.location.href = buildEnquiryMailto({
      email: CCDESIGNER_CONTACT_EMAIL,
      subject: 'CCDesigner enquiry',
      body,
    });
    setSubmitted(true);
  }

  return (
    <div className="space-y-6" data-ccd-contact-us="1">
      <div className="flex items-center gap-3 rounded-lg border border-[#002D24]/10 bg-[var(--ccd-sage-mist,#E8F0EA)] px-3 py-2.5 sm:px-4">
        <div
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-[#002D24]/75"
          style={{ backgroundColor: 'rgba(0, 45, 36, 0.06)' }}
        >
          <Mail className="h-4 w-4" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-semibold tracking-tight text-[#002D24] sm:text-lg">
            Contact us
          </h2>
          <p className="text-sm leading-snug text-[#002D24]/70">
            Send an enquiry about CCDesigner.
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
        <aside className="space-y-4">
          <div className="rounded-2xl bg-[#002D24] px-5 py-6 text-white sm:px-6">
            <Mail className="mb-3 h-7 w-7 text-[#B6FF7E]" strokeWidth={1.75} aria-hidden />
            <h3 className="text-lg font-semibold tracking-tight">Email</h3>
            <a
              href={`mailto:${CCDESIGNER_CONTACT_EMAIL}`}
              className="mt-2 inline-block break-all text-sm text-[#E8F0EA] underline-offset-2 hover:text-white hover:underline"
            >
              {CCDESIGNER_CONTACT_EMAIL}
            </a>
            <p className="mt-4 text-sm text-white/75">
              Prototype, funding and arts-sector consultation queries welcome. No account required.
            </p>
          </div>
          <div className="rounded-2xl border border-[#002D24]/10 bg-white px-5 py-5 text-sm text-[#002D24]/75">
            <p className="font-semibold text-[#002D24]">Before you write</p>
            <ul className="mt-2 list-disc space-y-1.5 pl-5">
              <li>Your role (teacher, subject lead, hub, funder…)</li>
              <li>What you’d like to explore in CCDesigner</li>
              <li>Any preferred times for a follow-up</li>
            </ul>
          </div>
        </aside>

        {submitted ? (
          <div className="flex min-h-[22rem] flex-col items-start justify-center rounded-2xl border border-[#002D24]/10 bg-white px-6 py-10 sm:px-8">
            <CheckCircle2 className="h-10 w-10 text-[#002D24]" strokeWidth={1.75} aria-hidden />
            <h3 className="mt-4 text-2xl font-semibold tracking-tight text-[#002D24]">
              Thanks for getting in touch
            </h3>
            <p className="mt-3 max-w-md text-sm text-[#002D24]/70">
              Your email app should open with a prepared message. If it doesn’t, send your enquiry
              directly to{' '}
              <a
                className="font-semibold text-[#002D24] underline"
                href={`mailto:${CCDESIGNER_CONTACT_EMAIL}`}
              >
                {CCDESIGNER_CONTACT_EMAIL}
              </a>
              .
            </p>
            <button
              type="button"
              className="mt-6 text-sm font-semibold text-[#002D24] hover:underline"
              onClick={() => {
                setSubmitted(false);
                setForm(INITIAL);
              }}
            >
              Send another enquiry
            </button>
          </div>
        ) : (
          <form
            onSubmit={onSubmit}
            className="rounded-2xl border border-[#002D24]/10 bg-white px-5 py-7 sm:px-8 sm:py-8"
            noValidate
          >
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Your name" htmlFor="ccd-contact-name">
                <input
                  id="ccd-contact-name"
                  name="name"
                  autoComplete="name"
                  value={form.name}
                  onChange={(e) => update('name', e.target.value)}
                  className="ccd-contact-input"
                  required
                />
              </Field>
              <Field label="Email" htmlFor="ccd-contact-email">
                <input
                  id="ccd-contact-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  inputMode="email"
                  value={form.email}
                  onChange={(e) => update('email', e.target.value)}
                  className="ccd-contact-input"
                  required
                />
              </Field>
              <Field label="Phone (optional)" htmlFor="ccd-contact-phone">
                <input
                  id="ccd-contact-phone"
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  inputMode="tel"
                  value={form.phone}
                  onChange={(e) => update('phone', e.target.value)}
                  className="ccd-contact-input"
                />
              </Field>
              <Field label="Organisation / school (optional)" htmlFor="ccd-contact-org">
                <input
                  id="ccd-contact-org"
                  name="organisation"
                  autoComplete="organization"
                  value={form.organisation}
                  onChange={(e) => update('organisation', e.target.value)}
                  className="ccd-contact-input"
                />
              </Field>
              <Field label="Message" htmlFor="ccd-contact-message" className="sm:col-span-2">
                <textarea
                  id="ccd-contact-message"
                  name="message"
                  rows={5}
                  value={form.message}
                  onChange={(e) => update('message', e.target.value)}
                  className="ccd-contact-input min-h-[8rem] resize-y"
                  placeholder="Tell us a little about your school or project, and how we can help…"
                  required
                />
              </Field>
            </div>

            {error ? (
              <p className="mt-4 text-sm font-semibold text-red-700" role="alert">
                {error}
              </p>
            ) : null}

            <button
              type="submit"
              className="mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-lg bg-[#002D24] px-6 py-3 text-sm font-semibold text-white transition hover:opacity-95 sm:w-auto"
            >
              Send enquiry
            </button>
            <p className="mt-3 text-xs text-[#002D24]/55">
              Opens your email app with the message ready to send. No account required.
            </p>
          </form>
        )}
      </div>

      <style>{`
        .ccd-contact-input {
          width: 100%;
          min-height: 2.75rem;
          border-radius: 0.5rem;
          border: 1px solid rgba(0, 45, 36, 0.18);
          background: #F3F6F3;
          padding: 0.7rem 0.9rem;
          color: #002D24;
          font-size: 0.875rem;
          transition: border-color 0.15s ease, box-shadow 0.15s ease, background 0.15s ease;
        }
        .ccd-contact-input:focus {
          outline: none;
          border-color: #002D24;
          box-shadow: 0 0 0 3px rgba(182, 255, 126, 0.35);
          background: #fff;
        }
      `}</style>
    </div>
  );
}

function Field({
  label,
  htmlFor,
  children,
  className = '',
}: {
  label: string;
  htmlFor: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={`block ${className}`} htmlFor={htmlFor}>
      <span className="mb-1.5 block text-sm font-semibold text-[#002D24]">{label}</span>
      {children}
    </label>
  );
}
