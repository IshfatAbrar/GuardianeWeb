// Learning modules, assignments and progress. Shapes match the Android apps so
// modules assigned on either platform are interoperable.
//
// Collections:
//   modules/{id}                          — module documents (ids "1".."8" for
//                                           the built-ins; `moduleId` is a NUMBER
//                                           in the doc but a STRING in the
//                                           assignment id — verified live)
//   modules/{id}/lessons/{lessonId}       — lesson documents (subcollection)
//   module_assignments/{childId}_{moduleId} — per-child assignment, deterministic
//                                           doc id. Mirrors GuardParent's
//                                           assignModuleToChild exactly.
//   learning_progress/{childId}_{moduleId} — progress, WRITTEN BY THE CHILD APP
//                                           as it completes lessons. Read-only
//                                           here: a parent does not set a child's
//                                           progress, the child's device reports it.

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
  writeBatch,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore'
import { db } from './firebase'

export const MODULE_CATEGORIES = {
  PARENT: 'parent',
  CHILD: 'child',
}

export const QUESTION_TYPES = {
  MULTIPLE_CHOICE: 'multiple_choice',
  TRUE_FALSE: 'true_false',
  FILL_BLANK: 'fill_blank',
}

const MODULES = 'modules'
const LESSONS = 'lessons'
const ASSIGNMENTS = 'module_assignments'
const LEARNING_PROGRESS = 'learning_progress'

/** The deterministic assignment / progress key both Android apps use. */
export function assignmentKey(childId, moduleId) {
  return `${childId}_${String(moduleId)}`
}

export const ASSIGNMENT_PRIORITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
}

// 'in_progress' and 'completed' match the `status` the child app writes to
// learning_progress; 'assigned' is this app's name for the child's
// 'not_started', and 'overdue' is derived from dueDate rather than stored.
export const ASSIGNMENT_STATUS = {
  ASSIGNED: 'assigned',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  OVERDUE: 'overdue',
}

function trim(value) {
  return typeof value === 'string' ? value.trim() : ''
}

function withId(snap) {
  return { id: snap.id, ...snap.data() }
}

function tsMillis(value) {
  if (!value) return 0
  if (typeof value.toMillis === 'function') return value.toMillis()
  if (value instanceof Date) return value.getTime()
  return 0
}

function sortNewestFirst(rows) {
  return [...rows].sort(
    (a, b) => tsMillis(b.createdAt) - tsMillis(a.createdAt),
  )
}

// ─── Modules: read ───────────────────────────────────────────────────────────

export async function getModulesByCategory(category) {
  const snap = await getDocs(
    query(collection(db, MODULES), where('category', '==', category)),
  )
  return sortNewestFirst(snap.docs.map(withId))
}

export async function getModuleById(moduleId) {
  const snap = await getDoc(doc(db, MODULES, moduleId))
  return snap.exists() ? withId(snap) : null
}

export async function getLessonsForModule(moduleId) {
  const snap = await getDocs(collection(db, MODULES, moduleId, LESSONS))
  return sortNewestFirst(snap.docs.map(withId))
}

export async function getModuleWithLessons(moduleId) {
  const module_ = await getModuleById(moduleId)
  if (!module_) return null
  const lessons = await getLessonsForModule(moduleId)
  return { ...module_, lessons }
}

/**
 * Mirrors Swift `fetchModules()`. Returns all parent + child modules with their
 * lessons folded in. Lessons are fetched in parallel; failures degrade to the
 * bare module.
 */
export async function fetchAllModules() {
  const [parentModules, childModules] = await Promise.all([
    getModulesByCategory(MODULE_CATEGORIES.PARENT),
    getModulesByCategory(MODULE_CATEGORIES.CHILD),
  ])
  const all = [...parentModules, ...childModules]

  const withLessons = await Promise.all(
    all.map(async (m) => {
      try {
        const lessons = await getLessonsForModule(m.id)
        return { ...m, lessons }
      } catch {
        return { ...m, lessons: [] }
      }
    }),
  )
  return withLessons
}

// ─── Modules: write ──────────────────────────────────────────────────────────

/**
 * Atomically create a module + its first lesson. Mirrors Swift
 * `createModuleWithLesson(...)`. Throws if `questions` is empty.
 *
 * `questions` should already be in iOS dict shape — see `buildQuestion()`.
 */
