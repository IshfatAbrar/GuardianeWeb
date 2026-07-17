// Emergency contacts — the parent's crisis call list.
//
// SCHEMA CONTRACT — `emergency_contacts`, verified against live data:
//   { parentId, name, phone, relationship, isEmergency, notes,
//     createdAt, updatedAt }
//
// This is a genuine two-way integration, not a web-only feature: the Android
// CHILD app reads these directly (EmergencyContactsModal queries
// where('parentId','==',<their parent>) and shows the ones with isEmergency),
// so what a parent saves here is what the child can reach in a crisis. Keep the
// shape exactly as GuardParent writes it.

import {
  collection,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from './firebase'

export const EMERGENCY_CONTACTS_COLLECTION = 'emergency_contacts'

// GuardParent's own add form writes the literal "Emergency Contact" here rather
// than a real relationship, and always forces isEmergency true
// (`contactData.isEmergency || true` — an accidental tautology). The web offers
// a real relationship instead; the field is free text, and the child app only
// reads `name`/`phone`/`isEmergency`, so a truthful value is safe.
export const DEFAULT_RELATIONSHIP = 'Emergency Contact'

export const RELATIONSHIP_OPTIONS = [
  'Parent',
  'Guardian',
  'Grandparent',
  'Sibling',
  'Aunt / Uncle',
  'Family friend',
  'Neighbour',
  'Doctor',
  'School',
  'Emergency Contact',
]

function rowFrom(snapshotDoc) {
  return { id: snapshotDoc.id, ...snapshotDoc.data() }
}

/**
 * Live emergency contacts for a parent.
 *
 * Single equality on parentId, sorted client-side — an orderBy would need a
 * composite index that isn't deployed. Contacts marked isEmergency float to the
 * top, since those are the ones the child's app surfaces first.
 * Returns the unsubscribe function.
 */
export function listenToEmergencyContacts(parentId, callback) {
  if (!parentId) {
    callback([])
    return () => {}
  }
  return onSnapshot(
    query(collection(db, EMERGENCY_CONTACTS_COLLECTION), where('parentId', '==', parentId)),
    (snap) => {
      const rows = snap.docs.map(rowFrom).sort((a, b) => {
        if (!!b.isEmergency !== !!a.isEmergency) return b.isEmergency ? 1 : -1
        return (a.name || '').localeCompare(b.name || '')
      })
      callback(rows)
    },
    () => callback([]),
  )
}

function cleanContact({ name, phone, relationship, notes, isEmergency }) {
  const trimmedName = (name || '').trim()
  const trimmedPhone = (phone || '').trim()
  if (!trimmedName) throw new Error('Name is required')
  if (!trimmedPhone) throw new Error('Phone number is required')
  return {
    name: trimmedName,
    phone: trimmedPhone,
    relationship: (relationship || '').trim() || DEFAULT_RELATIONSHIP,
    notes: (notes || '').trim(),
    // Unlike GuardParent, respect an explicit false — a contact the parent
    // deliberately unmarked shouldn't reappear on the child's crisis screen.
    isEmergency: isEmergency !== false,
  }
}

/** Add a contact. Returns the new document id. */
export async function createEmergencyContact({ parentId, ...contact }) {
  if (!parentId) throw new Error('Missing parentId')
  const ref = await addDoc(collection(db, EMERGENCY_CONTACTS_COLLECTION), {
    parentId,
    ...cleanContact(contact),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return ref.id
}

/** Update a contact in place. */
export async function updateEmergencyContact(contactId, contact) {
  if (!contactId) throw new Error('Missing contactId')
  await updateDoc(doc(db, EMERGENCY_CONTACTS_COLLECTION, contactId), {
    ...cleanContact(contact),
    updatedAt: serverTimestamp(),
  })
}

/** Remove a contact. The child app loses access to it immediately. */
export async function deleteEmergencyContact(contactId) {
  if (!contactId) throw new Error('Missing contactId')
  await deleteDoc(doc(db, EMERGENCY_CONTACTS_COLLECTION, contactId))
}

/** A `tel:` href, stripped of formatting the dialler won't accept. */
export function telHref(phone) {
  const cleaned = String(phone || '').replace(/[^\d+]/g, '')
  return cleaned ? `tel:${cleaned}` : null
}
