# EcoMap API Documentation

This document provides an overview and details of the RESTful API endpoints for the EcoMap application. It is intended for UI developers to understand how to interact with the backend services.

## Base URL

The base URL for the API endpoints is:

`http://localhost:4444` (Assuming your application is running on port 4444)

## Authentication

Most endpoints require authentication using a JSON Web Token (JWT). 

1.  **Register** a new user using the `/api/users/register` endpoint.
2.  **Login** using the `/api/users/login` endpoint to obtain a JWT token.
3.  Include the JWT token in the `Authorization` header of subsequent requests in the format: `Bearer <your_token>`.

## Endpoints

### User Management (`/api/users`)

APIs for managing user accounts.

*   **`POST /api/users/register`**
    *   **Description:** Registers a new user account.
    *   **Authentication:** None required.
    *   **Request Body:** `application/json`
        ```json
        {
          "name": "string",
          "email": "string",
          "password": "string"
        }
        ```
    *   **Responses:**
        *   `200 OK`: User registered successfully. Returns the user object and JWT token.
            ```json
            {
              "user": { // User object details excluding password },
              "token": "your_jwt_token"
            }
            ```
        *   `400 Bad Request`: Email already exists or invalid input.

*   **`POST /api/users/login`**
    *   **Description:** Authenticates a user and returns a JWT token.
    *   **Authentication:** None required.
    *   **Request Body:** `application/json`
        ```json
        {
          "email": "string",
          "password": "string"
        }
        ```
    *   **Responses:**
        *   `200 OK`: Login successful. Returns the user object and JWT token.
            ```json
            {
              "user": { // User object details excluding password },
              "token": "your_jwt_token"
            }
            ```
        *   `401 Unauthorized`: Invalid credentials.

*   **`GET /api/users/{id}`**
    *   **Description:** Retrieves user details by ID.
    *   **Authentication:** Required.
    *   **Parameters:**
        *   `id` (Path Variable, required): User ID.
    *   **Responses:**
        *   `200 OK`: User found. Returns the user object.
        *   `404 Not Found`: User not found.

*   **`PUT /api/users/{id}`**
    *   **Description:** Updates user details by ID.
    *   **Authentication:** Required.
    *   **Parameters:**
        *   `id` (Path Variable, required): User ID.
    *   **Request Body:** `application/json` (User object with updated details)
        ```json
        {
          "id": 0,
          "name": "string",
          "email": "string",
          "password": "string" // Optional: include only if changing password
        }
        ```
    *   **Responses:**
        *   `200 OK`: User updated successfully. Returns the updated user object.
        *   `404 Not Found`: User not found.
        *   `400 Bad Request`: Invalid input.

*   **`DELETE /api/users/{id}`**
    *   **Description:** Deletes a user by ID.
    *   **Authentication:** Required.
    *   **Parameters:**
        *   `id` (Path Variable, required): User ID.
    *   **Responses:**
        *   `200 OK`: User deleted successfully.
        *   `404 Not Found`: User not found.

### Car Management (`/api/cars`)

APIs for managing cars associated with a user.

*   **`POST /api/cars`**
    *   **Description:** Creates a new car for the authenticated user.
    *   **Authentication:** Required.
    *   **Request Body:** `application/json`
        ```json
        {
          "name": "string",
          "model": "string",
          "fuelConsumption": 0.0
        }
        ```
    *   **Responses:**
        *   `200 OK`: Car created successfully. Returns the created car object.
        *   `400 Bad Request`: Invalid input.
        *   `401 Unauthorized`: User not authenticated.

*   **`GET /api/cars/{id}`**
    *   **Description:** Retrieves car details by ID.
    *   **Authentication:** Required.
    *   **Parameters:**
        *   `id` (Path Variable, required): Car ID.
    *   **Responses:**
        *   `200 OK`: Car found. Returns the car object.
        *   `404 Not Found`: Car not found.

*   **`GET /api/cars/user/{userId}`**
    *   **Description:** Retrieves all cars belonging to a specific user by User ID.
    *   **Authentication:** Required.
    *   **Parameters:**
        *   `userId` (Path Variable, required): User ID.
    *   **Responses:**
        *   `200 OK`: Cars found. Returns a list of car objects.

*   **`PUT /api/cars/{id}`**
    *   **Description:** Updates car details by ID.
    *   **Authentication:** Required.
    *   **Parameters:**
        *   `id` (Path Variable, required): Car ID.
    *   **Request Body:** `application/json`
        ```json
        {
          "name": "string",
          "model": "string",
          "fuelConsumption": 0.0
        }
        ```
    *   **Responses:**
        *   `200 OK`: Car updated successfully. Returns the updated car object.
        *   `404 Not Found`: Car not found.
        *   `400 Bad Request`: Invalid input.

