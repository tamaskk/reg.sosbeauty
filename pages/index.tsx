import Head from 'next/head';
import RegisztraciosForm from '../components/forms/RegisztraciosForm';

export default function Home() {
  return (
    <>
      <Head>
        <title>SOS Beauty - Szépségipari Szolgáltató Regisztráció</title>
        <meta name="description" content="Regisztráld szépségipari szolgáltatásod az SOS Beauty-nél" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              SOS Beauty
            </h1>
            <p className="text-xl text-gray-600">
              Regisztráld szépségipari szolgáltatásod és érj el több ügyfelet
            </p>
          </div>

          <RegisztraciosForm />
        </div>
      </main>
    </>
  );
}
