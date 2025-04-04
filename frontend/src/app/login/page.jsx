"use client";

import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import axios from "axios";
import backApis from "@/common/inedx";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";

const page = () => {
  const router = useRouter();
  const [passwordStrength, setPasswordStrength] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [data, setData] = useState({
    phoneOrEmail: "",
    password: "",
  });

  const handlePasswordStrength = () => {
    let strength = 0;
    if (passwordStrength.length >= 6) strength++;
    if (/[A-Z]/.test(passwordStrength)) strength++;
    if (/[a-z]/.test(passwordStrength)) strength++;
    if (/[0-9]/.test(passwordStrength)) strength++;
    if (/[^A-Za-z0-9]/.test(passwordStrength)) strength++;
    return strength;
  };

  const handleData = (e) => {
    const { name, value } = e.target;
    setData((prve) => {
      return {
        ...prve,
        [name]: value,
      };
    });
  };

  const handlePasswordInput = (e) => {
    setPasswordStrength(e.target.value);
    handleData(e);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("data login", data);
    console.log("submit fired2");
    try {
      console.log("submit fired1");
      const response = await axios.post(
        "http://localhost:8080/api/login",
        data,
        {
          withCredentials: true,
        }
      );
      console.log("response login", response);
      toast.success("ورود با موفقیت انجام شد");
      setTimeout(() => {
        router.push("/");
      }, 1000);
    } catch (error) {
      const errorMsg =
        error.response?.data?.message || "مشکلی در ورود به وجود آمد";
      toast.error(errorMsg);
    }
  };
  return (
    <div className="flex justify-center items-center mt-20 w-full px-4 sm:px-6 lg:px-8">
      <form
        className="flex flex-col gap-5 items-center justify-center p-6 bg-teal-50 border-2 border-cyan-200 rounded-2xl shadow-lg w-full max-w-md"
        onSubmit={handleSubmit}
      >
        <div className="flex flex-col gap-5 w-full">
          <input
            className="w-full p-3 border-2 border-emerald-400 ring-emerald-300 hover:bg-emerald-200 focus:border-none rounded-lg outline-none focus:outline-none focus:ring-2 focus:ring-emerald-600 transition text-right focus:bg-emerald-200 cursor-pointer text-sm sm:text-base"
            type="text"
            placeholder="شماره موبایل یا ایمیل خود را وارد کنید"
            name="phoneOrEmail"
            onChange={handleData}
          />
          <div className="relative w-full">
            <input
              className="w-full p-3 border-2 border-emerald-400 ring-emerald-300 hover:bg-emerald-200 focus:border-none rounded-lg outline-none focus:outline-none focus:ring-2 focus:ring-emerald-600 transition text-right focus:bg-emerald-200 cursor-pointer text-sm sm:text-base"
              type={showPassword ? "text" : "password"}
              placeholder="پسورد"
              name="password"
              onChange={handlePasswordInput}
            />
            <span
              onClick={() => setShowPassword(!showPassword)}
              className="absolute top-1/2 -translate-y-1/2 left-4 cursor-pointer text-gray-600"
            >
              {showPassword ? <Eye /> : <EyeOff />}
            </span>
          </div>
        </div>
        <div className="flex gap-1 mb-3 w-full justify-center">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className={`w-6 h-2 rounded bg-gray-300 ${
                i < handlePasswordStrength() ? "bg-green-500" : ""
              }`}
            ></div>
          ))}
        </div>
        <button
          className={`w-full p-3 text-white rounded-lg transition text-sm sm:text-base ${
            handlePasswordStrength() > 2
              ? "bg-emerald-500 hover:bg-emerald-600 cursor-pointer"
              : "bg-gray-400 cursor-not-allowed"
          }`}
          disabled={handlePasswordStrength() <= 2}
          type="submit"
        >
          ورود
        </button>
        <div className="flex flex-col sm:flex-row justify-between items-center gap-2 sm:gap-0 w-full mt-10 text-sm">
          <Link
            href="/forgot-password"
            className="text-blue-500 hover:text-blue-600 transition"
          >
            فراموشی رمز عبور؟
          </Link>
          <Link
            href="/register"
            className="text-blue-500 hover:text-blue-600 transition"
          >
            ثبت نام
          </Link>
        </div>
      </form>
    </div>
  );
};
export default page;