*   **`DELETE /api/cars/{id}`**
    *   **Description:** Deletes a car by ID.
    *   **Authentication:** Required.
    *   **Parameters:**
        *   `id` (Path Variable, required): Car ID.
    *   **Responses:**
        *   `200 OK`: Car deleted successfully.
        *   `404 Not Found`: Car not found.

### Route Management (`/api/routes`)

APIs for managing routes and integrating with OpenRouteService.

*   **`POST /api/routes`**
    *   **Description:** Creates a new route for the authenticated user (saves coordinates and timestamp).
    *   **Authentication:** Required.
    *   **Request Body:** `application/json`
        ```json
        {
          "startCoordinate": 0.0,
          "endCoordinate": 0.0
        }
        ```
    *   **Responses:**
        *   `200 OK`: Route created successfully. Returns the created route object.
        *   `400 Bad Request`: Invalid input.
        *   `401 Unauthorized`: User not authenticated.

*   **`GET /api/routes/{id}`**
    *   **Description:** Retrieves route details by ID.
    *   **Authentication:** Required.
    *   **Parameters:**
        *   `id` (Path Variable, required): Route ID.
    *   **Responses:**
        *   `200 OK`: Route found. Returns the route object.
        *   `404 Not Found`: Route not found.

*   **`GET /api/routes/user/{userId}`**
    *   **Description:** Retrieves all routes belonging to a specific user by User ID.
    *   **Authentication:** Required.
    *   **Parameters:**
        *   `userId` (Path Variable, required): User ID.
    *   **Responses:**
        *   `200 OK`: Routes found. Returns a list of route objects.

*   **`PUT /api/routes/{id}`**
    *   **Description:** Updates route details by ID.
    *   **Authentication:** Required.
    *   **Parameters:**
        *   `id` (Path Variable, required): Route ID.
    *   **Request Body:** `application/json`
        ```json
        {
          "startCoordinate": 0.0,
          "endCoordinate": 0.0
        }
        ```
    *   **Responses:**
        *   `200 OK`: Route updated successfully. Returns the updated route object.
        *   `404 Not Found`: Route not found.
        *   `400 Bad Request`: Invalid input.

*   **`DELETE /api/routes/{id}`**
    *   **Description:** Deletes a route by ID.
    *   **Authentication:** Required.
    *   **Parameters:**
        *   `id` (Path Variable, required): Route ID.
    *   **Responses:**
        *   `200 OK`: Route deleted successfully.
        *   `404 Not Found`: Route not found.

*   **`GET /api/routes/geocode/search`**
    *   **Description:** Searches for locations using the OpenRouteService Geocoding API based on text input.
    *   **Authentication:** Required.
    *   **Parameters:**
        *   `text` (Request Parameter, required): The location search query.
    *   **Responses:**
        *   `200 OK`: Geocoding search successful. Returns the raw JSON response from OpenRouteService.
        *   `401 Unauthorized`: User not authenticated.
        *   (Other potential error responses from OpenRouteService will be proxied)

*   **`POST /api/routes/calculate-route`**
    *   **Description:** Calculates a route between coordinates using the OpenRouteService Routing API.
    *   **Authentication:** Required.
    *   **Request Body:** `application/json` (Format required by OpenRouteService Routing API, e.g., with `coordinates`)
        ```json
        { // Example request body structure for OpenRouteService
          "coordinates": [
            [8.34234, 48.23424],
            [8.34423, 48.23624]
          ],
          "profile": "driving-car"
        }
        ```
    *   **Responses:**
        *   `200 OK`: Route calculation successful. Returns the raw JSON response from OpenRouteService.
        *   `400 Bad Request`: Invalid input (e.g., invalid coordinates format).
        *   `401 Unauthorized`: User not authenticated.
        *   (Other potential error responses from OpenRouteService will be proxied)

*   **`POST /api/routes/calculate`**
    *   **Description:** Calculates a route between start and end coordinates (placeholder implementation that saves to DB). This endpoint might be redundant with `/api/routes/calculate-route`.
    *   **Authentication:** Required.
    *   **Request Body:** `application/json`
        ```json
        {
          "startCoordinate": 0.0,
          "endCoordinate": 0.0
        }
        ```
    *   **Responses:**
        *   `200 OK`: Route calculated successfully. Returns the saved route object.
        *   `400 Bad Request`: Invalid input.
        *   `401 Unauthorized`: User not authenticated.

## Running the Application

1.  Ensure you have Java and Maven installed.
2.  Set up your PostgreSQL database and update `src/main/resources/application.properties` with your database credentials.
3.  Navigate to the project root in your terminal.
4.  Run the application using Maven:
    ```bash
    mvn spring-boot:run
    ```

## Accessing Swagger UI

Once the application is running, you can access the interactive API documentation (Swagger UI) at:

`http://localhost:4444/swagger-ui/index.html`

Use the Swagger UI to explore the endpoints, test requests, and see example request/response bodies. 