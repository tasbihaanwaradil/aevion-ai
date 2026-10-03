// import React, { useState } from "react";
// import { useLocation, useNavigate } from "react-router-dom";
// import { AlertTriangleIcon, SearchIcon, PlusIcon } from "lucide-react";

// const TOTAL_STEPS = 3;
// const CURRENT_STEP = 2;

// const ORGANIZATION_TYPES = [
//   "Primary/Secondary School",
//   "University",
//   "Corporate",
//   "Other",
// ];

// const COUNTRIES = [
//   "Pakistan",
//   "United States",
//   "United Kingdom",
//   "Canada",
//   "Australia",
//   "India",
//   "Other",
// ];

// // Placeholder data — wire this up to a real school-search endpoint
// // once it exists. Filtering happens client-side against this list.
// const SAMPLE_SCHOOLS = [
//   "S.M. Public Academy",
//   "Greenwood International School",
//   "Riverside High School",
//   "Lincoln Elementary School",
// ];

// type ProfileState = {
//   name?: string;
//   email?: string;
//   password?: string;
// };

// type NewSchoolForm = {
//   country: string;
//   city: string;
//   stateProvince: string;
//   postalCode: string;
//   schoolName: string;
// };

// type NewSchoolErrors = Partial<Record<keyof NewSchoolForm, string>>;

// const Demographics = () => {
//   const navigate = useNavigate();
//   const location = useLocation();
//   const profile = (location.state as ProfileState | null) ?? {};

//   const [organizationType, setOrganizationType] = useState("");
//   const [error, setError] = useState("");

//   const [schoolQuery, setSchoolQuery] = useState("");
//   const [showResults, setShowResults] = useState(false);
//   const [selectedSchool, setSelectedSchool] = useState("");

//   const [addingSchool, setAddingSchool] = useState(false);
//   const [newSchool, setNewSchool] = useState<NewSchoolForm>({
//     country: "",
//     city: "",
//     stateProvince: "",
//     postalCode: "",
//     schoolName: "",
//   });
//   const [newSchoolErrors, setNewSchoolErrors] = useState<NewSchoolErrors>({});
//   const [customSchools, setCustomSchools] = useState<string[]>([]);

//   const allSchools = [...SAMPLE_SCHOOLS, ...customSchools];
//   const matches = schoolQuery.trim()
//     ? allSchools.filter((s) =>
//         s.toLowerCase().includes(schoolQuery.trim().toLowerCase())
//       )
//     : [];

//   const handleSchoolQueryChange = (value: string) => {
//     setSchoolQuery(value);
//     setSelectedSchool("");
//     setShowResults(true);
//   };

//   const handleSelectSchool = (name: string) => {
//     setSelectedSchool(name);
//     setSchoolQuery(name);
//     setShowResults(false);
//   };

//   const openAddSchool = () => {
//     setNewSchool((prev) => ({ ...prev, schoolName: schoolQuery }));
//     setNewSchoolErrors({});
//     setAddingSchool(true);
//     setShowResults(false);
//   };

//   const handleNewSchoolChange = (
//     field: keyof NewSchoolForm,
//     value: string
//   ) => {
//     setNewSchool((prev) => ({ ...prev, [field]: value }));
//   };

//   const handleCreateSchool = () => {
//     const errors: NewSchoolErrors = {};
//     if (!newSchool.country) errors.country = "Please select a country.";
//     if (!newSchool.city.trim()) errors.city = "Please enter a city.";
//     if (!newSchool.stateProvince.trim())
//       errors.stateProvince = "Please enter a state or province.";
//     if (!newSchool.schoolName.trim())
//       errors.schoolName = "Please enter a school name.";

//     if (Object.keys(errors).length > 0) {
//       setNewSchoolErrors(errors);
//       return;
//     }

//     // Wire this up to your create-school endpoint once it exists.
//     // For now the new school is just added to the local, in-session list.
//     setCustomSchools((prev) => [...prev, newSchool.schoolName.trim()]);
//     setSelectedSchool(newSchool.schoolName.trim());
//     setSchoolQuery(newSchool.schoolName.trim());
//     setAddingSchool(false);
//   };

