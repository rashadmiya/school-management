import { createContext, useContext, useState } from "react";

const GlobalStateContext = createContext();

const ContextStoreProvider = ({ children }) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [user, setUser] = useState(null);
  const [logedInUser, setLogedInUser] = useState(null);
//   const [isLoading, setIsLoading] = useState(true);
  const [isSticky, setIsSticky] = useState(false);
  const [headerType, setHeaderType] = useState("sticky");
  
  return (
    <GlobalStateContext.Provider
      value={{
        isSidebarCollapsed,
        setIsSidebarCollapsed,
        isDarkMode,
        setIsDarkMode,
        isSticky,
        setIsSticky,
        user,
        setUser,
        logedInUser,
        setLogedInUser,
        // isLoading,
        headerType,
        setHeaderType,
      }}
    >
      {children}
    </GlobalStateContext.Provider>
  );
};

export default ContextStoreProvider;
export const useGlobalState = () => useContext(GlobalStateContext);