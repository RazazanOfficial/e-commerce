"use client";

import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { StarsIcon } from "lucide-react";
import { toast } from "react-toastify";

import Logo from "@/assets/images/Logo.png";
import apiClient from "@/common/apiClient";
import backApis from "@/common";
import { InputField } from "@/components/ui/Inputs";
import { Btn1 } from "@/components/ui/Buttons";
import { UserContext } from "@/context/UserContext";

const SIGNUP_PROGRESS_STORAGE_KEY = "auth.signup.progress.v2";
const RESEND_COOLDOWN_SECONDS = 60;
const namePattern = /^[A-Za-zآ-یء-ی\s‌-]+$/;
const phonePattern = /^09\d{9}$/;
const codePattern = /^\d{6}$/;
const passwordPattern = /^(?=.*[A-Za-zآ-ی])(?=.*\d).{8,}$/;

const getInitialSignupData = () => ({
  firstName: "",
  lastName: "",
  phone: "",
  code: "",
  password: "",
  confirmPassword: "",
  registrationToken: "",
});

const getInitialRegexMsg = () => ({
  firstName: "",
  lastName: "",
  phone: "",
  code: "",
  password: "",
  confirmPassword: "",
});

const getInitialPasswordLoginData = () => ({
  identifier: "",
  password: "",
});

const getInitialOtpLoginData = () => ({
  phone: "",
  code: "",
});

const readSignupProgress = () => {
  if (typeof window === "undefined") return null;

  try {
    const rawProgress = window.localStorage.getItem(SIGNUP_PROGRESS_STORAGE_KEY);
    if (!rawProgress) return null;

    const progress = JSON.parse(rawProgress);
    const formData = progress?.formData || {};
    const safeStep = ["identity", "verify", "password"].includes(progress?.signupStep)
      ? progress.signupStep
      : "identity";

    return {
      mode: progress?.mode === "signup" ? "signup" : "signin",
      signupStep: safeStep,
      signupCooldownEndsAt: Number(progress?.signupCooldownEndsAt) || 0,
      formData: {
        ...getInitialSignupData(),
        firstName: String(formData.firstName || ""),
        lastName: String(formData.lastName || ""),
        phone: String(formData.phone || ""),
        code: String(formData.code || ""),
        registrationToken: String(formData.registrationToken || ""),
      },
    };
  } catch {
    window.localStorage.removeItem(SIGNUP_PROGRESS_STORAGE_KEY);
    return null;
  }
};

const writeSignupProgress = ({ mode, signupStep, formData, signupCooldownEndsAt }) => {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(
    SIGNUP_PROGRESS_STORAGE_KEY,
    JSON.stringify({
      mode,
      signupStep,
      signupCooldownEndsAt,
      formData: {
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        code: formData.code,
        registrationToken: formData.registrationToken,
      },
    })
  );
};

const clearSignupProgress = () => {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(SIGNUP_PROGRESS_STORAGE_KEY);
};

