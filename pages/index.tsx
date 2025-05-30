import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import Image from 'next/image';
import AOS from 'aos';
import 'aos/dist/aos.css';

// Heroicons for volume on/off
const SpeakerWaveIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
  </svg>
);

const SpeakerXMarkIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
    <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 9.75L19.5 12m0 0l-2.25 2.25M19.5 12H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51z" />
  </svg>
);

// Heroicon for close button
const XMarkIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

interface Wedding {
  id: string;
  groom: string;
  bride: string;
  groom_name: string;
  bride_name: string;
  groom_desc: string;
  bride_desc: string;
  groom_img: string;
  bride_img: string;
  description: string;
  place: string;
  date: string;
  day: string;
  time: string;
}

interface Moment {
  moments_img: string[];
}

interface Gift {
  envelope_name: string;
  envelope_number: string;
}

interface Congrats {
  id: string;
  name: string;
  words: string;
  presence: string;
  created_at: string;
}

interface Asset {
  music: string;
}

export default function Wedding() {
  const [wedding, setWedding] = useState<Wedding | null>(null);
  const [moments, setMoments] = useState<Moment[]>([]);
  const [gifts, setGifts] = useState<Gift[]>([]);
  const [congrats, setCongrats] = useState<Congrats[]>([]);
  const [asset, setAsset] = useState<Asset | null>(null);
  const [isPlaying, setIsPlaying] = useState(false); // Mulai dengan false
  const [showGiftsPage, setShowGiftsPage] = useState(false);
  const [showModal, setShowModal] = useState(true);
  const [isClosing, setIsClosing] = useState(false);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [formData, setFormData] = useState({ name: '', words: '', presence: 'present' });
  const [formError, setFormError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize AOS
  useEffect(() => {
    AOS.init({
      duration: 1000,
      easing: 'ease-in-out',
      once: true,
      mirror: false,
    });
  }, []);

  // Fetch data
  useEffect(() => {
    async function fetchData() {
      try {
        const { data: weddingData, error: weddingError } = await supabase
          .from('wedding')
          .select('*')
          .limit(1)
          .single();
        if (weddingError) throw weddingError;
        setWedding(weddingData);

        const { data: momentsData, error: momentsError } = await supabase
          .from('moments')
          .select('moments_img')
          .eq('wedding_id', weddingData.id);
        if (momentsError) throw momentsError;
        setMoments(momentsData);

        const { data: giftsData, error: giftsError } = await supabase
          .from('gifts')
          .select('envelope_name, envelope_number')
          .eq('wedding_id', weddingData.id);
        if (giftsError) throw giftsError;
        setGifts(giftsData);

        const { data: congratsData, error: congratsError } = await supabase
          .from('congrats')
          .select('id, name, words, presence, created_at')
          .eq('wedding_id', weddingData.id)
          .order('created_at', { ascending: false });
        if (congratsError) throw congratsError;
        setCongrats(congratsData);

        const { data: assetsData, error: assetsError } = await supabase
          .from('assets')
          .select('music')
          .eq('wedding_id', weddingData.id)
          .limit(1)
          .single();
        if (assetsError && !assetsError.message.includes('No rows found')) throw assetsError;
        setAsset(assetsData);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    }
    fetchData();
  }, []);

  const toggleAudio = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch((error) => console.error('Audio play error:', error));
      }
      setIsPlaying(!isPlaying);
    }
  };

  const openGiftsPage = () => {
    setScrollPosition(window.scrollY);
    setShowGiftsPage(true);
    window.scrollTo(0, 0);
  };

  const closeGiftsPage = () => {
    setShowGiftsPage(false);
    window.scrollTo(0, scrollPosition);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.words.trim()) {
      setFormError('Name and message are required.');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('congrats')
        .insert([
          {
            wedding_id: wedding?.id,
            name: formData.name,
            words: formData.words,
            presence: formData.presence,
          },
        ])
        .select();
      if (error) throw error;

      setCongrats([data[0], ...congrats]);
      setFormData({ name: '', words: '', presence: 'present' });
      setFormError(null);
    } catch (error) {
      console.error('Error submitting congrats:', error);
      setFormError('Failed to submit your message. Please try again.');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCloseModal = () => {
    setIsClosing(true);
    setTimeout(() => {
      setShowModal(false);
      // Play audio after modal closes
      if (audioRef.current && asset?.music) {
        audioRef.current.play().catch((error) => console.error('Auto-play error:', error));
        setIsPlaying(true);
      }
    }, 500); // Match animation duration
  };

  if (!wedding) {
    return <div className="flex justify-center items-center h-screen text-ivory-800 text-lg bg-ivory-50">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-ivory-50 font-serif relative overflow-x-hidden">
      {/* Full-Screen Welcome Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-ivory-900 bg-white flex items-center justify-center z-50 backdrop-blur-sm">
          <div
            className={`w-full h-full bg-ivory-50 flex flex-col items-center justify-center text-center p-6 shadow-2xl transition-transform duration-500 ease-in-out ${
              isClosing ? '-translate-y-full' : 'translate-y-0'
            }`}
          >
            <h1 className="text-4xl md:text-5xl font-serif text-gold-700 mb-4">
              Welcome to the Wedding of {wedding.groom} & {wedding.bride}
            </h1>
            <p className="text-xl md:text-2xl text-ivory-800 mb-6">Yang terhormat, Tamu Undangan</p>
            <button
              onClick={handleCloseModal}
              className="bg-gold-500 text-ivory-50 font-medium py-3 px-6 rounded-lg hover:bg-gold-600 transition-colors duration-300 shadow-md border border-gold-300 focus:outline-none focus:ring-2 focus:ring-green-300"
            >
              Enter Site
            </button>
          </div>
        </div>
      )}

      {/* Top Left Image */}
      <div className="absolute top-0 left-0 z-10" data-aos="fade-down" data-aos-delay="100">
        <Image
          src="/images/top.png"
          alt="Top Decoration"
          width={150}
          height={150}
          className="object-contain"
        />
      </div>

      {/* Side Groom Left Image */}
      <div className="absolute left-0 top-190 transform -translate-y-1/2 z-10" data-aos="fade-right" data-aos-delay="200">
        <div className="relative">
          <Image
            src="/images/side-groom-left.png"
            alt="Groom Side Decoration"
            width={100}
            height={300}
            className="object-contain"
          />
        </div>
      </div>

      {/* Side Bride Right Image */}
      <div className="absolute right-0 top-300 transform -translate-y-1/2 z-10" data-aos="fade-left" data-aos-delay="300">
        <div className="relative">
          <Image
            src="/images/side-bride-right.png"
            alt="Bride Side Decoration"
            width={100}
            height={300}
            className="object-contain"
          />
        </div>
      </div>

      {/* Audio element */}
      {asset?.music && (
        <audio ref={audioRef} src={asset.music} loop>
          Your browser does not support the audio element.
        </audio>
      )}

      {showGiftsPage ? (
        // Gift Envelopes Section
        <section className="fixed inset-0 bg-ivory-100 flex flex-col items-center justify-center p-6 md:p-12 z-50 overflow-auto" data-aos="zoom-in" data-aos-duration="800">
          <div className="max-w-2xl w-full bg-white rounded-lg shadow-lg p-8 border-2 border-gold-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-3xl font-serif text-gold-700">Wedding Gifts</h2>
              <button
                onClick={closeGiftsPage}
                className="text-gold-600 hover:text-gold-800 p-2 rounded-full transition-colors duration-300"
                aria-label="Close"
              >
                <XMarkIcon />
              </button>
            </div>
            <div className="space-y-4">
              {gifts.length > 0 ? (
                gifts.map((gift, index) => (
                  <div
                    key={index}
                    className="p-4 bg-ivory-50 rounded-md shadow-sm border-l-4 border-green-200"
                    data-aos="fade-up"
                    data-aos-delay={`${index * 100}`}
                  >
                    <p className="text-gold-700 font-medium">{gift.envelope_name}</p>
                    <p className="text-ivory-800">{gift.envelope_number}</p>
                  </div>
                ))
              ) : (
                <p className="text-ivory-800 text-center">No gift envelopes available.</p>
              )}
            </div>
          </div>
        </section>
      ) : (
        // Main Page Content
        <>
          {asset?.music && (
            <button
              onClick={toggleAudio}
              className="fixed bottom-6 left-6 bg-gold-100 text-gold-700 p-3 rounded-full shadow-md hover:bg-gold-200 transition-colors duration-300 z-50"
            >
              {isPlaying ? <SpeakerWaveIcon /> : <SpeakerXMarkIcon />}
            </button>
          )}

          <section
            className="flex flex-col items-center justify-center py-24 bg-cover bg-center relative min-h-[400px]"
            style={{
              backgroundImage: 'url(https://images.unsplash.com/photo-1629129836873-0d3db7a49b8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1350&q=80)'
            }}
            data-aos="fade-in"
            data-aos-duration="1200"
          >
            <div className="absolute inset-0 bg-ivory-900 bg-opacity-60 backdrop-blur-sm"></div>
            <div className="relative z-10 text-center px-4" data-aos="fade-up" data-aos-delay="200">
              <h5 className="text-lg md:text-xl font-serif text-gold-300 mb-4">
                The Wedding Invitation of
              </h5>
              <h2 className="text-4xl md:text-5xl font-serif text-gold-300 mb-6 tracking-wide">
                {wedding.groom} & {wedding.bride}
              </h2>
              <p className="text-lg md:text-xl text-ivory-100 max-w-2xl mx-auto">
                {wedding.description}
              </p>
            </div>
          </section>

          <section className="py-16 px-6 md:px-12 bg-white">
            <section className="py-16 px-6 md:px-12 max-w-3xl mx-auto text-center bg-ivory-50" data-aos="fade-up" data-aos-delay="100">
              <h2 className="text-3xl md:text-4xl font-serif text-gold-700 mb-6">Our Beloveds</h2>
            </section>
            <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12">
              <div className="text-center" data-aos="fade-right" data-aos-delay="200">
                <p className="text-2xl md:text-3xl font-serif text-gold-700 mb-2">The Groom</p>
                {wedding.groom_img && (
                  <div className="relative w-60 h-60 mx-auto mb-6">
                    <Image
                      src={wedding.groom_img}
                      alt={wedding.groom}
                      fill
                      className="object-cover rounded-full border-4 border-gold-200 shadow-md"
                      sizes="(max-width: 768px) 100vw, 288px"
                    />
                  </div>
                )}
                <h3 className="text-2xl font-serif text-gold-700">{wedding.groom}</h3>
                <p className="text-ivory-800 mt-2">{wedding.groom_name}</p>
                {wedding.groom_desc && <p className="text-ivory-800 mt-4 leading-relaxed">{wedding.groom_desc}</p>}
              </div>
              <div className="text-center" data-aos="fade-left" data-aos-delay="300">
                <p className="text-2xl md:text-3xl font-serif text-gold-700 mb-2">The Bride</p>
                {wedding.bride_img && (
                  <div className="relative w-60 h-60 mx-auto mb-6">
                    <Image
                      src={wedding.bride_img}
                      alt={wedding.bride}
                      fill
                      className="object-cover rounded-full border-4 border-gold-200 shadow-md"
                      sizes="(max-width: 768px) 100vw, 288px"
                    />
                  </div>
                )}
                <h3 className="text-2xl font-serif text-gold-700">{wedding.bride}</h3>
                <p className="text-ivory-800 mt-2">{wedding.bride_name}</p>
                {wedding.bride_desc && <p className="text-ivory-800 mt-4 leading-relaxed">{wedding.bride_desc}</p>}
              </div>
            </div>
          </section>

          <section className="py-16 px-6 md:px-12 max-w-3xl mx-auto text-center bg-green-50" data-aos="fade-up" data-aos-delay="100">
            <h2 className="text-3xl md:text-4xl font-serif text-gold-700 mb-6">Join Us</h2>
            <p className="text-ivory-800 text-lg">{wedding.day}</p>
            <p className="text-ivory-800 text-lg">{wedding.date}</p>
            <p className="text-ivory-800 text-lg">{wedding.time}</p>
            <p className="text-ivory-800 text-lg">{wedding.place}</p>
          </section>

          {moments.length > 0 && (
            <section className="py-16 px-6 md:px-12 bg-ivory-100" data-aos="fade-in" data-aos-delay="100">
              <h2 className="text-3xl md:text-4xl font-serif text-gold-700 text-center mb-8">Our Moments</h2>
              <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {moments.flatMap((moment) =>
                  moment.moments_img.map((img, index) => (
                    <div key={index} className="relative w-full h-80" data-aos="zoom-in" data-aos-delay={`${index * 100}`}>
                      <Image
                        src={img}
                        alt={`Moment ${index + 1}`}
                        fill
                        className="object-cover rounded-lg shadow-md hover:scale-105 transition-transform duration-300 border-2 border-gold-100"
                        sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw"
                      />
                    </div>
                  ))
                )}
              </div>
            </section>
          )}

          {gifts.length > 0 && (
            <section className="py-16 px-6 md:px-12 max-w-3xl mx-auto text-center" data-aos="fade-up" data-aos-delay="100">
              <h2 className="text-3xl md:text-4xl font-serif text-gold-700 mb-6">Gifts</h2>
              <button
                onClick={openGiftsPage}
                className="bg-gold-500 text-ivory-50 font-medium p-4 rounded-lg hover:bg-gold-600 transition-colors duration-300 w-full max-w-xs shadow-md border border-gold-300 focus:outline-none focus:ring-2 focus:ring-green-300"
              >
                View Gifts
              </button>
            </section>
          )}

          <section className="py-16 px-6 md:px-12 max-w-3xl mx-auto bg-ivory-50" data-aos="fade-up" data-aos-delay="100">
            <h2 className="text-3xl md:text-4xl font-serif text-gold-700 text-center mb-8">Blessings & Wishes</h2>
            <form onSubmit={handleFormSubmit} className="space-y-6 mb-8">
              <div data-aos="fade-up" data-aos-delay="200">
                <label htmlFor="name" className="block text-ivory-800 font-medium mb-2">Your Name</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gold-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-300 bg-ivory-50"
                  placeholder="Enter your name"
                  maxLength={255}
                />
              </div>
              <div data-aos="fade-up" data-aos-delay="300">
                <label htmlFor="words" className="block text-ivory-800 font-medium mb-2">Your Message</label>
                <textarea
                  id="words"
                  name="words"
                  value={formData.words}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gold-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-300 bg-ivory-50"
                  placeholder="Write your blessings and wishes"
                  rows={5}
                  maxLength={1000}
                />
              </div>
              <div data-aos="fade-up" data-aos-delay="400">
                <label htmlFor="presence" className="block text-ivory-800 font-medium mb-2">Attendance</label>
                <select
                  id="presence"
                  name="presence"
                  value={formData.presence}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gold-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-300 bg-ivory-50"
                >
                  <option value="present">Will Attend</option>
                  <option value="not_present">Will Not Attend</option>
                </select>
              </div>
              {formError && <p className="text-red-600">{formError}</p>}
              <button
                type="submit"
                className="bg-black text-white p-3 rounded-lg hover:bg-black transition-colors duration-300 w-full"
                data-aos="fade-up"
                data-aos-delay="500"
              >
                Send Wishes
              </button>
            </form>

            <div className="max-h-96 overflow-y-auto space-y-6">
              {congrats.length > 0 ? (
                congrats.map((congrat, index) => (
                  <div
                    key={index}
                    className="p-6 bg-white rounded-lg shadow-md border-l-4 border-green-200"
                    data-aos="fade-up"
                    data-aos-delay={`${index * 100}`}
                  >
                    <p className="text-gold-700 font-medium"><b>{congrat.name}</b></p>
                    <p className="text-ivory-800 mt-2">{congrat.words}</p>
                    <p className="text-ivory-600 text-sm mt-2">
                      {congrat.presence === 'present' ? 'Will Attend' : 'Will Not Attend'} •{' '}
                      {new Date(congrat.created_at).toLocaleDateString()}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-ivory-800 text-center">No wishes yet. Be the first to share your blessings!</p>
              )}
            </div>
          </section>

          <footer className="py-8 bg-green-50 text-center text-ivory-800 relative">
            <div className="absolute bottom-0 left-0">
              <Image
                src="/images/footer.png"
                alt="Footer Decoration"
                width={150}
                height={100}
                className="object-contain"
              />
            </div>
            <p className="relative">Crafted with love for {wedding.groom_name} & {wedding.bride_name}</p>
            <p className="relative mt-2 text-sm">Celebrate our union with joy and blessings</p>
          </footer>
        </>
      )}
    </div>
  );
}
