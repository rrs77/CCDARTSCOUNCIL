/**
 * Front-end entitlement stubs for Assessify / PeriFeedback.
 *
 * Sourced from addonPlans.ts (single Free vs Full config). Until server-side
 * entitlement APIs exist, every signed-in teacher is treated as Free.
 * Do not trust a client-supplied tier.
 */

import { ADDON_PLANS } from './addonPlans';
import type {
  AssessifyEntitlements,
  BoltOnTier,
  PeriFeedbackEntitlements,
} from './types';

export const ASSESSIFY_FREE = ADDON_PLANS.assessify.entitlements.free as AssessifyEntitlements;
export const ASSESSIFY_FULL = ADDON_PLANS.assessify.entitlements.full as AssessifyEntitlements;
export const PERIFEEDBACK_FREE = ADDON_PLANS.perifeedback.entitlements.free as PeriFeedbackEntitlements;
export const PERIFEEDBACK_FULL = ADDON_PLANS.perifeedback.entitlements.full as PeriFeedbackEntitlements;

/** Always Free until a real entitlement / billing service is wired. */
export function getBoltOnTier(_product: 'assessify' | 'perifeedback'): BoltOnTier {
  return 'free';
}

export function getAssessifyEntitlements(): AssessifyEntitlements {
  return getBoltOnTier('assessify') === 'free' ? ASSESSIFY_FREE : ASSESSIFY_FULL;
}

export function getPeriFeedbackEntitlements(): PeriFeedbackEntitlements {
  return getBoltOnTier('perifeedback') === 'free' ? PERIFEEDBACK_FREE : PERIFEEDBACK_FULL;
}

/** Parent contact must never be enabled from the client alone. */
export function periFeedbackAllowsParentContact(): boolean {
  return getPeriFeedbackEntitlements().canContactParents === true;
}
