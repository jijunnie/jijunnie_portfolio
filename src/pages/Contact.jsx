import React from 'react';

export default function Contact() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 min-h-screen flex items-center">
      <div className="max-w-3xl mx-auto text-center w-full">
        <h2 className="text-4xl font-bold text-gray-900 mb-8">Get In Touch</h2>
        <p className="text-xl text-gray-600 mb-8">
          I'm always open to new opportunities and collaborations. Feel free to reach out!
        </p>
        <a href="mailto:your.email@example.com" className="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition text-lg">
          Send Me an Email
        </a>
      </div>
    </section>
  );
}
