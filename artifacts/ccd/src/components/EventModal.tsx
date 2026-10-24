import { useState, useEffect, useId } from 'react';
import { Save, Trash2, Info } from 'lucide-react';
import { format } from 'date-fns';
import {
  ModalShell,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalConfirm,
} from './ccdPlanner/ModalShell';

interface CalendarEvent {
  id: string;
  title: string;
  startDate: Date;
  endDate: Date;
  type: 'holiday' | 'inset' | 'event' | 'key-date';
  description?: string;
  color: string;
  orgId?: string;
  keyStage?: string;
  importantDateId?: string;
  attendReminder?: boolean;
}

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddEvent: (newEvent: CalendarEvent) => void;
  onUpdateEvent: (updatedEvent: CalendarEvent) => void;
  onDeleteEvent: (eventId: string) => void;
  editingEvent: CalendarEvent | null;
  className: string;
}

const EVENT_COLORS = {
  holiday: '#EF4444',
  inset: '#8B5CF6',
  event: '#F59E0B',
  'key-date': '#0F766E',
};

export function EventModal({
  isOpen,
  onClose,
  onAddEvent,
  onUpdateEvent,
  onDeleteEvent,
  editingEvent,
}: EventModalProps) {
  const titleId = useId();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [formError, setFormError] = useState('');
  const [event, setEvent] = useState<CalendarEvent>({
    id: `event-${Date.now()}`,
    title: '',
    startDate: new Date(),
    endDate: new Date(),
    type: 'event',
    description: '',
    color: EVENT_COLORS.event,
  });

  useEffect(() => {
    if (!isOpen) return;
    setFormError('');
    setConfirmDelete(false);
    if (editingEvent) {
      setEvent({
        ...editingEvent,
        startDate: new Date(editingEvent.startDate),
        endDate: new Date(editingEvent.endDate),
      });
    } else {
      setEvent({
        id: `event-${Date.now()}`,
        title: '',
        startDate: new Date(),
        endDate: new Date(),
        type: 'event',
        description: '',
        color: EVENT_COLORS.event,
      });
    }
  }, [isOpen, editingEvent]);

  useEffect(() => {
    setEvent((prev) => ({
      ...prev,
      color: EVENT_COLORS[prev.type],
    }));
  }, [event.type]);

  const formatDateForInput = (date: Date) => format(date, 'yyyy-MM-dd');

  const handleSave = () => {
    if (!event.title.trim()) {
      setFormError('Please enter an event title');
      return;
    }
    if (event.startDate > event.endDate) {
      setFormError('End date must be after start date');
      return;
    }
    setFormError('');
    if (editingEvent) onUpdateEvent(event);
    else onAddEvent(event);
  };

  return (
    <>
      <ModalShell open={isOpen} onClose={onClose} labelledBy={titleId}>
        <ModalHeader
          title={editingEvent ? 'Edit Event' : 'Add Event'}
          onClose={onClose}
          titleId={titleId}
        />
        <ModalBody>
          {formError ? (
            <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {formError}
            </div>
          ) : null}
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">
                Event Title
              </label>
              <input
                type="text"
                value={event.title}
                onChange={(e) => setEvent((prev) => ({ ...prev, title: e.target.value }))}
                className="h-11 w-full rounded-xl border border-indigo-100 px-3 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
                placeholder="e.g., Summer Holiday"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">
                Event Type
              </label>
              <select
                value={event.type}
                onChange={(e) =>
                  setEvent((prev) => ({
                    ...prev,
                    type: e.target.value as CalendarEvent['type'],
                  }))
                }
                className="h-11 w-full rounded-xl border border-indigo-100 px-3 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
              >
                <option value="holiday">Holiday</option>
                <option value="inset">Inset Day</option>
                <option value="event">Event</option>
                {event.type === 'key-date' ? (
                  <option value="key-date">Important date (partner)</option>
                ) : null}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">
                  Start Date
                </label>
                <input
                  type="date"
                  value={formatDateForInput(event.startDate)}
                  onChange={(e) =>
                    setEvent((prev) => ({ ...prev, startDate: new Date(e.target.value) }))
                  }
                  className="h-11 w-full rounded-xl border border-indigo-100 px-3 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">
                  End Date
                </label>
                <input
                  type="date"
                  value={formatDateForInput(event.endDate)}
                  onChange={(e) =>
                    setEvent((prev) => ({ ...prev, endDate: new Date(e.target.value) }))
                  }
                  className="h-11 w-full rounded-xl border border-indigo-100 px-3 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">
                Description (Optional)
              </label>
              <textarea
                value={event.description || ''}
                onChange={(e) => setEvent((prev) => ({ ...prev, description: e.target.value }))}
                className="h-20 w-full resize-none rounded-xl border border-indigo-100 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
                placeholder="Add any additional details…"
              />
            </div>

            <div className="flex items-start gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <Info className="mt-0.5 h-5 w-5 shrink-0 text-indigo-600" aria-hidden />
              <div>
                <h4 className="mb-1 text-sm font-bold text-slate-900">About Event Types</h4>
                <ul className="space-y-1 text-sm text-slate-600">
                  <li>
                    <span className="font-semibold">Holidays:</span> Block all lessons during this
                    period
                  </li>
                  <li>
                    <span className="font-semibold">Inset Days:</span> Staff training with no regular
                    classes
                  </li>
                  <li>
                    <span className="font-semibold">Events:</span> Special activities that do not
                    block classes
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <div>
            {editingEvent ? (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="inline-flex h-11 items-center gap-2 rounded-full bg-rose-600 px-4 text-sm font-semibold text-white hover:bg-rose-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
              >
                <Trash2 className="h-4 w-4" aria-hidden />
                Delete
              </button>
            ) : (
              <span />
            )}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-11 items-center rounded-full border-2 border-indigo-200 px-4 text-sm font-semibold text-indigo-700 hover:bg-indigo-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="inline-flex h-11 items-center gap-2 rounded-full bg-indigo-600 px-4 text-sm font-semibold text-white hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
            >
              <Save className="h-4 w-4" aria-hidden />
              {editingEvent ? 'Update' : 'Add'} Event
            </button>
          </div>
        </ModalFooter>
      </ModalShell>

      <ModalConfirm
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={() => {
          if (editingEvent) onDeleteEvent(editingEvent.id);
        }}
        title="Delete event?"
        message="Are you sure you want to delete this event?"
        confirmLabel="Delete"
        danger
      />
    </>
  );
}
