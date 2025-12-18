export default function ContactPage() {
    return (
        <div className="min-h-screen bg-[#0B0B0D] text-white px-4 py-8 md:py-16">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-4xl md:text-5xl font-bold mb-8 text-[#8B5CF6]">Contact Us</h1>

                <div className="space-y-8 text-gray-300 leading-relaxed text-lg">
                    <p>
                        Have a question, concern, or just want to say hi? We're here to help.
                    </p>

                    <div className="grid md:grid-cols-2 gap-8 mt-8">
                        <div className="bg-[#141519] border border-white/10 rounded-2xl p-8">
                            <h3 className="text-xl font-bold text-white mb-4">Get in Touch</h3>
                            <p className="mb-6">For queries, collaborations, or support.</p>
                            <a href="mailto:adityar@hypehausco.in" className="text-[#8B5CF6] hover:underline font-semibold block mb-2">adityar@hypehausco.in</a>
                            <a href="tel:+917709225474" className="text-[#8B5CF6] hover:underline font-semibold block">+91 77092 25474</a>
                        </div>

                        <div className="bg-[#141519] border border-white/10 rounded-2xl p-8">
                            <h3 className="text-xl font-bold text-white mb-4">Event Organizers</h3>
                            <p className="mb-6">Want to list your event on HypeHaus?</p>
                            <a href="mailto:admin@hypearchy.in" className="text-[#8B5CF6] hover:underline font-semibold block mb-2">admin@hypearchy.in</a>
                        </div>
                    </div>

                    <h2 className="text-2xl font-bold text-white mt-12 mb-4">Office Address</h2>
                    <address className="not-italic text-gray-400">
                        Hypehaus Entertainment Pvt Ltd<br />
                        127, Om Nagar, Sakkardhara,<br />
                        Nagpur, Maharashtra 440024<br />
                        India
                    </address>
                </div>
            </div>
        </div>
    );
}
