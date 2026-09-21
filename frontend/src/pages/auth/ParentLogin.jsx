// pages/ParentLogin.jsx
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Loader2, Phone, Lock } from "lucide-react";
import { useParentLoginMutation } from "@/features/apis/parentAuthApi";

export default function ParentLogin() {
    const navigate = useNavigate();
    const [form, setForm] = useState({ phone: "", pin: "" });
    const [error, setError] = useState("");
    const [showPin, setShowPin] = useState(false);

    const [parentLogin, { isLoading }] = useParentLoginMutation();

    const handleChange = (e) => {
        setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        // Basic client-side sanity
        const digits = form.phone.replace(/\D/g, "");
        if (digits.length < 10) {
            setError("Please enter a valid phone number");
            return;
        }
        if (!/^\d{4,6}$/.test(form.pin)) {
            setError("PIN must be 4–6 digits");
            return;
        }

        try {
            const res = await parentLogin({
                phone: form.phone,
                pin: form.pin,
            }).unwrap();

            if (res.mustChangePin) {
                navigate("/parent/change-pin", { replace: true });
            } else {
                navigate("/parent", { replace: true });
            }
        } catch (err) {
            setError(err?.data?.message || "Invalid phone or PIN");
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-100 p-4">
            <Card className="w-full max-w-md shadow-xl border-0">
                <CardHeader className="space-y-1">
                    <div className="flex justify-center mb-4">
                        <div className="h-16 w-16 bg-emerald-100 rounded-full flex items-center justify-center">
                            <span className="text-3xl">👪</span>
                        </div>
                    </div>
                    <CardTitle className="text-center text-2xl font-bold text-gray-800">
                        Parent Portal
                    </CardTitle>
                    <p className="text-center text-sm text-gray-500">
                        Sign in with your phone number and PIN
                    </p>
                </CardHeader>

                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Phone */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">
                                Phone Number
                            </label>
                            <div className="relative">
                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <Input
                                    name="phone"
                                    type="tel"
                                    placeholder="01XXXXXXXXX"
                                    value={form.phone}
                                    onChange={handleChange}
                                    autoComplete="tel"
                                    required
                                    className="h-11 pl-10"
                                />
                            </div>
                        </div>

                        {/* PIN */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">
                                PIN
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <Input
                                    name="pin"
                                    type={showPin ? "text" : "password"}
                                    inputMode="numeric"
                                    pattern="\d*"
                                    maxLength={6}
                                    placeholder="Enter your 4–6 digit PIN"
                                    value={form.pin}
                                    onChange={handleChange}
                                    required
                                    className="h-11 pl-10 pr-16"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPin((v) => !v)}
                                    className="absolute inset-y-0 right-0 px-3 flex items-center text-sm text-gray-500"
                                >
                                    {showPin ? "Hide" : "Show"}
                                </button>
                            </div>
                            <p className="text-xs text-gray-500">
                                If you don't have a PIN yet, contact the school office —
                                they will give you a temporary one.
                            </p>
                        </div>

                        {error && (
                            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
                                {error}
                            </div>
                        )}

                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="w-full h-11 text-base bg-emerald-600 hover:bg-emerald-700"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Signing in…
                                </>
                            ) : (
                                "Sign In"
                            )}
                        </Button>

                        <div className="text-center text-sm text-gray-500 pt-2">
                            Staff or student?{" "}
                            <Link to="/login" className="text-primary font-medium hover:underline">
                                Use the main login
                            </Link>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}