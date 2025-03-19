"use client";

import { Eye, EyeOff, User } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

const page = () => {
  const [passwordStrength, setPasswordStrength] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [data, setData] = useState({
    email: "",
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

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("data login", data);
  }

  return (
    <div className="flex justify-center items-center mt-20 w-full">
      <form className="flex flex-col gap-5 items-center justify-center p-6 bg-teal-50 border-2 border-cyan-200 rounded-2xl shadow-lg w-full max-w-md" onSubmit={handleSubmit}>
        <div className="w-20 h-20 flex items-center justify-center rounded-full bg-emerald-400 border-2 border-emerald-700 hover:bg-emerald-500 transition cursor-pointer">
          <span>
            <User className="w-10 h-10 text-green-900" />
          </span>
        </div>
        <div className="flex flex-col gap-5 w-full">
          <input
            className="w-full p-2 border-2 border-emerald-400 ring-emerald-300 hover:bg-emerald-200 focus:border-none rounded-lg outline-none focus:outline-none focus:ring-2 focus:ring-emerald-600 transition text-right focus:bg-emerald-200 cursor-pointer"
            type="email"
            placeholder="ایمیل"
            name="email"
            value={data.email}
            onChange={handleData}
          />
          <div className="relative w-full">
            <input
              className="w-full p-2 border-2 border-emerald-400 ring-emerald-300 hover:bg-emerald-200 focus:border-none rounded-lg outline-none focus:outline-none focus:ring-2 focus:ring-emerald-600 transition text-right focus:bg-emerald-200 cursor-pointer"
              type={showPassword ? "text" : "password"}
              placeholder="پسورد"
              name="password"
              value={data.password}
              onChange={handlePasswordInput}
            />
            <span
              onClick={() => setShowPassword(!showPassword)}
              className="absolute top-1/5 left-5 cursor-pointer"
            >
              {showPassword ? <Eye /> : <EyeOff />}
            </span>
          </div>
        </div>
        <div className="flex gap-1 mb-3">
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
          className={`w-full p-2 text-white rounded-lg transition ${
            handlePasswordStrength() > 2
              ? "bg-emerald-500 hover:bg-emerald-600 cursor-pointer"
              : "bg-gray-400 cursor-not-allowed"
          }`}
          disabled={handlePasswordStrength() <= 2}
        >
          ورود
        </button>
        <div className="flex justify-between w-full mt-10 text-sm">
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
