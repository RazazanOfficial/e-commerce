import axios from "axios";
import { useEffect, useState } from "react";

const usePaginatedFetchHook = (endPoint, options = {}) => {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const pageSize = options.pageSize || 10;

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);

      try {
        const response = await axios.get(endPoint, {
          params: { page, limit: pageSize },
          withCredentials: true,
        });
        if (response.data?.data) {
          setData(response.data.data);
          setTotalPages(response.data.totalPages || 1);
        } else if (Array.isArray(response.data)) setData(response.data);
      } catch (error) {
        console.log('error in usePaginatedFetch:", error');
      }
      setIsLoading(false);
    };
    fetchData();
  }, [endPoint, page]);
  return { data, isLoading, page, setPage, totalPages };
};

export default usePaginatedFetchHook;
