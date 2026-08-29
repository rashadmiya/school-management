// components/admin/settingsConstants.js
import { Globe, Phone, Share, Search } from "lucide-react";

export const SETTING_CATEGORIES = [
    { id: 'general', name: 'General', icon: Globe, description: 'Basic school information' },
    // { id: 'contact', name: 'Contact', icon: Phone, description: 'Contact information' },
    { id: 'social', name: 'Social Media', icon: Share, description: 'Social media links' },
    // { id: 'appearance', name: 'Appearance', icon: Globe, description: 'Website appearance' },
    // { id: 'seo', name: 'SEO', icon: Search, description: 'Search engine optimization' },
    { id: 'academic', name: 'Academic', icon: Globe, description: 'Academic settings' },
];

export const SETTING_TYPES = [
    { value: 'string', label: 'Text', example: 'School Name', hint: 'Single line text input' },
    { value: 'number', label: 'Number', example: '2024', hint: 'Numeric values only' },
    { value: 'boolean', label: 'Toggle (On/Off)', example: 'true/false', hint: 'Enable or disable features' },
    { value: 'array', label: 'Array (Comma-separated)', example: 'value1, value2, value3', hint: 'Multiple values separated by commas' },
    // { value: 'object', label: 'Object (JSON)', example: '{"key": "value"}', hint: 'Structured data in JSON format' },
    // { value: 'file', label: 'File', example: 'image.png, document.pdf', hint: 'File uploads (images, documents)' },
];

export const SETTING_EXAMPLES = {
    general: {
        SCHOOL_NAME: { value: 'Springfield Elementary School', description: 'The full name of your school' },
        SCHOOL_SHORT_NAME: { value: 'SES', description: 'Abbreviated name for logos and short displays' },
        SCHOOL_ADDRESS: { value: '123 Education St, Springfield, IL 62701', description: 'Physical address of the school' },
        SCHOOL_PHONE: { value: '+1 (555) 123-4567', description: 'Main contact phone number' },
        SCHOOL_EMAIL: { value: 'info@springfield.edu', description: 'General inquiry email address' },
        SCHOOL_YEAR: { value: '2024-2025', description: 'Current academic year' },
    },
    contact: {
        ADMISSIONS_EMAIL: { value: 'admissions@springfield.edu', description: 'Admissions department email' },
        ADMISSIONS_PHONE: { value: '+1 (555) 123-4568', description: 'Admissions phone number' },
        SUPPORT_EMAIL: { value: 'support@springfield.edu', description: 'Technical support email' },
        SUPPORT_PHONE: { value: '+1 (555) 123-4569', description: 'Technical support phone' },
        EMERGENCY_CONTACT: { value: '+1 (555) 123-4570', description: 'Emergency contact number' },
        OFFICE_HOURS: { value: 'Mon-Fri 8:00 AM - 5:00 PM', description: 'School office hours' },
    },
    social: {
        FACEBOOK_URL: { value: 'https://facebook.com/springfieldschool', description: 'Facebook page URL' },
        TWITTER_URL: { value: 'https://twitter.com/springfield_sch', description: 'Twitter/X profile URL' },
        INSTAGRAM_URL: { value: 'https://instagram.com/springfield.school', description: 'Instagram profile URL' },
        YOUTUBE_URL: { value: 'https://youtube.com/c/springfieldschool', description: 'YouTube channel URL' },
        LINKEDIN_URL: { value: 'https://linkedin.com/school/springfield-school', description: 'LinkedIn company page URL' },
    },
    appearance: {
        PRIMARY_COLOR: { value: '#4F46E5', description: 'Primary brand color (hex code)' },
        SECONDARY_COLOR: { value: '#7C3AED', description: 'Secondary brand color (hex code)' },
        HEADER_LAYOUT: { value: 'centered', description: 'Header layout style (centered, left, right)' },
        SITE_TAGLINE: { value: 'Excellence in Education', description: 'Tagline displayed below school name' },
        FOOTER_TEXT: { value: '© 2024 Springfield Elementary School. All rights reserved.', description: 'Copyright text in footer' },
    },
    seo: {
        SITE_TITLE: { value: 'Springfield Elementary School - Excellence in Education', description: 'Title tag for SEO' },
        META_DESCRIPTION: { value: 'Springfield Elementary School offers quality education from kindergarten through 8th grade. Enroll now!', description: 'Meta description for search results' },
        META_KEYWORDS: { value: 'elementary school, springfield, education, k-8, private school', description: 'Comma-separated keywords for SEO' },
        OG_IMAGE: { value: 'https://springfield.edu/og-image.jpg', description: 'Open Graph image URL for social sharing' },
        OG_TITLE: { value: 'Springfield Elementary School', description: 'Open Graph title for social sharing' },
    },
    academic: {
        TERM_START: { value: '2024-09-01', description: 'Start date of the current term' },
        TERM_END: { value: '2025-06-15', description: 'End date of the current term' },
        GRADING_SCALE: { value: 'A=90-100, B=80-89, C=70-79, D=60-69, F=0-59', description: 'Grading scale configuration' },
        CLASS_HOURS_PER_DAY: { value: '6', description: 'Number of class hours per day' },
        MAX_STUDENTS_PER_CLASS: { value: '30', description: 'Maximum students allowed per class' },
        CURRICULUM_DESCRIPTION: { value: 'Our curriculum follows state standards with emphasis on STEM, arts, and physical education.', description: 'Brief curriculum description' },
    }
};