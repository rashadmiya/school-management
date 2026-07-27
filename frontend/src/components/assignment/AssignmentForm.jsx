// components/assignments/AssignmentForm.jsx
import React, { useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { useCreateAssignmentMutation, useUpdateAssignmentMutation } from "@/features/apis/assignmentsApi";
import { handleApiError } from "@/utils/handleApiErrors";

export default function AssignmentForm({
  open,
  onOpenChange,
  initialData,
  classes = [],
  subjects = []
}) {
  const [createAssignment, { isLoading: creating }] = useCreateAssignmentMutation();
  const [updateAssignment, { isLoading: updating }] = useUpdateAssignmentMutation();

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm({
    defaultValues: {
      title: "",
      description: "",
      class: "",
      subject: "",
      dueDate: "",
      mark:""
    }
  });

  useEffect(() => {
    if (open) {
      if (initialData) {
        // Edit mode
        const dueDate = initialData.dueDate ? new Date(initialData.dueDate).toISOString().split('T')[0] : "";

        reset({
          title: initialData.title || "",
          description: initialData.description || "",
          class: initialData.class?._id || initialData.class || "",
          subject: initialData.subject?._id || initialData.subject || "",
          dueDate: dueDate,
          mark: initialData.mark || "",

        });
      } else {
        // Create mode
        reset({
          title: "",
          description: "",
          class: "",
          subject: "",
          dueDate: "",
          mark:"",
        });
      }
    }
  }, [open, initialData, reset]);

  const onSubmit = async (data) => {
    try {
      if (initialData) {
        await updateAssignment({ id: initialData._id, ...data }).unwrap();
      } else {
        await createAssignment(data).unwrap();
      }
      onOpenChange(false);
    } catch (err) {
      console.error("Error saving assignment:", err);
      handleApiError(err || "Error saving assignment");
    }
  };

  const isLoading = creating || updating;

  // Get subjects filtered by selected class
  const selectedClass = watch("class");
  const filteredSubjects = selectedClass
    ? subjects.filter(subject =>
      // In a real app, you might have class-subject relationships
      true // For now, show all subjects
    )
    : subjects;

  // Calculate minimum date (today)
  const today = new Date().toISOString().split('T')[0];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>
            {initialData ? "Edit Assignment" : "Create New Assignment"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Assignment Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Assignment Title *</Label>
            <Input
              id="title"
              {...register("title", {
                required: "Assignment title is required",
                minLength: {
                  value: 3,
                  message: "Title must be at least 3 characters"
                }
              })}
              placeholder="e.g., Chapter 5 Exercises, Research Paper, etc."
              className={errors.title ? "border-red-500" : ""}
            />
            {errors.title && (
              <p className="text-sm text-red-500">{errors.title.message}</p>
            )}
          </div>

          <div className="w-full flex flex-row gap-2">
            {/* Class Selection */}
            <div className="space-y-2 w-full">
              <Label htmlFor="class">Class *</Label>
              <Select onValueChange={(value) => setValue("class", value)} value={watch("class")}>
                <SelectTrigger className={errors.class ? "border-red-500" : ""}>
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((classItem) => (
                    <SelectItem key={classItem._id} value={classItem._id}>
                      {`${classItem.name} ( ${classItem.section || "" } )`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.class && (
                <p className="text-sm text-red-500">Class is required</p>
              )}
            </div>

            {/* Subject Selection */}
            <div className="space-y-2 w-full">
              <Label htmlFor="subject">Subject *</Label>
              <Select onValueChange={(value) => setValue("subject", value)} value={watch("subject")}>
                <SelectTrigger className={errors.subject ? "border-red-500" : ""}>
                  <SelectValue placeholder="Select subject" />
                </SelectTrigger>
                <SelectContent>
                  {filteredSubjects.map((subject) => (
                    <SelectItem key={subject._id} value={subject._id}>
                      {subject.name} ({subject.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.subject && (
                <p className="text-sm text-red-500">Subject is required</p>
              )}
            </div>
          </div>

          <div className="w-full flex flex-row gap-2">
            <div className="space-y-2 w-full">
              <Label htmlFor="title">Assignment Marks *</Label>
              <Input
                id="mark"
                {...register("mark", {
                  required: "Assignment mark is required",
                  minLength: {
                    value: 1,
                    message: "Mark must be at least 1 characters"
                  }
                })}
                placeholder="e.g., 10"
                className={errors.mark ? "border-red-500" : ""}
              />
              {errors.mark && (
                <p className="text-sm text-red-500">{errors.mark.message}</p>
              )}
            </div>
            {/* Due Date */}
            <div className="space-y-2 w-full">
              <Label htmlFor="dueDate">Due Date *</Label>
              <Input
                id="dueDate"
                type="date"
                min={today}
                {...register("dueDate", {
                  required: "Due date is required",
                  validate: {
                    futureDate: (value) => {
                      const selectedDate = new Date(value);
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      return selectedDate >= today || "Due date must be in the future";
                    }
                  }
                })}
                className={errors.dueDate ? "border-red-500" : ""}
              />
              {errors.dueDate && (
                <p className="text-sm text-red-500">{errors.dueDate.message}</p>
              )}
            </div>
          </div>


          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...register("description")}
              placeholder="Provide detailed instructions for the assignment..."
              rows={4}
            />
            <p className="text-xs text-gray-500">
              Optional. Include any specific requirements, guidelines, or resources.
            </p>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : initialData ? "Update Assignment" : "Create Assignment"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// import React, { useEffect } from "react";
// import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
// import { useForm } from "react-hook-form";
// import { zodResolver } from "@hookform/resolvers/zod";
// import { assignmentSchema } from "@/schemas/assignmentSchema";
// import { useCreateAssignmentMutation, useUpdateAssignmentMutation } from "@/features/apis/assignmentsApi";
// import { useGetClassesQuery } from "@/features/apis/classesApi";
// import { useGetSubjectsQuery } from "@/features/apis/subjectsApi";
// import { Input } from "@/components/ui/input";
// import { Button } from "@/components/ui/button";

// export default function AssignmentForm({ initialData=null, triggerLabel="New Assignment", onSaved }) {
//   const { register, handleSubmit, reset, formState: { errors } } = useForm({ resolver: zodResolver(assignmentSchema), defaultValues: initialData || {}});
//   const [createAssignment, { isLoading: creating }] = useCreateAssignmentMutation();
//   const [updateAssignment, { isLoading: updating }] = useUpdateAssignmentMutation();
//   const { data: classesData } = useGetClassesQuery({ page:1, limit:200 });
//   const { data: subjectsData } = useGetSubjectsQuery({ page:1, limit:200 });

//   useEffect(()=> reset(initialData || {}), [initialData, reset]);

//   const onSubmit = async (data) => {
//     try {
//       if (initialData) await updateAssignment({ id: initialData._id, ...data }).unwrap();
//       else await createAssignment(data).unwrap();
//       onSaved && onSaved();
//     } catch (err) {
//       alert(err?.data?.message || "Error saving assignment");
//     }
//   };

//   return (
//     <Dialog>
//       <DialogTrigger asChild><Button>{triggerLabel}</Button></DialogTrigger>
//       <DialogContent>
//         <DialogHeader><DialogTitle>{initialData ? "Edit Assignment" : "New Assignment"}</DialogTitle></DialogHeader>
//         <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 mt-2">
//           <Input {...register("title")} placeholder="Title" />
//           <div>
//             <select {...register("classId")} className="w-full p-2 border rounded">
//               <option value="">-- Class --</option>
//               {(classesData?.docs||[]).map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
//             </select>
//           </div>
//           <div>
//             <select {...register("subjectId")} className="w-full p-2 border rounded">
//               <option value="">-- Subject --</option>
//               {(subjectsData?.docs||[]).map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
//             </select>
//           </div>
//           <div>
//             <Input {...register("dueDate")} type="date" />
//           </div>
//           <DialogFooter>
//             <Button type="submit" disabled={creating || updating}>{initialData ? "Save" : "Create"}</Button>
//           </DialogFooter>
//         </form>
//       </DialogContent>
//     </Dialog>
//   );
// }
