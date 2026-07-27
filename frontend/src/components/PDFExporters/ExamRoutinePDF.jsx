// components/exam/ExamRoutinePDF.jsx
import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';

// Register fonts if needed
Font.register({
  family: 'Helvetica',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Mu4mxK.woff2' },
    { src: 'https://fonts.gstatic.com/s/roboto/v30/KFOlCnqEu92Fr1MmEU9fBBc4.woff2', fontWeight: 'bold' },
  ],
});

// Create styles
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    padding: 30,
    fontFamily: 'Helvetica',
  },
  header: {
    marginBottom: 20,
    borderBottom: '2px solid #1e40af',
    paddingBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e40af',
    textAlign: 'center',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 10,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e40af',
    marginBottom: 10,
    backgroundColor: '#eff6ff',
    padding: 5,
    borderRadius: 3,
  },
  table: {
    display: 'table',
    width: 'auto',
    marginBottom: 10,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#3b82f6',
    color: '#ffffff',
    paddingVertical: 5,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#d1d5db',
    paddingVertical: 5,
  },
  tableCell: {
    flex: 1,
    paddingHorizontal: 5,
    fontSize: 10,
  },
  headerCell: {
    flex: 1,
    paddingHorizontal: 5,
    fontSize: 10,
    fontWeight: 'bold',
  },
  examCard: {
    border: '1px solid #d1d5db',
    borderRadius: 5,
    padding: 10,
    marginBottom: 10,
  },
  examTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 5,
  },
  examDetails: {
    fontSize: 10,
    color: '#6b7280',
    marginBottom: 2,
  },
  badge: {
    backgroundColor: '#dbeafe',
    color: '#1e40af',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 3,
    fontSize: 9,
    marginBottom: 5,
    alignSelf: 'flex-start',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    textAlign: 'center',
    fontSize: 10,
    color: '#9ca3af',
    borderTop: '1px solid #e5e7eb',
    paddingTop: 10,
  },
  warningBox: {
    backgroundColor: '#fef3c7',
    border: '1px solid #f59e0b',
    borderRadius: 5,
    padding: 10,
    marginVertical: 10,
  },
  warningText: {
    fontSize: 10,
    color: '#92400e',
  },
  pageNumber: {
    position: 'absolute',
    bottom: 20,
    right: 30,
    fontSize: 10,
    color: '#9ca3af',
  },
});

// Helper functions
const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

const getDuration = (startTime, endTime) => {
  const [startHour, startMinute] = startTime.split(':').map(Number);
  const [endHour, endMinute] = endTime.split(':').map(Number);
  const duration = (endHour * 60 + endMinute) - (startHour * 60 + startMinute);
  const hours = Math.floor(duration / 60);
  const minutes = duration % 60;
  return `${hours}h ${minutes > 0 ? `${minutes}m` : ''}`;
};