//   const handleCancelAddSchool = () => {
//     setAddingSchool(false);
//     setShowResults(true);
//   };

//   const handleJoin = (e: React.FormEvent<HTMLFormElement>) => {
//     e.preventDefault();
//     setError("");

//     if (!organizationType) {
//       setError("Please select your organization type.");
//       return;
//     }

//     if (!selectedSchool) {
//       setError("Please choose your school, or add it if it isn't listed.");
//       return;
//     }

//     navigate("/AboutYou", {
//       state: {
//         ...profile,
//         organizationType,
//         schoolName: selectedSchool,
//       },
//     });
//   };

//   return (
//     <div className="min-h-screen flex flex-col items-center bg-[#0A1238] px-4 pt-16 pb-12">
//       {/* Eyebrow */}
//       <p className="text-gray-300 text-xs font-bold tracking-widest uppercase mb-4">
//         New Teacher Account
//       </p>

//       {/* Step indicator */}
//       <div className="flex items-center justify-center mb-8 w-full max-w-md">
//         {Array.from({ length: TOTAL_STEPS }, (_, i) => i + 1).map(
//           (num, idx) => (
//             <React.Fragment key={num}>
//               <div
//                 className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-colors ${
//                   num === CURRENT_STEP
//                     ? "bg-[#2d5f6e] border-[#2d5f6e] text-white"
//                     : num < CURRENT_STEP
//                     ? "bg-[#2d5f6e]/20 border-[#2d5f6e] text-[#2d5f6e]"
//                     : "bg-transparent border-gray-400 text-gray-400"
//                 }`}
//               >
//                 {num < CURRENT_STEP ? "✓" : num}
//               </div>
//               {idx < TOTAL_STEPS - 1 && (
//                 <div
//                   className={`flex-1 h-px mx-2 ${
//                     num < CURRENT_STEP ? "bg-[#2d5f6e]" : "bg-gray-500/40"
//                   }`}
//                 />
//               )}
//             </React.Fragment>
//           )
//         )}
//       </div>

//       <form
//         onSubmit={handleJoin}
//         className="w-full max-w-md bg-white rounded-2xl px-10 py-14 shadow-2xl relative z-10"
//       >
//         <h1 className="text-3xl text-[#2d5f6e] font-bold text-center mb-8">
//           Demographics
//         </h1>

//         {error && (
//           <p className="text-red-500 text-sm text-center mb-4">{error}</p>
//         )}

//         {/* Organization Type */}
//         <label
//           htmlFor="organizationType"
//           className="block text-sm font-medium text-gray-600 mb-2"
//         >
//           Organization Type
//         </label>
//         <div className="bg-gray-100 rounded-xl mb-6">
//           <select
//             id="organizationType"
//             name="organizationType"
//             value={organizationType}
//             onChange={(e) => {
//               setOrganizationType(e.target.value);
//               // Changing the org type invalidates whatever school was
//               // already picked for the previous org type.
//               setSelectedSchool("");
//               setSchoolQuery("");
//             }}
//             className="w-full h-14 px-5 bg-transparent text-gray-700 outline-none focus:ring-2 focus:ring-[#2d5f6e] rounded-xl appearance-none"
//             required
//           >
//             <option value="" disabled>
//               Select Your Organization Type
//             </option>
//             {ORGANIZATION_TYPES.map((type) => (
//               <option key={type} value={type}>
//                 {type}
//               </option>
//             ))}
//           </select>
//         </div>

//         {/* School search — only shown once an organization type is picked */}
//         {organizationType && !addingSchool && (
//           <div className="relative mb-2">
//             <label
//               htmlFor="schoolSearch"
//               className="block text-sm font-medium text-gray-600 mb-2"
//             >
//               School
//             </label>
//             <div className="flex items-center gap-2 bg-gray-100 rounded-xl px-4 h-14">
//               <SearchIcon className="w-4 h-4 text-gray-400 shrink-0" />
//               <input
//                 id="schoolSearch"
//                 type="text"
//                 value={schoolQuery}
//                 onChange={(e) => handleSchoolQueryChange(e.target.value)}
//                 onFocus={() => setShowResults(true)}
//                 placeholder="Search for your school"
//                 className="flex-1 bg-transparent outline-none text-gray-700 placeholder-gray-400 min-w-0"
//                 autoComplete="off"
//               />
//             </div>

