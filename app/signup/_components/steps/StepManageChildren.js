import { useState } from 'react'
import { Plus } from 'lucide-react'
import { ChildCard } from '../ChildCard'
import { ChildForm } from '../ChildForm'
import { StepCard, StepFooter } from '../StepShell'

export function StepManageChildren({ childList, onAdd, onRemove, onNext, onBack }) {
  const [showForm, setShowForm] = useState(false)

  const handleAdd = (child) => {
    onAdd(child)
    setShowForm(false)
  }

  return (
    <StepCard title="Manage children" sub="Review and edit your children's profiles">
      <div className="grid gap-2.5">
        {childList.map((c, i) => (
          <ChildCard key={i} child={c} onRemove={() => onRemove(i)} />
        ))}
      </div>

      {showForm ? (
        <div className="mt-4">
          <ChildForm onSave={handleAdd} onCancel={() => setShowForm(false)} saveLabel="Save child" />
        </div>
      ) : (
        <button
          onClick={() => setShowForm(true)}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded border-[1.5px] border-dashed border-[var(--accent-border)] py-3 font-sans text-[0.78rem] font-medium text-[var(--accent)] transition hover:bg-[var(--accent-bg)]"
        >
          <Plus className="h-4 w-4" />
          Add another child
        </button>
      )}

      <StepFooter onBack={onBack} onNext={onNext} nextLabel="Continue →" />
    </StepCard>
  )
}
