import Link from "next/link";

const emptyFunction = () => {
  return;
};
const Btn1 = ({ text, btnClassName, spanClassName, onClick, onSubmit ,type}) => {
  return (
    <button
    type={type}
      onClick={onClick || emptyFunction}
      onSubmit={onSubmit || emptyFunction}
      className={`bg-blue-950 text-blue-400 border border-blue-400 border-b-4 font-medium overflow-hidden relative px-4 py-2 rounded-md hover:brightness-150 hover:border-t-4 hover:border-b active:opacity-75 outline-none duration-300 group cursor-pointer ${
        btnClassName || ""
      }`}
    >
      <span
        className={`bg-blue-400 shadow-blue-400 absolute -top-[150%] left-0 inline-flex w-full h-[5px] rounded-md opacity-50 group-hover:top-[150%] duration-500 shadow-[0_0_10px_10px_rgba(0,0,0,0.3)]${
          spanClassName || ""
        }`}
      ></span>
      {text}
    </button>
  );
};
const Link1 = ({
  text,
  btnClassName,
  spanClassName,
  linkClassName,
  onClick,
  onSubmit,
  href,
}) => {
  return (
    <button
      onClick={onClick || emptyFunction}
      onSubmit={onSubmit || emptyFunction}
      className={`bg-blue-950 text-blue-400 border border-blue-400 border-b-4 font-medium overflow-hidden relative px-4 py-2 rounded-md hover:brightness-150 hover:border-t-4 hover:border-b active:opacity-75 outline-none duration-300 group cursor-pointer ${
        btnClassName || ""
      }`}
    >
      <span
        className={`bg-blue-400 shadow-blue-400 absolute -top-[150%] left-0 inline-flex w-full h-[5px] rounded-md opacity-50 group-hover:top-[150%] duration-500 shadow-[0_0_10px_10px_rgba(0,0,0,0.3)]${
          spanClassName || ""
        }`}
      ></span>

    </button>
  );
};
export { Btn1, Link1 };
