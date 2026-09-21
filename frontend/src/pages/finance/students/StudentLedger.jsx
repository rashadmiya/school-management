// src/pages/finance/students/StudentLedger.jsx
import {
    FinanceEmptyState, FinanceLoading,
    FinancePageHeader,
    FinanceStatCard,
    MoneyDisplay, SessionSelector, StudentSearchInput,
    WaiverRequestForm,
} from '@/components/finance';
import LedgerEntryRow from '@/components/finance/ledger/LedgerEntryRow';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useGetFeeInstanceQuery } from '@/features/apis/finance/feeApi';
import {
    useGetStudentLedgerQuery,
    useValidateLedgerQuery,
} from '@/features/apis/finance/ledgerApi';
import { useDebouncedValue } from '@/hooks/finance/useDebouncedValue';
import { useFinanceTheme } from '@/hooks/finance/useFinanceTheme';
import { useCurrentSession } from '@/hooks/useCurrentSession';
import { LEDGER_TYPE_LABELS } from '@/lib/financeUtils';
import { toMoneyNumber } from '@/lib/formaters';
import {
    AlertTriangle,
    CheckCircle2,
    RefreshCw,
    Search,
    XCircle
} from 'lucide-react';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

export default function StudentLedger() {
    const theme = useFinanceTheme();
    const navigate = useNavigate();
    const params = useParams();
    const { selectedSession } = useCurrentSession();

    const [studentId, setStudentId] = useState(params.studentId || '');
    const [session, setSession] = useState(selectedSession || '');
    const [type, setType] = useState('all');
    const [search, setSearch] = useState('');
    const debouncedSearch = useDebouncedValue(search, 250);

    // NEW — waiver dialog state
    const [waiveFeeId, setWaiveFeeId] = useState(null);

    // Fetch the full fee instance only when needed
    const { data: feeRes, isLoading: loadingFee } = useGetFeeInstanceQuery(waiveFeeId, { skip: !waiveFeeId });
    // const feeInstance = feeRes?.data || null;
    const feeInstance = feeRes || null;
    // console.log("feeInstance:", JSON.stringify(feeRes, null, 2))

    const handleWaive = (entry) => {
        // Ledger entry has refModel='FeeInstance', refId=the fee _id
        setWaiveFeeId(entry.refId);
    };

    const closeWaiver = () => setWaiveFeeId(null);

    const handleWaiverSuccess = () => {
        toast.success('Waiver request submitted');
        closeWaiver();
        refetch();  // refresh the ledger so the pending waiver isn't confusing
    };
    //waiver

    const { data, isLoading, isFetching, refetch } = useGetStudentLedgerQuery(
        { studentId, limit: 300 },
        { skip: !studentId }
    );
    const entries = data?.data || [];

    // console.log("entries:", JSON.stringify(entries, null, 2))

    const { data: validationRes } = useValidateLedgerQuery(studentId, { skip: !studentId });
    const validation = validationRes?.data || null;

    const filtered = entries.filter((e) => {
        if (type !== 'all' && e.type !== type) return false;
        if (debouncedSearch) {
            const q = debouncedSearch.toLowerCase();
            return (e.description || '').toLowerCase().includes(q)
                || (e.transactionId || '').toLowerCase().includes(q);
        }
        return true;
    });

    // const totalDebit = entries.reduce((sum, e) => sum + parseFloat(e.debit || 0), 0);
    // const totalCredit = entries.reduce((sum, e) => sum + parseFloat(e.credit || 0), 0);

    const totalDebit = entries.reduce((sum, e) => sum + toMoneyNumber(e.debit), 0);
    const totalCredit = entries.reduce((sum, e) => sum + toMoneyNumber(e.credit), 0);

    const handleStudentPick = (s) => {
        if (!s) { setStudentId(''); return; }
        setStudentId(s._id);
    };

    if (!studentId) {
        return (
            <div className={`space-y-6 ${theme.text}`}>
                <FinancePageHeader
                    title="Student Ledger"
                    subtitle="Search a student to view their complete financial ledger."
                    breadcrumb={[
                        { label: 'Finance', to: '/admin/finance' },
                        { label: 'Ledger' },
                    ]}
                />
                <Card className={`border shadow-sm ${theme.card}`}>
                    <CardContent className="pt-6 max-w-2xl">
                        <StudentSearchInput
                            value={null}
                            onChange={handleStudentPick}
                            session={session}
                            autoFocus
                        />
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className={`space-y-6 ${theme.text}`}>
            <FinancePageHeader
                title="Student Ledger"
                subtitle="Every financial event in chronological order."
                breadcrumb={[
                    { label: 'Finance', to: '/admin/finance' },
                    { label: 'Ledger' },
                    { label: studentId.slice(-6) },
                ]}
                actions={
                    <>
                        <SessionSelector value={session} onChange={setSession} width="w-[160px]" />
                        <Button
                            variant="outline"
                            onClick={() => refetch()}
                            className={theme.outlineBtn}
                        >
                            <RefreshCw className={`w-4 h-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
                            Refresh
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => navigate(`/admin/finance/students/${studentId}/statement`)}
                            className={theme.outlineBtn}
                        >
                            View Statement
                        </Button>
                    </>
                }
            />

            {/* Validation banner */}
            {validation && (
                <div className={`p-3 rounded-lg border flex items-center gap-3 ${validation.isValid
                    ? theme.isDarkMode
                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                        : 'bg-emerald-50 border-emerald-200 text-emerald-700'
                    : theme.isDarkMode
                        ? 'bg-red-500/10 border-red-500/20 text-red-400'
                        : 'bg-red-50 border-red-200 text-red-700'
                    }`}>
                    {validation.isValid ? (
                        <CheckCircle2 className="w-5 h-5" />
                    ) : (
                        <XCircle className="w-5 h-5" />
                    )}
                    <div className="flex-1">
                        <p className="text-sm font-medium">
                            {validation.isValid
                                ? 'Ledger balanced'
                                : `Ledger has ${validation.errors?.length || 0} inconsistencies`}
                        </p>
                        <p className="text-xs opacity-80 mt-0.5">
                            Current balance: {validation.currentBalance}
                        </p>
                    </div>
                </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <FinanceStatCard
                    label="Total Entries"
                    value={entries.length}
                    icon={RefreshCw}
                    accent="blue"
                />
                <FinanceStatCard
                    label="Total Debits"
                    value={<MoneyDisplay value={totalDebit} size="xl" tone="negative" />}
                    subtitle="Fees & adjustments"
                    accent="red"
                />
                <FinanceStatCard
                    label="Total Credits"
                    value={<MoneyDisplay value={totalCredit} size="xl" tone="positive" />}
                    subtitle="Payments & waivers"
                    accent="green"
                />
            </div>

            {/* Filters */}
            <Card className={`border shadow-sm ${theme.card}`}>
                <CardContent className="pt-5">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="relative md:col-span-2">
                            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 ${theme.textMuted}`} />
                            <Input
                                placeholder="Search description or transaction ID…"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className={`pl-10 ${theme.input}`}
                            />
                        </div>
                        <Select value={type} onValueChange={setType}>
                            <SelectTrigger className={theme.select}>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className={theme.selectContent}>
                                <SelectItem value="all" className={theme.selectItem}>All Types</SelectItem>
                                {Object.entries(LEDGER_TYPE_LABELS).map(([k, v]) => (
                                    <SelectItem key={k} value={k} className={theme.selectItem}>{v}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Entries */}
            <Card className={`border shadow-sm ${theme.card}`}>
                <CardHeader className="pb-3">
                    <CardTitle className={`text-lg ${theme.text}`}>
                        Ledger Entries ({filtered.length})
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    {isLoading ? (
                        <FinanceLoading rows={6} />
                    ) : filtered.length === 0 ? (
                        <FinanceEmptyState
                            icon={AlertTriangle}
                            title="No ledger entries"
                            description="This student has no financial activity for the selected session."
                        />
                    ) : (
                        <div className="divide-y">
                            {filtered.map((entry) => (
                                <LedgerEntryRow
                                    key={entry._id}
                                    entry={entry}
                                    onWaive={handleWaive}
                                />
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* NEW — Waiver request dialog */}
            <Dialog open={!!waiveFeeId} onOpenChange={(o) => !o && closeWaiver()}>
                <DialogContent className={`max-w-2xl max-h-[90vh] overflow-y-auto ${theme.dialog}`}>
                    <DialogHeader>
                        <DialogTitle className={theme.text}>
                            Request Waiver
                        </DialogTitle>
                    </DialogHeader>

                    {loadingFee ? (
                        <div className="py-12 text-center text-gray-500">Loading fee…</div>
                    ) : feeInstance ? (
                        <WaiverRequestForm
                            feeInstance={feeInstance}
                            onSuccess={handleWaiverSuccess}
                            onCancel={closeWaiver}
                        />
                    ) : (
                        <div className="py-6 text-center text-rose-500 text-sm">
                            Could not load the fee instance.
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}