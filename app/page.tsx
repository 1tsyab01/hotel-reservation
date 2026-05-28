import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import type { RoomWithType } from '@/types/database'
import { Star, MapPin, Wifi, Car, Coffee, Waves, Shield, Award, ArrowRight } from 'lucide-react'
import RoomCard from '@/components/rooms/RoomCard'
import HomeSearchBar from '@/components/rooms/HomeSearchBar'

const amenities = [
  { icon: Wifi, label: 'High-Speed WiFi', desc: 'Complimentary throughout the hotel' },
  { icon: Car, label: 'Valet Parking', desc: 'Secure 24/7 parking service' },
  { icon: Coffee, label: 'Fine Dining', desc: '3 award-winning restaurants' },
  { icon: Waves, label: 'Infinity Pool', desc: 'Rooftop pool with ocean views' },
  { icon: Shield, label: 'Concierge', desc: '24/7 personalized service' },
  { icon: Award, label: 'Spa & Wellness', desc: 'World-class treatment center' },
]

const testimonials = [
  {
    name: 'Alexandra Chen',
    role: 'Business Traveler',
    rating: 5,
    body: 'The Presidential Suite was absolutely breathtaking. The butler service exceeded every expectation — true luxury redefined.',
    avatar: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=100',
    roomType: 'Presidential Suite',
  },
  {
    name: 'Marcus Williams',
    role: 'Honeymooner',
    rating: 5,
    body: "Our Junior Suite with ocean views created memories that will last a lifetime. The staff's attention to detail was impeccable.",
    avatar: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=100',
    roomType: 'Junior Suite',
  },
  {
    name: 'Sophie Laurent',
    role: 'Frequent Guest',
    rating: 5,
    body: 'I stay at Lumière on every business trip to the city. The Deluxe rooms are consistently perfect — comfortable, modern, and serene.',
    avatar: 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=100',
    roomType: 'Deluxe Room',
  },
]

async function getFeaturedRooms(): Promise<RoomWithType[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('rooms')
    .select('*, room_types(*)')
    .eq('status', 'available')
    .order('floor', { ascending: false })
    .limit(3)
  return (data ?? []) as RoomWithType[]
}

export default async function HomePage() {
  const featuredRooms = await getFeaturedRooms()

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      {/* Hero */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://images.pexels.com/photos/258154/pexels-photo-258154.jpeg?auto=compress&cs=tinysrgb&w=1600"
            alt="Lumière Grand Hotel exterior"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-[#0A0A0A]" />
        </div>
        <div className="absolute top-1/3 left-1/4 w-[400px] h-[400px] rounded-full bg-[#6366F1]/10 blur-[120px] pointer-events-none" />

        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 text-center pt-20">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-white/60 mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Now accepting reservations &middot; Est. 1987
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight tracking-tight">
            Where Luxury
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#818CF8] via-[#6366F1] to-[#4F46E5]">
              Meets Serenity
            </span>
          </h1>

          <p className="text-base sm:text-lg text-white/50 max-w-xl mx-auto mb-10 leading-relaxed">
            Experience the finest hospitality in the heart of the city. Breathtaking views,
            world-class amenities, and service that anticipates your every need.
          </p>

          <div className="flex items-center justify-center gap-2 text-sm text-white/30">
            <MapPin className="w-4 h-4" />
            <span>123 Grand Boulevard, Riviera District &middot; Open year round</span>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 pb-12 px-4 z-10">
          <HomeSearchBar />
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-[#1F1F1F] bg-[#111111]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { value: '37', label: 'Luxury Rooms & Suites' },
            { value: '4.9', label: 'Average Guest Rating' },
            { value: '35+', label: 'Years of Excellence' },
            { value: '24/7', label: 'Concierge Service' },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-2xl font-bold text-white mono mb-1">{stat.value}</div>
              <div className="text-xs text-white/40">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Featured Rooms */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-20">
        <div className="flex items-end justify-between mb-8">
          <div>
            <div className="text-xs text-[#6366F1] uppercase tracking-widest font-medium mb-2">Our Rooms</div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white">Featured Accommodations</h2>
          </div>
          <Link href="/rooms" className="hidden sm:flex items-center gap-1 text-sm text-white/40 hover:text-white transition-colors">
            View all <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {featuredRooms.map((room, i) => (
            <div key={room.id} className="slide-up" style={{ animationDelay: `${i * 100}ms` }}>
              <RoomCard room={room} />
            </div>
          ))}
        </div>
      </section>

      {/* Amenities */}
      <section id="amenities" className="border-t border-[#1F1F1F] bg-[#0D0D0D] py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <div className="text-xs text-[#6366F1] uppercase tracking-widest font-medium mb-2">Hotel Facilities</div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">Everything You Need</h2>
            <p className="text-white/40 text-sm max-w-md mx-auto">
              From sunrise yoga to sunset cocktails, every moment at Lumière is crafted for your pleasure.
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {amenities.map(({ icon: Icon, label, desc }) => (
              <div key={label} className="surface rounded-xl p-5 hover:border-[#6366F1]/20 transition-all duration-200 group">
                <div className="w-10 h-10 rounded-lg bg-[#6366F1]/10 flex items-center justify-center mb-3 group-hover:bg-[#6366F1]/20 transition-colors">
                  <Icon className="w-5 h-5 text-[#818CF8]" />
                </div>
                <h3 className="text-white text-sm font-medium mb-1">{label}</h3>
                <p className="text-white/40 text-xs">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="border-t border-[#1F1F1F] py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <div className="text-xs text-[#6366F1] uppercase tracking-widest font-medium mb-2">Guest Reviews</div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white">What Our Guests Say</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {testimonials.map((t, i) => (
              <div key={t.name} className="surface rounded-xl p-5 slide-up" style={{ animationDelay: `${i * 100}ms` }}>
                <div className="flex items-center gap-1 mb-3">
                  {Array.from({ length: t.rating }).map((_, j) => (
                    <Star key={j} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-white/60 text-sm leading-relaxed mb-4">&ldquo;{t.body}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <img src={t.avatar} alt={t.name} className="w-8 h-8 rounded-full object-cover border border-white/10" />
                  <div>
                    <div className="text-white text-xs font-medium">{t.name}</div>
                    <div className="text-white/30 text-xs">{t.role} &middot; {t.roomType}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section id="about" className="border-t border-[#1F1F1F] bg-[#0D0D0D] py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <div className="text-xs text-[#6366F1] uppercase tracking-widest font-medium mb-4">Begin Your Stay</div>
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4 leading-tight">
            Ready for an Unforgettable Experience?
          </h2>
          <p className="text-white/40 mb-8 max-w-lg mx-auto text-sm">
            Join thousands of satisfied guests who have discovered the perfect balance of luxury,
            comfort, and exceptional service at Lumière Grand Hotel.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/rooms" className="bg-[#6366F1] hover:bg-[#5558E3] text-white px-8 py-3 font-semibold text-sm rounded-md transition-colors">
              Explore Rooms
            </Link>
            <Link href="/auth/register" className="border border-[#1F1F1F] text-white/60 hover:text-white hover:border-white/20 px-8 py-3 text-sm rounded-md transition-all">
              Create Account
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#1F1F1F] py-8">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-[#6366F1] flex items-center justify-center">
              <span className="text-white text-xs font-bold">L</span>
            </div>
            <span className="text-white/60 text-sm">Lumière Grand Hotel</span>
          </div>
          <p className="text-white/20 text-xs">&copy; 2026 Lumière Grand Hotel. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
