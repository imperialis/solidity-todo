// const router = require('express').Router();
// const auth = require('../auth/auth.middleware');
// const sharp = require('sharp');
// const multer = require('multer');
// const imageStego = require('../steganography/image/image.stego');

// const upload = multer(); // memory storage

// // Decode image into raw pixel data
// const decoder = async (buffer) => {
//   const img = sharp(buffer);
//   const { data, info } = await img.raw().toBuffer({ resolveWithObject: true });
//   return { data, info };
// };

// // Encode raw pixel data back to PNG
// const encoder = async (data, info) => {
//   return sharp(data, {
//     raw: {
//       width: info.width,
//       height: info.height,
//       channels: info.channels
//     }
//   })
//     .png()
//     .toBuffer();
// };

// /**
//  * ENCODE
//  * - coverImage (file) [required]
//  * - mode = "text" | "image" [required]
//  * - secretText (string) [if mode=text]
//  * - secretImage (file) [if mode=image]
//  */
// router.post(
//   '/encode',
//   auth,
//   upload.fields([
//     { name: 'coverImage', maxCount: 1 },
//     { name: 'secretImage', maxCount: 1 }
//   ]),
//   async (req, res) => {
//     try {
//       const cover = req.files?.coverImage?.[0];
//       const mode = req.body.mode;

//       if (!cover || !mode) {
//         return res.status(400).json({
//           error: 'coverImage file and mode are required'
//         });
//       }

//       let payload;
//       let stegoMode;

//       if (mode === 'text') {
//         if (!req.body.secretText) {
//           return res.status(400).json({ error: 'secretText is required' });
//         }

//         stegoMode = imageStego.MODES.TEXT;
//         payload = Buffer.from(req.body.secretText, 'utf8');
//       }

//       else if (mode === 'image') {
//         const secretImage = req.files?.secretImage?.[0];
//         if (!secretImage) {
//           return res.status(400).json({ error: 'secretImage file is required' });
//         }

//         stegoMode = imageStego.MODES.IMAGE;
//         payload = secretImage.buffer;
//       }

//       else {
//         return res.status(400).json({ error: 'mode must be text or image' });
//       }

//       const encoded = await imageStego.encode(
//         cover.buffer,
//         { mode: stegoMode, payload },
//         decoder,
//         encoder
//       );

//       res.setHeader('Content-Type', 'image/png');
//       res.send(encoded);
//     } catch (err) {
//       console.error(err);
//       res.status(500).json({ error: err.message || 'Encoding failed' });
//     }
//   }
// );

// /**
//  * DECODE
//  * - image (file)
//  */
// router.post(
//   '/decode',
//   auth,
//   upload.single('image'),
//   async (req, res) => {
//     try {
//       if (!req.file) {
//         return res.status(400).json({ error: 'image file is required' });
//       }

//       const result = await imageStego.decode(req.file.buffer, decoder);

//       if (result.mode === imageStego.MODES.TEXT) {
//         return res.json({
//           type: 'text',
//           secretText: result.payload.toString('utf8')
//         });
//       }

//       if (result.mode === imageStego.MODES.IMAGE) {
//         res.setHeader('Content-Type', 'image/png');
//         return res.send(result.payload);
//       }

//       res.status(400).json({ error: 'Unknown payload type' });
//     } catch (err) {
//       console.error(err);
//       res.status(500).json({ error: err.message || 'Decoding failed' });
//     }
//   }
// );

// module.exports = router;
const router = require('express').Router();
const auth = require('../auth/auth.middleware');
const sharp = require('sharp');
const multer = require('multer');
const imageStego = require('../steganography/image/image.stego');

const upload = multer();

// Decoder/encoder functions
const decoder = async (buffer) => {
  const img = sharp(buffer);
  const { data, info } = await img.raw().toBuffer({ resolveWithObject: true });
  return { data, info };
};

const encoder = async (data, info) => {
  return sharp(data, {
    raw: {
      width: info.width,
      height: info.height,
      channels: info.channels
    }
  })
    .png()
    .toBuffer();
};

/**
 * ENCODE - Hybrid response (binary default, JSON optional)
 * Query param: ?format=json for JSON response
 */
