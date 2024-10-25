import { spawn } from 'child_process';

export async function runPythonCode(code: string, testCases: any[]) {
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

  return new Promise((resolve, reject) => {
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
        reject(new Error(error || 'Execution failed'));
        return;
      }
      try {
        const results = eval(output);
        resolve(results);
      } catch (e) {
        reject(new Error('Invalid output format'));
      }
    });
  });
}