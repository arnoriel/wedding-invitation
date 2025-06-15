import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '../lib/supabase';

interface Wedding {
  id: string;
  groom_name: string;
  bride_name: string;
  date: string;
}

export default function Home() {
  const [weddings, setWeddings] = useState<Wedding[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchWeddings() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('wedding')
          .select('id, groom_name, bride_name, date')
          .order('date', { ascending: false });

        if (error) {
          console.error('Error fetching weddings:', error);
          throw error;
        }
        setWeddings(data || []);
      } catch (error) {
        console.error('Error fetching weddings:', error);
        alert('Failed to load wedding data.');
      } finally {
        setLoading(false);
      }
    }
    fetchWeddings();
  }, []);

  const handleDeleteWedding = async (weddingId: string, groomName: string, brideName: string) => {
    if (!confirm(`Are you sure you want to delete the wedding of ${groomName} & ${brideName}? This will also delete all related invites, moments, gifts, assets, and congratulatory messages. This action cannot be undone.`)) {
      return;
    }

    try {
      const { data: weddingData, error: weddingError } = await supabase
        .from('wedding')
        .select('groom_img, bride_img, modal_img')
        .eq('id', weddingId)
        .maybeSingle();
      if (weddingError) {
        console.error('Error fetching wedding:', weddingError);
        throw weddingError;
      }
      if (!weddingData) {
        console.error('No wedding found with ID:', weddingId);
        throw new Error('Wedding not found');
      }

      const imageUrls = [weddingData?.groom_img, weddingData?.bride_img, weddingData?.modal_img].filter(Boolean);
      if (imageUrls.length > 0) {
        const imagePaths = imageUrls.map((url) => url.split('/').slice(-1)[0]);
        const { error: imageDeleteError } = await supabase.storage
          .from('groom-images,bride-images,images')
          .remove(imagePaths);
        if (imageDeleteError) {
          console.error('Error deleting images:', imageDeleteError);
          throw imageDeleteError;
        }
      }

      const { data: momentsData, error: momentsError } = await supabase
        .from('moments')
        .select('moments_img')
        .eq('wedding_id', weddingId);
      if (momentsError) {
        console.error('Error fetching moments:', momentsError);
        throw momentsError;
      }

      const momentImageUrls = momentsData?.flatMap((moment) => moment.moments_img) || [];
      if (momentImageUrls.length > 0) {
        const momentImagePaths = momentImageUrls.map((url) => url.split('/').slice(-1)[0]);
        const { error: momentImageDeleteError } = await supabase.storage
          .from('moments-images')
          .remove(momentImagePaths);
        if (momentImageDeleteError) {
          console.error('Error deleting moment images:', momentImageDeleteError);
          throw momentImageDeleteError;
        }
      }

      const { data: assetData, error: assetError } = await supabase
        .from('assets')
        .select('music')
        .eq('wedding_id', weddingId)
        .maybeSingle();
      if (assetError) {
        console.error('Error fetching asset:', assetError);
        throw assetError;
      }

      if (assetData?.music) {
        const musicPath = assetData.music.split('/').slice(-1)[0];
        const { error: musicDeleteError } = await supabase.storage
          .from('music-assets')
          .remove([musicPath]);
        if (musicDeleteError) {
          console.error('Error deleting music:', musicDeleteError);
          throw musicDeleteError;
        }
      }

      const tables = ['invites', 'moments', 'gifts', 'assets', 'congrats'];
      for (const table of tables) {
        const { error } = await supabase
          .from(table)
          .delete()
          .eq('wedding_id', weddingId);
        if (error) {
          console.error(`Error deleting from ${table}:`, error);
          throw error;
        }
      }

      const { error: weddingDeleteError } = await supabase
        .from('wedding')
        .delete()
        .eq('id', weddingId);
      if (weddingDeleteError) {
        console.error('Error deleting wedding:', weddingDeleteError);
        throw weddingDeleteError;
      }

      setWeddings(weddings.filter((wedding) => wedding.id !== weddingId));
      alert('Wedding and all related data deleted successfully!');
    } catch (error) {
      console.error('Error deleting wedding:', error);
      alert('Failed to delete wedding and related data.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-ivory-50 to-pink-50 py-4 px-3">
      <div className="max-w-lg mx-auto relative">
        <h1 className="text-2xl font-bold text-center text-rose-700 mb-6 tracking-tight">
          Wedding Management
        </h1>

        {/* Wedding List */}
        <div className="mt-6 space-y-3">
          {loading ? (
            <p className="text-center text-gray-500 text-sm">Loading weddings...</p>
          ) : weddings.length > 0 ? (
            weddings.map((wedding) => (
              <div
                key={wedding.id}
                className="p-4 bg-white rounded-xl shadow-sm border border-rose-100 flex flex-col gap-3"
              >
                <Link href={`/cms?id=${wedding.id}`} className="flex-1">
                  <div>
                    <h2 className="text-lg font-semibold text-rose-600">
                      {wedding.groom_name} & {wedding.bride_name}
                    </h2>
                    <p className="text-gray-500 text-xs">
                      {new Date(wedding.date).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                </Link>
                <button
                  onClick={() => handleDeleteWedding(wedding.id, wedding.groom_name, wedding.bride_name)}
                  className="bg-red-500 text-white py-2 px-4 rounded-xl text-sm font-medium hover:bg-red-600 transition-colors duration-200 active:bg-red-700"
                >
                  Delete
                </button>
              </div>
            ))
          ) : (
            <p className="text-center text-gray-500 text-sm italic">No weddings found. Add a new one!</p>
          )}
        </div>

        {/* Floating Add New Wedding Button */}
        <Link href="/add">
          <button className="fixed bottom-4 right-4 bg-rose-500 text-white py-3 px-5 rounded-xl text-sm font-medium shadow-lg hover:bg-rose-600 transition-colors duration-200 active:bg-rose-700 flex items-center gap-2 z-50">
            <span>Add New +</span>
          </button>
        </Link>
      </div>
    </div>
  );
}
