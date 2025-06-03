# Ecomap UI

A modern web application for interactive mapping and route visualization built with React, TypeScript, and Mapbox GL.

## Features

- Interactive map visualization using Mapbox GL
- Route planning and polyline encoding/decoding
- Modern UI with Tailwind CSS
- Type-safe development with TypeScript
- Fast development with Vite

## Prerequisites

- Node.js (Latest LTS version recommended)
- npm or yarn package manager

## Getting Started

1. Clone the repository:
```bash
git clone [repository-url]
cd ecomap-ui
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Start the development server:
```bash
npm run dev
# or
yarn dev
```

The application will be available at `http://localhost:5173` by default.

## Available Scripts

- `npm run dev` - Start the development server
- `npm run build` - Build the application for production
- `npm run lint` - Run ESLint to check code quality
- `npm run preview` - Preview the production build locally

## Tech Stack

- **Frontend Framework**: React 19
- **Build Tool**: Vite
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Mapping**: Mapbox GL
- **Routing**: React Router DOM
- **HTTP Client**: Axios
- **Code Quality**: ESLint, TypeScript ESLint

## Project Structure

```
ecomap-ui/
├── src/           # Source files
├── public/        # Static assets
├── index.html     # Entry HTML file
└── vite.config.ts # Vite configuration
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
