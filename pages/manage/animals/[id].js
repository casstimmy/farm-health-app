import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { motion } from "framer-motion";
import { FaArrowLeft, FaSpinner } from "react-icons/fa";
import PageHeader from "@/components/shared/PageHeader";
import AddAnimalForm from "@/components/animals/AddAnimalForm";

export default function AnimalDetail() {
	const router = useRouter();
	const { id } = router.query;
	const [animal, setAnimal] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");

	useEffect(() => {
		if (!id) return;
		fetchAnimal();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [id]);

	const fetchAnimal = async () => {
		try {
			setLoading(true);
			setError("");
			const token = localStorage.getItem("token");
			const res = await fetch(`/api/animals/${id}`, {
				headers: { Authorization: `Bearer ${token}` },
			});
			if (!res.ok) throw new Error("Failed to fetch animal");
			const data = await res.json();
			setAnimal(data);
		} catch (err) {
			console.error(err);
			setError("Failed to load animal details");
		} finally {
			setLoading(false);
		}
	};

	if (loading) {
		return (
			<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
				<PageHeader title="Loading..." subtitle="Fetching animal details" gradient="from-blue-600 to-blue-700" icon="🐑" />
				<div className="text-center py-16 bg-white rounded-2xl shadow-lg">
					<div className="inline-block">
						<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
						<p className="text-gray-600 mt-4">Loading animal details...</p>
					</div>
				</div>
			</motion.div>
		);
	}

	if (!animal) {
		return (
			<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
				<PageHeader title="Animal Not Found" subtitle="The animal you're looking for doesn't exist" gradient="from-red-600 to-red-700" icon="⚠️" />
				<div className="text-center">
					<button onClick={() => router.push("/manage/animals")} className="btn-primary-lg">← Back to Animals</button>
				</div>
			</motion.div>
		);
	}

	return (
		<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
			<PageHeader title={`Edit ${animal.name || animal.tagId}`} subtitle="Advanced animal record details" gradient="from-blue-600 to-blue-700" icon="🐑" />

			<button onClick={() => router.push("/manage/animals")} className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold mb-4">
				<FaArrowLeft size={16} /> Back to Animals
			</button>

			<div className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 p-8">
				{error && <div className="mb-6 bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-lg">⚠️ {error}</div>}
				<AddAnimalForm animal={animal} onSuccess={() => router.push("/manage/animals")} />
			</div>
		</motion.div>
	);
}

AnimalDetail.layoutType = "default";
AnimalDetail.layoutProps = { title: "Edit Animal" };


