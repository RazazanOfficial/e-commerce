"use client";
import { UserContext } from "@/context/UserContext";
import { notFound, useRouter } from "next/navigation";
import { useContext, useEffect } from "react";

const page = () => {
  const { user } = useContext(UserContext);
  const router = useRouter();

  useEffect(() => {
    if (user === null) return;

    if (!user) {
      router.push("/login");
    } else if (user.role !== "admin") {
      notFound();
    }
  }, [user]);

  if (!user || user.role !== "admin") return null;

  return (
    <div>
      <span>پنل مدیریت</span>
    </div>
  );
};

export default page;
