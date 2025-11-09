import { HTMLAttributes } from 'react';

export function Card({ children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className="border rounded-lg p-6 shadow-md bg-white" {...props}>
      {children}
    </div>
  );
}