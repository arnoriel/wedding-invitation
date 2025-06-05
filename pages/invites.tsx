import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabase';

interface Invite {
    id: string;
    invited_name: string;
}

interface NewInvite {
    invited_name: string;
}

interface Wedding {
    id: string;
    groom_name: string;
    bride_name: string;
}

interface Notification {
    message: string;
    type: 'success' | 'error';
}

export default function Invites() {
    const [invites, setInvites] = useState<Invite[]>([]);
    const [newInvite, setNewInvite] = useState<NewInvite>({ invited_name: '' });
    const [weddingId, setWeddingId] = useState<string | null>(null);
    const [wedding, setWedding] = useState<Wedding | null>(null);
    const [notification, setNotification] = useState<Notification | null>(null);
    const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
    const [deleteInviteId, setDeleteInviteId] = useState<string | null>(null);
    const [deleteAll, setDeleteAll] = useState<boolean>(false);
    const router = useRouter();
    const { id } = router.query;

    useEffect(() => {
        async function fetchData() {
            try {
                let weddingData = null;
                if (id && typeof id === 'string') {
                    // Fetch specific wedding by ID from URL query
                    const { data, error } = await supabase
                        .from('wedding')
                        .select('id, groom_name, bride_name')
                        .eq('id', id)
                        .single();
                    if (error && !error.message.includes('No rows found')) throw error;
                    weddingData = data;
                } else {
                    // Fallback to first wedding if no ID provided
                    const { data, error } = await supabase
                        .from('wedding')
                        .select('id, groom_name, bride_name')
                        .limit(1)
                        .single();
                    if (error && !error.message.includes('No rows found')) throw error;
                    weddingData = data;
                }

                if (weddingData) {
                    setWeddingId(weddingData.id);
                    setWedding(weddingData);
                }

                if (weddingData?.id) {
                    const { data: invitesData, error: invitesError } = await supabase
                        .from('invites')
                        .select('id, invited_name')
                        .eq('wedding_id', weddingData.id);
                    if (invitesError) throw invitesError;
                    setInvites(invitesData || []);
                }
            } catch (error) {
                console.error('Error fetching data:', error);
                setNotification({ message: 'Gagal memuat data tamu undangan.', type: 'error' });
            }
        }
        fetchData();
    }, [id]);

    useEffect(() => {
        if (notification) {
            const timer = setTimeout(() => {
                setNotification(null);
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [notification]);

    const handleInviteSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!weddingId) {
            setNotification({ message: 'Harap simpan detail pernikahan terlebih dahulu.', type: 'error' });
            return;
        }
        try {
            const { data, error } = await supabase
                .from('invites')
                .insert({
                    wedding_id: weddingId,
                    invited_name: newInvite.invited_name,
                })
                .select();
            if (error) {
                console.error('Invite insert error:', error);
                throw error;
            }
            setInvites([...data, ...invites]);
            setNotification({ message: 'Tamu undangan berhasil ditambahkan!', type: 'success' });
            setNewInvite({ invited_name: '' });
        } catch (error) {
            console.error('Error saving invite:', error);
            setNotification({ message: 'Gagal menambahkan tamu undangan.', type: 'error' });
        }
    };

    const handleDeleteInvite = async (inviteId: string) => {
        try {
            const { error } = await supabase.from('invites').delete().eq('id', inviteId);
            if (error) {
                console.error('Error deleting invite:', error);
                throw error;
            }
            setInvites(invites.filter((invite) => invite.id !== inviteId));
            setNotification({ message: 'Tamu undangan berhasil dihapus!', type: 'success' });
            setShowDeleteModal(false);
            setDeleteInviteId(null);
        } catch (error) {
            console.error('Error deleting invite:', error);
            setNotification({ message: 'Gagal menghapus tamu undangan.', type: 'error' });
        }
    };

    const handleDeleteAllInvites = async () => {
        if (!weddingId) {
            setNotification({ message: 'Harap simpan detail pernikahan terlebih dahulu.', type: 'error' });
            return;
        }
        try {
            const { error, count } = await supabase
                .from('invites')
                .delete()
                .eq('wedding_id', weddingId);
            if (error) {
                console.error('Error deleting all invites:', error);
                throw error;
            }
            setInvites([]);
            setShowDeleteModal(false);
            setDeleteAll(false);
            if (count === 0) {
                setNotification({ message: 'Tidak ada tamu undangan untuk dihapus.', type: 'success' });
            } else {
                setNotification({ message: `Berhasil menghapus ${count} tamu undangan!`, type: 'success' });
            }
        } catch (error) {
            console.error('Error deleting all invites:', error);
            setNotification({ message: 'Gagal menghapus semua tamu undangan.', type: 'error' });
        }
    };

    const generateShareLink = (invitedName: string) => {
        const baseUrl = 'https://wedding-invitation-six-iota.vercel.app';
        const encodedName = encodeURIComponent(invitedName);
        const encodedGroomName = encodeURIComponent(wedding?.groom_name || 'Mempelai Pria');
        const encodedBrideName = encodeURIComponent(wedding?.bride_name || 'Mempelai Wanita');
        const link = `${baseUrl}/wedding?weddingId=${weddingId}&groom_name=${encodedGroomName}&bride_name=${encodedBrideName}&invited_name=${encodedName}`;
        return `Assalamualaikum Warahmatullahi Wabarakatuh

Tanpa mengurangi rasa hormat, perkenankan kami mengundang Bapak/Ibu/Saudara/i ${invitedName} untuk menghadiri acara pernikahan putra/i kami yaitu ${wedding?.groom_name || 'Mempelai Pria'} & ${wedding?.bride_name || 'Mempelai Wanita'}.

Berikut link undangan kami, untuk info lengkap dari acara bisa kunjungi:

${link}

Merupakan suatu kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan untuk hadir dan memberikan doa restu.

Mohon maaf perihal undangan hanya di bagikan melalui pesan ini.

Dan agar selalu menjaga kesehatan bersama serta datang pada waktu yang telah ditentukan.

Terima kasih banyak atas perhatiannya.

Wassalamualaikum Warahmatullahi Wabarakatuh`;
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text).then(() => {
            setNotification({ message: 'Link undangan berhasil disalin!', type: 'success' });
        }).catch((error) => {
            console.error('Error copying to clipboard:', error);
            setNotification({ message: 'Gagal menyalin link undangan.', type: 'error' });
        });
    };

    const openDeleteModal = (inviteId: string | null, isDeleteAll: boolean = false) => {
        setDeleteInviteId(inviteId);
        setDeleteAll(isDeleteAll);
        setShowDeleteModal(true);
    };

    const closeDeleteModal = () => {
        setShowDeleteModal(false);
        setDeleteInviteId(null);
        setDeleteAll(false);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-rose-50 via-ivory-50 to-pink-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-4xl font-extrabold text-center text-rose-700 mb-12 tracking-tight">
                    Kelola Tamu Undangan
                </h1>

                {/* Usage Instructions */}
                <div className="mb-12 p-8 bg-white rounded-2xl shadow-lg border border-rose-100">
                    <h2 className="text-2xl font-semibold mb-6 text-rose-600">Panduan Penggunaan</h2>
                    <p className="text-gray-700">Langkah cara pemakaian:</p>
                    <ol className="list-decimal list-inside text-gray-700 space-y-2">
                        <li>Tambahkan nama pada form kosong di bawah ini, lalu tekan tombol Tambah Tamu Undangan.</li>
                        <li>Tekan Salin Link lalu kirimkan ke WhatsApp kepada Tamu yang Anda undang.</li>
                        <li>
                            Tekan tombol hapus pada salah satu nama jika Anda merasa Tamu itu salah Namanya atau memang
                            tidak di Undang. Jika tidak ada yang salah tidak perlu dihapus.
                        </li>
                        <li>
                            Tekan tombol hapus seluruh Tamu Undangan jika Anda merasa semua tamu nya salah. Jika tidak ada
                            yang salah tidak perlu dihapus.
                        </li>
                    </ol>
                </div>

                {/* Invites Management */}
                <div className="p-8 bg-white rounded-2xl shadow-lg border border-rose-100">
                    <h2 className="text-2xl font-semibold mb-6 text-rose-600">Tamu Undangan</h2>
                    <form onSubmit={handleInviteSubmit} className="mb-6 space-y-4">
                        <div className="flex items-end space-x-4">
                            <div className="flex-1">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Tamu Undangan</label>
                                <input
                                    type="text"
                                    value={newInvite.invited_name}
                                    onChange={(e) => setNewInvite({ ...newInvite, invited_name: e.target.value })}
                                    className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-300 transition-colors"
                                    required
                                />
                            </div>
                            <button
                                type="button"
                                onClick={() => openDeleteModal(null, true)}
                                className="bg-red-500 text-white py-3 px-6 rounded-lg hover:bg-red-600 transition-colors duration-300 font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
                                disabled={!weddingId}
                            >
                                Hapus Semua Tamu
                            </button>
                        </div>
                        <button
                            type="submit"
                            className="w-full bg-rose-500 text-white py-3 rounded-lg hover:bg-rose-600 transition-colors duration-300 font-medium"
                        >
                            Tambah Tamu Undangan
                        </button>
                    </form>
                    {invites.length > 0 ? (
                        <div className="space-y-4">
                            {invites.map((invite) => (
                                <div
                                    key={invite.id}
                                    className="p-4 bg-rose-50 rounded-lg shadow-sm border-l-4 border-rose-300 flex justify-between items-center transition-transform duration-300 hover:shadow-md"
                                >
                                    <div>
                                        <p className="text-gray-700 font-medium">{invite.invited_name}</p>
                                    </div>
                                    <div className="flex space-x-2">
                                        <button
                                            onClick={() => copyToClipboard(generateShareLink(invite.invited_name))}
                                            className="bg-amber-500 text-white py-2 px-4 rounded-lg hover:bg-amber-600 transition-colors duration-300"
                                        >
                                            Salin Link
                                        </button>
                                        <button
                                            onClick={() => openDeleteModal(invite.id)}
                                            className="bg-red-500 text-white py-2 px-4 rounded-lg hover:bg-red-600 transition-colors duration-300"
                                        >
                                            Hapus
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-gray-500 italic">Belum ada tamu undangan yang ditambahkan.</p>
                    )}
                </div>

                {/* Delete Confirmation Modal */}
                {showDeleteModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg p-6 max-w-md w-full">
                            <h3 className="text-xl font-semibold text-rose-600 mb-4">Konfirmasi Penghapusan</h3>
                            <p className="text-gray-700 mb-6">
                                {deleteAll
                                    ? 'Apakah Anda yakin ingin menghapus semua tamu undangan? Tindakan ini tidak dapat dibatalkan.'
                                    : 'Apakah Anda yakin ingin menghapus tamu undangan ini? Tindakan ini tidak dapat dibatalkan.'}
                            </p>
                            <div className="flex justify-end space-x-4">
                                <button
                                    onClick={closeDeleteModal}
                                    className="bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors"
                                >
                                    Batal
                                </button>
                                <button
                                    onClick={() => (deleteAll ? handleDeleteAllInvites() : handleDeleteInvite(deleteInviteId!))}
                                    className="bg-red-500 text-white py-2 px-4 rounded-lg hover:bg-red-600 transition-colors"
                                >
                                    Hapus
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Notification Card */}
                {notification && (
                    <div className="fixed top-4 right-4 z-50">
                        <div
                            className={`p-4 rounded-lg shadow-lg flex items-center space-x-2 transition-opacity duration-300 ${
                                notification.type === 'success' ? 'bg-green-100 border-l-4 border-green-500' : 'bg-red-100 border-l-4 border-red-500'
                            } animate-[fadeInOut_3s_ease-in-out]`}
                        >
                            <div className="animate-spin h-5 w-5 border-2 border-t-transparent border-gray-500 rounded-full" />
                            <p className={`text-sm font-medium ${notification.type === 'success' ? 'text-green-700' : 'text-red-700'}`}>
                                {notification.message}
                            </p>
                        </div>
                    </div>
                )}
            </div>

            <style jsx>{`
                @keyframes fadeInOut {
                    0% { opacity: 0; transform: translateY(-10px); }
                    10% { opacity: 1; transform: translateY(0); }
                    90% { opacity: 1; transform: translateY(0); }
                    100% { opacity: 0; transform: translateY(-10px); }
                }
            `}</style>
        </div>
    );
}
