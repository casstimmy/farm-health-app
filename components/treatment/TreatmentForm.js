import { useState } from "react";

const initialForm = {
  date: "",
  animalId: "",
  breed: "",
  gender: "",
  routine: "NO",
  symptoms: "",
  possibleCause: "",
  diagnosis: "",
  prescribedDays: "",
  type: "",
  preWeight: "",
  medication: "",
  dosage: "",
  route: "",
  treatedBy: "",
  postObservation: "",
  observationTime: "",
  completionDate: "",
  recoveryStatus: "",
  postWeight: "",
  notes: ""
};

export default function TreatmentForm({ onSubmit, loading }) {
  const [form, setForm] = useState(initialForm);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <form className="space-y-4 bg-white p-6 rounded-xl shadow" onSubmit={handleSubmit}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <input name="date" type="date" value={form.date} onChange={handleChange} className="input" placeholder="Date" required />
        <input name="animalId" value={form.animalId} onChange={handleChange} className="input" placeholder="Animal ID" required />
        <input name="breed" value={form.breed} onChange={handleChange} className="input" placeholder="Breed" />
        <input name="gender" value={form.gender} onChange={handleChange} className="input" placeholder="Gender" />
        <input name="routine" value={form.routine} onChange={handleChange} className="input" placeholder="Routine" />
        <input name="symptoms" value={form.symptoms} onChange={handleChange} className="input" placeholder="Symptoms" />
        <input name="possibleCause" value={form.possibleCause} onChange={handleChange} className="input" placeholder="Possible Cause" />
        <input name="diagnosis" value={form.diagnosis} onChange={handleChange} className="input" placeholder="Diagnosis" />
        <input name="prescribedDays" value={form.prescribedDays} onChange={handleChange} className="input" placeholder="Prescribed Treatment Days" />
        <input name="type" value={form.type} onChange={handleChange} className="input" placeholder="Type of Treatment" />
        <input name="preWeight" value={form.preWeight} onChange={handleChange} className="input" placeholder="Pre-Treatment Weight" />
        <input name="medication" value={form.medication} onChange={handleChange} className="input" placeholder="Treatment/Medication" />
        <input name="dosage" value={form.dosage} onChange={handleChange} className="input" placeholder="Dosage" />
        <input name="route" value={form.route} onChange={handleChange} className="input" placeholder="Route" />
        <input name="treatedBy" value={form.treatedBy} onChange={handleChange} className="input" placeholder="Treated by" />
        <input name="postObservation" value={form.postObservation} onChange={handleChange} className="input" placeholder="Post Treatment Observation" />
        <input name="observationTime" value={form.observationTime} onChange={handleChange} className="input" placeholder="Observation Time" />
        <input name="completionDate" type="date" value={form.completionDate} onChange={handleChange} className="input" placeholder="Treatment Completion Date" />
        <input name="recoveryStatus" value={form.recoveryStatus} onChange={handleChange} className="input" placeholder="Recovery Status" />
        <input name="postWeight" value={form.postWeight} onChange={handleChange} className="input" placeholder="Post-Treatment Weight" />
        <input name="notes" value={form.notes} onChange={handleChange} className="input" placeholder="Notes/Treatment Plan Summary" />
      </div>
      <button type="submit" className="btn-primary w-full" disabled={loading}>
        {loading ? "Saving..." : "Save Treatment"}
      </button>
    </form>
  );
}
