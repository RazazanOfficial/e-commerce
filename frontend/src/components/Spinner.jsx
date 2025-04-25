const Spinner = () => {
  return (
    <div className="flex justify-center items-center h-screen bg-gradient-to-br from-emerald-50 via-teal-100 to-cyan-200">
    <div className="relative w-16 h-16">
      <div className="absolute inset-0 rounded-full border-4 border-t-emerald-500 border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
      <div className="absolute inset-2 rounded-full border-4 border-t-transparent border-r-emerald-500 border-b-transparent border-l-transparent animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1s' }}></div>
    </div>
  </div>

  );
};

export default Spinner;
