import { ButtonHTMLAttributes } from 'react';

export function Button({ children, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-gray-400"
      {...props}
    >
      {children}
    </button>
  );
}