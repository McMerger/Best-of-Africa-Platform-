import React from 'react';
import { Link } from 'react-router-dom';
import { Search, Menu, Settings } from 'lucide-react';
import './NavBar.css';

export const NavBar: React.FC = () => {
    const [menuOpen, setMenuOpen] = React.useState(false);
    const [isLive, setIsLive] = React.useState(false);
    const [visitorCount, setVisitorCount] = React.useState(0);

    // Connect to WebSocket for live status
    React.useEffect(() => {
        const wsUrl = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/api/v1/live/stream`;
        let ws: WebSocket | null = null;
        let reconnectTimeout: ReturnType<typeof setTimeout>;

        const connect = () => {
            try {
                ws = new WebSocket(wsUrl);

                ws.onopen = () => setIsLive(true);
                ws.onclose = () => {
                    setIsLive(false);
                    // Reconnect after 5s
                    reconnectTimeout = setTimeout(connect, 5000);
                };
                ws.onmessage = (event) => {
                    const data = JSON.parse(event.data);
                    if (data.type === 'visitor_count') {
                        setVisitorCount(data.count);
                    }
                };
                ws.onerror = () => setIsLive(false);
            } catch {
                setIsLive(false);
            }
        };

        connect();

        return () => {
            ws?.close();
            clearTimeout(reconnectTimeout);
        };
    }, []);

    return (
        <header className="navbar">
            <div className="navbar-top container">
                <div className="navbar-brand" style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <Link to="/">Best of Africa</Link>
                    <div style={{ padding: '4px 8px', background: isLive ? '#ecfdf5' : '#fef2f2', borderRadius: '4px', border: `1px solid ${isLive ? '#a7f3d0' : '#fecaca'}`, display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div style={{ width: '6px', height: '6px', background: isLive ? '#10B981' : '#ef4444', borderRadius: '50%' }} className={isLive ? 'animate-pulse-green' : ''}></div>
                        <span style={{ fontSize: '10px', fontWeight: 700, color: isLive ? '#047857' : '#dc2626', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            {isLive ? `Live${visitorCount > 0 ? ` • ${visitorCount}` : ''}` : 'Offline'}
                        </span>
                    </div>
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
