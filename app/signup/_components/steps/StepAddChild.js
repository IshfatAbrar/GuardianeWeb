import { ChildForm } from "../ChildForm";
import { StepCard } from "../StepShell";

export function StepAddChild({ onNext, onBack }) {
  return (
    <StepCard
      title="Add your child"
      sub="Enter your child's details to set up their profile"
    >
      <ChildForm onSave={onNext} onCancel={onBack} saveLabel="Add child →" />
    </StepCard>
  );
}
