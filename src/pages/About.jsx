import React, { useState, useEffect, useRef } from 'react';
import { Github, Linkedin, Mail } from 'lucide-react';

export default function About() {
  const [visibleSections, setVisibleSections] = useState({});
  const sectionRefs = useRef({});

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisibleSections((prev) => ({
              ...prev,
              [entry.target.id]: true,
            }));
          }
        });
      },
      { threshold: 0.2 }
    );

    Object.values(sectionRefs.current).forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <div className="py-20 px-4 sm:px-6 lg:px-8 min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-6xl mx-auto">
        
        {/* Header Section */}
        <div
          id="header"
          ref={(el) => (sectionRefs.current['header'] = el)}
          className={`text-center mb-16 transition-all duration-1000 ${
            visibleSections['header']
              ? 'opacity-100 translate-y-0'
              : 'opacity-0 translate-y-10'
          }`}
        >
          <h2 className="text-5xl font-bold text-gray-900 mb-4">About Me</h2>
          <div className="w-24 h-1 bg-blue-600 mx-auto"></div>
        </div>

        {/* Photo and Intro Section */}
        <div
          id="intro"
          ref={(el) => (sectionRefs.current['intro'] = el)}
          className={`grid md:grid-cols-2 gap-12 items-center mb-20 transition-all duration-1000 delay-200 ${
            visibleSections['intro']
              ? 'opacity-100 translate-x-0'
              : 'opacity-0 -translate-x-10'
          }`}
        >
          <div className="flex justify-center">
            <div className="w-64 h-64 bg-gradient-to-br from-blue-400 to-purple-500 rounded-lg transform hover:scale-105 transition-transform duration-300 shadow-xl"></div>
          </div>
          <div>
            <h3 className="text-3xl font-bold text-gray-900 mb-4">Hello! I'm Jijun Nie</h3>
            <p className="text-lg text-gray-700 mb-4">
              I'm a passionate Industrial & System Engineering student at the University of Florida 
              with a love for creating innovative solutions and beautiful web experiences.
            </p>
            <p className="text-lg text-gray-700 mb-6">
              With a 3.94 GPA and hands-on experience in web development, product management, 
              and leadership, I bring ideas to life through clean code and thoughtful design.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-600 hover:text-blue-600 transition transform hover:scale-110">
                <Github size={28} />
              </a>
              <a href="#" className="text-gray-600 hover:text-blue-600 transition transform hover:scale-110">
                <Linkedin size={28} />
              </a>
              <a href="mailto:jijun.nie@ufl.edu" className="text-gray-600 hover:text-blue-600 transition transform hover:scale-110">
                <Mail size={28} />
              </a>
            </div>
          </div>
        </div>

        {/* Education Section */}
        <div
          id="education"
          ref={(el) => (sectionRefs.current['education'] = el)}
          className={`mb-20 transition-all duration-1000 ${
            visibleSections['education']
              ? 'opacity-100 translate-y-0'
              : 'opacity-0 translate-y-10'
          }`}
        >
          <h3 className="text-3xl font-bold text-gray-900 mb-8 text-center">Education</h3>
          <div className="bg-white rounded-lg shadow-lg p-8 border-l-4 border-blue-600 hover:shadow-xl transition-shadow duration-300">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h4 className="text-2xl font-semibold text-gray-900">University of Florida</h4>
                <p className="text-blue-600 font-medium">BSE in Industrial & System Engineering</p>
              </div>
              <span className="text-gray-600 font-medium">Aug 2024 - Present</span>
            </div>
            <div className="space-y-2">
              <p className="text-gray-700"><strong>GPA:</strong> 3.94/4.00</p>
              <p className="text-gray-700"><strong>Honors:</strong> College of Engineering Dean's List (Fall 2024 - Spring 2025)</p>
              <p className="text-gray-700"><strong>Coursework:</strong> Data Analytics, Computer Graphic Design, Materials, Statics, Calculus 1-3</p>
            </div>
          </div>
        </div>

        {/* What I Do Section */}
        <div
          id="what-i-do"
          ref={(el) => (sectionRefs.current['what-i-do'] = el)}
          className={`mb-20 transition-all duration-1000 ${
            visibleSections['what-i-do']
              ? 'opacity-100 scale-100'
              : 'opacity-0 scale-95'
          }`}
        >
          <h3 className="text-3xl font-bold text-gray-900 mb-8 text-center">What I Do</h3>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: '💻',
                title: 'Web Development',
                description: 'Building responsive, user-friendly websites with modern technologies like React, JavaScript, and Tailwind CSS.'
              },
              {
                icon: '📊',
                title: 'Data Analytics',
                description: 'Analyzing data to drive insights and optimize performance using tools like Python, SQL, and Google Analytics.'
              },
              {
                icon: '🎨',
                title: 'Product Design',
                description: 'Creating engaging user experiences through thoughtful UX/UI design and brand strategy.'
              }
            ].map((item, idx) => (
              <div
                key={idx}
                className="bg-white rounded-lg p-6 shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2"
                style={{ transitionDelay: `${idx * 100}ms` }}
              >
                <div className="text-4xl mb-4">{item.icon}</div>
                <h4 className="text-xl font-semibold text-gray-900 mb-3">{item.title}</h4>
                <p className="text-gray-600">{item.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Languages Section */}
        <div
          id="languages"
          ref={(el) => (sectionRefs.current['languages'] = el)}
          className={`mb-20 transition-all duration-1000 ${
            visibleSections['languages']
              ? 'opacity-100 translate-x-0'
              : 'opacity-0 translate-x-10'
          }`}
        >
          <h3 className="text-3xl font-bold text-gray-900 mb-8 text-center">Languages</h3>
          <div className="flex justify-center space-x-8">
            {['English', 'Mandarin', 'Cantonese'].map((lang, idx) => (
              <div
                key={idx}
                className="bg-gradient-to-br from-blue-500 to-purple-600 text-white px-8 py-4 rounded-full font-semibold shadow-lg transform hover:scale-110 transition-transform duration-300"
                style={{ transitionDelay: `${idx * 100}ms` }}
              >
                {lang}
              </div>
            ))}
          </div>
        </div>

        {/* Fun Facts Section */}
        <div
          id="fun-facts"
          ref={(el) => (sectionRefs.current['fun-facts'] = el)}
          className={`transition-all duration-1000 ${
            visibleSections['fun-facts']
              ? 'opacity-100 translate-y-0'
              : 'opacity-0 translate-y-10'
          }`}
        >
          <h3 className="text-3xl font-bold text-gray-900 mb-8 text-center">Fun Facts</h3>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              { emoji: '🎸', text: 'I play guitar and love singing!' },
              { emoji: '📸', text: 'Photography enthusiast capturing moments' },
              { emoji: '🏸', text: 'Badminton player - always up for a game' },
              { emoji: '🎮', text: 'Competitive gamer in my free time' }
            ].map((fact, idx) => (
              <div
                key={idx}
                className="bg-blue-50 rounded-lg p-6 flex items-center space-x-4 hover:bg-blue-100 transition-colors duration-300"
                style={{ transitionDelay: `${idx * 100}ms` }}
              >
                <span className="text-4xl">{fact.emoji}</span>
                <p className="text-gray-800 font-medium">{fact.text}</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
