// const router = require('express').Router();
// const auth = require('../auth/auth.middleware');
// const stego = require('../steganography/text/text.stego');

// router.post('/encode', auth, (req, res) => {
//   const { coverText, secretMessage } = req.body;
//   const encoded = stego.encode(coverText, Buffer.from(secretMessage));
//   res.json({ encoded });
// });

// router.post('/decode', auth, (req, res) => {
//   const decoded = stego.decode(req.body.encodedText);
//   if (!decoded) return res.status(404).json({ error: 'No hidden data' });
//   res.json({ secretMessage: decoded.toString() });
// });

// module.exports = router;
const router = require('express').Router();
const auth = require('../auth/auth.middleware');
const stego = require('../steganography/text/text.stego');

/**
 * ENCODE - Text steganography
 * Hides secret message inside cover text using Unicode zero-width characters
 * or whitespace manipulation
 */
router.post('/encode', auth, (req, res) => {
  try {
    const { coverText, secretMessage } = req.body;
    const format = req.query.format || req.body.format || 'json'; // Text always returns text, so JSON default makes sense

    if (!coverText || !secretMessage) {
      return res.status(400).json({
        success: false,
        error: 'coverText and secretMessage are required'
      });
    }

    const encoded = stego.encode(coverText, Buffer.from(secretMessage, 'utf8'));

    // Calculate metadata
    const coverLength = coverText.length;
    const secretLength = secretMessage.length;
    const encodedLength = encoded.length;
    const overhead = encodedLength - coverLength;
    const overheadPercent = ((overhead / coverLength) * 100).toFixed(2);

    // Enhanced JSON Response
    return res.json({
      success: true,
      operation: 'encode',
      input: {
        coverText: {
          length: coverLength,
          preview: coverText.substring(0, 50) + (coverText.length > 50 ? '...' : '')
        },
        secretMessage: {
          length: secretLength,
          size: Buffer.from(secretMessage, 'utf8').length
        }
      },
      output: {
        encoded: encoded,
        length: encodedLength,
        overhead: overhead,
        overheadPercent: `${overheadPercent}%`,
        preview: encoded.substring(0, 50) + (encoded.length > 50 ? '...' : '')
      },
      metadata: {
        method: 'unicode-steganography', // or whatever method text.stego uses
        preservesReadability: true
      },
      timestamp: new Date().toISOString()
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: err.message || 'Encoding failed',
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
});

/**
 * DECODE - Extract hidden message from text
 */
router.post('/decode', auth, (req, res) => {
  try {
    const { encodedText } = req.body;

    if (!encodedText) {
      return res.status(400).json({
        success: false,
        error: 'encodedText is required'
      });
    }

    const decoded = stego.decode(encodedText);

    if (!decoded) {
      return res.status(404).json({
        success: false,
        error: 'No hidden data found in the provided text'
      });
    }

    const secretMessage = decoded.toString('utf8');

    return res.json({
      success: true,
      operation: 'decode',
      input: {
        encodedText: {
          length: encodedText.length,
          preview: encodedText.substring(0, 50) + (encodedText.length > 50 ? '...' : '')
        }
      },
      result: {
        type: 'text',
        secretMessage: secretMessage,
        length: secretMessage.length,
        size: decoded.length
      },
      timestamp: new Date().toISOString()
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: err.message || 'Decoding failed',
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
});

module.exports = router;