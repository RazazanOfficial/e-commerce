"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Logo from "@/assets/images/Logo.png";
import { StarsIcon } from "lucide-react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import backApis from "@/common/inedx";
import { InputField } from "@/components/ui/Inputs";
import { Btn1 } from "@/components/ui/Buttons";
import Cookies from "js-cookie";
import Link from "next/link";

const AuthPage = () => {
  const router = useRouter();

  const [mode, setMode] = useState("signin");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState("");
  const [signInData, setSignInData] = useState({
    phoneOrEmail: "",
    password: "",
  });
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [regexMsg, setRegexMsg] = useState({
    name: "",
    phone: "",
    email: "",
  });

  useEffect(() => {
    const token = Cookies.get("token");
    if (token) {
      toast.info("شما قبلا وارد حساب شده‌اید");
      setTimeout(() => {
        router.push("/");
      }, 1000);
    }
  }, [router]);

  const calcPasswordStrength = () => {
    let strength = 0;
    if (passwordStrength.length >= 6) strength++;
    if (/[A-Z]/.test(passwordStrength)) strength++;
    if (/[a-z]/.test(passwordStrength)) strength++;
    if (/[0-9]/.test(passwordStrength)) strength++;
    if (/[^A-Za-z0-9]/.test(passwordStrength)) strength++;
    return strength;
  };
  const leftWidth = "w-full sm:w-2/5";
  const rightWidth = "w-full sm:w-3/5";

  const handleChange = (e) => {
    const { name, value } = e.target;
    const namePattern = /^[A-Za-zآ-ی]+(?:\s[A-Za-zآ-ی]+){1,}$/;
    const phonePattern = /^09\d{9}$/;
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    setRegexMsg((prev) => ({
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

    setFormData((prev) => ({ ...prev, [name]: value }));
  };
  const handlePasswordInput = (e) => {
    setPasswordStrength(e.target.value);
    handleChange(e);
  };
  const handleSignInChange = (e) => {
    const { name, value } = e.target;
    setSignInData((prev) => ({ ...prev, [name]: value }));
  };
  const handleSignInSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const res = await axios.post(backApis.login.url, signInData, {
        withCredentials: true,
      });
      toast.success("ورود با موفقیت انجام شد");
      setTimeout(() => {
        router.push("/");
        window.location.reload(); 
      }, 1000);
      setIsSubmitting(false);
    } catch (error) {
      const errorMsg =
        error.response?.data?.message || "مشکلی در ورود به وجود آمد";
      toast.error(errorMsg);
      setIsSubmitting(false);
    }
  };
  const handleSignUpSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);

    if (
      !formData.email ||
      !formData.password ||
      !formData.name ||
      !formData.confirmPassword ||
      !formData.phone
    ) {
      toast.error("لطفا تمامی فیلد ها را پر کنید");
      setIsSubmitting(false);
      return;
    }

    if (
      regexMsg.name !== "نام و نام خانوادگی معتبر است" ||
      regexMsg.phone !== "شماره موبایل معتبر است" ||
      regexMsg.email !== "ایمیل معتبر است"
    ) {
      toast.error("لطفا اطلاعات را به‌درستی وارد کنید");
      setIsSubmitting(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error("پسورد و تایید پسورد یکسان نیستند");
      setIsSubmitting(false);
      return;
    }

    try {
      const res = await axios.post(backApis.register.url, formData);
      toast.success("ثبت نام با موفقیت انجام شد");
      setIsSubmitting(false);
      setTimeout(() => {
        window.location.reload();
      }, 2500);
    } catch (err) {
      console.log(err);
      setIsSubmitting(false);
      const errorMsg =
        err.response?.data?.message || "مشکلی در ثبت‌ نام به وجود آمد";
      toast.error(errorMsg);
    }
  };

  return (
    <div className="min-h-[calc(100vh-7rem)] flex items-center justify-center bg-gradient-to-br from-blue-100 via-white to-blue-200 px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-5xl my-5 bg-white/30 backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] rounded-3xl overflow-hidden flex flex-col sm:flex-row border border-white/40"
      >
        {mode === "signin" ? (
          <>
            <div
              className={`${leftWidth} flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 p-2 md:p-8 lg:p-10`}
            >
              <Image
                src={Logo}
                alt="Logo"
                placeholder="blur"
                className="w-3/4 md:w-4/5 lg:w-3/4 max-w-xs md:max-w-sm md:mb-6 drop-shadow-lg"
              />
              <div className="text-3xl md:text-2xl lg:text-3xl font-extrabold text-yellow-600 flex items-center justify-center gap-1">
                <span>خوش آمدید </span>{" "}
                <StarsIcon className="text-yellow-600" />
              </div>
              <p className="text-lg md:text-sm lg:text-base text-gray-600 mt-2 text-center">
                دوباره دیدنتون باعث افتخاره
              </p>
            </div>

            <div
              className={`${rightWidth} p-6 md:p-8 lg:p-10 flex flex-col justify-center`}
            >
              <div className="flex border-b mb-6 md:mb-8">
                <button
                  onClick={() => setMode("signin")}
                  className={`w-1/2 py-2 md:py-3 text-center font-semibold text-base md:text-lg transition ${
                    mode === "signin"
                      ? "text-blue-600 border-b-4 border-blue-600"
                      : "text-gray-500 hover:text-blue-600"
                  }`}
                >
                  ورود
                </button>
                <button
                  onClick={() => setMode("signup")}
                  className={`w-1/2 py-2 md:py-3 text-center font-semibold text-base md:text-lg transition cursor-pointer ${
                    mode === "signup"
                      ? "text-blue-600 border-b-4 border-blue-600"
                      : "text-gray-500 hover:text-blue-600 hover:bg-sky-300/30 rounded-t-md transition-colors"
                  }`}
                >
                  ثبت‌نام
                </button>
              </div>

              <AnimatePresence mode="wait">
                {mode === "signin" && (
                  <motion.form
                    key="signin"
                    initial={{ opacity: 0, x: 60 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -60 }}
                    transition={{ duration: 0.4 }}
                    onSubmit={handleSignInSubmit}
                    className="flex flex-col gap-4 md:gap-5"
                  >
                    <InputField
                      label="ایمیل یا شماره موبایل"
                      type="text"
                      name="phoneOrEmail"
                      value={signInData.phoneOrEmail}
                      onChange={handleSignInChange}
                    />

                    <InputField
                      label="رمز عبور"
                      type="password"
                      name="password"
                      value={signInData.password}
                      onChange={handleSignInChange}
                    />

                    <Btn1
                      type={"submit"}
                      
                      disabled={false}
                      btnClassName={
                        "calcPasswordStrength() > 2 && !isSubmitting ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white hover:scale-[1.02] active:scale-95' : 'bg-gray-400 text-white cursor-not-allowed'"
                      }
                      text={isSubmitting ? "در حال ارسال..." : "ورود"}
                    />
                    <Link className="text-lg md:text-sm lg:text-base text-red-600 mt-2 text-center hover:text-blue-800/70 transition-colors" href="/forget-passwoed">رمز عبور خود را فراموش کرده اید؟</Link>
                  </motion.form>
                )}
              </AnimatePresence>
            </div>
          </>
        ) : (
          <>
            <div
              className={`${leftWidth} flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 p-2 md:p-8 lg:p-10`}
            >
              <Image
                src={Logo}
                alt="Logo"
                placeholder="blur"
                className="w-full md:w-4/5 lg:w-3/4 max-w-xs md:max-w-sm md:mb-6 drop-shadow-lg"
              />
              <div className="text-3xl md:text-2xl lg:text-3xl font-extrabold text-yellow-600 flex items-center justify-center gap-1">
                <span>به جمع ما بپیوندید</span>
                <StarsIcon className="text-yellow-600" />
              </div>
              <p className="text-lg md:text-sm lg:text-base text-gray-600 mt-2 text-center">
                همین حالا حساب بسازید و شروع کنید
              </p>
            </div>

            <div
              className={`${rightWidth} p-6 md:p-8 lg:p-10 flex flex-col justify-center`}
            >
              <div className="flex border-b mb-6 md:mb-8">
                <button
                  onClick={() => setMode("signin")}
                  className={`w-1/2 py-2 md:py-3 text-center font-semibold text-base md:text-lg transition cursor-pointer ${
                    mode === "signin"
                      ? "text-blue-600 border-b-4 border-blue-600"
                      : "text-gray-500 hover:text-blue-600 hover:bg-sky-300/30 rounded-t-md transition-colors"
                  }`}
                >
                  ورود
                </button>
                <button
                  onClick={() => setMode("signup")}
                  className={`w-1/2 py-2 md:py-3 text-center font-semibold text-base md:text-lg transition ${
                    mode === "signup"
                      ? "text-blue-600 border-b-4 border-blue-600"
                      : "text-gray-500 hover:text-blue-600"
                  }`}
                >
                  ثبت‌نام
                </button>
              </div>

              <AnimatePresence mode="wait">
                {mode === "signup" && (
                  <motion.form
                    key="signup"
                    initial={{ opacity: 0, x: -60 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 60 }}
                    transition={{ duration: 0.4 }}
                    onSubmit={handleSignUpSubmit}
                    className="flex flex-col gap-4 md:gap-5"
                  >
                    <div className="flex flex-col justify-center gap-2">
                      <InputField
                        label="نام و نام خانوادگی"
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                      />
                      <span
                        className={`text-sm pr-3 ${
                          regexMsg.name.includes("نامعتبر")
                            ? "text-red-400"
                            : "text-green-700"
                        }`}
                      >
                        {regexMsg.name}
                      </span>
                    </div>

                    <div className="flex flex-col justify-center gap-2">
                      <InputField
                        label="شماره موبایل"
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        helperText={regexMsg.phone}
                        helperClass={
                          regexMsg.phone.includes("نامعتبر")
                            ? "text-red-500"
                            : "text-green-600"
                        }
                      />
                      <span
                        className={`text-sm pr-3 ${
                          regexMsg.phone.includes("نامعتبر")
                            ? "text-red-400"
                            : "text-green-700"
                        }`}
                      >
                        {regexMsg.phone}
                      </span>
                    </div>

                    <div className="flex flex-col justify-center gap-2">
                      <InputField
                        label="ایمیل"
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                      />
                      <span
                        className={`text-sm pr-5 ${
                          regexMsg.email.includes("نامعتبر")
                            ? "text-red-400"
                            : "text-green-700"
                        }`}
                      >
                        {regexMsg.email}
                      </span>
                    </div>

                    <InputField
                      label="رمز عبور"
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handlePasswordInput}
                    />

                    <InputField
                      label="تایید رمز عبور"
                      type="password"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                    />

                    <div className="flex gap-1 mb-1 justify-center items-center">
                      {[...Array(5)].map((_, i) => (
                        <div
                          key={i}
                          className={`w-6 h-2 rounded bg-gray-300 ${
                            i < calcPasswordStrength() ? "bg-green-500" : ""
                          }`}
                        ></div>
                      ))}
                    </div>
                    <Btn1
                      type={"submit"}
                      disabled={calcPasswordStrength() <= 2 || isSubmitting}
                      btnClassName={
                        "calcPasswordStrength() > 2 && !isSubmitting ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white hover:scale-[1.02] active:scale-95' : 'bg-gray-400 text-white cursor-not-allowed'"
                      }
                      text={isSubmitting ? "در حال ارسال..." : "ثبت‌نام"}
                    />
                  </motion.form>
                )}
              </AnimatePresence>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
};

export default AuthPage;
