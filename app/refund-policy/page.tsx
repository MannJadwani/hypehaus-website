export default function RefundPage() {
    return (
        <div className="min-h-screen bg-[#0B0B0D] text-white px-4 py-8 md:py-16">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-4xl md:text-5xl font-bold mb-8 text-[#8B5CF6]">Cancellation & Refund Policy</h1>

                <div className="space-y-8 text-gray-300 leading-relaxed text-lg prose prose-invert max-w-none">
                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">1. General Policy</h2>
                        <p>
                            HypeHaus acts as an agent for Event Organizers. Generally, all ticket sales are final and non-refundable. Policies set forth by our Event Organizers may prohibit us from issuing exchanges or refunds after a ticket has been purchased, or for lost, stolen, damaged, or destroyed tickets.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">2. Event Cancellations</h2>
                        <p>
                            If an event is cancelled, we will attempt to contact you to inform you of refund or exchange procedures for that event. For exact instructions on any cancelled event, please check the event information online or contact us at support@hypehausco.in.
                        </p>
                        <p className="mt-4">
                            If a refund is issued, it will be processed to the original method of payment used at time of purchase. Service fees are generally non-refundable.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">3. Postponed or Rescheduled Events</h2>
                        <p>
                            If an event is postponed or rescheduled, your ticket will usually be valid for the new date. If you cannot attend the new date, you may be entitled to a refund if permitted by the Event Organizer's policy.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">4. Customer Initiated Cancellations</h2>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>Tickets cannot be cancelled or refunded by the customer once purchased, unless the event itself is cancelled.</li>
                            <li>Before purchasing tickets, carefully review your event and seat selection.</li>
                        </ul>
                    </section>

                    <section>
                        <p className="mt-8 italic opacity-70">
                            Note: This policy is subject to change. The specific refund policy for each event is determined by the Event Organizer and may supersede this general policy.
                        </p>
                    </section>
                </div>
            </div>
        </div>
    );
}
