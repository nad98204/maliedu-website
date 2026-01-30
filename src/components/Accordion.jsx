import React, { useState } from 'react';
import { ChevronDown, ChevronUp, PlayCircle } from 'lucide-react';

const AccordionItem = ({ title, children, isOpen, onClick }) => {
    return (
        <div className="border border-gray-200 rounded-lg mb-2 overflow-hidden">
            <button
                className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
                onClick={onClick}
            >
                <h3 className="font-semibold text-gray-800 text-left">{title}</h3>
                {isOpen ? (
                    <ChevronUp className="w-5 h-5 text-gray-500" />
                ) : (
                    <ChevronDown className="w-5 h-5 text-gray-500" />
                )}
            </button>
            <div
                className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                    }`}
            >
                <div className="p-4 bg-white border-t border-gray-100">
                    {children}
                </div>
            </div>
        </div>
    );
};

const Accordion = ({ items }) => {
    const [openIndex, setOpenIndex] = useState(0); // Default open first item

    const handleClick = (index) => {
        setOpenIndex(openIndex === index ? -1 : index);
    };

    return (
        <div className="w-full">
            {items.map((item, index) => (
                <AccordionItem
                    key={index}
                    title={item.title}
                    isOpen={openIndex === index}
                    onClick={() => handleClick(index)}
                >
                    {item.content}
                </AccordionItem>
            ))}
        </div>
    );
};

export default Accordion;
