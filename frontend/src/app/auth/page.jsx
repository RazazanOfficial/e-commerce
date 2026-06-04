"use client";

import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import Image from "next/image";
import Logo from "@/assets/images/Logo.png";
import { StarsIcon } from "lucide-react";
import apiClient from "@/common/apiClient";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import backApis from "@/common";
import { InputField } from "@/components/ui/Inputs";
import { Btn1 } from "@/components/ui/Buttons";
import Link from "next/link";
import { UserContext } from "@/context/UserContext";

const SIGNUP_PROGRESS_STORAGE_KEY = "auth.signup.progress.v1";
const RESEND_COOLDOWN_SECONDS = 60;
const namePattern = /^[A-Za-zآ-یء-ی\s‌-]+$/;
const phonePattern = /^09\d{9}$/;
const codePattern = /^\d{6}$/;

const getInitialFormData = () => ({
  firstName: "",
  lastName: "",
  phone: "",
  code: "",
});

const getInitialRegexMsg = () => ({
  firstName: "",
  lastName: "",
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

    return {
      mode: progress?.mode === "signup" ? "signup" : "signin",
      signupStep: progress?.signupStep === "verify" ? "verify" : "identity",
      cooldownEndsAt: Number(progress?.cooldownEndsAt) || 0,
      formData: {
        firstName: String(formData.firstName || ""),
        lastName: String(formData.lastName || ""),
        phone: String(formData.phone || ""),
        code: String(formData.code || ""),
      },
    };
  } catch {
    window.localStorage.removeItem(SIGNUP_PROGRESS_STORAGE_KEY);
    return null;
  }
};

