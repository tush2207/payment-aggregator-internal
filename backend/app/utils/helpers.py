import base64

def decode_base64(data: str) -> str:
    # Decode from base64
    decoded_bytes = base64.b64decode(data)
    # Convert bytes to string (utf-8) after decoding
    return decoded_bytes.decode('utf-8')
