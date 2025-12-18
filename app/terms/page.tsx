export default function TermsPage() {
    return (
        <div className="min-h-screen bg-[#0B0B0D] text-white px-4 py-8 md:py-16">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-4xl md:text-5xl font-bold mb-8 text-[#8B5CF6]">Terms and Conditions</h1>
                <p className="text-[#8B5CF6]/80 mb-12">Last updated: December 2024</p>

                <div className="space-y-8 text-gray-300 leading-relaxed text-lg prose prose-invert max-w-none">
                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">1. Introduction</h2>
                        <p>
                            Welcome to HypeHaus ("Company", "we", "our", "us"). These Terms and Conditions ("Terms", "Terms and Conditions") govern your use of our website and mobile application (collectively, the "Service").
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">2. Accounts</h2>
                        <p>
                            When you create an account with us, you must provide information that is accurate, complete, and current at all times. Failure to do so constitutes a breach of the Terms, which may result in immediate termination of your account on our Service.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">3. Ticket Purchases</h2>
                        <p>
                            All ticket purchases are final. HypeHaus acts as an agent for those who are promoting or otherwise providing the events for which you purchase tickets ("Event Organizers"). When you purchase a ticket for an event, HypeHaus will be handling the transaction and collecting payment for the Event Organizer.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">4. Event Changes and Cancellations</h2>
                        <p>
                            Events may be cancelled, postponed, or rescheduled by the Event Organizer or venue. In such cases, HypeHaus will attempt to contact you to inform you of refund or exchange procedures for that event.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">5. Code of Conduct</h2>
                        <p>
                            You agree not to use the Service for any unlawful purpose or any purpose prohibited under this clause. You agree not to use the Service in any way that could damage the Service, the Services, or the general business of the Company.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">6. Limitation of Liability</h2>
                        <p>
                            HypeHaus shall not be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your access to or use of or inability to access or use the Service.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">7. Contact Us</h2>
                        <p>
                            If you have any questions about these Terms, please contact us at support@hypehausco.in
                        </p>
                    </section>
                </div>
            </div>
        </div>
    );
}
