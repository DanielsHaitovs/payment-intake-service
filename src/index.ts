import { buildApp } from './app';

const app = buildApp();

app.listen({ port: 3000, host: '0.0.0.0' }, (err, address) => {
  if (err) {
    console.error('Failed to start Payment Intake Service:', err);
    process.exit(1);
  }

  console.log('==================================================');
  console.log(`Payment Intake Service initialized successfully!`);
  console.log(`Listening on: ${address}`);
  console.log(`Environment: Node.js ${process.version}`);
  console.log('==================================================');
});
