import { type FormEvent, type ReactNode, useState } from "react";
import { CheckCircle2, Mail } from "lucide-react";
import { FadeIn, SectionHeading } from "@/components/ui";

const CONTACT_EMAIL = "isaacjackrs@gmail.com";

type FormState = {
  name: string;
  email: string;
  phone: string;
  subject: string;
  location: string;
  message: string;
};

const INITIAL: FormState = {
  name: "",
  email: "",
  phone: "",
  subject: "Mathematics",
  location: "Online",
  message: "",
};

export function ContactPage() {
  const [form, setForm] = useState<FormState>(INITIAL);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      setError("Please add your name, email and a short message.");
      return;
    }

    const body = [
      `Name: ${form.name.trim()}`,
      `Email: ${form.email.trim()}`,
      `Phone: ${form.phone.trim() || "Not provided"}`,
      `Subject interest: ${form.subject}`,
      `Preferred format: ${form.location}`,
      "",
      form.message.trim(),
    ].join("\n");

    const mailto = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(
      `Tuition enquiry — ${form.subject}`,
    )}&body=${encodeURIComponent(body)}`;

    window.location.href = mailto;
    setSubmitted(true);
  }

  return (
    <>
      <section className="atmosphere border-b border-teal/10">
        <div className="safe-px mx-auto max-w-6xl py-14 sm:py-16">
          <FadeIn>
            <SectionHeading eyebrow="Contact" title="Let’s plan a lesson that fits">
              Share a little about the student and what you’d like help with. I’ll reply to arrange
              a suitable time — online or at home near Oaklands School.
            </SectionHeading>
          </FadeIn>
        </div>
      </section>

      <section className="bg-surface">
        <div className="safe-px mx-auto grid max-w-6xl gap-12 py-14 sm:py-16 lg:grid-cols-[0.9fr_1.1fr]">
          <FadeIn>
            <div className="space-y-6">
              <div className="rounded-2xl bg-teal px-6 py-7 text-white">
                <Mail className="mb-4 h-7 w-7 text-gold-soft" strokeWidth={1.75} />
                <h2 className="font-display text-xl font-bold">Email</h2>
                <a
                  href={`mailto:${CONTACT_EMAIL}`}
                  className="mt-2 inline-block break-all text-sage-soft underline-offset-2 hover:text-white hover:underline"
                >
                  {CONTACT_EMAIL}
                </a>
                <p className="mt-4 text-sm text-mint/85">
                  Tuition is £45 per hour for Maths and Combined Science (Year 7–GCSE).
                </p>
              </div>

              <div className="rounded-2xl bg-mint/80 px-6 py-6 text-sm text-ink-soft">
                <p className="font-display text-base font-bold text-ink">Before you write</p>
                <ul className="mt-3 list-disc space-y-2 pl-5">
                  <li>Year group and subject(s)</li>
                  <li>Topics that feel challenging</li>
                  <li>Whether you’d prefer online or home tuition</li>
                  <li>Any preferred days or times</li>
                </ul>
              </div>
            </div>
          </FadeIn>

          <FadeIn delay={0.08}>
            {submitted ? (
              <div className="flex h-full min-h-[22rem] flex-col items-start justify-center rounded-2xl bg-white px-6 py-10 ring-1 ring-teal/10 sm:px-8">
                <CheckCircle2 className="h-10 w-10 text-teal" strokeWidth={1.75} />
                <h2 className="mt-4 font-display text-2xl font-bold text-ink">Thanks for getting in touch</h2>
                <p className="mt-3 max-w-md text-ink-soft">
                  Your email app should open with a prepared message. If it doesn’t, send your
                  enquiry directly to{" "}
                  <a className="font-semibold text-teal underline" href={`mailto:${CONTACT_EMAIL}`}>
                    {CONTACT_EMAIL}
                  </a>
                  .
                </p>
                <button
                  type="button"
                  className="mt-6 font-bold text-teal hover:underline"
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
                className="rounded-2xl bg-white px-5 py-7 ring-1 ring-teal/10 sm:px-8 sm:py-8"
                noValidate
              >
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label="Your name" htmlFor="name">
                    <input
                      id="name"
                      name="name"
                      autoComplete="name"
                      value={form.name}
                      onChange={(e) => update("name", e.target.value)}
                      className="field-input"
                      required
                    />
                  </Field>
                  <Field label="Email" htmlFor="email">
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      inputMode="email"
                      value={form.email}
                      onChange={(e) => update("email", e.target.value)}
                      className="field-input"
                      required
                    />
                  </Field>
                  <Field label="Phone (optional)" htmlFor="phone">
                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      autoComplete="tel"
                      inputMode="tel"
                      value={form.phone}
                      onChange={(e) => update("phone", e.target.value)}
                      className="field-input"
                    />
                  </Field>
                  <Field label="Subject" htmlFor="subject">
                    <select
                      id="subject"
                      name="subject"
                      value={form.subject}
                      onChange={(e) => update("subject", e.target.value)}
                      className="field-input"
                    >
                      <option>Mathematics</option>
                      <option>Combined Science</option>
                      <option>Both</option>
                    </select>
                  </Field>
                  <Field label="Preferred format" htmlFor="location" className="sm:col-span-2">
                    <select
                      id="location"
                      name="location"
                      value={form.location}
                      onChange={(e) => update("location", e.target.value)}
                      className="field-input"
                    >
                      <option>Online</option>
                      <option>Home (within 3 miles of Oaklands School)</option>
                      <option>Not sure yet</option>
                    </select>
                  </Field>
                  <Field label="Message" htmlFor="message" className="sm:col-span-2">
                    <textarea
                      id="message"
                      name="message"
                      rows={5}
                      value={form.message}
                      onChange={(e) => update("message", e.target.value)}
                      className="field-input resize-y min-h-[8rem]"
                      placeholder="Year group, topics to focus on, and any timing preferences…"
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
                  className="mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-md bg-gold px-6 py-3 text-base font-bold text-white transition hover:bg-gold-bright sm:w-auto"
                >
                  Send enquiry
                </button>
                <p className="mt-3 text-xs text-ink-soft">
                  Opens your email app with the message ready to send. No account required.
                </p>
              </form>
            )}
          </FadeIn>
        </div>
      </section>

      <style>{`
        .field-input {
          width: 100%;
          min-height: 2.75rem;
          border-radius: 0.5rem;
          border: 1px solid rgba(13, 92, 99, 0.18);
          background: #f5faf8;
          padding: 0.7rem 0.9rem;
          color: #12343b;
          transition: border-color 0.15s ease, box-shadow 0.15s ease;
        }
        .field-input:focus {
          outline: none;
          border-color: #0d5c63;
          box-shadow: 0 0 0 3px rgba(124, 183, 163, 0.35);
          background: #fff;
        }
      `}</style>
    </>
  );
}

function Field({
  label,
  htmlFor,
  children,
  className = "",
}: {
  label: string;
  htmlFor: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={`block ${className}`} htmlFor={htmlFor}>
      <span className="mb-1.5 block text-sm font-semibold text-ink">{label}</span>
      {children}
    </label>
  );
}
