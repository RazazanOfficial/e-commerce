"use client";
import { usePathname } from "next/navigation";
import Header from "@/components/Header";
import OfferHeader from "@/components/OfferHeader";

export default function LayoutWrapper({ children }) {
  const pathname = usePathname();

  return (
    <>
      {!pathname.startsWith("/admin-panel") && (
        <>
          <OfferHeader />
          <Header />
        </>
      )}
      {children}
    </>
  );
}
