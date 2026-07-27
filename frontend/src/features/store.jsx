
import { combineReducers, configureStore } from "@reduxjs/toolkit";
import { useRef } from "react";
import { Provider, useDispatch, useSelector } from "react-redux";

import { setupListeners } from "@reduxjs/toolkit/query";
import globalReducer from "./globalReducer";
import authReducer from "./slices/authSlice";
import userReducer from "./slices/user";

import {
  FLUSH,
  PAUSE,
  PERSIST,
  persistReducer,
  persistStore,
  PURGE,
  REGISTER,
  REHYDRATE,
} from "redux-persist";
import { PersistGate } from "redux-persist/integration/react";
import createWebStorage from "redux-persist/lib/storage/createWebStorage";
import { api } from "./apis/api";

const rtkQueryLogger = (store) => (next) => (action) => {
  if (action.type === "api/internalSubscriptions/subscriptionsUpdated") {
    const updates = action.payload || [];
    updates.forEach((update) => {
      const value = update.value;
      if (value) {
        Object.entries(value).forEach(([queryKey, queryData]) => {
          console.log("📌 Query:", queryKey);
          console.log("📊 Data:", queryData);
        });
      }
    });
  }
  return next(action);
};


/* REDUX PERSISTENCE */
const createNoopStorage = () => {
  return {
    getItem(_key) {
      return Promise.resolve(null);
    },
    setItem(_key, value) {
      return Promise.resolve(value);
    },
    removeItem(_key) {
      return Promise.resolve();
    },
  };
};

const storage =
  typeof window === "undefined"
    ? createNoopStorage()
    : createWebStorage("local");

const persistConfig = {
  key: "root",
  storage,
  whitelist: ["global"],
};

const rootReducer = combineReducers({
  global: globalReducer,
  user: authReducer,
  activeUser: userReducer,
  [api.reducerPath]: api.reducer,
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

/* REDUX STORE */
export const makeStore = () => {
  return configureStore({
    reducer: persistedReducer,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: {
          ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
        },
      }).concat(api.middleware),
      // }).concat(api.middleware, rtkQueryLogger),
    devTools: true,
  });
};

/* REDUX HOOKS */
export const useAppDispatch = () => useDispatch();
export const useAppSelector = useSelector;

/* PROVIDER COMPONENT */
export default function ReduxStoreProvider({ children }) {

  const storeRef = useRef();
  if (!storeRef.current) {
    storeRef.current = makeStore();
    setupListeners(storeRef.current.dispatch);
  }
  const persistor = persistStore(storeRef.current);

  return (
    <Provider store={storeRef.current}>
      <PersistGate loading={null} persistor={persistor}>
        {/* for loading signin user */}
        {/* <AuthHydrator /> */}
        {children}
      </PersistGate>
    </Provider>
  );
}
