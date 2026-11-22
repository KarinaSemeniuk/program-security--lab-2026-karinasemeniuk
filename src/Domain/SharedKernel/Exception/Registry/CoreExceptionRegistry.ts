/** Immutable exception allocations for this boundary. */
export enum CoreExceptionRegistry {
  /** Stable registry segment; numeric members below are never reused. */
  SEGMENT = "CORE",
  /** Allocated code for InvalidRequestBody failures. */
  InvalidRequestBody = 1,
  /** Allocated code for RouteNotFound failures. */
  RouteNotFound = 2,
  /** Allocated code for RequestBodyTooLarge failures. */
  RequestBodyTooLarge = 3,
  /** Allocated code for UnsupportedMediaType failures. */
  UnsupportedMediaType = 4,
  /** Allocated code for HttpRequestHandling failures. */
  HttpRequestHandling = 5,
  /** Allocated code for InvalidConfiguration failures. */
  InvalidConfiguration = 6,
  /** Allocated code for InvalidEntityId failures. */
  InvalidEntityId = 7,
  /** Allocated code for OriginNotAllowed failures. */
  OriginNotAllowed = 8,
  /** Allocated code for RateLimitExceeded failures. */
  RateLimitExceeded = 9,
}
