import React from "react";
import { useAppSelector } from "@/features/store";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function DataTable({ 
  columns, 
  data, 
  loading, 
  pagination,
  onRowClick 
}) {
  const isDarkMode = useAppSelector((state) => state.global.isDarkMode);

  if (loading) {
    return (
      <div className={`flex justify-center py-8 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
        <div className={`animate-spin rounded-full h-8 w-8 border-b-2 ${isDarkMode ? "border-blue-400" : "border-blue-600"}`}></div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className={`p-4 text-center ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
        No data available
      </div>
    );
  }

  return (
    <div>
      <div className={`rounded-lg border overflow-hidden ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}>
        <table className={`w-full ${isDarkMode ? "bg-gray-900" : "bg-white"}`}>
          <thead className={isDarkMode ? "bg-gray-800" : "bg-gray-50"}>
            <tr>
              {columns.map((c) => (
                <th 
                  key={c.title} 
                  className={`text-left p-3 font-semibold text-sm ${
                    isDarkMode ? "text-gray-300" : "text-gray-700"
                  }`}
                  style={{ width: c.width }}
                >
                  {c.title}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, index) => (
              <tr 
                key={row._id || row.id || index} 
                className={`border-t transition-colors ${
                  isDarkMode 
                    ? "border-gray-800 hover:bg-gray-800/50" 
                    : "border-gray-100 hover:bg-gray-50"
                } ${onRowClick ? "cursor-pointer" : ""}`}
                onClick={() => onRowClick && onRowClick(row)}
              >
                {columns.map((c) => (
                  <td 
                    key={c.title} 
                    className={`p-3 text-sm ${
                      isDarkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    {c.render ? c.render(row) : (c.key.split('.').reduce((o,k)=>o?.[k], row) ?? "")}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pagination && (
        <div className="flex items-center justify-between mt-4">
          <div className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
            Showing {((pagination.currentPage - 1) * (pagination.limit || 20)) + 1} to{" "}
            {Math.min(pagination.currentPage * (pagination.limit || 20), pagination.totalItems)} of{" "}
            {pagination.totalItems} entries
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => pagination.onPageChange(pagination.currentPage - 1)}
              disabled={pagination.currentPage === 1}
              className={isDarkMode ? "border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white" : ""}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => pagination.onPageChange(pagination.currentPage + 1)}
              disabled={pagination.currentPage === pagination.totalPages}
              className={isDarkMode ? "border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white" : ""}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// import React from "react";
// import { useAppSelector } from "@/features/store";

// export default function DataTable({ columns, data, loading }) {
//   const isDarkMode = useAppSelector((state) => state.global.isDarkMode);

//   if (loading) {
//     return (
//       <div className={`flex justify-center py-8 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
//         <div className={`animate-spin rounded-full h-8 w-8 border-b-2 ${isDarkMode ? "border-blue-400" : "border-blue-600"}`}></div>
//       </div>
//     );
//   }

//   if (!data || data.length === 0) {
//     return (
//       <div className={`p-4 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
//         No data available
//       </div>
//     );
//   }

//   return (
//     <div className={`rounded-lg border overflow-hidden ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}>
//       <table className={`w-full ${isDarkMode ? "bg-gray-900" : "bg-white"}`}>
//         <thead className={isDarkMode ? "bg-gray-800" : "bg-gray-50"}>
//           <tr>
//             {columns.map((c) => (
//               <th 
//                 key={c.title} 
//                 className={`text-left p-3 font-semibold text-sm ${
//                   isDarkMode ? "text-gray-300" : "text-gray-700"
//                 }`}
//                 style={{ width: c.width }}
//               >
//                 {c.title}
//               </th>
//             ))}
//           </tr>
//         </thead>
//         <tbody>
//           {data.map((row, index) => (
//             <tr 
//               key={row._id || row.id || index} 
//               className={`border-t transition-colors ${
//                 isDarkMode 
//                   ? "border-gray-800 hover:bg-gray-800/50" 
//                   : "border-gray-100 hover:bg-gray-50"
//               }`}
//             >
//               {columns.map((c) => (
//                 <td 
//                   key={c.title} 
//                   className={`p-3 text-sm ${
//                     isDarkMode ? "text-gray-300" : "text-gray-700"
//                   }`}
//                 >
//                   {c.render ? c.render(row) : (c.key.split('.').reduce((o,k)=>o?.[k], row) ?? "")}
//                 </td>
//               ))}
//             </tr>
//           ))}
//         </tbody>
//       </table>
//     </div>
//   );
// }
