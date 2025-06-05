import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-ivory-50 to-pink-50 flex flex-col items-center justify-center text-center px-4">
      <Head>
        <title>Wedding Invitation Platform</title>
        <meta name="description" content="Welcome to our wedding invitation platform. Create and view beautiful digital invitations." />
      </Head>
      <div className="relative z-10">
        <h1 className="text-4xl md:text-5xl font-extrabold text-rose-700 mb-6 tracking-tight">
          Welcome to Our Wedding Invitation Platform
        </h1>
        <p className="text-lg md:text-xl text-neutral-800 mb-8 max-w-2xl">
          Create and share beautiful digital wedding invitations with your loved ones. Explore existing invitations or manage your own through our CMS.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/cms">
            <button className="bg-rose-500 text-white py-3 px-6 rounded-lg hover:bg-rose-600 transition-colors duration-300 font-medium">
              Go to CMS
            </button>
          </Link>
          <Link href="/invites">
            <button className="bg-amber-500 text-white py-3 px-6 rounded-lg hover:bg-amber-600 transition-colors duration-300 font-medium">
              View Invitations
            </button>
          </Link>
        </div>
      </div>
      <div className="absolute top-0 left-0 z-0" data-aos="fade-down" data-aos-delay="100">
        <Image
          src="/images/top.png"
          alt="Decorative Top"
          width={150}
          height={150}
          className="object-contain"
          style={{ width: 'auto', height: 'auto' }}
        />
      </div>
      <div className="absolute bottom-0 right-0 z-0" data-aos="fade-up" data-aos-delay="100">
        <Image
          src="/images/footer.png"
          alt="Decorative Footer"
          width={150}
          height={100}
          className="object-contain"
          style={{ width: 'auto', height: 'auto' }}
        />
      </div>
    </div>
  );
}
