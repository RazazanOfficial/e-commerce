"use client";
import { usePathname } from "next/navigation";
import Header from "@/components/Header";
import OfferHeader from "@/components/OfferHeader";

export default function LayoutWrapper({ children }) {
  const pathname = usePathname();
  const showPublicHeader = !pathname.startsWith("/admin-panel");

  return (
    <>
      {showPublicHeader ? (
        <>
          <OfferHeader />
          <Header />
        </>
      ) : null}
      {children}
    </>
  );
}
