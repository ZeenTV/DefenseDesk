import { z } from 'zod';
export const loginSchema = z.object({ email: z.string().email(), password: z.string().min(6) });
export type LoginInput = z.infer<typeof loginSchema>;
const cleanEmailPart = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');
export const buildAccountName = (firstName: string, middleName: string, lastName: string) => [firstName, middleName, lastName].map((part) => part.trim()).filter(Boolean).join(' ');
export const generateAccountEmail = (firstName: string, middleName: string, lastName: string, type: 'student' | 'faculty' = 'student') => {
  const firstInitials = firstName.trim().split(/\s+/).slice(0, 2).map(cleanEmailPart).filter(Boolean).map((part) => part[0]).join('');
  const middleInitial = cleanEmailPart(middleName)[0] || '';
  const surname = cleanEmailPart(lastName);
  const username = `${firstInitials}${middleInitial}${surname}`;
  const domain = type === 'faculty' ? 'faculty.com' : 'student.com';
  return username ? `${username}@${domain}` : '';
};
export const userSchema = z.object({ name: z.string().optional(), firstName: z.string().optional(), middleName: z.string().optional(), lastName: z.string().optional(), email: z.string().email().optional(), type: z.enum(['student', 'faculty']), department: z.string().optional(), expertiseTags: z.string().optional(), canChair: z.boolean().optional(), maxDefensesPerDay: z.coerce.number().min(1).max(6).optional() }).superRefine((value, context) => {
  if (value.name === undefined) {
    if (!value.firstName?.trim()) context.addIssue({ code: z.ZodIssueCode.custom, path: ['firstName'], message: 'First name is required' });
    if (!value.lastName?.trim()) context.addIssue({ code: z.ZodIssueCode.custom, path: ['lastName'], message: 'Last name is required' });
    if (value.firstName && value.lastName && !generateAccountEmail(value.firstName, value.middleName || '', value.lastName, value.type)) context.addIssue({ code: z.ZodIssueCode.custom, path: ['lastName'], message: 'Enter a name containing letters or numbers to generate an email' });
    if (buildAccountName(value.firstName || '', value.middleName || '', value.lastName || '').length > 60) context.addIssue({ code: z.ZodIssueCode.custom, path: ['lastName'], message: 'The full name must be 60 characters or fewer' });
  } else {
    if (value.name.trim().length < 2 || value.name.trim().length > 60) context.addIssue({ code: z.ZodIssueCode.custom, path: ['name'], message: 'Name must be between 2 and 60 characters' });
    if (!value.email) context.addIssue({ code: z.ZodIssueCode.custom, path: ['email'], message: 'Email is required' });
  }
  if (value.type === 'faculty' && value.maxDefensesPerDay === undefined) context.addIssue({ code: z.ZodIssueCode.custom, path: ['maxDefensesPerDay'], message: 'Set a daily defense limit for faculty accounts' });
});
export type UserInput = z.infer<typeof userSchema>;
export const groupSchema = z.object({ title: z.string().min(2), memberIds: z.string().min(1), adviser: z.string().min(1), projectArea: z.string().min(1) });
export type GroupInput = z.infer<typeof groupSchema>;
export const roomSchema = z.object({ name: z.string().min(1), capacity: z.coerce.number().min(1), equipment: z.string().optional() });
export type RoomInput = z.infer<typeof roomSchema>;
export const defenseSchema = z.object({ group: z.string().min(1), room: z.string().min(1), chair: z.string().min(1), member1: z.string().min(1), member2: z.string().min(1), startTime: z.string().min(1), endTime: z.string().min(1) }).refine((value) => value.member1 !== value.member2, { message: 'Choose two different panel members', path: ['member2'] });
export type DefenseInput = z.infer<typeof defenseSchema>;
export const evaluationSchema = z.object({ scores: z.array(z.object({ criterion: z.string().min(1), score: z.coerce.number().min(0).max(100) })).min(1), remarks: z.string().optional() });
export type EvaluationInput = z.infer<typeof evaluationSchema>;
export const passwordSchema = z.object({ currentPassword: z.string().min(1), newPassword: z.string().min(6), confirmPassword: z.string() }).refine((v) => v.newPassword === v.confirmPassword, { message: 'Passwords do not match', path: ['confirmPassword'] });
export type PasswordInput = z.infer<typeof passwordSchema>;
