import React from "react";
import { useGetStudentMonthlyQuery } from "@/features/apis/attendanceApi";

export default function StudentMonthlyView({ studentId, year, month }) {
  const { data, isLoading } = useGetStudentMonthlyQuery({ studentId, year, month }, { skip: !studentId || !year || !month });

  if (isLoading) return <div>Loading...</div>;
  if (!data || !data.attendance) return <div>No attendance found</div>;

  return (
    <div>
      <h3>Attendance — {month}/{year}</h3>
      <ul className="space-y-2">
        {data.attendance.map(a => (
          <li key={a._id} className="flex justify-between p-2 border rounded">
            <div>{new Date(a.date).toLocaleDateString()}</div>
            <div className="capitalize">{a.status}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}
