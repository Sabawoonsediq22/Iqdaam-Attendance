import {
  Languages,
  BookText,
  MessageCircle,
  LibraryBig,
  FileText,
  Laptop,
  Calculator,
  Briefcase,
  ArrowRight
} from 'lucide-react';

export default function Programs() {
  const programs = [
    {
      icon: Languages,
      title: 'General English',
      description: 'Comprehensive English language program covering reading, writing, listening, and speaking skills for all proficiency levels.',
      color: 'from-blue-500 to-sky-500',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
    },
    {
      icon: BookText,
      title: 'Special Grammar Classes',
      description: 'Master English grammar with focused lessons on sentence structure, tenses, and advanced grammar concepts.',
      color: 'from-emerald-500 to-teal-500',
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-200',
    },
    {
      icon: MessageCircle,
      title: 'Special Speaking Classes',
      description: 'Build confidence and fluency with interactive speaking sessions, pronunciation practice, and conversation techniques.',
      color: 'from-amber-500 to-orange-500',
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-200',
    },
    {
      icon: LibraryBig,
      title: 'Special Vocabulary Classes',
      description: 'Expand your word bank with systematic vocabulary building, idioms, and contextual usage in real-life scenarios.',
      color: 'from-rose-500 to-pink-500',
      bgColor: 'bg-rose-50',
      borderColor: 'border-rose-200',
    },
    {
      icon: FileText,
      title: 'Pashto Dictation',
      description: 'Enhance your Pashto language skills with focused dictation exercises and writing practice.',
      color: 'from-violet-500 to-purple-500',
      bgColor: 'bg-violet-50',
      borderColor: 'border-violet-200',
    },
    {
      icon: Laptop,
      title: 'Computer Programs',
      description: 'Learn essential computer skills including MS Office, typing, internet usage, and digital literacy.',
      color: 'from-cyan-500 to-blue-500',
      bgColor: 'bg-cyan-50',
      borderColor: 'border-cyan-200',
    },
    {
      icon: Calculator,
      title: 'Mathematics',
      description: 'Strengthen mathematical concepts from basic arithmetic to advanced problem-solving techniques.',
      color: 'from-slate-500 to-gray-600',
      bgColor: 'bg-slate-50',
      borderColor: 'border-slate-200',
    },
    {
      icon: Briefcase,
      title: 'Professional Development',
      description: 'Prepare for your career with interview skills, resume writing, and professional communication training.',
      color: 'from-indigo-500 to-blue-600',
      bgColor: 'bg-indigo-50',
      borderColor: 'border-indigo-200',
    },
  ];

  return (
    <section id="programs" className="py-20 bg-linear-to-br from-white to-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-block bg-blue-100 text-blue-600 px-4 py-2 rounded-full text-sm font-semibold mb-6">
            Our Programs
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-slate-800 mb-4">
            Comprehensive Learning Programs
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Choose from our wide range of expertly designed programs tailored to meet your educational goals
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {programs.map((program, index) => (
            <div
              key={index}
              className={`group ${program.bgColor} rounded-2xl p-6 border-2 ${program.borderColor} hover:shadow-xl transition-all duration-300 hover:-translate-y-2 cursor-pointer`}
            >
              <div className={`bg-linear-to-br ${program.color} w-14 h-14 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                <program.icon className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-3">{program.title}</h3>
              <p className="text-slate-600 mb-4 leading-relaxed">{program.description}</p>
              <button className="flex items-center space-x-2 text-sm font-semibold text-blue-600 group-hover:text-blue-700 transition-colors">
                <span>Learn More</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
