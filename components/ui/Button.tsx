// components/ui/Button.tsx
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  className = '',
  ...props
}) => {
  const baseStyles = 'font-bold uppercase tracking-wide transition-opacity disabled:opacity-50 disabled:cursor-not-allowed';

  const variantStyles = {
    primary: 'bg-dungeon-border text-dungeon-bg hover:opacity-90',
    secondary: 'bg-dungeon-secondary border-2 border-dungeon-border text-dungeon-text hover:bg-dungeon-border hover:text-dungeon-bg',
    danger: 'bg-dungeon-red text-dungeon-bg hover:opacity-90',
    success: 'bg-dungeon-green text-dungeon-bg hover:opacity-90',
  };

  const sizeStyles = {
    sm: 'px-3 py-1 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
  };

  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      {...props}
    />
  );
};

export default Button;
