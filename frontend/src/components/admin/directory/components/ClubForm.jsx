// components/admin/directory/forms/ClubForm.jsx
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useCreateClubMutation, useUpdateClubMutation } from "@/features/apis/directoryApi";
import { useAppSelector } from "@/features/store";
import { handleApiError } from "@/utils/handleApiErrors";
import { AlertCircle, BookOpen, Calendar, Check, UserPlus, Users, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

const clubTypes = [
    { value: "cultural", label: "Cultural" },
    { value: "science", label: "Science" },
    { value: "language", label: "Language" },
    { value: "debate", label: "Debate" },
    { value: "sports", label: "Sports" },
    { value: "arts", label: "Arts" },
    { value: "technology", label: "Technology" },
    { value: "others", label: "Others" },
];
// Theme hook
const useTheme = () => {
    const isDarkMode = useAppSelector((state) => state.global.isDarkMode);
    return {
        isDarkMode,
        bg: isDarkMode ? "bg-gray-900" : "bg-white",
        text: isDarkMode ? "text-white" : "text-gray-900",
        textSecondary: isDarkMode ? "text-gray-300" : "text-gray-700",
        textMuted: isDarkMode ? "text-gray-400" : "text-gray-500",
        border: isDarkMode ? "border-gray-700" : "border-gray-200",
        bgInput: isDarkMode ? "bg-gray-800" : "bg-white",
        borderInput: isDarkMode ? "border-gray-700" : "border-gray-300",
        focusRing: "focus:ring-blue-500 focus:border-blue-500",
        bgSubtle: isDarkMode ? "bg-gray-800/50" : "bg-gray-50",
        bgHover: isDarkMode ? "hover:bg-gray-800" : "hover:bg-gray-50",
        placeholder: isDarkMode ? "placeholder:text-gray-500" : "placeholder:text-gray-400",
        dialog: isDarkMode ? "bg-gray-900 border-gray-800" : "bg-white border-gray-200",
        select: {
            trigger: isDarkMode ? "bg-gray-800 border-gray-700 text-white" : "bg-white border-gray-300 text-gray-900",
            content: isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white",
            item: isDarkMode ? "text-gray-300 hover:bg-gray-700" : "text-gray-900 hover:bg-gray-100",
        },
        button: {
            primary: isDarkMode ? "bg-blue-600 hover:bg-blue-700 text-white" : "bg-blue-600 hover:bg-blue-700 text-white",
            outline: isDarkMode ? "border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white" : "border-gray-300 text-gray-700 hover:bg-gray-50",
            ghost: isDarkMode ? "text-gray-400 hover:text-white hover:bg-gray-800" : "text-gray-500 hover:text-gray-700 hover:bg-gray-100",
            danger: isDarkMode ? "text-red-400 hover:text-red-300 hover:bg-red-500/10" : "text-red-600 hover:text-red-700 hover:bg-red-50",
        },
        switch: isDarkMode ? "data-[state=checked]:bg-blue-600 data-[state=unchecked]:bg-gray-700" : "",
        divider: isDarkMode ? "border-gray-700" : "border-gray-200",
        alert: isDarkMode ? "bg-red-900/20 border-red-800 text-red-400" : "bg-red-50 border-red-200 text-red-800",
        statusBox: isDarkMode ? "bg-gray-800/50 border-gray-700" : "bg-white border-gray-200",
        memberBox: isDarkMode ? "bg-gray-800/50" : "bg-gray-50",
        memberItem: isDarkMode ? "border-gray-700" : "border-gray-200",
        memberAvatar: isDarkMode ? "bg-blue-500/20" : "bg-blue-100",
        memberIcon: isDarkMode ? "text-blue-400" : "text-blue-600",
        emptyState: isDarkMode ? "border-gray-700" : "border-gray-200",
        emptyIcon: isDarkMode ? "text-gray-600" : "text-gray-300",
        emptyText: isDarkMode ? "text-gray-400" : "text-gray-500",
        emptySubtext: isDarkMode ? "text-gray-500" : "text-gray-400",
        sectionIcon: isDarkMode ? "text-gray-400" : "text-gray-500",
    };
};

export default function ClubForm({ open, onOpenChange, initialData, teachers = [], students = [] }) {
    const theme = useTheme();
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
            type: "",
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

    // Input base class
    const inputClass = `${theme.bgInput} ${theme.borderInput} ${theme.focusRing} text-gray-900 dark:text-white ${theme.placeholder}`;

    useEffect(() => {
        if (open) {
            if (initialData) {
                const editData = {
                    clubName: initialData.clubName || "",
                    type: initialData.type || "",
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
                reset({
                    clubName: "",
                    type:"",
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

            if (initialData) {
                await updateClub({
                    id: initialData._id,
                    ...clubData
                }).unwrap();
                toast.success("Club updated");
            } else {
                await createClub(clubData).unwrap();
                toast.success("Club added");
            }
            onOpenChange(false);
        } catch (err) {
            console.log("got an error on club:", err);
            handleApiError(err || "Error saving club");
        }
    };

    const isLoading = isCreating || isUpdating;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className={`sm:max-w-[700px] max-h-[90vh] overflow-y-auto ${theme.dialog}`}>
                <DialogHeader>
                    <DialogTitle className={`flex items-center gap-2 ${theme.text}`}>
                        <BookOpen className="w-5 h-5" />
                        {initialData ? `Edit Club: ${initialData.clubName}` : "Create New Club"}
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    {/* Club Information */}
                    <div className="space-y-4">
                        <h3 className={`text-lg font-semibold flex items-center gap-2 ${theme.text}`}>
                            <BookOpen className="w-4 h-4" />
                            Club Information
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Club Name */}
                            <div className="space-y-2">
                                <Label className={theme.textSecondary}>
                                    Club Name *
                                    {watchedClubName && !errors.clubName && (
                                        <span className="ml-2 text-xs text-green-600 dark:text-green-400">
                                            <Check className="w-3 h-3 inline" /> Valid
                                        </span>
                                    )}
                                </Label>
                                <Input
                                    {...register("clubName", {
                                        required: "Club name is required",
                                        minLength: { value: 3, message: "Club name is too short" }
                                    })}
                                    placeholder="e.g., Science Club, Debate Club"
                                    className={`${inputClass} ${errors.clubName ? "border-red-500" : ""}`}
                                    disabled={isLoading}
                                />
                                {errors.clubName && (
                                    <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                                        <AlertCircle className="w-3 h-3" />
                                        {errors.clubName.message}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label className={theme.textSecondary}>Club Type *</Label>
                                <Controller
                                    name="type"
                                    control={control}
                                    rules={{ required: "Club type is required" }}
                                    render={({ field }) => (
                                        <Select
                                            value={field.value}
                                            onValueChange={field.onChange}
                                            disabled={isLoading}
                                        >
                                            <SelectTrigger className={`${theme.select.trigger} ${errors.type ? "border-red-500" : ""}`}>
                                                <SelectValue placeholder="Select club type" />
                                            </SelectTrigger>
                                            <SelectContent className={theme.select.content}>
                                                {clubTypes.map((type) => (
                                                    <SelectItem key={type.value} value={type.value} className={theme.select.item}>
                                                        {type.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    )}
                                />
                                {errors.type && (
                                    <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                                        <AlertCircle className="w-3 h-3" />
                                        {errors.type.message}
                                    </p>
                                )}
                            </div>

                            {/* Supervisor */}
                            <div className="space-y-2">
                                <Label className={theme.textSecondary}>Supervisor *</Label>
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
                                            <SelectTrigger className={`${theme.select.trigger} ${errors.supervisor ? "border-red-500" : ""}`}>
                                                <SelectValue placeholder="Select supervisor" />
                                            </SelectTrigger>
                                            <SelectContent className={theme.select.content}>
                                                {teachers.map(teacher => (
                                                    <SelectItem key={teacher._id} value={teacher._id} className={theme.select.item}>
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
                                <Label className={theme.textSecondary}>Session *</Label>
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
                                            <SelectTrigger className={`${theme.select.trigger} ${errors.session ? "border-red-500" : ""}`}>
                                                <SelectValue placeholder="Select session" />
                                            </SelectTrigger>
                                            <SelectContent className={theme.select.content}>
                                                {sessionOptions.map((session) => (
                                                    <SelectItem key={session} value={session} className={theme.select.item}>
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
                            <Label className={theme.textSecondary}>Description</Label>
                            <Textarea
                                {...register("description")}
                                placeholder="Describe the club's purpose, activities, and goals..."
                                rows={3}
                                className={`${inputClass} resize-none`}
                                disabled={isLoading}
                            />
                            <p className={`text-xs ${theme.textMuted}`}>
                                Optional description of the club (max 500 characters)
                            </p>
                        </div>
                    </div>

                    {/* Meeting Schedule */}
                    <div className="space-y-4">
                        <h3 className={`text-lg font-semibold flex items-center gap-2 ${theme.text}`}>
                            <Calendar className="w-4 h-4" />
                            Meeting Schedule
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Day */}
                            <div className="space-y-2">
                                <Label className={theme.textSecondary}>Day</Label>
                                <Controller
                                    name="meetingSchedule.day"
                                    control={control}
                                    render={({ field }) => (
                                        <Select
                                            value={field.value ?? "none"}
                                            onValueChange={(value) => field.onChange(value == "none" ? undefined : value)}
                                            disabled={isLoading}
                                        >
                                            <SelectTrigger className={theme.select.trigger}>
                                                <SelectValue placeholder="Select day" />
                                            </SelectTrigger>
                                            <SelectContent className={theme.select.content}>
                                                <SelectItem value="none" className={theme.select.item}>No specific day</SelectItem>
                                                {dayOptions.map(day => (
                                                    <SelectItem key={day} value={day} className={theme.select.item}>
                                                        {day}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    )}
                                />
                            </div>

                            {/* Time */}
                            <div className="space-y-2">
                                <Label className={theme.textSecondary}>Time</Label>
                                <Input
                                    {...register("meetingSchedule.time")}
                                    placeholder="e.g., 3:00 PM"
                                    className={inputClass}
                                    disabled={isLoading}
                                />
                            </div>

                            {/* Venue */}
                            <div className="space-y-2">
                                <Label className={theme.textSecondary}>Venue</Label>
                                <Input
                                    {...register("meetingSchedule.venue")}
                                    placeholder="e.g., Science Lab, Auditorium"
                                    className={inputClass}
                                    disabled={isLoading}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Club Members */}
                    <div className="space-y-4">
                        <h3 className={`text-lg font-semibold flex items-center gap-2 ${theme.text}`}>
                            <Users className="w-4 h-4" />
                            Club Members
                        </h3>

                        {/* Add Member Form */}
                        <div className={`p-4 rounded-lg ${theme.memberBox}`}>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {/* Select Student */}
                                <div className="space-y-2">
                                    <Label className={theme.textSecondary}>Select Student</Label>
                                    <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                                        <SelectTrigger className={theme.select.trigger}>
                                            <SelectValue placeholder="Choose student" />
                                        </SelectTrigger>
                                        <SelectContent className={theme.select.content}>
                                            {students.map(student => (
                                                <SelectItem
                                                    key={student?._id}
                                                    value={student?._id}
                                                    className={theme.select.item}
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
                                    <Label className={theme.textSecondary}>Role</Label>
                                    <Select value={selectedRole} onValueChange={setSelectedRole}>
                                        <SelectTrigger className={theme.select.trigger}>
                                            <SelectValue placeholder="Select role" />
                                        </SelectTrigger>
                                        <SelectContent className={theme.select.content}>
                                            {roleOptions.map(option => (
                                                <SelectItem key={option.value} value={option.value} className={theme.select.item}>
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
                                        disabled={!selectedStudent || isLoading}
                                        className={`w-full ${theme.button.primary}`}
                                    >
                                        <UserPlus className="w-4 h-4 mr-2" />
                                        Add Member
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* Members List */}
                        {clubMembers.length > 0 ? (
                            <div className={`border rounded-lg overflow-hidden ${theme.border}`}>
                                <div className={`px-4 py-3 border-b ${theme.memberBox}`}>
                                    <div className="flex justify-between items-center">
                                        <span className={`font-medium ${theme.text}`}>{clubMembers.length} Members</span>
                                        <span className={`text-sm ${theme.textMuted}`}>
                                            {clubMembers.filter(m => m.role === 'president').length} President,
                                            {clubMembers.filter(m => m.role === 'vice_president').length} Vice President
                                        </span>
                                    </div>
                                </div>
                                <div className={`divide-y ${theme.border} max-h-[200px] overflow-y-auto`}>
                                    {clubMembers.map((member, index) => (
                                        <div key={member?.student?._id} className={`flex items-center justify-between p-4 ${theme.border}`}>
                                            <div className="flex items-center gap-3">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${theme.memberAvatar}`}>
                                                    <Users className={`w-4 h-4 ${theme.memberIcon}`} />
                                                </div>
                                                <div>
                                                    <div className={`font-medium ${theme.text}`}>{member?.student?.name}</div>
                                                    <div className={`text-xs ${theme.textMuted}`}>
                                                        Roll: {member?.student?.rollNumber} • Joined: {member.joinedDate}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <Badge
                                                    variant={
                                                        member.role === 'president' ? 'default' :
                                                            member.role === 'vice_president' ? 'secondary' :
                                                                'outline'
                                                    }
                                                    className={
                                                        member.role === 'president' ? "bg-blue-600 text-white" :
                                                            member.role === 'vice_president' ? "bg-gray-500 text-white" :
                                                                theme.border
                                                    }
                                                >
                                                    {roleOptions.find(r => r.value === member.role)?.label}
                                                </Badge>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => removeMember(member.student._id)}
                                                    className={theme.button.danger}
                                                >
                                                    <X className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className={`border-2 border-dashed rounded-lg p-8 text-center ${theme.emptyState}`}>
                                <Users className={`w-12 h-12 mx-auto mb-4 ${theme.emptyIcon}`} />
                                <p className={theme.emptyText}>No members added yet</p>
                                <p className={`text-sm mt-1 ${theme.emptySubtext}`}>Add members using the form above</p>
                            </div>
                        )}
                    </div>

                    {/* Status */}
                    <div className={`flex items-center justify-between p-4 border rounded-lg ${theme.statusBox}`}>
                        <div>
                            <Label className={`text-base ${theme.text}`}>Active Status</Label>
                            <p className={`text-sm ${theme.textMuted}`}>
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
                                    className={theme.switch}
                                />
                            )}
                        />
                    </div>

                    {/* Validation Alert */}
                    {(errors.clubName || errors.supervisor || errors.session) && (
                        <Alert variant="destructive" className={theme.alert}>
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>
                                Please fix the errors above before submitting
                            </AlertDescription>
                        </Alert>
                    )}

                    <DialogFooter className={`pt-4 border-t ${theme.divider}`}>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={isLoading}
                            className={theme.button.outline}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={isLoading || Object.keys(errors).length > 0}
                            className={`min-w-[120px] ${theme.button.primary}`}
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