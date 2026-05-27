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
  setDoc,
  updateDoc,
  query,
  where,
  writeBatch,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from './firebase'

export const MODULE_CATEGORIES = {
  SAFETY: 'safety',
  PRIVACY: 'privacy',
  CYBERBULLYING: 'cyberbullying',
  SCREEN_TIME: 'screen_time',
  EMOTIONAL_HEALTH: 'emotional_health',
  COMMUNICATION: 'communication',
  CUSTOM: 'custom',
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
const MODULE_ASSIGNMENTS = 'module_assignments'
const LEARNING_PROGRESS = 'learning_progress'

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

export async function getModulesForChild(childId, category) {
  const rows = await getModulesByCategory(category)
  return rows.filter((m) => {
    if (!m.isChildSpecific) return true
    const targets = Array.isArray(m.targetChildIds) ? m.targetChildIds : []
    return targets.includes(childId)
  })
}

export async function getModuleById(moduleId) {
  const snap = await getDoc(doc(db, MODULES, moduleId))
  return snap.exists() ? withId(snap) : null
}

export async function getLessonsForModule(moduleId, category = null) {
  const lessonsRef = collection(db, MODULES, moduleId, LESSONS)
  const snap = category
    ? await getDocs(query(lessonsRef, where('category', '==', category)))
    : await getDocs(lessonsRef)
  return sortNewestFirst(snap.docs.map(withId))
}

export async function getLessonById(moduleId, lessonId) {
  const snap = await getDoc(doc(db, MODULES, moduleId, LESSONS, lessonId))
  return snap.exists() ? withId(snap) : null
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
 * Create a module with no lessons. Mirrors Swift `createModule(...)`.
 * `estimatedDuration` is in MINUTES — stored as seconds to match iOS.
 */
export async function createModule({
  title,
  description,
  category,
  difficulty = 1,
  estimatedDuration = 15,
  createdBy,
  createdByName,
}) {
  const payload = {
    title: trim(title),
    subtitle: trim(title),
    description: trim(description),
    icon: 'book.closed',
    difficulty,
    estimatedDuration: estimatedDuration * 60,
    category: category === MODULE_CATEGORIES.CHILD ? MODULE_CATEGORIES.CHILD : MODULE_CATEGORIES.PARENT,
    isActive: true,
    isCustomModule: true,
    lessonCount: 0,
    createdBy,
    createdByName,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }
  const ref = doc(collection(db, MODULES))
  await setDoc(ref, payload)
  return { id: ref.id, ...payload }
}

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

/**
 * Add a lesson to an existing module. Mirrors Swift `createLesson(...)`.
 * Enforces the same permission check: only the module creator can add lessons.
 */
export async function createLesson({
  moduleId,
  title,
  description,
  questions,
  createdBy,
  createdByName,
  category,
}) {
  if (!Array.isArray(questions) || questions.length === 0) {
    throw new Error('At least one question is required to create a lesson.')
  }
  const module_ = await getModuleById(moduleId)
  if (!module_) throw new Error('Module not found')
  if (module_.createdBy && module_.createdBy !== createdBy) {
    throw new Error('You do not have permission to add lessons to this module.')
  }

  const actualCategory = module_.category || category
  const lessonRef = doc(collection(db, MODULES, moduleId, LESSONS))
  const payload = {
    title: trim(title),
    description: trim(description),
    questions,
    createdBy,
    createdByName,
    category: actualCategory,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }
  await setDoc(lessonRef, payload)
  await updateModuleLessonCount(moduleId)
  return { id: lessonRef.id, ...payload }
}

export async function updateModuleLessonCount(moduleId) {
  const lessons = await getLessonsForModule(moduleId)
  await updateDoc(doc(db, MODULES, moduleId), {
    lessonCount: lessons.length,
    updatedAt: serverTimestamp(),
  })
}

// ─── Assignments ─────────────────────────────────────────────────────────────

/**
 * Mirrors Swift `assignModuleToChild(...)`. Uses a deterministic
 * `{childId}_{moduleId}` document id so re-assigning is idempotent.
 */
export async function assignModuleToChild({
  parentId,
  childId,
  moduleId,
  category = MODULE_CATEGORIES.CHILD,
}) {
  const assignmentId = `${childId}_${moduleId}`
  const ref = doc(db, MODULE_ASSIGNMENTS, assignmentId)
  await setDoc(
    ref,
    {
      parentId,
      childId,
      moduleId,
      category: category === MODULE_CATEGORIES.CHILD ? MODULE_CATEGORIES.CHILD : MODULE_CATEGORIES.PARENT,
      assignedAt: serverTimestamp(),
      isCompleted: false,
      progress: 0,
      completedLessonIds: [],
    },
    { merge: true },
  )
  return assignmentId
}

export async function isModuleAssignedToChild(childId, moduleId) {
  const snap = await getDoc(doc(db, MODULE_ASSIGNMENTS, `${childId}_${moduleId}`))
  return snap.exists()
}

/**
 * Fetch every assignment created by this parent. Used by the Modules tab to
 * show a roll-up across all children.
 */
export async function getAssignmentsForParent(parentId) {
  const snap = await getDocs(
    query(collection(db, MODULE_ASSIGNMENTS), where('parentId', '==', parentId)),
  )
  const rows = snap.docs.map(withId)
  return rows.sort(
    (a, b) => tsMillis(b.assignedAt) - tsMillis(a.assignedAt),
  )
}

// ─── Progress ────────────────────────────────────────────────────────────────

export async function getLearningProgressForChild(childId, category = null) {
  const constraints = [where('childId', '==', childId)]
  if (category) constraints.push(where('category', '==', category))
  const snap = await getDocs(
    query(collection(db, LEARNING_PROGRESS), ...constraints),
  )
  return snap.docs.map(withId)
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
