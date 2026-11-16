#!/usr/bin/env bash
# Garantit une identité codesign stable (TCC survit aux rebuilds).
# Sans ça, la signature ad-hoc lie TCC au CDHash → chaque rebuild = refus silencieux.
set -euo pipefail

CERT_NAME="${ELSA_CODESIGN_IDENTITY:-ELSA Local Codesign}"

if security find-identity -v -p codesigning 2>/dev/null | grep -Fq "$CERT_NAME"; then
  echo "$CERT_NAME"
  exit 0
fi

WORKDIR="$(mktemp -d)"
cleanup() { rm -rf "$WORKDIR"; }
trap cleanup EXIT
cd "$WORKDIR"

openssl genrsa -out elsa.key 2048 2>/dev/null
cat > elsa.ext <<'EXT'
[v3_req]
basicConstraints=critical,CA:FALSE
keyUsage=critical,digitalSignature
extendedKeyUsage=critical,codeSigning
EXT
openssl req -new -key elsa.key -out elsa.csr -subj "/CN=${CERT_NAME}/O=ELSA Dev/C=FR"
openssl x509 -req -days 3650 -in elsa.csr -signkey elsa.key -out elsa.crt \
  -extfile elsa.ext -extensions v3_req 2>/dev/null
openssl pkcs12 -export -out elsa.p12 -inkey elsa.key -in elsa.crt \
  -passout pass:elsa-local -keypbe PBE-SHA1-3DES -certpbe PBE-SHA1-3DES -macalg sha1

KEYCHAIN="${HOME}/Library/Keychains/login.keychain-db"
security import elsa.p12 -k "$KEYCHAIN" -P elsa-local \
  -T /usr/bin/codesign -T /usr/bin/security >/dev/null
security set-key-partition-list -S apple-tool:,apple:,codesign: -s -k "" "$KEYCHAIN" >/dev/null 2>&1 || true
security add-trusted-cert -d -r trustRoot -p codeSign -k "$KEYCHAIN" elsa.crt >/dev/null

if ! security find-identity -v -p codesigning 2>/dev/null | grep -Fq "$CERT_NAME"; then
  echo "ERREUR: impossible de créer l’identité « ${CERT_NAME} »" >&2
  exit 1
fi

echo "$CERT_NAME"
