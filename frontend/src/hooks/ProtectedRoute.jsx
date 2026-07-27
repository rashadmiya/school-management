// // hooks/ProtectedRoute.jsx
// import { useAppSelector } from "@/features/store";
// import { Navigate } from "react-router-dom";

// const ProtectedRoute = ({ children, requiredRole }) => {
//   const { token, user } = useAppSelector((state) => state.user);

//   if (!token) {
//     return <Navigate to="/login" replace />;
//   }

//   // If specific role is required, check if user has it
//   if (requiredRole) {
//     const userRole = user?.role?.name || user?.role;
//     if (userRole !== requiredRole) {
//       return <Navigate to="/dashboard" replace />;
//     }
//   }

//   return children;
// };

// export default ProtectedRoute;


import { useAppSelector } from "@/features/store";
import { Navigate, useNavigate } from "react-router-dom";


const ProtectedRoute = ({ children }) => {
  const navigate = useNavigate();
  const { token, user, isHydrated } = useAppSelector((state) => state.user);

  // if (user.role.name === 'teacher') {
  //   navigate('/teacher');
  // }

  if (!isHydrated) return <div>Loading...</div>; // wait for Redux to sync
  return token ? children : <Navigate to="/login" replace />;
};

export default ProtectedRoute;