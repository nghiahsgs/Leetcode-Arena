import { useState } from "react";
import { NextPage } from "next";
import dynamic from "next/dynamic";
import { useRouter } from "next/router";

const Editor = dynamic(
  () => import("@monaco-editor/react"),
  { ssr: false }
);

const initialCode = `def two_sum(nums, target):
    # Write your solution here
    pass`;

const testCases = [
  { input: [[2, 7, 11, 15], 9], expected: [0, 1] },
  { input: [[3, 2, 4], 6], expected: [1, 2] },
  { input: [[3, 3], 6], expected: [0, 1] }
];

const Index: NextPage = () => {
  const router = useRouter();
  const [code, setCode] = useState(initialCode);
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<any[]>([]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsRunning(true);
    try {
      const response = await fetch('/api/run-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code }),
      });
      const data = await response.json();
      setResults(data.results);
    } catch (error) {
      console.error('Error:', error);
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
            <form onSubmit={handleSubmit}>
              <div className="h-[600px] w-full">
                <Editor
                  height="100%"
                  defaultLanguage="python"
                  theme="vs-dark"
                  value={code}
                  onChange={(value) => setCode(value || "")}
                  options={{
                    minimap: { enabled: false },
                    fontSize: 14,
                  }}
                />
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
            </form>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold mb-4">Test Results</h2>
            <div className="space-y-4">
              {results.map((result, index) => (
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
};

export default Index;