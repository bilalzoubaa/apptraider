import React from "react";
import Header from "../components/Header";
import { UserProvider } from "../context/UserContext";
import { ThemeProvider } from "../context/ThemeContext";

export default function App({ children }) {
  return (
    <ThemeProvider>
      <UserProvider>
        <div className="min-h-screen bg-white dark:bg-gray-950 transition-colors duration-200">
          <Header />
          <main className="max-w-6xl mx-auto px-4 py-6">{children}</main>
        </div>
      </UserProvider>
    </ThemeProvider>
  );
}
