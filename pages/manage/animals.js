import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { motion } from "framer-motion";
import AddAnimalForm from "@/components/animals/AddAnimalForm";
import AnimalsList from "@/components/animals/AnimalsList";
import PageHeader from "@/components/shared/PageHeader";
import FilterBar from "@/components/shared/FilterBar";
import Modal from "@/components/shared/Modal";

export default function ManageAnimals() {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [refreshKey, setRefreshKey] = useState(0);
  const [initialAnimalData, setInitialAnimalData] = useState(null);
  const [breedingRecordId, setBreedingRecordId] = useState(null);

  // Auto-open Add Animal form when redirected from Breeding Register Kid
  useEffect(() => {
    if (router.query.registerKid === "true") {
      const { breedingRecordId: brId, species, breed, sire, dam, origin, acquisitionType, location } = router.query;
      setBreedingRecordId(brId || null);
      setInitialAnimalData({
        species: species || "Goat",
        breed: breed || "",
        sire: sire || "",
        dam: dam || "",
        origin: origin || "Born on Farm",
        acquisitionType: acquisitionType === "Born" ? "Bred on farm" : (acquisitionType || "Bred on farm"),
        location: location || "",
        dob: new Date().toISOString().split("T")[0],
        acquisitionDate: new Date().toISOString().split("T")[0],
        status: "Alive",
      });
      setShowModal(true);
      // Clean the URL without reloading
      router.replace("/manage/animals", undefined, { shallow: true });
    }
  }, [router.query.registerKid]);

  const handleSuccess = async () => {
    // If this was a Register Kid flow, delete the breeding record
    if (breedingRecordId) {
      try {
        const token = localStorage.getItem("token");
        await fetch(`/api/breeding/${breedingRecordId}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch (err) {
        console.warn("Kid registered but failed to remove breeding record:", err);
      }
      setBreedingRecordId(null);
    }
    setInitialAnimalData(null);
    setShowModal(false);
    setRefreshKey((k) => k + 1);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8"
    >
      {/* Page Header */}
      <PageHeader
        title="Animal Management"
        subtitle="Manage your livestock records and health information"
        gradient="from-blue-600 to-blue-700"
        icon="🐑"
      />

      {/* Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => { setShowModal(false); setInitialAnimalData(null); setBreedingRecordId(null); }}
        title={initialAnimalData ? "Register Kid / Add New Animal" : "Add New Animal"}
        size="2xl"
      >
        <AddAnimalForm onSuccess={handleSuccess} animal={initialAnimalData} />
      </Modal>

      {/* Controls */}
      <FilterBar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        placeholder="Search animals by name or tag..."
        filters={[
          { value: filterStatus, onChange: setFilterStatus, options: [
            { value: "all", label: "All Status" },
            { value: "Alive", label: "Alive" },
            { value: "Dead", label: "Dead" },
            { value: "Sold", label: "Sold" },
            { value: "Archived", label: "Archived" },
          ]}
        ]}
        showAddButton={true}
        onAddClick={() => setShowModal(true)}
        isAddActive={showModal}
      />

      {/* Animals List */}
      <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">All Animals</h2>
        <AnimalsList
          searchTerm={searchTerm}
          filterStatus={filterStatus}
          refreshKey={refreshKey}
        />
      </div>
    </motion.div>
  );
}

ManageAnimals.layoutType = "default";
ManageAnimals.layoutProps = { title: "Animal Management" };
