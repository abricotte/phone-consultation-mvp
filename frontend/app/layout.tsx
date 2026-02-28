import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ConsultPhone - Consultations téléphoniques",
  description: "Plateforme de consultations téléphoniques payées à la minute",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body className="min-h-screen bg-gray-50">
        <nav className="bg-white shadow-sm border-b">
          <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
            <a href="/" className="text-xl font-bold text-blue-600">
              ConsultPhone
            </a>
            <div className="flex gap-4 text-sm">
              <a href="/consultants" className="text-gray-600 hover:text-blue-600">
                Consultants
              </a>
              <a href="/dashboard" className="text-gray-600 hover:text-blue-600">
                Tableau de bord
              </a>
              <a href="/login" className="text-gray-600 hover:text-blue-600">
                Connexion
              </a>
            </div>
          </div>
        </nav>
        <main>{children}</main>
      </body>
    </html>
  );
}
