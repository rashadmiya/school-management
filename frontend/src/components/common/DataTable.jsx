
import React from "react";

export default function DataTable({ columns, data, loading }) {
  if (loading) return <div>Loading...</div>;
  if (!data || data.length === 0) return <div className="p-4 text-gray-500">No data</div>;

  return (
    <table className="min-w-full bg-white rounded shadow overflow-hidden">
      <thead className="bg-gray-100">
        <tr>
          {columns.map((c) => <th key={c.title} className="text-left p-2">{c.title}</th>)}
        </tr>
      </thead>
      <tbody>
        {data.map((row) => (
          <tr key={row._id} className="border-t">
            {columns.map((c) => (
              <td key={c.title} className="p-2">
                {c.render ? c.render(row) : (c.key.split('.').reduce((o,k)=>o?.[k], row) ?? "")}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
