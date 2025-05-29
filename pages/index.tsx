import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import Link from 'next/link'; // Import Link from Next.js

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

interface Asset {
  music: string;
}

export default function Wedding() {
  const [wedding, setWedding] = useState<Wedding | null>(null);
  const [moments, setMoments] = useState<Moment[]>([]);
  const [asset, setAsset] = useState<Asset | null>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch wedding details (limit to 1 for simplicity)
        const { data: weddingData, error: weddingError } = await supabase
          .from('wedding')
          .select('*')
          .limit(1)
          .single();
        if (weddingError) throw weddingError;
        setWedding(weddingData);

        // Fetch moments
        const { data: momentsData, error: momentsError } = await supabase
          .from('moments')
          .select('moments_img')
          .eq('wedding_id', weddingData.id);
        if (momentsError) throw momentsError;
        setMoments(momentsData || []);

        // Fetch assets (music)
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

  // Ensure audio plays on mount
  useEffect(() => {
    if (asset?.music && audioRef.current) {
      audioRef.current.play().catch((error) => {
        console.error('Auto-play error:', error);
        setIsPlaying(false); // Update state if auto-play fails
      });
    }
  }, [asset]);

  // Toggle play/pause for audio
  const toggleAudio = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch((error) => console.error('Play error:', error));
      }
      setIsPlaying(!isPlaying);
    }
  };

  if (!wedding) {
    return <div className="flex justify-center items-center h-screen text-gray-600 text-lg">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-ivory-50 font-sans">
      {/* Floating Play/Pause Button */}
      {asset?.music && (
        <button
          onClick={toggleAudio}
          className="fixed left-4 top-1/2 transform -translate-y-1/2 bg-pink-100 text-pink-600 p-4 rounded-full shadow-lg hover:bg-pink-200 transition-colors duration-300 z-50"
        >
          {isPlaying ? <SpeakerWaveIcon /> : <SpeakerXMarkIcon />}
        </button>
      )}

      {/* Audio Element */}
      {asset?.music && (
        <audio ref={audioRef} autoPlay src={asset.music} loop>
          Your browser does not support the audio element.
        </audio>
      )}

      {/* Hero Section */}
      <section className="flex flex-col items-center justify-center py-20 bg-cover bg-center" style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?ixlib=rb-4.0.3&auto=format&fit=crop&w=1350&q=80)' }}>
        <h1 className="text-4xl md:text-5xl font-serif text-white drop-shadow-md">
          {wedding.groom_name} & {wedding.bride_name}
        </h1>
        <p className="mt-4 text-xl md:text-2xl text-white drop-shadow-md">
          {wedding.day}, {wedding.date} at {wedding.time}
        </p>
        <p className="mt-2 text-lg text-white drop-shadow-md">{wedding.place}</p>
      </section>

      {/* Description Section */}
      {wedding.description && (
        <section className="py-16 px-4 md:px-8 max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-serif text-pink-600 mb-6">Our Story</h2>
          <p className="text-gray-700 text-lg leading-relaxed">{wedding.description}</p>
        </section>
      )}

      {/* Groom & Bride Section */}
      <section className="py-16 px-4 md:px-8 bg-white">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Groom */}
          <div className="text-center">
            {wedding.groom_img && (
              <img
                src={wedding.groom_img}
                alt={wedding.groom}
                className="w-64 h-64 object-cover rounded-full mx-auto mb-4 border-4 border-pink-200 shadow-lg"
              />
            )}
            <h3 className="text-2xl font-serif text-pink-600">{wedding.groom}</h3>
            <p className="text-gray-600 mt-2">{wedding.groom_name}</p>
            {wedding.groom_desc && <p className="text-gray-700 mt-4 leading-relaxed">{wedding.groom_desc}</p>}
          </div>
          {/* Bride */}
          <div className="text-center">
            {wedding.bride_img && (
              <img
                src={wedding.bride_img}
                alt={wedding.bride}
                className="w-64 h-64 object-cover rounded-full mx-auto mb-4 border-4 border-pink-200 shadow-lg"
              />
            )}
            <h3 className="text-2xl font-serif text-pink-600">{wedding.bride}</h3>
            <p className="text-gray-600 mt-2">{wedding.bride_name}</p>
            {wedding.bride_desc && <p className="text-gray-700 mt-4 leading-relaxed">{wedding.bride_desc}</p>}
          </div>
        </div>
      </section>

      {/* Moments Gallery */}
      {moments.length > 0 && (
        <section className="py-16 px-4 md:px-8 bg-pink-50">
          <h2 className="text-3xl md:text-4xl font-serif text-pink-600 text-center mb-8">Our Moments</h2>
          <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {moments.flatMap((moment) =>
              moment.moments_img.map((img, index) => (
                <img
                  key={index}
                  src={img}
                  alt={`Moment ${index + 1}`}
                  className="w-full h-64 object-cover rounded-lg shadow-md hover:scale-105 transition-transform duration-300"
                />
              ))
            )}
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="py-8 bg-pink-100 text-center text-gray-600">
        <p>Created with love for {wedding.groom_name} & {wedding.bride_name}</p>
        <Link href="/gifts">
          <button className="mt-4 bg-pink-500 text-white p-2 rounded hover:bg-pink-600 transition-colors duration-300">
            View Gift Envelopes
          </button>
        </Link>
      </footer>
    </div>
  );
}
