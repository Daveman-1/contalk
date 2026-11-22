'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { getIdentity } from '@/lib/identity';

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState(null);
  const [anonName, setAnonName] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);

  const loadIdentity = () => {
    if (typeof window === 'undefined') return;
    const identity = getIdentity();
    if (!identity.isAnon) {
      setUser({ id: identity.id, username: identity.name });
      setAnonName('');
    } else {
      setUser(null);
      setAnonName(identity.name);
    }
  };

  useEffect(() => {
    loadIdentity();
    window.addEventListener('auth_change', loadIdentity);
    window.addEventListener('storage', loadIdentity);
    return () => {
      window.removeEventListener('auth_change', loadIdentity);
      window.removeEventListener('storage', loadIdentity);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('ct_token');
    localStorage.removeItem('ct_user');
    window.dispatchEvent(new Event('auth_change'));
    loadIdentity();
    router.push('/');
    setMenuOpen(false);
  };

  const isActive = (href) => pathname === href;

  return (
    <nav className="nav-glass fixed top-0 left-0 right-0 z-50 h-16">
      <div className="max-w-7xl mx-auto px-4 h-full flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, #005577, #00d4ff)',
              boxShadow: '0 0 15px rgba(0,212,255,0.4)',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
            </svg>
          </div>
          <span className="text-xl font-black gradient-text">ConTalk</span>
        </Link>

        {/* Desktop Nav Links */}
        <div className="hidden md:flex items-center gap-1">
          {[
            { href: '/', label: 'Home' },
            { href: '/feed', label: 'Feed' },
            { href: '/rooms', label: 'Rooms' },
            { href: '/random', label: 'Random Chat' },
            { href: '/browse', label: 'Browse' },
          ].map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                isActive(link.href)
                  ? 'text-white bg-white/10'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Auth / Identity Section */}
        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <>
              <div
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
                style={{ background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.2)' }}
              >
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{ background: 'linear-gradient(135deg, #005577, #00d4ff)' }}
                >
                  {user.username[0].toUpperCase()}
                </div>
                <span className="text-sm font-medium" style={{ color: '#00d4ff' }}>{user.username}</span>
              </div>
              <button onClick={handleLogout} className="btn-danger text-sm py-1.5 px-4">
                Logout
              </button>
            </>
          ) : (
            <>
              {anonName && (
                <div
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-white/70"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                  title="Your anonymous identity"
                >
                  <span className="online-dot"></span>
                  <span>{anonName}</span>
                </div>
              )}
              <Link href="/login">
                <button className="btn-secondary text-sm py-1.5 px-4">Login</button>
              </Link>
              <Link href="/signup">
                <button className="btn-primary text-sm py-1.5 px-4">Sign Up</button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          {menuOpen ? (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          ) : (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden nav-glass border-t border-white/10 p-4 space-y-2">
          {[
            { href: '/', label: 'Home' },
            { href: '/feed', label: 'Feed' },
            { href: '/rooms', label: 'Rooms' },
            { href: '/random', label: 'Random Chat' },
            { href: '/browse', label: 'Browse' },
          ].map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className={`block px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive(link.href) ? 'text-white bg-white/10' : 'text-white/60 hover:text-white'
              }`}
            >
              {link.label}
            </Link>
          ))}
          <div className="pt-2 border-t border-white/10">
            {user ? (
              <div className="space-y-2">
                <div className="px-4 py-2 text-sm text-white/50">
                  Signed in as <span className="font-semibold" style={{ color: '#00d4ff' }}>{user.username}</span>
                </div>
                <button onClick={handleLogout} className="w-full btn-danger text-sm py-2">Logout</button>
              </div>
            ) : (
              <div className="space-y-2">
                {anonName && (
                  <div className="px-4 py-1 text-xs text-white/50">
                    Chatting anonymously as <span className="text-white/80 font-medium">{anonName}</span>
                  </div>
                )}
                <div className="flex gap-2">
                  <Link href="/login" className="flex-1" onClick={() => setMenuOpen(false)}>
                    <button className="btn-secondary w-full text-sm py-2">Login</button>
                  </Link>
                  <Link href="/signup" className="flex-1" onClick={() => setMenuOpen(false)}>
                    <button className="btn-primary w-full text-sm py-2">Sign Up</button>
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
