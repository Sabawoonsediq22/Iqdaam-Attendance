import { GraduationCap, Users, BookOpen, Heart, TrendingUp, Shield } from 'lucide-react';

export default function WhyChoose() {
  const reasons = [
    {
      icon: GraduationCap,
      title: 'Expert Faculty',
      description: 'Learn from highly qualified and experienced teachers who are passionate about education and dedicated to your success.',
      color: 'from-primary to-primary/80',
    },
    {
      icon: BookOpen,
      title: 'Quality Education',
      description: 'Access world-class curriculum and learning materials designed to meet international standards and industry requirements.',
      color: 'from-success to-success/80',
    },
    {
      icon: Users,
      title: 'Student-First Approach',
      description: 'Experience personalized attention with small class sizes, ensuring every student receives the support they need.',
      color: 'from-warning to-warning/80',
    },
    {
      icon: TrendingUp,
      title: 'Modern Curriculum',
      description: 'Stay ahead with up-to-date course content that combines traditional wisdom with contemporary teaching methods.',
      color: 'from-destructive to-destructive/80',
    },
    {
      icon: Heart,
      title: 'Friendly Environment',
      description: 'Study in a welcoming, supportive atmosphere that encourages collaboration, creativity, and personal growth.',
      color: 'from-info to-info/80',
    },
    {
      icon: Shield,
      title: 'Proven Track Record',
      description: 'Join thousands of successful alumni who have achieved their academic and professional goals with us.',
      color: 'from-muted-foreground to-muted-foreground/80',
    },
  ];

  return (
    <section className="py-20 bg-linear-to-br from-muted to-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-block bg-warning/10 text-warning border border-warning/20 px-4 py-2 rounded-full text-sm font-semibold mb-6">
            Why Choose Us
          </div>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground mb-4">
            What Makes Us Different
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Discover the advantages that set Iqdaam Educational Center apart from the rest
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {reasons.map((reason, index) => (
            <div
              key={index}
              className="group bg-card rounded-xl p-8 border border-card-border transition-all duration-300 hover:-translate-y-2"
            >
              <div className={`bg-linear-to-br ${reason.color} w-16 h-16 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300`}>
                <reason.icon className="w-8 h-8 text-primary-foreground" />
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-4">{reason.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{reason.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
