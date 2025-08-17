//? 🔵Required Modules
const sanitizeHtml = require('sanitize-html');

const allowed = {
  allowedTags: [ 'b', 'i', 'em', 'strong', 'u', 'br', 'ul', 'ol', 'li', 'p', 'span' ],
  allowedAttributes: {
    'span': ['style']
  },
  allowedSchemes: [ 'http', 'https', 'mailto' ],
  allowProtocolRelative: false
};

//* 🟢Sanitize Middleware
function deepSanitize(value) {
  if (typeof value === 'string') {
    return sanitizeHtml(value, allowed);
  }
  if (Array.isArray(value)) {
    return value.map(v => deepSanitize(v));
  }
  if (value && typeof value === 'object') {
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