import React, { useRef } from "react";

export default function ResultSheetView({ sheet }) {
  // sheet: object returned by your result-sheet generator endpoint or compiled
  const ref = useRef();

  const print = () => {
    const html = ref.current.innerHTML;
    const w = window.open("", "_blank");
    w.document.write(`<html><head><title>Result Sheet</title></head><body>${html}</body></html>`);
    w.document.close();
    w.print();
    w.close();
  };

  return (
    <div>
      <div ref={ref} className="p-6 bg-white rounded shadow">
        <h2 className="text-lg font-bold">Result Sheet — {sheet.student?.name}</h2>
        <p>Class: {sheet.class?.name} — Term: {sheet.term} — Year: {sheet.year}</p>

        <table className="w-full mt-4 border">
          <thead><tr className="bg-gray-100"><th className="p-2">Subject</th><th className="p-2">Total</th><th className="p-2">Grade</th></tr></thead>
          <tbody>
            {sheet.results.map(r => (
              <tr key={r.subject}>
                <td className="p-2">{r.subject?.name || r.subject}</td>
                <td className="p-2">{r.total}</td>
                <td className="p-2">{r.grade}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-4">
          <strong>Overall Average:</strong> {sheet.overallAverage}
        </div>
      </div>

      <button onClick={print} className="mt-3 px-3 py-2 bg-blue-600 text-white rounded">Print / Save PDF</button>
    </div>
  );
}
