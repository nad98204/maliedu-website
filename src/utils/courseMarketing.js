export const getCourseLeadLandingUrl = (course = {}) => (
    String(course.leadLandingUrl || '').trim()
);

export const isLeadGenerationCourse = (course = {}) => (
    course.isForSale === false
    && course.isLeadGenerationEnabled === true
    && Boolean(getCourseLeadLandingUrl(course))
);

export const isPublicCatalogCourse = (course = {}) => (
    course.isPublished === true
    && (course.isForSale !== false || isLeadGenerationCourse(course))
);

export const isExternalCourseUrl = (url = '') => /^https?:\/\//i.test(String(url).trim());

export const normalizeCourseLandingUrl = (url = '') => {
    const normalizedUrl = String(url).trim();
    if (!normalizedUrl || isExternalCourseUrl(normalizedUrl)) return normalizedUrl;
    return normalizedUrl.startsWith('/') ? normalizedUrl : `/${normalizedUrl}`;
};

export const openCourseLeadLanding = ({ course, navigate }) => {
    const landingUrl = normalizeCourseLandingUrl(getCourseLeadLandingUrl(course));
    if (!landingUrl) return false;

    if (isExternalCourseUrl(landingUrl)) {
        window.location.assign(landingUrl);
    } else {
        navigate(landingUrl);
    }

    return true;
};
