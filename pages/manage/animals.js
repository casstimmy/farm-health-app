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
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleSuccess = () => {
    setShowModal(false);
    setRefreshTrigger(prev => prev + 1);
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
        onClose={() => setShowModal(false)}
        title="Add New Animal"
        size="2xl"
      >
        <AddAnimalForm onSuccess={handleSuccess} />
      </Modal>

      {/* Controls */}
      <FilterBar
        searchPlaceholder="Search animals by name or tag..."
        searchTerm=""
        onSearchChange={() => {}}
        showAddButton={true}
        onAddClick={() => setShowModal(true)}
        isAddActive={showModal}
      />

      {/* Animals List */}
      <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">All Animals</h2>
        <AnimalsList key={refreshTrigger} />
      </div>
    </motion.div>
  );
}

ManageAnimals.layoutType = "default";
ManageAnimals.layoutProps = { title: "Animal Management" };