//             {showResults && schoolQuery.trim() && (
//               <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
//                 {matches.length > 0 ? (
//                   matches.map((school) => (
//                     <button
//                       key={school}
//                       type="button"
//                       onClick={() => handleSelectSchool(school)}
//                       className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-sky-50 transition"
//                     >
//                       {school}
//                     </button>
//                   ))
//                 ) : (
//                   <div className="px-4 py-4 text-center">
//                     <p className="text-sm text-gray-500 mb-3">
//                       No results found for "{schoolQuery}".
//                     </p>
//                     <button
//                       type="button"
//                       onClick={openAddSchool}
//                       className="inline-flex items-center gap-2 text-sm font-semibold text-[#2d5f6e] hover:underline"
//                     >
//                       <PlusIcon className="w-4 h-4" />
//                       Add school here
//                     </button>
//                   </div>
//                 )}
//               </div>
//             )}

//             {selectedSchool && !showResults && (
//               <p className="text-sm text-green-600 mt-2">
//                 Selected: {selectedSchool}
//               </p>
//             )}
//           </div>
//         )}

//         {/* Add-school form */}
//         {addingSchool && (
//           <div className="mb-2">
//             <h2 className="text-lg font-semibold text-gray-800 mb-4">
//               Add Your School
//             </h2>

//             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
//               <div>
//                 <label className="block text-sm font-medium text-gray-600 mb-1">
//                   Country
//                 </label>
//                 <div className="relative">
//                   <select
//                     value={newSchool.country}
//                     onChange={(e) =>
//                       handleNewSchoolChange("country", e.target.value)
//                     }
//                     className={`w-full h-12 px-3 bg-white border rounded-lg outline-none appearance-none text-gray-700 ${
//                       newSchoolErrors.country
//                         ? "border-red-500"
//                         : "border-gray-300 focus:ring-2 focus:ring-[#2d5f6e]"
//                     }`}
//                   >
//                     <option value="" disabled>
//                       Select Your Country
//                     </option>
//                     {COUNTRIES.map((c) => (
//                       <option key={c} value={c}>
//                         {c}
//                       </option>
//                     ))}
//                   </select>
//                   {newSchoolErrors.country && (
//                     <div className="absolute z-10 top-full left-0 mt-2 w-56">
//                       <div className="bg-white border-2 border-red-500 rounded-lg shadow-lg px-3 py-2 flex items-start gap-2">
//                         <AlertTriangleIcon className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
//                         <p className="text-red-600 text-sm">
//                           {newSchoolErrors.country}
//                         </p>
//                       </div>
//                     </div>
//                   )}
//                 </div>
//               </div>

//               <div>
//                 <label className="block text-sm font-medium text-gray-600 mb-1">
//                   City
//                 </label>
//                 <div className="relative">
//                   <input
//                     type="text"
//                     value={newSchool.city}
//                     onChange={(e) =>
//                       handleNewSchoolChange("city", e.target.value)
//                     }
//                     className={`w-full h-12 px-3 bg-white border rounded-lg outline-none text-gray-700 ${
//                       newSchoolErrors.city
//                         ? "border-red-500"
//                         : "border-gray-300 focus:ring-2 focus:ring-[#2d5f6e]"
//                     }`}
//                   />
//                   {newSchoolErrors.city && (
//                     <div className="absolute z-10 top-full left-0 mt-2 w-52">
//                       <div className="bg-white border-2 border-red-500 rounded-lg shadow-lg px-3 py-2 flex items-start gap-2">
//                         <AlertTriangleIcon className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
//                         <p className="text-red-600 text-sm">
//                           {newSchoolErrors.city}
//                         </p>
//                       </div>
//                     </div>
//                   )}
//                 </div>
//               </div>

