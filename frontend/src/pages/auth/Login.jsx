import { useState } from "react";
import { useDispatch } from "react-redux";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useLoginMutation } from "@/features/apis/authApi";
import { useLoginStudentMutation } from "@/features/apis/studentsApi";

export default function Login() {
  const [formData, setFormData] = useState({ identifier: "", password: "" });
  const [loginUser, { isLoading: loadingUser }] = useLoginMutation();
  const [loginStudent, { isLoading: loadingStudent }] = useLoginStudentMutation();
  const navigate = useNavigate();
  const [error, setError] = useState("");

  const isStudentLogin = !formData.identifier.includes("@");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      if (isStudentLogin) {
        let studentLoginRes = await loginStudent({ 
          rollNumber: formData.identifier, 
          password: formData.password 
        }).unwrap();
        
        if (studentLoginRes.success) {
          navigate("/student");
        }
      } else {
        const userLoginRes = await loginUser({ 
          email: formData.identifier, 
          password: formData.password 
        }).unwrap();
        
        console.log("userLoginRes :", userLoginRes);

        if (userLoginRes.success) {
          // Check if user and role exist before accessing
          if (userLoginRes.user && userLoginRes.user.role) {
            console.log("userLoginRes.user.role.name :", userLoginRes.user.role.name);
            
            switch(userLoginRes.user.role.name) {
              case 'admin':
                navigate("/admin/dashboard");
                break;
              case 'parent':
                navigate("/parent");
                break;
              case 'teacher':
                navigate("/teacher");
                break;
              default:
                setError("Invalid user role");
            }
          } else {
            setError("User role not found");
          }
        }
      }
    } catch (err) {
      console.log("Login error:", err);
      setError(err?.data?.message || "Invalid credentials");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md shadow-xl border-0">
        <CardHeader className="space-y-1">
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center">
              <span className="text-3xl">🏫</span>
            </div>
          </div>
          <CardTitle className="text-center text-2xl font-bold text-gray-800">
            Welcome Back
          </CardTitle>
          <p className="text-center text-sm text-gray-500">
            Sign in to your account
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Email or Roll Number</label>
              <Input
                name="identifier"
                placeholder="Enter email or roll number"
                value={formData.identifier}
                onChange={handleChange}
                required
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <label className="text-sm font-medium text-gray-700">Password</label>
                <a href="#" className="text-sm text-primary hover:underline">
                  Forgot password?
                </a>
              </div>
              <Input
                type="password"
                name="password"
                placeholder="Enter password"
                value={formData.password}
                onChange={handleChange}
                required
                className="h-11"
              />
            </div>

            {error && (
              <div className="bg-red-50 text-red-500 p-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <Button 
              className="w-full h-11 text-base" 
              type="submit" 
              disabled={loadingUser || loadingStudent}
            >
              {loadingUser || loadingStudent ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
                  Logging in...
                </>
              ) : (
                "Sign In"
              )}
            </Button>

            <div className="text-center text-sm text-gray-500 mt-4">
              Don't have an account?{" "}
              <a href="#" className="text-primary font-medium hover:underline">
                Sign up
              </a>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}