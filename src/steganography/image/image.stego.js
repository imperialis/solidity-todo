// const { dataToBinary, binaryToBuffer } = require('../../utils/binary.util');

// /**
//  * Encode secret buffer into image pixel data
//  * @param {Buffer} imageBuffer - raw image buffer
//  * @param {Buffer} secretBuffer
//  * @param {Function} decoder - image decoder (e.g. sharp)
//  * @param {Function} encoder - image encoder
//  */
// exports.encode = async (imageBuffer, secretBuffer, decoder, encoder) => {
//   const binary = dataToBinary(secretBuffer) + '00000000'; // terminator

//   const { data, info } = await decoder(imageBuffer);
//   if (binary.length > data.length)
//     throw new Error('Image too small for payload');

//   for (let i = 0; i < binary.length; i++) {
//     data[i] = (data[i] & 0xfe) | Number(binary[i]);
//   }

//   return encoder(data, info);
// };

// exports.decode = async (imageBuffer, decoder) => {
//   const { data } = await decoder(imageBuffer);

//   let bits = '';
//   for (let i = 0; i < data.length; i++) {
//     bits += (data[i] & 1).toString();
//     if (bits.endsWith('00000000')) break;
//   }

//   return binaryToBuffer(bits.slice(0, -8));
// };
const { dataToBinary, binaryToBuffer } = require('../../utils/binary.util');

const MODES = {
  TEXT: 0x01,
  IMAGE: 0x02
};

/**
 * Encode text or image into image pixels
 * @param {Buffer} imageBuffer
 * @param {{ mode: number, payload: Buffer }} input
 * @param {Function} decoder
 * @param {Function} encoder
 */
exports.encode = async (imageBuffer, input, decoder, encoder) => {
  const { mode, payload } = input;

  if (!Buffer.isBuffer(payload)) {
    throw new Error('Payload must be a Buffer');
  }

  // Header: [mode (1 byte)] [payload length (4 bytes)]
  const header = Buffer.alloc(5);
  header.writeUInt8(mode, 0);
  header.writeUInt32BE(payload.length, 1);

  const combined = Buffer.concat([header, payload]);
  const binary = dataToBinary(combined);

  const { data, info } = await decoder(imageBuffer);

  if (binary.length > data.length) {
    throw new Error('Image too small to hold payload');
  }

  for (let i = 0; i < binary.length; i++) {
    data[i] = (data[i] & 0xfe) | Number(binary[i]);
  }

  return encoder(data, info);
};

/**
 * Decode hidden data from image
 * @param {Buffer} imageBuffer
 * @param {Function} decoder
 */
exports.decode = async (imageBuffer, decoder) => {
  const { data } = await decoder(imageBuffer);

  // Read header (5 bytes = 40 bits)
  let headerBits = '';
  let offset = 0;

  while (headerBits.length < 40) {
    headerBits += (data[offset] & 1).toString();
    offset++;
  }

  const header = binaryToBuffer(headerBits);
  const mode = header.readUInt8(0);
  const length = header.readUInt32BE(1);

  // Read payload
  let payloadBits = '';
  for (let i = 0; i < length * 8; i++) {
    payloadBits += (data[offset + i] & 1).toString();
  }

  const payload = binaryToBuffer(payloadBits);

  return { mode, payload };
};

exports.MODES = MODES;