const writeSignupProgress = ({ mode, signupStep, formData, cooldownEndsAt }) => {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(
    SIGNUP_PROGRESS_STORAGE_KEY,
    JSON.stringify({
      mode,
      signupStep,
      cooldownEndsAt,
      formData: {
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        code: formData.code,
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
  const [signupStep, setSignupStep] = useState("identity");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const [showPhoneConfirm, setShowPhoneConfirm] = useState(false);
  const [cooldownEndsAt, setCooldownEndsAt] = useState(0);
  const [cooldownLeft, setCooldownLeft] = useState(0);
  const [signInData, setSignInData] = useState({
    phoneOrEmail: "",
    password: "",
  });
  const [formData, setFormData] = useState(getInitialFormData);
  const [regexMsg, setRegexMsg] = useState(getInitialRegexMsg);

  useEffect(() => {
    const savedProgress = readSignupProgress();

    if (savedProgress) {
      setMode(savedProgress.mode);
      setSignupStep(savedProgress.signupStep);
      setFormData(savedProgress.formData);
      setCooldownEndsAt(savedProgress.cooldownEndsAt);
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
      signupStep === "verify" ||
      cooldownEndsAt > Date.now() ||
      Object.values(formData).some(Boolean);

    if (!hasSignupProgress) {
      clearSignupProgress();
      return;
    }

    writeSignupProgress({
      mode,
      signupStep,
      formData,
      cooldownEndsAt,
    });
  }, [cooldownEndsAt, formData, isHydrated, mode, signupStep]);

  useEffect(() => {
    const updateCooldown = () => {
      setCooldownLeft(Math.max(0, Math.ceil((cooldownEndsAt - Date.now()) / 1000)));
    };

    updateCooldown();
    const timer = window.setInterval(updateCooldown, 1000);

    return () => window.clearInterval(timer);
  }, [cooldownEndsAt]);

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

  const codeIsExpired = signupStep === "verify" && cooldownEndsAt > 0 && cooldownLeft <= 0;

  const setFieldMessage = (name, value) => {
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

    return "";
  };

  const handleModeChange = (nextMode) => {
    setMode(nextMode);
    setRegexMsg(getInitialRegexMsg());
    setShowPhoneConfirm(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    const nextValue = name === "phone" || name === "code" ? value.replace(/\D/g, "") : value;

    setFormData((prev) => ({
      ...prev,
      [name]: nextValue,
      ...(name === "phone" ? { code: "" } : {}),
    }));
    setRegexMsg((prev) => ({
      ...prev,
      [name]: setFieldMessage(name, nextValue),
      ...(name === "phone" ? { code: "" } : {}),
    }));
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
      await apiClient.post(backApis.login.url, signInData);
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

  const requestRegistrationCode = useCallback(async () => {
    if (isSubmitting) return;

    if (!identityIsValid) {
      toast.error("نام، نام خانوادگی و شماره موبایل را به‌درستی وارد کنید");
      return;
    }

    if (cooldownLeft > 0) {
      toast.info(`ارسال مجدد کد تا ${cooldownLeft} ثانیه دیگر امکان‌پذیر است`);
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
      const nextCooldownEndsAt = Date.now() + expiresInSeconds * 1000;
      setCooldownEndsAt(nextCooldownEndsAt);
      setFormData((prev) => ({ ...prev, code: "" }));
      setRegexMsg((prev) => ({ ...prev, code: "" }));
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
  }, [cooldownLeft, formData.firstName, formData.lastName, formData.phone, identityIsValid, isSubmitting]);

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

    if (cooldownEndsAt > 0 && Date.now() >= cooldownEndsAt) {
      toast.error("کد تایید منقضی شده است. دوباره کد دریافت کنید");
      return;
    }

    setIsSubmitting(true);

    try {
      await apiClient.post(backApis.registerVerifyCode.url, {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        phone: formData.phone.trim(),
        code: formData.code.trim(),
      });
      await fetchUserDetails({ silent: true });
      clearSignupProgress();
      setMode("signin");
      setFormData(getInitialFormData());
      setSignupStep("identity");
      setCooldownEndsAt(0);
      toast.success("ثبت‌نام با موفقیت تکمیل شد");
      router.push("/");
    } catch (error) {
      const errorMsg = error.response?.data?.message || "مشکلی در تایید کد به وجود آمد";
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditIdentity = () => {
    setShowPhoneConfirm(false);
    setSignupStep("identity");
  };

  const helperClass = (message) =>
    message.includes("نامعتبر") || message.includes("باید") ? "text-red-400" : "text-green-700";

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
              transition={{ duration: 0.2 }}
              className="w-full max-w-md rounded-3xl border border-white/50 bg-white p-6 shadow-2xl"
            >
              <h2 className="text-xl font-extrabold text-slate-900">تایید شماره موبایل</h2>
              <p className="mt-3 leading-8 text-slate-600">
                کد تایید به شماره زیر ارسال می‌شود. لطفاً مطمئن شوید شماره موبایل درست است.
              </p>
              <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-center text-lg font-bold text-blue-800 dir-ltr">
                {formData.phone}
              </div>
              <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Btn1
                  type="button"
                  disabled={isSubmitting || cooldownLeft > 0}
                  onClick={requestRegistrationCode}
                  btnClassName="hover:scale-[1.02] active:scale-95 cursor-pointer"
                  text={
                    isSubmitting
                      ? "در حال ارسال..."
                      : cooldownLeft > 0
                        ? `${cooldownLeft} ثانیه دیگر`
                        : "بله، ارسال کد"
                  }
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
                disabled={isSubmitting}
                onClick={() => setShowPhoneConfirm(false)}
                className="mt-4 w-full cursor-pointer rounded-xl px-4 py-2 text-sm font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                انصراف
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-5xl my-5 bg-white/30 backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] rounded-3xl overflow-hidden flex flex-col sm:flex-row border border-white/40"
      >
        {mode === "signin" ? (
          <>
            <div className={`${leftWidth} flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 p-2 md:p-8 lg:p-10`}>
              <Image
                src={Logo}
                alt="Logo"
                placeholder="blur"
                className="w-3/4 md:w-4/5 lg:w-3/4 max-w-xs md:max-w-sm md:mb-6 drop-shadow-lg"
              />
              <div className="text-3xl md:text-2xl lg:text-3xl font-extrabold text-yellow-600 flex items-center justify-center gap-1">
                <span>خوش آمدید </span>
                <StarsIcon className="text-yellow-600" />
              </div>
              <p className="text-lg md:text-sm lg:text-base text-gray-600 mt-2 text-center">
                دوباره دیدنتون باعث افتخاره
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
                      type="submit"
                      disabled={isSubmitting || !signInData.phoneOrEmail || !signInData.password}
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
                فقط با شماره موبایل ثبت‌نام کنید
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

              <AnimatePresence mode="wait">
                {mode === "signup" && signupStep === "identity" && (
                  <motion.form
                    key="signup-identity"
                    initial={{ opacity: 0, x: -60 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 60 }}
                    transition={{ duration: 0.4 }}
                    onSubmit={handleRequestCode}
                    className="flex flex-col gap-4 md:gap-5"
                  >
                    <div className="flex flex-col justify-center gap-2">
                      <InputField label="نام" type="text" name="firstName" value={formData.firstName} onChange={handleChange} />
                      <span className={`text-sm pr-3 ${helperClass(regexMsg.firstName)}`}>{regexMsg.firstName}</span>
                    </div>

                    <div className="flex flex-col justify-center gap-2">
                      <InputField label="نام خانوادگی" type="text" name="lastName" value={formData.lastName} onChange={handleChange} />
                      <span className={`text-sm pr-3 ${helperClass(regexMsg.lastName)}`}>{regexMsg.lastName}</span>
                    </div>

                    <div className="flex flex-col justify-center gap-2">
                      <InputField label="شماره موبایل" type="tel" name="phone" value={formData.phone} onChange={handleChange} />
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

                {mode === "signup" && signupStep === "verify" && (
                  <motion.form
                    key="signup-verify"
                    initial={{ opacity: 0, x: -60 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 60 }}
                    transition={{ duration: 0.4 }}
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
                      <InputField label="کد تایید ۶ رقمی" type="tel" name="code" value={formData.code} onChange={handleChange} />
                      <span className={`text-sm pr-3 ${helperClass(regexMsg.code)}`}>{regexMsg.code}</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Btn1
                        type="submit"
                        disabled={!codePattern.test(formData.code) || isSubmitting || codeIsExpired}
                        btnClassName="hover:scale-[1.02] active:scale-95 cursor-pointer"
                        text={isSubmitting ? "در حال تایید..." : "تایید و ثبت‌نام"}
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
                      disabled={isSubmitting || cooldownLeft > 0}
                      onClick={() => setShowPhoneConfirm(true)}
                      className="cursor-pointer text-sm font-semibold text-blue-700 transition hover:text-blue-900 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {cooldownLeft > 0
                        ? `ارسال مجدد کد تا ${cooldownLeft} ثانیه دیگر`
                        : codeIsExpired
                          ? "کد منقضی شد؛ ارسال کد جدید"
                          : "ارسال مجدد کد"}
                    </button>
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
