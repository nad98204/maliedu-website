import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

const Breadcrumb = ({ items, className = "" }) => {
    return (
        <nav className={`flex items-center text-sm mb-6 ${className}`} aria-label="Breadcrumb">
            <Link
                to="/"
                className="flex items-center gap-1 opacity-70 hover:opacity-100 transition-opacity"
            >
                <Home className="w-4 h-4" />
                <span>Trang chủ</span>
            </Link>

            {items.map((item, index) => (
                <div key={index} className="flex items-center">
                    <ChevronRight className="w-4 h-4 opacity-50 mx-2" />
                    {item.link ? (
                        <Link
                            to={item.link}
                            className="opacity-70 hover:opacity-100 transition-opacity"
                        >
                            {item.label}
                        </Link>
                    ) : (
                        <span className="font-bold truncate max-w-[200px] md:max-w-xs block opacity-100">
                            {item.label}
                        </span>
                    )}
                </div>
            ))}
        </nav>
    );
};

export default Breadcrumb;