//               <div>
//                 <label className="block text-sm font-medium text-gray-600 mb-1">
//                   State or Province
//                 </label>
//                 <div className="relative">
//                   <input
//                     type="text"
//                     value={newSchool.stateProvince}
//                     onChange={(e) =>
//                       handleNewSchoolChange("stateProvince", e.target.value)
//                     }
//                     className={`w-full h-12 px-3 bg-white border rounded-lg outline-none text-gray-700 ${
//                       newSchoolErrors.stateProvince
//                         ? "border-red-500"
//                         : "border-gray-300 focus:ring-2 focus:ring-[#2d5f6e]"
//                     }`}
//                   />
//                   {newSchoolErrors.stateProvince && (
//                     <div className="absolute z-10 top-full left-0 mt-2 w-60">
//                       <div className="bg-white border-2 border-red-500 rounded-lg shadow-lg px-3 py-2 flex items-start gap-2">
//                         <AlertTriangleIcon className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
//                         <p className="text-red-600 text-sm">
//                           {newSchoolErrors.stateProvince}
//                         </p>
//                       </div>
//                     </div>
//                   )}
//                 </div>
//               </div>

//               <div>
//                 <label className="block text-sm font-medium text-gray-600 mb-1">
//                   Postal Code
//                 </label>
//                 <input
//                   type="text"
//                   value={newSchool.postalCode}
//                   onChange={(e) =>
//                     handleNewSchoolChange("postalCode", e.target.value)
//                   }
//                   className="w-full h-12 px-3 bg-white border border-gray-300 rounded-lg outline-none text-gray-700 focus:ring-2 focus:ring-[#2d5f6e]"
//                 />
//               </div>

//               <div className="sm:col-span-2">
//                 <label className="block text-sm font-medium text-gray-600 mb-1">
//                   School Name
//                 </label>
//                 <div className="relative">
//                   <input
//                     type="text"
//                     value={newSchool.schoolName}
//                     onChange={(e) =>
//                       handleNewSchoolChange("schoolName", e.target.value)
//                     }
//                     className={`w-full h-12 px-3 bg-white border rounded-lg outline-none text-gray-700 ${
//                       newSchoolErrors.schoolName
//                         ? "border-red-500"
//                         : "border-gray-300 focus:ring-2 focus:ring-[#2d5f6e]"
//                     }`}
//                   />
//                   {newSchoolErrors.schoolName && (
//                     <div className="absolute z-10 top-full left-0 mt-2 w-60">
//                       <div className="bg-white border-2 border-red-500 rounded-lg shadow-lg px-3 py-2 flex items-start gap-2">
//                         <AlertTriangleIcon className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
//                         <p className="text-red-600 text-sm">
//                           {newSchoolErrors.schoolName}
//                         </p>
//                       </div>
//                     </div>
//                   )}
//                 </div>
//               </div>
//             </div>

//             <div className="flex gap-4 mt-8">
//               <button
//                 type="button"
//                 onClick={handleCancelAddSchool}
//                 className="flex-1 h-12 rounded-xl border border-[#2d5f6e] text-[#2d5f6e] font-bold text-sm hover:bg-orange-50 transition"
//               >
//                 PREVIOUS
//               </button>
//               <button
//                 type="button"
//                 onClick={handleCreateSchool}
//                 className="flex-1 h-12 rounded-xl bg-[#2d5f6e] text-white font-bold text-sm hover:bg-[#244d5a]  transition"
//               >
//                 CREATE
//               </button>
//             </div>
//           </div>
//         )}

//         {!addingSchool && (
//           <div className="flex gap-4 mt-12">
//             <button
//               type="button"
//               onClick={() => navigate("/Newteacheraccount", { state: profile })}
//               className="flex-1 h-14 rounded-2xl border border-[#2d5f6e] text-[#2d5f6e] font-bold hover:bg-gray-50 transition"
//             >
//               Previous
//             </button>
//             <button
//               type="submit"
//               className="flex-1 h-14 rounded-2xl bg-[#2d5f6e] text-white font-bold hover:bg-[#244d5a] transition-all shadow-[0_10px_25px_-5px_rgba(45,95,110,0.5)]"
//             >
//               Next
//             </button>
//           </div>
//         )}
//       </form>
//     </div>
//   );
// };

// export default Demographics;