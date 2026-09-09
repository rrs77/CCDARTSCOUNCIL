import React, { useState } from 'react';
import { AlertCircle, Loader2 } from 'lucide-react';
import { getVercelApiUrl } from '../../utils/apiUrl';

interface RegisterFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  compact?: boolean;
}

export function RegisterForm({ onSuccess, onCancel, compact }: RegisterFormProps) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [schoolOrOrg, setSchoolOrOrg] = useState('');
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);
    try {
      const res = await fetch(getVercelApiUrl('/api/register'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          email: email.trim(),
          password,
          school_or_org: schoolOrOrg.trim(),
          privacy_accepted: privacyAccepted,
          marketing_consent: marketingConsent,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || `Registration failed (${res.status})`);
      setSuccess(
        data.message ||
          'Account created. Check your email to verify your address, then sign in.',
      );
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass =
    'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#002D24] focus:outline-none focus:ring-2 focus:ring-[#002D24]/20';

  return (
    <form onSubmit={handleSubmit} className={compact ? 'space-y-3' : 'space-y-4'}>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">First name *</label>
          <input
            required
            className={inputClass}
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            autoComplete="given-name"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Last name *</label>
          <input
            required
            className={inputClass}
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            autoComplete="family-name"
          />
        </div>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Email *</label>
        <input
          required
          type="email"
          className={inputClass}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Password *</label>
        <input
          required
          type="password"
          minLength={8}
          className={inputClass}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
        />
        <p className="mt-1 text-xs text-gray-500">At least 8 characters.</p>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          School or organisation *
        </label>
        <input
          required
          className={inputClass}
          value={schoolOrOrg}
          onChange={(e) => setSchoolOrOrg(e.target.value)}
          autoComplete="organization"
        />
      </div>
      <label className="flex items-start gap-2 text-sm text-gray-700">
        <input
          type="checkbox"
          className="mt-1"
          checked={privacyAccepted}
          onChange={(e) => setPrivacyAccepted(e.target.checked)}
          required
        />
        <span>
          I have read and accept the privacy notice for account and download tracking
          (required).{' '}
          <span className="text-amber-700">
            Draft for legal review — see docs/PRIVACY_DOWNLOAD_TRACKING.md in the repo.
          </span>
        </span>
      </label>
      <label className="flex items-start gap-2 text-sm text-gray-700">
        <input
          type="checkbox"
          className="mt-1"
          checked={marketingConsent}
          onChange={(e) => setMarketingConsent(e.target.checked)}
        />
        <span>Optional: send me product updates and partner resource news by email.</span>
      </label>

      {error && (
        <div className="flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-800">{success}</div>
      )}

      <div className="flex flex-wrap justify-end gap-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center gap-2 rounded-lg bg-[#002D24] px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
          Create account
        </button>
      </div>
    </form>
  );
}
