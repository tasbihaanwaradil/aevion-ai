// import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const Privacy = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#0A1238] text-gray-800">
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
              Privacy Policy
            </h1>

            <p className="mt-3 text-gray-200 text-sm">
              Last updated: September 29, 2026
            </p>
          </div>

          {/* Content */}
          <div className="px-8 sm:px-12 py-10 space-y-10">
            <section>
              <h2 className="text-xl font-bold text-[#2d5f6e] mb-3">
                1. Introduction
              </h2>

              <p className="text-gray-600 leading-7">
                Aevion.AI respects your privacy and is committed to handling
                your information responsibly. This Privacy Policy explains
                what information we may collect, how we use it, how we protect
                it, and the choices available to you when using Aevion.AI.
              </p>

              <p className="text-gray-600 leading-7 mt-3">
                By using Aevion.AI, you acknowledge the practices described in
                this Privacy Policy.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-[#2d5f6e] mb-3">
                2. Information We Collect
              </h2>

              <h3 className="font-semibold text-gray-800 mt-5 mb-2">
                Account Information
              </h3>

              <p className="text-gray-600 leading-7">
                When you create a teacher account, we may collect information
                such as your name, email address, and password credentials.
                Passwords should be stored securely using appropriate
                authentication and hashing practices.
              </p>

              <h3 className="font-semibold text-gray-800 mt-5 mb-2">
                Content You Provide
              </h3>

              <p className="text-gray-600 leading-7">
                Depending on the features you use, you may provide documents,
                educational materials, quiz content, lesson information,
                messages, reminders, or other information.
              </p>

              <h3 className="font-semibold text-gray-800 mt-5 mb-2">
                Technical Information
              </h3>

              <p className="text-gray-600 leading-7">
                We may collect technical information necessary to operate and
                secure the service, such as browser type, device information,
                IP address, usage information, error logs, and authentication
                information.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-[#2d5f6e] mb-3">
                3. How We Use Information
              </h2>

              <p className="text-gray-600 leading-7 mb-3">
                We may use collected information to:
              </p>

              <ul className="list-disc pl-6 space-y-2 text-gray-600 leading-7">
                <li>Create and manage user accounts.</li>
                <li>Authenticate users and verify email addresses.</li>
                <li>Provide Aevion.AI features and functionality.</li>
                <li>Generate requested educational content.</li>
                <li>Provide customer and technical support.</li>
                <li>Maintain the security and integrity of the platform.</li>
                <li>Detect and prevent misuse or unauthorized activity.</li>
                <li>Improve the reliability and functionality of the service.</li>
                <li>Communicate important service-related information.</li>
                <li>Meet applicable legal or regulatory requirements.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-[#2d5f6e] mb-3">
                4. AI Processing
              </h2>

              <p className="text-gray-600 leading-7">
                Some Aevion.AI features use artificial intelligence to process
                information submitted by users and generate requested output.
              </p>

              <p className="text-gray-600 leading-7 mt-3">
                For example, a user may upload an educational document to
                generate quiz questions or provide information to create
                academic content.
              </p>

              <p className="text-gray-600 leading-7 mt-3">
                Users should avoid submitting confidential, highly sensitive,
                or unnecessary personal information unless the relevant
                feature specifically requires it and the user has the
                appropriate authorization to provide it.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-[#2d5f6e] mb-3">
                5. Cookies and Similar Technologies
              </h2>

              <p className="text-gray-600 leading-7">
                Aevion.AI may use cookies, local storage, session technologies,
                or similar mechanisms to maintain authentication sessions,
                remember preferences, improve functionality, and support
                security.
              </p>

              <p className="text-gray-600 leading-7 mt-3">
                Your browser may provide controls for managing cookies and
                local storage. Disabling certain technologies may affect the
                functionality of some features.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-[#2d5f6e] mb-3">
                6. How We Share Information
              </h2>

              <p className="text-gray-600 leading-7">
                We do not intend to sell users' personal information. We may
                share or disclose information when reasonably necessary to
                provide and protect the service.
              </p>

              <p className="text-gray-600 leading-7 mt-3">
                This may include trusted service providers that assist with
                infrastructure, hosting, authentication, email delivery,
                analytics, security, or AI functionality.
              </p>

              <p className="text-gray-600 leading-7 mt-3">
                Information may also be disclosed when required by applicable
                law, legal process, or to protect the rights, security, and
                integrity of Aevion.AI, its users, or others.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-[#2d5f6e] mb-3">
                7. Data Security
              </h2>

              <p className="text-gray-600 leading-7">
                We use reasonable technical and organizational measures to
                protect information against unauthorized access, alteration,
                disclosure, or destruction.
              </p>

              <p className="text-gray-600 leading-7 mt-3">
                However, no internet transmission, storage system, or online
                service can be guaranteed to be completely secure. Users
                should also take reasonable steps to protect their account
                credentials and devices.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-[#2d5f6e] mb-3">
                8. Data Retention
              </h2>

              <p className="text-gray-600 leading-7">
                We retain information for as long as reasonably necessary to
                provide the service, maintain legitimate business and security
                requirements, resolve disputes, enforce our agreements, and
                comply with applicable obligations.
              </p>

              <p className="text-gray-600 leading-7 mt-3">
                Retention periods may vary depending on the type of
                information and the purpose for which it was collected.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-[#2d5f6e] mb-3">
                9. Your Choices
              </h2>

              <p className="text-gray-600 leading-7">
                Depending on the functionality available in your account and
                applicable requirements, you may be able to update your
                account information, request assistance with your information,
                or request deletion of your account.
              </p>

              <p className="text-gray-600 leading-7 mt-3">
                Requests can be submitted through our support contact.
                Additional verification may be required to protect your
                account and personal information.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-[#2d5f6e] mb-3">
                10. Children's Privacy
              </h2>

              <p className="text-gray-600 leading-7">
                Aevion.AI is primarily designed for teachers and educational
                professionals. We do not knowingly request unnecessary
                personal information directly from children for account
                creation.
              </p>

              <p className="text-gray-600 leading-7 mt-3">
                Educational institutions and teachers are responsible for
                ensuring that information relating to students is shared and
                processed in accordance with applicable requirements and their
                institutional policies.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-[#2d5f6e] mb-3">
                11. Third-Party Services
              </h2>

              <p className="text-gray-600 leading-7">
                Aevion.AI may rely on third-party providers to support
                infrastructure, authentication, email, AI processing,
                analytics, hosting, or other functionality.
              </p>

              <p className="text-gray-600 leading-7 mt-3">
                These providers may process information according to their own
                terms and privacy policies. We encourage users to review the
                relevant policies when third-party services are involved.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-[#2d5f6e] mb-3">
                12. Changes to This Privacy Policy
              </h2>

              <p className="text-gray-600 leading-7">
                We may update this Privacy Policy as Aevion.AI evolves or as
                our data practices change. The updated version will be posted
                on this page and the "Last updated" date will be revised.
              </p>
            </section>

            {/* <section>
              {/* <h2 className="text-xl font-bold text-[#2d5f6e] mb-3">
                13. Contact Us
              </h2>

              <p className="text-gray-600 leading-7">
                If you have questions, concerns, or requests regarding this
                Privacy Policy or your information, please contact the
                Aevion.AI support team.
              </p>

              <div className="mt-4 p-5 bg-gray-50 rounded-xl border border-gray-200">
                <p className="text-gray-700 font-medium">
                  Aevion.AI Support
                </p>
                <p className="text-gray-600 text-sm mt-1">
                  Email: support@aevion.ai
                </p> */}
              {/* </div>
            </section> */} 
          </div>

          {/* Footer links */}
          <div className="border-t border-gray-200 px-8 sm:px-12 py-6 flex flex-wrap gap-5 text-sm">
            <Link
              to="/terms"
              className="text-[#2d5f6e] font-medium hover:underline"
            >
              Terms of Service
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

export default Privacy;