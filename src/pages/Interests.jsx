import React from 'react';

export default function Interests() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-4xl font-bold text-gray-900 mb-12 text-center">Personal Interests</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="text-center p-6 bg-gray-50 rounded-lg">
            <div className="text-4xl mb-4">📚</div>
            <h3 className="text-xl font-semibold mb-2">Reading</h3>
            <p className="text-gray-600">Passionate about tech books and science fiction novels</p>
          </div>
          <div className="text-center p-6 bg-gray-50 rounded-lg">
            <div className="text-4xl mb-4">🎵</div>
            <h3 className="text-xl font-semibold mb-2">Music</h3>
            <p className="text-gray-600">Enjoy playing guitar and discovering new artists</p>
          </div>
          <div className="text-center p-6 bg-gray-50 rounded-lg">
            <div className="text-4xl mb-4">✈️</div>
            <h3 className="text-xl font-semibold mb-2">Travel</h3>
            <p className="text-gray-600">Love exploring new cultures and cuisines</p>
          </div>
          <div className="text-center p-6 bg-gray-50 rounded-lg">
            <div className="text-4xl mb-4">💪</div>
            <h3 className="text-xl font-semibold mb-2">Fitness</h3>
            <p className="text-gray-600">Stay active through running and yoga</p>
          </div>
        </div>
      </div>
    </section>
  );
}
