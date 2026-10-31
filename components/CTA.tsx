import { ArrowRight, Phone } from "lucide-react";

export default function CTA() {
  const phoneNumber = "+93711163551";
  const item= [{ label: "Flexible Timings", value: "Morning & Evening" },
    { label: "Affordable Fees", value: "Best Value" },
    { label: "Quick Start", value: "Enroll Today" },
  ];

  const openWhatsApp = () => {
    const message =
      "Hello, I would like to inquire about your educational programs.";
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(
      message
    )}`;
    window.open(whatsappUrl, "_blank");
  };

  const openPhoneDialer = () => {
    window.location.href = `tel:${phoneNumber}`;
  };

  return (
    <section id="cta" className="py-20 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden bg-linear-to-br from-primary via-chart-1 to-primary rounded-2xl">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-10 right-10 w-64 h-64 bg-primary-foreground rounded-full blur-3xl"></div>
            <div className="absolute bottom-10 left-10 w-96 h-96 bg-warning rounded-full blur-3xl"></div>
          </div>

          <div className="relative px-8 py-16 md:py-20 text-center">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-primary-foreground mb-6">
              Ready to Start Your
              <br />
              Learning Journey?
            </h2>
            <p className="text-xl text-primary-foreground/90 mb-12 max-w-3xl mx-auto">
              Join hundreds of successful students who have transformed their
              futures with quality education at Iqdaam
            </p>

            <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-4xl mx-auto">
              {item.map((item, index) => (
                <div key={index} className="text-center">
                  <div className="text-2xl font-bold text-primary-foreground mb-2">
                    {item.value}
                  </div>
                  <div className="text-primary-foreground/80">{item.label}</div>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mt-10">
              <button
                onClick={() => openWhatsApp()}
                className="group bg-primary-foreground text-primary px-8 py-2 rounded-md font-semibold text-lg transform hover:scale-105 transition-all flex items-center space-x-2 cursor-pointer"
              >
                <span>Join Now</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <button
                onClick={() => openPhoneDialer()}
                className="bg-primary-foreground/10 backdrop-blur-sm text-primary-foreground border-2 border-primary-foreground px-8 py-2 rounded-md font-semibold text-lg hover:bg-primary-foreground/20 transition-all flex items-center space-x-2 cursor-pointer"
              >
                <Phone className="w-5 h-5" />
                <span>Contact Us</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
