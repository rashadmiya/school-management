// pages/public/DynamicPage.jsx
import React from "react";
import { useParams } from "react-router-dom";
import { Loader, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useGetPageBySlugQuery, useGetPublicSettingsQuery, useGetStatisticsQuery } from "@/features/apis/publicApi";

export default function DynamicPage() {
    const { slug = "home" } = useParams();
    const { data: pageData, isLoading: pageLoading, error } = useGetPageBySlugQuery(slug);
    const { data: settingsData } = useGetPublicSettingsQuery();
    const { data: statisticsData } = useGetStatisticsQuery();

    const page = pageData?.page;
    const settings = settingsData?.settings || {};
    const statistics = statisticsData?.statistics || {};

    if (pageLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader className="w-8 h-8 animate-spin" />
            </div>
        );
    }

    if (error || !page) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">Page Not Found</h1>
                    <p className="text-gray-600 mb-8">The page you're looking for doesn't exist.</p>
                    <Button asChild>
                        <Link to="/">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Home
                        </Link>
                    </Button>
                </div>
            </div>
        );
    }

    const renderSection = (section, index) => {
        switch (section.type) {
            case 'hero':
                return (
                    <section key={index} className="relative bg-gradient-to-r from-blue-600 to-purple-700 text-white py-20">
                        <div className="container mx-auto px-4 text-center">
                            <h1 className="text-5xl font-bold mb-4">{section.title || page.title}</h1>
                            {section.subtitle && (
                                <p className="text-xl mb-8 opacity-90">{section.subtitle}</p>
                            )}
                            {section.content && (
                                <p className="text-lg mb-8 max-w-2xl mx-auto">{section.content}</p>
                            )}
                            <div className="flex gap-4 justify-center">
                                <Button size="lg" variant="secondary" asChild>
                                    <Link to="/contact">Contact Us</Link>
                                </Button>
                                <Button size="lg" variant="outline" className="bg-gray-300 text-gray-700 border-white" asChild>
                                    <Link to="/about">Learn More</Link>
                                </Button>
                            </div>
                        </div>
                    </section>
                );

            case 'stats':
                return (
                    <section key={index} className="py-16 bg-gray-50">
                        <div className="container mx-auto px-4">
                            <div className="text-center mb-12">
                                <h2 className="text-3xl font-bold text-gray-900 mb-4">
                                    {section.title || "Our School Statistics"}
                                </h2>
                                {section.subtitle && (
                                    <p className="text-xl text-gray-600">{section.subtitle}</p>
                                )}
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                                <div className="text-center">
                                    <div className="text-4xl font-bold text-blue-600 mb-2">
                                        {statistics.totalStudents || section.data?.students || "1,250"}
                                    </div>
                                    <div className="text-gray-600">Students</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-4xl font-bold text-green-600 mb-2">
                                        {statistics.totalTeachers || section.data?.teachers || "85"}
                                    </div>
                                    <div className="text-gray-600">Teachers</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-4xl font-bold text-purple-600 mb-2">
                                        {statistics.totalClasses || section.data?.classes || "45"}
                                    </div>
                                    <div className="text-gray-600">Classes</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-4xl font-bold text-orange-600 mb-2">
                                        {section.data?.successRate || "98"}%
                                    </div>
                                    <div className="text-gray-600">Success Rate</div>
                                </div>
                            </div>
                        </div>
                    </section>
                );

            case 'features':
                return (
                    <section key={index} className="py-16">
                        <div className="container mx-auto px-4">
                            <div className="text-center mb-12">
                                <h2 className="text-3xl font-bold text-gray-900 mb-4">
                                    {section.title || "Why Choose Us"}
                                </h2>
                                {section.subtitle && (
                                    <p className="text-xl text-gray-600">{section.subtitle}</p>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                {(section.data || []).map((feature, featureIndex) => (
                                    <div key={featureIndex} className="text-center p-6">
                                        <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                                        <p className="text-gray-600">{feature.description}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>
                );

            case 'content':
                return (
                    <section key={index} className="py-16">
                        <div className="container mx-auto px-4 max-w-4xl">
                            {section.title && (
                                <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">
                                    {section.title}
                                </h2>
                            )}
                            <div
                                className="prose prose-lg max-w-none"
                                dangerouslySetInnerHTML={{
                                    __html: section.content || page.content
                                }}
                            />
                        </div>
                    </section>
                );

            default:
                return (
                    <section key={index} className="py-16">
                        <div className="container mx-auto px-4">
                            <h2>{section.title}</h2>
                            <p>{section.content}</p>
                        </div>
                    </section>
                );
        }
    };

    return (
        <div className="min-h-screen">
            {/* Render sections if they exist, otherwise render basic content */}
            {/* {page.sections && page.sections.length > 0 ? (
        page.sections
          .sort((a, b) => (a.order || 0) - (b.order || 0))
          .map(renderSection)
      ) :  */}
            {page.sections && page.sections.length > 0 ? (
                [...page.sections] // shallow copy first (safe)
                    .toSorted((a, b) => (a.order ?? 0) - (b.order ?? 0))
                    .map(renderSection)
            ) :
                (
                    <section className="py-16">
                        <div className="container mx-auto px-4 max-w-4xl">
                            <h1 className="text-4xl font-bold text-gray-900 mb-6">{page.title}</h1>
                            <div
                                className="prose prose-lg max-w-none"
                                dangerouslySetInnerHTML={{ __html: page.content }}
                            />
                        </div>
                    </section>
                )}
        </div>
    );
}