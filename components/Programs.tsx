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
      color: 'from-primary to-primary/80',
      bgColor: 'bg-primary/5',
      borderColor: 'border-primary/20',
    },
    {
      icon: BookText,
      title: 'Special Grammar Classes',
      description: 'Master English grammar with focused lessons on sentence structure, tenses, and advanced grammar concepts.',
      color: 'from-success to-success/80',
      bgColor: 'bg-success/5',
      borderColor: 'border-success/20',
    },
    {
      icon: MessageCircle,
      title: 'Special Speaking Classes',
      description: 'Build confidence and fluency with interactive speaking sessions, pronunciation practice, and conversation techniques.',
      color: 'from-warning to-warning/80',
      bgColor: 'bg-warning/5',
      borderColor: 'border-warning/20',
    },
    {
      icon: LibraryBig,
      title: 'Special Vocabulary Classes',
      description: 'Expand your word bank with systematic vocabulary building, idioms, and contextual usage in real-life scenarios.',
      color: 'from-destructive to-destructive/80',
      bgColor: 'bg-destructive/5',
      borderColor: 'border-destructive/20',
    },
    {
      icon: FileText,
      title: 'Pashto Dictation',
      description: 'Enhance your Pashto language skills with focused dictation exercises and writing practice.',
      color: 'from-chart-5 to-chart-5/80',
      bgColor: 'bg-chart-5/5',
      borderColor: 'border-chart-5/20',
    },
    {
      icon: Laptop,
      title: 'Computer Programs',
      description: 'Learn essential computer skills including MS Office, typing, internet usage, and digital literacy.',
      color: 'from-info to-info/80',
      bgColor: 'bg-info/5',
      borderColor: 'border-info/20',
    },
    {
      icon: Calculator,
      title: 'Mathematics',
      description: 'Strengthen mathematical concepts from basic arithmetic to advanced problem-solving techniques.',
      color: 'from-muted-foreground to-muted-foreground/80',
      bgColor: 'bg-muted',
      borderColor: 'border-border',
    },
    {
      icon: Briefcase,
      title: 'Professional Development',
      description: 'Prepare for your career with interview skills, resume writing, and professional communication training.',
      color: 'from-chart-1 to-chart-1/80',
      bgColor: 'bg-chart-1/5',
      borderColor: 'border-chart-1/20',
    },
  ];

  return (
    <section id="programs" className="py-20 bg-linear-to-br from-background to-muted">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-block bg-primary/10 text-primary border border-primary/20 px-4 py-2 rounded-full text-sm font-semibold mb-6">
            Our Programs
          </div>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground mb-4">
            Comprehensive Learning Programs
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Choose from our wide range of expertly designed programs tailored to meet your educational goals
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {programs.map((program, index) => (
            <div
              key={index}
              className={`group ${program.bgColor} rounded-xl p-6 border ${program.borderColor} transition-all duration-300 hover:-translate-y-2 cursor-pointer`}
            >
              <div className={`bg-linear-to-br ${program.color} w-14 h-14 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                <program.icon className="w-7 h-7 text-primary-foreground" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3">{program.title}</h3>
              <p className="text-muted-foreground mb-4 leading-relaxed">{program.description}</p>
              <button className="flex items-center space-x-2 text-sm font-semibold text-primary group-hover:text-primary/80 transition-colors">
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
