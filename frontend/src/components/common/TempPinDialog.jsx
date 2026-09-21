// components/common/TempPinDialog.jsx
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Copy, ShieldAlert } from "lucide-react";
import { useState } from "react";
import { toast } from "react-toastify";

export default function TempPinDialog({ open, data, onClose }) {
    const [acknowledged, setAcknowledged] = useState(false);

    if (!data) return null;

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(data.tempPin);
            toast.success("PIN copied to clipboard");
        } catch {
            toast.error("Could not copy — please copy manually");
        }
    };

    return (
        <Dialog open={open} onOpenChange={(o) => { if (!o && acknowledged) onClose(); }}>
            <DialogContent className="sm:max-w-[480px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <ShieldAlert className="w-5 h-5 text-amber-500" />
                        Parent Account Created
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                        A parent account was created for{" "}
                        <strong>{data.parentName || "the guardian"}</strong>{" "}
                        {data.parentPhone && <>at <strong>{data.parentPhone}</strong></>}.
                        Share this temporary PIN with them. <strong>It will not be
                        shown again.</strong>
                    </p>

                    <div className="flex items-center justify-between p-4 border rounded-lg bg-amber-50 dark:bg-amber-950/30">
                        <span className="font-mono text-3xl tracking-widest">
                            {data.tempPin}
                        </span>
                        <Button variant="ghost" size="sm" onClick={handleCopy}>
                            <Copy className="w-4 h-4 mr-1" /> Copy
                        </Button>
                    </div>

                    <p className="text-xs text-gray-500">
                        The parent logs in at the parent portal with their phone
                        number and this PIN, then is forced to set their own PIN.
                    </p>

                    <label className="flex items-start gap-2 text-sm">
                        <Checkbox
                            checked={acknowledged}
                            onCheckedChange={setAcknowledged}
                            className="mt-0.5"
                        />
                        <span>
                            I have securely shared this PIN with the parent (or
                            written it down to relay). I understand it cannot be
                            retrieved again.
                        </span>
                    </label>
                </div>

                <div className="flex justify-end pt-2">
                    <Button
                        onClick={onClose}
                        disabled={!acknowledged}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                        Done
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}