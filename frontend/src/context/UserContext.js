"use client";
import { createContext, useCallback, useEffect, useState } from "react";
import apiClient from "@/common/apiClient";
import backApis from "@/common";
import { useDispatch } from "react-redux";
import { clearUser, setAuthResolved, setUserDetails } from "@/redux/userSlice";

export const UserContext = createContext(null);

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthResolved, setIsAuthResolved] = useState(false);
  const dispatch = useDispatch();

  const resolveUser = useCallback(
    (nextUser) => {
      setUser(nextUser || null);
      setIsAuthResolved(true);
      if (nextUser) dispatch(setUserDetails(nextUser));
      else dispatch(clearUser());
    },
    [dispatch]
  );

  const fetchUserDetails = useCallback(async ({ silent = true } = {}) => {
    try {
      dispatch(setAuthResolved(false));
      const response = await apiClient.get(backApis.getUserInfo.url);
      if (response.data?.success && response.data?.data) {
        resolveUser(response.data.data);
        return response.data.data;
      }
      resolveUser(null);
      return null;
    } catch (err) {
      resolveUser(null);
      if (!silent && err?.response?.status !== 401) {
        console.error("Request failed:", err);
      }
      return null;
    }
  }, [dispatch, resolveUser]);

  const logout = useCallback(async () => {
    try {
      await apiClient({ url: backApis.logOut.url, method: backApis.logOut.method });
    } catch (err) {
      if (err?.response?.status !== 401) console.error("Logout failed:", err);
    } finally {
      resolveUser(null);
    }
  }, [resolveUser]);

  useEffect(() => {
    fetchUserDetails({ silent: true });
  }, [fetchUserDetails]);

  return (
    <UserContext.Provider value={{ user, isAuthResolved, fetchUserDetails, logout }}>
      {children}
    </UserContext.Provider>
  );
};
