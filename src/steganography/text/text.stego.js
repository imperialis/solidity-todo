const { dataToBinary, binaryToBuffer } = require('../../utils/binary.util');

exports.encode = (coverText, secret) => {
  const binary = dataToBinary(secret);
  return (
    coverText +
    binary.replace(/0/g, '\u200B').replace(/1/g, '\u200C') +
    '\u200D'
  );
};

exports.decode = (encodedText) => {
  const match = encodedText.match(/[\u200B\u200C]+(?=\u200D)/);
  if (!match) return null;
  return binaryToBuffer(
    match[0].replace(/\u200B/g, '0').replace(/\u200C/g, '1')
  );
};
