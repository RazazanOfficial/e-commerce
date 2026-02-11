//? 🔵Required Modules
const sanitizeHtml = require("sanitize-html");

// نکته امنیتی: خروجی HTML در سایت مشتری نمایش داده می‌شود؛ بنابراین باید امن باشد.
// این لیست برای متن‌نویسی محصول/FAQ طراحی شده (حداقلِ لازم + ایمن).
const allowed = {
  allowedTags: [
    "b",
    "i",
    "em",
    "strong",
    "u",
    "s",
    "br",
    "p",
    "div",
    "span",
    "ul",
    "ol",
    "li",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "blockquote",
    "code",
    "pre",
    "hr",
    "table",
    "thead",
    "tbody",
    "tr",
    "th",
    "td",
    "a",
    "img",
    "mark",
    "small",
    "sub",
    "sup",
  ],
  allowedAttributes: {
    a: ["href", "target", "rel", "title"],
    img: ["src", "alt", "title", "width", "height"],
    span: ["style"],
    p: ["style"],
    div: ["style"],
    table: ["style"],
    th: ["colspan", "rowspan", "style"],
    td: ["colspan", "rowspan", "style"],
  },
  // فقط پروتکل‌های امن
  allowedSchemes: ["http", "https", "mailto"],
  allowProtocolRelative: false,

  // جلوگیری از لینک‌های ناامن
  transformTags: {
    a: (tagName, attribs) => {
      const out = { ...attribs };
      // اگر target باز کرد، rel امن هم اضافه کن
      if (out.target === "_blank") {
        out.rel = "noopener noreferrer nofollow";
      } else if (out.rel) {
        // اگر rel داشت، noopener را تضمین کن
        const rel = String(out.rel).toLowerCase();
        if (!rel.includes("noopener")) out.rel = (out.rel + " noopener").trim();
        if (!rel.includes("noreferrer")) out.rel = (out.rel + " noreferrer").trim();
      }
      return { tagName, attribs: out };
    },
    img: (tagName, attribs) => {
      const out = { ...attribs };
      // حداقل alt را نگه داریم
      if (!out.alt) out.alt = "";
      return { tagName, attribs: out };
    },
  },

  // محدودسازی سبک‌ها برای جلوگیری از CSS injection
  allowedStyles: {
    "*": {
      color: [/^#([0-9a-f]{3}){1,2}$/i],
      "background-color": [/^#([0-9a-f]{3}){1,2}$/i],
      "text-align": [/^left$/, /^right$/, /^center$/, /^justify$/],
      "font-weight": [/^normal$/, /^bold$/, /^bolder$/, /^lighter$/, /^[1-9]00$/],
      "text-decoration": [/^none$/, /^underline$/, /^line-through$/],
      "font-style": [/^normal$/, /^italic$/],
    },
  },
};

//* 🟢Sanitize Middleware
function deepSanitize(value) {
  if (typeof value === "string") {
    return sanitizeHtml(value, allowed);
  }
  if (Array.isArray(value)) {
    return value.map((v) => deepSanitize(v));
  }
  if (value && typeof value === "object") {
    const out = {};
    for (const k in value) {
      out[k] = deepSanitize(value[k]);
    }
    return out;
  }
  return value;
}

//? 🔵Export Controller
module.exports = function sanitizeMid(req, res, next) {
  if (req.body) req.body = deepSanitize(req.body);
  if (req.query) req.query = deepSanitize(req.query);
  if (req.params) req.params = deepSanitize(req.params);
  next();
};
