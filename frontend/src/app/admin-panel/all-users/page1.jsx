"use client";

import usePaginatedFetchHook from "@/hooks/usePaginatedFetchHook";
import backApis from "@/common/inedx";
import Spinner from "@/components/Spinner";

const AllUsersPage = () => {
  const {
    data: users,
    loading,
    page,
    setPage,
    totalPages,
  } = usePaginatedFetchHook(backApis.allUsers.url);

  return (
    <div className="p-6 min-h-screen bg-gradient-to-t from-green-100 to-emerald-300 rounded-2xl shadow-2xl border border-emerald-500">
      <h1 className="text-3xl font-bold mb-10 text-green-700 text-center">
        لیست کاربران
      </h1>

      {loading ? (
        <Spinner />
      ) : (
        <div className="max-w-5xl mx-auto">
          <div className="backdrop-blur-md bg-white/30 border border-white/50 rounded-xl shadow-lg p-6">
            <div className="overflow-x-auto">
              <table className="min-w-full border border-gray-200 rounded-md overflow-hidden">
                <thead className="bg-green-900 text-white">
                  <tr>
                    <th className="text-center py-3 px-4">نام</th>
                    <th className="text-center py-3 px-4">ایمیل</th>
                    <th className="text-center py-3 px-4">شماره تلفن</th>
                    <th className="text-center py-3 px-4">نقش</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr
                      key={user._id}
                      className="bg-emerald-100 border-t hover:bg-emerald-300 hover:text-slate-950 hover:font-bold hover:cursor-pointer"
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
            <div className="flex justify-center mt-6 gap-4">
              <button
                onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                disabled={page === 1}
                className="bg-gray-200 px-4 py-2 rounded-lg shadow disabled:opacity-50 cursor-pointer"
              >
                قبلی
              </button>
              <span className="px-4 py-2 font-semibold">{page} / {totalPages}</span>
              <button
                onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={page === totalPages}
                className="bg-gray-200 px-4 py-2 rounded-lg shadow disabled:opacity-50 cursor-pointer"
              >
                بعدی
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AllUsersPage;
