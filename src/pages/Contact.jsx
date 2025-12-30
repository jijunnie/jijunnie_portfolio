import React, { useState, useRef, useEffect } from 'react';
import { Mail, Phone, Calendar, Linkedin, Github, Send, MessageSquare, Instagram } from 'lucide-react';
import emailjs from '@emailjs/browser';

export default function Contact() {
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [hoveredCard, setHoveredCard] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const canvasRef = useRef(null);
  const mousePos = useRef({ x: 0, y: 0 });
  const particles = useRef([]);

  // Initialize EmailJS
  useEffect(() => {
    emailjs.init('9h7WZUCDkTZScTuFO');
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let animationFrameId;

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight; // Use viewport height for fixed layout
      initParticles();
    };

    // Initialize particles
    const initParticles = () => {
      particles.current = [];
      const particleCount = Math.floor((canvas.width * canvas.height) / 12000);
      
      for (let i = 0; i < particleCount; i++) {
        particles.current.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 0.3,
          vy: (Math.random() - 0.5) * 0.3,
          radius: Math.random() * 2 + 1.5
        });
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Mouse move handler
    const handleMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      mousePos.current = {
        x: e.clientX,
        y: e.clientY + window.scrollY
      };
    };

    window.addEventListener('mousemove', handleMouseMove);

    // Animation loop
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Update and draw particles
      particles.current.forEach((particle, i) => {
        // Move particles
        particle.x += particle.vx;
        particle.y += particle.vy;

        // Bounce off edges
        if (particle.x < 0 || particle.x > canvas.width) particle.vx *= -1;
        if (particle.y < 0 || particle.y > canvas.height) particle.vy *= -1;

        // Keep in bounds
        particle.x = Math.max(0, Math.min(canvas.width, particle.x));
        particle.y = Math.max(0, Math.min(canvas.height, particle.y));

        // Mouse interaction - repel particles
        const dx = mousePos.current.x - particle.x;
        const dy = mousePos.current.y - particle.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const maxDistance = 120;

        if (distance < maxDistance) {
          const force = (maxDistance - distance) / maxDistance;
          const angle = Math.atan2(dy, dx);
          particle.x -= Math.cos(angle) * force * 2;
          particle.y -= Math.sin(angle) * force * 2;
        }

        // Calculate glow based on distance to mouse
        const distanceToMouse = Math.sqrt(
          Math.pow(mousePos.current.x - particle.x, 2) + 
          Math.pow(mousePos.current.y - particle.y, 2)
        );
        
        const glowIntensity = Math.max(0, 1 - distanceToMouse / 180);
        
        // Draw particle glow
        if (glowIntensity > 0) {
          ctx.beginPath();
          const gradient = ctx.createRadialGradient(
            particle.x, particle.y, 0,
            particle.x, particle.y, particle.radius * 6
          );
          gradient.addColorStop(0, `rgba(139, 92, 246, ${glowIntensity * 0.5})`);
          gradient.addColorStop(1, 'rgba(139, 92, 246, 0)');
          ctx.fillStyle = gradient;
          ctx.arc(particle.x, particle.y, particle.radius * 6, 0, Math.PI * 2);
          ctx.fill();
        }

        // Draw particle
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        ctx.fillStyle = glowIntensity > 0.3 
          ? `rgba(139, 92, 246, ${0.9})`
          : 'rgba(99, 102, 241, 0.7)';
        ctx.fill();

        // Draw connections
        for (let j = i + 1; j < particles.current.length; j++) {
          const otherParticle = particles.current[j];
          const dx = particle.x - otherParticle.x;
          const dy = particle.y - otherParticle.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const maxConnectionDistance = 140;

          if (dist < maxConnectionDistance) {
            const opacity = (1 - dist / maxConnectionDistance) * 0.4;
            
            // Check if line is near mouse
            const midX = (particle.x + otherParticle.x) / 2;
            const midY = (particle.y + otherParticle.y) / 2;
            const distanceToMouseMid = Math.sqrt(
              Math.pow(mousePos.current.x - midX, 2) + 
              Math.pow(mousePos.current.y - midY, 2)
            );
            
            const lineGlow = Math.max(0, 1 - distanceToMouseMid / 130);
            
            ctx.beginPath();
            ctx.moveTo(particle.x, particle.y);
            ctx.lineTo(otherParticle.x, otherParticle.y);
            
            if (lineGlow > 0.2) {
              // Glowing line near mouse
              ctx.strokeStyle = `rgba(139, 92, 246, ${opacity + lineGlow * 0.6})`;
              ctx.lineWidth = 1 + lineGlow * 1.5;
              ctx.shadowBlur = 10;
              ctx.shadowColor = 'rgba(139, 92, 246, 0.6)';
            } else {
              // Normal line
              ctx.strokeStyle = `rgba(100, 116, 139, ${opacity})`;
              ctx.lineWidth = 0.8;
              ctx.shadowBlur = 0;
            }
            
            ctx.stroke();
            ctx.shadowBlur = 0;
          }
        }
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  const contactMethods = [
    {
      icon: Mail,
      title: 'Email',
      value: 'jijunnie2113@gmail.com',
      link: 'mailto:jijunnie2113@gmail.com',
      color: 'from-red-500 to-pink-500'
    },
    {
      icon: Phone,
      title: 'Phone',
      value: '+1 (754)610-4078',
      link: 'tel:+17546104078',
      color: 'from-green-500 to-emerald-500'
    },
    {
      icon: Calendar,
      title: 'Schedule Meeting',
      value: 'Book a 30-min call',
      link: 'https://calendar.app.google/E3d2bkJ778pT7T1E8',
      color: 'from-blue-500 to-cyan-500'
    }
  ];

  const socialLinks = [
    { icon: Linkedin, url: 'https://www.linkedin.com/in/jijun-nie-0aa297345/', label: 'LinkedIn', color: '#0A66C2' },
    { icon: Github, url: 'https://github.com/jijunnie', label: 'GitHub', color: '#171515' },
    { icon: Instagram, url: 'https://www.instagram.com/jijun_nie/', label: 'Instagram', color: '#E4405F' },
    { icon: MessageSquare, url: 'https://discord.com/users/jijunnie', label: 'Discord', color: '#5865F2' }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Log to verify data
    console.log('Sending email with data:', {
      from_name: formData.name,
      from_email: formData.email,
      message: formData.message
    });
    
    try {
      const result = await emailjs.send(
        'service_0fqtjbj',      
        'template_rk6rqhn',     
        {
          from_name: formData.name,
          from_email: formData.email,
          message: formData.message,
        }
      );
  
      console.log('Email sent successfully:', result);
      alert('✨ Message sent successfully! I\'ll get back to you soon.');
      setFormData({ name: '', email: '', message: '' });
      
    } catch (error) {
      console.error('Detailed error:', error);
      console.error('Error text:', error.text);
      console.error('Error status:', error.status);
      
      if (error.text === 'The public key is invalid') {
        alert('❌ Configuration error. Please check your EmailJS public key.');
      } else if (error.status === 412) {
        alert('❌ Please verify your email address in EmailJS dashboard first.');
      } else {
        alert('❌ Failed to send message. Please try again or email me directly at jijunnie2113@gmail.com');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="relative px-3 xs:px-4 sm:px-6 lg:px-8 h-screen overflow-hidden bg-gradient-to-br from-slate-50 via-purple-50 to-blue-50">
      {/* Network Background Canvas */}
      <canvas
        ref={canvasRef}
        className="fixed top-0 left-0 w-full h-full pointer-events-none"
        style={{ zIndex: 0 }}
      />

      <div className="relative max-w-7xl mx-auto h-full flex flex-col justify-start pt-4 xs:pt-5 sm:pt-6 lg:pt-8" style={{ zIndex: 10, paddingBottom: 'max(1rem, env(safe-area-inset-bottom, 1rem))' }}>
        {/* Header */}
        <div className="text-center mb-4 xs:mb-5 sm:mb-6 lg:mb-8 px-2">
          <h2 className="text-2xl xs:text-3xl sm:text-4xl lg:text-5xl font-bold mb-1.5 xs:mb-2 lg:mb-3 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600">
            Let's Connect
          </h2>
          <p className="text-sm xs:text-base sm:text-base lg:text-lg text-gray-700 max-w-2xl mx-auto px-2">
            Have a project in mind? Let's create something amazing together.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-4 xs:gap-5 sm:gap-6 lg:gap-8 items-start flex-1 overflow-y-auto lg:overflow-visible pb-3 xs:pb-4 lg:pb-0 px-2 xs:px-0">
          {/* Left Column - Contact Methods & Social */}
          <div className="space-y-3 xs:space-y-4 lg:space-y-5">
            {/* Contact Cards */}
            <div className="space-y-2.5 xs:space-y-3">
              {contactMethods.map((method, index) => {
                const Icon = method.icon;
                const isMailto = method.link.startsWith('mailto:');
                const isTel = method.link.startsWith('tel:');
                return (
                  <a
                    key={index}
                    href={method.link}
                    {...(!isMailto && !isTel ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                    onMouseEnter={() => setHoveredCard(index)}
                    onMouseLeave={() => setHoveredCard(null)}
                    className="block group touch-manipulation"
                  >
                    <div className={`
                      relative bg-white/90 backdrop-blur-md rounded-lg xs:rounded-xl lg:rounded-2xl p-3 xs:p-3.5 sm:p-4 lg:p-5 
                      border-2 border-gray-200 transition-all duration-300
                      shadow-lg hover:shadow-2xl active:scale-95
                      ${hoveredCard === index ? 'scale-105 border-purple-400 bg-white' : 'hover:scale-102'}
                    `}>
                      <div className="flex items-center space-x-2.5 xs:space-x-3 lg:space-x-4">
                        <div className={`
                          p-2 xs:p-2.5 lg:p-3 rounded-lg lg:rounded-xl bg-gradient-to-br ${method.color}
                          transform transition-transform duration-300 flex-shrink-0
                          ${hoveredCard === index ? 'rotate-12 scale-110' : ''}
                        `}>
                          <Icon className="w-4 h-4 xs:w-5 xs:h-5 lg:w-6 lg:h-6 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-gray-900 font-semibold text-sm xs:text-base lg:text-lg">{method.title}</h3>
                          <p className="text-gray-600 text-xs xs:text-sm lg:text-base truncate">{method.value}</p>
                        </div>
                        <Send className={`
                          w-3.5 h-3.5 xs:w-4 xs:h-4 lg:w-5 lg:h-5 text-gray-400 transition-all duration-300 flex-shrink-0
                          ${hoveredCard === index ? 'translate-x-2 text-purple-600' : ''}
                        `} />
                      </div>
                    </div>
                  </a>
                );
              })}
            </div>

            {/* Social Media Links */}
            <div className="bg-white/90 backdrop-blur-md rounded-lg xs:rounded-xl lg:rounded-2xl p-4 xs:p-4.5 sm:p-5 lg:p-6 border-2 border-gray-200 shadow-lg">
              <h3 className="text-gray-900 font-semibold text-base xs:text-lg lg:text-xl mb-3 xs:mb-4 lg:mb-5 text-center">Follow Me</h3>
              <div className="flex justify-center space-x-2.5 xs:space-x-3 lg:space-x-4">
                {socialLinks.map((social, index) => {
                  const Icon = social.icon;
                  return (
                    <a
                      key={index}
                      href={social.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={social.label}
                      className="group relative touch-manipulation"
                    >
                      <div className="
                        w-10 h-10 xs:w-12 xs:h-12 lg:w-14 lg:h-14 rounded-lg lg:rounded-xl bg-gray-50
                        flex items-center justify-center
                        border-2 border-gray-200 transition-all duration-300
                        group-hover:scale-110 group-hover:rotate-6 group-hover:border-purple-400
                        group-hover:shadow-lg active:scale-95
                      ">
                        <Icon className="w-4 h-4 xs:w-5 xs:h-5 lg:w-6 lg:h-6 transition-colors" style={{ color: social.color }} />
                      </div>
                      <span className="absolute -bottom-6 xs:-bottom-7 lg:-bottom-8 left-1/2 -translate-x-1/2 text-[10px] xs:text-xs text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap hidden sm:block">
                        {social.label}
                      </span>
                    </a>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column - Contact Form */}
          <div className="bg-white/90 backdrop-blur-md rounded-lg xs:rounded-xl lg:rounded-2xl p-4 xs:p-5 sm:p-6 lg:p-7 border-2 border-gray-200 shadow-lg">
            <h3 className="text-gray-900 font-semibold text-lg xs:text-xl lg:text-2xl mb-3 xs:mb-4 lg:mb-5">Send a Message</h3>
            <form onSubmit={handleSubmit} className="space-y-3 xs:space-y-4 lg:space-y-5">
              <div>
                <label htmlFor="name" className="block text-gray-700 mb-1 xs:mb-1.5 lg:mb-2 text-xs lg:text-sm font-medium">
                  Your Name
                </label>
                <input
                  type="text"
                  id="name"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-3 xs:px-3.5 lg:px-4 py-2 xs:py-2.5 lg:py-2.5 rounded-lg lg:rounded-xl bg-gray-50 border-2 border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-sm lg:text-base touch-manipulation"
                  style={{ fontSize: '16px' }}
                  placeholder="First Last"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-gray-700 mb-1 xs:mb-1.5 lg:mb-2 text-xs lg:text-sm font-medium">
                  Your Email
                </label>
                <input
                  type="email"
                  id="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full px-3 xs:px-3.5 lg:px-4 py-2 xs:py-2.5 lg:py-2.5 rounded-lg lg:rounded-xl bg-gray-50 border-2 border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-sm lg:text-base touch-manipulation"
                  style={{ fontSize: '16px' }}
                  placeholder="name@example.com"
                />
              </div>

              <div>
                <label htmlFor="message" className="block text-gray-700 mb-1 xs:mb-1.5 lg:mb-2 text-xs lg:text-sm font-medium">
                  Your Message
                </label>
                <textarea
                  id="message"
                  required
                  rows="4"
                  value={formData.message}
                  onChange={(e) => setFormData({...formData, message: e.target.value})}
                  className="w-full px-3 xs:px-3.5 lg:px-4 py-2 xs:py-2.5 lg:py-2.5 rounded-lg lg:rounded-xl bg-gray-50 border-2 border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-none text-sm lg:text-base touch-manipulation"
                  style={{ fontSize: '16px' }}
                  placeholder="Tell me about your project..."
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 xs:py-3 lg:py-3.5 rounded-lg lg:rounded-xl bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 text-white font-semibold text-sm xs:text-base lg:text-lg shadow-lg hover:shadow-2xl transform hover:scale-105 active:scale-95 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 touch-manipulation"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 xs:w-5 xs:h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Sending...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 xs:w-5 xs:h-5" />
                    <span>Send Message</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}