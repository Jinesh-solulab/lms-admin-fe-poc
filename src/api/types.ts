/** Shapes returned by lms-backend (see lms-backend/src/*.controller.ts). All ids are MongoDB ObjectId strings. */

export type Lang = 'ar' | 'en' | 'ur';
export const LANGS: Lang[] = ['en', 'ar', 'ur'];

/** Content text. `ur` is optional on the server: riders see English when it is empty. */
export interface Localized {
  ar: string;
  en: string;
  ur?: string;
}

export type AssignmentStatus = 'assigned' | 'completed' | 'overdue';
export type BlockKind = 'MODULE_OVERDUE' | 'MANUAL';

export interface BlockInfo {
  kind: BlockKind;
  moduleId: string | null;
  moduleTitle: Localized | null;
  dueAt: string | null;
  note: string | null;
  message: string;
  blockedAt: string | null;
  blockedBy: string | null; // 'SYSTEM' or admin id
}

export interface User {
  id: string;
  phone: string | null;
  email: string | null;
  name: string;
  role: 'admin' | 'rider';
  city: string | null;
  language: Lang;
  isActive: boolean;
  isBlocked: boolean;
  block: BlockInfo | null;
  createdAt: string;
}

export interface StatusCounts {
  total: number;
  assigned: number;
  completed: number;
  overdue: number;
}

export interface RiderListItem extends User {
  assignments: StatusCounts;
}

export interface Paged<T> {
  items: T[];
  page: number;
  limit: number;
  total: number;
}

export interface FileInfo {
  url: string;
  path: string;
  originalName: string;
  sizeBytes: number;
  mimeType: string;
}

export interface QuizQuestion {
  id: string;
  text: Localized;
  options: Localized[];
  correctIndex: number;
}

export interface Quiz {
  passMark: number;
  totalQuestions: number;
  questions: QuizQuestion[];
}

export interface TrainingModule {
  id: string;
  title: Localized;
  description?: Localized;
  video: FileInfo | null;
  pdf: FileInfo | null;
  deadlineDays: number;
  videoCompletePercent: number;
  version: number;
  isActive: boolean;
  quiz: Quiz | null;
  assignments?: StatusCounts;
  createdAt: string;
  updatedAt: string;
}

export interface ProgressView {
  moduleId: string;
  required: { video: boolean; pdf: boolean; quiz: boolean };
  videoPercent: number;
  videoCompleted: boolean;
  pdfViewed: boolean;
  quizAttempts: number;
  lastScore: number | null;
  bestScore: number | null;
  quizTotal: number;
  quizPassMark: number | null;
  quizPassed: boolean;
  percent: number;
  completed: boolean;
  completedAt: string | null;
  assignmentStatus: AssignmentStatus | null;
  dueAt: string | null;
}

export interface RiderAssignment {
  moduleId: string;
  title: Localized | null;
  assignedAt: string;
  dueAt: string;
  status: AssignmentStatus;
  completedAt: string | null;
  overdueAt: string | null;
  progress: ProgressView;
}

export type BlockAction = 'BLOCK' | 'UNBLOCK' | 'OVERDUE';

export interface BlockLog {
  _id: string;
  userId: string;
  action: BlockAction;
  kind: BlockKind;
  moduleId: string | null;
  reason?: string;
  note?: string;
  by: string; // 'SYSTEM' or admin id
  dueAt?: string | null;
  newDueAt?: string | null;
  createdAt: string;
  rider?: { _id: string; name: string; phone: string; city: string | null } | null;
}

export interface RiderDetails {
  rider: User;
  assignments: RiderAssignment[];
  blockHistory: BlockLog[];
}

export interface DashboardSummary {
  totalRiders: number;
  activeRiders: number;
  blockedRiders: number;
  totalModules: number;
  totalAssignments: number;
  completed: number;
  pending: number;
  overdue: number;
  inProgress: number;
  notStarted: number;
  completionRate: number;
  overdueRate: number;
  generatedAt: string;
}

export interface CityRow {
  city: string;
  riders: number;
  blockedRiders: number;
  totalAssignments: number;
  completed: number;
  pending: number;
  overdue: number;
  completionRate: number;
}

export interface ModuleStats {
  module: { id: string; title: Localized; version: number };
  assigned: number;
  completed: number;
  pending: number;
  overdue: number;
  completionRate: number;
  started: number;
  notStarted: number;
  videoCompleted: number;
  avgVideoPercent: number;
  pdfViewed: number;
  quiz: {
    totalQuestions: number;
    passMark: number;
    attempted: number;
    passed: number;
    failed: number;
    totalAttempts: number;
    avgBestScore: number | null;
    passRate: number;
  } | null;
}

export interface ModuleRiderRow {
  rider: { id: string; name: string; phone: string; city: string | null; isBlocked: boolean } | null;
  status: AssignmentStatus;
  dueAt: string;
  completedAt: string | null;
  progress: ProgressView;
}

export interface AssignResult {
  matchedRiders: number;
  newlyAssigned: number;
  alreadyAssigned: number;
  updatedExisting: number;
  dueAt: string;
}

export interface DeadlineCheckResult {
  checkedAt?: string;
  overdue?: number;
  blocked?: number;
  skipped?: boolean;
}

/* ---------- request bodies ---------- */

export interface ModuleBody {
  title?: Localized;
  description?: Localized;
  deadlineDays?: number;
  videoCompletePercent?: number;
  isActive?: boolean;
}

export interface QuizBody {
  passMark: number;
  questions: { id?: string; text: Localized; options: Localized[]; correctIndex: number }[];
}

export interface AssignBody {
  userIds?: string[];
  city?: string;
  dueAt?: string;
  dueInMinutes?: number;
  updateExisting?: boolean;
}

export interface RiderQuery {
  status?: 'blocked' | 'active';
  city?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface RiderBody {
  phone?: string;
  name?: string;
  city?: string;
  language?: Lang;
  isActive?: boolean;
}
