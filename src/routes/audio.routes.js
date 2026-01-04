const router = require('express').Router();
const auth = require('../auth/auth.middleware');
const multer = require('multer');
const audioStego = require('../steganography/audio/audio.stego');

const upload = multer();

/**
 * ENCODE - Hybrid response (binary default, JSON optional)
 * Query param: ?format=json for JSON response
 */
router.post(
  '/encode',
  auth,
  upload.fields([
    { name: 'coverAudio', maxCount: 1 },
    { name: 'secretImage', maxCount: 1 },
    { name: 'secretAudio', maxCount: 1 }
  ]),
  async (req, res) => {
    try {
      const cover = req.files?.coverAudio?.[0];
      const mode = req.body.mode;
      const format = req.query.format || req.body.format || 'binary';

      if (!cover || !mode) {
        return res.status(400).json({
          success: false,
          error: 'coverAudio file and mode are required'
        });
      }

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

        stegoMode = audioStego.MODES.TEXT;
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

        stegoMode = audioStego.MODES.IMAGE;
        payload = secretImage.buffer;
        payloadMetadata = {
          type: 'image',
          mimetype: secretImage.mimetype,
          size: secretImage.buffer.length,
          originalname: secretImage.originalname
        };
      }

      else if (mode === 'audio') {
        const secretAudio = req.files?.secretAudio?.[0];
        if (!secretAudio) {
          return res.status(400).json({
            success: false,
            error: 'secretAudio file is required'
          });
        }

        stegoMode = audioStego.MODES.AUDIO;
        payload = secretAudio.buffer;
        payloadMetadata = {
          type: 'audio',
          mimetype: secretAudio.mimetype,
          size: secretAudio.buffer.length,
          originalname: secretAudio.originalname
        };
      }

      else {
        return res.status(400).json({
          success: false,
          error: 'mode must be text, image, or audio'
        });
      }

      // Check JSON payload size limit for audio-in-audio
      if (format === 'json' && mode === 'audio') {
        const estimatedBase64Size = Math.ceil(payload.length * 4 / 3);
        
        if (estimatedBase64Size > 1000000) { // 1MB threshold
          return res.status(413).json({
            success: false,
            error: 'Payload too large for JSON response',
            details: {
              payloadSize: payload.length,
              estimatedJsonSize: estimatedBase64Size,
              recommendation: 'Use binary format (remove ?format=json query parameter) for audio-in-audio operations',
              maxJsonPayload: '~1MB'
            }
          });
        }
      }

      // Encode
      const encoded = audioStego.encode(
        cover.buffer,
        { mode: stegoMode, payload }
      );

      // Calculate capacity (assuming WAV format, rough estimate)
      const requiredBits = (payload.length + 5) * 8;
      const availableCapacity = cover.buffer.length; // rough estimate for audio
      const capacityUsed = ((requiredBits / (availableCapacity * 8)) * 100).toFixed(2);

      // JSON Response
      if (format === 'json') {
        return res.json({
          success: true,
          operation: 'encode',
          input: {
            coverFile: cover.originalname,
            coverMimetype: cover.mimetype,
            coverSize: cover.buffer.length,
            mode: mode,
            payload: payloadMetadata
          },
          output: {
            format: 'wav',
            size: encoded.length,
            dataUrl: `data:audio/wav;base64,${encoded.toString('base64')}`,
            capacityUsed: `${capacityUsed}%`,
            bitsUsed: requiredBits
          },
          timestamp: new Date().toISOString()
        });
      }

      // Binary Response (default)
      res.setHeader('Content-Type', 'audio/wav');
      res.setHeader('X-Stego-Success', 'true');
      res.setHeader('X-Stego-Operation', 'encode');
      res.setHeader('X-Stego-Mode', mode);
      res.setHeader('X-Stego-Capacity-Used', `${capacityUsed}%`);
      res.setHeader('X-Stego-Payload-Size', payload.length.toString());
      res.setHeader('X-Stego-Output-Size', encoded.length.toString());
      res.setHeader('X-Stego-Bits-Used', requiredBits.toString());
      res.setHeader('X-Cover-Mimetype', cover.mimetype);
      res.setHeader('X-Cover-Size', cover.buffer.length.toString());
      res.setHeader('Content-Disposition', 'attachment; filename="encoded.wav"');
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
 * DECODE - Hybrid response
 * Query param: ?format=json to force JSON response with base64
 */
router.post(
  '/decode',
  auth,
  upload.single('audio'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'audio file is required'
        });
      }

      const format = req.query.format || req.body.format || 'auto';
      const result = audioStego.decode(req.file.buffer);

      const modeString = result.mode === audioStego.MODES.TEXT ? 'text' 
                       : result.mode === audioStego.MODES.IMAGE ? 'image'
                       : result.mode === audioStego.MODES.AUDIO ? 'audio'
                       : 'unknown';

      // Handle TEXT mode (always JSON)
      if (result.mode === audioStego.MODES.TEXT) {
        return res.json({
          success: true,
          operation: 'decode',
          input: {
            filename: req.file.originalname,
            mimetype: req.file.mimetype,
            size: req.file.buffer.length
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
      if (result.mode === audioStego.MODES.IMAGE) {
        // JSON Response
        if (format === 'json') {
          return res.json({
            success: true,
            operation: 'decode',
            input: {
              filename: req.file.originalname,
              mimetype: req.file.mimetype,
              size: req.file.buffer.length
            },
            result: {
              mode: 'image',
              type: 'image',
              size: result.payload.length,
              dataUrl: `data:image/png;base64,${result.payload.toString('base64')}`
            },
            timestamp: new Date().toISOString()
          });
        }

        // Binary Response (default)
        res.setHeader('Content-Type', 'image/png');
        res.setHeader('X-Stego-Success', 'true');
        res.setHeader('X-Stego-Operation', 'decode');
        res.setHeader('X-Stego-Mode', 'image');
        res.setHeader('X-Stego-Size', result.payload.length.toString());
        res.setHeader('Content-Disposition', 'attachment; filename="extracted.png"');
        return res.send(result.payload);
      }

      // Handle AUDIO mode
      if (result.mode === audioStego.MODES.AUDIO) {
        // Check JSON size limit for large audio
        if (format === 'json') {
          const estimatedBase64Size = Math.ceil(result.payload.length * 4 / 3);
          
          if (estimatedBase64Size > 1000000) { // 1MB threshold
            return res.status(413).json({
              success: false,
              error: 'Extracted payload too large for JSON response',
              details: {
                payloadSize: result.payload.length,
                estimatedJsonSize: estimatedBase64Size,
                recommendation: 'Use binary format (remove ?format=json query parameter) to retrieve large audio files',
                maxJsonPayload: '~1MB'
              }
            });
          }

          return res.json({
            success: true,
            operation: 'decode',
            input: {
              filename: req.file.originalname,
              mimetype: req.file.mimetype,
              size: req.file.buffer.length
            },
            result: {
              mode: 'audio',
              type: 'audio',
              size: result.payload.length,
              dataUrl: `data:audio/wav;base64,${result.payload.toString('base64')}`
            },
            timestamp: new Date().toISOString()
          });
        }

        // Binary Response (default)
        res.setHeader('Content-Type', 'audio/wav');
        res.setHeader('X-Stego-Success', 'true');
        res.setHeader('X-Stego-Operation', 'decode');
        res.setHeader('X-Stego-Mode', 'audio');
        res.setHeader('X-Stego-Size', result.payload.length.toString());
        res.setHeader('Content-Disposition', 'attachment; filename="extracted.wav"');
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