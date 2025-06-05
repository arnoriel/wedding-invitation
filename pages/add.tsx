import { useState, FormEvent, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import ReactCrop, { Crop, PixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { supabase } from '@/lib/supabase';

interface WeddingForm {
    groom: string;
    bride: string;
    groom_name: string;
    bride_name: string;
    groom_initial: string;
    bride_initial: string;
    groom_desc: string;
    bride_desc: string;
    groom_img: File | null;
    bride_img: File | null;
    modal_img: File | null;
    description: string;
    place: string;
    date: string;
    day: string;
    time: string;
    contract_time: string;
    invite_desc: string;
}

interface Moment {
    moments_img: File[];
}

interface Gift {
    envelope_name: string;
    envelope_number: string;
    rek_name: string;
}

interface Asset {
    music: File | null;
}

export default function AddWedding() {
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
    const [newMoments, setNewMoments] = useState<Moment>({ moments_img: [] });
    const [newGift, setNewGift] = useState<Gift>({ envelope_name: '', envelope_number: '', rek_name: '' });
    const [asset, setAsset] = useState<Asset>({ music: null });
    const [weddingId, setWeddingId] = useState<string | null>(null);

    // Cropper state
    const [crop, setCrop] = useState<Crop>({ unit: '%', x: 25, y: 25, width: 50, height: 50 });
    const [croppedImage, setCroppedImage] = useState<Blob | null>(null);
    const [imageToCrop, setImageToCrop] = useState<string | null>(null);
    const [cropField, setCropField] = useState<'groom_img' | 'bride_img' | null>(null);
    const imageRef = useRef<HTMLImageElement | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

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
            let groomImgUrl = null;
            let brideImgUrl = null;
            let modalImgUrl = null;

            if (wedding.groom_img) {
                const { data, error } = await supabase.storage
                    .from('groom-images')
                    .upload(`groom-${Date.now()}.jpg`, wedding.groom_img, {
                        cacheControl: '3600',
                        upsert: false,
                    });
                if (error) throw error;
                groomImgUrl = supabase.storage.from('groom-images').getPublicUrl(data.path).data.publicUrl;
            }
            if (wedding.bride_img) {
                const { data, error } = await supabase.storage
                    .from('bride-images')
                    .upload(`bride-${Date.now()}.jpg`, wedding.bride_img, {
                        cacheControl: '3600',
                        upsert: false,
                    });
                if (error) throw error;
                brideImgUrl = supabase.storage.from('bride-images').getPublicUrl(data.path).data.publicUrl;
            }
            if (wedding.modal_img) {
                const { data, error } = await supabase.storage
                    .from('images')
                    .upload(`modal-${Date.now()}.jpg`, wedding.modal_img, {
                        cacheControl: '3600',
                        upsert: false,
                    });
                if (error) throw error;
                modalImgUrl = supabase.storage.from('images').getPublicUrl(data.path).data.publicUrl;
            }

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
            setWedding({
                ...wedding,
                groom_img: null,
                bride_img: null,
                modal_img: null,
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
                const { error } = await supabase
                    .from('moments')
                    .insert({ wedding_id: weddingId, moments_img: momentImgUrls });
                if (error) throw error;
                alert('Moments saved!');
                setNewMoments({ moments_img: [] });
            }
        } catch (error) {
            console.error('Error saving moments:', error);
            alert('Failed to save moments.');
        }
    };

    const handleGiftSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!weddingId) {
            alert('Please save wedding details first.');
            return;
        }
        try {
            const { error } = await supabase
                .from('gifts')
                .insert({
                    wedding_id: weddingId,
                    envelope_name: newGift.envelope_name,
                    envelope_number: newGift.envelope_number,
                    rek_name: newGift.rek_name,
                });
            if (error) throw error;
            alert('Gift saved!');
            setNewGift({ envelope_name: '', envelope_number: '', rek_name: '' });
        } catch (error) {
            console.error('Error saving gift:', error);
            alert('Failed to save gift.');
        }
    };

    const handleAssetSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!weddingId) {
            alert('Please save wedding details first.');
            return;
        }
        try {
            if (asset.music) {
                const fileName = `music-${weddingId}.mp3`;
                const { data, error } = await supabase.storage
                    .from('music-assets')
                    .upload(fileName, asset.music, {
                        cacheControl: '3600',
                        upsert: true,
                    });
                if (error) throw error;
                const musicUrl = supabase.storage.from('music-assets').getPublicUrl(data.path).data.publicUrl;

                const { error: insertError } = await supabase
                    .from('assets')
                    .insert({ wedding_id: weddingId, music: musicUrl });
                if (insertError) throw insertError;

                alert('Music asset saved!');
                setAsset({ music: null });
            }
        } catch (error) {
            console.error('Error saving music:', error);
            alert('Failed to save music asset.');
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-rose-50 via-ivory-50 to-pink-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-4xl font-extrabold text-center text-rose-700 mb-12 tracking-tight">
                    Add New Wedding
                </h1>

                {/* Navigation to Home Page */}
                <div className="mb-12 p-8 bg-white rounded-2xl shadow-lg border border-rose-100">
                    <h2 className="text-2xl font-semibold mb-6 text-rose-600">Back to Home</h2>
                    <Link href="/home">
                        <button
                            className="w-full bg-rose-500 text-white py-3 rounded-lg hover:bg-rose-600 transition-colors duration-300 font-medium"
                        >
                            Return to Wedding List
                        </button>
                    </Link>
                </div>

                {/* Cropper Modal */}
                {imageToCrop && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white p-6 rounded-lg shadow-lg max-w-lg w-full">
                            <h3 className="text-xl font-semibold mb-4 text-rose-600">
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
                                    className="max-w-full max-h-[400px]"
                                />
                            </ReactCrop>
                            <div className="flex justify-end mt-4 space-x-2">
                                <button
                                    onClick={handleCropCancel}
                                    className="bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleCropSave}
                                    className="bg-rose-500 text-white py-2 px-4 rounded-lg hover:bg-rose-600 transition-colors"
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
                            <label className="block text-sm font-medium text-gray-700 mb-1">Inisial Pengantin Pria</label>
                            <input
                                type="text"
                                value={wedding.groom_initial}
                                onChange={(e) => setWedding({ ...wedding, groom_initial: e.target.value })}
                                className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-300 transition-colors"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Inisial Pengantin Wanita</label>
                            <input
                                type="text"
                                value={wedding.bride_initial}
                                onChange={(e) => setWedding({ ...wedding, bride_initial: e.target.value })}
                                className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-300 transition-colors"
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
                            {wedding.groom_img && (
                                <div className="mb-4 relative w-full h-40">
                                    <Image
                                        src={URL.createObjectURL(wedding.groom_img)}
                                        alt="Groom Image Preview"
                                        fill
                                        className="object-cover rounded-lg shadow-sm"
                                        sizes="(max-width: 640px) 100vw, 50vw"
                                    />
                                </div>
                            )}
                            <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleImageChange(e, 'groom_img')}
                                className="w-full p-3 text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-rose-100 file:text-rose-700 hover:file:bg-rose-200 transition-colors"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Foto Pengantin Wanita</label>
                            {wedding.bride_img && (
                                <div className="mb-4 relative w-full h-40">
                                    <Image
                                        src={URL.createObjectURL(wedding.bride_img)}
                                        alt="Bride Image Preview"
                                        fill
                                        className="object-cover rounded-lg shadow-sm"
                                        sizes="(max-width: 640px) 100vw, 50vw"
                                    />
                                </div>
                            )}
                            <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleImageChange(e, 'bride_img')}
                                className="w-full p-3 text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-rose-100 file:text-rose-700 hover:file:bg-rose-200 transition-colors"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Foto Modal</label>
                            {wedding.modal_img && (
                                <div className="mb-4 relative w-full h-40">
                                    <Image
                                        src={URL.createObjectURL(wedding.modal_img)}
                                        alt="Modal Image Preview"
                                        fill
                                        className="object-cover rounded-lg shadow-sm"
                                        sizes="(max-width: 640px) 100vw, 50vw"
                                    />
                                </div>
                            )}
                            <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => setWedding({ ...wedding, modal_img: e.target.files?.[0] || null })}
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
                            <label className="block text-sm font-medium text-gray-700 mb-1">Waktu Presepsi</label>
                            <input
                                type="time"
                                value={wedding.time}
                                onChange={(e) => setWedding({ ...wedding, time: e.target.value })}
                                className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-300 transition-colors"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Waktu Akad</label>
                            <input
                                type="time"
                                value={wedding.contract_time}
                                onChange={(e) => setWedding({ ...wedding, contract_time: e.target.value })}
                                className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-300 transition-colors"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Ucapan Undangan</label>
                            <textarea
                                value={wedding.invite_desc}
                                onChange={(e) => setWedding({ ...wedding, invite_desc: e.target.value })}
                                className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-300 transition-colors"
                                rows={4}
                            />
                        </div>
                    </div>
                    <button
                        type="submit"
                        className="mt-6 w-full bg-rose-500 text-white py-3 rounded-lg hover:bg-rose-600 transition-colors duration-300 font-medium"
                    >
                        Save Wedding Details
                    </button>
                </form>

                {/* Moments Section */}
                <form
                    onSubmit={handleMomentsSubmit}
                    className="mb-12 p-8 bg-white rounded-2xl shadow-lg border border-rose-100"
                >
                    <h2 className="text-2xl font-semibold mb-6 text-rose-600">Moments</h2>
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
                    {newMoments.moments_img.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mt-6">
                            {newMoments.moments_img.map((img, index) => (
                                <div key={index} className="relative w-full h-64">
                                    <Image
                                        src={URL.createObjectURL(img)}
                                        alt={`Moment Preview ${index + 1}`}
                                        fill
                                        className="object-cover rounded-lg shadow-md"
                                        sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw"
                                    />
                                </div>
                            ))}
                        </div>
                    )}
                </form>

                {/* Gift Envelopes Section */}
                <form
                    onSubmit={handleGiftSubmit}
                    className="mb-12 p-8 bg-white rounded-2xl shadow-lg border border-rose-100"
                >
                    <h2 className="text-2xl font-semibold mb-6 text-rose-600">Gift Envelopes</h2>
                    <div className="space-y-4">
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
                            <label className="block text-sm font-medium text-gray-700 mb-1">Bank Name</label>
                            <input
                                type="text"
                                value={newGift.rek_name}
                                onChange={(e) => setNewGift({ ...newGift, rek_name: e.target.value })}
                                className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-300 transition-colors"
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
                    </div>
                </form>

                {/* Music Section */}
                <form
                    onSubmit={handleAssetSubmit}
                    className="mb-12 p-8 bg-white rounded-2xl shadow-lg border border-rose-100"
                >
                    <h2 className="text-2xl font-semibold mb-6 text-rose-600">Add Music</h2>
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
                        Save Music
                    </button>
                </form>
            </div>
        </div>
    );
}
