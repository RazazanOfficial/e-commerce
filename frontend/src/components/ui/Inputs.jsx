"use client";
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";

const InputField = ({
  label,
  type = "text",
  name,
  value,
  onChange,
  error,
  className = "",
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";
  const inputType = isPassword ? (showPassword ? "text" : "password") : type;

  const hasValue = value && value.length > 0;

  return (
    <div className="relative w-full">
      <input
        id={name}
        name={name}
        type={inputType}
        value={value}
        onChange={onChange}
        placeholder=" "
        className={`peer w-full p-3 border-2 rounded-2xl outline-none bg-transparent text-right transition-all duration-300 
        focus:border-blue-500 ${error ? "border-red-400" : "border-gray-300"} ${className}`}
      />
      <label
        htmlFor={name}
        className={`absolute right-3 text-gray-500 text-sm transition-all duration-300 rounded
          ${hasValue ? "top-0 -translate-y-1/2 text-blue-600 text-xs bg-gray-100 px-1" : ""}
          peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2
          peer-focus:top-0 peer-focus:-translate-y-1/2 peer-focus:text-blue-600 peer-focus:text-xs peer-focus:bg-gray-100 peer-focus:px-1`}
      >
        {label}
      </label>

      {isPassword && (
        <span
          onClick={() => setShowPassword(!showPassword)}
          className="absolute top-1/2 left-3 -translate-y-1/2 cursor-pointer text-gray-500"
        >
          {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
        </span>
      )}
    </div>
  );
};

export { InputField };
