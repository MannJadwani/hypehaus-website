export default function PricingPage() {
    return (
        <div className="min-h-screen bg-[#0B0B0D] text-white px-4 py-8 md:py-16">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-4xl md:text-5xl font-bold mb-8 text-[#8B5CF6]">Pricing</h1>

                <div className="space-y-8 text-gray-300 leading-relaxed text-lg">
                    <p>
                        HypeHaus is a marketplace for events. The ticket prices are determined by the event organizers and vary depending on the event, venue, and ticket tier.
                    </p>

                    <h2 className="text-2xl font-bold text-white mt-12 mb-4">Ticket Fees</h2>
                    <p>
                        To maintain our platform, secure your transactions, and provide 24/7 support, we charge a small booking fee on each ticket purchased.
                    </p>

                    <div className="bg-[#141519] border border-white/10 rounded-2xl p-6 mt-6">
                        <h3 className="text-xl font-bold text-white mb-4">Fee Structure</h3>
                        <ul className="space-y-3">
                            <li className="flex justify-between border-b border-white/5 pb-3">
                                <span>Platform Fee</span>
                                <span className="font-mono text-[#8B5CF6]">3 - 5% of ticket value</span>
                            </li>
                            <li className="flex justify-between border-b border-white/5 pb-3">
                                <span>Payment Gateway Charges</span>
                                <span className="font-mono text-[#8B5CF6]">~2% (Standard Gateway Rates)</span>
                            </li>
                            <li className="flex justify-between pt-2">
                                <span>GST (Tax)</span>
                                <span className="font-mono text-[#8B5CF6]">18% on fees</span>
                            </li>
                        </ul>
                    </div>

                    <h2 className="text-2xl font-bold text-white mt-12 mb-4">Transparency</h2>
                    <p>
                        We believe in complete transparency. The final price you see at checkout includes all applicable taxes and fees. There are no hidden charges.
                    </p>

                    <p className="text-sm opacity-60 mt-8">
                        * Fees are subject to change based on specific event requirements or promotions.
                    </p>
                </div>
            </div>
        </div>
    );
}
