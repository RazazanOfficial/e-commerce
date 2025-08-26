const Spinner = () => {
  return (
    <div className="flex justify-center items-center h-screen bg-slate-900">
      <div className="relative w-16 h-16">
        {/* outer ring */}
        <div className="absolute inset-0 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin"></div>
        {/* inner ring */}
        <div
          className="absolute inset-2 rounded-full border-4 border-slate-700 border-t-transparent animate-spin"
          style={{ animationDirection: "reverse", animationDuration: "1s" }}
        ></div>
      </div>
    </div>
  );
};

export default Spinner;
