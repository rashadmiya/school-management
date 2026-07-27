// pages/StudentExamRoutinesPage.jsx - For Students Only
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, BookOpen, Users, MapPin, Filter, Download } from "lucide-react";
import { useGetStudentExamsQuery } from "@/features/apis/examRoutineApi";
import { toast } from "react-toastify";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PDFDownloadLink } from "@react-pdf/renderer";
import ExamRoutinePDF from "@/components/PDFExporters/ExamRoutinePDF";

export default function StudentExamRoutinesPage() {
    const [filter, setFilter] = useState("upcoming");
    const [selectedExamType, setSelectedExamType] = useState("all");
    const [currentAcademicYear, setCurrentAcademicYear] = useState("");
    
    const { data, isLoading, refetch } = useGetStudentExamsQuery();
    const exams = data?.examRoutines || [];

    useEffect(() => {
        // Set current academic year
        const currentYear = new Date().getFullYear();
        setCurrentAcademicYear(`${currentYear}-${currentYear + 1}`);
    }, []);

    const filterExams = () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let filtered = exams;

        // Filter by time
        if (filter === "upcoming") {
            filtered = filtered.filter(exam => new Date(exam.examDate) >= today);
        } else if (filter === "past") {
            filtered = filtered.filter(exam => new Date(exam.examDate) < today);
        }

        // Filter by exam type
        if (selectedExamType !== "all") {
            filtered = filtered.filter(exam => exam.examType === selectedExamType);
        }

        // Sort by date
        filtered.sort((a, b) => new Date(a.examDate) - new Date(b.examDate));

        return filtered;
    };

    const filteredExams = filterExams();

    const getExamTypeColor = (type) => {
        const colors = {
            midterm: "bg-blue-100 text-blue-800",
            final: "bg-red-100 text-red-800",
            term: "bg-green-100 text-green-800",
            weekly: "bg-yellow-100 text-yellow-800",
            monthly: "bg-purple-100 text-purple-800",
            others: "bg-gray-100 text-gray-800"
        };
        return colors[type] || "bg-gray-100 text-gray-800";
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const getExamTypes = () => {
        const types = new Set(exams.map(exam => exam.examType));
        return Array.from(types);
    };

    if (isLoading) {
        return (
            <Card>
                <CardContent className="p-6">
                    <div className="text-center">Loading exam schedule...</div>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="container space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold">My Exam Schedule</h1>
                    <p className="text-gray-600 mt-2">
                        View your examination timetable and details
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    <Select value={filter} onValueChange={setFilter}>
                        <SelectTrigger className="w-32">
                            <SelectValue placeholder="Filter" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Exams</SelectItem>
                            <SelectItem value="upcoming">Upcoming</SelectItem>
                            <SelectItem value="past">Past Exams</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select value={selectedExamType} onValueChange={setSelectedExamType}>
                        <SelectTrigger className="w-40">
                            <SelectValue placeholder="Exam Type" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Types</SelectItem>
                            {getExamTypes().map(type => (
                                <SelectItem key={type} value={type}>
                                    {type.charAt(0).toUpperCase() + type.slice(1)}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    {filteredExams.length > 0 && (
                        <PDFDownloadLink
                            document={<ExamRoutinePDF exams={filteredExams} studentView={true} />}
                            fileName={`exam-schedule-${currentAcademicYear}.pdf`}
                        >
                            {({ loading }) => (
                                <Button variant="outline" disabled={loading} className="flex items-center gap-2">
                                    <Download className="w-4 h-4" />
                                    {loading ? "Generating..." : "Download PDF"}
                                </Button>
                            )}
                        </PDFDownloadLink>
                    )}
                </div>
            </div>

            <Card>
                <CardContent className="p-6">
                    {filteredExams.length === 0 ? (
                        <div className="text-center py-8">
                            <div className="text-gray-400 mb-4">
                                <Calendar className="w-16 h-16 mx-auto" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-600 mb-2">
                                No exams found
                            </h3>
                            <p className="text-gray-500">
                                {filter === "upcoming" 
                                    ? "You have no upcoming exams scheduled."
                                    : "No exams match your current filters."}
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="text-sm text-gray-600 mb-4">
                                Showing {filteredExams.length} exam{filteredExams.length !== 1 ? 's' : ''} 
                                {selectedExamType !== "all" && ` for ${selectedExamType} exams`}
                                {filter !== "all" && ` (${filter})`}
                            </div>

                            {filteredExams.map((exam) => (
                                <div key={exam._id} className="border rounded-lg p-6 hover:shadow-md transition-shadow">
                                    <div className="flex flex-col lg:flex-row justify-between gap-4">
                                        <div className="space-y-4 flex-1">
                                            <div className="flex items-start justify-between">
                                                <div className="space-y-2">
                                                    <div className="flex items-center gap-3">
                                                        <Badge variant="outline" className={getExamTypeColor(exam.examType)}>
                                                            {exam.examType.toUpperCase()}
                                                        </Badge>
                                                        <h3 className="text-xl font-bold">{exam.title}</h3>
                                                    </div>
                                                    <p className="text-gray-600">{exam.subject?.name} • {exam.class?.name} Class</p>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-blue-50 rounded-lg">
                                                        <Calendar className="w-5 h-5 text-blue-600" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm text-gray-500">Date</p>
                                                        <p className="font-medium">{formatDate(exam.examDate)}</p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-green-50 rounded-lg">
                                                        <Clock className="w-5 h-5 text-green-600" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm text-gray-500">Time</p>
                                                        <p className="font-medium">{exam.startTime} - {exam.endTime}</p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-purple-50 rounded-lg">
                                                        <MapPin className="w-5 h-5 text-purple-600" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm text-gray-500">Venue</p>
                                                        <p className="font-medium">{exam.roomNumber}</p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-yellow-50 rounded-lg">
                                                        <BookOpen className="w-5 h-5 text-yellow-600" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm text-gray-500">Marks</p>
                                                        <p className="font-medium">{exam.totalMarks} (Pass: {exam.passingMarks})</p>
                                                    </div>
                                                </div>
                                            </div>

                                            {exam.monitoringTeachers && exam.monitoringTeachers.length > 0 && (
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-red-50 rounded-lg">
                                                        <Users className="w-5 h-5 text-red-600" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm text-gray-500">Monitoring Teachers</p>
                                                        <p className="font-medium">
                                                            {exam.monitoringTeachers.map(t => t.user?.name).join(', ')}
                                                        </p>
                                                    </div>
                                                </div>
                                            )}

                                            {exam.instructions && (
                                                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                                                    <p className="text-sm font-medium text-gray-700 mb-2">Special Instructions:</p>
                                                    <p className="text-gray-600">{exam.instructions}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}