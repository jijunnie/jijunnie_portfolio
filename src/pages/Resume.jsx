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

  const resumePdfUrl = '/Jijun Nie Resume.pdf';

  const contactItems = [
    { label: 'Email', value: 'jijunnie2113@Gmail.com', href: 'mailto:jijunnie2113@Gmail.com' },
    { label: 'Phone', value: '(754) 610-4078' },
    { label: 'Location', value: 'Gainesville, FL' },
    { label: 'LinkedIn', value: 'linkedin.com/in/jijunnie', href: 'https://linkedin.com/in/jijunnie' },
    { label: 'GitHub', value: 'github.com/jijunnie', href: 'https://github.com/jijunnie' },
    { label: 'Website', value: 'jijunnie.com', href: 'https://jijunnie.com' },
  ];

  const certifications = [
    { title: 'Certified SolidWorks CAD Design Associate', date: 'September 2025', skills: ['3D Modeling', 'CAD Design', 'Technical Drawing', 'Product Design'] },
    { title: 'Google Data Analytics, Coursera', date: 'October 2025', skills: ['Data Analysis', 'SQL', 'Data Visualization', 'Spreadsheets', 'R Programming', 'Tableau'] },
    { title: 'Google Project Management Specialization', date: 'March 2025', skills: ['Project Planning', 'Agile', 'Scrum', 'Risk Management', 'Stakeholder Management'] },
    { title: 'Google Digital Marketing & E-commerce', date: 'May 2025', skills: ['SEO', 'SEM', 'Email Marketing', 'Social Media', 'Google Analytics', 'E-commerce Strategy'] },
  ];

  const sectionClasses = (id) =>
    `transition-all duration-700 ${
      visibleSections[id] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
    }`;

  const boxBase = 'bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden';

  return (
    <section className="py-8 sm:py-12 md:py-16 lg:py-20 px-3 sm:px-4 md:px-6 lg:px-8 min-h-screen bg-blue-50/95 relative">
      <InteractiveBackground />
      <div className="max-w-4xl mx-auto relative z-10 space-y-6 sm:space-y-8 md:space-y-10">
        {/* Header */}
        <div
          id="header"
          ref={(el) => (sectionRefs.current['header'] = el)}
          className={sectionClasses('header')}
        >
          <div className="text-center">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-2 sm:mb-4">My Resume</h2>
            <div className="w-16 sm:w-24 h-0.5 sm:h-1 bg-blue-600 mx-auto mb-4 sm:mb-6" />
            <p className="text-gray-600 text-sm sm:text-base md:text-lg px-2">Industrial & System Engineering Student | Web Developer</p>
          </div>
        </div>

        {/* Contact – single responsive box */}
        <div
          id="contact-info"
          ref={(el) => (sectionRefs.current['contact-info'] = el)}
          className={sectionClasses('contact-info')}
        >
          <div className={`${boxBase} p-4 sm:p-5 md:p-6`}>
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4 flex items-center">
              <span className="bg-blue-600 text-white w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center mr-2 text-sm sm:text-base">📬</span>
              Contact
            </h3>
            <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {contactItems.map((item, idx) => (
                <div key={idx} className="hover:bg-blue-50/80 p-2 sm:p-3 rounded-lg transition-colors">
                  <p className="text-xs sm:text-sm text-gray-500">{item.label}</p>
                  {item.href ? (
                    <a href={item.href} target={item.href.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer" className="text-blue-600 font-medium text-sm sm:text-base hover:underline break-all">{item.value}</a>
                  ) : (
                    <p className="text-gray-900 font-medium text-sm sm:text-base">{item.value}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Education */}
        <div
          id="education"
          ref={(el) => (sectionRefs.current['education'] = el)}
          className={sectionClasses('education')}
        >
          <div className={`${boxBase} p-4 sm:p-5 md:p-6 border-l-4 border-indigo-600`}>
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4 flex items-center">
              <span className="bg-indigo-600 text-white w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center mr-2 text-sm sm:text-base">🎓</span>
              Education
            </h3>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1 sm:gap-2 mb-3">
              <div>
                <h4 className="text-base sm:text-lg font-semibold text-gray-900">Bachelor&apos;s in Industrial & System Engineering</h4>
                <p className="text-indigo-600 font-medium text-sm sm:text-base">University of Florida — Gainesville, FL</p>
              </div>
              <span className="text-gray-600 font-medium text-xs sm:text-sm shrink-0">Aug 2024 – Present</span>
            </div>
            <div className="space-y-1 sm:space-y-2 text-gray-700 text-sm sm:text-base">
              <p><strong className="text-indigo-600">GPA:</strong> 3.94/4.00</p>
              <p><strong className="text-indigo-600">Honors:</strong> College of Engineering Dean&apos;s List (Fall 2024 – Spring 2025)</p>
              <p><strong className="text-indigo-600">Scholarships:</strong> Herbert Wertheim Engineering Scholarship & UFIC Summer Study Abroad Scholarship</p>
              <p><strong className="text-indigo-600">Relevant Coursework:</strong> Data Analytics, Engineering Statistics, Materials, Statics, Calculus 1–3</p>
            </div>
          </div>
        </div>

        {/* Professional Experience */}
        <div
          id="experience"
          ref={(el) => (sectionRefs.current['experience'] = el)}
          className={sectionClasses('experience')}
        >
          <div className={boxBase}>
            <div className="p-4 sm:p-5 md:p-6 border-b border-gray-100">
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center">
                <span className="bg-blue-600 text-white w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center mr-2 text-sm sm:text-base">💼</span>
                Professional Experience
              </h3>
            </div>
            <div className="divide-y divide-gray-100">
              {/* Variantz */}
              <div className="p-4 sm:p-5 md:p-6 border-l-4 border-blue-600 hover:bg-blue-50/30 transition-colors">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1 mb-2 sm:mb-3">
                  <div>
                    <h4 className="text-base sm:text-lg font-semibold text-gray-900">Product & Web Engineer / Digital Growth Lead</h4>
                    <p className="text-blue-600 font-medium text-sm sm:text-base">Variantz — Singapore</p>
                  </div>
                  <span className="text-gray-600 font-medium text-xs sm:text-sm shrink-0">May 2025 – Oct 2025</span>
                </div>
                <ul className="space-y-1 sm:space-y-2 text-gray-700 text-sm sm:text-base">
                  {['Promoted from Intern to Product & Web Manager, owning end-to-end product, web, and growth systems across 2 production websites and 50+ SKUs', 'Appointed by CEO to lead 8 interns across product launches, digital media, and in-store display execution', 'Re-architected responsive web platform (desktop/tablet/mobile), improving UI & UX, driving +30% user satisfaction', 'Led data-driven SEO, email automation, and social campaigns, increasing web traffic by 400%, accelerating company\'s B2B → B2C transition', 'Built scalable, AI-assisted product content pipelines (visuals, copy, metadata), increasing conversion rate by 15%', 'Launched the technical and brand foundation for APAWLOGY, a new IoT pet sub-brand, from zero to market-ready'].map((line, i) => (
                    <li key={i} className="flex items-start"><span className="text-blue-600 mr-2 shrink-0">•</span><span>{line}</span></li>
                  ))}
                </ul>
              </div>
              {/* Digital Commerce */}
              <div className="p-4 sm:p-5 md:p-6 border-l-4 border-green-600 hover:bg-green-50/30 transition-colors">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1 mb-2 sm:mb-3">
                  <div>
                    <h4 className="text-base sm:text-lg font-semibold text-gray-900">Digital Commerce & Automation Operator</h4>
                    <p className="text-green-600 font-medium text-sm sm:text-base">Independent (eBay, Etsy)</p>
                  </div>
                  <span className="text-gray-600 font-medium text-xs sm:text-sm shrink-0">May 2024 – Present</span>
                </div>
                <ul className="space-y-1 sm:space-y-2 text-gray-700 text-sm sm:text-base">
                  {['Built and operated multi-platform commerce system, generating $5k+ profit through data-driven product selection', 'Managed end-to-end digital funnels: product research, pricing strategy, listing optimization, order automation, and customer support, maintaining 5-star seller ratings', 'Optimized workflows using spreadsheets, scripts, and platform tools to reduce manual operations and increase scale'].map((line, i) => (
                    <li key={i} className="flex items-start"><span className="text-green-600 mr-2 shrink-0">•</span><span>{line}</span></li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Projects */}
        <div
          id="projects"
          ref={(el) => (sectionRefs.current['projects'] = el)}
          className={sectionClasses('projects')}
        >
          <div className={boxBase}>
            <div className="p-4 sm:p-5 md:p-6 border-b border-gray-100">
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center">
                <span className="bg-indigo-600 text-white w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center mr-2 text-sm sm:text-base">🚀</span>
                Projects
              </h3>
            </div>
            <div className="divide-y divide-gray-100">
              <div className="p-4 sm:p-5 md:p-6 border-l-4 border-indigo-600 hover:bg-indigo-50/30 transition-colors">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1 mb-2 sm:mb-3">
                  <div>
                    <h4 className="text-base sm:text-lg font-semibold text-gray-900">3D AI-Powered Portfolio</h4>
                    <p className="text-indigo-600 font-medium text-sm sm:text-base">jijunnie.com</p>
                  </div>
                </div>
                <ul className="space-y-1 sm:space-y-2 text-gray-700 text-sm sm:text-base">
                  {['Creative, interactive 3D portfolio built with React, Three.js, and AI chat integration', 'Showcases projects, experience, and personality with responsive design across devices'].map((line, i) => (
                    <li key={i} className="flex items-start"><span className="text-indigo-600 mr-2 shrink-0">•</span><span>{line}</span></li>
                  ))}
                </ul>
              </div>
              <div className="p-4 sm:p-5 md:p-6 border-l-4 border-amber-600 hover:bg-amber-50/30 transition-colors">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1 mb-2 sm:mb-3">
                  <div>
                    <h4 className="text-base sm:text-lg font-semibold text-gray-900">Unified Commerce Web Application</h4>
                    <p className="text-amber-600 font-medium text-sm sm:text-base">In development</p>
                  </div>
                </div>
                <ul className="space-y-1 sm:space-y-2 text-gray-700 text-sm sm:text-base">
                  {['Cross-platform web app aggregating market signals, demand and competition analysis, and supplier identification', 'Single system for listing creation and sales execution'].map((line, i) => (
                    <li key={i} className="flex items-start"><span className="text-amber-600 mr-2 shrink-0">•</span><span>{line}</span></li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Leadership */}
        <div
          id="leadership"
          ref={(el) => (sectionRefs.current['leadership'] = el)}
          className={sectionClasses('leadership')}
        >
          <div className={boxBase}>
            <div className="p-4 sm:p-5 md:p-6 border-b border-gray-100">
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center">
                <span className="bg-purple-600 text-white w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center mr-2 text-sm sm:text-base">👥</span>
                Leadership Experience
              </h3>
            </div>
            <div className="divide-y divide-gray-100">
              <div className="p-4 sm:p-5 md:p-6 border-l-4 border-orange-600 hover:bg-orange-50/30 transition-colors">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1 mb-2 sm:mb-3">
                  <div>
                    <h4 className="text-base sm:text-lg font-semibold text-gray-900">Vice President</h4>
                    <p className="text-orange-600 font-medium text-sm sm:text-base">UF Chinese Student Association (UFCSA)</p>
                  </div>
                  <span className="text-gray-600 font-medium text-xs sm:text-sm shrink-0">Aug 2024 – Present</span>
                </div>
                <ul className="space-y-1 sm:space-y-2 text-gray-700 text-sm sm:text-base">
                  {['Elected to lead 6 committees (35+ members) overseeing operations, communications, marketing, events, and finance', 'Transformed an inactive club into a highly engaged community for international students', 'Launched social media on 5 platforms, club website, inter-club collaborations, and large-scale cultural events', 'Planned and executed 5 major events with 300+ attendees each', 'Introduced monthly activities with 100% increase in member participation'].map((line, i) => (
                    <li key={i} className="flex items-start"><span className="text-orange-600 mr-2 shrink-0">•</span><span>{line}</span></li>
                  ))}
                </ul>
              </div>
              <div className="p-4 sm:p-5 md:p-6 border-l-4 border-pink-600 hover:bg-pink-50/30 transition-colors">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1 mb-2 sm:mb-3">
                  <div>
                    <h4 className="text-base sm:text-lg font-semibold text-gray-900">Head Intern Leader, Merch Committee</h4>
                    <p className="text-pink-600 font-medium text-sm sm:text-base">UF Society of Asian Scientists and Engineers (SASE)</p>
                  </div>
                  <span className="text-gray-600 font-medium text-xs sm:text-sm shrink-0">Aug 2024 – Dec 2025</span>
                </div>
                <ul className="space-y-1 sm:space-y-2 text-gray-700 text-sm sm:text-base">
                  {['Selected for competitive internship supporting club operations and outreach', 'Collaborated with 6 to design, order, and sell club merchandise', 'Raised over $1k and achieved 50%+ increase in GBM and social event participation'].map((line, i) => (
                    <li key={i} className="flex items-start"><span className="text-pink-600 mr-2 shrink-0">•</span><span>{line}</span></li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Certifications */}
        <div
          id="certifications"
          ref={(el) => (sectionRefs.current['certifications'] = el)}
          className={sectionClasses('certifications')}
        >
          <div className={`${boxBase} p-4 sm:p-5 md:p-6`}>
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4 flex items-center">
              <span className="bg-blue-600 text-white w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center mr-2 text-sm sm:text-base">🏆</span>
              Certifications
            </h3>
            <div className="space-y-4 sm:space-y-5">
              {certifications.map((cert, idx) => (
                <div key={idx} className="border-l-4 border-blue-600 pl-3 sm:pl-4 py-1 hover:bg-blue-50/30 rounded-r-lg transition-colors">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-0 sm:gap-2 mb-1">
                    <h4 className="font-semibold text-gray-900 text-sm sm:text-base">{cert.title}</h4>
                    <span className="text-xs sm:text-sm text-gray-600 font-medium">{cert.date}</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 sm:gap-2 mt-2">
                    {cert.skills.map((skill, i) => (
                      <span key={i} className="px-2 sm:px-3 py-0.5 sm:py-1 bg-blue-100 text-blue-800 rounded-full text-xs sm:text-sm font-medium">{skill}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Technical Skills */}
        <div
          id="skills"
          ref={(el) => (sectionRefs.current['skills'] = el)}
          className={sectionClasses('skills')}
        >
          <div className={`${boxBase} p-4 sm:p-5 md:p-6`}>
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4 flex items-center">
              <span className="bg-teal-600 text-white w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center mr-2 text-sm sm:text-base">💻</span>
              Technical Skills
            </h3>
            <div className="space-y-3 sm:space-y-4">
              {[
                { title: 'Languages', items: ['English (Fluent)', 'Mandarin (Fluent)', 'Cantonese (Fluent)'], className: 'bg-blue-100 text-blue-800' },
                { title: 'Programming & Data', items: ['JavaScript (Master)', 'Python (Master)', 'SQL (Familiar)', 'Matlab (Familiar)', 'R (Familiar)'], className: 'bg-purple-100 text-purple-800' },
                { title: 'Web & Systems', items: ['HTML/CSS', 'SEO/SEM', 'Data Analytics (Certified)', 'Wix', 'E-commerce Platforms'], className: 'bg-green-100 text-green-800' },
                { title: 'Tools', items: ['SolidWorks (Certified)', 'Google Workspace', 'Microsoft Office', 'Canva', 'Meitu', 'Asana', 'Cursor'], className: 'bg-teal-100 text-teal-800' },
                { title: 'Product & Business', items: ['Digital Marketing (Certified)', 'BI (Certified)', 'Project Management (Certified)', 'Photo & video editing', 'AI-assisted content creation'], className: 'bg-pink-100 text-pink-800' },
              ].map((group, gidx) => (
                <div key={gidx}>
                  <h4 className="font-semibold text-gray-900 mb-1.5 sm:mb-2 text-sm sm:text-base">{group.title}</h4>
                  <div className="flex flex-wrap gap-1.5 sm:gap-2">
                    {group.items.map((item, i) => (
                      <span key={i} className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs sm:text-sm font-medium ${group.className}`}>{item}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Download */}
        <div
          id="download"
          ref={(el) => (sectionRefs.current['download'] = el)}
          className={sectionClasses('download')}
        >
          <div className="text-center">
            <a
              href={resumePdfUrl}
              download="Jijun Nie Resume.pdf"
              className="inline-block bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 sm:px-8 md:px-12 py-3 sm:py-4 rounded-lg font-semibold text-base sm:text-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 active:scale-100"
            >
              📄 Download Full Resume (PDF)
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
