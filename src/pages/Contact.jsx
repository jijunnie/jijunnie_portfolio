import React, { useState, useRef, useEffect } from 'react';
import { Mail, Phone, Calendar, Linkedin, Github, Twitter, Send, MessageSquare } from 'lucide-react';

export default function Contact() {
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [hoveredCard, setHoveredCard] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const canvasRef = useRef(null);
  const mousePos = useRef({ x: 0, y: 0 });
  const particles = useRef([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let animationFrameId;

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = document.documentElement.scrollHeight;
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
      value: 'your.email@example.com',
      link: 'mailto:your.email@example.com',
      color: 'from-red-500 to-pink-500'
    },
    {
      icon: Phone,
      title: 'Phone',
      value: '+1 (555) 123-4567',
      link: 'tel:+15551234567',
      color: 'from-green-500 to-emerald-500'
    },
    {
      icon: Calendar,
      title: 'Schedule Meeting',
      value: 'Book a 30-min call',
      link: 'https://calendly.com/yourusername',
      color: 'from-blue-500 to-cyan-500'
    }
  ];

  const socialLinks = [
    { icon: Linkedin, url: 'https://linkedin.com/in/yourprofile', label: 'LinkedIn', color: '#0A66C2' },
    { icon: Github, url: 'https://github.com/yourprofile', label: 'GitHub', color: '#171515' },
    { icon: Twitter, url: 'https://twitter.com/yourprofile', label: 'Twitter', color: '#1DA1F2' },
    { icon: MessageSquare, url: 'https://discord.com/users/yourprofile', label: 'Discord', color: '#5865F2' }
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      alert('Message sent! I\'ll get back to you soon.');
      setFormData({ name: '', email: '', message: '' });
      setIsSubmitting(false);
    }, 1500);
  };

  return (
    <section className="relative py-20 px-4 sm:px-6 lg:px-8 min-h-screen overflow-hidden bg-gradient-to-br from-slate-50 via-purple-50 to-blue-50">
      {/* Network Background Canvas */}
      <canvas
        ref={canvasRef}
        className="fixed top-0 left-0 w-full h-full pointer-events-none"
        style={{ zIndex: 0 }}
      />

      <div className="relative max-w-7xl mx-auto" style={{ zIndex: 10 }}>
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-6xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600">
            Let's Connect
          </h2>
          <p className="text-xl text-gray-700 max-w-2xl mx-auto">
            Have a project in mind? Let's create something amazing together.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Left Column - Contact Methods & Social */}
          <div className="space-y-8">
            {/* Contact Cards */}
            <div className="space-y-4">
              {contactMethods.map((method, index) => {
                const Icon = method.icon;
                return (
                  <a
                    key={index}
                    href={method.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    onMouseEnter={() => setHoveredCard(index)}
                    onMouseLeave={() => setHoveredCard(null)}
                    className="block group"
                  >
                    <div className={`
                      relative bg-white/90 backdrop-blur-md rounded-2xl p-6 
                      border-2 border-gray-200 transition-all duration-300
                      shadow-lg hover:shadow-2xl
                      ${hoveredCard === index ? 'scale-105 border-purple-400 bg-white' : 'hover:scale-102'}
                    `}>
                      <div className="flex items-center space-x-4">
                        <div className={`
                          p-3 rounded-xl bg-gradient-to-br ${method.color}
                          transform transition-transform duration-300
                          ${hoveredCard === index ? 'rotate-12 scale-110' : ''}
                        `}>
                          <Icon className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-gray-900 font-semibold text-lg">{method.title}</h3>
                          <p className="text-gray-600">{method.value}</p>
                        </div>
                        <Send className={`
                          w-5 h-5 text-gray-400 transition-all duration-300
                          ${hoveredCard === index ? 'translate-x-2 text-purple-600' : ''}
                        `} />
                      </div>
                    </div>
                  </a>
                );
              })}
            </div>

            {/* Social Media Links */}
            <div className="bg-white/90 backdrop-blur-md rounded-2xl p-8 border-2 border-gray-200 shadow-lg">
              <h3 className="text-gray-900 font-semibold text-xl mb-6 text-center">Follow Me</h3>
              <div className="flex justify-center space-x-4">
                {socialLinks.map((social, index) => {
                  const Icon = social.icon;
                  return (
                    <a
                      key={index}
                      href={social.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={social.label}
                      className="group relative"
                    >
                      <div className="
                        w-14 h-14 rounded-xl bg-gray-50
                        flex items-center justify-center
                        border-2 border-gray-200 transition-all duration-300
                        group-hover:scale-110 group-hover:rotate-6 group-hover:border-purple-400
                        group-hover:shadow-lg
                      ">
                        <Icon className="w-6 h-6 transition-colors" style={{ color: social.color }} />
                      </div>
                      <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-xs text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        {social.label}
                      </span>
                    </a>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column - Contact Form */}
          <div className="bg-white/90 backdrop-blur-md rounded-2xl p-8 border-2 border-gray-200 shadow-lg">
            <h3 className="text-gray-900 font-semibold text-2xl mb-6">Send a Message</h3>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-gray-700 mb-2 text-sm font-medium">
                  Your Name
                </label>
                <input
                  type="text"
                  id="name"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 border-2 border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-gray-700 mb-2 text-sm font-medium">
                  Your Email
                </label>
                <input
                  type="email"
                  id="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 border-2 border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  placeholder="john@example.com"
                />
              </div>

              <div>
                <label htmlFor="message" className="block text-gray-700 mb-2 text-sm font-medium">
                  Your Message
                </label>
                <textarea
                  id="message"
                  required
                  rows="5"
                  value={formData.message}
                  onChange={(e) => setFormData({...formData, message: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 border-2 border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-none"
                  placeholder="Tell me about your project..."
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 text-white font-semibold text-lg shadow-lg hover:shadow-2xl transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Sending...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
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