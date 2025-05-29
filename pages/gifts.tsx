import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface Gift {
  envelope_name: string;
  envelope_number: string;
}

export default function Gifts() {
  const [gifts, setGifts] = useState<Gift[]>([]);
  const [weddingId, setWeddingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch wedding details to get wedding_id (assume one record)
        const { data: weddingData, error: weddingError } = await supabase
          .from('wedding')
          .select('id')
          .limit(1)
          .single();
        if (weddingError) throw weddingError;
        setWeddingId(weddingData.id);

        // Fetch gifts
        const { data: giftsData, error: giftsError } = await supabase
          .from('gifts')
          .select('envelope_name, envelope_number')
          .eq('wedding_id', weddingData.id);
        if (giftsError) throw giftsError;
        setGifts(giftsData || []);
      } catch (error) {
        console.error('Error fetching gifts:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return <div className="flex justify-center items-center h-screen text-gray-600 text-lg">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-ivory-50 font-sans py-16 px-4 md:px-8">
      <h1 className="text-3xl md:text-4xl font-serif text-pink-600 text-center mb-8">Gift Envelopes</h1>
      {gifts.length > 0 ? (
        <div className="max-w-4xl mx-auto space-y-4">
          {gifts.map((gift, index) => (
            <div
              key={index}
              className="p-4 bg-white rounded-lg shadow-md border-l-4 border-pink-300"
            >
              <p className="text-gray-700 font-medium">{gift.envelope_name}</p>
              <p className="text-gray-600">{gift.envelope_number}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-center text-gray-600">No gifts available.</p>
      )}
    </div>
  );
}