import React from 'react';
import { Link } from 'react-router-dom';
import { Search, Menu, Settings } from 'lucide-react';
import './NavBar.css';

export const NavBar: React.FC = () => {
    const [menuOpen, setMenuOpen] = React.useState(false);

    return (
        <header className="navbar">
            <div className="navbar-top container">
                <div className="navbar-brand">
                    <Link to="/">Best of Africa</Link>
                </div>
                <div className="navbar-actions">
                    <Link to="/search" className="search-btn">
                        <Search size={20} />
                        <span>Search</span>
                    </Link>
                    <Link to="/settings" className="menu-btn" style={{ marginLeft: '10px' }}>
                        <Settings size={24} />
                    </Link>
                    <Link to="/login" style={{ color: '#052962', textDecoration: 'none', fontSize: '14px', border: '1px solid #052962', padding: '4px 10px', borderRadius: '4px', marginLeft: '10px', alignSelf: 'center' }}>Sign In</Link>
                    <button className="menu-btn" onClick={() => setMenuOpen(!menuOpen)}>
                        <Menu size={24} />
                    </button>
                </div>
            </div>

            <nav className={`navbar-links ${menuOpen ? 'open' : ''}`} style={{ display: menuOpen ? 'block' : undefined }}>
                <div className="container">
                    <ul>
                        <li><Link to="/">Home</Link></li>
                        <li><Link to="/news">News</Link></li>
                        <li><Link to="/feed" style={{ color: '#d4af37', fontWeight: 600 }}>For You</Link></li>
                        <li><Link to="/dashboards">Dashboards</Link></li>
                        <li><Link to="/countries">Countries</Link></li>
                        <li><Link to="/market-intel">Market Intelligence</Link></li>
                        <li><Link to="/narratives">Narratives</Link></li>
                    </ul>
                </div>
            </nav>
        </header>
    );
};
