exports.ok = (res, data) => res.json({ success: true, data });
exports.fail = (res, error, code = 400) =>
  res.status(code).json({ success: false, error });
