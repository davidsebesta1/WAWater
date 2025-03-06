# API Documentation

## Endpoints Overview

| Method | Endpoint          | Description | Input Format | Output Format | Example |
|--------|------------------|-------------|--------------|--------------|---------|
| GET | `/houses` | Retrieves all houses associated with the authenticated user | Header: `{ Authorization: 'Bearer <token>' }` | JSON array of houses | `[{"ID":1,"Address":"123 Main St","User_ID":1}]` |
| GET | `/gauges` | Retrieves all gauges associated with the user's houses | Header: `{ Authorization: 'Bearer <token>' }` | JSON array of gauges | `[{"ID":1,"SerialNumber":"123ABC","Type":"ColdWater","House_ID":1}]` |
| GET | `/form` | Serves the `form.html` file | None | HTML | HTML page |
| GET | `/style.css` | Serves the `style.css` file | None | CSS | CSS file |
| GET | `/script.js` | Serves the `script.js` file | None | JavaScript | JavaScript file |
| POST | `/register` | Registers a new user | `{ "name": "username", "password": "password" }` | String response | `"User registered successfully."` |
| POST | `/login` | Logs in a user and returns a JWT token | `{ "name": "username", "password": "password" }` | `{ "token": "jwt_token" }` | `{ "token": "eyJhbGciOiJIUzI1NiIs..." }` |
| POST | `/setTriggers` | Sets triggers for alerts on house usage | `{ "houseId": 1, "triggers": [{"month": 1, "year": 2024, "alertTypeId": 1, "limit": 100}] }` | String response | `"Triggers saved successfully."` |
| POST | `/gauge/add` | Adds a gauge to a house | `{ "serialNumber": "123ABC", "type": "ColdWater", "houseId": 1 }` | String response | `"Gauge added successfully."` |
| POST | `/upload` | Uploads an Excel file with usage data | Multipart form data: `{ file: <file>, gaugeId: 1 }` | String response | `"Success"` |
| POST | `/house/add` | Adds a new house for the authenticated user | `{ "address": "123 Main St" }` | String response | `"Success"` |
| POST | `/gauge/usage` | Retrieves gauge usage for a specific house for the current month | `{ "houseId": 1 }` | JSON array of usage data | `[{ "SerialNumber": "123ABC", "Type": "ColdWater", "Heat": 0, "ColdWater": 50, "HotWater": 20 }]` |
| PUT | `/house/edit` | Edits an existing house | `{ "id": 1, "address": "456 Elm St", "userId": 1 }` | String response | `"House updated successfully."` |
| DELETE | `/house/delete/{id}` | Deletes a house by ID | None | String response | `"House deleted successfully."` |

## Authentication

Most endpoints require authentication via a JWT token. The token must be included in the `Authorization` header as `Bearer <token>`.

## Error Handling

Responses will include appropriate HTTP status codes:
- `400 Bad Request` for missing or invalid input
- `401 Unauthorized` for missing or invalid token
- `403 Forbidden` for unauthorized access to a resource
- `500 Internal Server Error` for unexpected issues

