"use client";

import imgToBase64 from "@/helpers/imgToBase64";
import { Eye, EyeOff, User } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const page = () => {
  // State management
  const [passwordStrength, setPasswordStrength] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [data, setData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    profile: "",
  });

  // Function to determine password strength
  const handlePasswordStrength = () => {
    let strength = 0;
    if (passwordStrength.length >= 6) strength++;
    if (/[A-Z]/.test(passwordStrength)) strength++;
    if (/[a-z]/.test(passwordStrength)) strength++;
    if (/[0-9]/.test(passwordStrength)) strength++;
    if (/[^A-Za-z0-9]/.test(passwordStrength)) strength++;
    return strength;
  };

  // Function to handle input changes
  const handleData = (e) => {
    const { name, value } = e.target;
    setData((prev) => {
      return {
        ...prev,
        [name]: value,
      };
    });
  };

  // Function to handle password input separately
  const handlePasswordInput = (e) => {
    setPasswordStrength(e.target.value);
    handleData(e);
  };

  // Function to handle profile picture upload
  const handleUploadProfile = async (e) => {
    const file = e.target.files[0];
    const imgData = await imgToBase64(file);
    setData((prev) => {
      return {
        ...prev,
        profile: imgData,
      };
    });
  };
  // Form submission handler
  const handleSubmit = (e) => {
    e.preventDefault();
    if (data.password !== data.confirmPassword) {
      toast.error("پسورد و تایید پسورد یکسان نیستند");
      console.log("password and confirm password are not the same");
      return;
    }
    if (
      data.email === "" ||
      data.password === "" ||
      data.name === "" ||
      data.confirmPassword === ""
    ) {
      toast.error("لطفا تمامی فیلد ها را پر کنید");
      console.log("please fill all fields");
      return;
    }
    toast.success("ثبت نام با موفقیت انجام شد");
    console.log("data login", data);
  };

  return (
    <div className="flex justify-center items-center mt-20 w-full">
      <form
        className="flex flex-col gap-5 items-center justify-center p-6 bg-teal-50 border-2 border-cyan-200 rounded-2xl shadow-lg w-full max-w-md"
        onSubmit={handleSubmit}
      >
        {/* User Icon */}
        <div className="relative w-20 h-20 cursor-pointer">
          <label className="w-full h-full flex flex-col items-center justify-center rounded-full bg-emerald-400 border-2 border-emerald-700 hover:bg-emerald-500 transition relative overflow-hidden">
            {data.profile ? (
              <img
                src={data.profile}
                alt="Profile"
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <User className="w-10 h-10 text-green-900" />
            )}
            <span className="absolute bottom-0 w-full pb-[10px] pt-1 bg-slate-700 opacity-85 text-white text-sm text-center">
              آپلود عکس
            </span>
            <input
              type="file"
              accept="image/*"
              className="absolute inset-0 opacity-0 cursor-pointer"
              onChange={handleUploadProfile}
            />
          </label>
        </div>

        {/* Input Fields */}
        <div className="flex flex-col gap-5 w-full">
          {/* Name Input */}
          <input
            type="text"
            placeholder="نام و نام خانوادگی"
            name="name"
            value={data.name}
            onChange={handleData}
            className="w-full p-2 border-2 border-emerald-400 ring-emerald-300 hover:bg-emerald-200 focus:border-none rounded-lg outline-none focus:outline-none focus:ring-2 focus:ring-emerald-600 transition text-right focus:bg-emerald-200 cursor-pointer"
          />

          {/* Email Input */}
          <input
            className="w-full p-2 border-2 border-emerald-400 ring-emerald-300 hover:bg-emerald-200 focus:border-none rounded-lg outline-none focus:outline-none focus:ring-2 focus:ring-emerald-600 transition text-right focus:bg-emerald-200 cursor-pointer"
            type="email"
            placeholder="ایمیل"
            name="email"
            value={data.email}
            onChange={handleData}
          />

          {/* Password Input */}
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

          {/* Confirm Password Input */}
          <div className="relative w-full">
            <input
              className="w-full p-2 border-2 border-emerald-400 ring-emerald-300 hover:bg-emerald-200 focus:border-none rounded-lg outline-none focus:outline-none focus:ring-2 focus:ring-emerald-600 transition text-right focus:bg-emerald-200 cursor-pointer"
              type={showConfirmPassword ? "text" : "password"}
              placeholder="تایید پسورد"
              name="confirmPassword"
              value={data.confirmPassword}
              onChange={handleData}
            />
            <span
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute top-1/5 left-5 cursor-pointer"
            >
              {showConfirmPassword ? <Eye /> : <EyeOff />}
            </span>
          </div>
        </div>

        {/* Password Strength Indicator */}
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

        {/* Submit Button */}
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

        {/* Links */}
        <div className="flex justify-between w-full mt-10 text-sm">
          <Link
            href="/forgot-password"
            className="text-blue-500 hover:text-blue-600 transition"
          >
            فراموشی رمز عبور؟
          </Link>
          <Link
            href="/login"
            className="text-blue-500 hover:text-blue-600 transition"
          >
            ورود
          </Link>
        </div>
      </form>
      <ToastContainer />
    </div>
  );
};
export default page;
