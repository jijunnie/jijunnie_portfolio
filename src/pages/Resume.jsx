import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';

// Interactive 3D Background Component
function InteractiveBackground() {
  const canvasRef = useRef(null);
  
  useEffect(() => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    
    // ===== SCENE SETUP =====
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      75, 
      window.innerWidth / window.innerHeight, 
      0.1, 
      1000
    );
    const renderer = new THREE.WebGLRenderer({ 
      canvas, 
      antialias: true, 
      alpha: false 
    });
    
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0xeff6ff, 1); // Light blue background
    
    // ===== CREATE PARTICLES =====
    const particlesGeometry = new THREE.BufferGeometry();
    const particlesCount = 2000;
    const posArray = new Float32Array(particlesCount * 3);
    const colorsArray = new Float32Array(particlesCount * 3);
    
    for (let i = 0; i < particlesCount * 3; i += 3) {
      posArray[i] = (Math.random() - 0.5) * 15;
      posArray[i + 1] = (Math.random() - 0.5) * 15;
      posArray[i + 2] = (Math.random() - 0.5) * 15;
      
      const colorChoice = Math.random();
      if (colorChoice < 0.33) {
        colorsArray[i] = 0.231;
        colorsArray[i + 1] = 0.510;
        colorsArray[i + 2] = 0.965;
      } else if (colorChoice < 0.66) {
        colorsArray[i] = 0.545;
        colorsArray[i + 1] = 0.361;
        colorsArray[i + 2] = 0.965;
      } else {
        colorsArray[i] = 0.925;
        colorsArray[i + 1] = 0.282;
        colorsArray[i + 2] = 0.600;
      }
    }
    
    particlesGeometry.setAttribute(
      'position', 
      new THREE.BufferAttribute(posArray, 3)
    );
    particlesGeometry.setAttribute(
      'color', 
      new THREE.BufferAttribute(colorsArray, 3)
    );
    
    const particlesMaterial = new THREE.PointsMaterial({
      size: 0.025,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
    });
    
    const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
    scene.add(particlesMesh);
    
    camera.position.z = 5;
    
    // ===== MOUSE INTERACTION =====
    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;
    
    const handleMouseMove = (e) => {
      mouseX = (e.clientX / window.innerWidth) * 2 - 1;
      mouseY = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    
    const clock = new THREE.Clock();
    
    // ===== ANIMATION LOOP =====
    const animate = () => {
      requestAnimationFrame(animate);
      
      const elapsedTime = clock.getElapsedTime();
      
      targetX += (mouseX - targetX) * 0.02;
      targetY += (mouseY - targetY) * 0.02;
      
      particlesMesh.rotation.y = targetX * 0.5 + elapsedTime * 0.05;
      particlesMesh.rotation.x = targetY * 0.3;
      
      camera.position.x = Math.sin(elapsedTime * 0.1) * 0.5;
      camera.position.y = Math.cos(elapsedTime * 0.1) * 0.3;
      camera.lookAt(0, 0, 0);
      
      renderer.render(scene, camera);
    };
    
    animate();
    
    // ===== HANDLE WINDOW RESIZE =====
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    
    window.addEventListener('resize', handleResize);
    
    // ===== CLEANUP =====
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      
      particlesGeometry.dispose();
      particlesMaterial.dispose();
      renderer.dispose();
    };
  }, []);
  
  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
      }}
    />
  );
}

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
    }
  ];

  return (
    <section className="py-12 xs:py-16 sm:py-20 px-3 xs:px-4 sm:px-6 lg:px-8 min-h-screen bg-blue-50 relative">
      {/* Interactive 3D Background */}
      <InteractiveBackground />
      <div className="max-w-4xl mx-auto relative z-10">
        
        {/* Header */}
        <div
          id="header"
          ref={(el) => (sectionRefs.current['header'] = el)}
          className={`text-center mb-10 xs:mb-12 sm:mb-16 transition-all duration-1000 ${
            visibleSections['header']
              ? 'opacity-100 translate-y-0'
              : 'opacity-0 -translate-y-10'
          }`}
        >
          <h2 className="text-3xl xs:text-4xl sm:text-5xl font-bold text-gray-900 mb-3 xs:mb-4">My Resume</h2>
          <div className="w-16 xs:w-20 sm:w-24 h-0.5 xs:h-1 bg-blue-600 mx-auto mb-4 xs:mb-5 sm:mb-6"></div>
          <p className="text-gray-600 text-sm xs:text-base sm:text-lg px-2">Industrial & System Engineering Student | Web Developer</p>
        </div>

        {/* Contact Info */}
        <div
          id="contact-info"
          ref={(el) => (sectionRefs.current['contact-info'] = el)}
          className={`bg-white rounded-lg shadow-lg p-4 xs:p-5 sm:p-6 mb-8 xs:mb-10 sm:mb-12 border-t-4 border-blue-600 transition-all duration-1000 ${
            visibleSections['contact-info']
              ? 'opacity-100 scale-100'
              : 'opacity-0 scale-95'
          }`}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 xs:gap-4 text-center">
            <div className="hover:bg-blue-50 p-2.5 xs:p-3 rounded transition touch-manipulation">
              <p className="text-xs xs:text-sm text-gray-600 mb-1">Email</p>
              <a href="mailto:jijunnie2113@Gmail.com" className="text-blue-600 font-semibold hover:underline text-xs xs:text-sm break-all">jijunnie2113@Gmail.com</a>
            </div>
            <div className="hover:bg-blue-50 p-2.5 xs:p-3 rounded transition touch-manipulation">
              <p className="text-xs xs:text-sm text-gray-600 mb-1">Phone</p>
              <a href="tel:+17546104078" className="text-gray-900 font-semibold text-xs xs:text-sm">(754) 610-4078</a>
            </div>
            <div className="hover:bg-blue-50 p-2.5 xs:p-3 rounded transition touch-manipulation">
              <p className="text-xs xs:text-sm text-gray-600 mb-1">Location</p>
              <p className="text-gray-900 font-semibold text-xs xs:text-sm">Gainesville, FL</p>
            </div>
            <div className="hover:bg-blue-50 p-2.5 xs:p-3 rounded transition touch-manipulation">
              <p className="text-xs xs:text-sm text-gray-600 mb-1">LinkedIn</p>
              <a href="https://linkedin.com/in/jijunnie" target="_blank" rel="noopener noreferrer" className="text-blue-600 font-semibold hover:underline text-xs xs:text-sm break-all">linkedin.com/in/jijunnie</a>
            </div>
            <div className="hover:bg-blue-50 p-2.5 xs:p-3 rounded transition touch-manipulation">
              <p className="text-xs xs:text-sm text-gray-600 mb-1">GitHub</p>
              <a href="https://github.com/jijunnie" target="_blank" rel="noopener noreferrer" className="text-blue-600 font-semibold hover:underline text-xs xs:text-sm break-all">github.com/jijunnie</a>
            </div>
            <div className="hover:bg-blue-50 p-2.5 xs:p-3 rounded transition touch-manipulation">
              <p className="text-xs xs:text-sm text-gray-600 mb-1">Website</p>
              <a href="https://jijunnie.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 font-semibold hover:underline text-xs xs:text-sm break-all">jijunnie.com</a>
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
          <h3 className="text-2xl xs:text-2.5xl sm:text-3xl font-bold text-gray-900 mb-5 xs:mb-6 sm:mb-8 flex items-center">
            <span className="bg-indigo-600 text-white w-8 h-8 xs:w-9 xs:h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center mr-2 xs:mr-2.5 sm:mr-3 text-base xs:text-lg sm:text-xl">🎓</span>
            Education
          </h3>
          <div className="bg-white rounded-lg shadow-lg p-4 xs:p-5 sm:p-6 border-l-4 border-indigo-600 hover:shadow-xl transition-shadow duration-300">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-3 xs:mb-4 gap-2">
              <div className="flex-1">
                <h4 className="text-lg xs:text-xl font-semibold text-gray-900 mb-1">Bachelor's in Industrial & System Engineering</h4>
                <p className="text-indigo-600 font-medium text-sm xs:text-base">University of Florida - Gainesville, FL</p>
              </div>
              <span className="text-gray-600 font-medium text-xs xs:text-sm sm:text-sm sm:ml-4">Aug 2024 - Present</span>
            </div>
            <div className="space-y-1.5 xs:space-y-2 text-gray-700 text-sm xs:text-base">
              <p><strong className="text-indigo-600">GPA:</strong> 3.94/4.00</p>
              <p><strong className="text-indigo-600">Honors:</strong> College of Engineering Dean's List (Fall 2024 - Spring 2025)</p>
              <p><strong className="text-indigo-600">Scholarships:</strong> Herbert Wertheim Engineering Scholarship & UFIC Summer Study Abroad Scholarship</p>
              <p><strong className="text-indigo-600">Relevant Coursework:</strong> Data Analytics, Engineering Statistics, Materials, Statics, Calculus 1-3</p>
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
            {/* Variantz - Product & Web Engineer */}
            <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-600 hover:shadow-xl transition-all duration-300 transform hover:-translate-x-2">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h4 className="text-xl font-semibold text-gray-900">Product & Web Engineer / Digital Growth Lead</h4>
                  <p className="text-blue-600 font-medium">Variantz - Singapore</p>
                </div>
                <span className="text-gray-600 font-medium text-sm">May 2025 - Oct 2025</span>
              </div>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">•</span>
                  <span>Promoted from Intern to Product & Web Manager, owning end-to-end product, web, and growth systems across 2 production websites and 50+ SKUs</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">•</span>
                  <span>Appointed by CEO to lead 8 interns across product launches, digital media, and in-store display execution</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">•</span>
                  <span>Re-architected responsive web platform (desktop/tablet/mobile), improving UI & UX, driving +30% user satisfaction</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">•</span>
                  <span>Led data-driven SEO, email automation, and social campaigns, increasing web traffic by 400%, accelerating company's B2B → B2C transition</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">•</span>
                  <span>Built scalable, AI-assisted product content pipelines (visuals, copy, metadata), increasing conversion rate by 15%</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">•</span>
                  <span>Launched the technical and brand foundation for APAWLOGY, a new IoT pet sub-brand, from zero to market-ready</span>
                </li>
              </ul>
            </div>

            {/* Digital Commerce Operator */}
            <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-600 hover:shadow-xl transition-all duration-300 transform hover:-translate-x-2">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h4 className="text-xl font-semibold text-gray-900">Digital Commerce & Automation Operator</h4>
                  <p className="text-green-600 font-medium">Independent (eBay, Etsy)</p>
                </div>
                <span className="text-gray-600 font-medium text-sm">May 2024 - Present</span>
              </div>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start">
                  <span className="text-green-600 mr-2">•</span>
                  <span>Built and operated multi-platform commerce system, generating $5k+ profit through data-driven product selection</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 mr-2">•</span>
                  <span>Managed end-to-end digital funnels: product research, pricing strategy, listing optimization, order automation, and customer support, maintaining 5-star seller ratings across platforms</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 mr-2">•</span>
                  <span>Optimized workflows using spreadsheets, scripts, and platform tools to reduce manual operations and increase scale</span>
                </li>
              </ul>
            </div>

            {/* Web Developer */}
            <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-purple-600 hover:shadow-xl transition-all duration-300 transform hover:-translate-x-2">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h4 className="text-xl font-semibold text-gray-900">Web Developer</h4>
                  <p className="text-purple-600 font-medium">Independent</p>
                </div>
                <span className="text-gray-600 font-medium text-sm">Oct 2025 - Present</span>
              </div>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start">
                  <span className="text-purple-600 mr-2">•</span>
                  <span>Designed and built AI-driven web and applications, translating ideas into production-ready features using JavaScript, HTML, CSS, and Three.js</span>
                </li>
                <li className="flex items-start">
                  <span className="text-purple-600 mr-2">•</span>
                  <span>Built a creative & interactive 3D AI-powered portfolio to showcase projects and personality (jijunnie.com)</span>
                </li>
                <li className="flex items-start">
                  <span className="text-purple-600 mr-2">•</span>
                  <span>Designing a unified, cross-platform commerce web application that aggregates market signals, analyzes demand and competition, identifies suppliers, and executes listings and sales within a single system</span>
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
            {/* VP UFCSA */}
            <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-orange-600 hover:shadow-xl transition-all duration-300 transform hover:translate-x-2">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h4 className="text-xl font-semibold text-gray-900">Vice President</h4>
                  <p className="text-orange-600 font-medium">UF Chinese Student Association (UFCSA)</p>
                </div>
                <span className="text-gray-600 font-medium text-sm">Aug 2024 - Present</span>
              </div>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start">
                  <span className="text-orange-600 mr-2">•</span>
                  <span>Elected to lead 6 committees (35+ members) overseeing operations, communications, marketing, events, and finance</span>
                </li>
                <li className="flex items-start">
                  <span className="text-orange-600 mr-2">•</span>
                  <span>Strategically designed and implemented revolutionary upgrade in club history, transforming an inactive club to a highly engaged, collaborative community for international students</span>
                </li>
                <li className="flex items-start">
                  <span className="text-orange-600 mr-2">•</span>
                  <span>Launched and managed multiple new initiatives: social media presence in 5 platforms, multifunctional club website, inter-club collaborations, and a signature large-scale cultural event</span>
                </li>
                <li className="flex items-start">
                  <span className="text-orange-600 mr-2">•</span>
                  <span>Planned and executed 5 major events with 300+ attendees each, overseeing logistics, budgeting, and risk management</span>
                </li>
                <li className="flex items-start">
                  <span className="text-orange-600 mr-2">•</span>
                  <span>Introduced monthly social and professional activities, with a 100% increase in member participation</span>
                </li>
              </ul>
            </div>

            {/* Head Intern Leader SASE */}
            <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-pink-600 hover:shadow-xl transition-all duration-300 transform hover:translate-x-2">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h4 className="text-xl font-semibold text-gray-900">Head Intern Leader, Merch Committee</h4>
                  <p className="text-pink-600 font-medium">UF Society of Asian Scientists and Engineers (SASE)</p>
                </div>
                <span className="text-gray-600 font-medium text-sm">Aug 2024 - Dec 2025</span>
              </div>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start">
                  <span className="text-pink-600 mr-2">•</span>
                  <span>Selected by board members for a competitive internship program supporting club operations and outreach</span>
                </li>
                <li className="flex items-start">
                  <span className="text-pink-600 mr-2">•</span>
                  <span>Collaborated with a team of 6 people to design, order, and sell by advertising club merchandise</span>
                </li>
                <li className="flex items-start">
                  <span className="text-pink-600 mr-2">•</span>
                  <span>Raised over $1k in funds and achieved a 50%+ increase in participation in monthly GBM and social events</span>
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
            <span className="bg-blue-600 text-white w-10 h-10 rounded-full flex items-center justify-center mr-3">🏆</span>
            Certifications
          </h3>
          <div className="space-y-6">
            {certifications.map((cert, idx) => (
              <div
                key={idx}
                className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-600 hover:shadow-xl transition-all duration-300 transform hover:scale-102"
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
                      className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium hover:bg-blue-200 transition-colors cursor-default"
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

              {/* Programming & Data */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3 text-lg">Programming & Data</h4>
                <div className="flex flex-wrap gap-2">
                  {['JavaScript', 'Python', 'SQL', 'Matlab', 'R'].map((skill, idx) => (
                    <span key={idx} className="px-4 py-2 bg-purple-100 text-purple-800 rounded-lg font-medium">
                      {skill === 'JavaScript' || skill === 'Python' ? `${skill} (Master)` : `${skill} (Familiar)`}
                    </span>
                  ))}
                </div>
              </div>

              {/* Web & Systems */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3 text-lg">Web & Systems</h4>
                <div className="flex flex-wrap gap-2">
                  {['HTML/CSS', 'SEO/SEM', 'Data Analytics (Certified)', 'Wix', 'E-commerce Platforms'].map((tool, idx) => (
                    <span key={idx} className="px-4 py-2 bg-green-100 text-green-800 rounded-lg font-medium">
                      {tool}
                    </span>
                  ))}
                </div>
              </div>

              {/* Tools */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3 text-lg">Tools</h4>
                <div className="flex flex-wrap gap-2">
                  {['SolidWorks (Certified)', 'Google Workspace', 'Microsoft Office', 'Canva', 'Meitu', 'Asana', 'Cursor'].map((tool, idx) => (
                    <span key={idx} className="px-4 py-2 bg-teal-100 text-teal-800 rounded-lg font-medium">
                      {tool}
                    </span>
                  ))}
                </div>
              </div>

              {/* Product & Business */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3 text-lg">Product & Business</h4>
                <div className="flex flex-wrap gap-2">
                  {['Digital Marketing (Certified)', 'BI (Certified)', 'Project Management (Certified)', 'ad photo & video editing/production', 'AI-assisted content & visuals creation'].map((skill, idx) => (
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
