Welcome to viyl store
This is a backend application which allow's you to register, search and buy vinyls online.

## Core Backend Service

- **NodeJs**
- **TypeScript**

## Framework

- **NestJs**

## Database

- **PostgresSQL**

## ORM

- **TypeORM**

## Host

- **Render**

## Services

- **AWS**
- **Google**
- **Stripe**
- **Discogs**
- **Telegram**

## Project Structure

- **`.husky/`**: Contains pre-commit hooks configured to run ESLint checks automatically.
- **`admin/`**: Handles admin specific routes.
- **`auth/`**: Handles authentication and authorization logic.
- **`common/`**: Contains shared code that is reused across multiple modules.
- **`discogs/`**: Handles discog API logic.
- **`email/`**: Handles email functionality
- **`eventBus/`**: Implements the centralized Event-Driven Communication System across the app.
- **`file/`**: Handles file upload logic to AWS.
- **`guards/`**: Contains authentication and authorization guards used to protect routes.
- **`interceptors/`**: Custom NestJS interceptors to modify or handle requests/responses globally
- **`orders/`**: Handles vinyls order routes.
- **`payments/`**: Integrates Stripe API for secure payment.
- **`reviews/`**: Handles user reviews on purchased vinyls.
- **`scripts/`**: Handles initial 50 vinyls upload from discogs.
- **`system-logs/`**: Stores CRUD operations in database (expect GET requests).
- **`telegram/`**: Integrates telegram bot to send notifications in chats.
- **`migrations/`**: Contains migration files to create tables and add dummy data.
- **`posts/`**: Handles post-related functionality.
- **`users/`**: Handles user-related functionality.
- **`vinyls/`**: Handles vinyl interaction with users.
- **`utils/`**: Helper functions and utilities.
- **`main.ts`**: Entry point of the application; responsible for server creation.

## Getting Started

1. **Clone the Repository:**
    ```bash
    git clone https://nodejs-course-2025-gitlab.codelx.dev/nodejs-courses-2025-georgia/nika-panchulidze.git
    ```
2. **Navigate to the Project Directory:**
    ```
    cd nika-panchulidze
    ```
3. **Install necessary dependencies:**
    ```
    npm install
    ```
4. **Create a `.env` file in the project root**
5. **Inside the `.env` file, paste content from `.env.sample` file:**
6. **Start project:**
    ```
    npm run start:dev
    ```

## URL

`https://vinyl-uf5e.onrender.com/
    `

## Documentation

**Open Swagger API Documentation:**
`https://vinyl-uf5e.onrender.com/api-docs#/
    `

## Usage:

After running the application, the terminal will display the root URL you should use. (locally)

## Testing routes coverage:

    npm run test:cov

## ⚠️ **ATTENTION:**

Make sure you have end of line sequence selected as LF instead of CRLF in your IDE to avoid Eslint errors.
