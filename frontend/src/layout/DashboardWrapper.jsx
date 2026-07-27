import DashboardLayout from "./DashboardLayout";
import StoreProvider from "./StoreProvider";
import ToastProvider from "./ToastProvider";

const DashboardWrapper = ({ children }) => {
    return (
        <StoreProvider>
            <ToastProvider>
                <DashboardLayout>{children}</DashboardLayout>
            </ToastProvider>
        </StoreProvider>
    );
};

export default DashboardWrapper;