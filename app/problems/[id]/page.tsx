'use client';

import { useParams } from 'next/navigation';
import { useState } from 'react';
import Editor from '@monaco-editor/react';
import Link from 'next/link';

const problems = {
  'two-sum': {
    title: 'Two Sum',
    description: 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.',
    initialCode: `def two_sum(nums, target):
    # Write your solution here
    pass`,
    testCases: [
      { input: [[2, 7, 11, 15], 9], expected: [0, 1] },
      { input: [[3, 2, 4], 6], expected: [1, 2] },
      { input: [[3, 3], 6], expected: [0, 1] }
    ]
  },
  'palindrome-number': {
    title: 'Palindrome Number',
    description: 'Given an integer x, return true if x is a palindrome, and false otherwise.',
    initialCode: `def is_palindrome(x):
    # Write your solution here
    pass`,
    testCases: [
      { input: [121], expected: true },
      { input: [-121], expected: false },
      { input: [10], expected: false }
    ]
  },
  'valid-parentheses': {
    title: 'Valid Parentheses',
    description: 'Given a string s containing just the characters \'(\', \')\', \'{\', \'}\', \'[\' and \']\', determine if the input string is valid.',
    initialCode: `def is_valid(s):
    # Write your solution here
    pass`,
    testCases: [
      { input: ["()"], expected: true },
      { input: ["()[]{}"], expected: true },
      { input: ["(]"], expected: false }
    ]
  }
};

export default function Problem() {
  const params = useParams();
  const problem = problems[params.id as string];
  
  const [code, setCode] = useState(problem?.initialCode || '');
  const [results, setResults] = useState<any[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [showTestCases, setShowTestCases] = useState(false);

  if (!problem) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Problem not found</h1>
          <Link href="/" className="text-blue-600 hover:text-blue-800">
            Return to problems list
          </Link>
        </div>
      </div>
    );
  }

  const runCode = async () => {
    setIsRunning(true);
    setResults([]);
    
    try {
      const response = await fetch('/api/run', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code, testCases: problem.testCases }),
      });
      
      const data = await response.json();
      setResults(data.results);
    } catch (error: any) {
      setResults([{ passed: false, error: 'Error running code: ' + error.message }]);
    }
    
    setIsRunning(false);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto p-4">
        <div className="mb-4">
          <Link href="/" className="text-blue-600 hover:text-blue-800">
            ← Back to problems
          </Link>
        </div>
        
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-2xl font-bold mb-4">{problem.title}</h1>
          <div className="prose max-w-none mb-6">
            <p>{problem.description}</p>
            
            <div className="mt-4">
              <button
                onClick={() => setShowTestCases(!showTestCases)}
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                {showTestCases ? 'Hide Test Cases' : 'Show Test Cases'}
              </button>
              
              {showTestCases && (
                <div className="mt-2 space-y-2">
                  {problem.testCases.map((test, index) => (
                    <div key={index} className="bg-gray-50 p-3 rounded">
                      <p className="font-medium">Test Case {index + 1}:</p>
                      <p>Input: {JSON.stringify(test.input)}</p>
                      <p>Expected Output: {JSON.stringify(test.expected)}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-lg">
            <div className="h-[600px] w-full">
              <Editor
                height="100%"
                defaultLanguage="python"
                theme="vs-dark"
                value={code}
                onChange={(value) => setCode(value || '')}
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                }}
              />
            </div>
            <div className="p-4 border-t">
              <button
                onClick={runCode}
                disabled={isRunning}
                className="w-full bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded disabled:opacity-50"
              >
                {isRunning ? 'Running...' : 'Run Code'}
              </button>
            </div>
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
}