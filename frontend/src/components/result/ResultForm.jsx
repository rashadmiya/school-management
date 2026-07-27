import React from "react";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { resultSchema } from "@/schemas/resultSchema";
import { useCreateResultMutation, useGenerateResultSheetMutation } from "@/features/apis/resultsApi";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useGetStudentsQuery } from "@/features/apis/studentsApi";
import { useGetSubjectsQuery } from "@/features/apis/subjectsApi";
import { toast } from "react-toastify";

export default function ResultForm({ triggerLabel = "Add Result", onSaved }) {
  const { register, handleSubmit, reset } = useForm({ resolver: zodResolver(resultSchema) });
  const [createResult, { isLoading: saving }] = useCreateResultMutation();
  const [generateSheet] = useGenerateResultSheetMutation();
  const { data: students } = useGetStudentsQuery({ page:1, limit:500 });
  const { data: subjects } = useGetSubjectsQuery({ page:1, limit:200 });

  const onSubmit = async (data) => {
    try {
      await createResult(data).unwrap();
      onSaved && onSaved();
      reset();
    } catch (err) {
      toast.error(err?.data?.message || "Error saving result");
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild><Button>{triggerLabel}</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Add Result</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 mt-2">
          <div>
            <select {...register("student")} className="w-full p-2 border rounded">
              <option value="">-- Student --</option>
              {(students?.docs||[]).map(s => <option key={s._id} value={s._id}>{s.name} ({s.rollNumber})</option>)}
            </select>
          </div>
          <div>
            <select {...register("subject")} className="w-full p-2 border rounded">
              <option value="">-- Subject --</option>
              {(subjects?.docs||[]).map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <select {...register("type")} className="w-full p-2 border rounded">
              <option value="exam">Exam</option>
              <option value="assignment">Assignment</option>
            </select>
          </div>
          <div>
            <Input {...register("score", { valueAsNumber: true })} type="number" placeholder="Score" />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={saving}>Save</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
