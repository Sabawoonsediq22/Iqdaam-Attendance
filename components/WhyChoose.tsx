import { GraduationCap, Users, BookOpen, Heart, TrendingUp, Shield } from 'lucide-react';

export default function WhyChoose() {
  const reasons = [
    {
      icon: GraduationCap,
      title: 'Expert Faculty',
      description: 'Learn from highly qualified and experienced teachers who are passionate about education and dedicated to your success.',
      color: 'from-blue-500 to-sky-500',
    },
    {
      icon: BookOpen,
      title: 'Quality Education',
      description: 'Access world-class curriculum and learning materials designed to meet international standards and industry requirements.',
      color: 'from-emerald-500 to-teal-500',
    },
    {
      icon: Users,
      title: 'Student-First Approach',
      description: 'Experience personalized attention with small class sizes, ensuring every student receives the support they need.',
      color: 'from-amber-500 to-orange-500',
    },
    {
      icon: TrendingUp,
      title: 'Modern Curriculum',
      description: 'Stay ahead with up-to-date course content that combines traditional wisdom with contemporary teaching methods.',
      color: 'from-rose-500 to-pink-500',
    },
    {
      icon: Heart,
      title: 'Friendly Environment',
      description: 'Study in a welcoming, supportive atmosphere that encourages collaboration, creativity, and personal growth.',
      color: 'from-cyan-500 to-blue-500',
    },
    {
      icon: Shield,
      title: 'Proven Track Record',
      description: 'Join thousands of successful alumni who have achieved their academic and professional goals with us.',
      color: 'from-slate-600 to-gray-700',
    },
  ];

  return (
    <section className="py-20 bg-linear-to-br from-slate-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-block bg-amber-100 text-amber-600 px-4 py-2 rounded-full text-sm font-semibold mb-6">
            Why Choose Us
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-slate-800 mb-4">
            What Makes Us Different
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Discover the advantages that set Iqdaam Educational Center apart from the rest
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {reasons.map((reason, index) => (
            <div
              key={index}
              className="group bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border border-slate-100"
            >
              <div className={`bg-linear-to-br ${reason.color} w-16 h-16 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300`}>
                <reason.icon className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-slate-800 mb-4">{reason.title}</h3>
              <p className="text-slate-600 leading-relaxed">{reason.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
