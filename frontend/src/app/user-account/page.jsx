"use client";
import { useContext, useEffect } from "react";
import { UserContext } from "@/context/UserContext";
import { notFound, useRouter } from "next/navigation";
import { toast } from "react-toastify";

const Page = () => {
  const { user } = useContext(UserContext);
  const router = useRouter();

  useEffect(() => {
    if (user === null) return;

    if (!user) {
      toast.error("ابتدا وارد حساب کاربری شوید");
      router.push("/login");
    } else if (user.role !== "user") {
      notFound();
    }
  }, [user]);

  if (!user || user.role !== "user") return null;

  return (
    <div>
      <span>پنل کاربری</span>
    </div>
  );
};

export default Page;
