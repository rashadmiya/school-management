// pages/public/PublicHome.jsx
import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Users, BookOpen, Award, Calendar } from "lucide-react";
import { useGetPublicSettingsQuery, useGetStatisticsQuery } from "@/features/apis/publicApi";
import AnnouncementList from "./AnnouncementList";
import HeroImage from "../../assets/school-hero.jpeg"
import CommitteeWithQuotes from "@/components/admin/directory/components/CommitteeWithQuotes";

export default function PublicHome() {
  const { data: settingsData } = useGetPublicSettingsQuery();
  const { data: statisticsData } = useGetStatisticsQuery();

  const settings = settingsData?.settings || {};
  const statistics = statisticsData?.statistics || {};

  return (
    <div className="min-h-screen">
      {/* Hero Section */}

      <section
        className="relative text-white min-h-[550px] flex items-end"
        style={{
          backgroundImage: `linear-gradient(
        to top,
        rgba(0, 0, 0, 0.4),
        rgba(0, 0, 0, 0.15),
        rgba(0, 0, 0, 0)
      ), url(${HeroImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >
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
                className="bg-gray-300 text-gray-700 border-white"
                asChild
              >
                <Link to="/contact">Contact Us</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>



      {/* <section className="relative bg-gradient-to-r from-blue-600 to-purple-700 text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold mb-4">
            {settings.SCHOOL_NAME || "Welcome to Our School"}
          </h1>
          <p className="text-xl mb-8 opacity-90">
            {settings.SCHOOL_TAGLINE || "Excellence in Education Since 2000"}
          </p>
          <p className="text-lg mb-8 max-w-2xl mx-auto">
            We provide quality education in a nurturing environment that fosters academic excellence and personal growth.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Button size="lg" variant="secondary" asChild>
              <Link to="/about">
                Learn More
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="bg-gray-300 text-gray-700 border-white" asChild>
              <Link to="/contact">Contact Us</Link>
            </Button>
          </div>
        </div>
      </section> */}

      {/* <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Latest Notices</h2>
            <p className="text-xl text-gray-600">
              Stay updated with the latest news from our school
            </p>
          </div>
          <AnnouncementList limit={5} showViewAll={true} />
        </div>
      </section> */}

      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Announcements - Takes 2/3 width on large screens */}
            <div className="lg:w-2/3">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">Latest Notices</h2>
                <p className="text-xl text-gray-600">
                  Stay updated with the latest news from our school
                </p>
              </div>
              <AnnouncementList limit={5} showViewAll={true} />
            </div>

            {/* Committee with Quotes - Takes 1/3 width on large screens */}
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



// const PublicHome = () => {
//   return (
//     <div>
//       {/* Hero Section */}
//       <section className="bg-blue-600 text-white py-20">
//         <div className="container mx-auto px-4 text-center">
//           <h1 className="text-4xl font-bold mb-4">Welcome to Our School</h1>
//           <p className="text-xl mb-8">Empowering students for a bright future</p>
//           <button className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-blue-100">
//             Learn More
//           </button>
//         </div>
//       </section>

//       {/* Noticeboard Section */}
//       <section className="py-16">
//         <div className="container mx-auto px-4">
//           <h2 className="text-3xl font-bold text-center mb-12">Noticeboard</h2>
//           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
//             {/* Example notice - later we'll map from API */}
//             <div className="bg-white rounded-lg shadow-md p-6">
//               <h3 className="text-xl font-bold mb-2">School Holiday</h3>
//               <p className="text-gray-600 mb-4">The school will be closed from ... to ... for the summer break.</p>
//               <p className="text-sm text-gray-500">Posted on: 2023-06-01</p>
//             </div>
//             <div className="bg-white rounded-lg shadow-md p-6">
//               <h3 className="text-xl font-bold mb-2">Sports Day</h3>
//               <p className="text-gray-600 mb-4">Annual sports day will be held on ...</p>
//               <p className="text-sm text-gray-500">Posted on: 2023-05-25</p>
//             </div>
//             <div className="bg-white rounded-lg shadow-md p-6">
//               <h3 className="text-xl font-bold mb-2">Exam Schedule</h3>
//               <p className="text-gray-600 mb-4">The final exam schedule for the current academic year is out.</p>
//               <p className="text-sm text-gray-500">Posted on: 2023-05-20</p>
//             </div>
//           </div>
//         </div>
//       </section>

//       {/* Upcoming Events */}
//       <section className="bg-gray-100 py-16">
//         <div className="container mx-auto px-4">
//           <h2 className="text-3xl font-bold text-center mb-12">Upcoming Events</h2>
//           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
//             {/* Example event - later we'll map from API */}
//             <div className="bg-white rounded-lg shadow-md p-6">
//               <h3 className="text-xl font-bold mb-2">Parent-Teacher Meeting</h3>
//               <p className="text-gray-600 mb-2">Date: 2023-07-15</p>
//               <p className="text-gray-600">Time: 10:00 AM - 2:00 PM</p>
//             </div>
//             <div className="bg-white rounded-lg shadow-md p-6">
//               <h3 className="text-xl font-bold mb-2">Science Fair</h3>
//               <p className="text-gray-600 mb-2">Date: 2023-07-20</p>
//               <p className="text-gray-600">Time: 9:00 AM - 4:00 PM</p>
//             </div>
//             <div className="bg-white rounded-lg shadow-md p-6">
//               <h3 className="text-xl font-bold mb-2">Annual Day</h3>
//               <p className="text-gray-600 mb-2">Date: 2023-08-10</p>
//               <p className="text-gray-600">Time: 5:00 PM - 8:00 PM</p>
//             </div>
//           </div>
//         </div>
//       </section>
//     </div>
//   );
// };

// export default PublicHome;