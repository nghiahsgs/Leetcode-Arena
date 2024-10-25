import express from 'express';
import { spawn } from 'child_process';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

app.post('/api/run', async (req, res) => {
  const { code, testCases } = req.body;

  // Create a complete Python program with test cases
  const fullCode = `
${code}

# Test cases
test_cases = ${JSON.stringify(testCases)}
results = []

for test in test_cases:
    try:
        result = two_sum(*test['input'])
        passed = sorted(result) == sorted(test['expected'])
        results.append({
            'passed': passed,
            'actual': result,
            'expected': test['expected']
        })
    except Exception as e:
        results.append({
            'passed': False,
            'error': str(e)
        })

print(results)
`;

  try {
    const python = spawn('python3', ['-c', fullCode]);
    let output = '';
    let error = '';

    python.stdout.on('data', (data) => {
      output += data.toString();
    });

    python.stderr.on('data', (data) => {
      error += data.toString();
    });

    python.on('close', (code) => {
      if (code !== 0) {
        return res.json({ results: [{ passed: false, error: error || 'Execution failed' }] });
      }
      try {
        const results = eval(output);
        res.json({ results });
      } catch (e) {
        res.json({ results: [{ passed: false, error: 'Invalid output format' }] });
      }
    });
  } catch (error) {
    res.json({ results: [{ passed: false, error: error.message }] });
  }
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});