import { useState, useEffect, FormEvent } from 'react';
import { supabase } from '../lib/supabase';

interface WeddingForm {
  id?: string;
  groom: string;
  bride: string;
  groom_name: string;
  bride_name: string;
  groom_desc: string;
  bride_desc: string;
  groom_img: File | null;
  bride_img: File | null;
  description: string;
  place: string;
  date: string;
  day: string;
  time: string;
}

interface Moment {
  id: string;
  moments_img: string[];
}

interface Gift {
  id: string;
  envelope_name: string;
  envelope_number: string;
}

interface Asset {
  music: File | null;
}

export default function CMS() {
  const [wedding, setWedding] = useState<WeddingForm>({
    groom: '',
    bride: '',
    groom_name: '',
    bride_name: '',
    groom_desc: '',
    bride_desc: '',
    groom_img: null,
    bride_img: null,
    description: '',
    place: '',
    date: '',
    day: '',
    time: '',
  });
  const [moments, setMoments] = useState<Moment[]>([]);
  const [newMoments, setNewMoments] = useState<{ moments_img: File[] }>({ moments_img: [] });
  const [gifts, setGifts] = useState<Gift[]>([]);
  const [newGift, setNewGift] = useState<Gift>({ id: '', envelope_name: '', envelope_number: '' });
  const [asset, setAsset] = useState<Asset>({ music: null });
  const [weddingId, setWeddingId] = useState<string | null>(null);

  // Fetch existing wedding, moments, and gifts on mount
  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch wedding details (assume one record)
        const { data: weddingData, error: weddingError } = await supabase
          .from('wedding')
          .select('*')
          .limit(1)
          .single();
        if (weddingError && !weddingError.message.includes('No rows found')) throw weddingError;
        if (weddingData) {
          setWedding(weddingData);
          setWeddingId(weddingData.id);
        }

        // Fetch moments
        if (weddingData?.id) {
          const { data: momentsData, error: momentsError } = await supabase
            .from('moments')
            .select('id, moments_img')
            .eq('wedding_id', weddingData.id);
          if (momentsError) throw momentsError;
          setMoments(momentsData || []);
        }

        // Fetch gifts
        if (weddingData?.id) {
          const { data: giftsData, error: giftsError } = await supabase
            .from('gifts')
            .select('id, envelope_name, envelope_number')
            .eq('wedding_id', weddingData.id);
          if (giftsError) throw giftsError;
          setGifts(giftsData || []);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    }
    fetchData();
  }, []);

  const handleWeddingSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      // Upload images to Supabase Storage if new files are provided
      let groomImgUrl = wedding.groom_img ? '' : wedding.groom; // Keep existing URL if no new file
      let brideImgUrl = wedding.bride_img ? '' : wedding.bride; // Keep existing URL if no new file
      if (wedding.groom_img) {
        const { data, error } = await supabase.storage
          .from('groom-images')
          .upload(`groom-${Date.now()}.jpg`, wedding.groom_img, {
            cacheControl: '3600',
            upsert: false,
          });
        if (error) {
          console.error('Groom image upload error:', error);
          throw error;
        }
        groomImgUrl = supabase.storage.from('groom-images').getPublicUrl(data.path).data.publicUrl;
      }
      if (wedding.bride_img) {
        const { data, error } = await supabase.storage
          .from('bride-images')
          .upload(`bride-${Date.now()}.jpg`, wedding.bride_img, {
            cacheControl: '3600',
            upsert: false,
          });
        if (error) {
          console.error('Bride image upload error:', error);
          throw error;
        }
        brideImgUrl = supabase.storage.from('bride-images').getPublicUrl(data.path).data.publicUrl;
      }

      // Update or insert wedding data
      if (weddingId) {
        // Update existing wedding
        const { error } = await supabase
          .from('wedding')
          .update({
            groom: wedding.groom,
            bride: wedding.bride,
            groom_name: wedding.groom_name,
            bride_name: wedding.bride_name,
            groom_desc: wedding.groom_desc,
            bride_desc: wedding.bride_desc,
            groom_img: groomImgUrl || wedding.groom_img,
            bride_img: brideImgUrl || wedding.bride_img,
            description: wedding.description,
            place: wedding.place,
            date: wedding.date,
            day: wedding.day,
            time: wedding.time,
          })
          .eq('id', weddingId);
        if (error) {
          console.error('Wedding update error:', error);
          throw error;
        }
        alert('Wedding details updated!');
      } else {
        // Insert new wedding (first time)
        const { data, error } = await supabase
          .from('wedding')
          .insert({
            groom: wedding.groom,
            bride: wedding.bride,
            groom_name: wedding.groom_name,
            bride_name: wedding.bride,
            groom_desc: wedding.groom_desc,
            bride_desc: wedding.bride_desc,
            groom_img: groomImgUrl,
            bride_img: brideImgUrl,
            description: wedding.description,
            place: wedding.place,
            date: wedding.date,
            day: wedding.day,
            time: wedding.time,
          })
          .select()
          .single();
        if (error) {
          console.error('Wedding insert error:', error);
          throw error;
        }
        setWeddingId(data.id);
        alert('Wedding details saved!');
      }
    } catch (error) {
      console.error('Error saving wedding:', error);
      alert('Failed to save wedding details.');
    }
  };

  const handleMomentsSubmit = async (e: FormEvent) => {
  e.preventDefault();
  if (!weddingId) {
    alert('Please save wedding details first.');
    return;
  }
  try {
    const momentImgUrls: string[] = [];
    // Iterate over the files in newMoments.moments_img
    for (const [index, img] of newMoments.moments_img.entries()) {
      const { data, error } = await supabase.storage
        .from('moments-images')
        .upload(`moment-${Date.now()}-${index}.jpg`, img, {
          cacheControl: '3600',
          upsert: false,
        });
      if (error) {
        console.error('Moments image upload error:', error);
        throw error;
      }
      // Get the public URL and push it to momentImgUrls
      const publicUrl = supabase.storage.from('moments-images').getPublicUrl(data.path).data.publicUrl;
      momentImgUrls.push(publicUrl);
    }
    if (momentImgUrls.length > 0) {
      const { data, error } = await supabase
        .from('moments')
        .insert({ wedding_id: weddingId, moments_img: momentImgUrls })
        .select();
      if (error) {
        console.error('Moments insert error:', error);
        throw error;
      }
      setMoments([...moments, ...data]);
      alert('Moments saved!');
      setNewMoments({ moments_img: [] });
    }
  } catch (error) {
    console.error('Error saving moments:', error);
    alert('Failed to save moments.');
  }
};

  const handleDeleteMoment = async (momentId: string, images: string[]) => {
    try {
      // Delete images from storage
      const imagePaths = images.map((url) => url.split('/').slice(-1)[0]);
      const { error: storageError } = await supabase.storage
        .from('moments-images')
        .remove(imagePaths);
      if (storageError) {
        console.error('Error deleting moment images:', storageError);
        throw storageError;
      }

      // Delete moment from database
      const { error } = await supabase.from('moments').delete().eq('id', momentId);
      if (error) {
        console.error('Error deleting moment:', error);
        throw error;
      }

      setMoments(moments.filter((moment) => moment.id !== momentId));
      alert('Moment deleted!');
    } catch (error) {
      console.error('Error deleting moment:', error);
      alert('Failed to delete moment.');
    }
  };

  const handleGiftSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!weddingId) {
      alert('Please save wedding details first.');
      return;
    }
    try {
      const { data, error } = await supabase
        .from('gifts')
        .insert({ wedding_id: weddingId, ...newGift })
        .select();
      if (error) {
        console.error('Gift insert error:', error);
        throw error;
      }
      setGifts([...gifts, ...data]);
      alert('Gift saved!');
      setNewGift({ id: '', envelope_name: '', envelope_number: '' });
    } catch (error) {
      console.error('Error saving gift:', error);
      alert('Failed to save gift.');
    }
  };

  const handleDeleteGift = async (giftId: string) => {
    try {
      const { error } = await supabase.from('gifts').delete().eq('id', giftId);
      if (error) {
        console.error('Error deleting gift:', error);
        throw error;
      }
      setGifts(gifts.filter((gift) => gift.id !== giftId));
      alert('Gift deleted!');
    } catch (error) {
      console.error('Error deleting gift:', error);
      alert('Failed to delete gift.');
    }
  };

  const handleAssetSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!weddingId) {
      alert('Please save wedding details first.');
      return;
    }
    try {
      let musicUrl = '';
      if (asset.music) {
        const { data, error } = await supabase.storage
          .from('music-assets')
          .upload(`music-${Date.now()}.mp3`, asset.music, {
            cacheControl: '3600',
            upsert: false,
          });
        if (error) {
          console.error('Music upload error:', error);
          throw error;
        }
        musicUrl = supabase.storage.from('music-assets').getPublicUrl(data.path).data.publicUrl;
      }

      await supabase.from('assets').insert({ wedding_id: weddingId, music: musicUrl });
      alert('Music asset saved!');
      setAsset({ music: null });
    } catch (error) {
      console.error('Error saving asset:', error);
      alert('Failed to save asset.');
    }
  };

  return (
    <div className="container mx-auto p-4 bg-gradient-to-b from-pink-50 to-ivory-50">
      <h1 className="text-3xl font-bold mb-6 text-pink-600 text-center">Wedding Invitation CMS</h1>

      {/* Wedding Form */}
      <form onSubmit={handleWeddingSubmit} className="mb-8 p-4 bg-white rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4 text-pink-600">Wedding Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="Groom"
            value={wedding.groom}
            onChange={(e) => setWedding({ ...wedding, groom: e.target.value })}
            className="p-2 border rounded focus:outline-none focus:ring-2 focus:ring-pink-300"
            required
          />
          <input
            type="text"
            placeholder="Bride"
            value={wedding.bride}
            onChange={(e) => setWedding({ ...wedding, bride: e.target.value })}
            className="p-2 border rounded focus:outline-none focus:ring-2 focus:ring-pink-300"
            required
          />
          <input
            type="text"
            placeholder="Groom Name"
            value={wedding.groom_name}
            onChange={(e) => setWedding({ ...wedding, groom_name: e.target.value })}
            className="p-2 border rounded focus:outline-none focus:ring-2 focus:ring-pink-300"
            required
          />
          <input
            type="text"
            placeholder="Bride Name"
            value={wedding.bride_name}
            onChange={(e) => setWedding({ ...wedding, bride_name: e.target.value })}
            className="p-2 border rounded focus:outline-none focus:ring-2 focus:ring-pink-300"
            required
          />
          <textarea
            placeholder="Groom Description"
            value={wedding.groom_desc}
            onChange={(e) => setWedding({ ...wedding, groom_desc: e.target.value })}
            className="p-2 border rounded focus:outline-none focus:ring-2 focus:ring-pink-300"
          />
          <textarea
            placeholder="Bride Description"
            value={wedding.bride_desc}
            onChange={(e) => setWedding({ ...wedding, bride_desc: e.target.value })}
            className="p-2 border rounded focus:outline-none focus:ring-2 focus:ring-pink-300"
          />
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setWedding({ ...wedding, groom_img: e.target.files?.[0] || null })}
            className="p-2"
          />
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setWedding({ ...wedding, bride_img: e.target.files?.[0] || null })}
            className="p-2"
          />
          <textarea
            placeholder="Description"
            value={wedding.description}
            onChange={(e) => setWedding({ ...wedding, description: e.target.value })}
            className="p-2 border rounded focus:outline-none focus:ring-2 focus:ring-pink-300"
          />
          <input
            type="text"
            placeholder="Place"
            value={wedding.place}
            onChange={(e) => setWedding({ ...wedding, place: e.target.value })}
            className="p-2 border rounded focus:outline-none focus:ring-2 focus:ring-pink-300"
            required
          />
          <input
            type="date"
            value={wedding.date}
            onChange={(e) => setWedding({ ...wedding, date: e.target.value })}
            className="p-2 border rounded focus:outline-none focus:ring-2 focus:ring-pink-300"
            required
          />
          <input
            type="text"
            placeholder="Day (e.g., Saturday)"
            value={wedding.day}
            onChange={(e) => setWedding({ ...wedding, day: e.target.value })}
            className="p-2 border rounded focus:outline-none focus:ring-2 focus:ring-pink-300"
            required
          />
          <input
            type="time"
            value={wedding.time}
            onChange={(e) => setWedding({ ...wedding, time: e.target.value })}
            className="p-2 border rounded focus:outline-none focus:ring-2 focus:ring-pink-300"
            required
          />
        </div>
        <button type="submit" className="mt-4 bg-pink-500 text-white p-2 rounded hover:bg-pink-600 transition-colors duration-300">
          {weddingId ? 'Update Wedding Details' : 'Save Wedding Details'}
        </button>
      </form>

      {/* Moments Section */}
      <div className="mb-8 p-4 bg-white rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4 text-pink-600">Moments</h2>
        {/* Add Moments Form */}
        <form onSubmit={handleMomentsSubmit} className="mb-4">
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => setNewMoments({ moments_img: Array.from(e.target.files || []) })}
            className="p-2 mb-2"
          />
          <button type="submit" className="bg-pink-500 text-white p-2 rounded hover:bg-pink-600 transition-colors duration-300">
            Add Moments
          </button>
        </form>
        {/* Display Moments */}
        {moments.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {moments.map((moment) =>
              moment.moments_img.map((img, index) => (
                <div key={`${moment.id}-${index}`} className="relative">
                  <img
                    src={img}
                    alt={`Moment ${index + 1}`}
                    className="w-full h-48 object-cover rounded-lg shadow-md"
                  />
                  <button
                    onClick={() => handleDeleteMoment(moment.id, moment.moments_img)}
                    className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors duration-300"
                  >
                    Delete
                  </button>
                </div>
              ))
            )}
          </div>
        ) : (
          <p className="text-gray-600">No moments added yet.</p>
        )}
      </div>

      {/* Gifts Section */}
      <div className="mb-8 p-4 bg-white rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4 text-pink-600">Gift Envelopes</h2>
        {/* Add Gift Form */}
        <form onSubmit={handleGiftSubmit} className="mb-4">
          <input
            type="text"
            placeholder="Envelope Name"
            value={newGift.envelope_name}
            onChange={(e) => setNewGift({ ...newGift, envelope_name: e.target.value })}
            className="p-2 border rounded mb-2 focus:outline-none focus:ring-2 focus:ring-pink-300"
            required
          />
          <input
            type="text"
            placeholder="Envelope Number"
            value={newGift.envelope_number}
            onChange={(e) => setNewGift({ ...newGift, envelope_number: e.target.value })}
            className="p-2 border rounded mb-2 focus:outline-none focus:ring-2 focus:ring-pink-300"
            required
          />
          <button type="submit" className="bg-pink-500 text-white p-2 rounded hover:bg-pink-600 transition-colors duration-300">
            Add Gift
          </button>
        </form>
        {/* Display Gifts */}
        {gifts.length > 0 ? (
          <div className="space-y-4">
            {gifts.map((gift) => (
              <div
                key={gift.id}
                className="p-4 bg-gray-50 rounded-lg shadow-sm border-l-4 border-pink-300 flex justify-between items-center"
              >
                <div>
                  <p className="text-gray-700 font-medium">{gift.envelope_name}</p>
                  <p className="text-gray-600">{gift.envelope_number}</p>
                </div>
                <button
                  onClick={() => handleDeleteGift(gift.id)}
                  className="bg-red-500 text-white p-2 rounded hover:bg-red-600 transition-colors duration-300"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-600">No gifts added yet.</p>
        )}
      </div>

      {/* Assets Form */}
      <form onSubmit={handleAssetSubmit} className="p-4 bg-white rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4 text-pink-600">Add Music</h2>
        <input
          type="file"
          accept="audio/mp3"
          onChange={(e) => setAsset({ music: e.target.files?.[0] || null })}
          className="p-2"
        />
        <button type="submit" className="mt-4 bg-pink-500 text-white p-2 rounded hover:bg-pink-600 transition-colors duration-300">
          Save Music
        </button>
      </form>
    </div>
  );
}
