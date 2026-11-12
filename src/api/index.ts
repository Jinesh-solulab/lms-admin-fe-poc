import { call, get, upload } from './client';
import type {
  AssignBody,
  AssignResult,
  BlockLog,
  CityRow,
  DashboardSummary,
  DeadlineCheckResult,
  Lang,
  ModuleBody,
  ModuleRiderRow,
  ModuleStats,
  Paged,
  QuizBody,
  RiderBody,
  RiderDetails,
  RiderListItem,
  RiderQuery,
  TrainingModule,
  User,
} from './types';

export * from './types';
export { ApiError, session } from './client';

/** One function per lms-backend admin endpoint. */
export const api = {
  /* auth */
  login: (email: string, password: string) =>
    call<{ token: string; user: User }>('POST', '/auth/admin/login', { body: { email, password } }),
  me: () => get<User>('/users/me'),
  setLanguage: (language: Lang) => call<User>('PATCH', '/users/me/language', { body: { language } }),

  /* dashboard */
  summary: () => get<DashboardSummary>('/admin/dashboard/summary'),
  byCity: () => get<CityRow[]>('/admin/dashboard/by-city'),
  moduleStats: (id: string) => get<ModuleStats>(`/admin/dashboard/modules/${id}`),
  moduleRiders: (id: string) => get<ModuleRiderRow[]>(`/admin/dashboard/modules/${id}/riders`),

  /* modules */
  modules: () => get<TrainingModule[]>('/admin/modules'),
  module: (id: string) => get<TrainingModule>(`/admin/modules/${id}`),
  createModule: (body: ModuleBody) => call<TrainingModule>('POST', '/admin/modules', { body }),
  updateModule: (id: string, body: ModuleBody) => call<TrainingModule>('PATCH', `/admin/modules/${id}`, { body }),
  uploadVideo: (id: string, file: File, onProgress?: (p: number) => void) =>
    upload<TrainingModule>(`/admin/modules/${id}/video`, file, onProgress),
  uploadPdf: (id: string, file: File, onProgress?: (p: number) => void) =>
    upload<TrainingModule>(`/admin/modules/${id}/pdf`, file, onProgress),
  saveQuiz: (id: string, body: QuizBody) => call<TrainingModule>('PUT', `/admin/modules/${id}/quiz`, { body }),
  assign: (id: string, body: AssignBody) => call<AssignResult>('POST', `/admin/modules/${id}/assign`, { body }),

  /* riders & blocking */
  riders: (q: RiderQuery) => get<Paged<RiderListItem>>('/admin/riders', { ...q }),
  rider: (id: string) => get<RiderDetails>(`/admin/riders/${id}`),
  createRider: (body: RiderBody) => call<User>('POST', '/admin/riders', { body }),
  updateRider: (id: string, body: RiderBody) => call<User>('PATCH', `/admin/riders/${id}`, { body }),
  blockRider: (id: string, reason: string) => call<User>('POST', `/admin/riders/${id}/block`, { body: { reason } }),
  unblockRider: (id: string, body: { note?: string; newDueAt?: string }) =>
    call<{ rider: User; rescheduledAssignments: number }>('POST', `/admin/riders/${id}/unblock`, { body }),
  blockLogs: (q: { userId?: string; limit?: number } = {}) => get<BlockLog[]>('/admin/block-logs', q),
  runDeadlineCheck: () => call<DeadlineCheckResult>('POST', '/admin/jobs/deadline-check'),
};
