"use client";

import { useState } from "react";

const NAV_LINKS = [
  { href: "/#formules", label: "Formules" },
  { href: "/consultation-minute", label: "Appeler maintenant" },
  { href: "/dashboard", label: "Mon espace" },
];

export default function SiteHeader() {
  const [ouvert, setOuvert] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-greige/60 bg-cream/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
        <a href="/" className="flex items-center gap-2.5">
          <span aria-hidden className="text-2xl leading-none text-aubergine/40">
            ✦
          </span>
          <span className="font-serif text-2xl font-semibold tracking-wide text-aubergine">
            Elena&nbsp;Wolska
          </span>
        </a>

        {/* Navigation desktop/tablette */}
        <nav className="hidden items-center gap-6 text-sm sm:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-mention transition hover:text-cta"
            >
              {link.label}
            </a>
          ))}
          <a
            href="/login"
            className="rounded-full bg-cta px-5 py-2 font-medium text-cta-text shadow-card transition hover:bg-cta-dark"
          >
            Connexion
          </a>
        </nav>

        {/* Bouton hamburger — mobile uniquement */}
        <button
          type="button"
          onClick={() => setOuvert((v) => !v)}
          aria-label={ouvert ? "Fermer le menu" : "Ouvrir le menu"}
          aria-expanded={ouvert}
          className="flex h-11 w-11 items-center justify-center rounded-full text-aubergine transition hover:bg-ivory sm:hidden"
        >
          {ouvert ? (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M6 6L18 18M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          ) : (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M4 7H20M4 12H20M4 17H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          )}
        </button>
      </div>

      {/* Menu mobile déroulant */}
      {ouvert && (
        <nav className="border-t border-greige/60 bg-cream px-5 py-4 sm:hidden">
          <ul className="flex flex-col gap-1">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  onClick={() => setOuvert(false)}
                  className="block rounded-lg px-3 py-3 text-base text-mention transition hover:bg-ivory hover:text-cta"
                >
                  {link.label}
                </a>
              </li>
            ))}
            <li className="mt-2">
              <a
                href="/login"
                onClick={() => setOuvert(false)}
                className="block rounded-full bg-cta px-5 py-3 text-center font-medium text-cta-text shadow-card transition hover:bg-cta-dark"
              >
                Connexion
              </a>
            </li>
          </ul>
        </nav>
      )}
    </header>
  );
}
