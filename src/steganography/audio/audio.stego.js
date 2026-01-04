
// const { dataToBinary, binaryToBuffer } = require('../../utils/binary.util');

// const WAV_HEADER_SIZE = 44;

// const MODES = {
//   TEXT: 0x01,
//   IMAGE: 0x02,
//   AUDIO: 0x03
// };

// /**
//  * Encode payload into WAV audio buffer
//  * @param {Buffer} audioBuffer - WAV audio
//  * @param {{ mode: number, payload: Buffer }} input
//  */
// exports.encode = (audioBuffer, input) => {
//   const { mode, payload } = input;

//   if (!Buffer.isBuffer(payload)) {
//     throw new Error('Payload must be a Buffer');
//   }

//   // Header: [mode (1 byte)] [payload length (4 bytes)]
//   const header = Buffer.alloc(5);
//   header.writeUInt8(mode, 0);
//   header.writeUInt32BE(payload.length, 1);

//   const combined = Buffer.concat([header, payload]);
//   const binary = dataToBinary(combined);

//   const output = Buffer.from(audioBuffer);

//   if (binary.length > output.length - WAV_HEADER_SIZE) {
//     throw new Error('Audio too small to hold payload');
//   }

//   for (let i = 0; i < binary.length; i++) {
//     const idx = WAV_HEADER_SIZE + i;
//     output[idx] = (output[idx] & 0xfe) | Number(binary[i]);
//   }

//   return output;
// };

// /**
//  * Decode payload from WAV audio buffer
//  * @param {Buffer} audioBuffer
//  */
// exports.decode = (audioBuffer) => {
//   let headerBits = '';
//   let offset = WAV_HEADER_SIZE;

//   // Read 5-byte header (40 bits)
//   while (headerBits.length < 40) {
//     headerBits += (audioBuffer[offset] & 1).toString();
//     offset++;
//   }

//   const header = binaryToBuffer(headerBits);
//   const mode = header.readUInt8(0);
//   const length = header.readUInt32BE(1);

//   // Read payload bits
//   let payloadBits = '';
//   for (let i = 0; i < length * 8; i++) {
//     payloadBits += (audioBuffer[offset + i] & 1).toString();
//   }

//   const payload = binaryToBuffer(payloadBits);

//   return { mode, payload };
// };

// exports.MODES = MODES;

/**
 * Memory-efficient audio steganography
 * Processes bits directly without converting to strings
 */

const WAV_HEADER_SIZE = 44;

const MODES = {
  TEXT: 0x01,
  IMAGE: 0x02,
  AUDIO: 0x03
};

/**
 * Encode payload into WAV audio buffer (memory efficient)
 * @param {Buffer} audioBuffer - WAV audio
 * @param {{ mode: number, payload: Buffer }} input
 */
exports.encode = (audioBuffer, input) => {
  const { mode, payload } = input;

  if (!Buffer.isBuffer(payload)) {
    throw new Error('Payload must be a Buffer');
  }

  // Header: [mode (1 byte)] [payload length (4 bytes)]
  const header = Buffer.alloc(5);
  header.writeUInt8(mode, 0);
  header.writeUInt32BE(payload.length, 1);

  const combined = Buffer.concat([header, payload]);
  const output = Buffer.from(audioBuffer);

  const totalBits = combined.length * 8;
  const availableBits = (output.length - WAV_HEADER_SIZE) * 8;

  if (totalBits > availableBits) {
    throw new Error(
      `Audio too small to hold payload. Need ${totalBits} bits, have ${availableBits} bits available.`
    );
  }

  // Process bit by bit without creating string
  for (let bitIndex = 0; bitIndex < totalBits; bitIndex++) {
    const byteIndex = Math.floor(bitIndex / 8);
    const bitPosition = 7 - (bitIndex % 8);
    
    // Extract bit from combined buffer
    const bit = (combined[byteIndex] >> bitPosition) & 1;
    
    // Embed bit in audio LSB
    const audioIndex = WAV_HEADER_SIZE + bitIndex;
    output[audioIndex] = (output[audioIndex] & 0xFE) | bit;
  }

  return output;
};

/**
 * Decode payload from WAV audio buffer (memory efficient)
 * @param {Buffer} audioBuffer
 */
exports.decode = (audioBuffer) => {
  let offset = WAV_HEADER_SIZE;

  // Read 5-byte header (40 bits)
  const headerBuffer = Buffer.alloc(5);
  for (let i = 0; i < 5; i++) {
    let byte = 0;
    for (let bit = 0; bit < 8; bit++) {
      const lsb = audioBuffer[offset] & 1;
      byte = (byte << 1) | lsb;
      offset++;
    }
    headerBuffer[i] = byte;
  }

  const mode = headerBuffer.readUInt8(0);
  const length = headerBuffer.readUInt32BE(1);

  // Validate length
  const maxLength = Math.floor((audioBuffer.length - WAV_HEADER_SIZE - 40) / 8);
  if (length > maxLength) {
    throw new Error(`Invalid payload length: ${length} (max: ${maxLength})`);
  }

  // Read payload bits
  const payload = Buffer.alloc(length);
  for (let i = 0; i < length; i++) {
    let byte = 0;
    for (let bit = 0; bit < 8; bit++) {
      const lsb = audioBuffer[offset] & 1;
      byte = (byte << 1) | lsb;
      offset++;
    }
    payload[i] = byte;
  }

  return { mode, payload };
};

exports.MODES = MODES;