exports.split = (buffer, parts) => {
  const chunkSize = Math.ceil(buffer.length / parts);
  return Array.from({ length: parts }, (_, i) =>
    buffer.slice(i * chunkSize, (i + 1) * chunkSize)
  );
};

exports.combine = (buffers) => {
  return Buffer.concat(buffers);
};
