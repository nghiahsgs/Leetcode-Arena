'use client';

import Link from 'next/link';

const problems = [
  {
    id: 'two-sum',
    title: 'Two Sum',
    difficulty: 'Easy',
    description: 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.'
  },
  {
    id: 'palindrome-number',
    title: 'Palindrome Number',
    difficulty: 'Easy',
    description: 'Given an integer x, return true if x is a palindrome, and false otherwise.'
  },
  {
    id: 'valid-parentheses',
    title: 'Valid Parentheses',
    difficulty: 'Easy',
    description: 'Given a string s containing just the characters \'(\', \')\', \'{\', \'}\', \'[\' and \']\', determine if the input string is valid.'
  }
];

export default function Problems() {
  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto p-4">
        <h1 className="text-3xl font-bold mb-6">Coding Problems</h1>
        <div className="grid gap-4">
          {problems.map((problem) => (
            <Link 
              key={problem.id}
              href={`/problems/${problem.id}`}
              className="block bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-bold mb-2">{problem.title}</h2>
                  <p className="text-gray-600 mb-2">{problem.description}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium
                  ${problem.difficulty === 'Easy' ? 'bg-green-100 text-green-800' :
                    problem.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'}`}>
                  {problem.difficulty}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}