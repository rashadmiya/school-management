// src/pages/Settings/SessionSettings.jsx
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useToast } from '@/hooks/use-toast'
import { formatDate } from '@/lib/formaters'
import {
    AlertCircle,
    Calendar,
    CheckCircle,
    Download,
    Edit,
    Plus,
    Save,
    Trash2,
    Upload,
    XCircle
} from 'lucide-react'
import { useState } from 'react'

const SessionSettings = () => {
    const [sessions, setSessions] = useState([
        { id: 1, name: '2023-2024', startDate: '2023-04-01', endDate: '2024-03-31', isActive: false, description: 'Previous academic year' },
        { id: 2, name: '2024-2025', startDate: '2024-04-01', endDate: '2025-03-31', isActive: true, description: 'Current academic year' },
        { id: 3, name: '2025-2026', startDate: '2025-04-01', endDate: '2026-03-31', isActive: false, description: 'Upcoming academic year' },
    ])

    const [editingSession, setEditingSession] = useState(null)
    const [newSession, setNewSession] = useState({
        name: '',
        startDate: '',
        endDate: '',
        description: '',
    })
    const [showNewForm, setShowNewForm] = useState(false)

    const { toast } = useToast()

    const handleEdit = (session) => {
        setEditingSession({ ...session })
        setShowNewForm(false)
    }

    const handleSaveEdit = () => {
        if (!editingSession.name || !editingSession.startDate || !editingSession.endDate) {
            toast({
                title: 'Error',
                description: 'Please fill all required fields',
                variant: 'destructive',
            })
            return
        }

        if (new Date(editingSession.startDate) >= new Date(editingSession.endDate)) {
            toast({
                title: 'Error',
                description: 'End date must be after start date',
                variant: 'destructive',
            })
            return
        }

        setSessions(sessions.map(s =>
            s.id === editingSession.id ? { ...editingSession } : s
        ))

        toast({
            title: 'Success',
            description: 'Session updated successfully',
            variant: 'success',
        })

        setEditingSession(null)
    }

    const handleDelete = (sessionId) => {
        if (window.confirm('Are you sure you want to delete this session? This action cannot be undone.')) {
            setSessions(sessions.filter(s => s.id !== sessionId))
            toast({
                title: 'Success',
                description: 'Session deleted successfully',
                variant: 'success',
            })
        }
    }

    const handleSetActive = (sessionId) => {
        setSessions(sessions.map(s => ({
            ...s,
            isActive: s.id === sessionId
        })))
        toast({
            title: 'Success',
            description: 'Session set as active',
            variant: 'success',
        })
    }

    const handleAddNew = () => {
        if (!newSession.name || !newSession.startDate || !newSession.endDate) {
            toast({
                title: 'Error',
                description: 'Please fill all required fields',
                variant: 'destructive',
            })
            return
        }

        if (new Date(newSession.startDate) >= new Date(newSession.endDate)) {
            toast({
                title: 'Error',
                description: 'End date must be after start date',
                variant: 'destructive',
            })
            return
        }

        const newId = Math.max(...sessions.map(s => s.id)) + 1
        const sessionToAdd = {
            ...newSession,
            id: newId,
            isActive: false,
        }

        setSessions([...sessions, sessionToAdd])

        toast({
            title: 'Success',
            description: 'New session added successfully',
            variant: 'success',
        })

        setNewSession({
            name: '',
            startDate: '',
            endDate: '',
            description: '',
        })
        setShowNewForm(false)
    }

    const handleExportSessions = () => {
        // Export functionality
        console.log('Exporting sessions...')
        toast({
            title: 'Export Started',
            description: 'Session data export initiated',
            variant: 'default',
        })
    }

    const handleImportSessions = () => {
        // Import functionality
        console.log('Importing sessions...')
        toast({
            title: 'Import Started',
            description: 'Session data import initiated',
            variant: 'default',
        })
    }

    const activeSession = sessions.find(s => s.isActive)

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Session Settings</h1>
                    <p className="text-muted-foreground">
                        Manage academic sessions and settings
                    </p>
                </div>
                <div className="flex items-center space-x-2">
                    <Button variant="outline" onClick={handleExportSessions}>
                        <Download className="mr-2 h-4 w-4" />
                        Export
                    </Button>
                    <Button variant="outline" onClick={handleImportSessions}>
                        <Upload className="mr-2 h-4 w-4" />
                        Import
                    </Button>
                </div>
            </div>

            {/* Active Session Info */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                        <div className="space-y-2">
                            <div className="flex items-center space-x-3">
                                <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                                    <Calendar className="h-6 w-6 text-green-600" />
                                </div>
                                <div>
                                    <div className="text-lg font-semibold">Active Session</div>
                                    {activeSession ? (
                                        <div className="flex items-center space-x-4">
                                            <div className="text-2xl font-bold">{activeSession.name}</div>
                                            <Badge className="bg-green-100 text-green-800">
                                                <CheckCircle className="mr-1 h-3 w-3" />
                                                Active
                                            </Badge>
                                        </div>
                                    ) : (
                                        <div className="text-red-600 font-medium">No active session set</div>
                                    )}
                                </div>
                            </div>
                            {activeSession && (
                                <div className="text-sm text-gray-600">
                                    {formatDate(activeSession.startDate)} to {formatDate(activeSession.endDate)}
                                </div>
                            )}
                        </div>
                        <div className="text-right">
                            <div className="text-sm text-gray-500">Total Sessions</div>
                            <div className="text-2xl font-bold">{sessions.length}</div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Sessions Table */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle>Academic Sessions</CardTitle>
                        <Button onClick={() => setShowNewForm(true)}>
                            <Plus className="mr-2 h-4 w-4" />
                            Add New Session
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Session Name</TableHead>
                                    <TableHead>Start Date</TableHead>
                                    <TableHead>End Date</TableHead>
                                    <TableHead>Description</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {sessions.map((session) => (
                                    <TableRow key={session.id}>
                                        <TableCell>
                                            <div className="font-medium">{session.name}</div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center">
                                                <Calendar className="mr-2 h-4 w-4 text-gray-400" />
                                                {formatDate(session.startDate)}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center">
                                                <Calendar className="mr-2 h-4 w-4 text-gray-400" />
                                                {formatDate(session.endDate)}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="max-w-xs truncate">{session.description}</div>
                                        </TableCell>
                                        <TableCell>
                                            {session.isActive ? (
                                                <Badge className="bg-green-100 text-green-800">
                                                    <CheckCircle className="mr-1 h-3 w-3" />
                                                    Active
                                                </Badge>
                                            ) : (
                                                <Badge variant="outline" className="text-gray-500">
                                                    Inactive
                                                </Badge>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end space-x-2">
                                                {!session.isActive && (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleSetActive(session.id)}
                                                    >
                                                        Set Active
                                                    </Button>
                                                )}
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleEdit(session)}
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleDelete(session.id)}
                                                    disabled={session.isActive}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            {/* Edit Form */}
            {editingSession && (
                <Card>
                    <CardHeader>
                        <CardTitle>Edit Session</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2">
                                        Session Name *
                                    </label>
                                    <Input
                                        value={editingSession.name}
                                        onChange={(e) => setEditingSession({ ...editingSession, name: e.target.value })}
                                        placeholder="e.g., 2024-2025"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2">
                                        Description
                                    </label>
                                    <Input
                                        value={editingSession.description}
                                        onChange={(e) => setEditingSession({ ...editingSession, description: e.target.value })}
                                        placeholder="Session description"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2">
                                        Start Date *
                                    </label>
                                    <Input
                                        type="date"
                                        value={editingSession.startDate}
                                        onChange={(e) => setEditingSession({ ...editingSession, startDate: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2">
                                        End Date *
                                    </label>
                                    <Input
                                        type="date"
                                        value={editingSession.endDate}
                                        onChange={(e) => setEditingSession({ ...editingSession, endDate: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="flex items-center justify-end space-x-4">
                                <Button
                                    variant="outline"
                                    onClick={() => setEditingSession(null)}
                                >
                                    Cancel
                                </Button>
                                <Button onClick={handleSaveEdit}>
                                    <Save className="mr-2 h-4 w-4" />
                                    Save Changes
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Add New Form */}
            {showNewForm && (
                <Card>
                    <CardHeader>
                        <CardTitle>Add New Session</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2">
                                        Session Name *
                                    </label>
                                    <Input
                                        value={newSession.name}
                                        onChange={(e) => setNewSession({ ...newSession, name: e.target.value })}
                                        placeholder="e.g., 2026-2027"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2">
                                        Description
                                    </label>
                                    <Input
                                        value={newSession.description}
                                        onChange={(e) => setNewSession({ ...newSession, description: e.target.value })}
                                        placeholder="Session description"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2">
                                        Start Date *
                                    </label>
                                    <Input
                                        type="date"
                                        value={newSession.startDate}
                                        onChange={(e) => setNewSession({ ...newSession, startDate: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2">
                                        End Date *
                                    </label>
                                    <Input
                                        type="date"
                                        value={newSession.endDate}
                                        onChange={(e) => setNewSession({ ...newSession, endDate: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="flex items-center justify-end space-x-4">
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setShowNewForm(false)
                                        setNewSession({
                                            name: '',
                                            startDate: '',
                                            endDate: '',
                                            description: '',
                                        })
                                    }}
                                >
                                    Cancel
                                </Button>
                                <Button onClick={handleAddNew}>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Add Session
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Important Notes */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center">
                        <AlertCircle className="mr-2 h-5 w-5 text-yellow-600" />
                        Important Notes
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        <div className="flex items-start space-x-3">
                            <div className="h-6 w-6 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                                <XCircle className="h-4 w-4 text-red-600" />
                            </div>
                            <div>
                                <div className="font-medium text-red-800">Deleting Sessions</div>
                                <div className="text-sm text-gray-600">
                                    Deleting a session will remove all associated data. This action cannot be undone.
                                </div>
                            </div>
                        </div>
                        <div className="flex items-start space-x-3">
                            <div className="h-6 w-6 rounded-full bg-yellow-100 flex items-center justify-center flex-shrink-0">
                                <AlertCircle className="h-4 w-4 text-yellow-600" />
                            </div>
                            <div>
                                <div className="font-medium text-yellow-800">Active Session</div>
                                <div className="text-sm text-gray-600">
                                    Only one session can be active at a time. Changing the active session will affect all new fee applications.
                                </div>
                            </div>
                        </div>
                        <div className="flex items-start space-x-3">
                            <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                                <Calendar className="h-4 w-4 text-blue-600" />
                            </div>
                            <div>
                                <div className="font-medium text-blue-800">Session Dates</div>
                                <div className="text-sm text-gray-600">
                                    Ensure session dates don't overlap. This can cause conflicts in fee applications.
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

export default SessionSettings