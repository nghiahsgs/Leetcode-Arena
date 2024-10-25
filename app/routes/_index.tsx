import { json } from "@remix-run/node";
import { useActionData, Form } from "@remix-run/react";
import { useState } from "react";
import Editor from "@monaco-editor/react";
import { spawn } from "child_process";

const initialCode = `def two_sum(nums, target):
    # Write your solution here
    pass`;

const testCases = [
  { input: [[2, 7, 11, 15], 9], expected: [0, 1] },
  { input: [[3, 2, 4], 6], expected: [1, 2] },
  { input: [[3, 3], 6], expected: [0, 1] }
];

export async function action({ request }) {
  const formData = await request.formData();
  const code = formData.get("code");
  
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
        resolve(json({ 
          results: [{ 
            passed: false, 
            error: error || 'Execution failed' 
          }] 
        }));
        return;
      }
      try {
        const results = eval(output);
        resolve(json({ results }));
      } catch (e) {
        resolve(json({ 
          results: [{ 
            passed: false, 
            error: 'Invalid output format' 
          }] 
        }));
      }
    });
  });
}

export default function Index() {
  const actionData = useActionData();
  const [code, setCode] = useState(initialCode);
  const [isRunning, setIsRunning] = useState(false);

  const handleSubmit = async (event) => {
    setIsRunning(true);
    try {
      await fetch(event.target.action, {
        method: 'POST',
        body: new FormData(event.target),
      });
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto p-4">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-2xl font-bold mb-4">Two Sum</h1>
          <div className="prose max-w-none mb-6">
            <p>Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.</p>
            <p>You may assume that each input would have exactly one solution, and you may not use the same element twice.</p>
            
            <h3>Example:</h3>
            <pre className="bg-gray-100 p-2 rounded">
              Input: nums = [2,7,11,15], target = 9
              Output: [0,1]
              Explanation: Because nums[0] + nums[1] == 9, we return [0, 1].
            </pre>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-lg">
            <Form method="post" onSubmit={handleSubmit}>
              <div className="h-[600px] w-full">
                <Editor
                  height="100%"
                  defaultLanguage="python"
                  theme="vs-dark"
                  value={code}
                  onChange={(value) => {
                    setCode(value || "");
                  }}
                  options={{
                    minimap: { enabled: false },
                    fontSize: 14,
                  }}
                />
                <input type="hidden" name="code" value={code} />
              </div>
              <div className="p-4 border-t">
                <button
                  type="submit"
                  disabled={isRunning}
                  className="w-full bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded disabled:opacity-50"
                >
                  {isRunning ? 'Running...' : 'Run Code'}
                </button>
              </div>
            </Form>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold mb-4">Test Results</h2>
            <div className="space-y-4">
              {actionData?.results.map((result, index) => (
                <div
                  key={index}
                  className={`p-4 rounded ${
                    result.passed ? 'bg-green-100' : 'bg-red-100'
                  }`}
                >
                  <div className="font-medium">
                    Test Case {index + 1}: {result.passed ? 'Passed ✓' : 'Failed ✗'}
                  </div>
                  {!result.passed && (
                    <div className="text-sm text-red-600 mt-2">
                      {result.error || `Expected ${JSON.stringify(result.expected)}, but got ${JSON.stringify(result.actual)}`}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}