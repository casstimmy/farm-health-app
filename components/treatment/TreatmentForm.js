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
  const [form, setForm] = useState(() => {
    if (initialData) {
      return {
        ...initialForm,
        ...initialData,
        animalId: initialData.animal?._id || initialData.animalId || "",
        date: initialData.date ? initialData.date.split('T')[0] : "",
      };
    }
    return initialForm;
  });
  const [animals, setAnimals] = useState([]);
  const [showCustomSymptom, setShowCustomSymptom] = useState(form.symptoms && !SYMPTOM_OPTIONS.includes(form.symptoms));
  const [showCustomCause, setShowCustomCause] = useState(form.possibleCause && !CAUSE_OPTIONS.includes(form.possibleCause));
  const [showCustomDiagnosis, setShowCustomDiagnosis] = useState(form.diagnosis && !DIAGNOSIS_OPTIONS.includes(form.diagnosis));
  const [showCustomPrescribed, setShowCustomPrescribed] = useState(form.prescribedDays && !PRESCRIBED_DAYS_OPTIONS.includes(form.prescribedDays));
  const [showCustomType, setShowCustomType] = useState(form.type && !TYPE_OPTIONS.includes(form.type));
  const [showCustomMedication, setShowCustomMedication] = useState(form.medication && !MEDICATION_OPTIONS.includes(form.medication));
  const [showCustomDosage, setShowCustomDosage] = useState(form.dosage && !DOSAGE_OPTIONS.includes(form.dosage));
  const [showCustomRoute, setShowCustomRoute] = useState(form.route && !ROUTE_OPTIONS.includes(form.route));

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
  const handleDropdownChange = (field, value, setShowCustom) => {
    if (value === "custom") {
      setShowCustom(true);
      setForm({ ...form, [field]: "" });
    } else {
      setShowCustom(false);
      setForm({ ...form, [field]: value });
    }
  };

  const handleCustomInput = (field, value) => {
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
          <select name="symptoms" value={showCustomSymptom ? "custom" : form.symptoms} onChange={e => handleDropdownChange("symptoms", e.target.value, setShowCustomSymptom)} className="input w-full">
            <option value="">Select</option>
            {SYMPTOM_OPTIONS.map((s) => (<option key={s} value={s}>{s}</option>))}
            <option value="custom">Other (specify below)</option>
          </select>
          {showCustomSymptom && (
            <input name="customSymptom" value={form.symptoms} onChange={e => handleCustomInput("symptoms", e.target.value)} className="input w-full mt-2" placeholder="Enter custom symptom" autoFocus />
          )}
        </div>
        <div>
          <label className="font-semibold text-gray-700 mb-1 block">Possible Cause</label>
          <select name="possibleCause" value={showCustomCause ? "custom" : form.possibleCause} onChange={e => handleDropdownChange("possibleCause", e.target.value, setShowCustomCause)} className="input w-full">
            <option value="">Select</option>
            {CAUSE_OPTIONS.map((s) => (<option key={s} value={s}>{s}</option>))}
            <option value="custom">Other (specify below)</option>
          </select>
          {showCustomCause && (
            <input name="customCause" value={form.possibleCause} onChange={e => handleCustomInput("possibleCause", e.target.value)} className="input w-full mt-2" placeholder="Enter custom cause" autoFocus />
          )}
        </div>
        <div>
          <label className="font-semibold text-gray-700 mb-1 block">Diagnosis</label>
          <select name="diagnosis" value={showCustomDiagnosis ? "custom" : form.diagnosis} onChange={e => handleDropdownChange("diagnosis", e.target.value, setShowCustomDiagnosis)} className="input w-full">
            <option value="">Select</option>
            {DIAGNOSIS_OPTIONS.map((s) => (<option key={s} value={s}>{s}</option>))}
            <option value="custom">Other (specify below)</option>
          </select>
          {showCustomDiagnosis && (
            <input name="customDiagnosis" value={form.diagnosis} onChange={e => handleCustomInput("diagnosis", e.target.value)} className="input w-full mt-2" placeholder="Enter custom diagnosis" autoFocus />
          )}
        </div>
        <div>
          <label className="font-semibold text-gray-700 mb-1 block">Prescribed Treatment Days</label>
          <select name="prescribedDays" value={showCustomPrescribed ? "custom" : form.prescribedDays} onChange={e => handleDropdownChange("prescribedDays", e.target.value, setShowCustomPrescribed)} className="input w-full">
            <option value="">Select</option>
            {PRESCRIBED_DAYS_OPTIONS.map((s) => (<option key={s} value={s}>{s}</option>))}
            <option value="custom">Other (specify below)</option>
          </select>
          {showCustomPrescribed && (
            <input name="customPrescribed" value={form.prescribedDays} onChange={e => handleCustomInput("prescribedDays", e.target.value)} className="input w-full mt-2" placeholder="Enter custom prescribed days" autoFocus />
          )}
        </div>
        <div>
          <label className="font-semibold text-gray-700 mb-1 block">Type of Treatment</label>
          <select name="type" value={showCustomType ? "custom" : form.type} onChange={e => handleDropdownChange("type", e.target.value, setShowCustomType)} className="input w-full">
            <option value="">Select</option>
            {TYPE_OPTIONS.map((s) => (<option key={s} value={s}>{s}</option>))}
            <option value="custom">Other (specify below)</option>
          </select>
          {showCustomType && (
            <input name="customType" value={form.type} onChange={e => handleCustomInput("type", e.target.value)} className="input w-full mt-2" placeholder="Enter custom type" autoFocus />
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
          <select name="medication" value={showCustomMedication ? "custom" : form.medication} onChange={e => handleDropdownChange("medication", e.target.value, setShowCustomMedication)} className="input w-full">
            <option value="">Select</option>
            {MEDICATION_OPTIONS.map((s) => (<option key={s} value={s}>{s}</option>))}
            <option value="custom">Other (specify below)</option>
          </select>
          {showCustomMedication && (
            <input name="customMedication" value={form.medication} onChange={e => handleCustomInput("medication", e.target.value)} className="input w-full mt-2" placeholder="Enter custom medication" autoFocus />
          )}
        </div>
        <div>
          <label className="font-semibold text-gray-700 mb-1 block">Dosage</label>
          <select name="dosage" value={showCustomDosage ? "custom" : form.dosage} onChange={e => handleDropdownChange("dosage", e.target.value, setShowCustomDosage)} className="input w-full">
            <option value="">Select</option>
            {DOSAGE_OPTIONS.map((s) => (<option key={s} value={s}>{s}</option>))}
            <option value="custom">Other (specify below)</option>
          </select>
          {showCustomDosage && (
            <input name="customDosage" value={form.dosage} onChange={e => handleCustomInput("dosage", e.target.value)} className="input w-full mt-2" placeholder="Enter custom dosage" autoFocus />
          )}
        </div>
        <div>
          <label className="font-semibold text-gray-700 mb-1 block">Route</label>
          <select name="route" value={showCustomRoute ? "custom" : form.route} onChange={e => handleDropdownChange("route", e.target.value, setShowCustomRoute)} className="input w-full">
            <option value="">Select</option>
            {ROUTE_OPTIONS.map((s) => (<option key={s} value={s}>{s}</option>))}
            <option value="custom">Other (specify below)</option>
          </select>
          {showCustomRoute && (
            <input name="customRoute" value={form.route} onChange={e => handleCustomInput("route", e.target.value)} className="input w-full mt-2" placeholder="Enter custom route" autoFocus />
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
