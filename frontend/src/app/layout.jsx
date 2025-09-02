import "@/styles/globals.css";
import { Inter } from "next/font/google";
import { ToastContainer } from "react-toastify";
import { UserProvider } from "@/context/UserContext";
import ReduxProvider from "@/redux/ReduxProvider";
import LayoutWrapper from "@/components/LayoutWrapper";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "700"], 
  variable: "--font-inter",
  display: "swap",
});

export const metadata = {
  title: "فروشگاه عصر دیجیتال",
  description: "سایت رسمی فروشگاه عصر دیجیتال",
  keywords: "فروشگاه, عصر دیجیتال, فروشگاه عصر دیجیتال",
};

export default function RootLayout({ children }) {
  return (
    <html lang="fa" dir="rtl" className={inter.variable}>
      <body className="antialiased bg-slate-100 min-h-screen">
        <ReduxProvider>
          <UserProvider>
            <LayoutWrapper />
            {children}
            <ToastContainer />
          </UserProvider>
        </ReduxProvider>
      </body>
    </html>
  );
}
