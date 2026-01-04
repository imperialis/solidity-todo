#!/bin/bash

# Audio API Test Script
# Tests all audio steganography endpoints

API_KEY="752c75.752c7588750f056651e2c75e7bee2f440a3b6bea7bd531087973b66a8acd0bce"
BASE_URL="https://urban-space-eureka-qpw4x5rgq77hrvw-3000.app.github.dev/api/audio"
AUDIO="/workspaces/solidity-todo/Stegmagnus/file_example_WAV_1MG.wav"
IMAGE="/workspaces/solidity-todo/Stegmagnus/simple-jpeg-file-icon-jpeg-extension-vector.jpg"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     Audio Steganography API Test Suite    ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════╝${NC}"
echo ""

# Test 8: Encode Text in Audio (Binary)
echo -e "${YELLOW}[Test 8]${NC} Encode Text in Audio (Binary)"
curl -X POST \
  "$BASE_URL/encode" \
  -H "x-api-key: $API_KEY" \
  -F "coverAudio=@$AUDIO" \
  -F "mode=text" \
  -F "secretText=Hidden message in audio waves" \
  --output encoded-audio-text.wav -D headers-audio-text.txt \
  -w "\nHTTP Status: %{http_code}\n" 2>/dev/null

if [ -f encoded-audio-text.wav ]; then
  SIZE=$(ls -lh encoded-audio-text.wav | awk '{print $5}')
  echo -e "${GREEN}✓ Success${NC} - File created: encoded-audio-text.wav ($SIZE)"
  echo "Headers:"
  grep "X-Stego" headers-audio-text.txt | sed 's/^/  /'
else
  echo -e "${RED}✗ Failed${NC} - File not created"
fi
echo ""

# Test 9: Encode Text in Audio (JSON)
echo -e "${YELLOW}[Test 9]${NC} Encode Text in Audio (JSON)"
RESPONSE=$(curl -s -X POST \
  "$BASE_URL/encode?format=json" \
  -H "x-api-key: $API_KEY" \
  -F "coverAudio=@$AUDIO" \
  -F "mode=text" \
  -F "secretText=Hidden message in audio waves" \
  -w "\nHTTP_STATUS:%{http_code}")

HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_STATUS" | cut -d: -f2)
JSON=$(echo "$RESPONSE" | sed '/HTTP_STATUS/d')

if [ "$HTTP_CODE" = "200" ]; then
  echo -e "${GREEN}✓ Success${NC} - HTTP $HTTP_CODE"
  echo "$JSON" | jq '{success, operation, output: {size, capacityUsed}}'
else
  echo -e "${RED}✗ Failed${NC} - HTTP $HTTP_CODE"
  echo "$JSON" | jq '.'
fi
echo ""

# Test 10: Decode Text from Audio
echo -e "${YELLOW}[Test 10]${NC} Decode Text from Audio"
if [ -f encoded-audio-text.wav ]; then
  RESPONSE=$(curl -s -X POST \
    "$BASE_URL/decode" \
    -H "x-api-key: $API_KEY" \
    -F "audio=@encoded-audio-text.wav" \
    -w "\nHTTP_STATUS:%{http_code}")
  
  HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_STATUS" | cut -d: -f2)
  JSON=$(echo "$RESPONSE" | sed '/HTTP_STATUS/d')
  
  if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✓ Success${NC} - HTTP $HTTP_CODE"
    echo "$JSON" | jq '{success, result: {mode, content}}'
  else
    echo -e "${RED}✗ Failed${NC} - HTTP $HTTP_CODE"
    echo "$JSON" | jq '.'
  fi
else
  echo -e "${RED}✗ Skipped${NC} - encoded-audio-text.wav not found"
fi
echo ""

# Test 11: Encode Image in Audio (Binary)
echo -e "${YELLOW}[Test 11]${NC} Encode Image in Audio (Binary)"
curl -X POST \
  "$BASE_URL/encode" \
  -H "x-api-key: $API_KEY" \
  -F "coverAudio=@$AUDIO" \
  -F "mode=image" \
  -F "secretImage=@$IMAGE" \
  --output audio-with-image.wav -D headers-audio-image.txt \
  -w "\nHTTP Status: %{http_code}\n" 2>/dev/null

