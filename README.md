# Steganography API

A comprehensive steganography API supporting multiple media types with hybrid response formats (binary and JSON).

##  Features

- **Image Steganography**: Hide text or images within images
- **Audio Steganography**: Hide text, images, or audio within audio files
- **Text Steganography**: Hide text within text using Unicode steganography
- **Hybrid Responses**: Binary (default) or JSON with base64 encoding
- **Capacity Validation**: Automatic checks to ensure payloads fit
- **Rich Metadata**: Detailed information in response headers and JSON

##  Table of Contents

- [Authentication](#authentication)
- [Response Formats](#response-formats)
- [Image API](#image-api)
- [Audio API](#audio-api)
- [Text API](#text-api)
- [Error Handling](#error-handling)
- [Examples](#examples)

##  Authentication

All endpoints require API key authentication via header:

```bash
-H "x-api-key: YOUR_API_KEY"
```

##  Response Formats

### Binary Format (Default)

Returns raw binary data with metadata in headers:

```bash
# Request
POST /api/image/encode

# Response Headers
Content-Type: image/png
X-Stego-Success: true
X-Stego-Mode: text
X-Stego-Capacity-Used: 0.05%
X-Stego-Output-Size: 389472
```

### JSON Format

Add `?format=json` query parameter for JSON response with base64 data:

```bash
# Request
POST /api/image/encode?format=json

# Response
{
  "success": true,
  "operation": "encode",
  "output": {
    "dataUrl": "data:image/png;base64,iVBORw0KGgo...",
    "size": 389472,
    "capacityUsed": "0.05%"
  }
}
```

**Note:** JSON format has a 1MB limit for audio-in-audio operations due to base64 encoding overhead.

---

##  Image API

### POST `/api/image/encode`

Hide data within an image.

**Parameters:**
- `coverImage` (file, required) - Cover image file
- `mode` (string, required) - "text" or "image"
- `secretText` (string) - Required if mode=text
- `secretImage` (file) - Required if mode=image
- `format` (query, optional) - "json" or "binary" (default)

**Example - Text in Image:**
```bash
curl -X POST "https://api.example.com/api/image/encode" \
  -H "x-api-key: YOUR_API_KEY" \
  -F "coverImage=@cover.jpg" \
  -F "mode=text" \
  -F "secretText=Hidden message" \
  --output encoded.png
```

**Example - Image in Image:**
```bash
curl -X POST "https://api.example.com/api/image/encode?format=json" \
  -H "x-api-key: YOUR_API_KEY" \
  -F "coverImage=@cover.jpg" \
  -F "mode=image" \
  -F "secretImage=@secret.png" | jq
```

**Response (Binary):**
- Content-Type: `image/png`
- Headers: `X-Stego-*` metadata
- Body: Encoded PNG image

**Response (JSON):**
```json
{
  "success": true,
  "operation": "encode",
  "input": {
    "coverFile": "cover.jpg",
    "coverSize": 245680,
    "mode": "text",
    "payload": {
      "type": "text",
      "length": 14
    }
  },
  "output": {
    "format": "png",
    "size": 389472,
    "dataUrl": "data:image/png;base64,...",
    "capacityUsed": "0.05%"
  }
}
```

### POST `/api/image/decode`

Extract hidden data from an image.

**Parameters:**
- `image` (file, required) - Encoded image file
- `format` (query, optional) - "json" or "auto" (default)

**Example:**
```bash
curl -X POST "https://api.example.com/api/image/decode" \
  -H "x-api-key: YOUR_API_KEY" \
  -F "image=@encoded.png" | jq
```

**Response (Text Mode):**
```json
{
  "success": true,
  "operation": "decode",
  "result": {
    "mode": "text",
    "type": "text",
    "content": "Hidden message",
    "size": 14
  }
}
```

**Response (Image Mode - Binary):**
- Content-Type: `image/png`
- Body: Extracted image data

---

##  Audio API

### POST `/api/audio/encode`

Hide data within an audio file.

**Parameters:**
- `coverAudio` (file, required) - Cover audio file (WAV)
- `mode` (string, required) - "text", "image", or "audio"
- `secretText` (string) - Required if mode=text
- `secretImage` (file) - Required if mode=image
- `secretAudio` (file) - Required if mode=audio
- `format` (query, optional) - "json" or "binary" (default)

**Example - Text in Audio:**
```bash
curl -X POST "https://api.example.com/api/audio/encode" \
  -H "x-api-key: YOUR_API_KEY" \
  -F "coverAudio=@audio.wav" \
  -F "mode=text" \
  -F "secretText=Secret message" \
  --output encoded.wav
```

**Example - Image in Audio:**
```bash
curl -X POST "https://api.example.com/api/audio/encode" \
  -H "x-api-key: YOUR_API_KEY" \
  -F "coverAudio=@audio.wav" \
  -F "mode=image" \
  -F "secretImage=@secret.png" \
  --output encoded.wav
```

**Example - Audio in Audio:**
```bash
curl -X POST "https://api.example.com/api/audio/encode" \
  -H "x-api-key: YOUR_API_KEY" \
  -F "coverAudio=@large-audio.wav" \
  -F "mode=audio" \
  -F "secretAudio=@small-audio.wav" \
  --output encoded.wav
```

**Response (Binary):**
- Content-Type: `audio/wav`
- Headers: `X-Stego-*` metadata
- Body: Encoded WAV audio

**Response (JSON):**
```json
{
  "success": true,
  "operation": "encode",
  "input": {
    "coverFile": "audio.wav",
    "coverSize": 1048576,
    "mode": "text",
    "payload": {
      "type": "text",
      "length": 14
    }
  },
  "output": {
    "format": "wav",
    "size": 1048576,
    "dataUrl": "data:audio/wav;base64,...",
    "capacityUsed": "0.01%"
  }
}
```

### POST `/api/audio/decode`

Extract hidden data from audio.

**Parameters:**
- `audio` (file, required) - Encoded audio file
- `format` (query, optional) - "json" or "auto" (default)

**Example:**
```bash
curl -X POST "https://api.example.com/api/audio/decode" \
  -H "x-api-key: YOUR_API_KEY" \
  -F "audio=@encoded.wav" | jq
```

**Response (Text Mode):**
```json
{
  "success": true,
  "operation": "decode",
  "result": {
    "mode": "text",
    "type": "text",
    "content": "Secret message",
    "size": 14
  }
}
```

**Response (Image/Audio Mode - Binary):**
- Content-Type: `image/png` or `audio/wav`
- Body: Extracted data

---

##  Text API

### POST `/api/text/encode`

Hide text within text using Unicode steganography.

**Parameters:**
- `coverText` (string, required) - Cover text
- `secretMessage` (string, required) - Secret message to hide

**Example:**
```bash
curl -X POST "https://api.example.com/api/text/encode" \
  -H "x-api-key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "coverText": "This is a normal sentence.",
    "secretMessage": "Hidden"
  }' | jq
```

**Response:**
```json
{
  "success": true,
  "operation": "encode",
  "input": {
    "coverText": {
      "length": 26,
      "preview": "This is a normal sentence."
    },
    "secretMessage": {
      "length": 6,
      "size": 6
    }
  },
  "output": {
    "encoded": "This​‌‍ is​‌‌ a​‌​ normal​‍‌ sentence.",
    "length": 32,
    "overhead": 6,
    "overheadPercent": "23.08%"
  }
}
```

### POST `/api/text/decode`

Extract hidden text from encoded text.

**Parameters:**
- `encodedText` (string, required) - Text containing hidden message

**Example:**
```bash
curl -X POST "https://api.example.com/api/text/decode" \
  -H "x-api-key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "encodedText": "This​‌‍ is​‌‌ a​‌​ normal​‍‌ sentence."
  }' | jq
```

**Response:**
```json
{
  "success": true,
  "operation": "decode",
  "result": {
    "type": "text",
    "secretMessage": "Hidden",
    "length": 6,
    "size": 6
  }
}
```

---

##  Error Handling

### Common Error Responses

**400 Bad Request:**
```json
{
  "success": false,
  "error": "coverImage file and mode are required"
}
```

**413 Payload Too Large:**
```json
{
  "success": false,
  "error": "Payload too large for JSON response",
  "details": {
    "payloadSize": 1048576,
    "estimatedJsonSize": 1398101,
    "recommendation": "Use binary format (remove ?format=json query parameter) for audio-in-audio operations",
    "maxJsonPayload": "~1MB"
  }
}
```

**500 Internal Server Error:**
```json
{
  "success": false,
  "error": "Audio too small to hold payload"
}
```

---

##  Examples

### Nested Steganography

Hide an image within an image, then hide that in audio:

```bash
# Step 1: Hide secret image in cover image
curl -X POST "https://api.example.com/api/image/encode" \
  -H "x-api-key: YOUR_API_KEY" \
  -F "coverImage=@cover.jpg" \
  -F "mode=image" \
  -F "secretImage=@secret.png" \
  --output layer1.png

# Step 2: Hide the encoded image in audio
curl -X POST "https://api.example.com/api/audio/encode" \
  -H "x-api-key: YOUR_API_KEY" \
  -F "coverAudio=@audio.wav" \
  -F "mode=image" \
  -F "secretImage=@layer1.png" \
  --output nested.wav

# Step 3: Extract from audio
curl -X POST "https://api.example.com/api/audio/decode" \
  -H "x-api-key: YOUR_API_KEY" \
  -F "audio=@nested.wav" \
  --output layer1-extracted.png

# Step 4: Extract from image
curl -X POST "https://api.example.com/api/image/decode" \
  -H "x-api-key: YOUR_API_KEY" \
  -F "image=@layer1-extracted.png" \
  --output secret-extracted.png
```

### Capacity Check

Check available capacity before encoding:

```bash
# Get metadata with JSON format
curl -X POST "https://api.example.com/api/image/encode?format=json" \
  -H "x-api-key: YOUR_API_KEY" \
  -F "coverImage=@cover.jpg" \
  -F "mode=text" \
  -F "secretText=test" \
  | jq '.output.capacityUsed'
```

---

## Technical Details

### Supported Formats

**Input:**
- Images: JPEG, PNG, WebP
- Audio: WAV
- Text: UTF-8

**Output:**
- Images: PNG (always)
- Audio: WAV (always)
- Text: UTF-8

### Capacity Limits

| Cover Type | Max Payload Size |
|------------|------------------|
| 1MB Image  | ~1MB |
| 1MB Audio  | ~1MB |
| 2MB Audio  | ~2MB |

**Note:** Actual capacity depends on the number of pixels/samples in the cover media.

### Algorithm

- **LSB (Least Significant Bit)** encoding for images and audio
- **Unicode Zero-Width Characters** for text steganography
- **5-byte header** storing mode (1 byte) and payload length (4 bytes)

---

##  Getting Started

1. **Get API Key**: Contact administrator or generate via authentication endpoint
2. **Choose Media Type**: Select image, audio, or text based on your needs
3. **Prepare Files**: Ensure cover media is large enough for payload
4. **Make Request**: Use binary format for efficiency, JSON for debugging
5. **Verify**: Check response headers or JSON for capacity and metadata

---

##  Support

For issues, questions, or feature requests:
- GitHub: https://github.com/imperialis/solidity-todo
- Check server logs for detailed error messages

---

##  License

---

##  Credits

Built with:
- Express.js
- Multer
- Sharp (image processing)
- Custom steganography algorithms
