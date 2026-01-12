import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

export const Breadcrumbs: React.FC = () => {
    const location = useLocation();
    const pathnames = location.pathname.split('/').filter((x) => x);

    if (pathnames.length === 0) return null;

    const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1).replace(/-/g, ' ');

    return (
        <div style={{ background: '#f5f5f5', padding: '10px 0', fontSize: '12px' }}>
            <div className="container" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#666' }}>
                <Link to="/" style={{ display: 'flex', alignItems: 'center', color: '#666', textDecoration: 'none' }}>
                    <Home size={14} />
                </Link>
                {pathnames.map((value, index) => {
                    const to = `/${pathnames.slice(0, index + 1).join('/')}`;
                    const isLast = index === pathnames.length - 1;

                    return (
                        <React.Fragment key={to}>
                            <ChevronRight size={14} color="#ccc" />
                            {isLast ? (
                                <span style={{ fontWeight: 600, color: '#333' }}>{capitalize(value)}</span>
                            ) : (
                                <Link to={to} style={{ color: '#666', textDecoration: 'none' }}>
                                    {capitalize(value)}
                                </Link>
                            )}
                        </React.Fragment>
                    );
                })}
            </div>
        </div>
    );
};
