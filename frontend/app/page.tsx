export default function Home() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-16 text-center">
      <h1 className="text-4xl font-bold text-gray-900 mb-4">
        Consultations téléphoniques d&apos;experts
      </h1>
      <p className="text-lg text-gray-600 mb-8">
        Parlez à des experts qualifiés, payez uniquement à la minute.
        Rechargez votre compte et appelez quand vous voulez.
      </p>
      <div className="flex gap-4 justify-center">
        <a
          href="/consultants"
          className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700"
        >
          Voir les consultants
        </a>
        <a
          href="/register"
          className="border border-blue-600 text-blue-600 px-6 py-3 rounded-lg font-medium hover:bg-blue-50"
        >
          Créer un compte
        </a>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
        <div className="p-6 bg-white rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold mb-2">1. Inscrivez-vous</h3>
          <p className="text-gray-600">
            Créez votre compte en quelques secondes
          </p>
        </div>
        <div className="p-6 bg-white rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold mb-2">2. Rechargez</h3>
          <p className="text-gray-600">
            Ajoutez du crédit à votre portefeuille
          </p>
        </div>
        <div className="p-6 bg-white rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold mb-2">3. Appelez</h3>
          <p className="text-gray-600">
            Choisissez un expert et lancez votre consultation
          </p>
        </div>
      </div>
    </div>
  );
}
