import Link from "next/link";
import { ShoppingCartIcon, LucideUserCircle2, Search } from "lucide-react";
import Image from "next/image";
import logo from "@/assets/images/logo.png";
import { SearchBox } from "./ui/SearchBox";


const Header = () => {
  return (
    <header className=" grid grid-cols-7 gap-4 h-16 bg-white shadow-lg rounded-br-md rounded-bl-md items-center px-4">
      {/* Logo */}
      <div className="flex justify-center items-center">
        <Image src={logo} width={50} height={50} alt="Logo" />
      </div>
      {/* Search Box */}
      <div className="flex col-span-4 justify-center">
        <div className="w-2/3">
          <SearchBox/>
        </div>
      </div>

      {/* User, Cart, Login */}
      <div className="flex col-span-2 justify-center items-center gap-5">
        <span className="cursor-pointer">
          <LucideUserCircle2 size={27} className="text-emerald-600 hover:text-emerald-800 transition-all" />
        </span>
        <span className="relative cursor-pointer">
          <ShoppingCartIcon size={27} className="text-emerald-600 hover:text-emerald-800 transition-all" />
          <span className="absolute -top-2 -right-2 font-bold text-rose-500 rounded-full bg-lime-400 h-5 w-5 text-center text-xs flex items-center justify-center">
            0
          </span>
        </span>
        <Link
          href="./login"
          className="bg-emerald-400 px-4 py-2 text-white text-center flex items-center justify-center rounded-xl transition-all hover:bg-emerald-600"
        >
          ورود
        </Link>
      </div>
    </header>
  );
};

export default Header;
