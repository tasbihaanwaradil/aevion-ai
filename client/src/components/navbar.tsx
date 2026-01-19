"use client";

import { useState } from "react";
import { MenuIcon, XIcon } from "lucide-react";
import { links } from "../data/links";
import type { ILink } from "../../types";

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

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
          {/* Logo - Added mix-blend-mode or contrast filters if needed */}
          <img
            src="/assets/logo.svg"
            alt="Aevion AI"
            /* If the logo is too dark: use "brightness-0 invert" to make it white.
               If the logo is too light: use "brightness-110" or "contrast-125".
            */
            className="h-10 w-auto object-contain transition-all duration-300"
          />

          {/* Desktop Links */}
          <div className="hidden md:flex gap-6 text-sm font-medium text-sky-900">
            {links.map((link: ILink) => (
              <a key={link.name} href={link.href} className="hover:text-sky-600">
                {link.name}
              </a>
            ))}
          </div>

          {/* CTA */}
          <a
            href="#get-started"
            className="
              hidden md:inline-flex
              px-6 py-2 rounded-full
              bg-[#007a8c] text-white font-semibold
              hover:bg-[#005f6a] transition
            "
          >
            Get Started
          </a>

          {/* Mobile */}
          <button onClick={() => setIsMenuOpen(true)} className="md:hidden text-sky-900">
            <MenuIcon />
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      <div
        className={`fixed inset-0 z-[60] bg-white transition-transform duration-300 ${
          isMenuOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex justify-between items-center p-6 border-b">
          <img src="/assets/logo.svg" className="h-8" />
          <XIcon onClick={() => setIsMenuOpen(false)} className="cursor-pointer" />
        </div>

        <div className="flex flex-col gap-6 p-8">
          {links.map((link: ILink) => (
            <a 
              key={link.name} 
              href={link.href} 
              className="text-lg font-semibold text-sky-900"
              onClick={() => setIsMenuOpen(false)}
            >
              {link.name}
            </a>
          ))}
        </div>
      </div>
    </>
  );
}