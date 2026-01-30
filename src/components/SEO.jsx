import { Helmet } from 'react-helmet-async';

const SEO = ({ title, description, image, url, type = 'website' }) => {
    const siteTitle = 'Mali Edu - Đánh thức tiềm năng thịnh vượng';
    const displayTitle = title ? `${title} | Mali Edu` : siteTitle;
    const displayDesc = description || 'Mali Edu - Trở thành phiên bản hoàn hảo nhất của chính mình.';
    const displayImage = image || 'https://res.cloudinary.com/dstukyjzd/image/upload/v1768455801/Logo_Mali_Ngang_M%C3%80U_CAM_u5lrng.png';
    const displayUrl = url ? `https://maliedu.vn${url}` : 'https://maliedu.vn';

    return (
        <Helmet>
            {/* Standard Metadata */}
            <title>{displayTitle}</title>
            <meta name="description" content={displayDesc} />
            <link rel="canonical" href={displayUrl} />

            {/* Open Graph / Facebook */}
            <meta property="og:type" content={type} />
            <meta property="og:url" content={displayUrl} />
            <meta property="og:title" content={displayTitle} />
            <meta property="og:description" content={displayDesc} />
            <meta property="og:image" content={displayImage} />

            {/* Twitter */}
            <meta property="twitter:card" content="summary_large_image" />
            <meta property="twitter:url" content={displayUrl} />
            <meta property="twitter:title" content={displayTitle} />
            <meta property="twitter:description" content={displayDesc} />
            <meta property="twitter:image" content={displayImage} />
        </Helmet>
    );
};

export default SEO;
