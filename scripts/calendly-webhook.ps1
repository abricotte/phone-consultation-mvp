# ============================================================
# Creation de l'abonnement webhook Calendly - en une fois.
#
# Ce script demande le jeton et la cle de signature au clavier :
# ils ne sont ni ecrits sur le disque, ni affiches a l'ecran,
# ni transmis ailleurs qu'a Calendly.
#
# NOTE : volontairement SANS accents ni tirets typographiques.
# Windows PowerShell 5.1 lit les scripts en ANSI s'ils n'ont pas
# de BOM : un tiret long mal decode devient un guillemet fermant
# et casse la syntaxe. Version precedente illisible pour cette
# raison exacte.
#
# Usage :  powershell -ExecutionPolicy Bypass -File .\scripts\calendly-webhook.ps1
# ============================================================

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "=== Abonnement webhook Calendly ===" -ForegroundColor Cyan
Write-Host ""

# --- 1. Les deux secrets, saisis en aveugle -------------------
$jetonSecurise = Read-Host "Colle ton jeton Calendly (rien ne s'affiche, c'est normal)" -AsSecureString
$jeton = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto(
  [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($jetonSecurise))

$cleSecurisee = Read-Host "Colle ta cle de signature (celle mise dans Railway)" -AsSecureString
$cle = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto(
  [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($cleSecurisee))

if (-not $jeton -or -not $cle) {
  Write-Host "Jeton ou cle vide - on arrete la, rien n'a ete envoye." -ForegroundColor Red
  exit 1
}

$entetes = @{ Authorization = "Bearer $jeton" }

# Diagnostic SANS exposer le secret : sa longueur et son debut suffisent
# a savoir s'il a ete colle en entier. Un jeton Calendly est un JWT de
# plusieurs centaines de caracteres commencant par "eyJ" ; un terminal
# qui tronque un collage long est une cause frequente de 401.
Write-Host ""
Write-Host ("  Jeton recu : " + $jeton.Length + " caracteres, commence par '" + $jeton.Substring(0, [Math]::Min(3, $jeton.Length)) + "'") -ForegroundColor Gray
Write-Host ("  Cle recue  : " + $cle.Length + " caracteres") -ForegroundColor Gray
if ($jeton.Length -lt 100) {
  Write-Host "  ATTENTION : ce jeton parait trop court pour un jeton Calendly." -ForegroundColor Yellow
}
if (-not $jeton.StartsWith("eyJ")) {
  Write-Host "  ATTENTION : un jeton d'acces personnel Calendly commence par 'eyJ'." -ForegroundColor Yellow
  Write-Host "              Ce n'est peut-etre pas le bon element copie." -ForegroundColor Yellow
}

# --- 2. Qui es-tu pour Calendly ? -----------------------------
Write-Host ""
Write-Host "Interrogation de Calendly..." -ForegroundColor Gray
try {
  $moi = (Invoke-RestMethod -Uri "https://api.calendly.com/users/me" -Headers $entetes).resource
} catch {
  Write-Host ""
  # Ce que Calendly repond VRAIMENT, plutot qu'une supposition
  $code = $null
  try { $code = [int]$_.Exception.Response.StatusCode } catch {}
  Write-Host ("Calendly a refuse. Code HTTP : " + $(if ($code) { $code } else { "inconnu" })) -ForegroundColor Red
  try {
    $flux = $_.Exception.Response.GetResponseStream()
    $lecteur = New-Object System.IO.StreamReader($flux)
    $detail = $lecteur.ReadToEnd()
    if ($detail) { Write-Host ("Reponse de Calendly : " + $detail) -ForegroundColor Red }
  } catch {}
  Write-Host ""
  if ($code -eq 401) {
    Write-Host "401 = jeton invalide, expire, ou incomplet." -ForegroundColor Yellow
    Write-Host "  Regenere-en un : calendly.com > Integrations > API and webhooks" -ForegroundColor Yellow
    Write-Host "  > Personal access tokens > Generate new token" -ForegroundColor Yellow
  } elseif ($code -eq 403) {
    Write-Host "403 = le jeton est valide mais n'a pas les droits necessaires." -ForegroundColor Yellow
  }
  exit 1
}

Write-Host ("  Compte       : " + $moi.name) -ForegroundColor Green
Write-Host ("  Utilisateur  : " + $moi.uri)
Write-Host ("  Organisation : " + $moi.current_organization)

# --- 3. L'abonnement existe-t-il deja ? -----------------------
$URL_WEBHOOK = "https://phone-consultation-mvp-production.up.railway.app/api/calendly/webhook"

$urlListe = "https://api.calendly.com/webhook_subscriptions?organization=" + $moi.current_organization + "`&scope=user`&user=" + $moi.uri
$existants = Invoke-RestMethod -Uri $urlListe -Headers $entetes
$deja = $existants.collection | Where-Object { $_.callback_url -eq $URL_WEBHOOK -and $_.state -eq "active" }
if ($deja) {
  Write-Host ""
  Write-Host "Un abonnement ACTIF existe deja vers cette adresse - rien a creer." -ForegroundColor Yellow
  Write-Host ("  " + $deja.uri)
  exit 0
}

# --- 4. Creation ----------------------------------------------
$corps = @{
  url          = $URL_WEBHOOK
  events       = @("invitee.created", "invitee.canceled")
  organization = $moi.current_organization
  user         = $moi.uri
  scope        = "user"
  signing_key  = $cle
} | ConvertTo-Json

Write-Host ""
Write-Host "Creation de l'abonnement..." -ForegroundColor Gray
try {
  $reponse = Invoke-RestMethod -Method Post -Uri "https://api.calendly.com/webhook_subscriptions" `
    -Headers ($entetes + @{ "Content-Type" = "application/json" }) -Body $corps
} catch {
  Write-Host ""
  Write-Host "Echec de la creation :" -ForegroundColor Red
  # Le detail de l'erreur Calendly, sans jamais afficher les secrets
  try {
    $flux = $_.Exception.Response.GetResponseStream()
    $lecteur = New-Object System.IO.StreamReader($flux)
    Write-Host ("  " + $lecteur.ReadToEnd()) -ForegroundColor Red
  } catch { Write-Host ("  " + $_.Exception.Message) -ForegroundColor Red }
  exit 1
}

Write-Host ""
if ($reponse.resource.state -eq "active") {
  Write-Host "=== C'EST EN PLACE ===" -ForegroundColor Green
  Write-Host ("  Etat : " + $reponse.resource.state)
  Write-Host ("  Vers : " + $reponse.resource.callback_url)
  Write-Host ""
  Write-Host "Test reel : reserve un creneau sur ton propre agenda Calendly,"
  Write-Host "puis regarde 'Mes rendez-vous du jour' dans ton cabinet."
} else {
  Write-Host ("Reponse inattendue - etat : " + $reponse.resource.state) -ForegroundColor Yellow
}
