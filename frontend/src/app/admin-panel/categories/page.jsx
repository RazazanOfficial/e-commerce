"use client";

import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import backApis from "@/common/inedx";
import { toast } from "react-toastify";
import Spinner from "@/components/Spinner";
import {
  Plus,
  Edit,
  Trash2,
  ChevronRight,
  ChevronDown,
  Folder,
  FolderOpen,
  CheckCircle2,
  XCircle,
  ArrowUp,
  ArrowDown,
  Search,
  Link2,
} from "lucide-react";

const slugify = (str = "") =>
  str
    .toString()
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "")
    .replace(/--+/g, "-")
    .replace(/^-+|-+$/g, "");

const buildTree = (flat) => {
  const map = new Map();
  flat.forEach((c) => map.set(c._id, { ...c, children: [] }));
  const roots = [];
  flat.forEach((c) => {
    const pid = c.parent?._id || c.parent || null;
    if (pid && map.has(pid)) map.get(pid).children.push(map.get(c._id));
    else roots.push(map.get(c._id));
  });
  const sortRec = (nodes) => {
    nodes.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
    nodes.forEach((n) => sortRec(n.children));
  };
  sortRec(roots);
  return roots;
};

const flattenForSelect = (tree, depth = 0, arr = []) => {
  tree.forEach((n) => {
    arr.push({ _id: n._id, name: `${"— ".repeat(depth)}${n.name}` });
    flattenForSelect(n.children, depth + 1, arr);
  });
  return arr;
};

