// lib/schemas.ts
/**
 * Zod validation schemas for all user inputs
 * Provides both client-side validation (UX) and server-side validation (security)
 */

import { z } from 'zod'

// ============================================
// AUTH SCHEMAS
// ============================================

export const emailSchema = z
  .string()
  .email('Invalid email address')
  .min(1, 'Email is required')
  .toLowerCase()

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .min(1, 'Password is required')

export const nameSchema = z
  .string()
  .min(2, 'Name must be at least 2 characters')
  .max(100, 'Name must be less than 100 characters')
  .trim()

export const phoneSchema = z
  .string()
  .min(10, 'Phone must be at least 10 characters')
  .max(20, 'Phone must be less than 20 characters')
  .regex(/^[0-9+\-\s()]*$/, 'Invalid phone format')
  .optional()

export const universitySchema = z
  .string()
  .min(2, 'University must be at least 2 characters')
  .max(100, 'University must be less than 100 characters')
  .trim()
  .optional()

export const emergencyContactSchema = z
  .string()
  .min(2, 'Emergency contact must be at least 2 characters')
  .max(100, 'Emergency contact must be less than 100 characters')
  .trim()
  .optional()

export const dietaryInfoSchema = z
  .string()
  .max(200, 'Dietary information must be less than 200 characters')
  .trim()
  .optional()

export const registrationSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  name: nameSchema,
  university: universitySchema,
  phone: phoneSchema,
  emergency_contact: emergencyContactSchema,
  dietary_info: dietaryInfoSchema,
})

export type RegistrationInput = z.infer<typeof registrationSchema>

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
})

export type LoginInput = z.infer<typeof loginSchema>

// ============================================
// HELP REQUEST SCHEMAS
// ============================================

export const helpCategorySchema = z.enum([
  'general',
  'health',
  'transport',
  'accommodation',
  'technical',
  'other',
])

export const helpMessageSchema = z
  .string()
  .min(10, 'Message must be at least 10 characters')
  .max(1000, 'Message must be less than 1000 characters')
  .trim()

export const helpRequestSchema = z.object({
  category: helpCategorySchema,
  message: helpMessageSchema,
})

export type HelpRequestInput = z.infer<typeof helpRequestSchema>

// ============================================
// ANNOUNCEMENT SCHEMAS
// ============================================

export const announcementPrioritySchema = z.enum(['low', 'medium', 'high', 'urgent'])

export const announcementTitleSchema = z
  .string()
  .min(3, 'Title must be at least 3 characters')
  .max(100, 'Title must be less than 100 characters')
  .trim()

export const announcementMessageSchema = z
  .string()
  .min(10, 'Message must be at least 10 characters')
  .max(2000, 'Message must be less than 2000 characters')
  .trim()

export const announcementSchema = z.object({
  title: announcementTitleSchema,
  message: announcementMessageSchema,
  priority: announcementPrioritySchema,
})

export type AnnouncementInput = z.infer<typeof announcementSchema>

// ============================================
// NOTIFICATION SCHEMAS
// ============================================

export const notificationPayloadSchema = z.object({
  title: z.string().min(1).max(100),
  message: z.string().min(1).max(500),
  heading: z.string().min(1).max(100).optional(),
  contents: z.record(z.string()).optional(),
  include_external_user_ids: z.array(z.string()).optional(),
  filters: z.array(z.any()).optional(),
})

export type NotificationPayload = z.infer<typeof notificationPayloadSchema>

// ============================================
// VALIDATION HELPERS
// ============================================

export function validateRegistration(data: unknown) {
  return registrationSchema.safeParse(data)
}

export function validateLogin(data: unknown) {
  return loginSchema.safeParse(data)
}

export function validateHelpRequest(data: unknown) {
  return helpRequestSchema.safeParse(data)
}

export function validateAnnouncement(data: unknown) {
  return announcementSchema.safeParse(data)
}

export function validateNotification(data: unknown) {
  return notificationPayloadSchema.safeParse(data)
}