export async function createModuleWithLesson({
  title,
  description,
  category,
  difficulty = 1,
  estimatedDuration = 15,
  questions,
  createdBy,
  createdByName,
  targetChildIds = null,
  isChildSpecific = false,
}) {
  if (!Array.isArray(questions) || questions.length === 0) {
    throw new Error('At least one question is required to create a lesson.')
  }

  const batch = writeBatch(db)
  const moduleRef = doc(collection(db, MODULES))
  const lessonRef = doc(collection(db, MODULES, moduleRef.id, LESSONS))

  const normalizedCategory =
    category === MODULE_CATEGORIES.CHILD ? MODULE_CATEGORIES.CHILD : MODULE_CATEGORIES.PARENT

  const modulePayload = {
    title: trim(title),
    subtitle: trim(title),
    description: trim(description),
    icon: 'book.closed',
    difficulty,
    estimatedDuration: estimatedDuration * 60,
    category: normalizedCategory,
    isActive: true,
    isCustomModule: true,
    lessonCount: 1,
    createdBy,
    createdByName,
    isChildSpecific,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }
  if (Array.isArray(targetChildIds) && targetChildIds.length > 0) {
    modulePayload.targetChildIds = targetChildIds
  }

  const lessonPayload = {
    title: trim(title),
    description: trim(description),
    questions,
    createdBy,
    createdByName,
    category: normalizedCategory,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }

  batch.set(moduleRef, modulePayload)
  batch.set(lessonRef, lessonPayload)
  await batch.commit()

  return {
    id: moduleRef.id,
    lessonId: lessonRef.id,
    ...modulePayload,
  }
}

// ─── Assignments ─────────────────────────────────────────────────────────────
//
// `module_assignments/{childId}_{moduleId}`, matching GuardParent's
// assignModuleToChild: a deterministic id means assigning twice is idempotent
// rather than creating a duplicate row.
//
// The Android schema stores only { parentId, childId, moduleId, category,
// assignedAt }. This app additionally writes `priority` and `dueDate`, which
// have no Android counterpart — both apps ignore unknown fields, so they are
// additive and safe, but note the child never sees them.

/**
 * Assign a module to a child. Idempotent: re-assigning refreshes the row rather
 * than duplicating it. `dueDate`, if provided, should be a JS Date or null.
 */
export async function assignModule({
  moduleId,
  childId,
  parentId,
  category = MODULE_CATEGORIES.CHILD,
  priority = ASSIGNMENT_PRIORITY.MEDIUM,
  dueDate = null,
}) {
  if (!moduleId) throw new Error('moduleId is required')
  if (!childId) throw new Error('childId is required')
  if (!parentId) throw new Error('parentId is required')

  const data = {
    parentId,
    childId,
    // String, always: the assignment id is built from a string, and GuardParent
    // writes String(moduleId) even though the module doc's own `moduleId` is a
    // number. Matching it keeps equality filters working across both apps.
    moduleId: String(moduleId),
    category: category === MODULE_CATEGORIES.PARENT ? 'parent' : 'child',
    assignedAt: serverTimestamp(),
    priority,
  }
  if (dueDate instanceof Date) {
    data.dueDate = Timestamp.fromDate(dueDate)
  }

  const id = assignmentKey(childId, moduleId)
  await setDoc(doc(db, ASSIGNMENTS, id), data, { merge: true })
  return id
}

/**
 * Real-time listener over this parent's assignments. `onUpdate` receives the
 * array; `onError` is called on snapshot errors. Returns an unsubscribe.
 *
 * Single equality on parentId, sorted client-side — no composite index needed.
 */
export function listenToAssignments(parentId, onUpdate, onError) {
  if (!parentId) return () => {}
  const q = query(collection(db, ASSIGNMENTS), where('parentId', '==', parentId))
  return onSnapshot(
    q,
    (snap) => {
      const rows = snap.docs
        .map(withId)
        .sort((a, b) => tsMillis(b.assignedAt) - tsMillis(a.assignedAt))
      onUpdate?.(rows)
    },
    (err) => onError?.(err),
  )
}

/**
 * Unassign. A hard delete, matching GuardParent's unassignModuleFromChild —
 * there is no isActive flag in this schema, and a soft-deleted row would still
 * show as assigned in the Android app.
 */
export async function unassignModule(childId, moduleId) {
  await deleteDoc(doc(db, ASSIGNMENTS, assignmentKey(childId, moduleId)))
}

// ─── Learning progress (read-only) ───────────────────────────────────────────

/**
 * Every progress row for a child, keyed by `{childId}_{moduleId}` — the same key
 * as the assignment, so callers can join the two by id.
 *
 * Written by the child app as lessons are completed. Fields: childId, moduleId
 * (a number here, unlike the assignment's string), lessonsCompleted,
 * totalLessons, progress (0..1), status, lastUpdated.
 */
export async function fetchLearningProgressForChild(childId) {
  if (!childId) return new Map()
  const snap = await getDocs(
    query(collection(db, LEARNING_PROGRESS), where('childId', '==', childId)),
  )
  return new Map(snap.docs.map((d) => [d.id, withId(d)]))
}

/** Merge progress for several children into one map keyed by assignment id. */
export async function fetchLearningProgressForChildren(childIds) {
  const ids = Array.isArray(childIds) ? childIds.filter(Boolean) : []
  const maps = await Promise.all(ids.map((id) => fetchLearningProgressForChild(id)))
  const merged = new Map()
  for (const m of maps) {
    for (const [k, v] of m) merged.set(k, v)
  }
  return merged
}

/** Clamp to 0..1, or null when the input isn't a usable number. */
function clamp01(value) {
  if (typeof value !== 'number' || Number.isNaN(value)) return null
  return Math.max(0, Math.min(1, value))
}

