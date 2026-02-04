import React from 'react';
import { useParams, Navigate } from 'react-router-dom';
import * as LandingTemplates from '../landing-templates';

/**
 * LandingPageViewer Component
 * Dynamic route để hiển thị landing pages từ templates
 * URL: /landing/:templateId
 */
const LandingPageViewer = () => {
  const { templateId } = useParams();

  // Convert templateId từ kebab-case sang PascalCase
  // Ví dụ: "thien-giao-thua" -> "ThienGiaoThua"
  const toPascalCase = (str) => {
    return str
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join('');
  };

  const componentName = toPascalCase(templateId);
  const LandingComponent = LandingTemplates[componentName];

  // Nếu không tìm thấy template, redirect về home
  if (!LandingComponent) {
    console.error(`Template "${componentName}" not found`);
    return <Navigate to="/" replace />;
  }

  // Render landing page (full screen, không có header/footer)
  return (
    <div className="landing-page-viewer">
      <LandingComponent />
    </div>
  );
};

export default LandingPageViewer;
