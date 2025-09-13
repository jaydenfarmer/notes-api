# Notes API

A simple RESTful API for managing notes.

## Features

- User registration and login
- Secure password hashing
- JWT-based authentication
- CRUD operations for notes (Create, Read, Update, Delete)
- Notes are private to each user

## Tech Stack

- Node.js
- Express
- SQLite
- bcrypt
- jsonwebtoken

## Getting Started

### Prerequisites

- Node.js (v18+ recommended)
- npm

### Installation

```bash
git clone https://github.com/jaydenfarmer/notes-api.git
cd notes-api
npm install
```

### Running the API

```bash
npm start
```

The API will be available at `http://localhost:3000`.

## API Endpoints

| Method | Endpoint     | Description       |
| ------ | ------------ | ----------------- |
| GET    | `/notes`     | List all notes    |
| GET    | `/notes/:id` | Get a single note |
| POST   | `/notes`     | Create a new note |
| PUT    | `/notes/:id` | Update a note     |
| DELETE | `/notes/:id` | Delete a note     |

## License

MIT