const AuthPage = () => {
  const router = useRouter();
  const { fetchUserDetails } = useContext(UserContext);

  const [mode, setMode] = useState("signin");
  const [loginMethod, setLoginMethod] = useState("password");
  const [signupStep, setSignupStep] = useState("identity");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const [showPhoneConfirm, setShowPhoneConfirm] = useState(false);
  const [signupCooldownEndsAt, setSignupCooldownEndsAt] = useState(0);
  const [signupCooldownLeft, setSignupCooldownLeft] = useState(0);
  const [loginCooldownEndsAt, setLoginCooldownEndsAt] = useState(0);
  const [loginCooldownLeft, setLoginCooldownLeft] = useState(0);
  const [passwordLoginData, setPasswordLoginData] = useState(getInitialPasswordLoginData);
  const [otpLoginData, setOtpLoginData] = useState(getInitialOtpLoginData);
  const [otpLoginStep, setOtpLoginStep] = useState("phone");
  const [formData, setFormData] = useState(getInitialSignupData);
  const [regexMsg, setRegexMsg] = useState(getInitialRegexMsg);

  useEffect(() => {
    const savedProgress = readSignupProgress();

    if (savedProgress) {
      setMode(savedProgress.mode);
      setSignupStep(savedProgress.signupStep);
      setFormData(savedProgress.formData);
      setSignupCooldownEndsAt(savedProgress.signupCooldownEndsAt);
    }

    setIsHydrated(true);
  }, []);

  useEffect(() => {
    let ignore = false;

    (async () => {
      const currentUser = await fetchUserDetails({ silent: true });
      if (!ignore && currentUser?._id) {
        toast.info("شما وارد حساب شده‌اید");
        router.replace("/");
      }
    })();

    return () => {
      ignore = true;
    };
  }, [fetchUserDetails, router]);

  useEffect(() => {
    if (!isHydrated) return;

    const hasSignupProgress =
      mode === "signup" ||
      signupStep !== "identity" ||
      signupCooldownEndsAt > Date.now() ||
      Object.values(formData).some(Boolean);

    if (!hasSignupProgress) {
      clearSignupProgress();
      return;
    }

    writeSignupProgress({
      mode,
      signupStep,
      formData,
      signupCooldownEndsAt,
    });
  }, [formData, isHydrated, mode, signupCooldownEndsAt, signupStep]);

  useEffect(() => {
    const updateCooldowns = () => {
      setSignupCooldownLeft(Math.max(0, Math.ceil((signupCooldownEndsAt - Date.now()) / 1000)));
      setLoginCooldownLeft(Math.max(0, Math.ceil((loginCooldownEndsAt - Date.now()) / 1000)));
    };

    updateCooldowns();
    const timer = window.setInterval(updateCooldowns, 1000);

    return () => window.clearInterval(timer);
  }, [loginCooldownEndsAt, signupCooldownEndsAt]);

  const leftWidth = "w-full sm:w-2/5";
  const rightWidth = "w-full sm:w-3/5";

  const identityIsValid = useMemo(
    () =>
      namePattern.test(formData.firstName.trim()) &&
      formData.firstName.trim().length >= 2 &&
      namePattern.test(formData.lastName.trim()) &&
      formData.lastName.trim().length >= 2 &&
      phonePattern.test(formData.phone.trim()),
    [formData.firstName, formData.lastName, formData.phone]
  );

  const signupPasswordIsValid = useMemo(
    () =>
      passwordPattern.test(formData.password) &&
      formData.password === formData.confirmPassword &&
      Boolean(formData.registrationToken),
    [formData.confirmPassword, formData.password, formData.registrationToken]
  );

  const codeIsExpired = signupStep === "verify" && signupCooldownEndsAt > 0 && signupCooldownLeft <= 0;
  const loginCodeIsExpired = otpLoginStep === "verify" && loginCooldownEndsAt > 0 && loginCooldownLeft <= 0;

  const setFieldMessage = (name, value, nextForm = formData) => {
    if (name === "firstName") {
      return namePattern.test(value) && value.trim().length >= 2 ? "نام معتبر است" : "نام نامعتبر است";
    }

    if (name === "lastName") {
      return namePattern.test(value) && value.trim().length >= 2
        ? "نام خانوادگی معتبر است"
        : "نام خانوادگی نامعتبر است";
    }

    if (name === "phone") {
      return phonePattern.test(value) ? "شماره موبایل معتبر است" : "شماره موبایل نامعتبر است";
    }

    if (name === "code") {
      return codePattern.test(value) ? "کد تایید معتبر است" : "کد تایید باید ۶ رقم باشد";
    }

    if (name === "password") {
      return passwordPattern.test(value)
        ? "رمز عبور معتبر است"
        : "رمز عبور باید حداقل ۸ کاراکتر و شامل حرف و عدد باشد";
    }

    if (name === "confirmPassword") {
      return value && value === nextForm.password ? "تکرار رمز عبور صحیح است" : "تکرار رمز عبور یکسان نیست";
    }

    return "";
  };

  const helperClass = (message) =>
    message.includes("نامعتبر") || message.includes("باید") || message.includes("نیست")
      ? "text-red-400"
      : "text-green-700";

  const handleModeChange = (nextMode) => {
    setMode(nextMode);
    setRegexMsg(getInitialRegexMsg());
    setShowPhoneConfirm(false);
  };

  const handleLoginMethodChange = (nextMethod) => {
    setLoginMethod(nextMethod);
    setIsSubmitting(false);
  };

  const handleSignupChange = (e) => {
    const { name, value } = e.target;
    const nextValue = name === "phone" || name === "code" ? value.replace(/\D/g, "") : value;

    setFormData((prev) => {
      const nextForm = {
        ...prev,
        [name]: nextValue,
        ...(name === "phone" ? { code: "", registrationToken: "" } : {}),
      };

      setRegexMsg((current) => ({
        ...current,
        [name]: setFieldMessage(name, nextValue, nextForm),
        ...(name === "phone" ? { code: "", password: "", confirmPassword: "" } : {}),
        ...(name === "password" && nextForm.confirmPassword
          ? { confirmPassword: setFieldMessage("confirmPassword", nextForm.confirmPassword, nextForm) }
          : {}),
      }));

      return nextForm;
    });
  };

  const handlePasswordLoginChange = (e) => {
    const { name, value } = e.target;
    setPasswordLoginData((prev) => ({ ...prev, [name]: value }));
  };

  const handleOtpLoginChange = (e) => {
    const { name, value } = e.target;
    const nextValue = name === "phone" || name === "code" ? value.replace(/\D/g, "") : value;
    setOtpLoginData((prev) => ({
      ...prev,
      [name]: nextValue,
      ...(name === "phone" ? { code: "" } : {}),
    }));
  };

  const handlePasswordLoginSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    const identifier = passwordLoginData.identifier.trim();
    if (!identifier || !passwordLoginData.password) {
      toast.error("نام کاربری/شماره موبایل و رمز عبور را وارد کنید");
      return;
    }

    setIsSubmitting(true);

    try {
      await apiClient.post(backApis.login.url, {
        identifier,
        phoneOrEmail: identifier,
        password: passwordLoginData.password,
      });
      await fetchUserDetails({ silent: true });
      toast.success("ورود با موفقیت انجام شد");
      router.push("/");
    } catch (error) {
      const errorMsg = error.response?.data?.message || "مشکلی در ورود به وجود آمد";
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const requestLoginCode = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!phonePattern.test(otpLoginData.phone)) {
      toast.error("شماره موبایل را به‌درستی وارد کنید");
      return;
    }

    if (loginCooldownLeft > 0) {
      toast.info(`ارسال مجدد کد تا ${loginCooldownLeft} ثانیه دیگر امکان‌پذیر است`);
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await apiClient.post(backApis.loginRequestCode.url, {
        phone: otpLoginData.phone.trim(),
      });

      const expiresInSeconds = Number(response.data?.data?.expiresInSeconds) || RESEND_COOLDOWN_SECONDS;
      setLoginCooldownEndsAt(Date.now() + expiresInSeconds * 1000);
      setOtpLoginData((prev) => ({ ...prev, code: "" }));
      setOtpLoginStep("verify");
      toast.success(response.data?.message || "کد ورود ارسال شد");
    } catch (error) {
      const errorMsg = error.response?.data?.message || "مشکلی در ارسال کد ورود به وجود آمد";
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const verifyLoginCode = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!phonePattern.test(otpLoginData.phone) || !codePattern.test(otpLoginData.code)) {
      toast.error("شماره موبایل یا کد ورود نامعتبر است");
      return;
    }

    if (loginCooldownEndsAt > 0 && Date.now() >= loginCooldownEndsAt) {
      toast.error("کد ورود منقضی شده است. دوباره کد دریافت کنید");
      return;
    }

    setIsSubmitting(true);

    try {
      await apiClient.post(backApis.loginVerifyCode.url, {
        phone: otpLoginData.phone.trim(),
        code: otpLoginData.code.trim(),
      });
      await fetchUserDetails({ silent: true });
      toast.success("ورود با موفقیت انجام شد");
      router.push("/");
    } catch (error) {
      const errorMsg = error.response?.data?.message || "مشکلی در تایید کد ورود به وجود آمد";
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const requestRegistrationCode = useCallback(async () => {
    if (isSubmitting) return;

    if (!identityIsValid) {
      toast.error("نام، نام خانوادگی و شماره موبایل را به‌درستی وارد کنید");
      return;
    }

    if (signupCooldownLeft > 0) {
      toast.info(`ارسال مجدد کد تا ${signupCooldownLeft} ثانیه دیگر امکان‌پذیر است`);
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await apiClient.post(backApis.registerRequestCode.url, {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        phone: formData.phone.trim(),
      });

      const expiresInSeconds = Number(response.data?.data?.expiresInSeconds) || RESEND_COOLDOWN_SECONDS;
      setSignupCooldownEndsAt(Date.now() + expiresInSeconds * 1000);
      setFormData((prev) => ({ ...prev, code: "", password: "", confirmPassword: "", registrationToken: "" }));
      setRegexMsg((prev) => ({ ...prev, code: "", password: "", confirmPassword: "" }));
      setSignupStep("verify");
      setShowPhoneConfirm(false);
      toast.success(response.data?.message || "کد تایید ارسال شد");
    } catch (error) {
      const errorMsg = error.response?.data?.message || "مشکلی در ارسال کد تایید به وجود آمد";
      toast.error(errorMsg);
      setShowPhoneConfirm(false);
      setSignupStep("identity");
    } finally {
      setIsSubmitting(false);
    }
  }, [formData.firstName, formData.lastName, formData.phone, identityIsValid, isSubmitting, signupCooldownLeft]);

  const handleRequestCode = (e) => {
    e.preventDefault();

    if (!identityIsValid) {
      toast.error("نام، نام خانوادگی و شماره موبایل را به‌درستی وارد کنید");
      return;
    }

    setShowPhoneConfirm(true);
  };

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!identityIsValid || !codePattern.test(formData.code)) {
      toast.error("اطلاعات ثبت‌نام یا کد تایید نامعتبر است");
      return;
    }

    if (signupCooldownEndsAt > 0 && Date.now() >= signupCooldownEndsAt) {
      toast.error("کد تایید منقضی شده است. دوباره کد دریافت کنید");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await apiClient.post(backApis.registerVerifyCode.url, {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        phone: formData.phone.trim(),
        code: formData.code.trim(),
      });

      const registrationToken = response.data?.data?.registrationToken;
      if (!registrationToken) {
        throw new Error("registration token is missing");
      }

      setFormData((prev) => ({ ...prev, registrationToken, password: "", confirmPassword: "" }));
      setRegexMsg((prev) => ({ ...prev, password: "", confirmPassword: "" }));
      setSignupStep("password");
      toast.success(response.data?.message || "شماره موبایل تایید شد");
    } catch (error) {
      const errorMsg = error.response?.data?.message || "مشکلی در تایید کد به وجود آمد";
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSetPassword = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!signupPasswordIsValid) {
      toast.error("رمز عبور باید حداقل ۸ کاراکتر، شامل حرف و عدد، و با تکرار آن یکسان باشد");
      return;
    }

    setIsSubmitting(true);

    try {
      await apiClient.post(backApis.registerSetPassword.url, {
        registrationToken: formData.registrationToken,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
      });
      await fetchUserDetails({ silent: true });
      clearSignupProgress();
      setMode("signin");
      setFormData(getInitialSignupData());
      setSignupStep("identity");
      setSignupCooldownEndsAt(0);
      toast.success("ثبت‌نام با موفقیت تکمیل شد");
      router.push("/");
    } catch (error) {
      const errorMsg = error.response?.data?.message || "مشکلی در تنظیم رمز عبور به وجود آمد";
      toast.error(errorMsg);
      if (error.response?.status === 400 && /منقضی/.test(errorMsg)) {
        setSignupStep("identity");
        setFormData((prev) => ({ ...prev, code: "", registrationToken: "", password: "", confirmPassword: "" }));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditIdentity = () => {
    setShowPhoneConfirm(false);
    setSignupStep("identity");
    setFormData((prev) => ({ ...prev, code: "", registrationToken: "", password: "", confirmPassword: "" }));
  };

  return (
    <div className="min-h-[calc(100vh-7rem)] flex items-center justify-center bg-gradient-to-br from-blue-100 via-white to-blue-200 px-4">
      <AnimatePresence>
        {showPhoneConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.96 }}
              className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl"
            >
              <h2 className="text-xl font-extrabold text-slate-900">تایید شماره موبایل</h2>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                کد تایید برای شماره <span className="font-bold dir-ltr inline-block text-blue-700">{formData.phone}</span> ارسال می‌شود.
                از درست بودن شماره مطمئن هستید؟
              </p>
              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Btn1
                  type="button"
                  disabled={isSubmitting || signupCooldownLeft > 0}
                  onClick={requestRegistrationCode}
                  text={
                    isSubmitting
                      ? "در حال ارسال..."
                      : signupCooldownLeft > 0
                        ? `${signupCooldownLeft} ثانیه دیگر`
                        : "ارسال کد"
                  }
                />
                <Btn1 type="button" variant="gray" disabled={isSubmitting} onClick={() => setShowPhoneConfirm(false)} text="ویرایش شماره" />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        className="flex flex-col sm:flex-row w-full max-w-5xl min-h-[600px] bg-white rounded-2xl shadow-2xl overflow-hidden"
      >
        {mode === "signin" ? (
          <>
            <div className={`${leftWidth} flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 p-2 md:p-8 lg:p-10`}>
              <Image
                src={Logo}
                alt="Logo"
                placeholder="blur"
                className="w-full md:w-4/5 lg:w-3/4 max-w-xs md:max-w-sm md:mb-6 drop-shadow-lg"
              />
              <div className="text-3xl md:text-2xl lg:text-3xl font-extrabold text-blue-600 flex items-center justify-center gap-1">
                <span>خوش برگشتید</span>
                <StarsIcon className="text-yellow-500" />
              </div>
              <p className="text-lg md:text-sm lg:text-base text-gray-600 mt-2 text-center">
                با رمز عبور یا رمز یکبار مصرف وارد شوید
              </p>
            </div>

            <div className={`${rightWidth} p-6 md:p-8 lg:p-10 flex flex-col justify-center`}>
              <div className="flex border-b mb-6 md:mb-8">
                <button
                  type="button"
                  onClick={() => handleModeChange("signin")}
                  className={`w-1/2 py-2 md:py-3 text-center font-semibold text-base md:text-lg transition cursor-pointer ${
                    mode === "signin" ? "text-blue-600 border-b-4 border-blue-600" : "text-gray-500 hover:text-blue-600"
                  }`}
                >
                  ورود
                </button>
                <button
                  type="button"
                  onClick={() => handleModeChange("signup")}
                  className={`w-1/2 py-2 md:py-3 text-center font-semibold text-base md:text-lg transition cursor-pointer ${
                    mode === "signup"
                      ? "text-blue-600 border-b-4 border-blue-600"
                      : "text-gray-500 hover:text-blue-600 hover:bg-sky-300/30 rounded-t-md transition-colors"
                  }`}
                >
                  ثبت‌نام
                </button>
              </div>

              <div className="mb-5 grid grid-cols-2 gap-2 rounded-2xl bg-slate-100 p-1 text-sm font-semibold text-slate-600">
                <button
                  type="button"
                  onClick={() => handleLoginMethodChange("password")}
                  className={`rounded-xl px-3 py-2 transition ${loginMethod === "password" ? "bg-white text-blue-700 shadow" : "hover:text-blue-700"}`}
                >
                  رمز عبور
                </button>
                <button
                  type="button"
                  onClick={() => handleLoginMethodChange("otp")}
                  className={`rounded-xl px-3 py-2 transition ${loginMethod === "otp" ? "bg-white text-blue-700 shadow" : "hover:text-blue-700"}`}
                >
                  رمز یکبار مصرف
                </button>
              </div>

              <AnimatePresence mode="wait">
                {loginMethod === "password" && (
                  <motion.form
                    key="signin-password"
                    initial={{ opacity: 0, x: 60 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -60 }}
                    transition={{ duration: 0.3 }}
                    onSubmit={handlePasswordLoginSubmit}
                    className="flex flex-col gap-4 md:gap-5"
                  >
                    <InputField
                      label="نام کاربری یا شماره موبایل"
                      type="text"
                      name="identifier"
                      value={passwordLoginData.identifier}
                      onChange={handlePasswordLoginChange}
                    />

                    <InputField
                      label="رمز عبور"
                      type="password"
                      name="password"
                      value={passwordLoginData.password}
                      onChange={handlePasswordLoginChange}
                    />

                    <Btn1
                      type="submit"
                      disabled={isSubmitting || !passwordLoginData.identifier || !passwordLoginData.password}
                      btnClassName="hover:scale-[1.02] active:scale-95 cursor-pointer"
                      text={isSubmitting ? "در حال ارسال..." : "ورود"}
                    />
                    <Link
                      className="text-lg md:text-sm lg:text-base text-red-600 mt-2 text-center hover:text-blue-800/70 transition-colors cursor-pointer"
                      href="/forget-password"
                    >
                      رمز عبور خود را فراموش کرده اید؟
                    </Link>
                  </motion.form>
                )}

                {loginMethod === "otp" && otpLoginStep === "phone" && (
                  <motion.form
                    key="signin-otp-phone"
                    initial={{ opacity: 0, x: 60 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -60 }}
                    transition={{ duration: 0.3 }}
                    onSubmit={requestLoginCode}
                    className="flex flex-col gap-4 md:gap-5"
                  >
                    <InputField
                      label="شماره موبایل"
                      type="tel"
                      name="phone"
                      value={otpLoginData.phone}
                      onChange={handleOtpLoginChange}
                    />
                    <Btn1
                      type="submit"
                      disabled={isSubmitting || !phonePattern.test(otpLoginData.phone) || loginCooldownLeft > 0}
                      btnClassName="hover:scale-[1.02] active:scale-95 cursor-pointer"
                      text={
                        isSubmitting
                          ? "در حال ارسال..."
                          : loginCooldownLeft > 0
                            ? `ارسال مجدد تا ${loginCooldownLeft} ثانیه دیگر`
                            : "ارسال کد ورود"
                      }
                    />
                  </motion.form>
                )}

                {loginMethod === "otp" && otpLoginStep === "verify" && (
                  <motion.form
                    key="signin-otp-verify"
                    initial={{ opacity: 0, x: 60 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -60 }}
                    transition={{ duration: 0.3 }}
                    onSubmit={verifyLoginCode}
                    className="flex flex-col gap-4 md:gap-5"
                  >
                    <div className="rounded-2xl border border-blue-100 bg-blue-50/80 p-4 text-sm text-blue-800 leading-7">
                      کد ورود برای شماره <span className="font-bold dir-ltr inline-block">{otpLoginData.phone}</span> ارسال شد.
                    </div>

                    {loginCodeIsExpired && (
                      <div className="rounded-2xl border border-red-100 bg-red-50/80 p-4 text-sm font-semibold text-red-700 leading-7">
                        کد ورود منقضی شده است. برای ادامه، دوباره کد دریافت کنید.
                      </div>
                    )}

                    <InputField label="کد ورود ۶ رقمی" type="tel" name="code" value={otpLoginData.code} onChange={handleOtpLoginChange} />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Btn1
                        type="submit"
                        disabled={!codePattern.test(otpLoginData.code) || isSubmitting || loginCodeIsExpired}
                        btnClassName="hover:scale-[1.02] active:scale-95 cursor-pointer"
                        text={isSubmitting ? "در حال تایید..." : "تایید و ورود"}
                      />
                      <Btn1
                        type="button"
                        variant="gray"
                        disabled={isSubmitting}
                        onClick={() => setOtpLoginStep("phone")}
                        btnClassName="hover:scale-[1.02] active:scale-95 cursor-pointer"
                        text="ویرایش شماره"
                      />
                    </div>

                    <button
                      type="button"
                      disabled={isSubmitting || loginCooldownLeft > 0}
                      onClick={requestLoginCode}
                      className="cursor-pointer text-sm font-semibold text-blue-700 transition hover:text-blue-900 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {loginCooldownLeft > 0
                        ? `ارسال مجدد کد تا ${loginCooldownLeft} ثانیه دیگر`
                        : loginCodeIsExpired
                          ? "کد منقضی شد؛ ارسال کد جدید"
                          : "ارسال مجدد کد"}
                    </button>
                  </motion.form>
                )}
              </AnimatePresence>
            </div>
          </>
        ) : (
          <>
            <div className={`${leftWidth} flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 p-2 md:p-8 lg:p-10`}>
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
                شماره موبایل را تایید کنید و رمز عبور بسازید
              </p>
            </div>

            <div className={`${rightWidth} p-6 md:p-8 lg:p-10 flex flex-col justify-center`}>
              <div className="flex border-b mb-6 md:mb-8">
                <button
                  type="button"
                  onClick={() => handleModeChange("signin")}
                  className={`w-1/2 py-2 md:py-3 text-center font-semibold text-base md:text-lg transition cursor-pointer ${
                    mode === "signin"
                      ? "text-blue-600 border-b-4 border-blue-600"
                      : "text-gray-500 hover:text-blue-600 hover:bg-sky-300/30 rounded-t-md transition-colors"
                  }`}
                >
                  ورود
                </button>
                <button
                  type="button"
                  onClick={() => handleModeChange("signup")}
                  className={`w-1/2 py-2 md:py-3 text-center font-semibold text-base md:text-lg transition cursor-pointer ${
                    mode === "signup" ? "text-blue-600 border-b-4 border-blue-600" : "text-gray-500 hover:text-blue-600"
                  }`}
                >
                  ثبت‌نام
                </button>
              </div>

              <div className="mb-6 grid grid-cols-3 gap-2 text-xs font-bold text-center text-slate-500">
                <span className={signupStep === "identity" ? "text-blue-700" : "text-green-700"}>۱. اطلاعات</span>
                <span className={signupStep === "verify" ? "text-blue-700" : signupStep === "password" ? "text-green-700" : ""}>۲. تایید کد</span>
                <span className={signupStep === "password" ? "text-blue-700" : ""}>۳. رمز عبور</span>
              </div>

              <AnimatePresence mode="wait">
                {signupStep === "identity" && (
                  <motion.form
                    key="signup-identity"
                    initial={{ opacity: 0, x: -60 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 60 }}
                    transition={{ duration: 0.3 }}
                    onSubmit={handleRequestCode}
                    className="flex flex-col gap-4 md:gap-5"
                  >
                    <div className="flex flex-col justify-center gap-2">
                      <InputField label="نام" type="text" name="firstName" value={formData.firstName} onChange={handleSignupChange} />
                      <span className={`text-sm pr-3 ${helperClass(regexMsg.firstName)}`}>{regexMsg.firstName}</span>
                    </div>

                    <div className="flex flex-col justify-center gap-2">
                      <InputField label="نام خانوادگی" type="text" name="lastName" value={formData.lastName} onChange={handleSignupChange} />
                      <span className={`text-sm pr-3 ${helperClass(regexMsg.lastName)}`}>{regexMsg.lastName}</span>
                    </div>

                    <div className="flex flex-col justify-center gap-2">
                      <InputField label="شماره موبایل" type="tel" name="phone" value={formData.phone} onChange={handleSignupChange} />
                      <span className={`text-sm pr-3 ${helperClass(regexMsg.phone)}`}>{regexMsg.phone}</span>
                    </div>

                    <Btn1
                      type="submit"
                      disabled={!identityIsValid || isSubmitting}
                      btnClassName="hover:scale-[1.02] active:scale-95 cursor-pointer"
                      text={isSubmitting ? "در حال بررسی..." : "ارسال کد تایید"}
                    />
                  </motion.form>
                )}

                {signupStep === "verify" && (
                  <motion.form
                    key="signup-verify"
                    initial={{ opacity: 0, x: -60 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 60 }}
                    transition={{ duration: 0.3 }}
                    onSubmit={handleVerifyCode}
                    className="flex flex-col gap-4 md:gap-5"
                  >
                    <div className="rounded-2xl border border-blue-100 bg-blue-50/80 p-4 text-sm text-blue-800 leading-7">
                      کد تایید برای شماره <span className="font-bold dir-ltr inline-block">{formData.phone}</span> ارسال شد.
                    </div>

                    {codeIsExpired && (
                      <div className="rounded-2xl border border-red-100 bg-red-50/80 p-4 text-sm font-semibold text-red-700 leading-7">
                        کد تایید منقضی شده است. برای ادامه، دوباره کد دریافت کنید.
                      </div>
                    )}

                    <div className="flex flex-col justify-center gap-2">
                      <InputField label="کد تایید ۶ رقمی" type="tel" name="code" value={formData.code} onChange={handleSignupChange} />
                      <span className={`text-sm pr-3 ${helperClass(regexMsg.code)}`}>{regexMsg.code}</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Btn1
                        type="submit"
                        disabled={!codePattern.test(formData.code) || isSubmitting || codeIsExpired}
                        btnClassName="hover:scale-[1.02] active:scale-95 cursor-pointer"
                        text={isSubmitting ? "در حال تایید..." : "تایید کد"}
                      />
                      <Btn1
                        type="button"
                        variant="gray"
                        disabled={isSubmitting}
                        onClick={handleEditIdentity}
                        btnClassName="hover:scale-[1.02] active:scale-95 cursor-pointer"
                        text="ویرایش اطلاعات"
                      />
                    </div>

                    <button
                      type="button"
                      disabled={isSubmitting || signupCooldownLeft > 0}
                      onClick={() => setShowPhoneConfirm(true)}
                      className="cursor-pointer text-sm font-semibold text-blue-700 transition hover:text-blue-900 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {signupCooldownLeft > 0
                        ? `ارسال مجدد کد تا ${signupCooldownLeft} ثانیه دیگر`
                        : codeIsExpired
                          ? "کد منقضی شد؛ ارسال کد جدید"
                          : "ارسال مجدد کد"}
                    </button>
                  </motion.form>
                )}

                {signupStep === "password" && (
                  <motion.form
                    key="signup-password"
                    initial={{ opacity: 0, x: -60 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 60 }}
                    transition={{ duration: 0.3 }}
                    onSubmit={handleSetPassword}
                    className="flex flex-col gap-4 md:gap-5"
                  >
                    <div className="rounded-2xl border border-green-100 bg-green-50/80 p-4 text-sm text-green-800 leading-7">
                      شماره موبایل تایید شد. برای تکمیل ثبت‌نام، رمز عبور حساب خود را تنظیم کنید.
                    </div>

                    <div className="flex flex-col justify-center gap-2">
                      <InputField label="رمز عبور" type="password" name="password" value={formData.password} onChange={handleSignupChange} />
                      <span className={`text-sm pr-3 ${helperClass(regexMsg.password)}`}>{regexMsg.password}</span>
                    </div>

                    <div className="flex flex-col justify-center gap-2">
                      <InputField
                        label="تکرار رمز عبور"
                        type="password"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleSignupChange}
                      />
                      <span className={`text-sm pr-3 ${helperClass(regexMsg.confirmPassword)}`}>{regexMsg.confirmPassword}</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Btn1
                        type="submit"
                        disabled={!signupPasswordIsValid || isSubmitting}
                        btnClassName="hover:scale-[1.02] active:scale-95 cursor-pointer"
                        text={isSubmitting ? "در حال تکمیل..." : "تکمیل ثبت‌نام"}
                      />
                      <Btn1
                        type="button"
                        variant="gray"
                        disabled={isSubmitting}
                        onClick={handleEditIdentity}
                        btnClassName="hover:scale-[1.02] active:scale-95 cursor-pointer"
                        text="شروع دوباره"
                      />
                    </div>
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
