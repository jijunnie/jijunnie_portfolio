import React from 'react';
import { Github, ExternalLink } from 'lucide-react';

export default function Projects() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-4xl font-bold text-gray-900 mb-12 text-center">Projects</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3].map((project) => (
            <div key={project} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition">
              <div className="h-48 bg-gradient-to-br from-blue-400 to-purple-500"></div>
              <div className="p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Project {project}</h3>
                <p className="text-gray-600 mb-4">
                  A brief description of what this project does and the technologies used to build it.
                </p>
                <div className="flex space-x-2">
                  <span className="px-3 py-1 bg-blue-100 text-blue-600 rounded-full text-sm">React</span>
                  <span className="px-3 py-1 bg-purple-100 text-purple-600 rounded-full text-sm">Tailwind</span>
                </div>
                <div className="flex space-x-4 mt-4">
                  <a href="#" className="text-blue-600 hover:text-blue-700 flex items-center">
                    <Github size={18} className="mr-1" /> Code
                  </a>
                  <a href="#" className="text-blue-600 hover:text-blue-700 flex items-center">
                    <ExternalLink size={18} className="mr-1" /> Live
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
