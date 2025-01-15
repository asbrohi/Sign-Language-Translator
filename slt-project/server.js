import express from 'express';
import { spawn } from 'child_process';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import path from 'path';
import cors from 'cors';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
let pythonProcess = null;

// Enable CORS for frontend
app.use(cors({ origin: 'http://localhost:5173' }));

// Increase the payload size limit for JSON data
app.use(express.json({ limit: '20mb' })); // Adjust limit as needed

// Endpoint to start main.py
app.post('/start-translation', (req, res) => {
  if (!pythonProcess) {
    const scriptPath = path.join(__dirname, 'main.py');
    console.log(`Starting main.py at: ${scriptPath}`);

    pythonProcess = spawn('python', [scriptPath]);

    pythonProcess.stdout.on('data', (data) => {
      console.log(`Python output: ${data}`);
    });

    pythonProcess.stderr.on('data', (data) => {
      console.error(`Python error: ${data}`);
    });

    pythonProcess.on('close', (code) => {
      console.log(`Python script closed with code ${code}`);
      pythonProcess = null;
    });

    res.status(200).send('Translation started');
  } else {
    res.status(400).send('Translation is already running');
  }
});

// Endpoint to stop main.py
app.post('/stop-translation', (req, res) => {
  if (pythonProcess) {
    pythonProcess.kill('SIGINT');
    pythonProcess = null;
    res.status(200).send('Translation stopped');
  } else {
    res.status(400).send('Translation is not running');
  }
});

// Start the server on port 5002
app.listen(5002, () => {
  console.log('Server listening on port 5002');
});