// ExamRoutinePDF Component
const ExamRoutinePDF = ({ exams = [], studentView = false, teacherView = false, adminView = false }) => {
  const getDocumentTitle = () => {
    if (studentView) return 'My Exam Schedule';
    if (teacherView) return 'Exam Monitoring Schedule';
    if (adminView) return 'Exam Routine Management Report';
    return 'Exam Schedule';
  };

  const getDocumentSubtitle = () => {
    const totalExams = exams.length;
    const dateRange = exams.length > 0 
      ? `${formatDate(exams[0].examDate)} to ${formatDate(exams[exams.length - 1].examDate)}`
      : 'No exams scheduled';
    return `${totalExams} exams • ${dateRange}`;
  };

  const getCurrentAcademicYear = () => {
    const currentYear = new Date().getFullYear();
    return `${currentYear}-${currentYear + 1}`;
  };

  // Sort exams by date and time
  const sortedExams = [...exams].sort((a, b) => {
    const dateA = new Date(a.examDate);
    const dateB = new Date(b.examDate);
    if (dateA.getTime() === dateB.getTime()) {
      return a.startTime.localeCompare(b.startTime);
    }
    return dateA - dateB;
  });

  // Group exams by date
  const examsByDate = sortedExams.reduce((groups, exam) => {
    const date = formatDate(exam.examDate);
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(exam);
    return groups;
  }, {});

  // Table view for admin
  if (adminView) {
    return (
      <Document>
        <Page size="A4" style={styles.page}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>{getDocumentTitle()}</Text>
            <Text style={styles.subtitle}>{getDocumentSubtitle()}</Text>
            <Text style={styles.subtitle}>Academic Year: {getCurrentAcademicYear()}</Text>
            <Text style={styles.subtitle}>Generated on: {new Date().toLocaleDateString()}</Text>
          </View>

          {/* Summary Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Summary</Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <View>
                <Text style={styles.examDetails}>Total Exams: {exams.length}</Text>
                <Text style={styles.examDetails}>Published: {exams.filter(e => e.isPublished).length}</Text>
              </View>
              <View>
                <Text style={styles.examDetails}>Drafts: {exams.filter(e => !e.isPublished).length}</Text>
                <Text style={styles.examDetails}>Total Monitoring Duties: {
                  exams.reduce((sum, exam) => sum + (exam.monitoringTeachers?.length || 0), 0)
                }</Text>
              </View>
            </View>
          </View>

          {/* Exam Table */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Exam Schedule</Text>
            <View style={styles.table}>
              {/* Table Header */}
              <View style={styles.tableHeader}>
                <Text style={[styles.headerCell, { flex: 1.5 }]}>Date</Text>
                <Text style={styles.headerCell}>Time</Text>
                <Text style={styles.headerCell}>Class</Text>
                <Text style={styles.headerCell}>Subject</Text>
                <Text style={styles.headerCell}>Room</Text>
                <Text style={styles.headerCell}>Type</Text>
                <Text style={styles.headerCell}>Status</Text>
              </View>
              
              {/* Table Rows */}
              {sortedExams.map((exam, index) => (
                <View key={index} style={styles.tableRow}>
                  <Text style={[styles.tableCell, { flex: 1.5 }]}>{formatDate(exam.examDate)}</Text>
                  <Text style={styles.tableCell}>{exam.startTime} - {exam.endTime}</Text>
                  <Text style={styles.tableCell}>{exam.class?.name} {exam.class?.section?.name && `(${exam.class.section.name})`}</Text>
                  <Text style={styles.tableCell}>{exam.subject?.name}</Text>
                  <Text style={styles.tableCell}>{exam.roomNumber}</Text>
                  <Text style={styles.tableCell}>{exam.examType}</Text>
                  <Text style={[styles.tableCell, { color: exam.isPublished ? '#059669' : '#9ca3af' }]}>
                    {exam.isPublished ? 'Published' : 'Draft'}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text>Generated by School Management System • Confidential</Text>
          </View>
          <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => (
            `Page ${pageNumber} of ${totalPages}`
          )} fixed />
        </Page>
      </Document>
    );
  }

  // Card view for students and teachers
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{getDocumentTitle()}</Text>
          <Text style={styles.subtitle}>{getDocumentSubtitle()}</Text>
          <Text style={styles.subtitle}>
            {studentView && 'Student View • Personal Exam Schedule'}
            {teacherView && 'Teacher View • Monitoring Duties'}
          </Text>
          <Text style={styles.subtitle}>Academic Year: {getCurrentAcademicYear()}</Text>
        </View>

        {/* Instructions for students */}
        {studentView && (
          <View style={styles.warningBox}>
            <Text style={styles.warningText}>
              • Please arrive at the examination hall 15 minutes before the scheduled time
              • Bring your student ID and required stationery
              • Follow all examination rules and regulations
              • Contact your teacher for any queries
            </Text>
          </View>
        )}

        {/* Instructions for teachers */}
        {teacherView && (
          <View style={styles.warningBox}>
            <Text style={styles.warningText}>
              • Please arrive at the examination hall 30 minutes before the scheduled time
              • Check all examination materials and seating arrangements
              • Monitor students according to examination rules
              • Report any irregularities immediately
            </Text>
          </View>
        )}

        {/* Exams by Date */}
        {Object.entries(examsByDate).map(([date, dateExams]) => (
          <View key={date} style={styles.section}>
            <Text style={styles.sectionTitle}>{date}</Text>
            
            {dateExams.map((exam, index) => (
              <View key={index} style={styles.examCard}>
                {/* Exam Type Badge */}
                <Text style={styles.badge}>{exam.examType.toUpperCase()}</Text>
                
                {/* Exam Title */}
                <Text style={styles.examTitle}>{exam.title}</Text>
                
                {/* Basic Details */}
                <Text style={styles.examDetails}>
                  Time: {exam.startTime} - {exam.endTime} ({getDuration(exam.startTime, exam.endTime)})
                </Text>
                <Text style={styles.examDetails}>Subject: {exam.subject?.name} ({exam.subject?.code})</Text>
                <Text style={styles.examDetails}>Class: {exam.class?.name} {exam.class?.section?.name && `(${exam.class.section.name})`}</Text>
                <Text style={styles.examDetails}>Room: {exam.roomNumber}</Text>
                
                {/* Marks */}
                <Text style={styles.examDetails}>
                  Marks: {exam.totalMarks} | Passing: {exam.passingMarks}
                </Text>
                
                {/* Monitoring Teachers (for teacher view and student view) */}
                {exam.monitoringTeachers && exam.monitoringTeachers.length > 0 && (
                  <Text style={styles.examDetails}>
                    {teacherView ? 'Co-Invigilators: ' : 'Invigilators: '}
                    {exam.monitoringTeachers.map(t => t.user?.name).join(', ')}
                  </Text>
                )}
                
                {/* Instructions */}
                {exam.instructions && (
                  <Text style={[styles.examDetails, { marginTop: 5, fontStyle: 'italic' }]}>
                    Note: {exam.instructions}
                  </Text>
                )}
              </View>
            ))}
          </View>
        ))}

        {/* No Exams Message */}
        {sortedExams.length === 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>No Exams Scheduled</Text>
            <Text style={styles.examDetails}>
              {studentView && 'You have no exams scheduled at this time.'}
              {teacherView && 'You have no monitoring duties scheduled at this time.'}
            </Text>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text>Generated by School Management System • {new Date().toLocaleDateString()}</Text>
          <Text>For official use only • Do not distribute without permission</Text>
        </View>
        <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => (
          `Page ${pageNumber} of ${totalPages}`
        )} fixed />
      </Page>
    </Document>
  );
};

export default ExamRoutinePDF;

// In your pages/components, use it like this:

// import { PDFDownloadLink } from '@react-pdf/renderer';
// import ExamRoutinePDF from '@/components/exam/ExamRoutinePDF';

// // For student view
// <PDFDownloadLink
//   document={<ExamRoutinePDF exams={studentExams} studentView={true} />}
//   fileName={`my-exam-schedule-${academicYear}.pdf`}
// >
//   {({ loading }) => (
//     <Button disabled={loading}>
//       {loading ? 'Generating PDF...' : 'Download PDF'}
//     </Button>
//   )}
// </PDFDownloadLink>

// // For teacher view
// <PDFDownloadLink
//   document={<ExamRoutinePDF exams={teacherExams} teacherView={true} />}
//   fileName={`monitoring-schedule-${academicYear}.pdf`}
// >
//   {({ loading }) => (
//     <Button disabled={loading}>
//       {loading ? 'Generating PDF...' : 'Download PDF'}
//     </Button>
//   )}
// </PDFDownloadLink>

// // For admin view
// <PDFDownloadLink
//   document={<ExamRoutinePDF exams={allExams} adminView={true} />}
//   fileName={`exam-management-report-${academicYear}.pdf`}
// >
//   {({ loading }) => (
//     <Button disabled={loading}>
//       {loading ? 'Generating PDF...' : 'Download PDF'}
//     </Button>
//   )}
// </PDFDownloadLink>