// pages/ParentChangePin.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Loader2, ShieldCheck } from "lucide-react";
import {
    useChangeParentPinMutation,
    useGetParentMeQuery,
} from "@/features/apis/parentAuthApi";
import { useAppDispatch, useAppSelector } from "@/features/store";
import { parentPinChanged } from "@/features/slices/parentAuthSlice";

export default function ParentChangePin() {
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const { mustChangePin } = useAppSelector((s) => s.parentAuth);

    const { data, isLoading: loadingMe } = useGetParentMeQuery();
    const [changePin, { isLoading: changing }] = useChangeParentPinMutation();

    const [form, setForm] = useState({ currentPin: "", newPin: "", confirmPin: "" });
    const [error, setError] = useState("");

    // If the user is not actually in a must-change state, let them through.
    // (After a successful change we dispatch parentPinChanged.)
    if (!loadingMe && data && !mustChangePin) {
        navigate("/parent", { replace: true });
    }

    const handleChange = (e) =>
        setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        if (!/^\d{4,6}$/.test(form.newPin)) {
            setError("New PIN must be 4–6 digits");
            return;
        }
        if (form.newPin !== form.confirmPin) {
            setError("New PIN and confirmation do not match");
            return;
        }
        if (form.currentPin === form.newPin) {
            setError("New PIN must be different from the current one");
            return;
        }

        try {
            await changePin({
                currentPin: form.currentPin,
                newPin: form.newPin,
            }).unwrap();

            dispatch(parentPinChanged());
            navigate("/parent", { replace: true });
        } catch (err) {
            setError(err?.data?.message || "Failed to change PIN");
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-100 p-4">
            <Card className="w-full max-w-md shadow-xl border-0">
                <CardHeader>
                    <div className="flex justify-center mb-2">
                        <div className="h-14 w-14 bg-emerald-100 rounded-full flex items-center justify-center">
                            <ShieldCheck className="w-7 h-7 text-emerald-600" />
                        </div>
                    </div>
                    <CardTitle className="text-center text-2xl font-bold text-gray-800">
                        Set a New PIN
                    </CardTitle>
                    <p className="text-center text-sm text-gray-500">
                        You're using a temporary PIN. Please choose your own before
                        continuing.
                    </p>
                </CardHeader>

                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">
                                Current (temporary) PIN
                            </label>
                            <Input
                                name="currentPin"
                                type="password"
                                inputMode="numeric"
                                pattern="\d*"
                                maxLength={6}
                                value={form.currentPin}
                                onChange={handleChange}
                                required
                                className="h-11"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">
                                New PIN
                            </label>
                            <Input
                                name="newPin"
                                type="password"
                                inputMode="numeric"
                                pattern="\d*"
                                maxLength={6}
                                value={form.newPin}
                                onChange={handleChange}
                                required
                                className="h-11"
                            />
                            <p className="text-xs text-gray-500">4–6 digits</p>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">
                                Confirm New PIN
                            </label>
                            <Input
                                name="confirmPin"
                                type="password"
                                inputMode="numeric"
                                pattern="\d*"
                                maxLength={6}
                                value={form.confirmPin}
                                onChange={handleChange}
                                required
                                className="h-11"
                            />
                        </div>

                        {error && (
                            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
                                {error}
                            </div>
                        )}

                        <Button
                            type="submit"
                            disabled={changing}
                            className="w-full h-11 text-base bg-emerald-600 hover:bg-emerald-700"
                        >
                            {changing ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Saving…
                                </>
                            ) : (
                                "Save New PIN"
                            )}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}