function Modal({ open, onClose, title, children, footer }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="w-full sm:max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl m-3 sm:m-0 overflow-hidden shadow-xl z-50">
        <div className="bg-gradient-to-l from-slate-800 to-indigo-900 px-4 py-3">
          <h3 className="text-white font-bold">{title}</h3>
        </div>
        <div className="p-4">{children}</div>
        {footer && (
          <div className="p-3 border-t border-slate-700 bg-slate-900">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

function CategoryFormModal({
  open,
  onClose,
  onSubmit,
  initial,
  allCategoriesTree,
}) {
  const isEdit = Boolean(initial?._id);
  const [name, setName] = useState(initial?.name || "");
  const [slug, setSlug] = useState(initial?.slug || "");
  const [description, setDescription] = useState(initial?.description || "");
  const [image, setImage] = useState(initial?.image || "");
  const [imageAlt, setImageAlt] = useState(initial?.imageAlt || "");
  const [isActive, setIsActive] = useState(initial?.isActive ?? true);
  const [parent, setParent] = useState(
    initial?.parent?._id || initial?.parent || ""
  );
  const [metaTitle, setMetaTitle] = useState(initial?.metaTitle || "");
  const [metaDescription, setMetaDescription] = useState(
    initial?.metaDescription || ""
  );
  const [keywords, setKeywords] = useState(
    Array.isArray(initial?.keywords)
      ? initial.keywords.join(", ")
      : initial?.keywords || ""
  );

  useEffect(() => {
    if (!isEdit) setSlug(slugify(name));
  }, [name]);

  const options = useMemo(() => {
    const tree = JSON.parse(JSON.stringify(allCategoriesTree || []));
    if (isEdit) {
      const cleaned = (function removeSelfAndDesc(nodeList) {
        return (nodeList || []).filter((n) => {
          if (n._id === initial._id) return false;
          n.children = removeSelfAndDesc(n.children);
          return true;
        });
      })(tree);
      return flattenForSelect(cleaned);
    }
    return flattenForSelect(tree);
  }, [allCategoriesTree, isEdit, initial]);

  const handleSubmit = () => {
    if (!name?.trim()) return toast.error("نام دسته را وارد کنید");
    if (image && !/^https?:\/\//i.test(image))
      return toast.error("آدرس تصویر باید URL معتبر باشد");
    onSubmit({
      ...(isEdit ? { id: initial._id } : {}),
      name: name.trim(),
      slug: slug?.trim() || slugify(name),
      description,
      image: image?.trim() || undefined,
      imageAlt: imageAlt?.trim() || name.trim(),
      isActive,
      parent: parent || undefined,
      metaTitle: metaTitle?.trim() || name.trim(),
      metaDescription: metaDescription?.trim() || description?.trim(),
      keywords: keywords
        ? keywords
            .split(",")
            .map((k) => k.trim())
            .filter(Boolean)
        : undefined,
    });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? "ویرایش دسته‌بندی" : "ایجاد دسته‌بندی"}
      footer={
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 text-gray-200 hover:bg-slate-700 transition"
          >
            انصراف
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition"
          >
            {isEdit ? "ذخیره تغییرات" : "ایجاد"}
          </button>
        </div>
      }
    >
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-gray-300 mb-1">نام *</label>
          <input
            className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="مثل: موبایل"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-300 mb-1">اسلاگ</label>
          <div className="flex items-center gap-2">
            <input
              className="flex-1 rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none"
              value={slug}
              onChange={(e) => setSlug(slugify(e.target.value))}
              placeholder="mobile-phones"
            />
            <span className="text-xs text-gray-400 flex items-center gap-1">
              <Link2 className="w-4 h-4" /> {slug || slugify(name || "")}
            </span>
          </div>
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm text-gray-300 mb-1">توضیحات</label>
          <textarea
            className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm text-gray-300 mb-1">
            تصویر (URL)
          </label>
          <input
            className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none"
            value={image}
            onChange={(e) => setImage(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm text-gray-300 mb-1">
            متن جایگزین تصویر
          </label>
          <input
            className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none"
            value={imageAlt}
            onChange={(e) => setImageAlt(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm text-gray-300 mb-1">والد</label>
          <select
            className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none"
            value={parent}
            onChange={(e) => setParent(e.target.value)}
          >
            <option value="">— بدون والد (دسته سطح ۱)</option>
            {options.map((o) => (
              <option key={o._id} value={o._id}>
                {o.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-3">
          <input
            id="isActive"
            type="checkbox"
            className="w-5 h-5 accent-indigo-600"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
          />
          <label htmlFor="isActive" className="text-sm text-gray-300">
            فعال باشد
          </label>
        </div>
        <div>
          <label className="block text-sm text-gray-300 mb-1">Meta Title</label>
          <input
            className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none"
            value={metaTitle}
            onChange={(e) => setMetaTitle(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm text-gray-300 mb-1">
            Meta Description
          </label>
          <input
            className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none"
            value={metaDescription}
            onChange={(e) => setMetaDescription(e.target.value)}
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm text-gray-300 mb-1">
            کلمات کلیدی (با ویرگول جدا کنید)
          </label>
          <input
            className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none"
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
            placeholder="گوشی, موبایل, سامسونگ"
          />
        </div>
      </div>
    </Modal>
  );
}

function ConfirmDeleteModal({ open, onClose, onConfirm, category }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="حذف دسته‌بندی"
      footer={
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 text-gray-200 hover:bg-slate-700 transition"
          >
            انصراف
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition"
          >
            حذف
          </button>
        </div>
      }
    >
      <p className="text-gray-300">
        آیا از حذف{" "}
        <span className="text-white font-semibold">{category?.name}</span> مطمئن
        هستید؟
      </p>
      <p className="text-gray-400 mt-2 text-sm">
        اگر زیر‌دسته داشته باشد، بک‌اند مانع حذف می‌شود.
      </p>
    </Modal>
  );
}

function Row({
  node,
  depth = 0,
  onToggleExpand,
  expanded,
  onAddChild,
  onEdit,
  onDelete,
  onToggleActive,
  onMoveUp,
  onMoveDown,
}) {
  const hasChildren = (node.children || []).length > 0;
  const padRight = 12 + depth * 20;
  return (
    <div
      className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-3 px-3 sm:px-4 py-2 border-b border-slate-700/60 hover:bg-indigo-600/10"
      style={{ paddingRight: padRight }}
    >
      <div className="flex items-center gap-2">
        {hasChildren ? (
          <button
            onClick={() => onToggleExpand(node._id)}
            className="p-1 rounded hover:bg-slate-700/60"
            title={expanded ? "بستن" : "بازکردن"}
          >
            {expanded ? (
              <ChevronDown className="w-4 h-4 text-gray-300" />
            ) : (
              <ChevronRight className="w-4 h-4 text-gray-300" />
            )}
          </button>
        ) : (
          <span className="w-5" />
        )}
        <div className="w-6 h-6 rounded bg-slate-800 border border-slate-700 flex items-center justify-center">
          {expanded ? (
            <FolderOpen className="w-3.5 h-3.5 text-indigo-400" />
          ) : (
            <Folder className="w-3.5 h-3.5 text-indigo-400" />
          )}
        </div>
        <div className="min-w-0">
          <div className="text-white font-medium truncate" title={node.name}>
            {node.name}
          </div>
          <div className="text-xs text-gray-400 truncate">/{node.slug}</div>
        </div>
      </div>

      <div className="flex items-center gap-1 justify-self-end">
        <button
          className="p-1.5 rounded-lg hover:bg-slate-700/60"
          onClick={() => onMoveUp(node)}
          title="بالا"
        >
          <ArrowUp className="w-4 h-4 text-gray-300" />
        </button>
        <button
          className="p-1.5 rounded-lg hover:bg-slate-700/60"
          onClick={() => onMoveDown(node)}
          title="پایین"
        >
          <ArrowDown className="w-4 h-4 text-gray-300" />
        </button>
      </div>

      <div className="justify-self-end">
        <button
          onClick={() => onToggleActive(node)}
          className={`px-2 py-1 rounded-lg text-sm flex items-center gap-1 ${
            node.isActive
              ? "bg-green-900/40 text-green-300 border border-green-800"
              : "bg-slate-800 text-gray-300 border border-slate-700"
          }`}
          title="فعال/غیرفعال"
        >
          {node.isActive ? (
            <CheckCircle2 className="w-4 h-4" />
          ) : (
            <XCircle className="w-4 h-4" />
          )}
          {node.isActive ? "فعال" : "غیرفعال"}
        </button>
      </div>

      <div className="justify-self-end flex items-center gap-2">
        <button
          onClick={() => onAddChild(node)}
          className="p-2 rounded-lg bg-slate-800 text-gray-300 hover:bg-indigo-600 hover:text-white transition"
          title="زیر‌دسته"
        >
          <Plus className="w-4 h-4" />
        </button>
        <button
          onClick={() => onEdit(node)}
          className="p-2 rounded-lg bg-slate-800 text-gray-300 hover:bg-blue-600 hover:text-white transition"
          title="ویرایش"
        >
          <Edit className="w-4 h-4" />
        </button>
        <button
          onClick={() => onDelete(node)}
          className="p-2 rounded-lg bg-slate-800 text-gray-300 hover:bg-red-600 hover:text-white transition"
          title="حذف"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export default function CategoriesPage() {
  const [raw, setRaw] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(new Set());
  const [q, setQ] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editCat, setEditCat] = useState(null);
  const [deleteCat, setDeleteCat] = useState(null);

  const fetchAll = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(backApis.getAllCategories.url, {
        withCredentials: true,
      });
      setRaw(data?.data || []);
    } catch {
      toast.error("خطا در دریافت دسته‌ها");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const tree = useMemo(() => buildTree(raw || []), [raw]);

  const filteredTree = useMemo(() => {
    if (!q.trim()) return tree;
    const match = (n) =>
      n.name?.toLowerCase().includes(q.toLowerCase()) ||
      n.slug?.toLowerCase().includes(q.toLowerCase());
    const dfs = (nodes) =>
      nodes
        .map((n) => {
          const children = dfs(n.children || []);
          if (match(n) || children.length) return { ...n, children };
          return null;
        })
        .filter(Boolean);
    return dfs(tree);
  }, [tree, q]);

  const toggleExpand = (id) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const openAll = () => {
    const ids = new Set();
    const walk = (nodes) =>
      nodes.forEach((n) => {
        ids.add(n._id);
        walk(n.children || []);
      });
    walk(tree);
    setExpanded(ids);
  };
  const closeAll = () => setExpanded(new Set());

  const handleCreate = async (payload) => {
    try {
      await axios.post(backApis.createCategory.url, payload, {
        withCredentials: true,
      });
      toast.success("دسته‌بندی ایجاد شد");
      setCreateOpen(false);
      fetchAll();
    } catch (e) {
      toast.error(e?.response?.data?.message || "ایجاد ناموفق بود");
    }
  };

  const handleEdit = async (payload) => {
    try {
      const { url, method } = backApis.updateCategory(payload.id);
      await axios({ url, method, data: payload, withCredentials: true });
      toast.success("تغییرات ذخیره شد");
      setEditCat(null);
      fetchAll();
    } catch (e) {
      toast.error(e?.response?.data?.message || "ویرایش ناموفق بود");
    }
  };

  const handleDelete = async () => {
    try {
      const { url, method } = backApis.deleteCategory(deleteCat._id);
      await axios({ url, method, withCredentials: true });
      toast.success("دسته حذف شد");
      setDeleteCat(null);
      fetchAll();
    } catch (e) {
      toast.error(e?.response?.data?.message || "حذف ناموفق بود");
    }
  };

  const handleToggleActive = async (node) => {
    try {
      const { url, method } = backApis.updateCategory(node._id);
      await axios({
        url,
        method,
        data: { isActive: !node.isActive },
        withCredentials: true,
      });
      setRaw((prev) =>
        prev.map((c) =>
          c._id === node._id ? { ...c, isActive: !node.isActive } : c
        )
      );
    } catch {
      toast.error("تغییر وضعیت ناموفق بود");
    }
  };

  const move = async (node, dir) => {
    const siblings = (raw || [])
      .filter(
        (c) =>
          (c.parent?._id || c.parent || null) ===
          (node.parent?._id || node.parent || null)
      )
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
    const idx = siblings.findIndex((s) => s._id === node._id);
    const target = dir === "up" ? siblings[idx - 1] : siblings[idx + 1];
    if (!target) return;
    try {
      const { url, method } = backApis.updateCategory(node._id);
      await axios({
        url,
        method,
        data: { sortOrder: target.sortOrder },
        withCredentials: true,
      });
      fetchAll();
    } catch {
      toast.error("جابجایی ترتیب ناموفق بود");
    }
  };

  return (
    <div className="py-8">
      <div className="mb-6 flex flex-col lg:flex-row items-center justify-between gap-4">
        <div className="w-full">
          <div className="rounded-2xl overflow-hidden border border-slate-700 bg-slate-900">
            <div className="bg-gradient-to-l from-slate-800 to-indigo-900 p-5">
              <h1 className="text-white text-2xl font-bold">
                مدیریت دسته‌بندی‌ها
              </h1>
              <p className="text-gray-300 mt-1">
                ایجاد، ویرایش و سازمان‌دهی دسته‌ها به‌صورت درختی
              </p>
            </div>

            <div className="p-4 flex flex-col md:flex-row items-stretch md:items-center gap-3 md:gap-4">
              <div className="relative flex-1">
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="جستجو بر اساس نام/اسلاگ..."
                  className="w-full pl-10 pr-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                />
                <Search className="w-4 h-4 absolute left-2.5 top-2.5 text-gray-400" />
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={openAll}
                  className="px-3 py-2 rounded-lg bg-slate-800 text-gray-200 hover:bg-slate-700"
                >
                  باز کردن همه
                </button>
                <button
                  onClick={closeAll}
                  className="px-3 py-2 rounded-lg bg-slate-800 text-gray-200 hover:bg-slate-700"
                >
                  بستن همه
                </button>
                <button
                  onClick={() => setCreateOpen(true)}
                  className="px-3 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  دسته جدید
                </button>
              </div>
            </div>

            <div className="border-t border-slate-700">
              {loading ? (
                <div className="p-8 flex items-center justify-center">
                  <Spinner />
                </div>
              ) : (
                <div className="divide-y divide-slate-700/60">
                  <div className="grid grid-cols-[1fr_auto_auto_auto] gap-3 px-4 py-3 bg-slate-800/60 text-gray-300">
                    <div>نام / اسلاگ</div>
                    <div className="justify-self-end">ترتیب</div>
                    <div className="justify-self-end">وضعیت</div>
                    <div className="justify-self-end">عملیات</div>
                  </div>

                  <div className="bg-slate-900">
                    {filteredTree.length === 0 && (
                      <div className="p-6 text-center text-gray-400">
                        دسته‌ای یافت نشد
                      </div>
                    )}

                    {filteredTree.map((root) => {
                      const renderNode = (n, depth = 0) => {
                        const open = expanded.has(n._id) || q.length > 0;
                        return (
                          <div key={n._id}>
                            <Row
                              node={n}
                              depth={depth}
                              expanded={open}
                              onToggleExpand={toggleExpand}
                              onAddChild={(node) =>
                                setCreateOpen({ parent: node })
                              }
                              onEdit={(node) => setEditCat(node)}
                              onDelete={(node) => setDeleteCat(node)}
                              onToggleActive={handleToggleActive}
                              onMoveUp={(node) => move(node, "up")}
                              onMoveDown={(node) => move(node, "down")}
                            />
                            {open &&
                              (n.children || []).map((c) =>
                                renderNode(c, depth + 1)
                              )}
                          </div>
                        );
                      };
                      return renderNode(root, 0);
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <CategoryFormModal
        open={Boolean(createOpen)}
        onClose={() => setCreateOpen(false)}
        onSubmit={(payload) => {
          if (createOpen?.parent) payload.parent = createOpen.parent._id;
          handleCreate(payload);
        }}
        allCategoriesTree={tree}
      />

      <CategoryFormModal
        open={Boolean(editCat)}
        onClose={() => setEditCat(null)}
        onSubmit={handleEdit}
        initial={editCat || undefined}
        allCategoriesTree={tree}
      />

      <ConfirmDeleteModal
        open={Boolean(deleteCat)}
        onClose={() => setDeleteCat(null)}
        onConfirm={handleDelete}
        category={deleteCat}
      />
    </div>
  );
}
