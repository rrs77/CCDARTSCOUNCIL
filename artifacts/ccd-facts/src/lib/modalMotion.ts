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
    initial: { opacity: 0, scale: 0.92 },
    animate: { opacity: 1, scale: [0.92, 1.04, 1] },
    exit: { opacity: 0, scale: 0.94 },
  };
}

export function modalBackdropTransition(reduced: boolean) {
  return { duration: reduced ? 0.01 : 0.2 };
}

export function modalPanelTransition(reduced: boolean) {
  if (reduced) return { duration: 0.01 };
  return {
    duration: 0.44,
    times: [0, 0.55, 1] as number[],
    ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
  };
}
