import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import Image from 'next/image';
import AOS from 'aos';
import 'aos/dist/aos.css';

// SpeakerWaveIcon and SpeakerXMarkIcon remain unchanged
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

// Interfaces remain unchanged
interface Wedding {
  id: string;
  groom: string;
  bride: string;
  groom_name: string;
  bride_name: string;
  groom_initial: string;
  bride_initial: string;
  groom_desc: string;
  bride_desc: string;
  groom_img: string;
  bride_img: string;
  modal_img: string | null;
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
  // State, hooks, and logic remain unchanged
  const [wedding, setWedding] = useState<Wedding | null>(null);
  const [moments, setMoments] = useState<Moment[]>([]);
  const [gifts, setGifts] = useState<Gift[]>([]);
  const [congrats, setCongrats] = useState<Congrats[]>([]);
  const [asset, setAsset] = useState<Asset | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showGiftsDropdown, setShowGiftsDropdown] = useState(false);
  const [showModal, setShowModal] = useState(true);
  const [isClosing, setIsClosing] = useState(false);
  const [formData, setFormData] = useState({ name: '', words: '', presence: 'present' });
  const [formError, setFormError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const bulan = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

  const attendCount = congrats.filter((congrat) => congrat.presence === 'present').length;
  const notAttendCount = congrats.filter((congrat) => congrat.presence === 'not_present').length;

  useEffect(() => {
    const preventCopy = (e: Event) => {
      e.preventDefault();
      alert("Copying is disabled on this website.");
    };
    document.addEventListener('copy', preventCopy);
    return () => document.removeEventListener('copy', preventCopy);
  }, []);

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

  const toggleGiftsDropdown = () => {
    setShowGiftsDropdown(!showGiftsDropdown);
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
      AOS.init({
        duration: 1000,
        easing: 'ease-in-out',
        once: true,
        mirror: false,
      });
      AOS.refresh();
      if (audioRef.current && asset?.music) {
        audioRef.current.play().catch((error) => console.error('Auto-play error:', error));
        setIsPlaying(true);
      }
    }, 500);
  };

  if (!wedding) {
    return <div className="flex justify-center items-center h-screen text-neutral-800 text-lg no-select">Loading...</div>;
  }

  return (
    <div className="min-h-screen font-serif relative overflow-x-hidden no-select">
      {showModal && (
        <div className="fixed inset-0 bg-neutral-900 bg-opacity-60 flex items-center justify-center z-50 backdrop-blur-sm">
          <div
            className={`w-full h-full flex flex-col items-center justify-center text-center p-6 shadow-2xl transition-transform duration-500 ease-in-out ${isClosing ? '-translate-y-full' : 'translate-y-0'}`}
            style={{
              backgroundImage: wedding?.modal_img ? `url(${wedding.modal_img})` : 'none',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundColor: wedding?.modal_img ? 'transparent' : '#F4E7E9',
              position: 'relative',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                backgroundColor: 'black',
                opacity: 0.5,
                zIndex: 1,
              }}
            />
            <div className="relative z-10">
              <h1 className="text-4xl md:text-5xl font-serif text-white mb-70 mt-[-10%]">
                Welcome to the Wedding of {wedding.groom} & {wedding.bride}
              </h1>
              <p className="text-xl md:text-2xl text-white mb-4">Yang terhormat, Tamu Undangan</p>
              <button
                onClick={handleCloseModal}
                className="bg-amber-500 text-white font-medium py-3 px-6 rounded-lg hover:bg-amber-600 transition-colors duration-300 shadow-md border border-white focus:outline-none focus:ring-2 focus:ring-pink-300"
              >
                Enter Site
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="absolute top-0 left-0 z-10" data-aos="fade-down" data-aos-delay="100">
        <Image
          src="/images/top.png"
          alt="Top Decoration"
          width={150}
          height={150}
          className="object-contain"
        />
      </div>

      {asset?.music && (
        <audio ref={audioRef} src={asset.music} loop>
          Your browser does not support the audio element.
        </audio>
      )}

      <>
        {asset?.music && (
          <button
            onClick={toggleAudio}
            className="fixed bottom-6 left-6 bg-amber-100 text-amber-700 p-3 rounded-full shadow-md hover:bg-amber-200 transition-colors duration-300 z-50"
          >
            {isPlaying ? <SpeakerWaveIcon /> : <SpeakerXMarkIcon />}
          </button>
        )}

        <section
          className="flex flex-col items-center justify-center py-24 bg-cover bg-center relative min-h-[400px]"
          style={{
            backgroundImage: 'url(https://images.unsplash.com/photo-1629129836873-0d3db7a49b8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1350&q=80)',
          }}
          data-aos="fade-in"
          data-aos-duration="1200"
        >
          <div className="absolute inset-0 bg-transparent"></div>
          <div className="relative z-10 text-center px-4" data-aos="fade-up" data-aos-delay="200">
            <h5 className="text-lg md:text-xl font-serif text-amber-700 mb-4">
              The Wedding Invitation of
            </h5>
            <h2 className="text-4xl md:text-5xl font-serif text-amber-700 mb-6 tracking-wide">
              {wedding.groom} & {wedding.bride}
            </h2>
            <p className="text-lg md:text-xl text-amber-700 max-w-2xl mx-auto">
              {wedding.description}
            </p>
          </div>
        </section>

        <section className="py-16 px-6 md:px-12 bg-transparent">
          <section className="py-16 px-6 md:px-12 max-w-3xl mx-auto text-center bg-transparent" data-aos="fade-up" data-aos-delay="100">
            <h2 className="text-3xl md:text-4xl font-serif text-amber-700 mb-6">Our Beloveds</h2>
          </section>
          <div className="max-w-4xl mx-auto relative">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div className="text-center" data-aos="fade-right" data-aos-delay="200">
                <p className="text-2xl md:text-3xl font-serif text-amber-700 mb-2">The Groom</p>
                {wedding.groom_img && (
                  <div className="relative w-60 h-60 mx-auto mb-6">
                    <Image
                      src="/images/border-bottom.png"
                      alt="border bottom"
                      width={80}
                      height={80}
                      className="absolute bottom-0 right-0 z-20"
                    />
                    <Image
                      src="/images/border-top.png"
                      alt="border top"
                      width={80}
                      height={80}
                      className="absolute top-0 left-0 z-0"
                    />
                    <Image
                      src={wedding.groom_img}
                      alt={wedding.groom}
                      fill
                      className="object-cover rounded-full border-4 border-amber-200 shadow-md relative z-10"
                      sizes="(max-width: 768px) 100vw, 288px"
                    />
                  </div>
                )}
                <h3 className="text-2xl font-serif text-amber-700">{wedding.groom}</h3>
                <p className="text-neutral-800 mt-2">{wedding.groom_name}</p>
                {wedding.groom_desc && <p className="text-neutral-800 mt-4 leading-relaxed">{wedding.groom_desc}</p>}
              </div>
              <div className="text-center md:absolute md:top-1/2 md:left-1/2 md:transform md:-translate-x-1/2 md:-translate-y-1/2" data-aos="fade-right" data-aos-delay="400">
                <h3 className="text-2xl md:text-3xl font-serif text-amber-700">{wedding.groom_initial} & {wedding.bride_initial}</h3>
              </div>
              <div className="text-center" data-aos="fade-left" data-aos-delay="300">
                <p className="text-2xl md:text-3xl font-serif text-amber-700 mb-2">The Bride</p>
                {wedding.bride_img && (
                  <div className="relative w-60 h-60 mx-auto mb-6">
                    <Image
                      src="/images/border-bottom.png"
                      alt="border bottom"
                      width={80}
                      height={80}
                      className="absolute bottom-0 right-0 z-20"
                    />
                    <Image
                      src="/images/border-top.png"
                      alt="border top"
                      width={80}
                      height={80}
                      className="absolute top-0 left-0 z-0"
                    />
                    <Image
                      src={wedding.bride_img}
                      alt={wedding.bride}
                      fill
                      className="object-cover rounded-full border-4 border-amber-200 shadow-md relative z-10"
                      sizes="(max-width: 768px) 100vw, 288px"
                    />
                  </div>
                )}
                <h3 className="text-2xl font-serif text-amber-700">{wedding.bride}</h3>
                <p className="text-neutral-800 mt-2">{wedding.bride_name}</p>
                {wedding.bride_desc && <p className="text-neutral-800 mt-4 leading-relaxed">{wedding.bride_desc}</p>}
              </div>
            </div>
          </div>
        </section>

        <section
          className="relative py-12 px-6 w-[300px] sm:w-[350px] mx-auto text-center bg-gradient-to-br from-pink-100 via-pink-50 to-rose-100 rounded-full aspect-[1/1.5] overflow-hidden flex flex-col items-center justify-start"
          data-aos="fade-up"
          data-aos-delay="100"
        >
          <h2 className="text-sm md:text-base font-serif text-rose-800 mb-30 font-semibold tracking-tight drop-shadow-sm">
            We Invite You
          </h2>
          <div className="w-full flex items-center justify-center gap-4 mt-2">
            <div className="flex-1 flex flex-col items-center justify-center">
              {(() => {
                const [year, month, day] = wedding.date.split("-");
                return (
                  <div className="flex flex-col items-center leading-tight">
                    <span className="text-3xl font-extrabold text-rose-700">{day}</span>
                    <span className="text-sm text-rose-900 font-medium">
                      {bulan[parseInt(month, 10) - 1]} {year}
                    </span>
                  </div>
                );
              })()}
            </div>
            <div className="w-[2px] h-16 bg-rose-500 opacity-50 rounded-full"></div>
            <div className="flex-1 flex flex-col gap-1 items-center justify-center text-xs">
              <div className="flex flex-col items-center">
                <span className="uppercase tracking-wider text-rose-700 font-medium text-[10px]">
                  Hari
                </span>
                <p className="text-rose-900 font-light italic text-xs">{wedding.day}</p>
              </div>
              <div className="flex flex-col items-center">
                <span className="uppercase tracking-wider text-rose-700 font-medium text-[10px]">
                  Waktu
                </span>
                <p className="text-rose-900 font-medium text-xs">
                  {wedding.time.split(":").slice(0, 2).join(":")}
                </p>
              </div>
              <div className="flex flex-col items-center">
                <span className="uppercase tracking-wider text-rose-700 font-medium text-[10px]">
                  Tempat
                </span>
                <p className="text-rose-900 font-medium leading-tight text-xs text-center">
                  {wedding.place}
                </p>
              </div>
            </div>
          </div>
        </section>

        {moments.length > 0 && (
          <section className="py-16 px-6 md:px-12 bg-transparent" data-aos="fade-in" data-aos-delay="100">
            <h2 className="text-3xl md:text-4xl font-serif text-amber-700 text-center mb-8">Our Moments</h2>
            <div className="max-w-5xl mx-auto grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 masonry-grid">
              {moments.flatMap((moment) =>
                moment.moments_img.map((img, index) => (
                  <div
                    key={index}
                    className="relative w-full masonry-item"
                    data-aos="zoom-in"
                    data-aos-delay={`${index * 100}`}
                  >
                    <Image
                      src={img}
                      alt={`Moment ${index + 1}`}
                      width={0}
                      height={0}
                      sizes="(max-width: 640px) 50vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                      className="w-full h-auto object-cover rounded-lg shadow-md hover:scale-[1.02] transition-transform duration-300 border-2 border-amber-100"
                      style={{ aspectRatio: 'auto' }}
                      onLoad={(e) => {
                        const imgElement = e.target as HTMLImageElement;
                        imgElement.style.aspectRatio = `${imgElement.naturalWidth}/${imgElement.naturalHeight}`;
                      }}
                    />
                  </div>
                ))
              )}
            </div>
          </section>
        )}

        {gifts.length > 0 && (
          <section className="py-16 px-6 md:px-12 max-w-3xl mx-auto text-center" data-aos="fade-up" data-aos-delay="100">
            <Image
              src="/images/amplop.png"
              alt="Amplop Online"
              width={200}
              height={200}
              className="mx-auto mb-6"
            />
            <button
              onClick={toggleGiftsDropdown}
              className={`bg-amber-500 text-neutral-50 font-medium p-4 rounded-lg hover:bg-amber-600 transition-colors duration-300 w-full max-w-xs shadow-md border border-amber-300 focus:outline-none focus:ring-2 focus:ring-pink-300 ${showGiftsDropdown ? 'bg-amber-600' : ''}`}
            >
              {showGiftsDropdown ? 'Amplop Online' : 'Amplop Online'}
            </button>
            <div
              className={`transition-all duration-500 ease-in-out overflow-hidden ${showGiftsDropdown ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}`}
            >
              <div className="mt-6 space-y-4">
                {gifts.length > 0 ? (
                  gifts.map((gift, index) => (
                    <div
                      key={index}
                      className="relative bg-gradient-to-r from-gray-800 to-gray-600 text-white rounded-lg shadow-lg p-6 w-full max-w-md mx-auto border border-amber-200 transform hover:scale-105 transition-transform duration-300"
                      data-aos="fade-up"
                      data-aos-delay={`${index * 100}`}
                      style={{
                        backgroundImage: 'linear-gradient(135deg, #000000 0%, #4a5568 100%)',
                        boxShadow: '0 4px 15px rgba(0, 0, 0, 0.3), inset 0 0 10px rgba(255, 215, 0, 0.2)',
                      }}
                    >
                      <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r"></div>
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-white">Amplop Online</h3>
                        <div className="text-xs text-gray-300 opacity-75">#{index + 1}</div>
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm font-medium">
                          <span className="text-amber-200">Name:</span> {gift.envelope_name}
                        </p>
                        <p className="text-sm font-medium">
                          <span className="text-amber-200">Number:</span> {gift.envelope_number}
                        </p>
                        <button
                          onClick={() => navigator.clipboard.writeText(gift.envelope_number)}
                          className="mt-2 bg-amber-500 text-neutral-50 font-medium py-2 px-4 rounded-lg hover:bg-amber-600 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-pink-300"
                        >
                          Copy Number
                        </button>
                      </div>
                      <div className="absolute bottom-4 right-4 text-xs text-gray-400 opacity-50">
                        Secure Transaction
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-neutral-800 text-center">No gift envelopes available.</p>
                )}
              </div>
            </div>
          </section>
        )}

        <section className="py-16 px-6 md:px-12 max-w-3xl mx-auto bg-neutral-50">
          <h2 className="text-3xl md:text-4xl font-serif text-amber-700 text-center mb-8">Blessings & Wishes</h2>
          <div className="flex justify-center gap-12 mb-8">
            <div className="text-center">
              <p className="text-4xl md:text-5xl font-serif text-pink-300">{attendCount}</p>
              <p className="text-lg md:text-xl font-serif text-neutral-800 mt-2">Will Attend</p>
            </div>
            <div className="text-center">
              <p className="text-4xl md:text-5xl font-serif text-red-600">{notAttendCount}</p>
              <p className="text-lg md:text-xl font-serif text-neutral-800 mt-2">Will Not Attend</p>
            </div>
          </div>
          <form onSubmit={handleFormSubmit} className="space-y-6 mb-8">
            <div>
              <label htmlFor="name" className="block text-neutral-800 font-medium mb-2">Your Name</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full p-3 border border-amber-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-300 bg-neutral-50"
                placeholder="Enter your name"
                maxLength={255}
              />
            </div>
            <div>
              <label htmlFor="words" className="block text-neutral-800 font-medium mb-2">Your Message</label>
              <textarea
                id="words"
                name="words"
                value={formData.words}
                onChange={handleInputChange}
                className="w-full p-3 border border-amber-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-300 bg-neutral-50"
                placeholder="Write your blessings and wishes"
                rows={5}
                maxLength={1000}
              />
            </div>
            <div>
              <label htmlFor="presence" className="block text-neutral-800 font-medium mb-2">Attendance</label>
              <select
                id="presence"
                name="presence"
                value={formData.presence}
                onChange={handleInputChange}
                className="w-full p-3 border border-amber-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-300 bg-neutral-50"
              >
                <option value="present">Will Attend</option>
                <option value="not_present">Will Not Attend</option>
              </select>
            </div>
            {formError && <p className="text-red-600">{formError}</p>}
            <button
              type="submit"
              className="bg-black text-white p-3 rounded-lg hover:bg-black transition-colors duration-300 w-full"
            >
              Send Wishes
            </button>
          </form>

          <div className="max-h-96 overflow-y-auto space-y-6">
            {congrats.length > 0 ? (
              congrats.map((congrat, index) => (
                <div
                  key={index}
                  className="p-6 bg-white rounded-lg shadow-md border-l-4 border-pink-200"
                >
                  <p className="text-amber-700 font-medium"><b>{congrat.name}</b></p>
                  <p className="text-neutral-800 mt-2">{congrat.words}</p>
                  <p className="text-neutral-600 text-sm mt-2">
                    {congrat.presence === 'present' ? 'Will Attend' : 'Will Not Attend'} •{' '}
                    {new Date(congrat.created_at).toLocaleDateString()}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-neutral-800 text-center">No wishes yet. Be the first to share your blessings!</p>
            )}
          </div>
        </section>

        <footer className="py-8 bg-pink-50 text-center text-neutral-800 relative">
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
    </div>
  );
}
