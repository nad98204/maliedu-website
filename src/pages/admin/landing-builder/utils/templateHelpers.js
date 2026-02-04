/**
 * Template Helpers Utilities
 * Các hàm tiện ích để làm việc với landing templates
 */

/**
 * Load config file cho một template
 * @param {string} templateId - ID của template
 * @returns {Promise<Object>} Config object
 */
export const loadTemplateConfig = async (templateId) => {
  try {
    const config = await import(`../../../landing-templates/${templateId}/config.json`);
    return config.default || config;
  } catch {
    console.warn(`Config not found for template: ${templateId}`);
    return null;
  }
};

/**
 * Get all available templates
 * @returns {Array} Danh sách templates
 */
export const getAllTemplates = () => {
  // Sẽ được cập nhật khi có nhiều templates
  // Hiện tại hardcode để demo
  return [
    {
      id: 'example-template',
      component: 'ExampleTemplate'
    }
  ];
};

/**
 * Generate preview URL cho template
 * @param {string} templateId - ID của template
 * @returns {string} Preview URL
 */
export const getPreviewUrl = (templateId) => {
  return `/preview/${templateId}`;
};

/**
 * Validate template structure
 * @param {Object} template - Template object
 * @param {Object} config - Config object
 * @returns {boolean} Valid hay không
 */
export const validateTemplate = (template, config) => {
  if (!template || !config) return false;
  if (!config.id || !config.name) return false;
  return true;
};
