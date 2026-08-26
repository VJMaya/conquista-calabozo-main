// lib/validators.ts
import { z } from 'zod';

// Re-export all validators from types/api
export * from '../types/api';

/**
 * Validate and parse a guest login request
 */
export function validateGuestLogin(data: unknown) {
  const { GuestLoginSchema } = require('../types/api');
  return GuestLoginSchema.parse(data);
}

/**
 * Validate and parse an admin login request
 */
export function validateAdminLogin(data: unknown) {
  const { AdminLoginSchema } = require('../types/api');
  return AdminLoginSchema.parse(data);
}

/**
 * Validate and parse a create session request
 */
export function validateCreateSession(data: unknown) {
  const { CreateSessionSchema } = require('../types/api');
  return CreateSessionSchema.parse(data);
}

/**
 * Validate and parse a submit answer request
 */
export function validateSubmitAnswer(data: unknown) {
  const { SubmitAnswerSchema } = require('../types/api');
  return SubmitAnswerSchema.parse(data);
}
