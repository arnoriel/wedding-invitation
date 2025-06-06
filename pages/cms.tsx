import { useState, useEffect, FormEvent, useRef } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';
import Link from 'next/link';
import ReactCrop, { Crop, PixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { supabase } from '@/lib/supabase';

interface WeddingForm {
    id?: string;
    groom: string;
    bride: string;
    groom_name: string;
    bride_name: string;
    groom_initial: string;
    bride_initial: string;
    groom_desc: string;
    bride_desc: string;
    groom_img: File | null | string;
    bride_img: File | null | string;
    modal_img: File | null | string;
    description: string;
    place: string;
    date: string;
    day: string;
    time: string;
    contract_time: string;
    invite_desc: string;
}

interface Moment {
    id: string;
    moments_img: string[];
}

interface Gift {
    id: string;
    envelope_name: string;
    envelope_number: string;
    rek_name: string;
}

interface Asset {
    id?: string;
    music: File | null;
    music_url: string | null;
}

interface NewGift {
    envelope_name: string;
    envelope_number: string;
    rek_name: string;
}

export default function CMS() {
    const [wedding, setWedding] = useState<WeddingForm>({
        groom: '',
        bride: '',
        groom_name: '',
        bride_name: '',
        groom_initial: '',
        bride_initial: '',
        groom_desc: '',
        bride_desc: '',
        groom_img: null,
        bride_img: null,
        modal_img: null,
        description: '',
        place: '',
        date: '',
        day: '',
        time: '',
        contract_time: '',
        invite_desc: '',
    });
    const [moments, setMoments] = useState<Moment[]>([]);
    const [newMoments, setNewMoments] = useState<{ moments_img: File[] }>({ moments_img: [] });
    const [gifts, setGifts] = useState<Gift[]>([]);
    const [newGift, setNewGift] = useState<NewGift>({ envelope_name: '', envelope_number: '', rek_name: '' });
    const [asset, setAsset] = useState<Asset>({ id: undefined, music: null, music_url: null });
    const [weddingId, setWeddingId] = useState<string | null>(null);
    const router = useRouter();
    const { id } = router.query;

    // Cropper state
    const [crop, setCrop] = useState<Crop>({ unit: '%', x: 25, y: 25, width: 50, height: 50 });
    const [croppedImage, setCroppedImage] = useState<Blob | null>(null);
    const [imageToCrop, setImageToCrop] = useState<string | null>(null);
    const [cropField, setCropField] = useState<'groom_img' | 'bride_img' | null>(null);
    const imageRef = useRef<HTMLImageElement | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    useEffect(() => {
        async function fetchData() {
            try {
                let weddingData = null;
                if (id) {
                    const { data, error } = await supabase
                        .from('wedding')
                        .select('*')
                        .eq('id', id)
                        .single();
                    if (error && !error.message.includes('No rows found')) throw error;
                    weddingData = data;
                } else {
                    const { data, error } = await supabase
                        .from('wedding')
                        .select('*')
                        .limit(1)
                        .single();
                    if (error && !error.message.includes('No rows found')) throw error;
                    weddingData = data;
                }

                if (weddingData) {
                    setWedding({
                        ...weddingData,
                        groom_img: weddingData.groom_img || null,
                        bride_img: weddingData.bride_img || null,
                        modal_img: weddingData.modal_img || null,
                        groom_initial: weddingData.groom_initial || '',
                        bride_initial: weddingData.bride_initial || '',
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
                        .select('id, envelope_name, envelope_number, rek_name')
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
    }, [id]);

    const getCroppedImg = async (image: HTMLImageElement, crop: PixelCrop): Promise<Blob> => {
        const canvas = canvasRef.current || document.createElement('canvas');
        canvasRef.current = canvas;
        const scaleX = image.naturalWidth / image.width;
        const scaleY = image.naturalHeight / image.height;
        canvas.width = crop.width * scaleX;
        canvas.height = crop.height * scaleY;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Canvas context not available');

        ctx.drawImage(
            image,
            crop.x * scaleX,
            crop.y * scaleY,
            crop.width * scaleX,
            crop.height * scaleY,
            0,
            0,
            crop.width * scaleX,
            crop.height * scaleY
        );

        return new Promise((resolve) => {
            canvas.toBlob((blob) => {
                if (blob) resolve(blob);
            }, 'image/jpeg', 1);
        });
    };

    const handleCropComplete = async (crop: PixelCrop) => {
        if (imageRef.current && crop.width && crop.height) {
            try {
                const croppedBlob = await getCroppedImg(imageRef.current, crop);
                setCroppedImage(croppedBlob);
            } catch (error) {
                console.error('Error cropping image:', error);
                alert('Failed to crop image.');
            }
        }
    };

    const handleCropSave = () => {
        if (croppedImage && cropField) {
            const file = new File([croppedImage], `${cropField}-${Date.now()}.jpg`, { type: 'image/jpeg' });
            setWedding({ ...wedding, [cropField]: file });
            setImageToCrop(null);
            setCropField(null);
            setCroppedImage(null);
        }
    };

    const handleCropCancel = () => {
        setImageToCrop(null);
        setCropField(null);
        setCroppedImage(null);
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>, field: 'groom_img' | 'bride_img') => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = () => {
                setImageToCrop(reader.result as string);
                setCropField(field);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleWeddingSubmit = async (e: FormEvent) => {
        e.preventDefault();
        try {
            let groomImgUrl = typeof wedding.groom_img === 'string' ? wedding.groom_img : wedding.groom;
            let brideImgUrl = typeof wedding.bride_img === 'string' ? wedding.bride_img : wedding.bride;
            let modalImgUrl = typeof wedding.modal_img === 'string' ? wedding.modal_img : null;

            if (wedding.groom_img instanceof File) {
                const { data, error } = await supabase.storage
                    .from('groom-images')
                    .upload(`groom-${Date.now()}.jpg`, wedding.groom_img, {
                        cacheControl: '3600',
                        upsert: false,
                    });
                if (error) throw error;
                groomImgUrl = supabase.storage.from('groom-images').getPublicUrl(data.path).data.publicUrl;
            }
            if (wedding.bride_img instanceof File) {
                const { data, error } = await supabase.storage
                    .from('bride-images')
                    .upload(`bride-${Date.now()}.jpg`, wedding.bride_img, {
                        cacheControl: '3600',
                        upsert: false,
                    });
                if (error) throw error;
                brideImgUrl = supabase.storage.from('bride-images').getPublicUrl(data.path).data.publicUrl;
            }
            if (wedding.modal_img instanceof File) {
                const { data, error } = await supabase.storage
                    .from('images')
                    .upload(`modal-${Date.now()}.jpg`, wedding.modal_img, {
                        cacheControl: '3600',
                        upsert: false,
                    });
                if (error) throw error;
                modalImgUrl = supabase.storage.from('images').getPublicUrl(data.path).data.publicUrl;
            }

            if (weddingId) {
                const { error } = await supabase
                    .from('wedding')
                    .update({
                        groom: wedding.groom,
                        bride: wedding.bride,
                        groom_name: wedding.groom_name,
                        bride_name: wedding.bride_name,
                        groom_initial: wedding.groom_initial,
                        bride_initial: wedding.bride_initial,
                        groom_desc: wedding.groom_desc,
                        bride_desc: wedding.bride_desc,
                        groom_img: groomImgUrl,
                        bride_img: brideImgUrl,
                        modal_img: modalImgUrl,
                        description: wedding.description,
                        place: wedding.place,
                        date: wedding.date,
                        day: wedding.day,
                        time: wedding.time,
                        contract_time: wedding.contract_time,
                        invite_desc: wedding.invite_desc,
                    })
                    .eq('id', weddingId);
                if (error) throw error;
                alert('Wedding details updated!');
            } else {
                const { data, error } = await supabase
                    .from('wedding')
                    .insert({
                        groom: wedding.groom,
                        bride: wedding.bride,
                        groom_name: wedding.groom_name,
                        bride_name: wedding.bride_name,
                        groom_initial: wedding.groom_initial,
                        bride_initial: wedding.bride_initial,
                        groom_desc: wedding.groom_desc,
                        bride_desc: wedding.bride_desc,
                        groom_img: groomImgUrl,
                        bride_img: brideImgUrl,
                        modal_img: modalImgUrl,
                        description: wedding.description,
                        place: wedding.place,
                        date: wedding.date,
                        day: wedding.day,
                        time: wedding.time,
                        contract_time: wedding.contract_time,
                        invite_desc: wedding.invite_desc,
                    })
                    .select()
                    .single();
                if (error) throw error;
                setWeddingId(data.id);
                alert('Wedding details saved!');
            }
            setWedding({
                ...wedding,
                groom_img: groomImgUrl,
                bride_img: brideImgUrl,
                modal_img: modalImgUrl,
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
                if (error) throw error;
                const publicUrl = supabase.storage.from('moments-images').getPublicUrl(data.path).data.publicUrl;
                momentImgUrls.push(publicUrl);
            }
            if (momentImgUrls.length > 0) {
                const { data, error } = await supabase
                    .from('moments')
                    .insert({ wedding_id: weddingId, moments_img: momentImgUrls })
                    .select();
                if (error) throw error;
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
            if (storageError) throw storageError;

            const { error } = await supabase.from('moments').delete().eq('id', momentId);
            if (error) throw error;

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
                    rek_name: newGift.rek_name,
                })
                .select();
            if (error) throw error;
            setGifts([...gifts, ...data]);
            alert('Gift saved!');
            setNewGift({ envelope_name: '', envelope_number: '', rek_name: '' });
        } catch (error) {
            console.error('Error saving gift:', error);
            alert('Failed to save gift.');
        }
    };

    const handleDeleteGift = async (giftId: string) => {
        try {
            const { error } = await supabase.from('gifts').delete().eq('id', giftId);
            if (error) throw error;
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
                    if (deleteError) throw deleteError;
                }

                const fileName = `music-${weddingId}.mp3`;
                const { data, error } = await supabase.storage
                    .from('music-assets')
                    .upload(fileName, asset.music, {
                        cacheControl: '3600',
                        upsert: true,
                    });
                if (error) throw error;
                musicUrl = supabase.storage.from('music-assets').getPublicUrl(data.path).data.publicUrl;
            }

            if (asset.id) {
                const { error } = await supabase
                    .from('assets')
                    .update({ music: musicUrl })
                    .eq('id', asset.id);
                if (error) throw error;
            } else {
                const { data, error } = await supabase
                    .from('assets')
                    .insert({ wedding_id: weddingId, music: musicUrl })
                    .select()
                    .single();
                if (error) throw error;
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
            const { error: fetchError } = await supabase
                .from('congrats')
                .select('id')
                .eq('wedding_id', weddingId);
            if (fetchError) throw fetchError;

            const { error, count } = await supabase
                .from('congrats')
                .delete()
                .eq('wedding_id', weddingId);
            if (error) throw error;

            if (count === 0) {
                alert('No congratulatory messages found to delete.');
            } else {
                alert(`Successfully deleted ${count} congratulate(s)!`);
            }
        } catch (error) {
            console.error('Error deleting all congrats:', error);
            alert('Failed to delete congratulatory messages.');
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-rose-50 via-ivory-50 to-pink-50 py-4 px-3">
            <div className="max-w-lg mx-auto">
                <h1 className="text-2xl font-bold text-center text-rose-700 mb-6 tracking-tight">
                    Wedding Invitation CMS
                </h1>

                {/* Navigation to Home Page */}
                <div className="mb-6 p-4 bg-white rounded-xl shadow-sm border border-rose-100">
                    <Link href="/home">
                        <button
                            className="w-full bg-rose-500 text-white py-3 rounded-xl text-lg font-medium hover:bg-rose-600 transition-colors duration-200 active:bg-rose-700"
                        >
                            Return to Wedding List
                        </button>
                    </Link>
                </div>

                {/* Navigation to Invites Page */}
                {weddingId && (
                    <div className="mb-6 p-4 bg-white rounded-xl shadow-sm border border-rose-100">
                        <Link href={`/invites?id=${weddingId}`}>
                            <button
                                className="w-full bg-rose-500 text-white py-3 rounded-xl text-lg font-medium hover:bg-rose-600 transition-colors duration-200 active:bg-rose-700"
                            >
                                Manage Invites
                            </button>
                        </Link>
                    </div>
                )}

                {/* View Wedding Page */}
                {weddingId && (
                    <div className="mb-6 p-4 bg-white rounded-xl shadow-sm border border-rose-100">
                        <Link href={`/wedding?weddingId=${weddingId}&groom_name=${encodeURIComponent(wedding.groom_name)}&bride_name=${encodeURIComponent(wedding.bride_name)}`}>
                            <button
                                className="w-full bg-amber-500 text-white py-3 rounded-xl text-lg font-medium hover:bg-amber-600 transition-colors duration-200 active:bg-amber-700"
                            >
                                View Wedding
                            </button>
                        </Link>
                    </div>
                )}

                {/* Cropper Modal */}
                {imageToCrop && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-3">
                        <div className="bg-white p-4 rounded-xl shadow-lg w-full max-w-md">
                            <h3 className="text-lg font-semibold mb-3 text-rose-600">
                                Crop {cropField === 'groom_img' ? 'Groom Image' : 'Bride Image'}
                            </h3>
                            <ReactCrop
                                crop={crop}
                                onChange={(_, percentCrop) => setCrop(percentCrop)}
                                onComplete={handleCropComplete}
                                aspect={1}
                            >
                                <img
                                    src={imageToCrop}
                                    ref={imageRef}
                                    alt="Image to crop"
                                    className="w-full max-h-[50vh] object-contain"
                                />
                            </ReactCrop>
                            <div className="flex justify-end mt-3 space-x-2">
                                <button
                                    onClick={handleCropCancel}
                                    className="bg-gray-300 text-gray-700 py-2 px-4 rounded-xl text-sm hover:bg-gray-400 transition-colors duration-200 active:bg-gray-500"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleCropSave}
                                    className="bg-rose-500 text-white py-2 px-4 rounded-xl text-sm hover:bg-rose-600 transition-colors duration-200 active:bg-rose-700"
                                    disabled={!croppedImage}
                                >
                                    Save Crop
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Wedding Details Section */}
                <form
                    onSubmit={handleWeddingSubmit}
                    className="mb-6 p-4 bg-white rounded-xl shadow-sm border border-rose-100"
                >
                    <h2 className="text-lg font-semibold mb-4 text-rose-600">Wedding Details</h2>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Nama Panggilan Pengantin Pria</label>
                            <input
                                type="text"
                                value={wedding.groom}
                                onChange={(e) => setWedding({ ...wedding, groom: e.target.value })}
                                className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-300 transition-colors"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Nama Panggilan Pengantin Wanita</label>
                            <input
                                type="text"
                                value={wedding.bride}
                                onChange={(e) => setWedding({ ...wedding, bride: e.target.value })}
                                className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-300 transition-colors"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Inisial Pengantin Pria</label>
                            <input
                                type="text"
                                value={wedding.groom_initial}
                                onChange={(e) => setWedding({ ...wedding, groom_initial: e.target.value })}
                                className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-300 transition-colors"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Inisial Pengantin Wanita</label>
                            <input
                                type="text"
                                value={wedding.bride_initial}
                                onChange={(e) => setWedding({ ...wedding, bride_initial: e.target.value })}
                                className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-300 transition-colors"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap Pengantin Pria</label>
                            <input
                                type="text"
                                value={wedding.groom_name}
                                onChange={(e) => setWedding({ ...wedding, groom_name: e.target.value })}
                                className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-300 transition-colors"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap Pengantin Wanita</label>
                            <input
                                type="text"
                                value={wedding.bride_name}
                                onChange={(e) => setWedding({ ...wedding, bride_name: e.target.value })}
                                className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-300 transition-colors"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi Pengantin Pria</label>
                            <textarea
                                value={wedding.groom_desc}
                                onChange={(e) => setWedding({ ...wedding, groom_desc: e.target.value })}
                                className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-300 transition-colors"
                                rows={4}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi Pengantin Wanita</label>
                            <textarea
                                value={wedding.bride_desc}
                                onChange={(e) => setWedding({ ...wedding, bride_desc: e.target.value })}
                                className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-300 transition-colors"
                                rows={4}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Foto Pengantin Pria</label>
                            {typeof wedding.groom_img === 'string' && wedding.groom_img && (
                                <div className="mb-4 relative w-full h-48">
                                    <Image
                                        src={wedding.groom_img}
                                        alt="Current Groom Image"
                                        fill
                                        className="object-cover rounded-xl shadow-sm"
                                        sizes="100vw"
                                    />
                                </div>
                            )}
                            {!wedding.groom_img && (
                                <p className="text-gray-500 text-sm mb-2">No image uploaded yet.</p>
                            )}
                            <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleImageChange(e, 'groom_img')}
                                className="w-full p-3 text-sm text-gray-600 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-rose-100 file:text-rose-700 file:text-sm hover:file:bg-rose-200 transition-colors"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Foto Pengantin Wanita</label>
                            {typeof wedding.bride_img === 'string' && wedding.bride_img && (
                                <div className="mb-4 relative w-full h-48">
                                    <Image
                                        src={wedding.bride_img}
                                        alt="Current Bride Image"
                                        fill
                                        className="object-cover rounded-xl shadow-sm"
                                        sizes="100vw"
                                    />
                                </div>
                            )}
                            {!wedding.bride_img && (
                                <p className="text-gray-500 text-sm mb-2">No image uploaded yet.</p>
                            )}
                            <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleImageChange(e, 'bride_img')}
                                className="w-full p-3 text-sm text-gray-600 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-rose-100 file:text-rose-700 file:text-sm hover:file:bg-rose-200 transition-colors"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Foto Modal</label>
                            {typeof wedding.modal_img === 'string' && wedding.modal_img && (
                                <div className="mb-4 relative w-full h-48">
                                    <Image
                                        src={wedding.modal_img}
                                        alt="Current Modal Image"
                                        fill
                                        className="object-cover rounded-xl shadow-sm"
                                        sizes="100vw"
                                    />
                                </div>
                            )}
                            {!wedding.modal_img && (
                                <p className="text-gray-500 text-sm mb-2">No modal image uploaded yet.</p>
                            )}
                            <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => setWedding({ ...wedding, modal_img: e.target.files?.[0] || null })}
                                className="w-full p-3 text-sm text-gray-600 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-rose-100 file:text-rose-700 file:text-sm hover:file:bg-rose-200 transition-colors"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Ucapan Pembukaan</label>
                            <textarea
                                value={wedding.description}
                                onChange={(e) => setWedding({ ...wedding, description: e.target.value })}
                                className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-300 transition-colors"
                                rows={4}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Lokasi</label>
                            <input
                                type="text"
                                value={wedding.place}
                                onChange={(e) => setWedding({ ...wedding, place: e.target.value })}
                                className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-300 transition-colors"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal</label>
                            <input
                                type="date"
                                value={wedding.date}
                                onChange={(e) => setWedding({ ...wedding, date: e.target.value })}
                                className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-300 transition-colors"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Hari</label>
                            <input
                                type="text"
                                value={wedding.day}
                                onChange={(e) => setWedding({ ...wedding, day: e.target.value })}
                                className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-300 transition-colors"
                                placeholder="e.g., Saturday"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Waktu Presepsi</label>
                            <input
                                type="time"
                                value={wedding.time}
                                onChange={(e) => setWedding({ ...wedding, time: e.target.value })}
                                className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-300 transition-colors"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Waktu Akad</label>
                            <input
                                type="time"
                                value={wedding.contract_time}
                                onChange={(e) => setWedding({ ...wedding, contract_time: e.target.value })}
                                className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-300 transition-colors"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Ucapan Undangan</label>
                            <textarea
                                value={wedding.invite_desc}
                                onChange={(e) => setWedding({ ...wedding, invite_desc: e.target.value })}
                                className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-300 transition-colors"
                                rows={4}
                            />
                        </div>
                    </div>
                    <button
                        type="submit"
                        className="mt-4 w-full bg-rose-500 text-white py-3 rounded-xl text-lg font-medium hover:bg-rose-600 transition-colors duration-200 active:bg-rose-700"
                    >
                        {weddingId ? 'Update Wedding Details' : 'Save Wedding Details'}
                    </button>
                </form>

                {/* Moments Section */}
                <div className="mb-6 p-4 bg-white rounded-xl shadow-sm border border-rose-100">
                    <h2 className="text-lg font-semibold mb-4 text-rose-600">Moments</h2>
                    <form onSubmit={handleMomentsSubmit} className="mb-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Upload Moment Images</label>
                            <input
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={(e) => setNewMoments({ moments_img: Array.from(e.target.files || []) })}
                                className="w-full p-3 text-sm text-gray-600 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-rose-100 file:text-rose-700 file:text-sm hover:file:bg-rose-200 transition-colors"
                            />
                        </div>
                        <button
                            type="submit"
                            className="mt-3 w-full bg-rose-500 text-white py-3 rounded-xl text-lg font-medium hover:bg-rose-600 transition-colors duration-200 active:bg-rose-700"
                        >
                            Add Moments
                        </button>
                    </form>
                    {moments.length > 0 ? (
                        <div className="grid grid-cols-2 gap-4">
                            {moments.map((moment) =>
                                moment.moments_img.map((img, index) => (
                                    <div key={`${moment.id}-${index}`} className="relative w-full h-40">
                                        <Image
                                            src={img}
                                            alt={`Moment ${index + 1}`}
                                            fill
                                            className="object-cover rounded-xl shadow-sm"
                                            sizes="(max-width: 640px) 50vw, 25vw"
                                        />
                                        <button
                                            onClick={() => handleDeleteMoment(moment.id, moment.moments_img)}
                                            className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full text-xs hover:bg-red-600 transition-colors duration-200"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    ) : (
                        <p className="text-gray-500 text-sm italic">No moments added yet.</p>
                    )}
                </div>

                {/* Gift Envelopes Section */}
                <div className="mb-6 p-4 bg-white rounded-xl shadow-sm border border-rose-100">
                    <h2 className="text-lg font-semibold mb-4 text-rose-600">Gift Envelopes</h2>
                    <form onSubmit={handleGiftSubmit} className="mb-4 space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Envelope Name</label>
                            <input
                                type="text"
                                value={newGift.envelope_name}
                                onChange={(e) => setNewGift({ ...newGift, envelope_name: e.target.value })}
                                className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-300 transition-colors"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Bank Name</label>
                            <input
                                type="text"
                                value={newGift.rek_name}
                                onChange={(e) => setNewGift({ ...newGift, rek_name: e.target.value })}
                                className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-300 transition-colors"
                                placeholder="e.g., BCA, BRI, Mandiri"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Envelope Number</label>
                            <input
                                type="text"
                                value={newGift.envelope_number}
                                onChange={(e) => setNewGift({ ...newGift, envelope_number: e.target.value })}
                                className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-300 transition-colors"
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            className="w-full bg-rose-500 text-white py-3 rounded-xl text-lg font-medium hover:bg-rose-600 transition-colors duration-200 active:bg-rose-700"
                        >
                            Add Gift
                        </button>
                    </form>
                    {gifts.length > 0 ? (
                        <div className="space-y-3">
                            {gifts.map((gift) => (
                                <div
                                    key={gift.id}
                                    className="p-4 bg-rose-50 rounded-xl shadow-sm border-l-4 border-rose-300 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3"
                                >
                                    <div>
                                        <p className="text-gray-700 font-medium text-sm">{gift.envelope_name}</p>
                                        <p className="text-gray-500 text-xs">{gift.rek_name}</p>
                                        <p className="text-gray-500 text-xs">{gift.envelope_number}</p>
                                    </div>
                                    <button
                                        onClick={() => handleDeleteGift(gift.id)}
                                        className="bg-red-500 text-white py-2 px-4 rounded-xl text-sm font-medium hover:bg-red-600 transition-colors duration-200 active:bg-red-700"
                                    >
                                        Delete
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-gray-500 text-sm italic">No gifts added yet.</p>
                    )}
                </div>

                {/* Music Section */}
                <form
                    onSubmit={handleAssetSubmit}
                    className="mb-6 p-4 bg-white rounded-xl shadow-sm border border-rose-100"
                >
                    <h2 className="text-lg font-semibold mb-4 text-rose-600">Update Music</h2>
                    {asset.music_url && (
                        <div className="mb-4">
                            <p className="text-gray-600 text-sm">
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
                            className="w-full p-3 text-sm text-gray-600 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-rose-100 file:text-rose-700 file:text-sm hover:file:bg-rose-200 transition-colors"
                        />
                    </div>
                    <button
                        type="submit"
                        className="mt-3 w-full bg-rose-500 text-white py-3 rounded-xl text-lg font-medium hover:bg-rose-600 transition-colors duration-200 active:bg-rose-700"
                    >
                        Update Music
                    </button>
                </form>

                {/* Manage Congrats Section */}
                <div className="p-4 bg-white rounded-xl shadow-sm border border-rose-100">
                    <h2 className="text-lg font-semibold mb-4 text-rose-600">Manage Congrats</h2>
                    <button
                        onClick={handleDeleteAllCongrats}
                        className="w-full bg-red-500 text-white py-3 rounded-xl text-lg font-medium hover:bg-red-600 transition-colors duration-200 active:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                        disabled={!weddingId}
                    >
                        Delete All Congrats
                    </button>
                </div>
            </div>
        </div>
    );
}
