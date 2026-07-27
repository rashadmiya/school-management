import { useEffect } from "react";
import { useAppDispatch } from "./store";
import { userLoggedIn, userLoggedOut } from "./slices/authSlice";
import { decodeJWT } from "@/utils/jwt";

const AuthHydrator = () => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    const stored = localStorage.getItem("auth");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        const decoded = decodeJWT(parsed.token);
        const expiry = decoded?.exp * 1000;
        const now = Date.now();

        // Check if token exists and is valid
        if (parsed?.token && expiry > now) {
          dispatch(userLoggedIn({
            token: parsed.token,
            user: parsed.user,       // This will now exist
            role: parsed.role,       // This will now exist
            profile: parsed.profile, // ✅ Include profile
            isStudent: parsed.isStudent,
          }));

          setTimeout(() => {
            dispatch(userLoggedOut());
          }, expiry - now);
          return;
        }
      } catch (err) {
        console.error("Auth parse error:", err);
      }
    }
    dispatch(userLoggedOut());
  }, []);

  return null;
};
export default AuthHydrator;
// import { useEffect } from "react";
// import { useAppDispatch } from "./store";
// import { userLoggedIn, userLoggedOut } from "./slices/authSlice";
// import { decodeJWT } from "@/utils/jwt";

// const AuthHydrator = () => {
//   const dispatch = useAppDispatch();

//   useEffect(() => {
//     const stored = localStorage.getItem("auth");
//     // console.log("stored cred :", stored)
//     if (stored) {
//       try {
//         const parsed = JSON.parse(stored);
//         const decoded = decodeJWT(parsed.token);
//         const expiry = decoded?.exp * 1000;
//         const now = Date.now();

//         if (parsed?.token && parsed?.user && expiry > now) {
//           dispatch(userLoggedIn(parsed));
//           setTimeout(() => {
//             dispatch(userLoggedOut());
//           }, expiry - now);
//           return;
//         }
//       } catch (err) {
//         console.error("Auth parse error:", err);
//       }
//     }
//     dispatch(userLoggedOut());
//   }, []);

//   return null;
// };

// export default AuthHydrator;

