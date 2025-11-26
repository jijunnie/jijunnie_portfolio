import React, { useState, useEffect, useRef } from 'react';

export default function Resume() {
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
      { threshold: 0.15 }
    );

    Object.values(sectionRefs.current).forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    return () => observer.disconnect();
  }, []);

  const certifications = [
    { 
      title: 'Certified SolidWorks CAD Design Associate', 
      date: 'September 2025',
      skills: ['3D Modeling', 'CAD Design', 'Technical Drawing', 'Product Design']
    },
    { 
      title: 'Google Data Analytics, Coursera', 
      date: 'October 2025',
      skills: ['Data Analysis', 'SQL', 'Data Visualization', 'Spreadsheets', 'R Programming', 'Tableau']
    },
    { 
      title: 'Google Project Management Specialization', 
      date: 'March 2025',
      skills: ['Project Planning', 'Agile', 'Scrum', 'Risk Management', 'Stakeholder Management']
    },
    { 
      title: 'Google Digital Marketing & E-commerce', 
      date: 'May 2025',
      skills: ['SEO', 'SEM', 'Email Marketing', 'Social Media', 'Google Analytics', 'E-commerce Strategy']
    },
    { 
      title: 'Herbert Wertheim Engineering Scholarship', 
      date: 'February 2025',
      skills: ['Academic Excellence', 'Engineering Fundamentals']
    },
    { 
      title: 'UFIC Summer Study Abroad Scholarship', 
      date: 'February 2025',
      skills: ['Cross-Cultural Communication', 'Global Perspective']
    }
  ];

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <div
          id="header"
          ref={(el) => (sectionRefs.current['header'] = el)}
          className={`text-center mb-16 transition-all duration-1000 ${
            visibleSections['header']
              ? 'opacity-100 translate-y-0'
              : 'opacity-0 -translate-y-10'
          }`}
        >
          <h2 className="text-5xl font-bold text-gray-900 mb-4">My Resume</h2>
          <div className="w-24 h-1 bg-blue-600 mx-auto mb-6"></div>
          <p className="text-gray-600 text-lg">Industrial & System Engineering Student | Web Developer</p>
        </div>

        {/* Contact Info */}
        <div
          id="contact-info"
          ref={(el) => (sectionRefs.current['contact-info'] = el)}
          className={`bg-white rounded-lg shadow-lg p-6 mb-12 border-t-4 border-blue-600 transition-all duration-1000 ${
            visibleSections['contact-info']
              ? 'opacity-100 scale-100'
              : 'opacity-0 scale-95'
          }`}
        >
          <div className="grid md:grid-cols-3 gap-4 text-center">
            <div className="hover:bg-blue-50 p-3 rounded transition">
              <p className="text-sm text-gray-600">Email</p>
              <a href="mailto:jijun.nie@ufl.edu" className="text-blue-600 font-semibold hover:underline">jijun.nie@ufl.edu</a>
            </div>
            <div className="hover:bg-blue-50 p-3 rounded transition">
              <p className="text-sm text-gray-600">Phone</p>
              <p className="text-gray-900 font-semibold">(754) 610-4078</p>
            </div>
            <div className="hover:bg-blue-50 p-3 rounded transition">
              <p className="text-sm text-gray-600">Location</p>
              <p className="text-gray-900 font-semibold">Gainesville, FL</p>
            </div>
          </div>
        </div>

        {/* Education Section - FIRST */}
        <div
          id="education"
          ref={(el) => (sectionRefs.current['education'] = el)}
          className={`mb-12 transition-all duration-1000 ${
            visibleSections['education']
              ? 'opacity-100 translate-y-0'
              : 'opacity-0 translate-y-10'
          }`}
        >
          <h3 className="text-3xl font-bold text-gray-900 mb-8 flex items-center">
            <span className="bg-indigo-600 text-white w-10 h-10 rounded-full flex items-center justify-center mr-3">🎓</span>
            Education
          </h3>
          <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-indigo-600 hover:shadow-xl transition-shadow duration-300">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h4 className="text-xl font-semibold text-gray-900">Bachelor's in Industrial & System Engineering</h4>
                <p className="text-indigo-600 font-medium">University of Florida - Gainesville, FL</p>
              </div>
              <span className="text-gray-600 font-medium text-sm">Aug 2024 - Present</span>
            </div>
            <div className="space-y-2 text-gray-700">
              <p><strong className="text-indigo-600">GPA:</strong> 3.94/4.00</p>
              <p><strong className="text-indigo-600">Honors:</strong> College of Engineering Dean's List (Fall 2024 - Spring 2025)</p>
              <p><strong className="text-indigo-600">Coursework:</strong> Data Analytics, Computer Graphic Design, Materials, Statics, Calculus 1-3</p>
            </div>
          </div>
        </div>

        {/* Professional Experience Section - SECOND */}
        <div
          id="experience"
          ref={(el) => (sectionRefs.current['experience'] = el)}
          className={`mb-12 transition-all duration-1000 ${
            visibleSections['experience']
              ? 'opacity-100 translate-x-0'
              : 'opacity-0 -translate-x-10'
          }`}
        >
          <h3 className="text-3xl font-bold text-gray-900 mb-8 flex items-center">
            <span className="bg-blue-600 text-white w-10 h-10 rounded-full flex items-center justify-center mr-3">💼</span>
            Professional Experience
          </h3>
          <div className="space-y-6">
            {/* Variantz - Web Design */}
            <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-600 hover:shadow-xl transition-all duration-300 transform hover:-translate-x-2">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h4 className="text-xl font-semibold text-gray-900">Web Design & Product Development Specialist</h4>
                  <p className="text-blue-600 font-medium">Variantz - Singapore</p>
                </div>
                <span className="text-gray-600 font-medium text-sm">May 2025 - Oct 2025</span>
              </div>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">•</span>
                  <span>Promoted to Product & Web Manager, overseeing 50+ SKUs and managing 2 company websites</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">•</span>
                  <span>Boosted web traffic by 400% through email & social media marketing, website SEO</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">•</span>
                  <span>Revamped entire website (desktop, tablet, mobile), driving 30% increase in user satisfaction</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">•</span>
                  <span>Built foundation for APAWLOGY sub-brand in website design and content strategy</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">•</span>
                  <span>Developed Internship Program portal featuring 100+ interns with detailed role documentation</span>
                </li>
              </ul>
            </div>

            {/* Restaurant Cashier */}
            <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-600 hover:shadow-xl transition-all duration-300 transform hover:-translate-x-2">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h4 className="text-xl font-semibold text-gray-900">Restaurant Cashier and Server</h4>
                  <p className="text-green-600 font-medium">Gou Lou Cheong Chinese BBQ - Miami, FL</p>
                </div>
                <span className="text-gray-600 font-medium text-sm">Jan 2019 - Jun 2024</span>
              </div>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start">
                  <span className="text-green-600 mr-2">•</span>
                  <span>Processed 500+ customer orders every weekend, maintaining 98% order accuracy</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 mr-2">•</span>
                  <span>Handled $10k+ in weekly transactions with precision using physical calculator</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 mr-2">•</span>
                  <span>Maintained 4.6/5 Google Review by providing quality service</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Leadership Section - THIRD */}
        <div
          id="leadership"
          ref={(el) => (sectionRefs.current['leadership'] = el)}
          className={`mb-12 transition-all duration-1000 ${
            visibleSections['leadership']
              ? 'opacity-100 translate-x-0'
              : 'opacity-0 translate-x-10'
          }`}
        >
          <h3 className="text-3xl font-bold text-gray-900 mb-8 flex items-center">
            <span className="bg-purple-600 text-white w-10 h-10 rounded-full flex items-center justify-center mr-3">👥</span>
            Leadership Experience
          </h3>
          <div className="space-y-6">
            {/* Head Intern Leader */}
            <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-purple-600 hover:shadow-xl transition-all duration-300 transform hover:translate-x-2">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h4 className="text-xl font-semibold text-gray-900">Head Intern Leader</h4>
                  <p className="text-purple-600 font-medium">Variantz - Singapore</p>
                </div>
                <span className="text-gray-600 font-medium text-sm">May 2025 - Aug 2025</span>
              </div>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start">
                  <span className="text-purple-600 mr-2">•</span>
                  <span>Appointed by CEO to lead and direct a team of 8 interns</span>
                </li>
                <li className="flex items-start">
                  <span className="text-purple-600 mr-2">•</span>
                  <span>Optimized product contents using AI for 50+ SKUs, boosting conversion rate by 15%</span>
                </li>
                <li className="flex items-start">
                  <span className="text-purple-600 mr-2">•</span>
                  <span>Revitalized 3 physical product display shelves</span>
                </li>
              </ul>
            </div>

            {/* VP of Service Committee */}
            <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-orange-600 hover:shadow-xl transition-all duration-300 transform hover:translate-x-2">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h4 className="text-xl font-semibold text-gray-900">VP of Service Committee</h4>
                  <p className="text-orange-600 font-medium">UF Chinese Student Association</p>
                </div>
                <span className="text-gray-600 font-medium text-sm">Aug 2024 - Present</span>
              </div>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start">
                  <span className="text-orange-600 mr-2">•</span>
                  <span>Elected by executive board to lead 6-member committee</span>
                </li>
                <li className="flex items-start">
                  <span className="text-orange-600 mr-2">•</span>
                  <span>Planned and executed 4 large-scale seasonal cultural events (300+ attendees each)</span>
                </li>
                <li className="flex items-start">
                  <span className="text-orange-600 mr-2">•</span>
                  <span>Organized weekly board game and social events</span>
                </li>
              </ul>
            </div>

            {/* Intern Leader SASE */}
            <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-pink-600 hover:shadow-xl transition-all duration-300 transform hover:translate-x-2">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h4 className="text-xl font-semibold text-gray-900">Intern Leader, Merchandise Committee</h4>
                  <p className="text-pink-600 font-medium">UF Society of Asian Scientists and Engineers (SASE)</p>
                </div>
                <span className="text-gray-600 font-medium text-sm">Aug 2024 - Present</span>
              </div>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start">
                  <span className="text-pink-600 mr-2">•</span>
                  <span>Collaborated with team of 6 to design, order and sell club merchandise</span>
                </li>
                <li className="flex items-start">
                  <span className="text-pink-600 mr-2">•</span>
                  <span>Raised over $1k in funds and boosted club participation by 50+</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Certifications Section - FOURTH */}
        <div
          id="certifications"
          ref={(el) => (sectionRefs.current['certifications'] = el)}
          className={`mb-12 transition-all duration-1000 ${
            visibleSections['certifications']
              ? 'opacity-100 scale-100'
              : 'opacity-0 scale-95'
          }`}
        >
          <h3 className="text-3xl font-bold text-gray-900 mb-8 flex items-center">
            <span className="bg-yellow-600 text-white w-10 h-10 rounded-full flex items-center justify-center mr-3">🏆</span>
            Honors & Certifications
          </h3>
          <div className="space-y-6">
            {certifications.map((cert, idx) => (
              <div
                key={idx}
                className="bg-white rounded-lg shadow-md p-6 border-l-4 border-yellow-600 hover:shadow-xl transition-all duration-300 transform hover:scale-102"
                style={{ transitionDelay: `${idx * 100}ms` }}
              >
                <div className="flex justify-between items-start mb-3">
                  <h4 className="font-semibold text-gray-900 text-lg">{cert.title}</h4>
                  <span className="text-sm text-gray-600 font-medium">{cert.date}</span>
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  {cert.skills.map((skill, skillIdx) => (
                    <span
                      key={skillIdx}
                      className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium hover:bg-yellow-200 transition-colors cursor-default"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Skills Section - FIFTH */}
        <div
          id="skills"
          ref={(el) => (sectionRefs.current['skills'] = el)}
          className={`mb-12 transition-all duration-1000 ${
            visibleSections['skills']
              ? 'opacity-100 translate-y-0'
              : 'opacity-0 translate-y-10'
          }`}
        >
          <h3 className="text-3xl font-bold text-gray-900 mb-8 flex items-center">
            <span className="bg-teal-600 text-white w-10 h-10 rounded-full flex items-center justify-center mr-3">💻</span>
            Technical Skills
          </h3>
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="space-y-6">
              {/* Languages */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3 text-lg">Languages</h4>
                <div className="flex flex-wrap gap-2">
                  {['English (Fluent)', 'Mandarin (Fluent)', 'Cantonese (Fluent)'].map((lang, idx) => (
                    <span key={idx} className="px-4 py-2 bg-blue-100 text-blue-800 rounded-lg font-medium">
                      {lang}
                    </span>
                  ))}
                </div>
              </div>

              {/* Programming */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3 text-lg">Programming & Data Skills</h4>
                <div className="flex flex-wrap gap-2">
                  {['JavaScript', 'Python', 'SQL', 'Matlab', 'R'].map((skill, idx) => (
                    <span key={idx} className="px-4 py-2 bg-purple-100 text-purple-800 rounded-lg font-medium">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* Technical Tools */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3 text-lg">Technical Tools</h4>
                <div className="flex flex-wrap gap-2">
                  {['Google Workspace', 'Microsoft Office', 'SolidWorks', 'Canva', 'Meitu', 'Photo Editing', 'Video Editing', 'AI Content Creation'].map((tool, idx) => (
                    <span key={idx} className="px-4 py-2 bg-green-100 text-green-800 rounded-lg font-medium">
                      {tool}
                    </span>
                  ))}
                </div>
              </div>

              {/* Marketing Skills */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3 text-lg">Marketing Skills</h4>
                <div className="flex flex-wrap gap-2">
                  {['SEO', 'SEM', 'UX/UI Design', 'Google Analytics', 'Content Optimization', 'Project Management'].map((skill, idx) => (
                    <span key={idx} className="px-4 py-2 bg-pink-100 text-pink-800 rounded-lg font-medium">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Download Resume Button */}
        <div
          id="download"
          ref={(el) => (sectionRefs.current['download'] = el)}
          className={`text-center transition-all duration-1000 ${
            visibleSections['download']
              ? 'opacity-100 translate-y-0'
              : 'opacity-0 translate-y-10'
          }`}
        >
          <a 
            href="/Jijun_Nie_Resume.pdf" 
            download="Jijun_Nie_Resume.pdf"
            className="inline-block bg-gradient-to-r from-blue-600 to-purple-600 text-white px-12 py-4 rounded-lg font-semibold text-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-110"
          >
            📄 Download Full Resume (PDF)
          </a>
        </div>

      </div>
    </section>
  );
}
