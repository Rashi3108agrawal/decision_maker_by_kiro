import { createServer } from './server';

/**
 * Demo script showing the Decision Helper API in action
 */
async function runDemo() {
  console.log('🚀 Starting Decision Helper API Demo...\n');
  
  const app = createServer();
  const server = app.listen(3001, () => {
    console.log('✅ Demo server running on http://localhost:3001');
    console.log('📋 Available endpoints:');
    console.log('   GET  /health - Health check');
    console.log('   GET  /api/options - List all options');
    console.log('   POST /api/options - Create new option');
    console.log('   GET  /api/criteria - List all criteria');
    console.log('   POST /api/criteria - Create new criterion');
    console.log('   POST /api/analysis/analyze - Perform analysis');
    console.log('   GET  /api/templates - List templates');
    console.log('   POST /api/export/markdown - Export as markdown');
    console.log('\n📖 See src/api/README.md for full API documentation');
    console.log('\n🧪 Run tests with: npm test -- --testPathPattern="api"');
    console.log('\n⏹️  Press Ctrl+C to stop the demo server');
  });

  // Graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down demo server...');
    server.close(() => {
      console.log('✅ Demo server stopped');
      process.exit(0);
    });
  });
}

if (require.main === module) {
  runDemo().catch(console.error);
}

export { runDemo };