import { useEffect, useState, useCallback } from "react";
import axios from "axios";

const usePaginatedFetch = (url) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0); 

  const fetchData = useCallback(async () => {
    setLoading(true);
    const start = Date.now();

    try {
      const res = await axios.get(url, {
        params: { page, limit: 10 },
        withCredentials: true,
      });

      setData(res.data.data || []);
      setTotalPages(res.data.totalPages || 1);
      setTotalCount(res.data.totalCount || 0); 
    } catch (err) {
      console.error("خطا در گرفتن داده‌ها:", err);
    } finally {
      const elapsed = Date.now() - start;
      const wait = Math.max(1000 - elapsed, 0);
      setTimeout(() => setLoading(false), wait);
    }
  }, [url, page]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, page, setPage, totalPages, totalCount, refreshData: fetchData }; // ✅ اضافه کردیم
};

export default usePaginatedFetch;
