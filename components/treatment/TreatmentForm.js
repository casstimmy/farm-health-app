import { useState, useEffect } from "react";

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

const SYMPTOM_OPTIONS = [
  "Emaciation",
  "watery feaces",
  "Body scratching against wall",
];
export default function TreatmentForm({ onSubmit, loading }) {
  const [form, setForm] = useState(initialForm);
  const [animals, setAnimals] = useState([]);
  const [customSymptom, setCustomSymptom] = useState("");

  useEffect(() => {
    // Fetch animal list for dropdown
    const fetchAnimals = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch("/api/animals", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setAnimals(data);
        }
      } catch (err) {}
    };
    fetchAnimals();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSymptomChange = (e) => {
    if (e.target.value === "custom") {
      setForm({ ...form, symptoms: customSymptom });
    } else {
      setForm({ ...form, symptoms: e.target.value });
      setCustomSymptom("");
    }
  };

  const handleCustomSymptom = (e) => {
    setCustomSymptom(e.target.value);
    setForm({ ...form, symptoms: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <form className="space-y-4 bg-white p-6 rounded-xl shadow" onSubmit={handleSubmit}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <input name="date" type="date" value={form.date} onChange={handleChange} className="input" placeholder="Date" required />
        {/* Animal dropdown */}
        <select
          name="animalId"
          value={form.animalId}
          onChange={handleChange}
          className="input"
          required
        >
          <option value="">Select Animal</option>
          {animals.map((a) => (
            <option key={a._id} value={a._id}>
              {a.tagId} - {a.breed} - {a.gender}
            </option>
          ))}
        </select>
        <input name="breed" value={form.breed} onChange={handleChange} className="input" placeholder="Breed" />
        <input name="gender" value={form.gender} onChange={handleChange} className="input" placeholder="Gender" />
        {/* Routine dropdown */}
        <select name="routine" value={form.routine} onChange={handleChange} className="input">
          <option value="NO">No</option>
          <option value="YES">Yes</option>
        </select>
        {/* Symptoms dropdown with custom */}
        <select
          name="symptoms"
          value={SYMPTOM_OPTIONS.includes(form.symptoms) ? form.symptoms : "custom"}
          onChange={handleSymptomChange}
          className="input"
        >
          <option value="">Select Symptom</option>
          {SYMPTOM_OPTIONS.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
          <option value="custom">Other (specify below)</option>
        </select>
        {form.symptoms && !SYMPTOM_OPTIONS.includes(form.symptoms) && (
          <input
            name="customSymptom"
            value={customSymptom}
            onChange={handleCustomSymptom}
            className="input"
            placeholder="Enter custom symptom"
          />
        )}
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
