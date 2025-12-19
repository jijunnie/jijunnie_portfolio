import React from 'react';

export default function Skills() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 min-h-screen bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-5xl font-bold text-gray-900 mb-4 text-center">Skills & Interests</h2>
        <div className="w-24 h-1 bg-gradient-to-r from-blue-600 to-purple-600 mx-auto mb-16"></div>
        
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {/* Programming & Data */}
          <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-purple-600 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mr-4">
              <span className="text-2xl">💻</span>
              </div>
              <h3 className="text-2xl font-semibold text-gray-900">Programming & Data</h3>
            </div>
            <div className="space-y-2">
              <div className="flex items-center">
                <span className="text-green-600 mr-2">✓</span>
                <span className="text-gray-700"><strong>Master in:</strong> JavaScript & Python</span>
              </div>
              <div className="flex items-center">
                <span className="text-blue-600 mr-2">✓</span>
                <span className="text-gray-700"><strong>Familiar with:</strong> SQL, Matlab & R</span>
              </div>
            </div>
          </div>

          {/* Web & Systems */}
          <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-blue-600 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                <span className="text-2xl">🌐</span>
              </div>
              <h3 className="text-2xl font-semibold text-gray-900">Web & Systems</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {['HTML/CSS', 'SEO/SEM', 'Data Analytics (Certified)', 'Wix', 'E-commerce Platforms'].map((skill, idx) => (
                <span key={idx} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                  {skill}
                </span>
              ))}
            </div>
          </div>

          {/* Tools */}
          <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-teal-600 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center mr-4">
              <span className="text-2xl">🛠️</span>
              </div>
              <h3 className="text-2xl font-semibold text-gray-900">Tools</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {['SolidWorks (Certified)', 'Google Workspace', 'Microsoft Office', 'Canva', 'Meitu', 'Asana', 'Cursor'].map((tool, idx) => (
                <span key={idx} className="px-3 py-1 bg-teal-100 text-teal-800 rounded-full text-sm font-medium">
                  {tool}
                </span>
              ))}
            </div>
          </div>

          {/* Product & Business */}
          <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-pink-600 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center mr-4">
                <span className="text-2xl">📊</span>
              </div>
              <h3 className="text-2xl font-semibold text-gray-900">Product & Business</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {['Digital Marketing (Certified)', 'BI (Certified)', 'Project Management (Certified)', 'ad photo & video editing/production', 'AI-assisted content & visuals creation'].map((skill, idx) => (
                <span key={idx} className="px-3 py-1 bg-pink-100 text-pink-800 rounded-full text-sm font-medium">
                  {skill}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Languages */}
        <div className="bg-white rounded-lg shadow-lg p-8 border-t-4 border-indigo-600">
          <div className="flex items-center justify-center mb-6">
            <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mr-4">
              <span className="text-2xl">🗣️</span>
            </div>
            <h3 className="text-2xl font-semibold text-gray-900">Languages</h3>
          </div>
          <div className="flex flex-wrap justify-center gap-4">
            {['English (Fluent)', 'Mandarin (Fluent)', 'Cantonese (Fluent)'].map((lang, idx) => (
              <span key={idx} className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg text-lg font-semibold shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105">
                {lang}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
