import { useAppSelector } from "@/features/store";
import { Navigate, useNavigate } from "react-router-dom";

const AdminProtectedRoute = ({ children }) => {
  const { user, isHydrated } = useAppSelector((state) => state.user);

  const role = user?.role?.name || "";

  if (!isHydrated) return <div>Loading...</div>; // wait for Redux to sync
  return role === "admin" ? children
    : role === "teacher" ? <Navigate to="/teacher" replace />
      : role == "parent" ? <Navigate to="/parent" replace />
        : role === "student" ? <Navigate to="/student" replace />
          : <Navigate to="/login" replace />;
};

export default AdminProtectedRoute;