"use client";
import { createContext, useState, useEffect } from "react";
import axios from "axios";
import backApis from "@/common/inedx";

export const UserContext = createContext(null);

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  const fetchUserDetails = async () => {
    try {
      const response = await axios.get(backApis.getUserInfo.url, {
        withCredentials: true,
      });
      if (response.data.success) {
        setUser(response.data.data);
      } else {
        console.log("Error fetching user details:", response.data.message);
      }
    } catch (err) {
      console.error("Request failed:", err);
    }
  };

  useEffect(() => {
    fetchUserDetails();
  }, []);

  return (
    <UserContext.Provider value={{ user, fetchUserDetails }}>
      {children}
    </UserContext.Provider>
  );
};
