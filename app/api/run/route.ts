import { NextResponse } from 'next/server';
import { spawn } from 'child_process';

export async function POST(request: Request) {
  const { code, testCases } = await request.json();

  // Add proper string formatting for Python output
  const fullCode = `
${code}

# Test cases
test_cases = ${JSON.stringify(testCases)}
results = []

def compare_results(result, expected):
    if isinstance(result, list) and isinstance(expected, list):
        return sorted(result) == sorted(expected)
    return result == expected

for test in test_cases:
    try:
        if 'two_sum' in locals():
            result = two_sum(*test['input'])
        elif 'is_palindrome' in locals():
            result = is_palindrome(*test['input'])
        elif 'is_valid' in locals():
            result = is_valid(*test['input'])
        else:
            raise Exception('No valid function found')
            
        passed = compare_results(result, test['expected'])
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

# Format output as proper JSON string
import json
print(json.dumps(results))
`;

  try {
    const results = await new Promise((resolve, reject) => {
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
          // Parse the JSON string output
          const results = JSON.parse(output.trim());
          resolve(results);
        } catch (e) {
          reject(new Error('Invalid output format'));
        }
      });
    });

    return NextResponse.json({ results });
  } catch (error: any) {
    return NextResponse.json({ 
      results: [{ 
        passed: false, 
        error: error.message || 'An error occurred while running the code' 
      }] 
    });
  }
}