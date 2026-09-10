/** Shared open/close motion for detail + comments modals. */

export function modalBounce(reduced: boolean) {
  if (reduced) {
    return {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 },
    };
  }
  return {
    initial: { opacity: 0, y: 18, scale: 0.985 },
    animate: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, y: 10, scale: 0.99 },
  };
}

export function modalBackdropTransition(reduced: boolean) {
  return { duration: reduced ? 0.01 : 0.22 };
}

export function modalPanelTransition(reduced: boolean) {
  if (reduced) return { duration: 0.01 };
  return {
    duration: 0.42,
    ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
  };
}
