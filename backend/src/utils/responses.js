const success = (res, data = {}, message, statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    data,
    ...(message ? { message } : {}),
  });
};

module.exports = {
  success,
};
