import { useRouter } from 'next/router';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface WeddingForm {
  groom_name: string;
  bride_name: string;
}

export default function Preview() {
  const router = useRouter();
  const { weddingId } = router.query;
  const [wedding, setWedding] = useState<WeddingForm | null>(null);
  const invitedName = 'Guest'; // Default invited name for preview

  useEffect(() => {
    async function fetchWeddingData() {
      if (weddingId) {
        try {
          const { data, error } = await supabase
            .from('wedding')
            .select('groom_name, bride_name')
            .eq('id', weddingId)
            .single();
          if (error) throw error;
          setWedding(data);
        } catch (error) {
          console.error('Error fetching wedding data:', error);
          alert('Failed to load wedding details.');
        }
      }
    }
    fetchWeddingData();
  }, [weddingId]);

  const generateShareLink = (invitedName: string) => {
    const baseUrl = 'https://pernikahan-kita.vercel.app';
    const encodedName = encodeURIComponent(invitedName);
    const encodedGroomName = encodeURIComponent(wedding?.groom_name || 'Mempelai Pria');
    const encodedBrideName = encodeURIComponent(wedding?.bride_name || 'Mempelai Wanita');
    return `${baseUrl}/wedding?weddingId=${weddingId}&groom_name=${encodedGroomName}&bride_name=${encodedBrideName}&invited_name=${encodedName}`;
  };

  const previewUrl = wedding ? generateShareLink(invitedName) : '';

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-ivory-50 to-pink-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-rose-100 p-4">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <h1 className="text-xl font-semibold text-rose-700">Preview Invitation</h1>
          <Link href={`/cms?id=${weddingId}`}>
            <button className="bg-rose-500 text-white py-2 px-4 rounded-xl text-sm font-medium hover:bg-rose-600 transition-colors duration-200 active:bg-rose-700">
              Go Back to CMS
            </button>
          </Link>
        </div>
      </header>

      {/* Webview */}
      <main className="flex-grow p-3">
        <div className="max-w-lg mx-auto h-[calc(100vh-80px)]">
          {previewUrl ? (
            <iframe
              src={previewUrl}
              className="w-full h-full border-0 rounded-xl shadow-sm"
              title="Wedding Invitation Preview"
            />
          ) : (
            <div className="flex items-center justify-center h-full bg-white rounded-xl shadow-sm border border-rose-100">
              <p className="text-gray-500 text-sm">Loading preview...</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}