if [ -f audio-with-image.wav ]; then
  SIZE=$(ls -lh audio-with-image.wav | awk '{print $5}')
  echo -e "${GREEN}✓ Success${NC} - File created: audio-with-image.wav ($SIZE)"
  echo "Headers:"
  grep "X-Stego" headers-audio-image.txt | sed 's/^/  /'
else
  echo -e "${RED}✗ Failed${NC} - File not created"
fi
echo ""

# Test 12: Encode Image in Audio (JSON)
echo -e "${YELLOW}[Test 12]${NC} Encode Image in Audio (JSON)"
RESPONSE=$(curl -s -X POST \
  "$BASE_URL/encode?format=json" \
  -H "x-api-key: $API_KEY" \
  -F "coverAudio=@$AUDIO" \
  -F "mode=image" \
  -F "secretImage=@$IMAGE" \
  -w "\nHTTP_STATUS:%{http_code}")

HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_STATUS" | cut -d: -f2)
JSON=$(echo "$RESPONSE" | sed '/HTTP_STATUS/d')

if [ "$HTTP_CODE" = "200" ]; then
  echo -e "${GREEN}✓ Success${NC} - HTTP $HTTP_CODE"
  CAPACITY=$(echo "$JSON" | jq -r '.output.capacityUsed')
  echo "Capacity Used: $CAPACITY"
  echo "$JSON" | jq '{success, operation, output: {size, capacityUsed}}'
else
  echo -e "${RED}✗ Failed${NC} - HTTP $HTTP_CODE"
  echo "$JSON" | jq '.'
fi
echo ""

# Test 13: Decode Image from Audio (Binary)
echo -e "${YELLOW}[Test 13]${NC} Decode Image from Audio (Binary)"
if [ -f audio-with-image.wav ]; then
  curl -X POST \
    "$BASE_URL/decode" \
    -H "x-api-key: $API_KEY" \
    -F "audio=@audio-with-image.wav" \
    --output extracted-image-from-audio.png -D headers-audio-decode.txt \
    -w "\nHTTP Status: %{http_code}\n" 2>/dev/null
  
  if [ -f extracted-image-from-audio.png ]; then
    SIZE=$(ls -lh extracted-image-from-audio.png | awk '{print $5}')
    echo -e "${GREEN}✓ Success${NC} - File created: extracted-image-from-audio.png ($SIZE)"
    file extracted-image-from-audio.png | sed 's/^/  /'
  else
    echo -e "${RED}✗ Failed${NC} - File not created"
  fi
else
  echo -e "${RED}✗ Skipped${NC} - audio-with-image.wav not found"
fi
echo ""

# Test 14: Decode Image from Audio (JSON)
echo -e "${YELLOW}[Test 14]${NC} Decode Image from Audio (JSON)"
if [ -f audio-with-image.wav ]; then
  RESPONSE=$(curl -s -X POST \
    "$BASE_URL/decode?format=json" \
    -H "x-api-key: $API_KEY" \
    -F "audio=@audio-with-image.wav" \
    -w "\nHTTP_STATUS:%{http_code}")
  
  HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_STATUS" | cut -d: -f2)
  JSON=$(echo "$RESPONSE" | sed '/HTTP_STATUS/d')
  
  if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✓ Success${NC} - HTTP $HTTP_CODE"
    SIZE=$(echo "$JSON" | jq -r '.result.size')
    echo "Extracted size: $SIZE bytes"
    echo "$JSON" | jq '{success, result: {mode, type, size}}'
  else
    echo -e "${RED}✗ Failed${NC} - HTTP $HTTP_CODE"
    echo "$JSON" | jq '.'
  fi
else
  echo -e "${RED}✗ Skipped${NC} - audio-with-image.wav not found"
fi
echo ""

# Test 15: Encode Audio in Audio (Audioception - Binary)
echo -e "${YELLOW}[Test 15]${NC} Encode Audio in Audio (Audioception - Binary)"
curl -X POST \
  "$BASE_URL/encode" \
  -H "x-api-key: $API_KEY" \
  -F "coverAudio=@$AUDIO" \
  -F "mode=audio" \
  -F "secretAudio=@$AUDIO" \
  --output audio-in-audio.wav -D headers-audioception.txt \
  -w "\nHTTP Status: %{http_code}\n" 2>/dev/null

