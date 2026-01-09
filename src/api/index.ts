import { startServer } from './server';

// Get port from environment or default to 3000
const port = parseInt(process.env.PORT || '3000', 10);

// Start the server
startServer(port);