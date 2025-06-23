import express from 'express';
import { exec } from 'child_process';

const app = express();
app.use(express.json());

const ALLOWED = ['build', 'check', 'test', 'run'];

app.post('/api/cargo', (req, res) => {
  const { args = [] } = req.body || {};
  const sub = args[0];
  if (!sub || !ALLOWED.includes(sub)) {
    return res.status(400).json({ output: 'invalid subcommand', exitCode: 1 });
  }
  exec(`cargo ${args.join(' ')}`, { cwd: process.cwd() }, (err, stdout, stderr) => {
    const output = stdout + stderr;
    if (err) {
      res.json({ output, exitCode: err.code ?? 1 });
    } else {
      res.json({ output, exitCode: 0 });
    }
  });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`cargo server listening on ${PORT}`);
});
