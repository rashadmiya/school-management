// src/pages/finance/settings/NotificationPreferences.jsx
import { useState } from 'react';
import {
    Bell, Mail, MessageSquare, Smartphone, Save, Loader2, Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { FinancePageHeader, FinanceLoading } from '@/components/finance';
import { useFinanceTheme } from '@/hooks/finance/useFinanceTheme';
import {
    useGetNotificationPreferencesQuery,
    useUpdateNotificationPreferencesMutation,
} from '@/features/apis/finance/notificationApi';
import { toast } from 'sonner';

const NOTIFICATION_TYPES = [
    { key: 'payment_received', label: 'Payment Received' },
    { key: 'fee_created', label: 'Fee Created' },
    { key: 'fee_due_soon', label: 'Fee Due Soon' },
    { key: 'fee_overdue', label: 'Fee Overdue' },
    { key: 'waiver_requested', label: 'Waiver Requested' },
    { key: 'waiver_approved', label: 'Waiver Approved' },
    { key: 'refund_processed', label: 'Refund Processed' },
    { key: 'daily_summary', label: 'Daily Summary' },
];

const CHANNELS = ['email', 'sms', 'in_app'];

export default function NotificationPreferences() {
    const theme = useFinanceTheme();
    const { data, isLoading } = useGetNotificationPreferencesQuery();
    const [update, { isLoading: saving }] = useUpdateNotificationPreferencesMutation();

    const [draft, setDraft] = useState(null);

    // Initialize draft once loaded
    if (!draft && data?.data) {
        setDraft(data.data);
    }

    const handleGlobal = (key, value) => {
        setDraft((d) => ({ ...d, [key]: value }));
    };

    const handlePerType = (type, channel, value) => {
        setDraft((d) => ({
            ...d,
            preferences: {
                ...(d.preferences || {}),
                [type]: {
                    ...(d.preferences?.[type] || {}),
                    [channel]: value,
                },
            },
        }));
    };

    const handleSave = async () => {
        try {
            await update(draft).unwrap();
            toast.success('Preferences saved');
        } catch (err) {
            toast.error(err?.data?.message || 'Failed to save');
        }
    };

    if (isLoading || !draft) {
        return (
            <div className={`space-y-6 ${theme.text}`}>
                <FinancePageHeader title="Notification Preferences" />
                <FinanceLoading fullPage />
            </div>
        );
    }

    return (
        <div className={`space-y-6 ${theme.text}`}>
            <FinancePageHeader
                title="Notification Preferences"
                subtitle="Choose what you want to be notified about and through which channel."
                breadcrumb={[
                    { label: 'Finance', to: '/admin/finance' },
                    { label: 'Settings' },
                ]}
                actions={
                    <Button
                        onClick={handleSave}
                        disabled={saving}
                        className={theme.primaryBtn}
                    >
                        {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                        Save Changes
                    </Button>
                }
            />

            {/* Global toggles */}
            <Card className={`border shadow-sm ${theme.card}`}>
                <CardHeader className="pb-3">
                    <CardTitle className={`text-lg flex items-center gap-2 ${theme.text}`}>
                        <Bell className="w-5 h-5" />
                        Global Channels
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    <GlobalToggle
                        theme={theme}
                        icon={Mail}
                        label="Email"
                        description="Receive notifications by email"
                        checked={draft.emailEnabled !== false}
                        onChange={(v) => handleGlobal('emailEnabled', v)}
                    />
                    <GlobalToggle
                        theme={theme}
                        icon={Smartphone}
                        label="SMS"
                        description="Receive notifications by SMS"
                        checked={draft.smsEnabled !== false}
                        onChange={(v) => handleGlobal('smsEnabled', v)}
                    />
                    <GlobalToggle
                        theme={theme}
                        icon={MessageSquare}
                        label="In-App"
                        description="Show in-app notifications"
                        checked={draft.inAppEnabled !== false}
                        onChange={(v) => handleGlobal('inAppEnabled', v)}
                    />
                </CardContent>
            </Card>

            {/* Per-type matrix */}
            <Card className={`border shadow-sm ${theme.card}`}>
                <CardHeader className="pb-3">
                    <CardTitle className={`text-lg ${theme.text}`}>
                        Notification Types
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className={theme.tableHeader}>
                                <tr>
                                    <th className={`text-left px-6 py-3 text-xs font-medium uppercase tracking-wider ${theme.textMuted}`}>
                                        Event
                                    </th>
                                    {CHANNELS.map((c) => (
                                        <th key={c} className={`px-6 py-3 text-xs font-medium uppercase tracking-wider ${theme.textMuted}`}>
                                            {c.replace('_', ' ')}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {NOTIFICATION_TYPES.map((t) => {
                                    const prefs = draft.preferences?.[t.key] || {};
                                    return (
                                        <tr key={t.key} className={`border-t ${theme.border}`}>
                                            <td className={`px-6 py-3 text-sm font-medium ${theme.text}`}>
                                                {t.label}
                                            </td>
                                            {CHANNELS.map((c) => (
                                                <td key={c} className="px-6 py-3 text-center">
                                                    <div className="flex justify-center">
                                                        <Switch
                                                            checked={prefs[c] !== false}
                                                            onCheckedChange={(v) => handlePerType(t.key, c, v)}
                                                        />
                                                    </div>
                                                </td>
                                            ))}
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            {/* Quiet hours */}
            <Card className={`border shadow-sm ${theme.card}`}>
                <CardHeader className="pb-3">
                    <CardTitle className={`text-lg ${theme.text}`}>Quiet Hours</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 gap-3 max-w-md">
                        <div className="space-y-1.5">
                            <Label className={`text-sm ${theme.textSoft}`}>Do Not Disturb From</Label>
                            <Select
                                value={draft.quietHoursStart || '21:00'}
                                onValueChange={(v) => setDraft((d) => ({ ...d, quietHoursStart: v }))}
                            >
                                <SelectTrigger className={theme.select}>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className={theme.selectContent}>
                                    {['20:00', '21:00', '22:00', '23:00'].map((t) => (
                                        <SelectItem key={t} value={t} className={theme.selectItem}>{t}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <Label className={`text-sm ${theme.textSoft}`}>Until</Label>
                            <Select
                                value={draft.quietHoursEnd || '07:00'}
                                onValueChange={(v) => setDraft((d) => ({ ...d, quietHoursEnd: v }))}
                            >
                                <SelectTrigger className={theme.select}>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className={theme.selectContent}>
                                    {['06:00', '07:00', '08:00', '09:00'].map((t) => (
                                        <SelectItem key={t} value={t} className={theme.selectItem}>{t}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

function GlobalToggle({ theme, icon: Icon, label, description, checked, onChange }) {
    return (
        <div className={`flex items-center justify-between p-3 rounded-lg border ${theme.cardSolid}`}>
            <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${theme.iconBox}`}>
                    <Icon className="w-4 h-4" />
                </div>
                <div>
                    <p className={`text-sm font-medium ${theme.text}`}>{label}</p>
                    <p className={`text-xs ${theme.textMuted}`}>{description}</p>
                </div>
            </div>
            <Switch checked={checked} onCheckedChange={onChange} />
        </div>
    );
}