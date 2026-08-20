import { Outlet } from "react-router-dom";
import PublicHeader from "./PublicHeader";
import PublicFooter from "./PublicFooter";

const PublicLayout = () => {
  return (
    <div className="">
      <PublicHeader />
      <main>
        <Outlet />
      </main>
      <PublicFooter />
    </div>
  );
};

export default PublicLayout;