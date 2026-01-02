# API Documentation

## Base URL

All API routes are prefixed with `/api`

## Authentication

Most API routes require wallet authentication. Include the wallet address in the request:

- Header: `x-wallet-address: 0x...`
- Query parameter: `?walletAddress=0x...`

## Error Responses

All errors follow a standardized format:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {} // Optional additional details
  }
}
```

### Error Codes

- `VALIDATION_ERROR` (400): Input validation failed
- `UNAUTHORIZED` (401): Missing or invalid authentication
- `FORBIDDEN` (403): Insufficient permissions
- `NOT_FOUND` (404): Resource not found
- `CONFLICT` (409): Resource conflict (e.g., already exists)
- `INTERNAL_ERROR` (500): Server error

## Endpoints

### Users

#### Create/Update User
`POST /api/users`

Request body:
```json
{
  "walletAddress": "0x...",
  "userType": "consumer" | "provider" | "both"
}
```

#### Get User
`GET /api/users?walletAddress=0x...`

### Requests

#### Create Request
`POST /api/requests`

Request body:
```json
{
  "requestId": 1,
  "consumerAddress": "0x...",
  "title": "Aerial Photography",
  "description": "Need drone photos of property",
  "locationLat": 40.7128,
  "locationLng": -74.0060,
  "budget": "100000000000000000",
  "deadline": "2024-12-31T23:59:59Z",
  "status": "open"
}
```

#### Get Requests
`GET /api/requests?consumerAddress=0x...&status=open&page=1&limit=20`

Response includes pagination metadata:
```json
{
  "requests": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

### Bids

#### Create Bid
`POST /api/bids`

Request body:
```json
{
  "bidId": 1,
  "requestId": 1,
  "providerAddress": "0x...",
  "amount": "80000000000000000",
  "timeline": 7,
  "status": "pending"
}
```

#### Get Bids
`GET /api/bids?requestId=1&providerAddress=0x...&page=1&limit=20`

### Coverage Areas

#### Create Coverage Area
`POST /api/coverage-areas`

Request body:
```json
{
  "providerAddress": "0x...",
  "locationLat": 40.7128,
  "locationLng": -74.0060,
  "radius": 5000
}
```

Maximum 3 coverage areas per provider.

#### Update Coverage Area
`PUT /api/coverage-areas`

Request body:
```json
{
  "id": 1,
  "locationLat": 40.7128,
  "locationLng": -74.0060,
  "radius": 5000
}
```

#### Delete Coverage Area
`DELETE /api/coverage-areas?id=1`

#### Get Coverage Areas
`GET /api/coverage-areas?providerAddress=0x...`

Returns coverage areas with average ratings when `providerAddress` is not specified.

### Areas of Interest

#### Create/Update Area of Interest
`POST /api/areas-of-interest`

Request body:
```json
{
  "consumerAddress": "0x...",
  "locationLat": 40.7128,
  "locationLng": -74.0060,
  "radius": 5000
}
```

#### Get Area of Interest
`GET /api/areas-of-interest?consumerAddress=0x...`

#### Delete Area of Interest
`DELETE /api/areas-of-interest?consumerAddress=0x...`

### Provider Profiles

#### Get Profile
`GET /api/provider-profiles?providerAddress=0x...`

#### Create Profile
`POST /api/provider-profiles`

Request body:
```json
{
  "providerAddress": "0x...",
  "droneImageUrl": "https://...",
  "droneModel": "DJI Mavic 3",
  "specialization": "Aerial Photography",
  "offersGroundImaging": true,
  "groundImagingTypes": "camera,action_camera",
  "bio": "Professional drone operator..."
}
```

#### Update Profile
`PUT /api/provider-profiles`

Same request body as create, all fields optional.

### Ratings

#### Create Rating
`POST /api/ratings`

Request body:
```json
{
  "providerAddress": "0x...",
  "consumerAddress": "0x...",
  "requestId": 1,
  "rating": 5,
  "comment": "Excellent service!"
}
```

#### Get Ratings
`GET /api/ratings?providerAddress=0x...`

Returns ratings with average and count.

## Rate Limiting

API routes are rate-limited:
- **Read operations**: 60 requests per minute
- **Write operations**: 10 requests per minute
- **Authentication**: 5 requests per 15 minutes

Rate limit headers are included in responses:
- `X-RateLimit-Limit`: Maximum requests
- `X-RateLimit-Remaining`: Remaining requests
- `X-RateLimit-Reset`: Reset time (ISO 8601)
- `Retry-After`: Seconds until retry (on 429)


