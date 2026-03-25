"use client";

import { useState } from "react";
import { MenuIcon, XIcon } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Navigate to login page when "Get Started" button is clicked
  const navigate = useNavigate()

  return (
    <>
      <nav
        className="
          fixed top-0 z-50 w-full
          h-20
          px-4 md:px-16 lg:px-24 xl:px-32
          bg-sky-50 backdrop-blur-lg
          border-b border-sky-100
        "
      >
        <div className="max-w-7xl mx-auto h-full flex items-center justify-between">
          {/* Logo */}
          <Link to='/'>
            <img src="/assets/logo.svg" alt="logo" className="h-10.5 w-auto" />
          </Link>

          {/* Desktop Links */}
          <div className="hidden md:flex gap-6 text-sm font-medium text-sky-900">
            <Link to='/' className="hover:text-sky-600">Home</Link>
            <Link to='/LinkedInPostGenerator' className="hover:text-sky-600">Genearate LinkedIn Post</Link>
            <Link to='/my-generation' className="hover:text-sky-600">My Generations</Link>
            <Link to='/contact' className="hover:text-sky-600">Contact Us</Link>
          </div>

          {/* Get Started Button */}
          <button onClick={() => navigate('/login')} className="hidden md:inline-flex px-6 py-2 rounded-full bg-[#007a8c] text-white font-semibold hover:bg-[#005f6a] transition">
            Get Started
          </button>


          {/* Mobile */}
          <button onClick={() => setIsMenuOpen(true)} className="md:hidden text-sky-900">
            <MenuIcon />
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      <div
        className={`fixed inset-0 z-[60] bg-white transition-transform duration-300 ${isMenuOpen ? "translate-x-0" : "translate-x-full"
          }`}
      >
        <div className="flex justify-between items-center p-6 border-b">
          <img src="/assets/logo.svg" className="h-8" />
          <XIcon onClick={() => setIsMenuOpen(false)} className="cursor-pointer" />
        </div>

        <div className="flex flex-col gap-6 p-8">
          <Link to='/' onClick={() => setIsMenuOpen(false)} className="text-lg font-medium text-sky-900 hover:text-sky-600">Home</Link>
          <Link to='/LinkedInPostGenerator' onClick={() => setIsMenuOpen(false)} className="text-lg font-medium text-sky-900 hover:text-sky-600">Genearate LinkedIn Post</Link>
          <Link to='/my-generation' onClick={() => setIsMenuOpen(false)} className="text-lg font-medium text-sky-900 hover:text-sky-600">My Generations</Link>
          <Link to='/contact' onClick={() => setIsMenuOpen(false)} className="text-lg font-medium text-sky-900 hover:text-sky-600">Contact Us</Link>
          <Link to='/login' onClick={() => setIsMenuOpen(false)} className="text-lg font-medium text-sky-900 hover:text-sky-600">Login</Link>
        </div>
      </div>
    </>
  );
}