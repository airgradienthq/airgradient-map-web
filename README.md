# AirGradient Map

AirGradient Map is a web application for visualizing and analyzing air quality data.

🌍 Explore it live: [map-int.airgradient.com](https://map-int.airgradient.com/)


<p align="center">
  <a href="https://github.com/user-attachments/assets/04455b37-6fe3-4584-b750-f49679d260fa">
    <img src="https://github.com/user-attachments/assets/04455b37-6fe3-4584-b750-f49679d260fa" width="800" alt="Screenshot of the map application">
  </a>
</p>


⚠️ **Important:** This repository is a more scalable replacement for our current [production app](https://www.airgradient.com/map/). 
The old app’s tech stack can’t scale to meet our requirements, so we’ve built this new codebase. First, we’ll migrate all existing features here; once that’s done, we’ll layer on new enhancements and capabilities.



## 💬 Join the Discussion on Discord

Have questions or want to share feedback? Join our community on [Discord](https://discord.gg/5u2C5T33) to chat, ask questions, and collaborate with other contributors!

## Development Setup

There are two ways to run the application locally: using Docker (recommended) or directly with Node.js.

### Option 1: Using Docker (Recommended)

Prerequisites:
- Docker
- Docker Compose

Both can be installed from: https://docs.docker.com/compose/install/

1. **Clone the repository**:
```bash
git clone https://github.com/airgradienthq/airgradient-map-web
cd ag-map-client
```

2. **Start the development server**:

You can configure if your locally run web app calls the online running API backend or locally run version in the nuxt.config.ts file apiUrl section. Default is set to call locally if not deployed in production.

```bash
docker-compose up
```

The application will be available at `http://localhost:3000`

To stop the server:
```bash
docker-compose down
```

To rebuild the container after dependency changes:
```bash
docker-compose up --build
```

### Option 2: Direct Node.js Setup

Prerequisites:
- Node.js v22 or higher

1. **Install dependencies**:
```bash
npm install
```

2. **Start the development server**:
```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## Mobile Development

For mobile development (iOS), use the following commands:

```bash
# iOS
npm run add:ios
npm run build:dev:ios

```

Note: Mobile development requires direct Node.js setup (Option 2) and cannot be run through Docker. Currently, mobile development is in the early stages and is not fully ready for production use. Please check back for updates on mobile readiness.

## Production Build

The production deployment is handled via Docker. The necessary configuration files are included in the repository:

- `Dockerfile`: Contains the production build configuration
  - `NODE_ENV`: Set to 'production'
  - `HOST`: Set to '0.0.0.0'
  - `PORT`: Set to '80'

 To build and run the production environment:
```bash
docker-compose -f docker-compose.prod.yml up --build -d
```

To stop the production environment:
```bash
docker-compose -f docker-compose.prod.yml down
```


## Development Commands

```bash
# Start development server with Docker
docker-compose up

# Rebuild Docker container
docker-compose up --build

# Clean Docker volumes and rebuild
docker-compose down -v && docker-compose up --build

# Start development server without Docker
npm run dev

# Run tests
npm run test

# Format code
npm run format
```

## Project Structure

```bash
ag-map-client/
├── components/     # Vue components
├── pages/         # Application pages
├── public/        # Static files
├── layouts/       # Page layouts
├── assets/        # Assets (images, styles, etc.)
├── store/         # State management
├── utils/         # Utility functions
├── types/         # TypeScript types
├── Dockerfile     # Production Docker configuration
└── docker-compose.yml  # Development Docker configuration
```

## Branching Model

- `main`: Stable, production-ready code.
- `development`: Active development branch. Please base your pull requests on `development`.

## Additional Information

- The application uses SSR (Server-Side Rendering) in production
- For local development, the application runs in development mode with hot-reload enabled
- Docker development setup includes volume mounts for hot-reloading
- The production build is optimized for performance and security

## Troubleshooting

Common issues and solutions:

1. **Port already in use**:
```bash
# Check what's using port 3000
lsof -i :3000
# Kill the process
kill -9 <PID>
```

2. **Docker cache issues**:
```bash
# Clean Docker cache and rebuild
docker-compose down -v
docker-compose up --build
```

3. **Node modules issues**:
```bash
# Remove node_modules and reinstall
rm -rf node_modules
npm install
```

## License

This project is licensed under the GNU General Public License v3.0 (GPL-3.0).

