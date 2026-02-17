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

  const resumePdfUrl = '/JN Resume 2.7.pdf';

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 min-h-screen bg-blue-50 relative">
      {/* Interactive 3D Background */}
      <InteractiveBackground />
      <div className="max-w-4xl mx-auto relative z-10">
        
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

        {/* Embedded Resume PDF */}
        <div
          id="resume-pdf"
          ref={(el) => (sectionRefs.current['resume-pdf'] = el)}
          className={`mb-12 transition-all duration-1000 ${
            visibleSections['resume-pdf']
              ? 'opacity-100 translate-y-0'
              : 'opacity-0 translate-y-10'
          }`}
        >
          <div className="bg-white rounded-xl shadow-xl overflow-hidden border border-gray-200">
            <iframe
              src={`${resumePdfUrl}#view=FitH`}
              title="Jijun Nie Resume"
              className="w-full border-0"
              style={{ minHeight: '80vh', height: '900px' }}
            />
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
            href={resumePdfUrl}
            download="JN Resume 2.7.pdf"
            className="inline-block bg-gradient-to-r from-blue-600 to-purple-600 text-white px-12 py-4 rounded-lg font-semibold text-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-110"
          >
            📄 Download Full Resume (PDF)
          </a>
        </div>

      </div>
    </section>
  );
}
