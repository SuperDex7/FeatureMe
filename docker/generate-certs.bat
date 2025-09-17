@echo off
REM Generate self-signed SSL certificates for local development
REM This script creates certificates that will work with localhost

set CERT_DIR=.\certs
set CERT_FILE=%CERT_DIR%\localhost.crt
set KEY_FILE=%CERT_DIR%\localhost.key

REM Create certs directory if it doesn't exist
if not exist "%CERT_DIR%" mkdir "%CERT_DIR%"

echo Generating SSL certificates...

REM Generate private key
openssl genrsa -out "%KEY_FILE%" 2048

REM Generate certificate signing request
openssl req -new -key "%KEY_FILE%" -out "%CERT_DIR%\localhost.csr" -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"

REM Generate self-signed certificate
openssl x509 -req -days 365 -in "%CERT_DIR%\localhost.csr" -signkey "%KEY_FILE%" -out "%CERT_FILE%" -extensions v3_req -extfile cert.conf

REM Clean up CSR file
del "%CERT_DIR%\localhost.csr"

echo.
echo SSL certificates generated successfully!
echo Certificate: %CERT_FILE%
echo Private Key: %KEY_FILE%
echo.
echo To trust the certificate in your browser:
echo 1. Open Chrome/Edge and go to chrome://settings/certificates
echo 2. Click 'Manage certificates' -^> 'Authorities' -^> 'Import'
echo 3. Select the file: %CERT_FILE%
echo 4. Check 'Trust this certificate for identifying websites'
echo 5. Restart your browser
echo.
echo Or for Firefox:
echo 1. Go to about:preferences#privacy
echo 2. Click 'View Certificates' -^> 'Authorities' -^> 'Import'
echo 3. Select the file: %CERT_FILE%
echo 4. Check 'Trust this CA to identify websites'
