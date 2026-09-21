// src/components/finance/shared/ConfirmDialog.jsx
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useFinanceTheme } from '@/hooks/finance/useFinanceTheme';

/**
 * Props:
 *   open       — controlled open
 *   onOpenChange(open)
 *   title      — dialog title
 *   description — dialog body
 *   confirmLabel — default 'Confirm'
 *   cancelLabel  — default 'Cancel'
 *   onConfirm  — handler
 *   loading    — disables buttons
 *   variant    — 'default' | 'destructive'
 */
export function ConfirmDialog({
    open,
    onOpenChange,
    title = 'Are you sure?',
    description,
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    onConfirm,
    loading = false,
    variant = 'default',
}) {
    const theme = useFinanceTheme();

    const confirmClass = variant === 'destructive'
        ? 'bg-red-600 hover:bg-red-700 text-white'
        : theme.primaryBtn;

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent className={theme.dialog}>
                <AlertDialogHeader>
                    <AlertDialogTitle className={theme.text}>{title}</AlertDialogTitle>
                    {description && (
                        <AlertDialogDescription className={theme.textMuted}>
                            {description}
                        </AlertDialogDescription>
                    )}
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel
                        disabled={loading}
                        className={theme.outlineBtn}
                    >
                        {cancelLabel}
                    </AlertDialogCancel>
                    <AlertDialogAction
                        disabled={loading}
                        onClick={(e) => { e.preventDefault(); onConfirm?.(); }}
                        className={confirmClass}
                    >
                        {loading ? 'Please wait…' : confirmLabel}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

export default ConfirmDialog;