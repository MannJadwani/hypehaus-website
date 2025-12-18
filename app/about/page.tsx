export default function AboutPage() {
    return (
        <div className="min-h-screen bg-[#0B0B0D] text-white px-4 py-8 md:py-16">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-4xl md:text-5xl font-bold mb-8 text-[#8B5CF6]">About HypeHaus</h1>

                <div className="space-y-8 text-gray-300 leading-relaxed text-lg">
                    <p>
                        Welcome to <span className="font-semibold text-white">HypeHaus</span>, your ultimate destination for discovering and experiencing the best nightlife, concerts, and events in your city.
                    </p>

                    <p>
                        At HypeHaus, we believe that life is made of moments. The moment the bass drops, the moment you sing along with thousands of strangers, the moment you discover your new favorite artist. Our mission is to make these moments accessible, seamless, and unforgettable.
                    </p>

                    <h2 className="text-2xl font-bold text-white mt-12 mb-4">Our Mission</h2>
                    <p>
                        We are building the future of event ticketing – a platform that puts fans first. We eliminate the friction of booking, ensure authentic tickets, and provide a seamless entry experience with our state-of-the-art QR technology.
                    </p>

                    <h2 className="text-2xl font-bold text-white mt-12 mb-4">Why Choose Us?</h2>
                    <ul className="list-disc pl-6 space-y-2">
                        <li><strong className="text-white">Curated Events:</strong> We scrutinize every event to ensure it meets our high standards of quality and hype.</li>
                        <li><strong className="text-white">Seamless Booking:</strong> From discovery to checkout in seconds. No hidden fees, no confusing loops.</li>
                        <li><strong className="text-white">Instant Delivery:</strong> Your tickets are delivered instantly via Email and WhatsApp.</li>
                        <li><strong className="text-white">Verified Entry:</strong> Say goodbye to scams with our secure, unique QR verification system.</li>
                    </ul>

                    <p className="mt-12 opacity-70 italic">
                        Find the night. Own the moment.
                    </p>
                </div>
            </div>
        </div>
    );
}
