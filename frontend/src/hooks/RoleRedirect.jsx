// components/RoleRedirect.jsx
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAppSelector } from "@/features/store";

const RoleRedirect = () => {
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.user);

  useEffect(() => {
    const userRole = user?.role?.name || user?.role;
    
    switch (userRole) {
      case "teacher":
        navigate("/teacher");
        break;
      case "student":
        navigate("/student");
        break;
      case "parent":
        navigate("/parent");
        break;
      default:
        navigate("/dashboard");
        break;
    }
  }, [user, navigate]);

  return <div>Redirecting...</div>;
};

export default RoleRedirect;