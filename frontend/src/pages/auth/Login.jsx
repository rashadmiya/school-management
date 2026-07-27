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

  const isStudentLogin = !formData.identifier.includes("@"); // No @? → Student

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      if (isStudentLogin) {
        let studentLoginRes = await loginStudent({ rollNumber: formData.identifier, password: formData.password }).unwrap();
        if (studentLoginRes.success) {
          navigate("/student");
        }

      } else {
        const userLoginRes = await loginUser({ email: formData.identifier, password: formData.password }).unwrap();
        // console.log("userLoginRes :", userLoginRes.user.role.name)
        if (userLoginRes.success) {
          if (userLoginRes.user.role.name === 'admin')
            navigate("/admin/dashboard");
        }
        if (userLoginRes.user.role.name === "parent") {
          navigate("/parent");
        }
        if (userLoginRes.user.role.name === "teacher") {
          navigate("/teacher");
        }
      }

    } catch (err) {
      setError(err?.data?.message || "Invalid credentials");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md shadow-md">
        <CardHeader>
          <CardTitle className="text-center text-2xl font-semibold">Login</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">

            <Input
              name="identifier"
              placeholder="Email or Roll Number"
              value={formData.identifier}
              onChange={handleChange}
              required
            />

            <Input
              type="password"
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              required
            />

            {error && <p className="text-sm text-red-500">{error}</p>}

            <Button className="w-full" type="submit" disabled={loadingUser || loadingStudent}>
              {loadingUser || loadingStudent ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Logging in...
                </>
              ) : (
                "Login"
              )}
            </Button>

          </form>
        </CardContent>
      </Card>
    </div>
  );
}

// import { useState } from "react";
// import { useDispatch } from "react-redux";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
// import { Loader2 } from "lucide-react";
// import { useNavigate } from "react-router-dom";
// import { useLoginMutation } from "@/features/apis/authApi";

// export default function Login() {
//   const [formData, setFormData] = useState({ email: "", password: "" });
//   const [login, { isLoading }] = useLoginMutation();
//   const dispatch = useDispatch();
//   const navigate = useNavigate();
//   const [error, setError] = useState("");

//   const handleChange = (e) => {
//     setFormData({ ...formData, [e.target.name]: e.target.value });
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setError("");

//     try {
//       const res = await login(formData).unwrap();
//       // dispatch(setCredentials(res));
//       navigate("/dashboard");
//     } catch (err) {
//       setError(err?.data?.message || "Invalid credentials");
//     }
//   };

//   return (
//     <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
//       <Card className="w-full max-w-md shadow-md">
//         <CardHeader>
//           <CardTitle className="text-center text-2xl font-semibold">Login</CardTitle>
//         </CardHeader>
//         <CardContent>
//           <form onSubmit={handleSubmit} className="space-y-4">
//             <Input
//               type="email"
//               name="email"
//               placeholder="Email"
//               value={formData.email}
//               onChange={handleChange}
//               required
//             />
//             <Input
//               type="password"
//               name="password"
//               placeholder="Password"
//               value={formData.password}
//               onChange={handleChange}
//               required
//             />
//             {error && <p className="text-sm text-red-500">{error}</p>}
//             <Button className="w-full" type="submit" disabled={isLoading}>
//               {isLoading ? (
//                 <>
//                   <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Logging in...
//                 </>
//               ) : (
//                 "Login"
//               )}
//             </Button>
//             <p className="text-center text-sm text-gray-600">
//               Don’t have an account?{" "}
//               <span
//                 onClick={() => navigate("/signup")}
//                 className="text-blue-600 cursor-pointer hover:underline"
//               >
//                 Register
//               </span>
//             </p>
//           </form>
//         </CardContent>
//       </Card>
//     </div>
//   );
// }
