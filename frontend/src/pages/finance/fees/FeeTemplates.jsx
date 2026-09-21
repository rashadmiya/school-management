// src/pages/finance/fees/FeeTemplates.jsx
import {
    ConfirmDialog,
    FinanceEmptyState, FinanceLoading,
    FinancePageHeader, FinanceStatCard,
    MoneyDisplay,
    SessionSelector,
    StatusBadge,
} from '@/components/finance';
import ApplyNowPanel from '@/components/finance/templates/ApplyNowPanel';
import FeeTemplateForm from '@/components/finance/templates/FeeTemplateForm';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { useGetClassesQuery } from '@/features/apis/classesApi';
import {
    useDeleteFeeTemplateMutation,
    useGetFeeTemplatesQuery,
} from '@/features/apis/finance/feeApi';
import { useFinancePermissions } from '@/hooks/finance/useFinancePermissions';
import { useFinanceTheme } from '@/hooks/finance/useFinanceTheme';
import { getFrequencyLabel, getScopeLabel } from '@/lib/financeUtils';
import { formatDate } from '@/lib/formaters';
import {
    Calendar,
    CheckCircle, Download, Edit, FileText, Plus, Search, Sparkles,
    Tag,
    Trash2, Users, XCircle,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export default function FeeTemplates() {
    const theme = useFinanceTheme();
    const can = useFinancePermissions();
    const navigate = useNavigate();

    const [search, setSearch] = useState('');
    const [session, setSession] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [showForm, setShowForm] = useState(false);
    const [editing, setEditing] = useState(null);
    const [deleting, setDeleting] = useState(null);
    const [createdTemplate, setCreatedTemplate] = useState(null);
    const { data, isLoading, refetch } = useGetFeeTemplatesQuery({
        session: session || undefined,
        isActive: statusFilter === 'all' ? undefined : statusFilter === 'active',
    });
    const templates = data?.data || [];

    const { data: classesData } = useGetClassesQuery();
    const classes = classesData?.classes || [];

    const [deleteTemplate, { isLoading: isDeleting }] = useDeleteFeeTemplateMutation();

    // Filtered
    const filtered = useMemo(() => {
        if (!search) return templates;
        const q = search.toLowerCase();
        return templates.filter(
            (t) =>
                t.title?.toLowerCase().includes(q) ||
                t.description?.toLowerCase().includes(q)
        );
    }, [templates, search]);

    // Stats
    const activeCount = templates.filter((t) => t.isActive).length;
    const sessionCount = new Set(templates.map((t) => t.session)).size;
    const frequencyCount = new Set(templates.map((t) => t.frequency)).size;

    // Handlers
    const handleCreate = () => {
        setEditing(null);
        setShowForm(true);
    };

    const handleEdit = (t) => {
        setEditing(t);
        setShowForm(true);
    };

    const handleFormSuccess = (result) => {
        // Create path: FeeTemplateForm passes the created template back.
        // Edit path: result is undefined — close as before.
        if (result?._id) {
            setCreatedTemplate(result);
            return;
        }
        setShowForm(false);
        setEditing(null);
        refetch();
    };

    const handleApplyFinished = () => {
        // Both Skip and Apply end up here
        setShowForm(false);
        setEditing(null);
        setCreatedTemplate(null);
        refetch();
    };

    const handleFormCancel = () => {
        setShowForm(false);
        setEditing(null);
        setCreatedTemplate(null);
    };

    const handleDelete = async () => {
        if (!deleting) return;
        try {
            await deleteTemplate(deleting._id).unwrap();
            toast.success('Fee template deleted');
            setDeleting(null);
        } catch (err) {
            toast.error(err?.data?.message || 'Failed to delete template');
        }
    };

    const handleApply = (t) => {
        navigate(`/admin/finance/fees/apply?templateId=${t._id}`);
    };

    const handleViewEligible = (t) => {
        navigate(`/admin/finance/fees/templates/${t._id}/eligible`);
    };

    return (
        <div className={`space-y-6 ${theme.text}`}>
            <FinancePageHeader
                title="Fee Templates"
                subtitle="Define reusable fees and apply them to students."
                actions={
                    <>
                        {can.canApplyFees && (
                            <Button
                                variant="outline"
                                onClick={() => navigate('/admin/finance/fees/apply')}
                                className={theme.outlineBtn}
                            >
                                <Sparkles className="w-4 h-4 mr-2" />
                                Apply Fees
                            </Button>
                        )}
                        {can.canCreateTemplate && (
                            <Button onClick={handleCreate} className={theme.primaryBtn}>
                                <Plus className="w-4 h-4 mr-2" />
                                New Template
                            </Button>
                        )}
                    </>
                }
            />

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <FinanceStatCard
                    label="Total Templates"
                    value={templates.length}
                    icon={FileText}
                    accent="blue"
                />
                <FinanceStatCard
                    label="Active"
                    value={activeCount}
                    icon={CheckCircle}
                    accent="green"
                />
                <FinanceStatCard
                    label="Sessions"
                    value={sessionCount}
                    icon={Calendar}
                    accent="purple"
                />
                <FinanceStatCard
                    label="Frequencies"
                    value={frequencyCount}
                    icon={Tag}
                    accent="yellow"
                />
            </div>

            {/* Filters */}
            <Card className={`border shadow-sm ${theme.card}`}>
                <CardContent className="pt-5">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                        <div className="relative">
                            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 ${theme.textMuted}`} />
                            <Input
                                placeholder="Search templates..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className={`pl-10 ${theme.input}`}
                            />
                        </div>

                        <SessionSelector
                            value={session}
                            onChange={setSession}
                            includeAll
                            width="w-full"
                        />

                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className={theme.select}>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className={theme.selectContent}>
                                <SelectItem value="all" className={theme.selectItem}>All Status</SelectItem>
                                <SelectItem value="active" className={theme.selectItem}>Active</SelectItem>
                                <SelectItem value="inactive" className={theme.selectItem}>Inactive</SelectItem>
                            </SelectContent>
                        </Select>

                        <Button
                            variant="outline"
                            onClick={() => { setSearch(''); setSession(''); setStatusFilter('all'); }}
                            className={theme.outlineBtn}
                        >
                            <Download className="w-4 h-4 mr-2" />
                            Export
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Table */}
            <Card className={`border shadow-sm ${theme.card}`}>
                <CardHeader className="pb-3">
                    <CardTitle className={`text-lg ${theme.text}`}>
                        Templates ({filtered.length})
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    {isLoading ? (
                        <FinanceLoading rows={5} />
                    ) : filtered.length === 0 ? (
                        <FinanceEmptyState
                            icon={FileText}
                            title="No fee templates yet"
                            description="Fee templates define what you charge, how often, and to whom."
                            actionLabel={can.canCreateTemplate ? 'Create First Template' : undefined}
                            onAction={can.canCreateTemplate ? handleCreate : undefined}
                        />
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader className={theme.tableHeader}>
                                    <TableRow>
                                        <TableHead className={theme.textMuted}>Template</TableHead>
                                        <TableHead className={theme.textMuted}>Amount</TableHead>
                                        <TableHead className={theme.textMuted}>Frequency</TableHead>
                                        <TableHead className={theme.textMuted}>Applies To</TableHead>
                                        <TableHead className={theme.textMuted}>Session</TableHead>
                                        <TableHead className={theme.textMuted}>Status</TableHead>
                                        <TableHead className={theme.textMuted}>Created</TableHead>
                                        <TableHead className={`text-right ${theme.textMuted}`}>Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filtered.map((t) => (
                                        <TableRow key={t._id} className={`${theme.row} transition-colors`}>
                                            <TableCell className="max-w-[280px]">
                                                <div className="flex items-center gap-3">
                                                    <div className={`p-2 rounded-lg ${theme.iconBox}`}>
                                                        <FileText className="w-4 h-4" />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className={`text-sm font-medium truncate ${theme.text}`}>{t.title}</p>
                                                        {t.description && (
                                                            <p className={`text-xs truncate ${theme.textMuted}`}>{t.description}</p>
                                                        )}
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <MoneyDisplay value={t.amount} />
                                                {t.taxPercentage > 0 && (
                                                    <p className={`text-xs ${theme.textMuted}`}>+{t.taxPercentage}% tax</p>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <span className={`text-sm ${theme.textSoft}`}>
                                                    {getFrequencyLabel(t.frequency)}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <span className={`text-sm ${theme.textSoft}`}>
                                                    {getScopeLabel(t.appliesTo?.scope)}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <span className={`text-sm ${theme.textMuted}`}>{t.session}</span>
                                            </TableCell>
                                            <TableCell>
                                                <StatusBadge
                                                    domain="fee"
                                                    status={t.isActive ? 'paid' : 'cancelled'}
                                                    label={t.isActive ? 'Active' : 'Inactive'}
                                                    icon={t.isActive ? CheckCircle : XCircle}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <span className={`text-xs ${theme.textMuted}`}>
                                                    {formatDate(t.createdAt)}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    {can.canApplyFees && (
                                                        <Button
                                                            variant="ghost" size="sm"
                                                            onClick={() => handleApply(t)}
                                                            disabled={!t.isActive}
                                                            className={`${theme.ghostBtn} ${theme.isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}
                                                            title="Apply to students"
                                                        >
                                                            <Sparkles className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                    <Button
                                                        variant="ghost" size="sm"
                                                        onClick={() => handleViewEligible(t)}
                                                        className={theme.ghostBtn}
                                                        title="View eligible students"
                                                    >
                                                        <Users className="h-4 w-4" />
                                                    </Button>
                                                    {can.canEditTemplate && (
                                                        <Button
                                                            variant="ghost" size="sm"
                                                            onClick={() => handleEdit(t)}
                                                            className={theme.ghostBtn}
                                                            title="Edit"
                                                        >
                                                            <Edit className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                    {can.canDeleteTemplate && (
                                                        <Button
                                                            variant="ghost" size="sm"
                                                            onClick={() => setDeleting(t)}
                                                            className={`${theme.ghostBtn} hover:text-red-500`}
                                                            title="Delete"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Form dialog */}
            <Dialog
                open={showForm}
                onOpenChange={(o) => {
                    if (!o) handleFormCancel();
                    else setShowForm(true);
                }}
            >
                <DialogContent className={`max-w-3xl max-h-[90vh] overflow-y-auto ${theme.dialog}`}>
                    <DialogHeader>
                        <DialogTitle className={theme.text}>
                            {createdTemplate
                                ? 'Apply Fee to Students'
                                : editing
                                    ? 'Edit Fee Template'
                                    : 'Create New Fee Template'}
                        </DialogTitle>
                    </DialogHeader>

                    {createdTemplate ? (
                        <ApplyNowPanel
                            template={createdTemplate}
                            onSkip={handleApplyFinished}
                            onApplied={handleApplyFinished}
                        />
                    ) : (
                        <FeeTemplateForm
                            template={editing}
                            classes={classes}
                            onSuccess={handleFormSuccess}
                            onCancel={handleFormCancel}
                        />
                    )}
                </DialogContent>
            </Dialog>

            {/* Delete confirm */}
            <ConfirmDialog
                open={!!deleting}
                onOpenChange={(o) => !o && setDeleting(null)}
                title="Delete fee template?"
                description={
                    deleting
                        ? `"${deleting.title}" will be permanently deleted. This cannot be undone. Templates with existing fee instances cannot be deleted.`
                        : ''
                }
                confirmLabel="Delete"
                variant="destructive"
                loading={isDeleting}
                onConfirm={handleDelete}
            />
        </div>
    );
}