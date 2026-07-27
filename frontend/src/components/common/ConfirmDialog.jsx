
import React from "react";

export default function ConfirmDialog({ open, title, onConfirm, onCancel }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white p-4 rounded shadow">
        <h3 className="font-semibold mb-2">{title}</h3>
        <div className="flex justify-end gap-2">
          <button className="px-3 py-1" onClick={onCancel}>Cancel</button>
          <button className="px-3 py-1 bg-red-500 text-white rounded" onClick={onConfirm}>Confirm</button>
        </div>
      </div>
    </div>
  );
}
