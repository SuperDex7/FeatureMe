#!/bin/bash

# Generate self-signed SSL certificates for local development
# This script creates certificates that will work with localhost

CERT_DIR="./certs"
CERT_FILE="$CERT_DIR/localhost.crt"
KEY_FILE="$CERT_DIR/localhost.key"

# Create certs directory if it doesn't exist
mkdir -p "$CERT_DIR"

# Generate private key
openssl genrsa -out "$KEY_FILE" 2048

# Generate certificate signing request
openssl req -new -key "$KEY_FILE" -out "$CERT_DIR/localhost.csr" -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"

# Generate self-signed certificate
openssl x509 -req -days 365 -in "$CERT_DIR/localhost.csr" -signkey "$KEY_FILE" -out "$CERT_FILE" -extensions v3_req -extfile <(
cat <<EOF
[req]
distinguished_name = req_distinguished_name
req_extensions = v3_req
prompt = no

[req_distinguished_name]
C = US
ST = State
L = City
O = Organization
CN = localhost

[v3_req]
keyUsage = keyEncipherment, dataEncipherment
extendedKeyUsage = serverAuth
subjectAltName = @alt_names

[alt_names]
DNS.1 = localhost
DNS.2 = *.localhost
IP.1 = 127.0.0.1
IP.2 = ::1
EOF
)

# Clean up CSR file
rm "$CERT_DIR/localhost.csr"

echo "SSL certificates generated successfully!"
echo "Certificate: $CERT_FILE"
echo "Private Key: $KEY_FILE"
echo ""
echo "To trust the certificate in your browser:"
echo "1. Open Chrome/Edge and go to chrome://settings/certificates"
echo "2. Click 'Manage certificates' -> 'Authorities' -> 'Import'"
echo "3. Select the file: $CERT_FILE"
echo "4. Check 'Trust this certificate for identifying websites'"
echo "5. Restart your browser"
echo ""
echo "Or for Firefox:"
echo "1. Go to about:preferences#privacy"
echo "2. Click 'View Certificates' -> 'Authorities' -> 'Import'"
echo "3. Select the file: $CERT_FILE"
echo "4. Check 'Trust this CA to identify websites'"