/**
 * Completion fraction 0..1 for an assignment, given the progress map.
 *
 * NOTE THE SCALE: the child app stores `progress` as a PERCENT 0..100
 * (`Math.round((lessonsCompleted / totalLessons) * 100)`), and GuardParent reads
 * it as one. Treating it as a 0..1 fraction makes every module with any
 * progress at all clamp to 1.0 and read as complete.
 *
 * It is also **NaN** on real rows: a module with no lessons computes 0/0, and
 * Firestore stores that NaN faithfully. `typeof NaN === 'number'`, so it has to
 * be rejected explicitly or it reaches the DOM as `width: NaN%`.
 */
export function progressFor(assignment, progressById) {
  const row = progressById?.get(assignmentKey(assignment?.childId, assignment?.moduleId))
  if (!row) return 0
  const fromPercent = clamp01(
    typeof row.progress === 'number' ? row.progress / 100 : null,
  )
  if (fromPercent !== null) return fromPercent
  // Fall back to lesson counts when `progress` is absent or NaN.
  const done = Number(row.lessonsCompleted) || 0
  const total = Number(row.totalLessons) || 0
  return total > 0 ? clamp01(done / total) ?? 0 : 0
}

/** True when the child's device has reported this module complete. */
export function isAssignmentCompleted(assignment, progressById) {
  const row = progressById?.get(assignmentKey(assignment?.childId, assignment?.moduleId))
  if (row?.status === ASSIGNMENT_STATUS.COMPLETED) return true
  return progressFor(assignment, progressById) >= 1
}

/**
 * True if the assignment has a dueDate in the past and the child hasn't
 * finished it. Completion comes from the progress map, not the assignment row —
 * the assignment carries no status in this schema.
 */
export function isAssignmentOverdue(assignment, progressById) {
  if (!assignment || isAssignmentCompleted(assignment, progressById)) return false
  const due = assignment.dueDate
  if (!due) return false
  const ms = typeof due.toMillis === 'function' ? due.toMillis() : new Date(due).getTime()
  return Number.isFinite(ms) && ms < Date.now()
}

/** Effective status, derived from the child's reported progress + dueDate. */
export function effectiveAssignmentStatus(assignment, progressById) {
  if (!assignment) return ASSIGNMENT_STATUS.ASSIGNED
  if (isAssignmentCompleted(assignment, progressById)) return ASSIGNMENT_STATUS.COMPLETED
  if (isAssignmentOverdue(assignment, progressById)) return ASSIGNMENT_STATUS.OVERDUE
  return progressFor(assignment, progressById) > 0
    ? ASSIGNMENT_STATUS.IN_PROGRESS
    : ASSIGNMENT_STATUS.ASSIGNED
}

// ─── Question builders ───────────────────────────────────────────────────────
// Helpers that produce the dict shape Swift's Question(from: dict) expects.

function makeId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `q_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

export function buildMultipleChoiceQuestion({
  question,
  explanation = '',
  options,
  correctAnswerIndex,
}) {
  if (typeof question !== 'string' || !question.trim()) {
    throw new Error('Question text is required.')
  }
  if (!Array.isArray(options) || options.length < 2) {
    throw new Error('Multiple-choice questions need at least two options.')
  }
  if (
    typeof correctAnswerIndex !== 'number' ||
    correctAnswerIndex < 0 ||
    correctAnswerIndex >= options.length
  ) {
    throw new Error('Pick which option is correct.')
  }
  return {
    id: makeId(),
    type: QUESTION_TYPES.MULTIPLE_CHOICE,
    question: question.trim(),
    explanation: explanation.trim(),
    options: options.map((o) => o.trim()),
    correctAnswer: options[correctAnswerIndex].trim(),
    correctAnswerIndex,
  }
}

export function buildTrueFalseQuestion({ question, explanation = '', correctAnswer }) {
  if (typeof question !== 'string' || !question.trim()) {
    throw new Error('Question text is required.')
  }
  const normalized = String(correctAnswer).toLowerCase()
  if (normalized !== 'true' && normalized !== 'false') {
    throw new Error('Pick True or False.')
  }
  return {
    id: makeId(),
    type: QUESTION_TYPES.TRUE_FALSE,
    question: question.trim(),
    explanation: explanation.trim(),
    options: ['True', 'False'],
    correctAnswer: normalized === 'true' ? 'True' : 'False',
    correctAnswerIndex: normalized === 'true' ? 0 : 1,
  }
}

export function buildFillBlankQuestion({ question, explanation = '', acceptedAnswers }) {
  if (typeof question !== 'string' || !question.trim()) {
    throw new Error('Question text is required.')
  }
  const cleaned = (Array.isArray(acceptedAnswers) ? acceptedAnswers : [])
    .map((a) => (typeof a === 'string' ? a.trim() : ''))
    .filter(Boolean)
  if (cleaned.length === 0) {
    throw new Error('Provide at least one accepted answer.')
  }
  return {
    id: makeId(),
    type: QUESTION_TYPES.FILL_BLANK,
    question: question.trim(),
    explanation: explanation.trim(),
    acceptedAnswers: cleaned,
    correctAnswer: cleaned[0],
  }
}
