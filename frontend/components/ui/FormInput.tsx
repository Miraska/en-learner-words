import { InputHTMLAttributes } from 'react';

export function FormInput({ autoComplete = "off", ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className="border rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
      autoComplete={autoComplete}
      {...props}
    />
  );
}