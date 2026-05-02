import React from 'react';
import { DndProvider } from 'react-dnd';
import { MultiBackend, type MultiBackendOptions } from 'react-dnd-multi-backend';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { TouchBackend } from 'react-dnd-touch-backend';
import { CustomDragLayer } from './CustomDragLayer';

const HTML5toTouch: MultiBackendOptions = {
  backends: [
    {
      id: 'html5',
      backend: HTML5Backend,
      transition: undefined,
    },
    {
      id: 'touch',
      backend: TouchBackend,
      options: {
        enableMouseEvents: false,
        delayTouchStart: 120,
        ignoreContextMenu: true,
        touchSlop: 8,
      },
      preview: true,
      transition: {
        event: 'touchstart' as unknown as keyof DocumentEventMap,
        check: (event: Event) => {
          return (
            'ontouchstart' in window &&
            (event as TouchEvent).type === 'touchstart'
          );
        },
      },
    },
  ],
};

interface DndRootProps {
  children: React.ReactNode;
}

/**
 * Single app-wide drag-and-drop provider.
 *
 * Uses MultiBackend so the HTML5 backend handles desktop mouse drags while the
 * Touch backend handles tablets/phones. Renders a single CustomDragLayer at the
 * top of the tree so every drag — activity, lesson-activity, category, year
 * group, objective, timetable block — gets a consistent visual ghost preview
 * regardless of platform.
 *
 * Replaces the eight per-component <DndProvider backend={HTML5Backend}> wrappers
 * that previously fought for ownership; nesting providers is unsupported and
 * caused subtle drag-state bugs as well as broken touch support.
 */
export function DndRoot({ children }: DndRootProps) {
  return (
    <DndProvider backend={MultiBackend} options={HTML5toTouch}>
      {children}
      <CustomDragLayer />
    </DndProvider>
  );
}
