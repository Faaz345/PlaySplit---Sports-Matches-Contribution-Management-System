import React from 'react';
import { motion } from 'framer-motion';
import { FaFutbol, FaHeart, FaGithub, FaTwitter, FaInstagram } from 'react-icons/fa';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <motion.footer 
      className="glass-dark border-t border-white/20 mt-20"
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      viewport={{ once: true }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand Section */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <motion.div
                className="text-grass-400 text-2xl"
                whileHover={{ rotate: 360, scale: 1.1 }}
                transition={{ duration: 0.5 }}
              >
                <FaFutbol />
              </motion.div>
              <span className="text-xl font-bold text-white">PlaySplit</span>
            </div>
            <p className="text-white/60 text-sm leading-relaxed">
              The ultimate platform for organizing football matches, 
              managing payments, and bringing players together on the turf.
            </p>
            <div className="flex items-center space-x-2 text-white/60 text-sm">
              <span>Made with</span>
              <FaHeart className="text-red-400 animate-pulse" />
              <span>for football lovers</span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Quick Links</h3>
            <div className="space-y-2">
              {[
                { label: 'Home', href: '/' },
                { label: 'How it Works', href: '#features' },
                { label: 'Pricing', href: '#pricing' },
                { label: 'Contact', href: '#contact' },
                { label: 'Privacy Policy', href: '/privacy' },
                { label: 'Terms of Service', href: '/terms' }
              ].map((link, index) => (
                <motion.a
                  key={link.label}
                  href={link.href}
                  className="block text-white/60 hover:text-grass-400 transition-colors text-sm"
                  whileHover={{ x: 5 }}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  viewport={{ once: true }}
                >
                  {link.label}
                </motion.a>
              ))}
            </div>
          </div>

          {/* Contact & Social */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Connect With Us</h3>
            <div className="space-y-2 text-sm text-white/60">
              <p>📧 support@playsplit.com</p>
              <p>📱 +1 (555) 123-4567</p>
              <p>📍 Football Street, Sports City</p>
            </div>
            
            {/* Social Media Links */}
            <div className="flex space-x-4 pt-2">
              {[
                { Icon: FaGithub, href: 'https://github.com/playsplit', label: 'GitHub' },
                { Icon: FaTwitter, href: 'https://twitter.com/playsplit', label: 'Twitter' },
                { Icon: FaInstagram, href: 'https://instagram.com/playsplit', label: 'Instagram' }
              ].map(({ Icon, href, label }) => (
                <motion.a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-white/10 hover:bg-grass-600/20 border border-white/20 hover:border-grass-400/50 rounded-full flex items-center justify-center text-white/60 hover:text-grass-400 transition-all duration-300"
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  whileTap={{ scale: 0.95 }}
                  aria-label={label}
                >
                  <Icon className="text-sm" />
                </motion.a>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <motion.div 
          className="border-t border-white/20 pt-6 mt-8"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          viewport={{ once: true }}
        >
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="text-white/60 text-sm">
              © {currentYear} PlaySplit. All rights reserved.
            </div>
            <div className="flex items-center space-x-6 text-sm text-white/60">
              <span>Built with React & Node.js</span>
              <span>•</span>
              <span>Powered by Razorpay</span>
              <span>•</span>
              <span>Secured by Firebase</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-grass-600/20 to-transparent" />
        <div 
          className="absolute inset-0" 
          style={{
            backgroundImage: 'radial-gradient(circle at 25% 25%, rgba(76, 175, 80, 0.1) 0%, transparent 50%)',
          }}
        />
      </div>
    </motion.footer>
  );
};

export default Footer;
