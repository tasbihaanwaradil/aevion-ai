// import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const Terms = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#0A1238]">
      {/* Header */}
      <header
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
    <Link to="/">
      <img
        src="/assets/logo.svg"
        alt="Aevion.AI"
        className="h-[66px] w-auto"
      />
    </Link>

    {/* Back Button */}
    <button
      onClick={() => navigate(-1)}
      className="flex items-center gap-2 text-sm text-[#0A1238] hover:text-[#2d5f6e] transition"
    >
      <ArrowLeft className="w-4 h-4" />
      Back
    </button>
  </div>
</header>

      {/* Main */}
       <main className="max-w-4xl mx-auto px-6 pt-24 pb-12">
    <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Hero */}
          <div className="bg-[#2d5f6e] px-8 sm:px-12 py-10">
            <p className="text-[#b9e2ec] text-xs font-bold tracking-widest uppercase mb-3">
              Aevion.AI
            </p>

            <h1 className="text-3xl sm:text-4xl font-bold text-white">
              Terms of Service
            </h1>

            <p className="mt-3 text-gray-200 text-sm">
              Last updated: September 29, 2026
            </p>
          </div>

          {/* Content */}
          <div className="px-8 sm:px-12 py-10 space-y-10">
            <section>
              <h2 className="text-xl font-bold text-[#2d5f6e] mb-3">
                1. Acceptance of Terms
              </h2>

              <p className="text-gray-600 leading-7">
                Welcome to Aevion.AI. These Terms of Service govern your access
                to and use of the Aevion.AI platform, website, applications,
                features, and related services.
              </p>

              <p className="text-gray-600 leading-7 mt-3">
                By creating an account, accessing, or using Aevion.AI, you
                acknowledge that you have read, understood, and agree to these
                Terms. If you do not agree with these Terms, please do not use
                the service.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-[#2d5f6e] mb-3">
                2. About Aevion.AI
              </h2>

              <p className="text-gray-600 leading-7">
                Aevion.AI is an academic productivity platform designed to
                assist teachers and educational users with tasks such as
                creating quizzes, preparing teaching materials, generating
                academic communications, organizing reminders, and analyzing
                educational information.
              </p>

              <p className="text-gray-600 leading-7 mt-3">
                Aevion.AI uses artificial intelligence to provide certain
                features. AI-generated content may contain errors and should
                be reviewed by a qualified user before being relied upon.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-[#2d5f6e] mb-3">
                3. Account Registration
              </h2>

              <p className="text-gray-600 leading-7">
                Certain features require you to create an account. You agree to
                provide accurate and up-to-date information when registering
                and to keep your account information reasonably current.
              </p>

              <p className="text-gray-600 leading-7 mt-3">
                You are responsible for maintaining the confidentiality of your
                login credentials and for activities performed through your
                account. If you believe your account has been accessed without
                authorization, please contact us promptly.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-[#2d5f6e] mb-3">
                4. Acceptable Use
              </h2>

              <p className="text-gray-600 leading-7 mb-3">
                You agree to use Aevion.AI only for lawful educational,
                academic, professional, and other legitimate purposes.
              </p>

              <ul className="list-disc pl-6 space-y-2 text-gray-600 leading-7">
                <li>
                  Do not use the platform for unlawful, fraudulent, or
                  abusive activities.
                </li>
                <li>
                  Do not attempt to gain unauthorized access to the platform,
                  another user's account, or our systems.
                </li>
                <li>
                  Do not interfere with the security, availability, or
                  operation of the service.
                </li>
                <li>
                  Do not upload content that you do not have the right to use.
                </li>
                <li>
                  Do not use AI-generated material as a substitute for
                  appropriate professional or academic judgment.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-[#2d5f6e] mb-3">
                5. AI-Generated Content
              </h2>

              <p className="text-gray-600 leading-7">
                Aevion.AI may generate text, questions, summaries, teaching
                materials, suggestions, or other content using artificial
                intelligence.
              </p>

              <p className="text-gray-600 leading-7 mt-3">
                AI-generated output may occasionally be inaccurate,
                incomplete, outdated, or inappropriate for a particular
                educational context. You are responsible for reviewing and
                validating generated content before using, distributing, or
                relying upon it.
              </p>

              <p className="text-gray-600 leading-7 mt-3">
                Aevion.AI does not guarantee that AI-generated content will
                always be accurate, complete, original, or suitable for a
                specific educational purpose.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-[#2d5f6e] mb-3">
                6. User Content
              </h2>

              <p className="text-gray-600 leading-7">
                You may provide documents, text, educational materials,
                questions, messages, or other information to Aevion.AI.
                You retain your rights in content that you own.
              </p>

              <p className="text-gray-600 leading-7 mt-3">
                By submitting content, you confirm that you have the necessary
                rights and permissions to provide that content for processing
                by the service.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-[#2d5f6e] mb-3">
                7. Intellectual Property
              </h2>

              <p className="text-gray-600 leading-7">
                Aevion.AI, including its software, interface, branding,
                design, logos, features, and underlying technology, is owned
                by or licensed to Aevion.AI and is protected by applicable
                intellectual-property laws.
              </p>

              <p className="text-gray-600 leading-7 mt-3">
                These Terms do not grant you ownership of Aevion.AI's
                intellectual property. You receive a limited right to access
                and use the service in accordance with these Terms.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-[#2d5f6e] mb-3">
                8. Educational Responsibility
              </h2>

              <p className="text-gray-600 leading-7">
                Aevion.AI is intended to support educational workflows. It
                should not replace the professional judgment of teachers,
                instructors, administrators, or other qualified educational
                professionals.
              </p>

              <p className="text-gray-600 leading-7 mt-3">
                Users are responsible for reviewing AI-generated quizzes,
                questions, lesson materials, communications, and other
                educational content before sharing them with students.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-[#2d5f6e] mb-3">
                9. Service Availability
              </h2>

              <p className="text-gray-600 leading-7">
                We aim to keep Aevion.AI available and reliable, but we do not
                guarantee uninterrupted or error-free operation. The service
                may occasionally be unavailable because of maintenance,
                updates, technical problems, security issues, or circumstances
                beyond our reasonable control.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-[#2d5f6e] mb-3">
                10. Account Suspension or Termination
              </h2>

              <p className="text-gray-600 leading-7">
                We may suspend or terminate access to an account when
                reasonably necessary to protect the service, its users, or
                comply with applicable requirements, including where a user
                violates these Terms.
              </p>

              <p className="text-gray-600 leading-7 mt-3">
                You may stop using Aevion.AI at any time. If you want to
                request account deletion, contact our support team.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-[#2d5f6e] mb-3">
                11. Disclaimer
              </h2>

              <p className="text-gray-600 leading-7">
                Aevion.AI is provided as an educational technology service.
                To the extent permitted by applicable law, we make no
                guarantee that the service or its AI-generated output will
                satisfy every user's particular requirements or be free from
                errors.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-[#2d5f6e] mb-3">
                12. Changes to These Terms
              </h2>

              <p className="text-gray-600 leading-7">
                We may update these Terms from time to time to reflect changes
                to Aevion.AI, our practices, or applicable requirements.
                Updated Terms will be posted on this page with a revised
                effective date.
              </p>
            </section>

            {/* <section>
              <h2 className="text-xl font-bold text-[#2d5f6e] mb-3">
                13. Contact Us
              </h2>

              <p className="text-gray-600 leading-7">
                If you have questions about these Terms, please contact the
                Aevion.AI support team.
              </p>

              <div className="mt-4 p-5 bg-gray-50 rounded-xl border border-gray-200">
                <p className="text-gray-700 font-medium">
                  Aevion.AI Support
                </p>
                <p className="text-gray-600 text-sm mt-1">
                  Email: support@aevion.ai
                </p>
              </div>
            </section> */}
          </div>

          {/* Footer links */}
          <div className="border-t border-gray-200 px-8 sm:px-12 py-6 flex flex-wrap gap-5 text-sm">
            <Link
              to="/privacy"
              className="text-[#2d5f6e] font-medium hover:underline"
            >
              Privacy Policy
            </Link>

            <Link
              to="/"
              className="text-gray-500 hover:text-[#2d5f6e] transition"
            >
              Aevion.AI Home
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Terms;