"use client";

import {
  InstagramIcon,
  LinkedinIcon,
  MailIcon,
  // GithubIcon,
} from "lucide-react";

export default function Footer() {
  return (
    <footer className="relative bg-sky-50 backdrop-blur-lg border-t border-sky-100 overflow-hidden rounded-t-3xl">
      
      {/* Subtle Background Logo */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
        <img
          src="/assets/logo.svg"
          alt="Background Logo"
          className="opacity-[0.19] w-64 md:w-80"
        />
      </div>

      {/* Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-16 lg:px-24 py-12 flex flex-col md:flex-row justify-between items-start gap-10">
        
        {/* Left Section */}
        <div className="flex flex-col gap-4 max-w-sm">
          <p className="text-sky-900 text-sm font-medium leading-relaxed">
            AI-powered tools for smarter teaching and learning.
            <br className="hidden md:block" />
            Create, automate, and manage your academic work — all in one place.
          </p>
        </div>

        {/* Right Section - Social */}
        <div className="flex flex-col gap-4">
          <p className="uppercase font-black tracking-widest text-sky-900 text-xs">
            Connect
          </p>

          {/* One link per row on every screen size, so everything lines up */}
          <div className="flex flex-col gap-3">
            {/* Instagram Link */}
            <a
              href="https://www.instagram.com/aevion_ai/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sky-900 hover:text-sky-600 transition-all text-sm font-semibold"
            >
              <InstagramIcon size={18} className="text-sky-600 shrink-0" /> Instagram
            </a>

            {/* LinkedIn Link */}
            <a
              href="https://www.linkedin.com/company/aevion-ai-2026/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sky-900 hover:text-sky-600 transition-all text-sm font-semibold"
            >
              <LinkedinIcon size={18} className="text-sky-600 shrink-0" /> LinkedIn
            </a>

            {/* Email Link */}
            <a
              href="/contact-us"
              className="flex items-center gap-2 text-sky-900 hover:text-sky-600 transition-all text-sm font-semibold"
            >
              <MailIcon size={18} className="text-sky-600 shrink-0" /> Email
            </a>

            {/* GitHub Link */}
            {/* <a
              href="https://github.com/tasbihaanwaradil/aevion-ai"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sky-900 hover:text-sky-600 transition-all text-sm font-semibold"
            >
              <GithubIcon size={18} className="text-sky-600 shrink-0" /> GitHub
            </a> */}
          </div>
        </div>
      </div>

      {/* Bottom Centered Copyright */}
      <div className="relative z-10 text-center pb-6">
        <p className="text-sky-700 text-[11px] font-bold uppercase tracking-wider">
          © 2026 Aevion.AI. All rights reserved.
        </p>
      </div>
    </footer>
  );
}