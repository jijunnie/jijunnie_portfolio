import React from 'react';

export default function Skills() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-4xl font-bold text-gray-900 mb-12 text-center">Skills</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">💻</span>
            </div>
            <h3 className="text-xl font-semibold mb-3">Frontend</h3>
            <p className="text-gray-600">React, JavaScript, TypeScript, HTML/CSS, Tailwind</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">⚙️</span>
            </div>
            <h3 className="text-xl font-semibold mb-3">Backend</h3>
            <p className="text-gray-600">Node.js, Python, REST APIs, Databases</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🛠️</span>
            </div>
            <h3 className="text-xl font-semibold mb-3">Tools</h3>
            <p className="text-gray-600">Git, Docker, AWS, CI/CD, Agile</p>
          </div>
        </div>
      </div>
    </section>
  );
}
