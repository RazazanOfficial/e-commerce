import Header from "@/components/Header";
import "@/styles/globals.css";
import { ToastContainer } from "react-toastify";
import { UserProvider } from "@/context/UserContext";
import ReduxProvider from "@/redux/ReduxProvider";
import OfferHeader from "@/components/OfferHeader";

export const metadata = {
  title: "فروشگاه عصر دیجیتال",
  description: "سایت رسمی فروشگاه عصر دیجیتال",
  keywords: "فروشگاه, عصر دیجیتال, فروشگاه عصر دیجیتال",
};

export default function RootLayout({ children }) {
  return (
    <html lang="fa">
      <body className={`antialiased bg-slate-100 h-[100vh]`}>
        <ReduxProvider>
          <UserProvider>
            <OfferHeader/>
            <Header />
            {children}
            <ToastContainer />
          </UserProvider>
        </ReduxProvider>
      </body>
    </html>
  );
}
