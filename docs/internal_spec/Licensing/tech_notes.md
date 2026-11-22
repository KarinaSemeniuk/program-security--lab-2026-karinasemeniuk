# Licensing technical notes

- Trust roots are deployment-managed public keys, never supplied in HTTP requests.
- API reads fresh signed bytes per gated operation and does not read issuer private keys.
- Local development initialization creates a one-year all-capabilities entitlement;
  deployment must exclude issuer private keys and preserve trusted public references.
- Server clock and filesystem/configuration administrators are trusted in this model.
- Entitlement failure never traps existing data: reads and cancellation remain available.
- License signing and release signing use separate RSA key pairs; note AES keys and
  JWT HMAC secret are also independent.
