import Link from 'next/link';
import Image from 'next/image';

export function Footer() {
    return (
        <footer className="bg-[#0A0A0C] border-t border-white/5 pt-16 pb-8 px-4 mt-auto">
            <div className="max-w-7xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
                    {/* Brand Column */}
                    <div className="space-y-4">
                        <Link href="/" className="flex items-center gap-2">
                            <div className="relative w-8 h-8 rounded-lg overflow-hidden">
                                <Image
                                    src="/logo.jpg"
                                    alt="HypeHaus Logo"
                                    fill
                                    className="object-cover"
                                />
                            </div>
                            <span className="font-bold text-xl text-white">HYPEHAUS</span>
                        </Link>
                        <p className="text-gray-400 text-sm leading-relaxed">
                            Discover and book the best events, concerts, and experiences in your city. Find the night. Own the moment.
                        </p>
                        <p className="text-gray-400 text-sm leading-relaxed">
                            127, Om Nagar, Sakkardhara, Nagpur 440024
                        </p>
                    </div>

                    {/* Company Links */}
                    <div>
                        <h3 className="text-white font-semibold mb-6">Company</h3>
                        <ul className="space-y-4 text-sm text-gray-400">
                            <li><Link href="/about" className="hover:text-[#8B5CF6] transition-colors">About Us</Link></li>
                            <li><Link href="/contact" className="hover:text-[#8B5CF6] transition-colors">Contact Us</Link></li>
                            <li><Link href="/pricing" className="hover:text-[#8B5CF6] transition-colors">Pricing</Link></li>
                        </ul>
                    </div>

                    {/* Support Links */}
                    <div>
                        <h3 className="text-white font-semibold mb-6">Support</h3>
                        <ul className="space-y-4 text-sm text-gray-400">
                            <li><a href="mailto:adityar@hypehausco.in" className="hover:text-[#8B5CF6] transition-colors">Help Center</a></li>
                            <li><Link href="/tickets" className="hover:text-[#8B5CF6] transition-colors">My Tickets</Link></li>
                            <li><Link href="/refund-policy" className="hover:text-[#8B5CF6] transition-colors">Refund Policy</Link></li>
                        </ul>
                    </div>

                    {/* Legal Links */}
                    <div>
                        <h3 className="text-white font-semibold mb-6">Legal</h3>
                        <ul className="space-y-4 text-sm text-gray-400">
                            <li><Link href="/terms" className="hover:text-[#8B5CF6] transition-colors">Terms of Service</Link></li>
                            <li><Link href="/privacy-policy" className="hover:text-[#8B5CF6] transition-colors">Privacy Policy</Link></li>
                        </ul>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-500">
                    <p>© {new Date().getFullYear()} HYPEHAUS Entertainment Pvt Ltd. All rights reserved.</p>
                    <div className="flex gap-6">
                        <a href="#" className="hover:text-white transition-colors">Instagram</a>
                        <a href="#" className="hover:text-white transition-colors">Twitter</a>
                        <a href="#" className="hover:text-white transition-colors">LinkedIn</a>
                    </div>
                </div>
            </div>
        </footer>
    );
}
