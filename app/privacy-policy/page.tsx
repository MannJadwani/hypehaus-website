export default function PrivacyPage() {
    return (
        <div className="min-h-screen bg-[#0B0B0D] text-white px-4 py-8 md:py-16">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-4xl md:text-5xl font-bold mb-8 text-[#8B5CF6]">Privacy Policy</h1>
                <p className="text-[#8B5CF6]/80 mb-12">Last updated: December 2024</p>

                <div className="space-y-8 text-gray-300 leading-relaxed text-lg prose prose-invert max-w-none">
                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">1. Introduction</h2>
                        <p>
                            HypeHaus ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how your personal information is collected, used, and disclosed by HypeHaus.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">2. Information We Collect</h2>
                        <p>
                            We collect information you provide directly to us. For example, we collect information when you create an account, subscribe, participate in any interactive features of our services, fill out a form, request customer support or otherwise communicate with us.
                        </p>
                        <ul className="list-disc pl-6 mt-4 space-y-2">
                            <li>Name and contact information (Phone, Email)</li>
                            <li>Payment information (processed securely by Razorpay)</li>
                            <li>Event preferences and history</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">3. How We Use Your Information</h2>
                        <p>
                            We use the information we collect in various ways, including to:
                        </p>
                        <ul className="list-disc pl-6 mt-4 space-y-2">
                            <li>Provide, operate, and maintain our website</li>
                            <li>Process your transactions and send related information</li>
                            <li>Send you emails/messages about events you might be interested in</li>
                            <li>Find and prevent fraud</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">4. Sharing of Information</h2>
                        <p>
                            We may share the information we collect in various ways, including the following:
                        </p>
                        <ul className="list-disc pl-6 mt-4 space-y-2">
                            <li><strong>Event Organizers:</strong> We share your name and ticket details with the organizers of the events you book, for entry verification purposes.</li>
                            <li><strong>Service Providers:</strong> We may share information with third-party vendors who provide services on our behalf (e.g., payment processing, email delivery).</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">5. Security</h2>
                        <p>
                            We act in accordance with the Data Protection Act 1998 in our handling of your personal data. We implement reasonable security measures to clear against unauthorized access.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">6. Contact Us</h2>
                        <p>
                            If you have any questions about this Privacy Policy, please contact us at support@hypehausco.in
                        </p>
                    </section>
                </div>
            </div>
        </div>
    );
}
