import { Quote } from 'lucide-react';
import Image from 'next/image';

export default function CEOMessage() {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-linear-to-br from-slate-50 to-blue-50 rounded-3xl p-8 md:p-12 shadow-xl border border-blue-100">
          <div className="grid md:grid-cols-3 gap-8 items-center">
            <div className="md:col-span-1 flex justify-center">
              <div className="relative">
                <div className="absolute inset-0 bg-linear-to-br from-blue-600 to-sky-600 rounded-3xl transform rotate-6"></div>
                <div className="relative bg-white p-2 rounded-3xl shadow-xl">
                  <Image
                    width={256}
                    height={256}
                    src="/shirazkhannaseri.jpg"
                    alt="CEO Shiraz Khan"
                    className="w-64 h-64 object-cover rounded-2xl"
                  />
                </div>
                <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 bg-amber-500 text-white px-6 py-2 rounded-full font-semibold shadow-lg whitespace-nowrap">
                  CEO & Founder
                </div>
              </div>
            </div>

            <div className="md:col-span-2">
              <div className="flex items-start space-x-4 mb-6">
                <div className="bg-blue-600 p-3 rounded-xl">
                  <Quote className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-3xl font-bold text-slate-800 mb-2">Message from Our CEO</h3>
                  <p className="text-lg text-blue-600 font-semibold">Shiraz Khan Naseri</p>
                </div>
              </div>

              <div className="space-y-4 text-slate-600 leading-relaxed">
                <p className="text-lg">
                  Dear Students and Parents,
                </p>
                <p className="text-lg">
                  It gives me immense pleasure to welcome you to Iqdaam Educational Center, where we believe
                  that education is not just about acquiring knowledge, but about building character, developing
                  skills, and shaping futures.
                </p>
                <p className="text-lg">
                  At Iqdaam, we are committed to providing a learning environment that nurtures curiosity,
                  encourages excellence, and prepares students for the challenges of tomorrow. Our dedicated
                  team of educators works tirelessly to ensure that every student receives personalized attention
                  and the highest quality of education.
                </p>
                <p className="text-lg">
                  I invite you to join us on this journey of learning and growth. Together, we will build a
                  brighter future, one student at a time.
                </p>
                <div className="pt-4 flex items-center space-x-4">
                  <div className="h-px bg-slate-300 flex-1"></div>
                  <p className="text-xl font-bold text-slate-800">Shiraz Khan Naseri</p>
                  <div className="h-px bg-slate-300 flex-1"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
