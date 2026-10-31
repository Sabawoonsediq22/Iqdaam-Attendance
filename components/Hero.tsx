import { ArrowRight, Sparkles } from "lucide-react";

export default function Hero() {
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section
      id="home"
      className="relative min-h-screen flex items-center overflow-hidden bg-linear-to-br from-primary via-chart-1 to-primary"
    >
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary-foreground rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-warning rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32 text-center">
        <div className="inline-flex items-center space-x-2 bg-primary-foreground/20 backdrop-blur-sm px-4 py-2 rounded-full mb-8 animate-fade-in">
          <Sparkles className="w-4 h-4 text-chart-3" />
          <span className="text-primary-foreground text-sm font-medium">
            Welcome to Excellence in Education
          </span>
        </div>

        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-primary-foreground mb-6 animate-slide-up">
          Iqdaam Educational
          <br />
          <span className="bg-linear-to-r from-chart-3 to-warning bg-clip-text text-transparent">
            Center
          </span>
        </h1>

        <p className="text-xl sm:text-2xl text-primary-foreground/90 mb-12 max-w-3xl mx-auto animate-slide-up-delay">
          Where Knowledge Begins and Futures Are Built
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-in-delay">
          <button
            onClick={() => scrollToSection("cta")}
            className="group bg-primary-foreground text-primary px-8 py-2 rounded-md font-semibold text-lg transform hover:scale-105 transition-all flex items-center space-x-2 cursor-pointer"
          >
            <span>Enroll Now</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
          <button
            onClick={() => scrollToSection("programs")}
            className="bg-primary-foreground/10 backdrop-blur-sm text-primary-foreground border-2 border-primary-foreground px-8 py-2 rounded-md font-semibold text-lg hover:bg-primary-foreground/20 transition-all cursor-pointer"
          >
            Explore Programs
          </button>
        </div>

        <div className="mt-20 grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-4xl mx-auto">
          {[
            { number: "300+", label: "Students Enrolled" },
            { number: "15+", label: "Expert Teachers" },
            { number: "10+", label: "Programs Offered" },
          ].map((stat, index) => (
            <div
              key={index}
              className="bg-primary-foreground/10 backdrop-blur-sm rounded-xl p-6 border border-primary-foreground/20 hover:bg-primary-foreground/20 transition-all"
            >
              <div className="text-4xl font-bold text-primary-foreground mb-2">
                {stat.number}
              </div>
              <div className="text-primary-foreground/80">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) translateX(0); }
          50% { transform: translateY(-20px) translateX(10px); }
        }
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in { animation: fade-in 1s ease-out; }
        .animate-slide-up { animation: slide-up 0.8s ease-out; }
        .animate-slide-up-delay { animation: slide-up 0.8s ease-out 0.2s backwards; }
        .animate-fade-in-delay { animation: fade-in 1s ease-out 0.4s backwards; }
      `}</style>
    </section>
  );
}
