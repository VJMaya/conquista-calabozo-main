// components/Layout.tsx
import React from 'react';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-dungeon-bg text-dungeon-text">
      {children}
    </div>
  );
};

export default Layout;
