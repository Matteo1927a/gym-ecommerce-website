# Gym E-commerce Website

A web-based e-commerce application for a fitness and gym products store, developed as a software development project.

The application provides a web interface for browsing products and includes user authentication, account management, and administrative functionality.

## Features


- **User authentication:** User registration and login.
- **Session authentication:** JWT-based authentication using HTTP-only cookies.
- **Product catalog:** Browse and view available fitness products.
- **Shopping cart:** Add products to the cart and manage selected items.
- **Simulated checkout:** Complete a demonstration purchase workflow without processing real payments.
- **Order management:** Create and view simulated orders within the application.
- **User area:** Access protected pages after authentication.
- **Administrative area:** Dedicated pages for administrative operations.
- **Multi-server architecture:** Separate Node.js servers for authentication, content handling, and request proxying.


## Technologies

- HTML5
- CSS3
- JavaScript
- Node.js
- Express.js
- MySQL
- JSON Web Tokens (JWT)

## Project Architecture

The application is organized into three Node.js servers:

| Component | Responsibility |
|---|---|
| `auth_server.js` | User registration, login, and authentication-related operations |
| `content_server.js` | Content-related requests and application functionality |
| `proxy_server.js` | Entry point for routing requests to the appropriate server |

Other important directories and files:

```text
.
├── admin/                  # Administrative pages
├── middlewares/            # Middleware for request handling and access control
├── private/                # Pages requiring authentication
├── public/                 # Public pages and static assets
├── auth_server.js          # Authentication server
├── content_server.js       # Content server
├── proxy_server.js         # Reverse proxy
├── database.sql            # Database schema
├── database_dump.sql       # Database dump with sample data
├── package.json            # Dependencies and scripts
├── package-lock.json       # Dependency lock file
├── .env.example            # Example environment configuration
└── .gitignore              # Files excluded from version control
```

## Requirements

Before running the application, make sure you have installed:

- Node.js and npm
- MySQL Server

## Installation and Setup

### 1. Clone the repository

```bash
git clone git@github.com:Matteo1927a/gym-ecommerce-website.git
cd gym-ecommerce-website
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env` file in the project root, using `.env.example` as a reference.

Configure the database connection and authentication settings according to your local environment.

Use a strong, randomly generated JWT secret. Never commit your actual `.env` file.

### 4. Create the database

Create a MySQL database for the application.

To create the database structure, import `database.sql` using your preferred MySQL client.

If you want to load the included sample data as well, import `database_dump.sql` into the appropriate database. Check the dump's database selection and structure before importing it.

**Note:** Do not import both SQL files blindly if the dump already contains the table definitions, as this may result in duplicate-table errors.

### 5. Start the application

Run the configured start script:

```bash
npm start
```

The application starts the servers according to the scripts defined in `package.json`. Check the server configuration for the local address and port used to access the website.

## Security

The project includes several security-related mechanisms:

- Password hashing with bcrypt.
- JWT-based authentication.
- HTTP-only authentication cookies.
- Server-side middleware for protecting restricted resources.
- Parameterized SQL queries to help prevent SQL injection.
- Environment variables for sensitive configuration.

These mechanisms are intended to improve application security; the project should not be considered production-ready without further testing and security review.

## Future Improvements

Potential improvements include:

- Automated tests for authentication and application workflows.
- Improved input validation and error handling.
- Enhanced product search and filtering.
- More comprehensive documentation of the API endpoints.
- Deployment to a production environment with HTTPS and appropriate security settings.

## Author

**Matteo Santoro**

GitHub: [@Matteo1927a](https://github.com/Matteo1927a)


