import { BookOpen, Users, Award, Target } from "lucide-react";
import Image from "next/image";

export default function About() {
  return (
    <section id="about" className="py-20 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="order-2 md:order-1">
            <div className="inline-block bg-primary/10 text-primary border border-primary/20 px-4 py-2 rounded-full text-sm font-semibold mb-6">
              About Us
            </div>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground mb-6">
              Empowering Students Through
              <span className="text-primary"> Quality Education</span>
            </h2>
            <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
              Iqdaam Educational Center is a premier institution dedicated to
              providing exceptional education and nurturing academic excellence.
              We believe in shaping futures through innovative teaching methods
              and personalized attention to each student.
            </p>
            <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
              Our comprehensive programs cover English language mastery,
              computer literacy, and essential academic skills. With a team of
              experienced educators and modern teaching methodologies, we create
              an environment where students thrive and achieve their full
              potential.
            </p>

            <div className="grid grid-cols-2 gap-6">
              {[
                { icon: BookOpen, label: "Comprehensive Curriculum" },
                { icon: Users, label: "Expert Faculty" },
                { icon: Award, label: "Proven Results" },
                { icon: Target, label: "Goal-Oriented Learning" },
              ].map((item, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <div className="bg-primary/10 p-3 rounded-lg">
                    <item.icon className="w-6 h-6 text-primary" />
                  </div>
                  <span className="text-foreground font-medium">
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="order-1 md:order-2 relative">
            <div className="relative rounded-3xl overflow-hidden">
              <Image
                width={800}
                height={600}
                src="/about.jpg"
                alt="Students learning"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-linear-to-t from-primary/20 to-transparent"></div>
            </div>
            <div className="absolute -bottom-6 -left-6 bg-warning text-warning-foreground p-6 rounded-xl shadow-md">
              <div className="text-3xl font-bold">6+</div>
              <div className="text-sm">Years of Excellence</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
