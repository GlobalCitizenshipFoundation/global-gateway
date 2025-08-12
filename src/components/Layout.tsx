import React from "react";
import Header from "@/components/Header";
import { MadeWithDyad } from "@/components/made-with-dyad";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-grow">
        {children}
      </main>
      <MadeWithDyad />
    </div>
  );
};

export default Layout;