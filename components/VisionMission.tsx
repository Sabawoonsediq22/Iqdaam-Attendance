import { Eye, Compass } from 'lucide-react';

export default function VisionMission() {
  return (
    <section className="py-20 bg-linear-to-br from-slate-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-slate-800 mb-4">
            Our Vision & Mission
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Guided by our core values and commitment to excellence
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="group bg-white rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border-2 border-transparent hover:border-blue-200">
            <div className="bg-linear-to-br from-blue-500 to-sky-500 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Eye className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-slate-800 mb-4">Our Vision</h3>
            <p className="text-slate-600 leading-relaxed text-lg">
              To be a leading educational institution that empowers every student to achieve academic
              excellence, personal growth, and professional success. We envision a future where our
              students become confident, skilled individuals who contribute meaningfully to society
              and excel in their chosen fields.
            </p>
            <div className="mt-6 pt-6 border-t border-slate-200">
              <p className="text-blue-600 font-semibold">Building Tomorrow&apos;s Leaders</p>
            </div>
          </div>

          <div className="group bg-white rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border-2 border-transparent hover:border-amber-200">
            <div className="bg-linear-to-br from-amber-500 to-orange-500 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Compass className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-slate-800 mb-4">Our Mission</h3>
            <p className="text-slate-600 leading-relaxed text-lg">
              To provide high-quality, accessible education through innovative teaching methods,
              experienced educators, and a student-centered approach. We are committed to fostering
              critical thinking, practical skills, and lifelong learning habits that prepare students
              for real-world challenges and opportunities.
            </p>
            <div className="mt-6 pt-6 border-t border-slate-200">
              <p className="text-amber-600 font-semibold">Excellence in Education</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