router.post(
  '/encode',
  auth,
  upload.fields([
    { name: 'coverImage', maxCount: 1 },
    { name: 'secretImage', maxCount: 1 }
  ]),
  async (req, res) => {
    try {
      const cover = req.files?.coverImage?.[0];
      const mode = req.body.mode;
      const format = req.query.format || req.body.format || 'binary';

      if (!cover || !mode) {
        return res.status(400).json({
          success: false,
          error: 'coverImage file and mode are required'
        });
      }

      // Get cover image metadata
      const coverMetadata = await sharp(cover.buffer).metadata();
      const capacity = coverMetadata.width * coverMetadata.height * (coverMetadata.channels || 3);

      let payload;
      let stegoMode;
      let payloadMetadata = {};

      if (mode === 'text') {
        if (!req.body.secretText) {
          return res.status(400).json({
            success: false,
            error: 'secretText is required'
          });
        }

        stegoMode = imageStego.MODES.TEXT;
        payload = Buffer.from(req.body.secretText, 'utf8');
        payloadMetadata = {
          type: 'text',
          length: req.body.secretText.length,
          encoding: 'utf8'
        };
      }

      else if (mode === 'image') {
        const secretImage = req.files?.secretImage?.[0];
        if (!secretImage) {
          return res.status(400).json({
            success: false,
            error: 'secretImage file is required'
          });
        }

        const secretMetadata = await sharp(secretImage.buffer).metadata();
        stegoMode = imageStego.MODES.IMAGE;
        payload = secretImage.buffer;
        payloadMetadata = {
          type: 'image',
          format: secretMetadata.format,
          width: secretMetadata.width,
          height: secretMetadata.height,
          size: secretImage.buffer.length
        };
      }

      else {
        return res.status(400).json({
          success: false,
          error: 'mode must be text or image'
        });
      }

      // Check capacity
      const requiredBits = (payload.length + 5) * 8; // +5 for header
      if (requiredBits > capacity) {
        return res.status(400).json({
          success: false,
          error: 'Payload too large for cover image',
          details: {
            requiredBits: requiredBits,
            availableBits: capacity,
            payloadSize: payload.length,
            maxPayloadSize: Math.floor(capacity / 8) - 5
          }
        });
      }

      // Encode
      const encoded = await imageStego.encode(
        cover.buffer,
        { mode: stegoMode, payload },
        decoder,
        encoder
      );

      const capacityUsed = ((requiredBits / capacity) * 100).toFixed(2);

      // JSON Response
      if (format === 'json') {
        return res.json({
          success: true,
          operation: 'encode',
          input: {
            coverFile: cover.originalname,
            coverFormat: coverMetadata.format,
            coverSize: cover.buffer.length,
            coverDimensions: {
              width: coverMetadata.width,
              height: coverMetadata.height
            },
            mode: mode,
            payload: payloadMetadata
          },
          output: {
            format: 'png',
            size: encoded.length,
            dataUrl: `data:image/png;base64,${encoded.toString('base64')}`,
            capacityUsed: `${capacityUsed}%`,
            capacityAvailable: Math.floor(capacity / 8) - 5 - payload.length,
            bitsUsed: requiredBits,
            bitsTotal: capacity
          },
          timestamp: new Date().toISOString()
        });
      }

      // Binary Response (default)
      res.setHeader('Content-Type', 'image/png');
      res.setHeader('X-Stego-Success', 'true');
      res.setHeader('X-Stego-Operation', 'encode');
      res.setHeader('X-Stego-Mode', mode);
      res.setHeader('X-Stego-Capacity-Used', `${capacityUsed}%`);
      res.setHeader('X-Stego-Capacity-Available', (Math.floor(capacity / 8) - 5 - payload.length).toString());
      res.setHeader('X-Stego-Payload-Size', payload.length.toString());
      res.setHeader('X-Stego-Output-Size', encoded.length.toString());
      res.setHeader('X-Stego-Bits-Used', requiredBits.toString());
      res.setHeader('X-Stego-Bits-Total', capacity.toString());
      res.setHeader('X-Cover-Format', coverMetadata.format);
      res.setHeader('X-Cover-Dimensions', `${coverMetadata.width}x${coverMetadata.height}`);
      res.setHeader('Content-Disposition', 'attachment; filename="encoded.png"');
      res.send(encoded);

    } catch (err) {
      console.error(err);
      res.status(500).json({
        success: false,
        error: err.message || 'Encoding failed',
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
      });
    }
  }
);

/**
 * DECODE - Hybrid response (JSON for text, binary for images, JSON optional)
 * Query param: ?format=json to force JSON response with base64
 */
router.post(
  '/decode',
  auth,
  upload.single('image'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'image file is required'
        });
      }

      const format = req.query.format || req.body.format || 'auto';
      const metadata = await sharp(req.file.buffer).metadata();
      const result = await imageStego.decode(req.file.buffer, decoder);

      const modeString = result.mode === imageStego.MODES.TEXT ? 'text' : 'image';

      // Handle TEXT mode (always JSON for text)
      if (result.mode === imageStego.MODES.TEXT) {
        return res.json({
          success: true,
          operation: 'decode',
          input: {
            filename: req.file.originalname,
            format: metadata.format,
            size: req.file.buffer.length,
            dimensions: {
              width: metadata.width,
              height: metadata.height
            }
          },
          result: {
            mode: 'text',
            type: 'text',
            content: result.payload.toString('utf8'),
            encoding: 'utf8',
            size: result.payload.length,
            length: result.payload.toString('utf8').length
          },
          timestamp: new Date().toISOString()
        });
      }

      // Handle IMAGE mode
      if (result.mode === imageStego.MODES.IMAGE) {
        const extractedMetadata = await sharp(result.payload).metadata();

        // JSON Response
        if (format === 'json') {
          return res.json({
            success: true,
            operation: 'decode',
            input: {
              filename: req.file.originalname,
              format: metadata.format,
              size: req.file.buffer.length,
              dimensions: {
                width: metadata.width,
                height: metadata.height
              }
            },
            result: {
              mode: 'image',
              type: 'image',
              format: extractedMetadata.format,
              size: result.payload.length,
              dimensions: {
                width: extractedMetadata.width,
                height: extractedMetadata.height
              },
              dataUrl: `data:image/${extractedMetadata.format};base64,${result.payload.toString('base64')}`
            },
            timestamp: new Date().toISOString()
          });
        }

        // Binary Response (default for images)
        res.setHeader('Content-Type', `image/${extractedMetadata.format}`);
        res.setHeader('X-Stego-Success', 'true');
        res.setHeader('X-Stego-Operation', 'decode');
        res.setHeader('X-Stego-Mode', 'image');
        res.setHeader('X-Stego-Format', extractedMetadata.format);
        res.setHeader('X-Stego-Size', result.payload.length.toString());
        res.setHeader('X-Stego-Dimensions', `${extractedMetadata.width}x${extractedMetadata.height}`);
        res.setHeader('Content-Disposition', `attachment; filename="extracted.${extractedMetadata.format}"`);
        return res.send(result.payload);
      }

      res.status(400).json({
        success: false,
        error: 'Unknown payload type'
      });

    } catch (err) {
      console.error(err);
      res.status(500).json({
        success: false,
        error: err.message || 'Decoding failed',
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
      });
    }
  }
);

module.exports = router;