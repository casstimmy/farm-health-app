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
export default function TreatmentForm({ onSubmit, loading, initialData, onClose }) {
  const [form, setForm] = useState(initialData ? { ...initialForm, ...initialData } : initialForm);
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
    // Rename animalId to animal for backend compatibility
    const submitData = { ...form };
    if (submitData.animalId) {
      submitData.animal = submitData.animalId;
      delete submitData.animalId;
    }
    onSubmit(submitData);
  };

  return (
    <form className="space-y-6 bg-white p-6 rounded-xl shadow-lg" onSubmit={handleSubmit}>
      {/* Section: Animal & Date */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
        <div>
          <label className="font-semibold text-gray-700 mb-1 block">Date</label>
          <input name="date" type="date" value={form.date} onChange={handleChange} className="input w-full" required />
        </div>
        <div>
          <label className="font-semibold text-gray-700 mb-1 block">Animal</label>
          <select name="animalId" value={form.animalId} onChange={handleChange} className="input w-full" required>
            <option value="">Select Animal</option>
            {animals.map((a) => (
              <option key={a._id} value={a._id}>{a.tagId} - {a.breed} - {a.gender}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Section: Treatment Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
        <div>
          <label className="font-semibold text-gray-700 mb-1 block">Routine</label>
          <select name="routine" value={form.routine} onChange={handleChange} className="input w-full">
            <option value="">Select</option>
            {ROUTINE_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="font-semibold text-gray-700 mb-1 block">Symptoms</label>
          <select name="symptoms" value={SYMPTOM_OPTIONS.includes(form.symptoms) ? form.symptoms : "custom"} onChange={e => handleDropdownChange("symptoms", e.target.value, setCustomSymptom)} className="input w-full">
            <option value="">Select</option>
            {SYMPTOM_OPTIONS.map((s) => (<option key={s} value={s}>{s}</option>))}
            <option value="custom">Other (specify below)</option>
          </select>
          {form.symptoms && !SYMPTOM_OPTIONS.includes(form.symptoms) && (
            <input name="customSymptom" value={customSymptom} onChange={e => handleCustomInput("symptoms", e.target.value, setCustomSymptom)} className="input w-full mt-1" placeholder="Enter custom symptom" />
          )}
        </div>
        <div>
          <label className="font-semibold text-gray-700 mb-1 block">Possible Cause</label>
          <select name="possibleCause" value={CAUSE_OPTIONS.includes(form.possibleCause) ? form.possibleCause : "custom"} onChange={e => handleDropdownChange("possibleCause", e.target.value, setCustomCause)} className="input w-full">
            <option value="">Select</option>
            {CAUSE_OPTIONS.map((s) => (<option key={s} value={s}>{s}</option>))}
            <option value="custom">Other (specify below)</option>
          </select>
          {form.possibleCause && !CAUSE_OPTIONS.includes(form.possibleCause) && (
            <input name="customCause" value={customCause} onChange={e => handleCustomInput("possibleCause", e.target.value, setCustomCause)} className="input w-full mt-1" placeholder="Enter custom cause" />
          )}
        </div>
        <div>
          <label className="font-semibold text-gray-700 mb-1 block">Diagnosis</label>
          <select name="diagnosis" value={DIAGNOSIS_OPTIONS.includes(form.diagnosis) ? form.diagnosis : "custom"} onChange={e => handleDropdownChange("diagnosis", e.target.value, setCustomDiagnosis)} className="input w-full">
            <option value="">Select</option>
            {DIAGNOSIS_OPTIONS.map((s) => (<option key={s} value={s}>{s}</option>))}
            <option value="custom">Other (specify below)</option>
          </select>
          {form.diagnosis && !DIAGNOSIS_OPTIONS.includes(form.diagnosis) && (
            <input name="customDiagnosis" value={customDiagnosis} onChange={e => handleCustomInput("diagnosis", e.target.value, setCustomDiagnosis)} className="input w-full mt-1" placeholder="Enter custom diagnosis" />
          )}
        </div>
        <div>
          <label className="font-semibold text-gray-700 mb-1 block">Prescribed Treatment Days</label>
          <select name="prescribedDays" value={PRESCRIBED_DAYS_OPTIONS.includes(form.prescribedDays) ? form.prescribedDays : "custom"} onChange={e => handleDropdownChange("prescribedDays", e.target.value, setCustomPrescribed)} className="input w-full">
            <option value="">Select</option>
            {PRESCRIBED_DAYS_OPTIONS.map((s) => (<option key={s} value={s}>{s}</option>))}
            <option value="custom">Other (specify below)</option>
          </select>
          {form.prescribedDays && !PRESCRIBED_DAYS_OPTIONS.includes(form.prescribedDays) && (
            <input name="customPrescribed" value={customPrescribed} onChange={e => handleCustomInput("prescribedDays", e.target.value, setCustomPrescribed)} className="input w-full mt-1" placeholder="Enter custom prescribed days" />
          )}
        </div>
        <div>
          <label className="font-semibold text-gray-700 mb-1 block">Type of Treatment</label>
          <select name="type" value={TYPE_OPTIONS.includes(form.type) ? form.type : "custom"} onChange={e => handleDropdownChange("type", e.target.value, setCustomType)} className="input w-full">
            <option value="">Select</option>
            {TYPE_OPTIONS.map((s) => (<option key={s} value={s}>{s}</option>))}
            <option value="custom">Other (specify below)</option>
          </select>
          {form.type && !TYPE_OPTIONS.includes(form.type) && (
            <input name="customType" value={customType} onChange={e => handleCustomInput("type", e.target.value, setCustomType)} className="input w-full mt-1" placeholder="Enter custom type" />
          )}
        </div>
      </div>

      {/* Section: Medication & Weight */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
        <div>
          <label className="font-semibold text-gray-700 mb-1 block">Pre-Treatment Weight</label>
          <input name="preWeight" value={form.preWeight} onChange={handleChange} className="input w-full" placeholder="Pre-Treatment Weight" />
        </div>
        <div>
          <label className="font-semibold text-gray-700 mb-1 block">Treatment/Medication</label>
          <select name="medication" value={MEDICATION_OPTIONS.includes(form.medication) ? form.medication : "custom"} onChange={e => handleDropdownChange("medication", e.target.value, setCustomMedication)} className="input w-full">
            <option value="">Select</option>
            {MEDICATION_OPTIONS.map((s) => (<option key={s} value={s}>{s}</option>))}
            <option value="custom">Other (specify below)</option>
          </select>
          {form.medication && !MEDICATION_OPTIONS.includes(form.medication) && (
            <input name="customMedication" value={customMedication} onChange={e => handleCustomInput("medication", e.target.value, setCustomMedication)} className="input w-full mt-1" placeholder="Enter custom medication" />
          )}
        </div>
        <div>
          <label className="font-semibold text-gray-700 mb-1 block">Dosage</label>
          <select name="dosage" value={DOSAGE_OPTIONS.includes(form.dosage) ? form.dosage : "custom"} onChange={e => handleDropdownChange("dosage", e.target.value, setCustomDosage)} className="input w-full">
            <option value="">Select</option>
            {DOSAGE_OPTIONS.map((s) => (<option key={s} value={s}>{s}</option>))}
            <option value="custom">Other (specify below)</option>
          </select>
          {form.dosage && !DOSAGE_OPTIONS.includes(form.dosage) && (
            <input name="customDosage" value={customDosage} onChange={e => handleCustomInput("dosage", e.target.value, setCustomDosage)} className="input w-full mt-1" placeholder="Enter custom dosage" />
          )}
        </div>
        <div>
          <label className="font-semibold text-gray-700 mb-1 block">Route</label>
          <select name="route" value={ROUTE_OPTIONS.includes(form.route) ? form.route : "custom"} onChange={e => handleDropdownChange("route", e.target.value, setCustomRoute)} className="input w-full">
            <option value="">Select</option>
            {ROUTE_OPTIONS.map((s) => (<option key={s} value={s}>{s}</option>))}
            <option value="custom">Other (specify below)</option>
          </select>
          {form.route && !ROUTE_OPTIONS.includes(form.route) && (
            <input name="customRoute" value={customRoute} onChange={e => handleCustomInput("route", e.target.value, setCustomRoute)} className="input w-full mt-1" placeholder="Enter custom route" />
          )}
        </div>
      </div>

      {/* Section: Staff & Observations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
        <div>
          <label className="font-semibold text-gray-700 mb-1 block">Treated By</label>
          <input name="treatedBy" value={form.treatedBy} onChange={handleChange} className="input w-full" placeholder="Treated by" />
        </div>
        <div>
          <label className="font-semibold text-gray-700 mb-1 block">Post Treatment Observation</label>
          <input name="postObservation" value={form.postObservation} onChange={handleChange} className="input w-full" placeholder="Post Treatment Observation" />
        </div>
        <div>
          <label className="font-semibold text-gray-700 mb-1 block">Observation Time</label>
          <input name="observationTime" value={form.observationTime} onChange={handleChange} className="input w-full" placeholder="Observation Time" />
        </div>
        <div>
          <label className="font-semibold text-gray-700 mb-1 block">Treatment Completion Date</label>
          <input name="completionDate" type="date" value={form.completionDate} onChange={handleChange} className="input w-full" placeholder="Treatment Completion Date" />
        </div>
        <div>
          <label className="font-semibold text-gray-700 mb-1 block">Recovery Status</label>
          <input name="recoveryStatus" value={form.recoveryStatus} onChange={handleChange} className="input w-full" placeholder="Recovery Status" />
        </div>
        <div>
          <label className="font-semibold text-gray-700 mb-1 block">Post-Treatment Weight</label>
          <input name="postWeight" value={form.postWeight} onChange={handleChange} className="input w-full" placeholder="Post-Treatment Weight" />
        </div>
      </div>

      {/* Section: Notes */}
      <div>
        <label className="font-semibold text-gray-700 mb-1 block">Notes / Treatment Plan Summary</label>
        <textarea name="notes" value={form.notes} onChange={handleChange} className="input w-full" placeholder="Notes/Treatment Plan Summary" rows={3} />
      </div>

      <div className="flex gap-3 mt-6">
        {onClose && (
          <button type="button" className="btn-secondary w-1/3" onClick={onClose}>Cancel</button>
        )}
        <button type="submit" className="btn-primary w-2/3" disabled={loading}>
          {loading ? "Saving..." : "Save Treatment"}
        </button>
      </div>
    </form>
  );
}
