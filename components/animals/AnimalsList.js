import { useEffect, useState } from "react";
import { FaSpinner, FaCheckCircle, FaTimesCircle } from "react-icons/fa";

export default function AnimalsList() {
  const [animals, setAnimals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnimals();
  }, []);

  const fetchAnimals = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/animals", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      setAnimals(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching animals:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-16">
        <div className="text-center">
          <FaSpinner className="animate-spin text-green-600 mx-auto mb-3" size={40} />
          <p className="text-gray-600 font-medium">Loading animals...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      {animals.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
          <p className="text-4xl mb-3">🐑</p>
          <p className="text-gray-700 font-semibold text-lg">No animals found</p>
          <p className="text-gray-500 text-sm mt-2">Start by adding your first animal to the system</p>
        </div>
      ) : (
        <table className="w-full">
          <thead>
            <tr className="bg-gray-100 border-b-2 border-gray-300">
              <th className="px-6 py-4 text-left text-sm font-bold text-gray-800">Tag ID</th>
              <th className="px-6 py-4 text-left text-sm font-bold text-gray-800">Name</th>
              <th className="px-6 py-4 text-left text-sm font-bold text-gray-800">Species</th>
              <th className="px-6 py-4 text-left text-sm font-bold text-gray-800">Breed</th>
              <th className="px-6 py-4 text-left text-sm font-bold text-gray-800">Status</th>
              <th className="px-6 py-4 text-center text-sm font-bold text-gray-800">Records</th>
            </tr>
          </thead>
          <tbody>
            {animals.map((animal, index) => (
              <tr 
                key={animal._id} 
                className={`border-b transition-colors duration-200 ${
                  index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                } hover:bg-green-50 cursor-pointer`}
              >
                <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                  <span className="bg-blue-100 text-blue-800 px-4 py-2 rounded-lg font-bold text-xs">
                    {animal.tagId}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-800 font-medium">{animal.name || '-'}</td>
                <td className="px-6 py-4 text-sm">
                  <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-xs font-semibold">
                    {animal.species}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-700">{animal.breed || '-'}</td>
                <td className="px-6 py-4 text-sm">
                  <div className="flex items-center gap-2">
                    {animal.status === 'Alive' ? (
                      <>
                        <FaCheckCircle className="text-green-600" size={16} />
                        <span className="badge badge-success font-semibold">Alive</span>
                      </>
                    ) : (
                      <>
                        <FaTimesCircle className="text-red-600" size={16} />
                        <span className="badge badge-danger font-semibold">Inactive</span>
                      </>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 text-center text-sm">
                  <div className="flex items-center justify-center gap-2 flex-wrap">
                    <span className="text-xs bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full font-semibold">
                      🍽️ {animal.feedingHistory?.length || 0}
                    </span>
                    <span className="text-xs bg-red-100 text-red-800 px-3 py-1 rounded-full font-semibold">
                      💊 {animal.treatmentHistory?.length || 0}
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
