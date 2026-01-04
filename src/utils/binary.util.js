// exports.dataToBinary = (data) =>
//   Buffer.from(data)
//     .toString('binary')
//     .split('')
//     .map(c => c.charCodeAt(0).toString(2).padStart(8, '0'))
//     .join('');

// exports.binaryToBuffer = (binary) => {
//   const bytes = [];
//   for (let i = 0; i < binary.length; i += 8) {
//     bytes.push(parseInt(binary.slice(i, i + 8), 2));
//   }
//   return Buffer.from(bytes);
// };
/**
 * Optimized binary utilities for steganography
 * Uses array join instead of string concatenation to avoid memory issues
 */

/**
 * Convert buffer to binary string (optimized)
 * @param {Buffer} buffer
 * @returns {string}
 */
exports.dataToBinary = (buffer) => {
  const length = buffer.length;
  const result = new Array(length);
  
  for (let i = 0; i < length; i++) {
    // Convert byte to 8-bit binary string
    result[i] = buffer[i].toString(2).padStart(8, '0');
  }
  
  return result.join('');
};

/**
 * Convert binary string to buffer
 * @param {string} binary
 * @returns {Buffer}
 */
exports.binaryToBuffer = (binary) => {
  const byteCount = Math.ceil(binary.length / 8);
  const buffer = Buffer.alloc(byteCount);
  
  for (let i = 0; i < byteCount; i++) {
    const byte = binary.slice(i * 8, (i + 1) * 8).padEnd(8, '0');
    buffer[i] = parseInt(byte, 2);
  }
  
  return buffer;
};