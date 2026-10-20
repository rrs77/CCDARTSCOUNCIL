import toast from 'react-hot-toast';

const STYLE = {
  background: '#E9E6FF',
  color: '#1F1B4D',
  border: '1px solid #E2E0EF',
  borderRadius: '12px',
  padding: '12px 16px',
  fontSize: '14px',
  fontWeight: '600',
} as const;

/** Consistent autosave confirmation across Settings. */
export function toastSettingsSaved(message = 'Saved'): void {
  toast.success(message, {
    duration: 2200,
    position: 'top-center',
    style: STYLE,
  });
}

export function toastSettingsError(message = 'Could not save. Please try again.'): void {
  toast.error(message, {
    duration: 4000,
    position: 'top-center',
  });
}