if [ -f audio-in-audio.wav ]; then
  SIZE=$(ls -lh audio-in-audio.wav | awk '{print $5}')
  echo -e "${GREEN}✓ Success${NC} - File created: audio-in-audio.wav ($SIZE)"
  echo "Headers:"
  grep "X-Stego" headers-audioception.txt | sed 's/^/  /'
else
  echo -e "${RED}✗ Failed${NC} - File not created"
fi
echo ""

# Test 16: Encode Audio in Audio (JSON)
echo -e "${YELLOW}[Test 16]${NC} Encode Audio in Audio (JSON)"
RESPONSE=$(curl -s -X POST \
  "$BASE_URL/encode?format=json" \
  -H "x-api-key: $API_KEY" \
  -F "coverAudio=@$AUDIO" \
  -F "mode=audio" \
  -F "secretAudio=@$AUDIO" \
  -w "\nHTTP_STATUS:%{http_code}")

HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_STATUS" | cut -d: -f2)
JSON=$(echo "$RESPONSE" | sed '/HTTP_STATUS/d')

if [ "$HTTP_CODE" = "200" ]; then
  echo -e "${GREEN}✓ Success${NC} - HTTP $HTTP_CODE"
  echo "$JSON" | jq '{success, operation, output: {size, capacityUsed}}'
else
  echo -e "${RED}✗ Failed${NC} - HTTP $HTTP_CODE"
  echo "$JSON" | jq '.'
fi
echo ""

# Test 17: Decode Audio from Audio (Binary)
echo -e "${YELLOW}[Test 17]${NC} Decode Audio from Audio (Binary)"
if [ -f audio-in-audio.wav ]; then
  curl -X POST \
    "$BASE_URL/decode" \
    -H "x-api-key: $API_KEY" \
    -F "audio=@audio-in-audio.wav" \
    --output extracted-audio.wav -D headers-audio-extracted.txt \
    -w "\nHTTP Status: %{http_code}\n" 2>/dev/null
  
  if [ -f extracted-audio.wav ]; then
    SIZE=$(ls -lh extracted-audio.wav | awk '{print $5}')
    echo -e "${GREEN}✓ Success${NC} - File created: extracted-audio.wav ($SIZE)"
    file extracted-audio.wav | sed 's/^/  /'
  else
    echo -e "${RED}✗ Failed${NC} - File not created"
  fi
else
  echo -e "${RED}✗ Skipped${NC} - audio-in-audio.wav not found"
fi
echo ""

# Test 18: Decode Audio from Audio (JSON)
echo -e "${YELLOW}[Test 18]${NC} Decode Audio from Audio (JSON)"
if [ -f audio-in-audio.wav ]; then
  RESPONSE=$(curl -s -X POST \
    "$BASE_URL/decode?format=json" \
    -H "x-api-key: $API_KEY" \
    -F "audio=@audio-in-audio.wav" \
    -w "\nHTTP_STATUS:%{http_code}")
  
  HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_STATUS" | cut -d: -f2)
  JSON=$(echo "$RESPONSE" | sed '/HTTP_STATUS/d')
  
  if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✓ Success${NC} - HTTP $HTTP_CODE"
    echo "$JSON" | jq '{success, result: {mode, type, size}}'
  else
    echo -e "${RED}✗ Failed${NC} - HTTP $HTTP_CODE"
    echo "$JSON" | jq '.'
  fi
else
  echo -e "${RED}✗ Skipped${NC} - audio-in-audio.wav not found"
fi
echo ""

# Summary
echo -e "${BLUE}╔════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║              Test Summary                  ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════╝${NC}"
echo ""
echo "Generated Files:"
ls -lh *.wav *.png 2>/dev/null | grep -E "encoded|extracted|audio" | awk '{printf "  %s (%s)\n", $9, $5}'
echo ""
echo -e "${GREEN}Tests Complete!${NC}"
echo ""
echo "To clean up generated files:"
echo "  rm -f encoded-*.wav audio-*.wav extracted-*.* headers-*.txt"