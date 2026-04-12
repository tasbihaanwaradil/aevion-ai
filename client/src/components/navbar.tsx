"use client";

import { useState } from "react";
import { MenuIcon, XIcon } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { isLoggedIn, user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

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
            {
              isLoggedIn ?
                <Link to='/LinkedInPostGenerator' className="hover:text-sky-600">Genearate LinkedIn Post</Link>
                :
                <Link to='#' className="hover:text-sky-600">About</Link>
            }
            {
              isLoggedIn ?
                <Link to='/my-generation' className="hover:text-sky-600">My Generations</Link>
                :
                <Link to='/contact' className="hover:text-sky-600">Contact Us</Link>
            }
          </div>

          <div className="flex items-center gap-2">
            {isLoggedIn ? (
              <div className="relative group">
                <button className="rounded-full size-8 h-8 bg-[#007a8c] text-white font-semibold">
                  {user?.name.charAt(0).toUpperCase()}
                </button>
                <div className="absolute hidden group-hover:block top-6 right-0 pt-4">
                  <button onClick={() => logout()} className="bg-[#007a8c] text-white font-semibold hover:bg-[#005f6a] transition px-4 py-2 rounded">
                    Logout
                  </button>
                </div>
              </div>
            ) : (
              <button onClick={() => navigate('/login')} className="hidden md:inline-flex px-6 py-2 rounded-full bg-[#007a8c] text-white font-semibold hover:bg-[#005f6a] transition">
                Get Started
              </button>

            )}

          </div>

          {/* Get Started Button */}



          {/* Mobile */}
          <button onClick={() => setIsOpen(true)} className="md:hidden text-sky-900">
            <MenuIcon />
          </button>
        </div>
      </nav >

      {/* Mobile Menu */}
      < div
        className={`fixed inset-0 z-[60] bg-white transition-transform duration-300 ${isOpen ? "translate-x-0" : "translate-x-full"
          }`
        }
      >
        <div className="flex justify-between items-center p-6 border-b">
          <img src="/assets/logo.svg" className="h-8" />
          <XIcon onClick={() => setIsOpen(false)} className="cursor-pointer" />
        </div>

        <div className="flex flex-col gap-6 p-8">
          <Link to='/' onClick={() => setIsOpen(false)} className="text-lg font-medium text-sky-900 hover:text-sky-600">Home</Link>
          {
            isLoggedIn ?
              <Link to='/LinkedInPostGenerator' onClick={() => setIsOpen(false)} className="text-lg font-medium text-sky-900 hover:text-sky-600">Genearate LinkedIn Post</Link>
              :
              <Link to='#' onClick={() => setIsOpen(false)} className="text-lg font-medium text-sky-900 hover:text-sky-600">About</Link>
          }

          {
            isLoggedIn ?
              <Link to='/my-generation' onClick={() => setIsOpen(false)} className="text-lg font-medium text-sky-900 hover:text-sky-600">My Generations</Link>
              :
              <Link to='/contact' onClick={() => setIsOpen(false)} className="text-lg font-medium text-sky-900 hover:text-sky-600">Contact Us</Link>
          }

          {
            isLoggedIn ?
              <button onClick={() => { setIsOpen(false); logout(); }}>Logout</button>
              : <Link onClick={() => setIsOpen(false)} to='/login' >Login</Link>
          }
          <Link to='/login' onClick={() => setIsOpen(false)} className="text-lg font-medium text-sky-900 hover:text-sky-600">Login</Link>
        </div>
      </div >
    </>
  );
}