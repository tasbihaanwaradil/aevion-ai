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
            <img src="/assets/logo.svg" alt="logo" className="h-16.5 w-auto" />
          </Link>

          {/* Desktop Links */}
          <div className="hidden md:flex gap-6 text-sm font-medium text-sky-900">
            <Link to='/' className="hover:text-sky-600">Home</Link>
            {
              isLoggedIn ?
                <Link to='/Dashboard' className="hover:text-sky-600">Dashboard</Link>
                :
                <Link to='#Features' className="hover:text-sky-600">Features</Link>
            }
            {
              isLoggedIn ?
                <Link to='/my-generation' className="hover:text-sky-600">My Generations</Link>
                :
                <Link to='/UseCases' className="hover:text-sky-600">Use Cases</Link>
            }
            {/* Testimonials — landing-page section, shown to visitors only */}
            {!isLoggedIn && (
              <a href="/#testimonials" className="hover:text-sky-600">Testimonials</a>
            )}
          </div>

          <div className="flex items-center gap-2">
            {isLoggedIn ? (
              <div className="relative group">
                <button className="rounded-full size-8 h-8 bg-[#007a8c] text-white font-semibold">
                  {user?.name.charAt(0).toUpperCase()}
                </button>
                <div className="absolute hidden group-hover:block top-6 right-0 pt-4">
                  <button onClick={async () => { await logout(); navigate('/'); }} className="bg-[#007a8c] text-white font-semibold hover:bg-[#005f6a] transition px-4 py-2 rounded">
                    Logout
                  </button>
                </div>
              </div>
            ) : (
              <button onClick={() => navigate('/TeacherLogin')} className="hidden md:inline-flex px-6 py-2 rounded-full bg-[#007a8c] text-white font-semibold hover:bg-[#005f6a] transition">
                Get Started
              </button>

            )}

          </div>

          {/* Mobile */}
          <button onClick={() => setIsOpen(true)} className="md:hidden text-sky-900" aria-label="Open menu">
            <MenuIcon />
          </button>
        </div>
      </nav >

      {/* Mobile Menu — same links as the desktop navbar */}
      <div
        className={`fixed inset-0 z-60 bg-white transition-transform duration-300 ${isOpen ? "translate-x-0" : "translate-x-full"
          }`
        }
      >
        <div className="flex justify-between items-center p-6 border-b">
          <img src="/assets/logo.svg" alt="logo" className="h-8" />
          <XIcon onClick={() => setIsOpen(false)} className="cursor-pointer" aria-label="Close menu" />
        </div>

        <div className="flex flex-col gap-6 p-8">
          <Link to='/' onClick={() => setIsOpen(false)} className="text-lg font-medium text-sky-900 hover:text-sky-600">Home</Link>

          {
            isLoggedIn ?
              <Link to='/Dashboard' onClick={() => setIsOpen(false)} className="text-lg font-medium text-sky-900 hover:text-sky-600">Dashboard</Link>
              :
              <Link to='#Features' onClick={() => setIsOpen(false)} className="text-lg font-medium text-sky-900 hover:text-sky-600">Features</Link>
          }

          {
            isLoggedIn ?
              <Link to='/my-generation' onClick={() => setIsOpen(false)} className="text-lg font-medium text-sky-900 hover:text-sky-600">My Generations</Link>
              :
              <Link to='/UseCases' onClick={() => setIsOpen(false)} className="text-lg font-medium text-sky-900 hover:text-sky-600">Use Cases</Link>
          }

          {/* Testimonials — visitors only */}
          {!isLoggedIn && (
            <a
              href="/#testimonials"
              onClick={() => setIsOpen(false)}
              className="text-lg font-medium text-sky-900 hover:text-sky-600"
            >
              Testimonials
            </a>
          )}

          {
            isLoggedIn ?
              <button
                onClick={async () => { setIsOpen(false); await logout(); navigate('/'); }}
                className="w-fit bg-[#007a8c] text-white font-semibold hover:bg-[#005f6a] transition px-4 py-2 rounded"
              >
                Logout
              </button>
              :
              <Link
                to='/TeacherLogin'
                onClick={() => setIsOpen(false)}
                className="w-fit px-6 py-2 rounded-full bg-[#007a8c] text-white font-semibold hover:bg-[#005f6a] transition"
              >
                Get Started
              </Link>
          }
        </div>
      </div >
    </>
  );
}