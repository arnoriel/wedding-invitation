import { useState, useEffect, FormEvent } from 'react';
import { supabase } from '../lib/supabase';
import Image from 'next/image';

interface WeddingForm {
    id?: string;
    groom: string;
    bride: string;
    groom_name: string;
    bride_name: string;
    groom_desc: string;
    bride_desc: string;
    groom_img: File | null | string;
    bride_img: File | null | string;
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

interface NewGift {
    envelope_name: string;
    envelope_number: string;
}

interface Asset {
    id?: string;
    music: File | null;
    music_url: string | null;
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
    const [newGift, setNewGift] = useState<NewGift>({ envelope_name: '', envelope_number: '' });
    const [asset, setAsset] = useState<Asset>({ id: undefined, music: null, music_url: null });
    const [weddingId, setWeddingId] = useState<string | null>(null);

    useEffect(() => {
        async function fetchData() {
            try {
                const { data: weddingData, error: weddingError } = await supabase
                    .from('wedding')
                    .select('*')
                    .limit(1)
                    .single();
                if (weddingError && !weddingError.message.includes('No rows found')) throw weddingError;
                if (weddingData) {
                    setWedding({
                        ...weddingData,
                        groom_img: weddingData.groom_img || null,
                        bride_img: weddingData.bride_img || null,
                    });
                    setWeddingId(weddingData.id);
                }

                if (weddingData?.id) {
                    const { data: momentsData, error: momentsError } = await supabase
                        .from('moments')
                        .select('id, moments_img')
                        .eq('wedding_id', weddingData.id);
                    if (momentsError) throw momentsError;
                    setMoments(momentsData || []);

                    const { data: giftsData, error: giftsError } = await supabase
                        .from('gifts')
                        .select('id, envelope_name, envelope_number')
                        .eq('wedding_id', weddingData.id);
                    if (giftsError) throw giftsError;
                    setGifts(giftsData || []);

                    const { data: assetData, error: assetError } = await supabase
                        .from('assets')
                        .select('id, music')
                        .eq('wedding_id', weddingData.id)
                        .single();
                    if (assetError && !assetError.message.includes('No rows found')) throw assetError;
                    if (assetData) {
                        setAsset({ id: assetData.id, music: null, music_url: assetData.music });
                    }
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
            let groomImgUrl = typeof wedding.groom_img === 'string' ? wedding.groom_img : wedding.groom;
            let brideImgUrl = typeof wedding.bride_img === 'string' ? wedding.bride_img : wedding.bride;

            if (wedding.groom_img instanceof File) {
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
            if (wedding.bride_img instanceof File) {
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

            if (weddingId) {
                const { error } = await supabase
                    .from('wedding')
                    .update({
                        groom: wedding.groom,
                        bride: wedding.bride,
                        groom_name: wedding.groom_name,
                        bride_name: wedding.bride_name,
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
                    .eq('id', weddingId);
                if (error) {
                    console.error('Wedding update error:', error);
                    throw error;
                }
                alert('Wedding details updated!');
            } else {
                const { data, error } = await supabase
                    .from('wedding')
                    .insert({
                        groom: wedding.groom,
                        bride: wedding.bride,
                        groom_name: wedding.groom_name,
                        bride_name: wedding.bride_name,
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
            setWedding({
                ...wedding,
                groom_img: groomImgUrl,
                bride_img: brideImgUrl,
            });
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
            const imagePaths = images.map((url) => url.split('/').slice(-1)[0]);
            const { error: storageError } = await supabase.storage
                .from('moments-images')
                .remove(imagePaths);
            if (storageError) {
                console.error('Error deleting moment images:', storageError);
                throw storageError;
            }

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
                .insert({
                    wedding_id: weddingId,
                    envelope_name: newGift.envelope_name,
                    envelope_number: newGift.envelope_number,
                })
                .select();
            if (error) {
                console.error('Gift insert error:', error);
                throw error;
            }
            setGifts([...gifts, ...data]);
            alert('Gift saved!');
            setNewGift({ envelope_name: '', envelope_number: '' });
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
            let musicUrl = asset.music_url;
            if (asset.music) {
                if (asset.music_url) {
                    const oldFilePath = asset.music_url.split('/').slice(-1)[0];
                    const { error: deleteError } = await supabase.storage
                        .from('music-assets')
                        .remove([oldFilePath]);
                    if (deleteError) {
                        console.error('Error deleting old music file:', deleteError);
                        throw deleteError;
                    }
                }

                const fileName = `music-${weddingId}.mp3`;
                const { data, error } = await supabase.storage
                    .from('music-assets')
                    .upload(fileName, asset.music, {
                        cacheControl: '3600',
                        upsert: true,
                    });
                if (error) {
                    console.error('Music upload error:', error);
                    throw error;
                }
                musicUrl = supabase.storage.from('music-assets').getPublicUrl(data.path).data.publicUrl;
            }

            if (asset.id) {
                const { error } = await supabase
                    .from('assets')
                    .update({ music: musicUrl })
                    .eq('id', asset.id);
                if (error) {
                    console.error('Asset update error:', error);
                    throw error;
                }
            } else {
                const { data, error } = await supabase
                    .from('assets')
                    .insert({ wedding_id: weddingId, music: musicUrl })
                    .select()
                    .single();
                if (error) {
                    console.error('Asset insert error:', error);
                    throw error;
                }
                setAsset({ id: data.id, music: null, music_url: musicUrl });
            }

            alert('Music asset updated!');
            setAsset((prev) => ({ ...prev, music: null }));
        } catch (error) {
            console.error('Error updating asset:', error);
            alert('Failed to update music asset.');
        }
    };

    const handleDeleteAllCongrats = async () => {
        if (!weddingId) {
            alert('Please save wedding details first.');
            return;
        }
        if (!confirm('Are you sure you want to delete all congratulatory messages? This action cannot be undone.')) {
            return;
        }
        try {
            console.log('Attempting to delete congrats for wedding_id:', weddingId);

            const { data: congratsData, error: fetchError } = await supabase
                .from('congrats')
                .select('id')
                .eq('wedding_id', weddingId);
            if (fetchError) {
                console.error('Error fetching congrats:', fetchError);
                throw fetchError;
            }
            console.log('Found congrats entries:', congratsData.length);

            const { error, count } = await supabase
                .from('congrats')
                .delete()
                .eq('wedding_id', weddingId);

            if (error) {
                console.error('Error deleting all congrats:', error);
                throw error;
            }

            console.log('Deleted congrats count:', count);

            if (count === 0) {
                alert('No congratulatory messages found to delete.');
            } else {
                alert(`Successfully deleted ${count} congratulatory message(s)!`);
            }
        } catch (error) {
            console.error('Error deleting all congrats:', (error as Error).message);
            alert(`Failed to delete congratulatory messages: ${(error as Error).message}`);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-rose-50 via-ivory-50 to-pink-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-4xl font-extrabold text-center text-rose-700 mb-12 tracking-tight">
                    Wedding Invitation CMS
                </h1>

                {/* Wedding Details Section */}
                <form
                    onSubmit={handleWeddingSubmit}
                    className="mb-12 p-8 bg-white rounded-2xl shadow-lg border border-rose-100"
                >
                    <h2 className="text-2xl font-semibold mb-6 text-rose-600">Wedding Details</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Nama Panggilan Pengantin Pria</label>
                            <input
                                type="text"
                                value={wedding.groom}
                                onChange={(e) => setWedding({ ...wedding, groom: e.target.value })}
                                className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-300 transition-colors"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Nama Panggilan Pengantin Wanita</label>
                            <input
                                type="text"
                                value={wedding.bride}
                                onChange={(e) => setWedding({ ...wedding, bride: e.target.value })}
                                className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-300 transition-colors"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap Pengantin Pria</label>
                            <input
                                type="text"
                                value={wedding.groom_name}
                                onChange={(e) => setWedding({ ...wedding, groom_name: e.target.value })}
                                className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-300 transition-colors"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap Pengantin Wanita</label>
                            <input
                                type="text"
                                value={wedding.bride_name}
                                onChange={(e) => setWedding({ ...wedding, bride_name: e.target.value })}
                                className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-300 transition-colors"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi Pengantin Pria</label>
                            <textarea
                                value={wedding.groom_desc}
                                onChange={(e) => setWedding({ ...wedding, groom_desc: e.target.value })}
                                className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-300 transition-colors"
                                rows={4}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi Pengantin Wanita</label>
                            <textarea
                                value={wedding.bride_desc}
                                onChange={(e) => setWedding({ ...wedding, bride_desc: e.target.value })}
                                className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-300 transition-colors"
                                rows={4}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Foto Pengantin Pria</label>
                            {typeof wedding.groom_img === 'string' && wedding.groom_img && (
                                <div className="mb-4 relative w-full h-40">
                                    <Image
                                        src={wedding.groom_img}
                                        alt="Current Groom Image"
                                        fill
                                        className="object-cover rounded-lg shadow-sm"
                                        sizes="(max-width: 640px) 100vw, 50vw"
                                    />
                                </div>
                            )}
                            {!wedding.groom_img && (
                                <p className="text-gray-500 text-sm mb-2">No image uploaded yet.</p>
                            )}
                            <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => setWedding({ ...wedding, groom_img: e.target.files?.[0] || null })}
                                className="w-full p-3 text-gray-600 file:mr-4 file:py-2 file:px- pharmacological-4 file:rounded-lg file:border-0 file:bg-rose-100 file:text-rose-700 hover:file:bg-rose-200 transition-colors"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Foto Pengantin Wanita</label>
                            {typeof wedding.bride_img === 'string' && wedding.bride_img && (
                                <div className="mb-4 relative w-full h-40">
                                    <Image
                                        src={wedding.bride_img}
                                        alt="Current Bride Image"
                                        fill
                                        className="object-cover rounded-lg shadow-sm"
                                        sizes="(max-width: 640px) 100vw, 50vw"
                                    />
                                </div>
                            )}
                            {!wedding.bride_img && (
                                <p className="text-gray-500 text-sm mb-2">No image uploaded yet.</p>
                            )}
                            <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => setWedding({ ...wedding, bride_img: e.target.files?.[0] || null })}
                                className="w-full p-3 text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-rose-100 file:text-rose-700 hover:file:bg-rose-200 transition-colors"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Ucapan Pembukaan</label>
                            <textarea
                                value={wedding.description}
                                onChange={(e) => setWedding({ ...wedding, description: e.target.value })}
                                className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-300 transition-colors"
                                rows={4}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Lokasi</label>
                            <input
                                type="text"
                                value={wedding.place}
                                onChange={(e) => setWedding({ ...wedding, place: e.target.value })}
                                className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-300 transition-colors"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal</label>
                            <input
                                type="date"
                                value={wedding.date}
                                onChange={(e) => setWedding({ ...wedding, date: e.target.value })}
                                className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-300 transition-colors"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Hari</label>
                            <input
                                type="text"
                                value={wedding.day}
                                onChange={(e) => setWedding({ ...wedding, day: e.target.value })}
                                className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-300 transition-colors"
                                placeholder="e.g., Saturday"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Waktu</label>
                            <input
                                type="time"
                                value={wedding.time}
                                onChange={(e) => setWedding({ ...wedding, time: e.target.value })}
                                className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-300 transition-colors"
                                required
                            />
                        </div>
                    </div>
                    <button
                        type="submit"
                        className="mt-6 w-full bg-rose-500 text-white py-3 rounded-lg hover:bg-rose-600 transition-colors duration-300 font-medium"
                    >
                        {weddingId ? 'Update Wedding Details' : 'Save Wedding Details'}
                    </button>
                </form>

                {/* Moments Section */}
                <div className="mb-12 p-8 bg-white rounded-2xl shadow-lg border border-rose-100">
                    <h2 className="text-2xl font-semibold mb-6 text-rose-600">Moments</h2>
                    <form onSubmit={handleMomentsSubmit} className="mb-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Upload Moment Images</label>
                            <input
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={(e) => setNewMoments({ moments_img: Array.from(e.target.files || []) })}
                                className="w-full p-3 text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-rose-100 file:text-rose-700 hover:file:bg-rose-200 transition-colors"
                            />
                        </div>
                        <button
                            type="submit"
                            className="mt-4 bg-rose-500 text-white py-3 px-6 rounded-lg hover:bg-rose-600 transition-colors duration-300 font-medium"
                        >
                            Add Moments
                        </button>
                    </form>
                    {moments.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                            {moments.map((moment) =>
                                moment.moments_img.map((img, index) => (
                                    <div key={`${moment.id}-${index}`} className="relative w-full h-64 group">
                                        <Image
                                            src={img}
                                            alt={`Moment ${index + 1}`}
                                            fill
                                            className="object-cover rounded-lg shadow-md transition-transform duration-300 group-hover:scale-105"
                                            sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw"
                                        />
                                        <button
                                            onClick={() => handleDeleteMoment(moment.id, moment.moments_img)}
                                            className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors duration-300 opacity-0 group-hover:opacity-100"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    ) : (
                        <p className="text-gray-500 italic">No moments added yet.</p>
                    )}
                </div>

                {/* Gift Envelopes Section */}
                <div className="mb-12 p-8 bg-white rounded-2xl shadow-lg border border-rose-100">
                    <h2 className="text-2xl font-semibold mb-6 text-rose-600">Gift Envelopes</h2>
                    <form onSubmit={handleGiftSubmit} className="mb-6 space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Envelope Name</label>
                            <input
                                type="text"
                                value={newGift.envelope_name}
                                onChange={(e) => setNewGift({ ...newGift, envelope_name: e.target.value })}
                                className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-300 transition-colors"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Envelope Number</label>
                            <input
                                type="text"
                                value={newGift.envelope_number}
                                onChange={(e) => setNewGift({ ...newGift, envelope_number: e.target.value })}
                                className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-300 transition-colors"
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            className="w-full bg-rose-500 text-white py-3 rounded-lg hover:bg-rose-600 transition-colors duration-300 font-medium"
                        >
                            Add Gift
                        </button>
                    </form>
                    {gifts.length > 0 ? (
                        <div className="space-y-4">
                            {gifts.map((gift) => (
                                <div
                                    key={gift.id}
                                    className="p-4 bg-rose-50 rounded-lg shadow-sm border-l-4 border-rose-300 flex justify-between items-center transition-transform duration-300 hover:shadow-md"
                                >
                                    <div>
                                        <p className="text-gray-700 font-medium">{gift.envelope_name}</p>
                                        <p className="text-gray-500 text-sm">{gift.envelope_number}</p>
                                    </div>
                                    <button
                                        onClick={() => handleDeleteGift(gift.id)}
                                        className="bg-red-500 text-white py-2 px-4 rounded-lg hover:bg-red-600 transition-colors duration-300"
                                    >
                                        Delete
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-gray-500 italic">No gifts added yet.</p>
                    )}
                </div>

                {/* Music Section */}
                <form
                    onSubmit={handleAssetSubmit}
                    className="mb-12 p-8 bg-white rounded-2xl shadow-lg border border-rose-100"
                >
                    <h2 className="text-2xl font-semibold mb-6 text-rose-600">Update Music</h2>
                    {asset.music_url && (
                        <div className="mb-4">
                            <p className="text-gray-600">
                                Current Music:{' '}
                                <a
                                    href={asset.music_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-rose-600 underline hover:text-rose-700"
                                >
                                    Listen to current music
                                </a>
                            </p>
                        </div>
                    )}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Upload Music File</label>
                        <input
                            type="file"
                            accept="audio/mp3"
                            onChange={(e) => setAsset({ ...asset, music: e.target.files?.[0] || null })}
                            className="w-full p-3 text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-rose-100 file:text-rose-700 hover:file:bg-rose-200 transition-colors"
                        />
                    </div>
                    <button
                        type="submit"
                        className="mt-4 w-full bg-rose-500 text-white py-3 rounded-lg hover:bg-rose-600 transition-colors duration-300 font-medium"
                    >
                        Update Music
                    </button>
                </form>

                {/* Manage Congrats Section */}
                <div className="p-8 bg-white rounded-2xl shadow-lg border border-rose-100">
                    <h2 className="text-2xl font-semibold mb-6 text-rose-600">Manage Congrats</h2>
                    <button
                        onClick={handleDeleteAllCongrats}
                        className="w-full bg-red-500 text-white py-3 rounded-lg hover:bg-red-600 transition-colors duration-300 font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
                        disabled={!weddingId}
                    >
                        Delete All Congrats
                    </button>
                </div>
            </div>
        </div>
    );
}
