import { useState } from "react";
import { GRADES, inputCls } from "../_lib/constants";
import { ErrorBanner, Field } from "./StepShell";

export function ChildForm({ onSave, onCancel, saveLabel = "Add child →" }) {
  const [name, setName] = useState("");
  const [bday, setBday] = useState("");
  const [gender, setGender] = useState("");
  const [grade, setGrade] = useState("");
  const [err, setErr] = useState("");

  const handleSave = () => {
    if (!name || !bday || !gender || !grade) {
      setErr("Please complete all fields.");
      return;
    }
    setErr("");
    onSave({ name, bday, gender, grade });
  };

  return (
    <div className="rounded border border-[var(--border)] bg-[var(--background)] px-5 py-5">
      <ErrorBanner msg={err} />
      <div className="grid gap-4">
        <Field label="Child's full name">
          <input
            type="text"
            className={inputCls}
            placeholder="e.g. Emma Johnson"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Date of birth">
            <input
              type="date"
              className={inputCls}
              value={bday}
              onChange={(e) => setBday(e.target.value)}
            />
          </Field>
          <Field label="Gender">
            <select
              className={inputCls}
              value={gender}
              onChange={(e) => setGender(e.target.value)}
            >
              <option value="">Select…</option>
              {["Girl", "Boy", "Non-binary", "Prefer not to say"].map((g) => (
                <option key={g}>{g}</option>
              ))}
            </select>
          </Field>
        </div>
        <Field label="School grade">
          <select
            className={inputCls}
            value={grade}
            onChange={(e) => setGrade(e.target.value)}
          >
            <option value="">Select grade…</option>
            {GRADES.map((g) => (
              <option key={g}>{g}</option>
            ))}
          </select>
        </Field>
      </div>
      <div className="mt-5 flex justify-end gap-2">
        {onCancel && (
          <button
            onClick={onCancel}
            className="rounded border border-[var(--border)] px-4 py-2 font-sans text-[0.72rem] font-medium text-[var(--muted)] transition hover:bg-[var(--surface)]"
          >
            Cancel
          </button>
        )}
        <button
          onClick={handleSave}
          className="rounded bg-[var(--accent)] px-5 py-2 font-sans text-[0.72rem] font-semibold uppercase tracking-wider text-white transition hover:bg-[var(--accent-hover)]"
        >
          {saveLabel}
        </button>
      </div>
    </div>
  );
}
