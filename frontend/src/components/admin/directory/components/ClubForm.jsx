// components/admin/directory/forms/ClubForm.jsx
import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useForm, Controller } from "react-hook-form";
import { Check, AlertCircle, BookOpen, Users, Calendar, Clock, MapPin, UserPlus, X } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useCreateClubMutation, useUpdateClubMutation } from "@/features/apis/directoryApi";
import { Badge } from "@/components/ui/badge";
import { handleApiError } from "@/utils/handleApiErrors";
import { toast } from "sonner";

export default function ClubForm({ open, onOpenChange, initialData, teachers = [], students = [] }) {
  const [clubMembers, setClubMembers] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState("");
  const [selectedRole, setSelectedRole] = useState("member");
  const [createClub, { isLoading: isCreating }] = useCreateClubMutation();
  const [updateClub, { isLoading: isUpdating }] = useUpdateClubMutation();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    control,
    formState: { errors },
  } = useForm({
    defaultValues: {
      clubName: "",
      supervisor: "",
      session: "",
      description: "",
      meetingSchedule: {
        day: "",
        time: "",
        venue: ""
      },
      isActive: true
    }
  });

  // Watch form values
  const watchedClubName = watch("clubName");
  const currentYear = new Date().getFullYear();
  const sessionOptions = [
    `${currentYear - 2}-${currentYear - 1}`,
    `${currentYear - 1}-${currentYear}`,
    `${currentYear}-${currentYear + 1}`,
    `${currentYear + 1}-${currentYear + 2}`
  ];

  const dayOptions = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  const roleOptions = [
    { value: "president", label: "President" },
    { value: "vice_president", label: "Vice President" },
    { value: "member", label: "Member" }
  ];

  useEffect(() => {
    if (open) {
      if (initialData) {
        // Format data for editing
        const editData = {
          clubName: initialData.clubName || "",
          supervisor: initialData.supervisor?._id || "",
          session: initialData.session || `${currentYear}-${currentYear + 1}`,
          description: initialData.description || "",
          meetingSchedule: initialData.meetingSchedule || {
            day: "",
            time: "",
            venue: ""
          },
          isActive: initialData.isActive !== false
        };
        reset(editData);
        setClubMembers(initialData.members || []);
      } else {
        // Default values for new club
        reset({
          clubName: "",
          supervisor: "",
          session: `${currentYear}-${currentYear + 1}`,
          description: "",
          meetingSchedule: {
            day: "",
            time: "",
            venue: ""
          },
          isActive: true
        });
        setClubMembers([]);
      }
      setSelectedStudent("");
      setSelectedRole("member");
    }
  }, [open, initialData, reset, currentYear]);

  const addMember = () => {
    if (!selectedStudent) {
      toast.error("Please select a student");
      return;
    }

    const student = students.find(s => s._id === selectedStudent);
    if (!student) {
      toast.error("Selected student not found");
      return;
    }

    // Check if student is already a member
    if (clubMembers.some(m => m.student._id === selectedStudent)) {
      toast.error("Student is already a member of this club");
      return;
    }

    const newMember = {
      student: {
        _id: student._id,
        name: student.name,
        rollNumber: student.rollNumber,
        class: student.class?.name
      },
      role: selectedRole,
      joinedDate: new Date().toISOString().split('T')[0]
    };

    setClubMembers([...clubMembers, newMember]);
    setSelectedStudent("");
    setSelectedRole("member");
  };

  const removeMember = (studentId) => {
    setClubMembers(clubMembers.filter(m => m.student._id !== studentId));
  };

  const onSubmit = async (data) => {
    try {
      const clubData = {
        ...data,
        members: clubMembers
      };

      console.log("Submitting club data:", clubData);

      if (initialData) {
        await updateClub({
          id: initialData._id,
          ...clubData
        }).unwrap();
        toast.success("Club updated");
      } else {
        await createClub(clubData).unwrap();
        handleApiError("Club added");
      }

      onOpenChange(false);
    } catch (err) {
      console.log("got an error on club:", err);
      handleApiError(err || "Error saving club");
    }
  };


  const isLoading = false;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            {initialData ? `Edit Club: ${initialData.clubName}` : "Create New Club"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Club Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              Club Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Club Name */}
              <div className="space-y-2">
                <Label htmlFor="clubName">
                  Club Name *
                  {watchedClubName && !errors.clubName && (
                    <span className="ml-2 text-xs text-green-600">
                      <Check className="w-3 h-3 inline" /> Valid
                    </span>
                  )}
                </Label>
                <Input
                  id="clubName"
                  {...register("clubName", {
                    required: "Club name is required",
                    minLength: { value: 3, message: "Club name is too short" }
                  })}
                  placeholder="e.g., Science Club, Debate Club"
                  className={errors.clubName ? "border-red-500" : ""}
                  disabled={isLoading}
                />
                {errors.clubName && (
                  <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.clubName.message}
                  </p>
                )}
              </div>

              {/* Supervisor */}
              <div className="space-y-2">
                <Label htmlFor="supervisor">Supervisor *</Label>
                <Controller
                  name="supervisor"
                  control={control}
                  rules={{ required: "Supervisor is required" }}
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={isLoading}
                    >
                      <SelectTrigger className={errors.supervisor ? "border-red-500" : ""}>
                        <SelectValue placeholder="Select supervisor" />
                      </SelectTrigger>
                      <SelectContent>
                        {teachers.map(teacher => (
                          <SelectItem key={teacher._id} value={teacher._id}>
                            {teacher.user?.name || teacher.name}
                            {teacher.designation && ` (${teacher.designation})`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.supervisor && (
                  <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.supervisor.message}
                  </p>
                )}
              </div>

              {/* Session */}
              <div className="space-y-2">
                <Label htmlFor="session">Session *</Label>
                <Controller
                  name="session"
                  control={control}
                  rules={{ required: "Session is required" }}
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={isLoading}
                    >
                      <SelectTrigger className={errors.session ? "border-red-500" : ""}>
                        <SelectValue placeholder="Select session" />
                      </SelectTrigger>
                      <SelectContent>
                        {sessionOptions.map((session) => (
                          <SelectItem key={session} value={session}>
                            {session}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.session && (
                  <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.session.message}
                  </p>
                )}
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                {...register("description")}
                placeholder="Describe the club's purpose, activities, and goals..."
                rows={3}
                disabled={isLoading}
              />
              <p className="text-xs text-gray-500">
                Optional description of the club (max 500 characters)
              </p>
            </div>
          </div>

          {/* Meeting Schedule */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Meeting Schedule
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Day */}
              <div className="space-y-2">
                <Label htmlFor="meetingSchedule.day">Day</Label>
                <Controller
                  name="meetingSchedule.day"
                  control={control}
                  render={({ field }) => (
                    <Select
                      value={field.value ?? "none"}
                      onValueChange={(value) => field.onChange(value == "none" ? undefined : value)}
                      disabled={isLoading}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select day" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No specific day</SelectItem>
                        {dayOptions.map(day => (
                          <SelectItem key={day} value={day}>{day}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              {/* Time */}
              <div className="space-y-2">
                <Label htmlFor="meetingSchedule.time">Time</Label>
                <Input
                  id="meetingSchedule.time"
                  {...register("meetingSchedule.time")}
                  placeholder="e.g., 3:00 PM"
                  disabled={isLoading}
                />
              </div>

              {/* Venue */}
              <div className="space-y-2">
                <Label htmlFor="meetingSchedule.venue">Venue</Label>
                <Input
                  id="meetingSchedule.venue"
                  {...register("meetingSchedule.venue")}
                  placeholder="e.g., Science Lab, Auditorium"
                  disabled={isLoading}
                />
              </div>
            </div>
          </div>

          {/* Club Members */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Users className="w-4 h-4" />
              Club Members
            </h3>

            {/* Add Member Form */}
            <div className="bg-gray-50 p-4 rounded-lg space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Select Student */}
                <div className="space-y-2">
                  <Label htmlFor="student">Select Student</Label>
                  <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose student" />
                    </SelectTrigger>
                    <SelectContent>
                      {students.map(student => (
                        <SelectItem
                          key={student?._id}
                          value={student?._id}
                          // disabled={clubMembers.some(m => m.student._id === student._id)}
                        >
                          {student.name} ({student.rollNumber})
                          {student.class?.name && ` - Class ${student.class.name}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Select Role */}
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select value={selectedRole} onValueChange={setSelectedRole}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      {roleOptions.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Add Button */}
                <div className="flex items-end">
                  <Button
                    type="button"
                    onClick={addMember}
                    disabled={!selectedStudent}
                    className="w-full"
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    Add Member
                  </Button>
                </div>
              </div>
            </div>

            {/* Members List */}
            {clubMembers.length > 0 ? (
              <div className="border rounded-lg overflow-hidden">
                <div className="bg-gray-50 px-4 py-3 border-b">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{clubMembers.length} Members</span>
                    <span className="text-sm text-gray-500">
                      {clubMembers.filter(m => m.role === 'president').length} President,
                      {clubMembers.filter(m => m.role === 'vice_president').length} Vice President
                    </span>
                  </div>
                </div>
                <div className="divide-y max-h-[200px] overflow-y-auto">
                  {clubMembers.map((member, index) => (
                    <div key={member?.student?._id} className="flex items-center justify-between p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <Users className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <div className="font-medium">{member?.student?.name}</div>
                          <div className="text-xs text-gray-500">
                            Roll: {member?.student?.rollNumber} • Joined: {member.joinedDate}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant={
                          member.role === 'president' ? 'default' :
                            member.role === 'vice_president' ? 'secondary' :
                              'outline'
                        }>
                          {roleOptions.find(r => r.value === member.role)?.label}
                        </Badge>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeMember(member.student._id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="border-2 border-dashed rounded-lg p-8 text-center">
                <Users className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500">No members added yet</p>
                <p className="text-sm text-gray-400 mt-1">Add members using the form above</p>
              </div>
            )}
          </div>

          {/* Status */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <Label htmlFor="isActive" className="text-base">Active Status</Label>
              <p className="text-sm text-gray-500">
                {watch("isActive") ? "Club is active and visible" : "Club is inactive and hidden"}
              </p>
            </div>
            <Controller
              name="isActive"
              control={control}
              render={({ field }) => (
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  disabled={isLoading}
                />
              )}
            />
          </div>

          {/* Validation Alert */}
          {(errors.clubName || errors.supervisor || errors.session) && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Please fix the errors above before submitting
              </AlertDescription>
            </Alert>
          )}

          <DialogFooter className="pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading || Object.keys(errors).length > 0}
              className="min-w-[120px]"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {initialData ? "Updating..." : "Creating..."}
                </>
              ) : initialData ? (
                "Update Club"
              ) : (
                "Create Club"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}