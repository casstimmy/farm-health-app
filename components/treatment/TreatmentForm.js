import { useState, useEffect } from "react";

const initialForm = {
  date: "",
  animalId: "",
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

const ROUTINE_OPTIONS = ["NO", "YES"];
const SYMPTOM_OPTIONS = ["Emaciation", "watery feaces", "Body scratching against wall"];
const CAUSE_OPTIONS = ["worms", "Lice"];
const DIAGNOSIS_OPTIONS = ["Diarrhea", "External parasite"];
const PRESCRIBED_DAYS_OPTIONS = ["3days", "a week interval", "3days Interval"];
const TYPE_OPTIONS = ["Vitamin Dosing", "Antibiotics", "Deworming", "Ext- Parasite"];
const MEDICATION_OPTIONS = [
  "100ml VMultinor",
  "100ml Sulfanor",
  "Kepromec Ivermectin 50ml",
  "Pour On acaricide 210ml",
  "Jubail Levamisole 100ml"
];
const DOSAGE_OPTIONS = ["2ml", "4ml", "0.5ml", "5ml /Backline", "1ml"];
const ROUTE_OPTIONS = ["IM", "Subcutaneous"];
export default function TreatmentForm({ onSubmit, loading }) {
  const [form, setForm] = useState(initialForm);
  const [animals, setAnimals] = useState([]);
  const [customSymptom, setCustomSymptom] = useState("");
  const [customCause, setCustomCause] = useState("");
  const [customDiagnosis, setCustomDiagnosis] = useState("");
  const [customPrescribed, setCustomPrescribed] = useState("");
  const [customType, setCustomType] = useState("");
  const [customMedication, setCustomMedication] = useState("");
  const [customDosage, setCustomDosage] = useState("");
  const [customRoute, setCustomRoute] = useState("");

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

  // Generic handler for dropdowns with custom option
  const handleDropdownChange = (field, value, setCustom) => {
    if (value === "custom") {
      setForm({ ...form, [field]: "" });
      setCustom("");
    } else {
      setForm({ ...form, [field]: value });
      setCustom("");
    }
  };

  const handleCustomInput = (field, value, setCustom) => {
    setCustom(value);
    setForm({ ...form, [field]: value });
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
        {/* Routine dropdown */}
        <select name="routine" value={form.routine} onChange={handleChange} className="input">
          {ROUTINE_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
        {/* Symptoms dropdown with custom */}
        <select
          name="symptoms"
          value={SYMPTOM_OPTIONS.includes(form.symptoms) ? form.symptoms : "custom"}
          onChange={e => handleDropdownChange("symptoms", e.target.value, setCustomSymptom)}
          className="input"
        >
          <option value="">Symptoms</option>
          {SYMPTOM_OPTIONS.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
          <option value="custom">Other (specify below)</option>
        </select>
        {form.symptoms && !SYMPTOM_OPTIONS.includes(form.symptoms) && (
          <input
            name="customSymptom"
            value={customSymptom}
            onChange={e => handleCustomInput("symptoms", e.target.value, setCustomSymptom)}
            className="input"
            placeholder="Enter custom symptom"
          />
        )}
        {/* Possible Cause dropdown with custom */}
        <select
          name="possibleCause"
          value={CAUSE_OPTIONS.includes(form.possibleCause) ? form.possibleCause : "custom"}
          onChange={e => handleDropdownChange("possibleCause", e.target.value, setCustomCause)}
          className="input"
        >
          <option value="">Possible Cause</option>
          {CAUSE_OPTIONS.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
          <option value="custom">Other (specify below)</option>
        </select>
        {form.possibleCause && !CAUSE_OPTIONS.includes(form.possibleCause) && (
          <input
            name="customCause"
            value={customCause}
            onChange={e => handleCustomInput("possibleCause", e.target.value, setCustomCause)}
            className="input"
            placeholder="Enter custom cause"
          />
        )}
        {/* Diagnosis dropdown with custom */}
        <select
          name="diagnosis"
          value={DIAGNOSIS_OPTIONS.includes(form.diagnosis) ? form.diagnosis : "custom"}
          onChange={e => handleDropdownChange("diagnosis", e.target.value, setCustomDiagnosis)}
          className="input"
        >
          <option value="">Diagnosis</option>
          {DIAGNOSIS_OPTIONS.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
          <option value="custom">Other (specify below)</option>
        </select>
        {form.diagnosis && !DIAGNOSIS_OPTIONS.includes(form.diagnosis) && (
          <input
            name="customDiagnosis"
            value={customDiagnosis}
            onChange={e => handleCustomInput("diagnosis", e.target.value, setCustomDiagnosis)}
            className="input"
            placeholder="Enter custom diagnosis"
          />
        )}
        {/* Prescribed Days dropdown with custom */}
        <select
          name="prescribedDays"
          value={PRESCRIBED_DAYS_OPTIONS.includes(form.prescribedDays) ? form.prescribedDays : "custom"}
          onChange={e => handleDropdownChange("prescribedDays", e.target.value, setCustomPrescribed)}
          className="input"
        >
          <option value="">Prescribed Treatment Days</option>
          {PRESCRIBED_DAYS_OPTIONS.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
          <option value="custom">Other (specify below)</option>
        </select>
        {form.prescribedDays && !PRESCRIBED_DAYS_OPTIONS.includes(form.prescribedDays) && (
          <input
            name="customPrescribed"
            value={customPrescribed}
            onChange={e => handleCustomInput("prescribedDays", e.target.value, setCustomPrescribed)}
            className="input"
            placeholder="Enter custom prescribed days"
          />
        )}
        {/* Type of Treatment dropdown with custom */}
        <select
          name="type"
          value={TYPE_OPTIONS.includes(form.type) ? form.type : "custom"}
          onChange={e => handleDropdownChange("type", e.target.value, setCustomType)}
          className="input"
        >
          <option value="">Type of Treatment</option>
          {TYPE_OPTIONS.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
          <option value="custom">Other (specify below)</option>
        </select>
        {form.type && !TYPE_OPTIONS.includes(form.type) && (
          <input
            name="customType"
            value={customType}
            onChange={e => handleCustomInput("type", e.target.value, setCustomType)}
            className="input"
            placeholder="Enter custom type"
          />
        )}
        <input name="preWeight" value={form.preWeight} onChange={handleChange} className="input" placeholder="Pre-Treatment Weight" />
        {/* Medication dropdown with custom */}
        <select
          name="medication"
          value={MEDICATION_OPTIONS.includes(form.medication) ? form.medication : "custom"}
          onChange={e => handleDropdownChange("medication", e.target.value, setCustomMedication)}
          className="input"
        >
          <option value="">Treatment/Medication</option>
          {MEDICATION_OPTIONS.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
          <option value="custom">Other (specify below)</option>
        </select>
        {form.medication && !MEDICATION_OPTIONS.includes(form.medication) && (
          <input
            name="customMedication"
            value={customMedication}
            onChange={e => handleCustomInput("medication", e.target.value, setCustomMedication)}
            className="input"
            placeholder="Enter custom medication"
          />
        )}
        {/* Dosage dropdown with custom */}
        <select
          name="dosage"
          value={DOSAGE_OPTIONS.includes(form.dosage) ? form.dosage : "custom"}
          onChange={e => handleDropdownChange("dosage", e.target.value, setCustomDosage)}
          className="input"
        >
          <option value="">Dosage</option>
          {DOSAGE_OPTIONS.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
          <option value="custom">Other (specify below)</option>
        </select>
        {form.dosage && !DOSAGE_OPTIONS.includes(form.dosage) && (
          <input
            name="customDosage"
            value={customDosage}
            onChange={e => handleCustomInput("dosage", e.target.value, setCustomDosage)}
            className="input"
            placeholder="Enter custom dosage"
          />
        )}
        {/* Route dropdown with custom */}
        <select
          name="route"
          value={ROUTE_OPTIONS.includes(form.route) ? form.route : "custom"}
          onChange={e => handleDropdownChange("route", e.target.value, setCustomRoute)}
          className="input"
        >
          <option value="">Route</option>
          {ROUTE_OPTIONS.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
          <option value="custom">Other (specify below)</option>
        </select>
        {form.route && !ROUTE_OPTIONS.includes(form.route) && (
          <input
            name="customRoute"
            value={customRoute}
            onChange={e => handleCustomInput("route", e.target.value, setCustomRoute)}
            className="input"
            placeholder="Enter custom route"
          />
        )}
        <input name="diagnosis" value={form.diagnosis} onChange={handleChange} className="input" placeholder="Diagnosis" />
        <input name="prescribedDays" value={form.prescribedDays} onChange={handleChange} className="input" placeholder="Prescribed Treatment Days" />
        <input name="type" value={form.type} onChange={handleChange} className="input" placeholder="Type of Treatment" />
        <input name="preWeight" value={form.preWeight} onChange={handleChange} className="input" placeholder="Pre-Treatment Weight" />
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
