# Graphator

A real-time sensor data visualization application that fetches temperature data from Home Assistant and displays it in interactive time-series charts.

## Features

- 🚀 Server-side rendering with React Router v7
- ⚡️ Hot Module Replacement (HMR) in development
- 📊 Real-time sensor data visualization
- 🏠 Home Assistant integration
- 🔒 TypeScript for type safety
- 🎨 TailwindCSS for styling
- 🐳 Docker support for multi-architecture deployment (x64 & ARM)

## Getting Started

### Prerequisites

- Node.js 20 or higher
- npm or pnpm
- Home Assistant instance with API access
- Home Assistant Bearer token

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd graphator
```

2. Install dependencies:
```bash
npm install
```

3. Create environment configuration:
```bash
cp .env.example .env
```

4. Edit `.env` and add your Home Assistant credentials:
```env
HOME_ASSISTANT_URL=http://your-home-assistant:8123
HOME_ASSISTANT_TOKEN=your_bearer_token_here
```

### Development

Start the development server with HMR:

```bash
npm run dev
```

Your application will be available at `http://localhost:5173`.

### Type Checking

Run TypeScript type checking:

```bash
npm run typecheck
```

## Building for Production

Create a production build:

```bash
npm run build
```

Run the production server:

```bash
npm run start
```

The application will be available at `http://localhost:3000`.

---

## Docker Deployment

Graphator includes full Docker support with multi-architecture builds for both **x64 (AMD64)** and **ARM** systems.

### Quick Start with Docker

```bash
# Build the image
docker build -t graphator:latest .

# Run the container
docker run -d \
  --name graphator \
  -p 3000:3000 \
  --env-file .env \
  graphator:latest
```

### Quick Start with Docker Compose

```bash
# Start the application
docker compose up -d

# View logs
docker compose logs -f

# Stop the application
docker compose down
```

### Multi-Architecture Builds

Build for both x64 and ARM platforms:

```bash
# Create buildx builder (one-time setup)
docker buildx create --name graphator-builder --use

# Build for multiple architectures
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  -t yourusername/graphator:latest \
  --push \
  .
```

### Supported Platforms

- ✅ `linux/amd64` - x86_64 servers, desktops
- ✅ `linux/arm64` - Raspberry Pi 4, Apple Silicon, AWS Graviton
- ⚠️ `linux/arm/v7` - Raspberry Pi 3 (untested)

### Detailed Documentation

For comprehensive Docker deployment instructions, see [DOCKER.md](./DOCKER.md), which includes:

- Single and multi-architecture build instructions
- Environment variable configuration
- Docker Compose setup
- Pushing to container registries
- CI/CD integration examples
- Troubleshooting guide
- Best practices for production

---

## Project Structure

```
graphator/
├── .ai/                      # Project documentation and requirements
│   ├── charts.md            # Chart library evaluation
│   └── requirements.md      # Detailed project requirements
├── app/
│   ├── components/          # React components (planned)
│   ├── config/             # Configuration files
│   │   └── auth.ts         # Authentication config
│   ├── hooks/              # Custom React hooks (planned)
│   ├── routes/             # Route components
│   │   └── home.tsx        # Home page
│   ├── types/              # TypeScript type definitions (planned)
│   ├── utils/              # Utility functions (planned)
│   └── welcome/            # Welcome page assets
├── public/                 # Static assets
├── build/                  # Production build output
├── .env.example           # Environment variables template
├── docker-compose.yml     # Docker Compose configuration
├── Dockerfile             # Multi-architecture Docker build
├── DOCKER.md              # Comprehensive Docker documentation
└── package.json           # Dependencies and scripts
```

---

## Configuration

### Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `HOME_ASSISTANT_URL` | Your Home Assistant instance URL | Yes | - |
| `HOME_ASSISTANT_TOKEN` | Home Assistant Long-lived access token | Yes | - |
| `NODE_ENV` | Node environment | No | `production` |
| `PORT` | Server port | No | `3000` |

### Getting a Home Assistant Token

1. Log into your Home Assistant instance
2. Click on your profile (bottom left)
3. Scroll to "Long-lived access tokens"
4. Click "Create Token"
5. Give it a name (e.g., "Graphator")
6. Copy the token immediately (you won't see it again)
7. Add it to your `.env` file

---

## Roadmap

See [.ai/requirements.md](./.ai/requirements.md) for detailed project requirements.

### Planned Features

- [ ] Real-time sensor data fetching with periodic updates
- [ ] In-memory data storage with 30-day retention
- [x] ~~Interactive time-series charts~~ (removed - simple card display instead)
- [ ] Time range selection (1 day, 5 days, 30 days)
- [ ] Responsive design for mobile and desktop
- [ ] Error handling and retry logic
- [ ] Loading states and smooth animations

### Future Enhancements

- Multiple sensor support
- Data persistence (localStorage/IndexedDB)
- Export functionality (CSV, JSON)
- Custom date range selection
- Statistical overlays (moving averages, trends)
- Alert thresholds and notifications

---

## Technology Stack

- **Framework**: [React Router v7](https://reactrouter.com/)
- **Runtime**: Node.js 20
- **Language**: TypeScript
- **Styling**: TailwindCSS v4
- **Data Fetching**: TanStack Query (React Query)
- **UI**: Simple card-based display (no charting)
- **Containerization**: Docker with multi-arch support

---

## Deployment Platforms

The containerized application can be deployed to any platform that supports Docker:

- AWS ECS / Fargate
- Google Cloud Run
- Azure Container Apps
- Digital Ocean App Platform
- Fly.io
- Railway
- Self-hosted with Docker Compose
- Raspberry Pi (ARM support)

---

## Development Notes

- Code follows strict TypeScript best practices
- Components are modular and reusable
- Configuration values are externalized
- Chart library evaluation available in `.ai/charts.md`

---

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run type checking: `npm run typecheck`
5. Submit a pull request

---

## License

MIT

---

Built with ❤️ using React Router.
