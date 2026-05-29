"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import apiClient from "@/common/apiClient";
import backApis from "@/common";
import Spinner from "@/components/Spinner";
import { Search } from "lucide-react";

const formatPrice = (value, currency = "IRT") => {
  const num = Number(value || 0);
  const formatted = new Intl.NumberFormat("fa-IR").format(num);
  return `${formatted} ${currency}`;
};

const getPrimaryImage = (product) => {
  const images = Array.isArray(product?.images) ? product.images : [];
  return images.find((img) => img?.isPrimary) || images[0] || null;
};

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [appliedQuery, setAppliedQuery] = useState("");
  const [total, setTotal] = useState(0);

  useEffect(() => {
    let ignore = false;

    (async () => {
      try {
        setLoading(true);
        const params = appliedQuery ? { q: appliedQuery } : undefined;
        const { data } = await apiClient.get(backApis.publicProducts.url, { params });
        if (!ignore) {
          const payload = data?.data || {};
          setProducts(Array.isArray(payload.items) ? payload.items : []);
          setTotal(payload.total || 0);
        }
      } catch (err) {
        if (!ignore) {
          setProducts([]);
          setTotal(0);
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    })();

    return () => {
      ignore = true;
    };
  }, [appliedQuery]);

  const hasProducts = useMemo(() => products.length > 0, [products]);

  const submitSearch = (e) => {
    e.preventDefault();
    setAppliedQuery(query.trim());
  };

  return (
    <main className="min-h-[calc(100vh-7rem)] bg-slate-50 px-4 py-8">
      <section className="mx-auto max-w-7xl">
        <div className="mb-8 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <h1 className="text-2xl font-black text-slate-900 md:text-3xl">محصولات</h1>
          <p className="mt-2 text-sm leading-7 text-slate-600">
            محصولات فعال و قابل نمایش فروشگاه از API عمومی دریافت می‌شوند.
          </p>

          <form onSubmit={submitSearch} className="mt-5 flex flex-col gap-3 sm:flex-row">
            <div className="flex h-12 flex-1 items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4">
              <Search className="h-5 w-5 text-slate-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="جستجوی محصول..."
                className="w-full bg-transparent text-sm outline-none"
              />
            </div>
            <button className="h-12 rounded-2xl bg-blue-600 px-6 text-sm font-bold text-white transition hover:bg-blue-700">
              جستجو
            </button>
          </form>
        </div>

        {loading ? (
          <div className="flex min-h-60 items-center justify-center">
            <Spinner />
          </div>
        ) : hasProducts ? (
          <>
            <div className="mb-4 text-sm text-slate-500">
              {new Intl.NumberFormat("fa-IR").format(total)} محصول پیدا شد
            </div>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {products.map((product) => {
                const primary = getPrimaryImage(product);
                return (
                  <Link
                    key={product._id || product.slug}
                    href={`/products/${product.slug}`}
                    className="group overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-1 hover:shadow-lg"
                  >
                    <div className="aspect-square bg-slate-100">
                      {primary?.url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={primary.url}
                          alt={primary.alt || product.title}
                          className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                          loading="lazy"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-sm text-slate-400">
                          بدون تصویر
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h2 className="line-clamp-2 min-h-12 text-base font-extrabold text-slate-900">
                        {product.title}
                      </h2>
                      <p className="mt-2 line-clamp-2 min-h-10 text-xs leading-5 text-slate-500">
                        {product.shortDescription}
                      </p>
                      <div className="mt-4 flex items-center justify-between gap-3">
                        <span className="text-sm font-black text-blue-700">
                          {formatPrice(product.price, product.currency)}
                        </span>
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-500">
                          جزئیات
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </>
        ) : (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
            محصولی برای نمایش وجود ندارد.
          </div>
        )}
      </section>
    </main>
  );
}
