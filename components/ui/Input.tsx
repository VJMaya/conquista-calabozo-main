// components/ui/Input.tsx
import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input: React.FC<InputProps> = ({ label, error, className = '', ...props }) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-dungeon-text-secondary mb-2 uppercase text-sm font-bold">
          {label}
        </label>
      )}
      <input
        className={`dungeon-input ${error ? 'border-dungeon-red' : ''} ${className}`}
        {...props}
      />
      {error && (
        <p className="text-dungeon-red text-sm mt-1">{error}</p>
      )}
    </div>
  );
};

export default Input;
