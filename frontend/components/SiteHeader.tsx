"use client";

import { useState } from "react";

// Navigation cliente volontairement réduite à deux gestes : retrouver
// son espace, ou consulter. Le cabinet praticienne n'y figure JAMAIS —
// il vit sur une URL non référencée, protégée par le rôle.
const NAV_LINKS = [{ href: "/#formules", label: "Formules" }];

export default function SiteHeader() {
  const [ouvert, setOuvert] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-greige/60 bg-cream/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
        {/* Le logo du site officiel — même image que sur elena-wolska.com,
            pour que le passage vers l'espace ne ressemble pas à un
            changement de maison. */}
        <a href="/" className="flex items-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/elena-wolska-logo.png"
            alt="Elena Wolska"
            width={280}
            height={100}
            className="h-14 w-auto sm:h-16"
          />
        </a>

        {/* Navigation desktop/tablette */}
        <nav className="hidden items-center gap-3 text-sm sm:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="mr-2 text-mention transition hover:text-cta"
            >
              {link.label}
            </a>
          ))}
          <a
            href="/dashboard"
            className="rounded-full bg-aubergine px-5 py-2 font-medium text-cream transition hover:bg-aubergine/90"
          >
            Mon espace
          </a>
          <a
            href="/consultation-minute"
            className="rounded-full bg-cta px-5 py-2 font-medium text-cta-text shadow-card transition hover:bg-cta-dark"
          >
            Consulter Elena
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
                href="/dashboard"
                onClick={() => setOuvert(false)}
                className="block rounded-full bg-aubergine px-5 py-3 text-center font-medium text-cream transition hover:bg-aubergine/90"
              >
                Mon espace
              </a>
            </li>
            <li className="mt-2">
              <a
                href="/consultation-minute"
                onClick={() => setOuvert(false)}
                className="block rounded-full bg-cta px-5 py-3 text-center font-medium text-cta-text shadow-card transition hover:bg-cta-dark"
              >
                Consulter Elena
              </a>
            </li>
          </ul>
        </nav>
      )}
    </header>
  );
}
