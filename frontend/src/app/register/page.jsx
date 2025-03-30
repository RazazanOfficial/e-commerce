"use client";

//? -=-=- Import Librarys -=-=- //
import axios from "axios";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import "react-toastify/dist/ReactToastify.css";
import { Eye, EyeOff, User } from "lucide-react";
import { ToastContainer, toast } from "react-toastify";
//? -=-=- Import Files -=-=- //
import backApis from "@/common/inedx";
import imgToBase64 from "@/helpers/imgToBase64";

const page = () => {
  const router = useRouter();
  //! -=-=- State management -=-=- !//
  const [passwordStrength, setPasswordStrength] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [data, setData] = useState({
    name: "",
    phone: "",
    email: "",
    password: "",
    // confirmPassword: "",
    profile: "",
  });

  //! -=-=- Regex States -=-=- !//
  const [textRegex, setTextRegex] = useState({
    name: "",
    phone: "",
    email: "",
  });

  //! -=-=- Handels management -=-=- !//

  //! -=-=- Function to determine password strength -=-=- !//
  const handlePasswordStrength = () => {
    let strength = 0;
    if (passwordStrength.length >= 6) strength++;
    if (/[A-Z]/.test(passwordStrength)) strength++;
    if (/[a-z]/.test(passwordStrength)) strength++;
    if (/[0-9]/.test(passwordStrength)) strength++;
    if (/[^A-Za-z0-9]/.test(passwordStrength)) strength++;
    return strength;
  };

  //! -=-=- Function to handle input changes -=-=- !//
  const handleData = (e) => {
    const { name, value } = e.target;

    const namePattern = /^[A-Za-zآ-ی]+(?:\s[A-Za-zآ-ی]+){1,}$/;
    const phonePattern = /^09\d{9}$/;
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    setTextRegex((prev) => ({
      ...prev,
      [name]:
        name === "name"
          ? namePattern.test(value)
            ? "نام و نام خانوادگی معتبر است"
            : "نام و نام خانوادگی نامعتبر است"
          : name === "phone"
          ? phonePattern.test(value)
            ? "شماره موبایل معتبر است"
            : "شماره موبایل نامعتبر است"
          : name === "email"
          ? emailPattern.test(value)
            ? "ایمیل معتبر است"
            : "ایمیل نامعتبر است"
          : prev[name],
    }));

    setData((prev) => {
      return {
        ...prev,
        [name]: value,
      };
    });
  };

  //! -=-=- Function to handle password input separately -=-=- !//
  const handlePasswordInput = (e) => {
    setPasswordStrength(e.target.value);
    handleData(e);
  };

  //! -=-=- Function to handle profile picture upload -=-=- !//
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
  //! -=-=- Form submission handler -=-=- !//
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (
      !data.email ||
      !data.password ||
      !data.name ||
      !data.confirmPassword ||
      !data.phone
    ) {
      toast.error("لطفا تمامی فیلد ها را پر کنید");
      console.log("Please fill all fields");
      return;
    }
    if (data.password !== data.confirmPassword) {
      toast.error("پسورد و تایید پسورد یکسان نیستند");
      console.log("Password and confirm password are not the same");
      return;
    }

    try {
      const response = await axios.post(backApis.register.url, data, {
        headers: { "Content-Type": "application/json" },
      });
      toast.success("ثبت نام با موفقیت انجام شد");
      console.log("Data login: ", response);
      setTimeout(() => {
        router.push("/login");
      }, 1000);
    } catch (error) {
      const errorMsg =
        error.response?.data?.message || "مشکلی در ثبت‌ نام به وجود آمد";
      console.error("Register Error", error);
      toast.error(errorMsg);
    }
  };

  return (
    <div className="flex justify-center items-center mt-20 w-full px-4 sm:px-6 md:px-8 lg:px-10">
      <form
        className="flex flex-col gap-2 items-center justify-center p-6 bg-teal-50 border-2 border-cyan-200 rounded-2xl shadow-lg w-full max-w-md"
        onSubmit={handleSubmit}
      >
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

        <div className="flex flex-col gap-5 w-full">
          <div>
            <input
              type="text"
              placeholder="نام و نام خانوادگی"
              name="name"
              value={data.name}
              onChange={handleData}
              className="w-full p-2 border-2 border-emerald-400 ring-emerald-300 hover:bg-emerald-200 focus:ring-2 focus:ring-emerald-600 rounded-lg outline-none transition text-right"
            />
            <span
              className={`text-sm pr-3 ${
                textRegex.name.includes("نامعتبر")
                  ? "text-red-400"
                  : "text-green-700"
              }`}
            >
              {textRegex.name}
            </span>
          </div>

          <div>
            <input
              className="w-full p-2 border-2 border-emerald-400 ring-emerald-300 hover:bg-emerald-200 focus:ring-2 focus:ring-emerald-600 rounded-lg outline-none transition text-right"
              type="phone"
              placeholder="شماره موبایل"
              name="phone"
              value={data.phone}
              onChange={handleData}
            />
            <span
              className={`text-sm pr-3 ${
                textRegex.phone.includes("نامعتبر")
                  ? "text-red-400"
                  : "text-green-700"
              }`}
            >
              {textRegex.phone}
            </span>
          </div>

          <div>
            <input
              className="w-full p-2 border-2 border-emerald-400 ring-emerald-300 hover:bg-emerald-200 focus:ring-2 focus:ring-emerald-600 rounded-lg outline-none transition text-right"
              type="email"
              placeholder="ایمیل"
              name="email"
              value={data.email}
              onChange={handleData}
            />
            <span
              className={`text-sm pr-3 ${
                textRegex.email.includes("نامعتبر")
                  ? "text-red-400"
                  : "text-green-700"
              }`}
            >
              {textRegex.email}
            </span>
          </div>

          <div>
            <div className="relative w-full">
              <input
                className="w-full p-2 border-2 border-emerald-400 ring-emerald-300 hover:bg-emerald-200 focus:ring-2 focus:ring-emerald-600 rounded-lg outline-none transition text-right"
                type={showPassword ? "text" : "password"}
                placeholder="پسورد"
                name="password"
                value={data.password}
                onChange={handlePasswordInput}
              />
              <span
                onClick={() => setShowPassword(!showPassword)}
                className="absolute top-1/2 left-5 cursor-pointer transform -translate-y-1/2"
              >
                {showPassword ? <Eye /> : <EyeOff />}
              </span>
            </div>
          </div>

          <div>
            <div className="relative w-full">
              <input
                className="w-full p-2 border-2 border-emerald-400 ring-emerald-300 hover:bg-emerald-200 focus:ring-2 focus:ring-emerald-600 rounded-lg outline-none transition text-right"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="تایید پسورد"
                name="confirmPassword"
                value={data.confirmPassword}
                onChange={handleData}
              />
              <span
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute top-1/2 left-5 cursor-pointer transform -translate-y-1/2"
              >
                {showConfirmPassword ? <Eye /> : <EyeOff />}
              </span>
            </div>
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
