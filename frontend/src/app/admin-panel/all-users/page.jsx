"use client";

import usePaginatedFetchHook from "@/hooks/usePaginatedFetchHook";
import backApis from "@/common/inedx";

const AllUsersPage = () => {
  const {
    data: users,
    loading,
    page,
    setPage,
    totalPages,
  } = usePaginatedFetchHook(backApis.allUsers.url);

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-10 text-green-700 text-center">
        لیست کاربران
      </h1>

      {loading ? (
        <p className="text-center text-gray-500">در حال بارگذاری...</p>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-200 shadow">
              <thead className="bg-green-900 rounded-t-2xl">
                <tr className="text-white">
                  <th className="text-center py-2 px-4">نام</th>
                  <th className="text-center py-2 px-4">ایمیل</th>
                  <th className="text-center py-2 px-4">شماره تلفن</th>
                  <th className="text-center py-2 px-4">نقش</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr
                    key={user._id}
                    className="border-t hover:bg-emerald-300 bg-emerald-100 hover:text-slate-950 hover:font-bold hover:cursor-pointer"
                  >
                    <td className="text-center py-2 px-4">{user.name}</td>
                    <td className="text-center py-2 px-4">{user.email}</td>
                    <td className="text-center py-2 px-4">{user.phone}</td>
                    <td className="text-center py-2 px-4">{user.role}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div className="flex justify-center mt-4 gap-2">
            <button
              onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
              disabled={page === 1}
              className="bg-gray-200 px-3 py-1 rounded disabled:opacity-50"
            >
              قبلی
            </button>
            <span className="px-3 py-1">{page} / {totalPages}</span>
            <button
              onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={page === totalPages}
              className="bg-gray-200 px-3 py-1 rounded disabled:opacity-50"
            >
              بعدی
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default AllUsersPage;
