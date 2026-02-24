import { useEffect, useState, useCallback } from "react";
import apiClient from "@/common/apiClient";

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
      const res = await apiClient.get(url, {
        params: { page, limit: 10 },
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

  return {
    data,
    loading,
    // backward compatible alias
    isLoading: loading,
    page,
    setPage,
    totalPages,
    totalCount,
    refreshData: fetchData,
  };
};

export default usePaginatedFetch;
