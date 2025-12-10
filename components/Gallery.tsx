import { useState } from "react";
import { X, ZoomIn } from "lucide-react";
import Image from "next/image";

export default function Gallery() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const images = [
    {
      url: "/iqdaamceremony1.jpg",
      title: "Opening Ceremony",
    },
    {
      url: "/iqdaamceremony2.jpg",
      title: "Award Presentation",
    },
    {
      url: "/iqdaamceremony3.jpg",
      title: "Graduation Ceremony",
    },
    {
      url: "/iqdaamceremony4.jpg",
      title: "Student Recognition",
    },
    {
      url: "/iqdaamexam1.jpg",
      title: "Exam Preparation",
    },
    {
      url: "/iqdaamexam.jpg",
      title: "Final Examinations",
    },
    {
      url: "/iqdaamexam3.jpg",
      title: "Test Environment",
    },
    {
      url: "/iqdaamexa.jpg",
      title: "Academic Assessment",
    },
  ];

  return (
    <section id="gallery" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-block bg-amber-100 text-amber-600 px-4 py-2 rounded-full text-sm font-semibold mb-6">
            Gallery
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-slate-800 mb-4">
            Our Center in Pictures
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Take a visual tour of our modern facilities and vibrant learning
            environment
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {images.map((image, index) => (
            <div
              key={index}
              className="group relative overflow-hidden rounded-2xl cursor-pointer shadow-lg hover:shadow-2xl transition-all duration-300"
              onClick={() => setSelectedImage(image.url)}
            >
              <Image
                width={400}
                height={256}
                src={image.url}
                alt={image.title}
                className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <p className="text-white font-semibold">{image.title}</p>
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="bg-white/20 backdrop-blur-sm p-4 rounded-full">
                    <ZoomIn className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {selectedImage && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setSelectedImage(null)}
        >
          <button
            className="absolute top-4 right-4 bg-white/10 backdrop-blur-sm p-3 rounded-full hover:bg-white/20 transition-colors"
            onClick={() => setSelectedImage(null)}
          >
            <X className="w-6 h-6 text-white" />
          </button>
          <Image
            width={800}
            height={600}
            src={selectedImage}
            alt="Full size"
            className="max-w-full max-h-full rounded-2xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </section>
  );
}
