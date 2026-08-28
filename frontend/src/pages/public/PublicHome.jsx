// pages/public/PublicHome.jsx
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Users, BookOpen, Award, Calendar, ChevronLeft, ChevronRight, Image } from "lucide-react";
import { useGetPublicSettingsQuery, useGetStatisticsQuery } from "@/features/apis/publicApi";
import AnnouncementList from "./AnnouncementList";
import CommitteeWithQuotes from "@/components/admin/directory/components/CommitteeWithQuotes";
import HeroImage from "../../assets/school-hero.jpeg";
import { useGetPublicHeroSlidersQuery } from "@/features/apis/heroSliderApi";
import { backend_url } from "@/utils/server";

// Hero Slider Component
const HeroSlider = ({ slides }) => {
    const [currentSlide, setCurrentSlide] = useState(0);
    const [isTransitioning, setIsTransitioning] = useState(false);

    useEffect(() => {
        if (slides.length <= 1) return;

        const interval = setInterval(() => {
            nextSlide();
        }, 5000);

        return () => clearInterval(interval);
    }, [slides.length, currentSlide]);

    const nextSlide = () => {
        if (isTransitioning) return;
        setIsTransitioning(true);
        setCurrentSlide((prev) => (prev + 1) % slides.length);
        setTimeout(() => setIsTransitioning(false), 500);
    };

    const prevSlide = () => {
        if (isTransitioning) return;
        setIsTransitioning(true);
        setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
        setTimeout(() => setIsTransitioning(false), 500);
    };

    const goToSlide = (index) => {
        if (isTransitioning || index === currentSlide) return;
        setIsTransitioning(true);
        setCurrentSlide(index);
        setTimeout(() => setIsTransitioning(false), 500);
    };

    if (slides.length === 0) {
        // Fallback to single image
        return (
            <div
                className="relative text-white min-h-[550px] flex items-end"
                style={{
                    backgroundImage: `linear-gradient(to top, rgba(0,0,0,0.4), rgba(0,0,0,0.15), rgba(0,0,0,0)), url(${HeroImage})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    backgroundRepeat: "no-repeat",
                }}
            >
                <HeroContent />
            </div>
        );
    }

    return (
        <div className="relative text-white min-h-[550px] overflow-hidden group">
            {/* Slides */}
            <div
                className="flex transition-transform duration-500 ease-in-out h-full"
                style={{ transform: `translateX(-${currentSlide * 100}%)` }}
            >
                {slides.map((slide, index) => (
                    <div
                        key={slide._id}
                        className="w-full flex-shrink-0 min-h-[550px] flex items-end"
                        style={{
                            backgroundImage: `linear-gradient(to top, rgba(0,0,0,0.5), rgba(0,0,0,0.15), rgba(0,0,0,0)), url(${backend_url}${slide.imageUrl})`,
                            backgroundSize: "cover",
                            backgroundPosition: "center",
                            backgroundRepeat: "no-repeat",
                        }}
                    >
                        <div className="w-full">
                            <div className="container mx-auto px-4 py-10 text-center">
                                {slide.title && (
                                    <h1 className="text-5xl md:text-6xl font-bold mb-4 drop-shadow-[0_4px_8px_rgba(0,0,0,0.7)]">
                                        {slide.title}
                                    </h1>
                                )}
                                {slide.subtitle && (
                                    <p className="text-xl md:text-2xl mb-4 opacity-95 drop-shadow-[0_3px_6px_rgba(0,0,0,0.6)]">
                                        {slide.subtitle}
                                    </p>
                                )}
                                {/* <p className="text-lg mb-8 max-w-2xl mx-auto drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
                                    We provide quality education in a nurturing environment that fosters academic excellence and personal growth.
                                </p> */}
                                <div className="flex gap-4 justify-center flex-wrap">
                                    <Button size="lg" variant="secondary" asChild>
                                        <Link to={slide.link || "/about"}>
                                            {slide.linkText || "Learn More"}
                                            <ArrowRight className="w-4 h-4 ml-2" />
                                        </Link>
                                    </Button>
                                    <Button
                                        size="lg"
                                        variant="outline"
                                        className="bg-gray-300/80 text-gray-700 border-white hover:bg-gray-300"
                                        asChild
                                    >
                                        <Link to="/contact">Contact Us</Link>
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Navigation Arrows */}
            {slides.length > 1 && (
                <>
                    <button
                        onClick={prevSlide}
                        className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white p-2 rounded-full transition-all opacity-0 group-hover:opacity-100"
                        aria-label="Previous slide"
                    >
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                    <button
                        onClick={nextSlide}
                        className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white p-2 rounded-full transition-all opacity-0 group-hover:opacity-100"
                        aria-label="Next slide"
                    >
                        <ChevronRight className="w-6 h-6" />
                    </button>
                </>
            )}

            {/* Dots Indicator */}
            {slides.length > 1 && (
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
                    {slides.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => goToSlide(index)}
                            className={`w-3 h-3 rounded-full transition-all ${index === currentSlide
                                ? "bg-white w-6"
                                : "bg-white/50 hover:bg-white/80"
                                }`}
                            aria-label={`Go to slide ${index + 1}`}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

// Hero Content Component (for fallback)
const HeroContent = () => {
    const { data: settingsData } = useGetPublicSettingsQuery();
    const settings = settingsData?.settings || {};

    return (
        <div className="w-full">
            <div className="container mx-auto px-4 py-10 text-center">
                <p className="text-xl mb-4 opacity-95 drop-shadow-[0_3px_6px_rgba(0,0,0,0.6)]">
                    {settings.SCHOOL_TAGLINE || "Excellence in Education Since 2000"}
                </p>
                <p className="text-lg mb-8 max-w-2xl mx-auto drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
                    We provide quality education in a nurturing environment that fosters academic excellence and personal growth.
                </p>
                <div className="flex gap-4 justify-center flex-wrap">
                    <Button size="lg" variant="secondary" asChild>
                        <Link to="/about">
                            Learn More
                            <ArrowRight className="w-4 h-4 ml-2" />
                        </Link>
                    </Button>
                    <Button
                        size="lg"
                        variant="outline"
                        className="bg-gray-300/80 text-gray-700 border-white hover:bg-gray-300"
                        asChild
                    >
                        <Link to="/contact">Contact Us</Link>
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default function PublicHome() {
    const { data: settingsData } = useGetPublicSettingsQuery();
    const { data: statisticsData } = useGetStatisticsQuery();
    const { data: heroSlidersData, isLoading: isHeroLoading } = useGetPublicHeroSlidersQuery();

    const settings = settingsData?.settings || {};
    const statistics = statisticsData?.statistics || {};
    const slides = heroSlidersData?.data || [];

    return (
        <div className="min-h-screen">
            {/* Hero Section with Slider */}
            <HeroSlider slides={slides} />

            {/* Rest of the page remains the same */}
            <section className="py-16 bg-white">
                <div className="container mx-auto px-4">
                    <div className="flex flex-col lg:flex-row gap-8">
                        <div className="lg:w-2/3">
                            <div className="text-center mb-12">
                                <h2 className="text-3xl font-bold text-gray-900 mb-4">Latest Notices</h2>
                                <p className="text-xl text-gray-600">
                                    Stay updated with the latest news from our school
                                </p>
                            </div>
                            <AnnouncementList limit={5} showViewAll={true} />
                        </div>
                        <div className="lg:w-1/3">
                            <div className="sticky top-24">
                                <CommitteeWithQuotes />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Statistics Section */}
            <section className="py-16 bg-gray-50">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold text-gray-900 mb-4">
                            Our School at a Glance
                        </h2>
                        <p className="text-xl text-gray-600">
                            Proudly serving our community with excellence
                        </p>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                        <div className="text-center">
                            <div className="text-4xl font-bold text-blue-600 mb-2">
                                {statistics.totalStudents || "1,250"}
                            </div>
                            <div className="text-gray-600">Students</div>
                        </div>
                        <div className="text-center">
                            <div className="text-4xl font-bold text-green-600 mb-2">
                                {statistics.totalTeachers || "85"}
                            </div>
                            <div className="text-gray-600">Teachers</div>
                        </div>
                        <div className="text-center">
                            <div className="text-4xl font-bold text-purple-600 mb-2">
                                {statistics.totalClasses || "45"}
                            </div>
                            <div className="text-gray-600">Classes</div>
                        </div>
                        <div className="text-center">
                            <div className="text-4xl font-bold text-orange-600 mb-2">
                                {settings.SCHOOL_ESTABLISHED || "2000"}
                            </div>
                            <div className="text-gray-600">Established</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-16">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold text-gray-900 mb-4">
                            Why Choose Our School
                        </h2>
                        <p className="text-xl text-gray-600">
                            We offer the best educational experience for your child
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="text-center p-6">
                            <Users className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                            <h3 className="text-xl font-semibold mb-3">Qualified Teachers</h3>
                            <p className="text-gray-600">
                                Our teachers are highly qualified and experienced professionals dedicated to student success.
                            </p>
                        </div>

                        <div className="text-center p-6">
                            <BookOpen className="w-12 h-12 text-green-600 mx-auto mb-4" />
                            <h3 className="text-xl font-semibold mb-3">Modern Curriculum</h3>
                            <p className="text-gray-600">
                                We offer a comprehensive curriculum that prepares students for future challenges and opportunities.
                            </p>
                        </div>

                        <div className="text-center p-6">
                            <Award className="w-12 h-12 text-purple-600 mx-auto mb-4" />
                            <h3 className="text-xl font-semibold mb-3">Proven Excellence</h3>
                            <p className="text-gray-600">
                                Our students consistently achieve outstanding results in academics and extracurricular activities.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-16 bg-blue-600 text-white">
                <div className="container mx-auto px-4 text-center">
                    <h2 className="text-3xl font-bold mb-4">
                        Ready to Join Our Community?
                    </h2>
                    <p className="text-xl mb-8 max-w-2xl mx-auto">
                        Contact us today to learn more about admissions and schedule a campus tour.
                    </p>
                    <Button size="lg" variant="secondary" asChild>
                        <Link to="/contact">
                            Get in Touch
                            <ArrowRight className="w-4 h-4 ml-2" />
                        </Link>
                    </Button>
                </div>
            </section>
        </div>
    );
}

// // pages/public/PublicHome.jsx
// import React from "react";
// import { Link } from "react-router-dom";
// import { Button } from "@/components/ui/button";
// import { ArrowRight, Users, BookOpen, Award, Calendar } from "lucide-react";
// import { useGetPublicSettingsQuery, useGetStatisticsQuery } from "@/features/apis/publicApi";
// import AnnouncementList from "./AnnouncementList";
// import HeroImage from "../../assets/school-hero.jpeg"
// import CommitteeWithQuotes from "@/components/admin/directory/components/CommitteeWithQuotes";

// export default function PublicHome() {
//   const { data: settingsData } = useGetPublicSettingsQuery();
//   const { data: statisticsData } = useGetStatisticsQuery();

//   const settings = settingsData?.settings || {};
//   const statistics = statisticsData?.statistics || {};

//   return (
//     <div className="min-h-screen">
//       {/* Hero Section */}

//       <section
//         className="relative text-white min-h-[550px] flex items-end"
//         style={{
//           backgroundImage: `linear-gradient(
//         to top,
//         rgba(0, 0, 0, 0.4),
//         rgba(0, 0, 0, 0.15),
//         rgba(0, 0, 0, 0)
//       ), url(${HeroImage})`,
//           backgroundSize: "cover",
//           backgroundPosition: "center",
//           backgroundRepeat: "no-repeat",
//         }}
//       >
//         <div className="w-full">
//           <div className="container mx-auto px-4 py-10 text-center">

//             <p className="text-xl mb-4 opacity-95 drop-shadow-[0_3px_6px_rgba(0,0,0,0.6)]">
//               {settings.SCHOOL_TAGLINE || "Excellence in Education Since 2000"}
//             </p>

//             <p className="text-lg mb-8 max-w-2xl mx-auto drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
//               We provide quality education in a nurturing environment that fosters academic excellence and personal growth.
//             </p>

//             <div className="flex gap-4 justify-center flex-wrap">
//               <Button size="lg" variant="secondary" asChild>
//                 <Link to="/about">
//                   Learn More
//                   <ArrowRight className="w-4 h-4 ml-2" />
//                 </Link>
//               </Button>

//               <Button
//                 size="lg"
//                 variant="outline"
//                 className="bg-gray-300 text-gray-700 border-white"
//                 asChild
//               >
//                 <Link to="/contact">Contact Us</Link>
//               </Button>
//             </div>
//           </div>
//         </div>
//       </section>

//       <section className="py-16 bg-white">
//         <div className="container mx-auto px-4">
//           <div className="flex flex-col lg:flex-row gap-8">
//             {/* Announcements - Takes 2/3 width on large screens */}
//             <div className="lg:w-2/3">
//               <div className="text-center mb-12">
//                 <h2 className="text-3xl font-bold text-gray-900 mb-4">Latest Notices</h2>
//                 <p className="text-xl text-gray-600">
//                   Stay updated with the latest news from our school
//                 </p>
//               </div>
//               <AnnouncementList limit={5} showViewAll={true} />
//             </div>

//             {/* Committee with Quotes - Takes 1/3 width on large screens */}
//             <div className="lg:w-1/3">
//               <div className="sticky top-24">
//                 <CommitteeWithQuotes />
//               </div>
//             </div>
//           </div>
//         </div>
//       </section>

//       {/* Statistics Section */}
//       <section className="py-16 bg-gray-50">
//         <div className="container mx-auto px-4">
//           <div className="text-center mb-12">
//             <h2 className="text-3xl font-bold text-gray-900 mb-4">
//               Our School at a Glance
//             </h2>
//             <p className="text-xl text-gray-600">
//               Proudly serving our community with excellence
//             </p>
//           </div>

//           <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
//             <div className="text-center">
//               <div className="text-4xl font-bold text-blue-600 mb-2">
//                 {statistics.totalStudents || "1,250"}
//               </div>
//               <div className="text-gray-600">Students</div>
//             </div>
//             <div className="text-center">
//               <div className="text-4xl font-bold text-green-600 mb-2">
//                 {statistics.totalTeachers || "85"}
//               </div>
//               <div className="text-gray-600">Teachers</div>
//             </div>
//             <div className="text-center">
//               <div className="text-4xl font-bold text-purple-600 mb-2">
//                 {statistics.totalClasses || "45"}
//               </div>
//               <div className="text-gray-600">Classes</div>
//             </div>
//             <div className="text-center">
//               <div className="text-4xl font-bold text-orange-600 mb-2">
//                 {settings.SCHOOL_ESTABLISHED || "2000"}
//               </div>
//               <div className="text-gray-600">Established</div>
//             </div>
//           </div>
//         </div>
//       </section>

//       {/* Features Section */}
//       <section className="py-16">
//         <div className="container mx-auto px-4">
//           <div className="text-center mb-12">
//             <h2 className="text-3xl font-bold text-gray-900 mb-4">
//               Why Choose Our School
//             </h2>
//             <p className="text-xl text-gray-600">
//               We offer the best educational experience for your child
//             </p>
//           </div>

//           <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
//             <div className="text-center p-6">
//               <Users className="w-12 h-12 text-blue-600 mx-auto mb-4" />
//               <h3 className="text-xl font-semibold mb-3">Qualified Teachers</h3>
//               <p className="text-gray-600">
//                 Our teachers are highly qualified and experienced professionals dedicated to student success.
//               </p>
//             </div>

//             <div className="text-center p-6">
//               <BookOpen className="w-12 h-12 text-green-600 mx-auto mb-4" />
//               <h3 className="text-xl font-semibold mb-3">Modern Curriculum</h3>
//               <p className="text-gray-600">
//                 We offer a comprehensive curriculum that prepares students for future challenges and opportunities.
//               </p>
//             </div>

//             <div className="text-center p-6">
//               <Award className="w-12 h-12 text-purple-600 mx-auto mb-4" />
//               <h3 className="text-xl font-semibold mb-3">Proven Excellence</h3>
//               <p className="text-gray-600">
//                 Our students consistently achieve outstanding results in academics and extracurricular activities.
//               </p>
//             </div>
//           </div>
//         </div>
//       </section>

//       {/* CTA Section */}
//       <section className="py-16 bg-blue-600 text-white">
//         <div className="container mx-auto px-4 text-center">
//           <h2 className="text-3xl font-bold mb-4">
//             Ready to Join Our Community?
//           </h2>
//           <p className="text-xl mb-8 max-w-2xl mx-auto">
//             Contact us today to learn more about admissions and schedule a campus tour.
//           </p>
//           <Button size="lg" variant="secondary" asChild>
//             <Link to="/contact">
//               Get in Touch
//               <ArrowRight className="w-4 h-4 ml-2" />
//             </Link>
//           </Button>
//         </div>
//       </section>
//     </div>
//   );
// }
