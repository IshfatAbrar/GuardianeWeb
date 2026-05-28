// JS port of iOS `LearningModuleService` (Services/LearningModuleService.swift).
// Talks directly to Firestore. Field names and shapes match the iOS writer so
// modules created on either platform are interoperable.
//
// Collections:
//   modules/{id}                       — module documents
//   modules/{id}/lessons/{lessonId}    — lesson documents (subcollection)
//   module_assignments/{childId_moduleId} — per-child assignment
//   learning_progress/{*}              — progress (read-only here)

import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
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
const ASSIGNMENTS = 'assignments'

export const ASSIGNMENT_PRIORITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
}

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
// Mirrors iOS Module Assignment. Writes to the `assignments` collection with
// the full schema: priority / dueDate / status / isActive. Soft delete via
// isActive=false (matches iOS deleteAssignment).

/**
 * Create a new assignment. Mirrors Swift `FirebaseService.createAssignment`.
 * Caller is responsible for passing `familyId` (read from the parent's user
 * profile). `dueDate`, if provided, should be a JS Date or null.
 */
export async function assignModule({
  moduleId,
  childId,
  parentId,
  familyId,
  priority = ASSIGNMENT_PRIORITY.MEDIUM,
  dueDate = null,
}) {
  if (!moduleId) throw new Error('moduleId is required')
  if (!childId) throw new Error('childId is required')
  if (!parentId) throw new Error('parentId is required')
  if (!familyId) throw new Error('familyId is required')

  const data = {
    moduleId,
    childId,
    parentId,
    familyId,
    assignedAt: serverTimestamp(),
    isCompleted: false,
    isActive: true,
    progress: 0,
    priority,
    status: ASSIGNMENT_STATUS.ASSIGNED,
    privacyLevel: 'standard',
  }
  if (dueDate instanceof Date) {
    data.dueDate = Timestamp.fromDate(dueDate)
  }

  const ref = await addDoc(collection(db, ASSIGNMENTS), data)
  return ref.id
}

/**
 * Real-time listener. Mirrors iOS `FirebaseService.listenToAssignments`.
 * `onUpdate` receives the array of assignments. `onError` is called on snapshot
 * errors. Returns an unsubscribe function.
 */
export function listenToAssignments(parentId, onUpdate, onError) {
  if (!parentId) return () => {}
  const q = query(
    collection(db, ASSIGNMENTS),
    where('parentId', '==', parentId),
    where('isActive', '==', true),
  )
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

async function patchAssignment(assignmentId, data) {
  await updateDoc(doc(db, ASSIGNMENTS, assignmentId), data)
}

/** Set progress, deriving status / isCompleted. */
export async function updateAssignmentProgress(assignmentId, progress) {
  const clamped = Math.max(0, Math.min(1, Number(progress) || 0))
  const isComplete = clamped >= 1
  await patchAssignment(assignmentId, {
    progress: clamped,
    isCompleted: isComplete,
    status: isComplete
      ? ASSIGNMENT_STATUS.COMPLETED
      : clamped > 0
      ? ASSIGNMENT_STATUS.IN_PROGRESS
      : ASSIGNMENT_STATUS.ASSIGNED,
  })
}

/** Soft delete by flipping isActive=false. */
export async function softDeleteAssignment(assignmentId) {
  await patchAssignment(assignmentId, { isActive: false })
}

/**
 * True if the assignment has a dueDate in the past and is not completed.
 */
export function isAssignmentOverdue(assignment) {
  if (!assignment || assignment.isCompleted) return false
  const due = assignment.dueDate
  if (!due) return false
  const ms = typeof due.toMillis === 'function' ? due.toMillis() : new Date(due).getTime()
  return Number.isFinite(ms) && ms < Date.now()
}

/**
 * Returns the effective status, taking overdue into account.
 */
export function effectiveAssignmentStatus(assignment) {
  if (!assignment) return ASSIGNMENT_STATUS.ASSIGNED
  if (assignment.isCompleted) return ASSIGNMENT_STATUS.COMPLETED
  if (isAssignmentOverdue(assignment)) return ASSIGNMENT_STATUS.OVERDUE
  return assignment.status || ASSIGNMENT_STATUS.ASSIGNED
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
