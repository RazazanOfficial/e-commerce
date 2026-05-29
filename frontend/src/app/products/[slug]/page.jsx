"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import apiClient from "@/common/apiClient";
import backApis from "@/common";
import Spinner from "@/components/Spinner";

const formatPrice = (value, currency = "IRT") => {
  const formatted = new Intl.NumberFormat("fa-IR").format(Number(value || 0));
  return `${formatted} ${currency}`;
};

export default function ProductDetailsPage() {
  const params = useParams();
  const slug = params?.slug;
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let ignore = false;
    if (!slug) return;

    (async () => {
      try {
        setLoading(true);
        const { url } = backApis.publicProductBySlug(slug);
        const { data } = await apiClient.get(url);
        if (!ignore) {
          setProduct(data?.data || null);
          setNotFound(false);
        }
      } catch (err) {
        if (!ignore) {
          setProduct(null);
          setNotFound(err?.response?.status === 404);
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    })();

    return () => {
      ignore = true;
    };
  }, [slug]);

  const images = useMemo(() => {
    const list = Array.isArray(product?.images) ? product.images : [];
    return list.length ? list : [];
  }, [product]);
  const primary = images.find((img) => img?.isPrimary) || images[0];

  if (loading) {
    return (
      <main className="flex min-h-[calc(100vh-7rem)] items-center justify-center bg-slate-50">
        <Spinner />
      </main>
    );
  }

  if (notFound || !product) {
    return (
      <main className="min-h-[calc(100vh-7rem)] bg-slate-50 px-4 py-10">
        <div className="mx-auto max-w-3xl rounded-3xl bg-white p-8 text-center shadow-sm ring-1 ring-slate-200">
          <h1 className="text-xl font-black text-slate-900">محصول پیدا نشد</h1>
          <Link className="mt-5 inline-flex rounded-2xl bg-blue-600 px-5 py-3 text-sm font-bold text-white" href="/products">
            برگشت به محصولات
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-[calc(100vh-7rem)] bg-slate-50 px-4 py-10">
      <section className="mx-auto grid max-w-7xl gap-8 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200 lg:grid-cols-2">
        <div>
          <div className="aspect-square overflow-hidden rounded-3xl bg-slate-100">
            {primary?.url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={primary.url} alt={primary.alt || product.title} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center text-slate-400">بدون تصویر</div>
            )}
          </div>
          {images.length > 1 ? (
            <div className="mt-3 grid grid-cols-4 gap-3">
              {images.slice(0, 8).map((img, index) => (
                <div key={`${img.url}-${index}`} className="aspect-square overflow-hidden rounded-2xl bg-slate-100 ring-1 ring-slate-200">

                  <img src={img.url} alt={img.alt || product.title} className="h-full w-full object-cover" />
                </div>
              ))}
            </div>
          ) : null}
        </div>

        <div className="flex flex-col justify-center p-2 lg:p-6">
          <Link href="/products" className="mb-4 text-sm font-bold text-blue-600">بازگشت به محصولات</Link>
          <h1 className="text-3xl font-black leading-10 text-slate-950">{product.title}</h1>
          <p className="mt-4 text-base leading-8 text-slate-600">{product.shortDescription}</p>
          <div className="mt-6 rounded-3xl bg-slate-50 p-5">
            <div className="text-sm text-slate-500">قیمت</div>
            <div className="mt-1 text-2xl font-black text-blue-700">{formatPrice(product.price, product.currency)}</div>
          </div>
          {product.overviewHtml ? (
            <div className="prose prose-slate mt-6 max-w-none text-right" dangerouslySetInnerHTML={{ __html: product.overviewHtml }} />
          ) : null}
        </div>
      </section>
    </main>
  );
}
