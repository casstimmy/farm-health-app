import { useEffect, useState } from "react";

const initialForm = {
  date: "",
  animalId: "",
  routine: "",
  symptoms: "",
  possibleCause: "",
  diagnosis: "",
  prescribedDays: "",
  type: "",
  preWeight: "",
  medication: "",
  medicationName: "",
  dosage: "",
  route: "",
  treatedBy: "",
  postObservation: "",
  observationTime: "",
  completionDate: "",
  recoveryStatus: "",
  postWeight: "",
  notes: "",
};

const ROUTINE_OPTIONS = ["NO", "YES"];
const TYPE_OPTIONS = ["Vitamin Dosing", "Antibiotics", "Deworming", "Ext- Parasite", "Vaccination", "Other"];
const ROUTE_OPTIONS = ["IM", "Oral", "Subcutaneous", "Spray", "Backline", "Other"];
const RECOVERY_OPTIONS = ["Under Treatment", "Improving", "Recovered", "Regressing"];

export default function TreatmentForm({
  onSubmit,
  loading,
  initialData,
  onClose,
  medicationOptions = [],
  staffOptions = [],
}) {
  const buildFormState = () => {
    if (!initialData) {
      return {
        ...initialForm,
        date: new Date().toISOString().split("T")[0],
      };
    }
    return {
      ...initialForm,
      ...initialData,
      animalId: initialData.animal?._id || initialData.animalId || initialData.animal || "",
      medication: initialData.medication?._id || initialData.medication || "",
      date: initialData.date ? initialData.date.split("T")[0] : "",
      completionDate: initialData.completionDate ? initialData.completionDate.split("T")[0] : "",
    };
  };

  const [form, setForm] = useState(buildFormState);
  const [animals, setAnimals] = useState([]);

  useEffect(() => {
    const fetchAnimals = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch("/api/animals?compact=true", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const data = await res.json();
        setAnimals(Array.isArray(data) ? data : []);
      } catch {
        setAnimals([]);
      }
    };
    fetchAnimals();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "medication") {
      const selected = medicationOptions.find((m) => m._id === value);
      setForm((prev) => ({
        ...prev,
        medication: value,
        medicationName: selected?.item || "",
      }));
      return;
    }
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      ...form,
      animal: form.animalId,
      medication: form.medication || undefined,
      medicationName: form.medicationName || undefined,
      prescribedDays: form.prescribedDays === "" ? 0 : Number(form.prescribedDays),
      preWeight: form.preWeight === "" ? null : Number(form.preWeight),
      postWeight: form.postWeight === "" ? null : Number(form.postWeight),
      date: form.date ? new Date(form.date).toISOString() : new Date().toISOString(),
      completionDate: form.completionDate ? new Date(form.completionDate).toISOString() : undefined,
    };
    delete payload.animalId;
    onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
        <h3 className="font-bold text-blue-900 mb-3">Basic Info</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label">Date *</label>
            <input name="date" type="date" value={form.date} onChange={handleChange} className="input-field" required />
          </div>
          <div>
            <label className="label">Animal *</label>
            <select name="animalId" value={form.animalId} onChange={handleChange} className="input-field" required>
              <option value="">Select Animal</option>
              {animals.map((a) => (
                <option key={a._id} value={a._id}>
                  {a.tagId} - {a.name || a.breed || "Animal"}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4">
        <h3 className="font-bold text-green-900 mb-3">Diagnosis & Treatment</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="label">Routine</label>
            <select name="routine" value={form.routine} onChange={handleChange} className="input-field">
              <option value="">Select</option>
              {ROUTINE_OPTIONS.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Type of Treatment</label>
            <select name="type" value={form.type} onChange={handleChange} className="input-field">
              <option value="">Select</option>
              {TYPE_OPTIONS.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Prescribed Days</label>
            <input name="prescribedDays" type="number" min="0" value={form.prescribedDays} onChange={handleChange} className="input-field" placeholder="e.g. 3" />
          </div>
          <div>
            <label className="label">Symptoms</label>
            <input name="symptoms" value={form.symptoms} onChange={handleChange} className="input-field" />
          </div>
          <div>
            <label className="label">Possible Cause</label>
            <input name="possibleCause" value={form.possibleCause} onChange={handleChange} className="input-field" />
          </div>
          <div>
            <label className="label">Diagnosis</label>
            <input name="diagnosis" value={form.diagnosis} onChange={handleChange} className="input-field" />
          </div>
        </div>
      </div>

      <div className="bg-orange-50 border-2 border-orange-200 rounded-xl p-4">
        <h3 className="font-bold text-orange-900 mb-3">Medication & Weights</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="label">Medication (Inventory)</label>
            <select name="medication" value={form.medication || ""} onChange={handleChange} className="input-field">
              <option value="">Select medication</option>
              {medicationOptions.map((med) => (
                <option key={med._id} value={med._id}>
                  {med.item}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Dosage</label>
            <input name="dosage" value={form.dosage} onChange={handleChange} className="input-field" />
          </div>
          <div>
            <label className="label">Route</label>
            <select name="route" value={form.route} onChange={handleChange} className="input-field">
              <option value="">Select</option>
              {ROUTE_OPTIONS.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Pre-Weight (kg) - Optional</label>
            <input name="preWeight" type="number" step="0.1" min="0" value={form.preWeight} onChange={handleChange} className="input-field" />
          </div>
          <div>
            <label className="label">Post-Weight (kg) - Optional</label>
            <input name="postWeight" type="number" step="0.1" min="0" value={form.postWeight} onChange={handleChange} className="input-field" />
          </div>
          <div>
            <label className="label">Treated By (Staff)</label>
            <select name="treatedBy" value={form.treatedBy} onChange={handleChange} className="input-field">
              <option value="">Select staff</option>
              {staffOptions.map((staff) => (
                <option key={staff._id} value={staff.name || staff.email || staff.username}>
                  {staff.name || staff.email || staff.username}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-4">
        <h3 className="font-bold text-purple-900 mb-3">Observation & Recovery</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="label">Observation Time</label>
            <input name="observationTime" value={form.observationTime} onChange={handleChange} className="input-field" />
          </div>
          <div>
            <label className="label">Completion Date</label>
            <input name="completionDate" type="date" value={form.completionDate} onChange={handleChange} className="input-field" />
          </div>
          <div>
            <label className="label">Recovery Status</label>
            <select name="recoveryStatus" value={form.recoveryStatus} onChange={handleChange} className="input-field">
              <option value="">Select</option>
              {RECOVERY_OPTIONS.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          </div>
        </div>
        <div className="mt-4">
          <label className="label">Post Treatment Observation</label>
          <input name="postObservation" value={form.postObservation} onChange={handleChange} className="input-field" />
        </div>
      </div>

      <div className="bg-gray-50 border-2 border-gray-200 rounded-xl p-4">
        <label className="label">Notes</label>
        <textarea name="notes" value={form.notes} onChange={handleChange} className="input-field" rows={3} />
      </div>

      <div className="flex gap-3 sticky bottom-0 bg-white py-3 border-t">
        {onClose && (
          <button type="button" className="flex-1 btn-secondary-lg border rounded-lg px-4 py-2" onClick={onClose}>
            Cancel
          </button>
        )}
        <button type="submit" className="flex-1 btn-primary-lg bg-blue-600 hover:bg-blue-700 rounded-lg px-4 py-2" disabled={loading}>
          {loading ? "Saving..." : "Save Treatment"}
        </button>
      </div>
    </form>
  );
}
